package com.koreanwithme.backend.service;

import com.koreanwithme.backend.dto.TopikDtos.QuestionDto;
import com.koreanwithme.backend.entity.TopikQuestion;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExcelService {

    private final DataFormatter dataFormatter = new DataFormatter();

    public List<QuestionDto> parseQuestionsFromExcel(MultipartFile file) {
        List<QuestionDto> questions = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                throw new RuntimeException("File Excel không có trang tính (Sheet) nào!");
            }

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                String qText = getCellValue(row, 4);
                if (qText.isEmpty()) continue;

                // 1. Số câu
                String numStr = getCellValue(row, 0);
                int qNum = numStr.isEmpty() ? r : (int) Double.parseDouble(numStr);

                // 2. Phần thi
                String secStr = getCellValue(row, 1).toUpperCase();
                TopikQuestion.Section section = TopikQuestion.Section.READING;
                if (secStr.contains("LISTEN") || secStr.contains("NGHE") || secStr.contains("듣기")) {
                    section = TopikQuestion.Section.LISTENING;
                } else if (secStr.contains("WRITE") || secStr.contains("VIẾT") || secStr.contains("쓰기")) {
                    section = TopikQuestion.Section.WRITING;
                }

                // 3. Dạng câu
                String typeStr = getCellValue(row, 2).toUpperCase();
                TopikQuestion.QuestionType qType = TopikQuestion.QuestionType.MULTIPLE_CHOICE;
                if (typeStr.contains("SHORT") || typeStr.contains("DIEN")) {
                    qType = TopikQuestion.QuestionType.SHORT_WRITING;
                } else if (typeStr.contains("ESSAY") || typeStr.contains("VAN") || typeStr.contains("LUAN")) {
                    qType = TopikQuestion.QuestionType.ESSAY;
                }

                // Nếu là câu 51-54 thì tự động set section WRITING nếu người dùng quên
                if (qNum >= 51 && qNum <= 54 && section == TopikQuestion.Section.READING) {
                    section = TopikQuestion.Section.WRITING;
                    if (qNum <= 52) qType = TopikQuestion.QuestionType.SHORT_WRITING;
                    else qType = TopikQuestion.QuestionType.ESSAY;
                }

                String passage = getCellValue(row, 3);
                String opt1 = getCellValue(row, 5);
                String opt2 = getCellValue(row, 6);
                String opt3 = getCellValue(row, 7);
                String opt4 = getCellValue(row, 8);

                String correctOpt = getCellValue(row, 9);
                if (correctOpt.endsWith(".0")) {
                    correctOpt = correctOpt.substring(0, correctOpt.length() - 2);
                }

                String scoreStr = getCellValue(row, 10);
                BigDecimal score = new BigDecimal("2.0");
                if (!scoreStr.isEmpty()) {
                    try {
                        score = new BigDecimal(scoreStr);
                    } catch (Exception ignored) {}
                }

                String explanation = getCellValue(row, 11);

                questions.add(QuestionDto.builder()
                        .questionNum(qNum)
                        .section(section)
                        .questionType(qType)
                        .passage(passage.isEmpty() ? null : passage)
                        .questionText(qText)
                        .option1(opt1.isEmpty() ? null : opt1)
                        .option2(opt2.isEmpty() ? null : opt2)
                        .option3(opt3.isEmpty() ? null : opt3)
                        .option4(opt4.isEmpty() ? null : opt4)
                        .correctOption(correctOpt.isEmpty() ? null : correctOpt)
                        .score(score)
                        .explanation(explanation.isEmpty() ? null : explanation)
                        .build());
            }

        } catch (Exception e) {
            throw new RuntimeException("Lỗi cấu trúc file Excel: " + e.getMessage(), e);
        }

        return questions;
    }

    /**
     * Tạo file mẫu Excel có sẵn các dòng ví dụ cho cả Trắc nghiệm & 4 câu Viết TOPIK II
     */
    public byte[] generateQuestionTemplate(String level) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("TOPIK_Questions_Template");

            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            font.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.ROSE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            String[] columns = {
                    "Số câu (Num)", "Phần (LISTENING/READING/WRITING)",
                    "Dạng (MULTIPLE_CHOICE/SHORT_WRITING/ESSAY)",
                    "Đoạn văn đọc chung (Passage)", "Nội dung câu hỏi (Question Text)",
                    "Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4",
                    "Đáp án đúng (Hoặc bài mẫu)", "Điểm (Score)", "Giải thích tóm tắt"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Dòng 1: Trắc nghiệm Nghe
            Row row1 = sheet.createRow(1);
            row1.createCell(0).setCellValue(1);
            row1.createCell(1).setCellValue("LISTENING");
            row1.createCell(2).setCellValue("MULTIPLE_CHOICE");
            row1.createCell(3).setCellValue("");
            row1.createCell(4).setCellValue("다음을 듣고 가장 알맞은 그림을 고르십시오.");
            row1.createCell(5).setCellValue("남자가 책을 읽고 있습니다.");
            row1.createCell(6).setCellValue("여자가 전화를 받고 있습니다.");
            row1.createCell(7).setCellValue("남자가 청소를 하고 있습니다.");
            row1.createCell(8).setCellValue("여자가 음식을 만들고 있습니다.");
            row1.createCell(9).setCellValue("3");
            row1.createCell(10).setCellValue(2.0);
            row1.createCell(11).setCellValue("Nghe hội thoại về việc dọn dẹp phòng.");

            // Dòng 2: TOPIK II - Câu 51 (Điền từ email)
            Row row2 = sheet.createRow(2);
            row2.createCell(0).setCellValue(51);
            row2.createCell(1).setCellValue("WRITING");
            row2.createCell(2).setCellValue("SHORT_WRITING");
            row2.createCell(3).setCellValue("수미 씨, 지난번에 빌려준 책 정말 고마웠어요. 책을 다 읽어서 돌려드리려고 하는데 내일 시간 ( ㉠ )? 혹시 시간이 안 되시면 다음 주에 ( ㉡ ).");
            row2.createCell(4).setCellValue("다음 글을 읽고 ( ㉠ )과 ( ㉡ )에 들어갈 말을 각각 한 문장으로 쓰십시오.");
            row2.createCell(9).setCellValue("㉠ 괜찮으십니까 / 있으십니까\n㉡ 만나도 괜찮습니다 / 찾아뵙겠습니다");
            row2.createCell(10).setCellValue(10.0);
            row2.createCell(11).setCellValue("Sử dụng đuôi câu kính ngữ trang trọng thể văn viết hoặc giao tiếp lịch sự.");

            // Dòng 3: TOPIK II - Câu 53 (Mô tả biểu đồ 200 - 300 chữ)
            Row row3 = sheet.createRow(3);
            row3.createCell(0).setCellValue(53);
            row3.createCell(1).setCellValue("WRITING");
            row3.createCell(2).setCellValue("ESSAY");
            row3.createCell(3).setCellValue("조사기관: 인주시 복지센터 / 주제: 60세 이상 노인들의 여가 활동");
            row3.createCell(4).setCellValue("다음을 참고하여 '노인들의 여가 활동'에 대해 200~300자로 글을 쓰십시오.");
            row3.createCell(9).setCellValue("인주시 복지센터에서 60세 이상 노인들을 대상으로 여가 활동에 대해 조사한 결과에 따르면...");
            row3.createCell(10).setCellValue(30.0);
            row3.createCell(11).setCellValue("Tiêu chí: Viết đúng 200-300 chữ, dùng đúng đuôi câu văn viết (-ㄴ/는다), không dùng kính ngữ cá nhân.");

            // Dòng 4: TOPIK II - Câu 54 (Nghị luận xã hội 600 - 700 chữ)
            Row row4 = sheet.createRow(4);
            row4.createCell(0).setCellValue(54);
            row4.createCell(1).setCellValue("WRITING");
            row4.createCell(2).setCellValue("ESSAY");
            row4.createCell(3).setCellValue("우리는 살면서 많은 선택을 하게 됩니다. 어떤 선택은 우리 삶에 큰 영향을 미치기도 합니다.");
            row4.createCell(4).setCellValue("다음 내용을 중심으로 '올바른 선택을 하는 방법'에 대해 600~700자로 글을 쓰십시오.\n1. 우리는 살면서 왜 선택을 해야 하는가?\n2. 잘못된 선택을 했을 때 어떤 문제가 발생하는가?\n3. 올바른 선택을 하기 위해 어떤 노력이 필요한가?");
            row4.createCell(9).setCellValue("[Bài viết mẫu 600-700 chữ với cấu trúc 3 phần: Mở bài - Thân bài (trả lời 3 câu hỏi) - Kết bài]");
            row4.createCell(10).setCellValue(50.0);
            row4.createCell(11).setCellValue("Tiêu chí: Đủ 3 đoạn, dùng cấu trúc liên kết cao cấp, không sai chính tả và cách chữ.");

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo template Excel: " + e.getMessage());
        }
    }

    private String getCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        return dataFormatter.formatCellValue(cell).trim();
    }
}