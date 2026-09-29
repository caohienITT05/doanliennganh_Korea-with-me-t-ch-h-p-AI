package com.koreanwithme.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koreanwithme.backend.dto.TopikDtos.QuestionDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    // Danh sách các model chính thức của Gemini 3.x xếp theo độ dồi dào tài nguyên
    // gemini-3.5-flash-lite là model tải cao, chuyên xử lý tài liệu PDF không bị nghẽn 503
    private final List<String> STABLE_MODELS = Arrays.asList(
            "models/gemini-3.5-flash-lite",
            "models/gemini-3.5-flash",
            "models/gemini-3.6-flash",
            "models/gemini-3.8-flash"
    );

    public List<QuestionDto> extractQuestionsFromPdf(MultipartFile pdfFile, String level, String sectionFilter) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty() || geminiApiKey.contains("YOUR_GEMINI_API_KEY")) {
            throw new RuntimeException("Chưa cấu hình API Key hợp lệ trong application.properties!");
        }

        try {
            byte[] fileBytes = pdfFile.getBytes();
            String base64Pdf = Base64.getEncoder().encodeToString(fileBytes);

            String scopeConstraint = "";
            if ("LISTENING".equalsIgnoreCase(sectionFilter)) {
                scopeConstraint = "Focus ONLY on the LISTENING section (듣기: Questions 1 to 30).\n";
            } else if ("READING".equalsIgnoreCase(sectionFilter)) {
                scopeConstraint = "Focus ONLY on the READING section (읽기: Questions 31 to 70).\n";
            }

            String promptText = scopeConstraint + "Analyze this Korean TOPIK (" + level + ") exam PDF.\n"
                    + "Extract ALL questions into a strict JSON object with a single root key 'questions'.\n"
                    + "Each item must have these exact fields:\n"
                    + "{\n"
                    + "  \"questions\": [\n"
                    + "    {\n"
                    + "      \"questionNum\": 1,\n"
                    + "      \"section\": \"LISTENING\",\n"
                    + "      \"questionType\": \"MULTIPLE_CHOICE\",\n"
                    + "      \"passage\": null,\n"
                    + "      \"questionText\": \"Korean question text\",\n"
                    + "      \"option1\": \"Option 1 text\",\n"
                    + "      \"option2\": \"Option 2 text\",\n"
                    + "      \"option3\": \"Option 3 text\",\n"
                    + "      \"option4\": \"Option 4 text\",\n"
                    + "      \"correctOption\": \"1\",\n"
                    + "      \"score\": 4.0\n"
                    + "    }\n"
                    + "  ]\n"
                    + "}\n"
                    + "CRITICAL: Do NOT write conversational intros. Return raw valid JSON only.";

            // 1. Chuẩn bị nội dung PDF và Prompt
            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("mimeType", "application/pdf");
            inlineData.put("data", base64Pdf);

            Map<String, Object> part1 = new HashMap<>();
            part1.put("inlineData", inlineData);

            Map<String, Object> part2 = new HashMap<>();
            part2.put("text", promptText);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", Arrays.asList(part1, part2));

            // 2. Cấu hình generationConfig tối ưu (giảm temperature để sinh nhanh và ít tốn GPU)
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("responseMimeType", "application/json");
            generationConfig.put("maxOutputTokens", 8192);
            generationConfig.put("temperature", 0.1);

            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("contents", Collections.singletonList(content));
            requestPayload.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", geminiApiKey.trim());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);

            Exception lastException = null;

            // 3. Cơ chế luân phiên model: Nếu model đầu bị 503, tự động chuyển ngay sang model tiếp theo
            for (String modelName : STABLE_MODELS) {
                String targetUrl = "https://generativelanguage.googleapis.com/v1beta/" + modelName + ":generateContent";
                try {
                    System.out.println("Đang gửi yêu cầu bóc tách PDF tới: " + modelName);
                    ResponseEntity<String> response = restTemplate.postForEntity(targetUrl, entity, String.class);

                    if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                        return parseResponse(response.getBody());
                    }
                } catch (HttpServerErrorException.ServiceUnavailable ex) {
                    System.err.println("Model " + modelName + " đang chịu tải cao (503). Tự động chuyển sang model dự phòng tiếp theo...");
                    lastException = ex;
                    try {
                        Thread.sleep(1000); // Tạm dừng 1 giây để phân tán request
                    } catch (InterruptedException ignored) {}
                } catch (HttpClientErrorException ex) {
                    lastException = ex;
                    // Nếu model không tồn tại (404), tiếp tục thử model khác
                    if (ex.getStatusCode() != HttpStatus.NOT_FOUND) {
                        throw ex;
                    }
                }
            }

            if (lastException != null) {
                throw lastException;
            }
            throw new RuntimeException("Tất cả máy chủ Gemini hiện đang bận, vui lòng thử lại sau giây lát.");

        } catch (HttpClientErrorException.TooManyRequests e) {
            throw new RuntimeException("API Key của bạn đã đạt giới hạn gọi trong 1 phút của Google. Vui lòng thử lại sau 30-45 giây!");
        } catch (Exception e) {
            throw new RuntimeException("Lỗi xử lý PDF từ Gemini: " + e.getMessage(), e);
        }
    }

    private List<QuestionDto> parseResponse(String jsonString) throws Exception {
        JsonNode rootNode = objectMapper.readTree(jsonString);
        JsonNode candidates = rootNode.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new RuntimeException("Gemini không trả về kết quả.");
        }

        JsonNode candidate = candidates.get(0);
        String text = candidate.path("content").path("parts").get(0).path("text").asText().trim();

        if (text.startsWith("```json")) {
            text = text.substring(7);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }
        text = text.trim();

        JsonNode parsed = objectMapper.readTree(text);
        if (parsed.isObject()) {
            if (parsed.has("questions") && parsed.get("questions").isArray()) {
                return objectMapper.convertValue(parsed.get("questions"), new TypeReference<List<QuestionDto>>() {});
            }
            if (parsed.has("exam") && parsed.get("exam").isArray()) {
                return objectMapper.convertValue(parsed.get("exam"), new TypeReference<List<QuestionDto>>() {});
            }
        } else if (parsed.isArray()) {
            return objectMapper.convertValue(parsed, new TypeReference<List<QuestionDto>>() {});
        }

        throw new RuntimeException("Không tìm thấy danh sách câu hỏi trong phản hồi của Gemini.");
    }
    /**
     * Dùng Gemini chấm điểm phần Viết TOPIK II (Câu 51 - 54) theo barem chuẩn
     */
    public String gradeWritingSection(String examTitle, Map<String, String> writingAnswersWithQuestions) {
        try {
            StringBuilder sb = new StringBuilder();
            sb.append("Bạn là giám khảo chấm thi viết TOPIK II chuyên nghiệp của NIIED.\n");
            sb.append("Hãy chấm điểm các câu viết sau dựa theo barem chuẩn:\n");
            sb.append("- Câu 51, 52: Tối đa 10 điểm/câu (Đúng ngữ cảnh, đúng ngữ pháp kết bài kính ngữ).\n");
            sb.append("- Câu 53: Tối đa 30 điểm (Viết 200-300 chữ, dùng đuôi -ㄴ/는다, mô tả đúng số liệu biểu đồ).\n");
            sb.append("- Câu 54: Tối đa 50 điểm (Viết 600-700 chữ, chia 3 đoạn rõ ràng, lập luận logic, từ vựng cao cấp).\n\n");
            sb.append("Dữ liệu bài làm của học viên:\n");

            writingAnswersWithQuestions.forEach((qNum, content) -> {
                sb.append("--- Câu ").append(qNum).append(" ---\n").append(content).append("\n\n");
            });

            sb.append("YÊU CẦU ĐẦU RA:\n");
            sb.append("Trả về định dạng JSON thuần túy có cấu trúc:\n");
            sb.append("{\n");
            sb.append("  \"totalWritingScore\": 0.0,\n");
            sb.append("  \"feedback\": [\n");
            sb.append("    {\n");
            sb.append("      \"questionNum\": 51,\n");
            sb.append("      \"score\": 0.0,\n");
            sb.append("      \"comment\": \"Nhận xét lỗi ngữ pháp, từ vựng và gợi ý câu chuẩn\"\n");
            sb.append("    }\n");
            sb.append("  ]\n");
            sb.append("}");

            Map<String, Object> part = Collections.singletonMap("text", sb.toString());
            Map<String, Object> content = Collections.singletonMap("parts", Collections.singletonList(part));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("responseMimeType", "application/json");
            generationConfig.put("temperature", 0.2);

            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("contents", Collections.singletonList(content));
            requestPayload.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", geminiApiKey.trim());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            }
        } catch (Exception e) {
            System.err.println("Lỗi AI chấm viết: " + e.getMessage());
        }
        return "{\"totalWritingScore\": 0.0, \"feedback\": []}";
    }
    /**
     * Dùng Gemini AI phân tích chuyên sâu 1 câu hỏi TOPIK theo yêu cầu của học viên
     */
    public String explainSingleQuestion(com.koreanwithme.backend.entity.TopikQuestion q, String studentAnswer) {
        try {
            String prompt = "Bạn là chuyên gia giảng dạy tiếng Hàn và luyện thi TOPIK hàng đầu.\n"
                    + "Hãy giải thích chi tiết câu hỏi sau bằng tiếng Việt cho học viên:\n\n"
                    + (q.getPassage() != null ? "【ĐOẠN VĂN / NGỮ CẢNH】:\n" + q.getPassage() + "\n\n" : "")
                    + "【CÂU HỎI】: " + q.getQuestionText() + "\n"
                    + "1. " + q.getOption1() + "\n"
                    + "2. " + q.getOption2() + "\n"
                    + "3. " + q.getOption3() + "\n"
                    + "4. " + q.getOption4() + "\n"
                    + "Đáp án đúng: " + q.getCorrectOption() + "\n"
                    + "Lựa chọn của học viên: " + (studentAnswer != null ? studentAnswer : "Không chọn") + "\n\n"
                    + "YÊU CẦU TRÌNH BÀY (Dùng định dạng rõ ràng, ngắn gọn, gạch đầu dòng):\n"
                    + "1.Dịch nghĩa: Dịch câu hỏi và 4 lựa chọn sang tiếng Việt.\n"
                    + "2.Tại sao đáp án đúng: Giải thích ngữ pháp/từ vựng cốt lõi chứng minh đáp án đúng.\n"
                    + "3.Phân tích bẫy sai: Nếu học viên chọn sai (hoặc chưa chọn), chỉ rõ tại sao phương án của họ không phù hợp.\n"
                    + "4. ừ vựng & Ngữ pháp cần nhớ: Liệt kê 2-3 từ vựng/cấu trúc ngữ pháp đắt giá nhất trong câu.";

            Map<String, Object> part = Collections.singletonMap("text", prompt);
            Map<String, Object> content = Collections.singletonMap("parts", Collections.singletonList(part));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.2);

            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("contents", Collections.singletonList(content));
            requestPayload.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", geminiApiKey.trim());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            }
        } catch (Exception e) {
            System.err.println("Lỗi gọi Gemini phân tích câu: " + e.getMessage());
            return "Trợ lý AI đang bận xử lý, vui lòng nhấn lại sau giây lát! (Chi tiết: " + e.getMessage() + ")";
        }
        return "Không có dữ liệu phản hồi từ AI.";
    }
    /**
     * Trợ lý AI Tiếng Hàn chuyên sâu: Tra từ, giải thích ngữ pháp và tư vấn lộ trình học
     */
    public String chatWithAssistant(String userMessage, List<com.koreanwithme.backend.dto.ChatDtos.ChatMessage> history) {
        try {
            String systemInstruction = "Bạn là Trợ lý AI Tiếng Hàn (Korean with Me AI Coach) - một giáo viên tiếng Hàn bản ngữ thân thiện, nhiệt tình và chuyên nghiệp.\n"
                    + "Nhiệm vụ trọng tâm của bạn gồm 3 việc:\n"
                    + "1. TRA TỪ ĐIỂN: Cung cấp nghĩa tiếng Việt chính xác, từ loại, phiên âm/phát âm, ví dụ câu thực tế kèm dịch nghĩa, từ đồng nghĩa hoặc trái nghĩa nếu có.\n"
                    + "2. TRA NGỮ PHÁP: Giải thích quy tắc kết hợp (với V/A có/không có batchim), ý nghĩa ngữ cảnh, ví dụ song ngữ Hàn - Việt, mẹo tránh nhầm lẫn hoặc so sánh chi tiết nếu người dùng hỏi phân biệt.\n"
                    + "3. XÂY DỰNG LỘ TRÌNH: Tư vấn lộ trình chi tiết theo từng giai đoạn (Bảng chữ cái Hangeul -> Sơ cấp 1 -> Sơ cấp 2 -> Ôn thi TOPIK), gợi ý phân bổ thời gian học mỗi ngày và tài liệu phù hợp.\n\n"
                    + "QUY TẮC PHẢN HỒI:\n"
                    + "- Trình bày bằng tiếng Việt rõ ràng, dùng bullet point, in đậm từ khóa quan trọng.\n"
                    + "- Với câu tiếng Hàn luôn có bản dịch tiếng Việt đi kèm.\n"
                    + "- Giữ thái độ khích lệ, thân thiện.";

            List<Map<String, Object>> contents = new ArrayList<>();

            // 1. Thêm system prompt như lượt chat mở đầu
            Map<String, Object> systemPart = Collections.singletonMap("text", systemInstruction);
            contents.add(Map.of("role", "user", "parts", Collections.singletonList(systemPart)));
            contents.add(Map.of("role", "model", "parts", Collections.singletonList(Collections.singletonMap("text", "Xin chào! Mình là Trợ lý AI Tiếng Hàn. Mình có thể giúp gì cho bạn hôm nay: tra từ điển, giải thích ngữ pháp hay cùng bạn lập lộ trình học tập?"))));

            // 2. Thêm lịch sử hội thoại gần nhất (nếu có)
            if (history != null) {
                for (com.koreanwithme.backend.dto.ChatDtos.ChatMessage msg : history) {
                    contents.add(Map.of(
                            "role", "model".equalsIgnoreCase(msg.getRole()) ? "model" : "user",
                            "parts", Collections.singletonList(Collections.singletonMap("text", msg.getContent()))
                    ));
                }
            }

            // 3. Lượt hỏi hiện tại của người dùng
            contents.add(Map.of(
                    "role", "user",
                    "parts", Collections.singletonList(Collections.singletonMap("text", userMessage))
            ));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.5);

            Map<String, Object> requestPayload = new HashMap<>();
            requestPayload.put("contents", contents);
            requestPayload.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", geminiApiKey.trim());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            }
        } catch (Exception e) {
            System.err.println("Lỗi AI Chat: " + e.getMessage());
            return "Xin lỗi, trợ lý AI đang bận xử lý hoặc kết nối mạng gián đoạn. Bạn thử gửi lại câu hỏi nhé!";
        }
        return "Xin lỗi, hiện tại mình chưa thể đưa ra câu trả lời.";
    }
}