package com.koreanwithme.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koreanwithme.backend.dto.CourseDtos.GrammarResponse;
import com.koreanwithme.backend.dto.GrammarDtos.TranslationEvaluateRequest;
import com.koreanwithme.backend.dto.GrammarDtos.TranslationEvaluateResponse;
import com.koreanwithme.backend.entity.Grammar;
import com.koreanwithme.backend.repository.GrammarRepository;
import com.koreanwithme.backend.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/study")
@CrossOrigin(origins = "*")
public class StudyController {

    @Autowired
    private GrammarRepository grammarRepository;

    @Autowired
    private GeminiService geminiService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * API lấy chi tiết ngữ pháp theo cơ chế Fault-Tolerant Cache-Aside
     */
    @GetMapping("/grammar/{id}/detail")
    public ResponseEntity<GrammarResponse> getGrammarDetail(@PathVariable Integer id) {
        Grammar grammar = grammarRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ngữ pháp có ID: " + id));

        // LỚP 1: KIỂM TRA DATABASE (Nếu đã có dữ liệu thì trả về ngay)
        boolean isMissingData = grammar.getDefinition() == null || grammar.getDefinition().trim().isEmpty()
                || grammar.getExamplesJson() == null || grammar.getExamplesJson().trim().isEmpty()
                || grammar.getExercisesJson() == null || grammar.getExercisesJson().trim().isEmpty();

        if (isMissingData) {
            String name = grammar.getName() != null && !grammar.getName().trim().isEmpty()
                    ? grammar.getName()
                    : (grammar.getStructure() != null ? grammar.getStructure() : "Ngữ pháp tiếng Hàn");

            // LỚP 2: GỌI GEMINI AI BIÊN SOẠN TỰ ĐỘNG
            String generatedJson = geminiService.generateGrammarContent(name);

            // LỚP 3: NẾU AI THẤT BẠI HOẶC LỖI MẠNG -> KÍCH HOẠT OFFLINE FALLBACK PRESET
            if (generatedJson == null || generatedJson.trim().isEmpty()) {
                System.out.println("-> Kích hoạt bộ học liệu chuẩn Offline cho: " + name);
                generatedJson = getFallbackGrammarData(name);
            }

            // LƯU KẾT QUẢ VÀO MYSQL ĐỂ TÁI SỬ DỤNG VĨNH VIỄN
            try {
                JsonNode node = objectMapper.readTree(generatedJson);
                if (grammar.getStructure() == null || grammar.getStructure().trim().isEmpty()) {
                    grammar.setStructure(node.path("structure").asText(name));
                }
                grammar.setDefinition(node.path("definition").asText(""));
                grammar.setUsageScope(node.path("usageScope").asText(""));
                grammar.setNotes(node.path("notes").asText(""));
                grammar.setExamplesJson(node.path("examples").toString());
                grammar.setExercisesJson(node.path("exercises").toString());

                grammarRepository.save(grammar);
            } catch (Exception e) {
                System.err.println("Lỗi lưu học liệu ngữ pháp: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(GrammarResponse.builder()
                .id(grammar.getId())
                .lessonId(grammar.getLesson() != null ? grammar.getLesson().getId() : null)
                .name(grammar.getName())
                .structure(grammar.getStructure())
                .usageDesc(grammar.getUsageDesc())
                .exampleKr(grammar.getExampleKr())
                .exampleVn(grammar.getExampleVn())
                .definition(grammar.getDefinition())
                .usageScope(grammar.getUsageScope())
                .notes(grammar.getNotes())
                .examplesJson(grammar.getExamplesJson())
                .exercisesJson(grammar.getExercisesJson())
                .build());
    }

    /**
     * API học viên gửi câu dịch để AI chấm điểm
     */
    @PostMapping("/grammar/evaluate")
    public ResponseEntity<TranslationEvaluateResponse> evaluateTranslation(
            @RequestBody TranslationEvaluateRequest request) {
        if (request.getStudentTranslation() == null || request.getStudentTranslation().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(geminiService.evaluateTranslation(request));
    }

    /**
     * TẦNG CỨU SINH (Offline Fallback Presets): Tự động gán bộ bài học riêng biệt theo từng ngữ pháp
     */
    private String getFallbackGrammarData(String grammarName) {
        String key = grammarName.toLowerCase();

        // 1. Trợ từ chủ ngữ 은/는
        if (key.contains("은/는") || key.contains("은") || key.contains("는")) {
            return "{"
                    + "\"structure\": \"N + 은/는 (Có 받침 dùng 은, không có 받침 dùng 는)\","
                    + "\"definition\": \"Trợ từ đặt sau danh từ để xác định chủ ngữ của câu hoặc nhấn mạnh chủ đề được nói đến.\","
                    + "\"usageScope\": \"Đứng sau danh từ chỉ người, sự vật làm chủ ngữ; dùng khi giới thiệu bản thân hoặc so sánh đối chiếu.\","
                    + "\"notes\": \"Danh từ có phụ âm cuối (받침) đi với 은 (ví dụ: 선생님은). Danh từ không có phụ âm cuối đi với 는 (ví dụ: 저는).\","
                    + "\"examples\": ["
                    + "  {\"kr\": \"저는 베트남 사람입니다.\", \"vi\": \"Tôi là người Việt Nam.\"},"
                    + "  {\"kr\": \"이것은 책입니다.\", \"vi\": \"Cái này là quyển sách.\"},"
                    + "  {\"kr\": \"선생님은 한국 사람입니다.\", \"vi\": \"Thầy giáo là người Hàn Quốc.\"},"
                    + "  {\"kr\": \"제 이름은 민수입니다.\", \"vi\": \"Tên tôi là Min-su.\"},"
                    + "  {\"kr\": \"오늘은 날씨가 좋습니다.\", \"vi\": \"Hôm nay thời tiết rất đẹp.\"},"
                    + "  {\"kr\": \"수진 씨는 학생입니다.\", \"vi\": \"Bạn Sujin là học sinh.\"}"
                    + "],"
                    + "\"exercises\": {"
                    + "  \"korToVie\": ["
                    + "    {\"id\": 1, \"source\": \"저는 의사입니다.\", \"reference\": \"Tôi là bác sĩ.\"},"
                    + "    {\"id\": 2, \"source\": \"친구는 요리사입니다.\", \"reference\": \"Bạn tôi là đầu bếp.\"},"
                    + "    {\"id\": 3, \"source\": \"가방은 큽니다.\", \"reference\": \"Cái cặp thì to.\"},"
                    + "    {\"id\": 4, \"source\": \"민수 씨는 회사원입니다.\", \"reference\": \"Anh Min-su là nhân viên công ty.\"},"
                    + "    {\"id\": 5, \"source\": \"이 책은 좋습니다.\", \"reference\": \"Quyển sách này tốt.\"}"
                    + "  ],"
                    + "  \"vieToKor\": ["
                    + "    {\"id\": 1, \"source\": \"Tôi là học sinh.\", \"reference\": \"저는 학생입니다.\"},"
                    + "    {\"id\": 2, \"source\": \"Cái này là bút chì.\", \"reference\": \"이것은 연필입니다.\"},"
                    + "    {\"id\": 3, \"source\": \"Tên tôi là Nam.\", \"reference\": \"제 이름은 남입니다.\"},"
                    + "    {\"id\": 4, \"source\": \"Bạn tôi là ca sĩ.\", \"reference\": \"친구는 가수입니다.\"},"
                    + "    {\"id\": 5, \"source\": \"Hôm nay là thứ hai.\", \"reference\": \"오늘은 월요일입니다.\"}"
                    + "  ]"
                    + "}"
                    + "}";
        }

        // 2. Đuôi câu thân mật -아/어요/해요
        if (key.contains("아요") || key.contains("어요") || key.contains("해요")) {
            return "{"
                    + "\"structure\": \"V/Adj + -아/어요/해요 (Nguyên âm ㅏ, ㅗ + 아요; còn lại + 어요; 하다 -> 해요)\","
                    + "\"definition\": \"Đuôi câu kết thúc câu trần thuật hoặc nghi vấn ở dạng thân mật, lịch sự thường dùng nhất trong đời sống hàng ngày.\","
                    + "\"usageScope\": \"Đứng ở cuối câu. Dùng trong văn nói hàng ngày giữa bạn bè, đồng nghiệp hoặc người có quan hệ thân thiết.\","
                    + "\"notes\": \"Nếu nguyên âm cuối là ㅏ/ㅗ thì cộng với -아요 (가다 -> 가요). Gốc động từ kết thúc bằng 하다 luôn chuyển thành 해요. Lên giọng ở cuối câu để tạo thành câu hỏi.\","
                    + "\"examples\": ["
                    + "  {\"kr\": \"저는 학교에 가요.\", \"vi\": \"Tôi đi đến trường.\"},"
                    + "  {\"kr\": \"지금 밥을 먹어요.\", \"vi\": \"Bây giờ tôi ăn cơm.\"},"
                    + "  {\"kr\": \"한국어를 공부해요.\", \"vi\": \"Tôi học tiếng Hàn.\"},"
                    + "  {\"kr\": \"날씨가 좋아요.\", \"vi\": \"Thời tiết rất đẹp.\"},"
                    + "  {\"kr\": \"커피를 마셔요.\", \"vi\": \"Tôi uống cà phê.\"},"
                    + "  {\"kr\": \"집에서 쉬어요.\", \"vi\": \"Tôi nghỉ ngơi ở nhà.\"}"
                    + "],"
                    + "\"exercises\": {"
                    + "  \"korToVie\": ["
                    + "    {\"id\": 1, \"source\": \"도서관에서 책을 읽어요.\", \"reference\": \"Tôi đọc sách ở thư viện.\"},"
                    + "    {\"id\": 2, \"source\": \"친구를 만나요.\", \"reference\": \"Tôi gặp gỡ bạn bè.\"},"
                    + "    {\"id\": 3, \"source\": \"운동을 좋아해요.\", \"reference\": \"Tôi thích tập thể thao.\"},"
                    + "    {\"id\": 4, \"source\": \"영화를 봐요.\", \"reference\": \"Tôi xem phim.\"},"
                    + "    {\"id\": 5, \"source\": \"시장에서 사과를 사요.\", \"reference\": \"Tôi mua táo ở chợ.\"}"
                    + "  ],"
                    + "  \"vieToKor\": ["
                    + "    {\"id\": 1, \"source\": \"Tôi đi làm.\", \"reference\": \"회사에 가요.\"},"
                    + "    {\"id\": 2, \"source\": \"Tôi uống nước.\", \"reference\": \"물을 마셔요.\"},"
                    + "    {\"id\": 3, \"source\": \"Tôi học bài.\", \"reference\": \"공부해요.\"},"
                    + "    {\"id\": 4, \"source\": \"Tôi ăn táo.\", \"reference\": \"사과를 먹어요.\"},"
                    + "    {\"id\": 5, \"source\": \"Tôi gặp thầy giáo.\", \"reference\": \"선생님을 만나요.\"}"
                    + "  ]"
                    + "}"
                    + "}";
        }

        // 3. Trợ từ 'cũng' (도)
        if (key.contains("도")) {
            return "{"
                    + "\"structure\": \"N + 도 (Danh từ + 도, thay thế cho 은/는, 이/가, 을/를)\","
                    + "\"definition\": \"Trợ từ mang ý nghĩa là 'cũng', diễn tả sự đồng nhất hoặc thêm vào một đối tượng khác có cùng đặc tính.\","
                    + "\"usageScope\": \"Gắn trực tiếp sau danh từ chỉ người hoặc vật. Khi gắn '도' sẽ lược bỏ trợ từ chủ ngữ hoặc tân ngữ.\","
                    + "\"notes\": \"Không dùng song song '은도' hay '를도', mà phải bỏ trợ từ trước đó (ví dụ: 저도, 이것도). Đọc nối âm tự nhiên.\","
                    + "\"examples\": ["
                    + "  {\"kr\": \"저도 학생입니다.\", \"vi\": \"Tôi cũng là học sinh.\"},"
                    + "  {\"kr\": \"사과도 맛있어요.\", \"vi\": \"Táo cũng rất ngon.\"},"
                    + "  {\"kr\": \"한국어도 배워요.\", \"vi\": \"Tôi cũng học cả tiếng Hàn nữa.\"},"
                    + "  {\"kr\": \"민수 씨도 왔어요.\", \"vi\": \"Anh Min-su cũng đã đến.\"},"
                    + "  {\"kr\": \"이것도 좋아요.\", \"vi\": \"Cái này cũng tốt.\"},"
                    + "  {\"kr\": \"주말에도 일해요.\", \"vi\": \"Cuối tuần tôi cũng làm việc.\"}"
                    + "],"
                    + "\"exercises\": {"
                    + "  \"korToVie\": ["
                    + "    {\"id\": 1, \"source\": \"저도 베트남 사람입니다.\", \"reference\": \"Tôi cũng là người Việt Nam.\"},"
                    + "    {\"id\": 2, \"source\": \"동생도 키가 커요.\", \"reference\": \"Em tôi cũng cao.\"},"
                    + "    {\"id\": 3, \"source\": \"빵도 샀어요.\", \"reference\": \"Tôi cũng đã mua cả bánh mì.\"},"
                    + "    {\"id\": 4, \"source\": \"내일도 만나요.\", \"reference\": \"Ngày mai chúng ta cũng gặp nhau nhé.\"},"
                    + "    {\"id\": 5, \"source\": \"이 영화도 재미있어요.\", \"reference\": \"Bộ phim này cũng thú vị.\"}"
                    + "  ],"
                    + "  \"vieToKor\": ["
                    + "    {\"id\": 1, \"source\": \"Tôi cũng là bác sĩ.\", \"reference\": \"저도 의사입니다.\"},"
                    + "    {\"id\": 2, \"source\": \"Bạn tôi cũng đi Hàn Quốc.\", \"reference\": \"친구도 한국에 가요.\"},"
                    + "    {\"id\": 3, \"source\": \"Cái này cũng rẻ.\", \"reference\": \"이것도 싸요.\"},"
                    + "    {\"id\": 4, \"source\": \"Tôi cũng thích cà phê.\", \"reference\": \"저도 커피를 좋아해요.\"},"
                    + "    {\"id\": 5, \"source\": \"Hôm nay tôi cũng bận.\", \"reference\": \"오늘도 바빠요.\"}"
                    + "  ]"
                    + "}"
                    + "}";
        }

        // 4. Mặc định cho ngữ pháp 입니다 / 입니까
        return "{"
                + "\"structure\": \"N + 입니다 / 입니까? (Câu khẳng định dùng 입니다, câu hỏi dùng 입니까?)\","
                + "\"definition\": \"Đuôi câu kính ngữ trang trọng, mang nghĩa là 'là' hoặc 'có phải là... không?' trong tiếng Việt.\","
                + "\"usageScope\": \"Đứng ở cuối câu. Dùng trong các tình huống trang trọng, phỏng vấn, thuyết trình hoặc nói chuyện với người lớn tuổi.\","
                + "\"notes\": \"Được phát âm biến âm là [임니다/임니까]. Khi viết câu hỏi cần thêm dấu chấm hỏi ở cuối câu.\","
                + "\"examples\": ["
                + "  {\"kr\": \"저는 학생입니다.\", \"vi\": \"Tôi là học sinh.\"},"
                + "  {\"kr\": \"회사원입니까?\", \"vi\": \"Bạn có phải là nhân viên công ty không?\"},"
                + "  {\"kr\": \"한국 사람입니다.\", \"vi\": \"Tôi là người Hàn Quốc.\"},"
                + "  {\"kr\": \"이것은 무엇입니까?\", \"vi\": \"Cái này là cái gì?\"},"
                + "  {\"kr\": \"의사입니다.\", \"vi\": \"Tôi là bác sĩ.\"},"
                + "  {\"kr\": \"선생님입니까?\", \"vi\": \"Bạn là giáo viên phải không?\"}"
                + "],"
                + "\"exercises\": {"
                + "  \"korToVie\": ["
                + "    {\"id\": 1, \"source\": \"화입니다.\", \"reference\": \"Tôi là Hoa.\"},"
                + "    {\"id\": 2, \"source\": \"요리사입니다.\", \"reference\": \"Tôi là đầu bếp.\"},"
                + "    {\"id\": 3, \"source\": \"책입니다.\", \"reference\": \"Là quyển sách.\"},"
                + "    {\"id\": 4, \"source\": \"베트남 사람입니까?\", \"reference\": \"Bạn là người Việt Nam phải không?\"},"
                + "    {\"id\": 5, \"source\": \"제 가방입니다.\", \"reference\": \"Là cái cặp của tôi.\"}"
                + "  ],"
                + "  \"vieToKor\": ["
                + "    {\"id\": 1, \"source\": \"Tôi là ca sĩ.\", \"reference\": \"가수입니다.\"},"
                + "    {\"id\": 2, \"source\": \"Đây là trường học.\", \"reference\": \"학교입니다.\"},"
                + "    {\"id\": 3, \"source\": \"Bạn là cảnh sát phải không?\", \"reference\": \"경찰입니까?\"},"
                + "    {\"id\": 4, \"source\": \"Tôi là nhân viên ngân hàng.\", \"reference\": \"은행원입니다.\"},"
                + "    {\"id\": 5, \"source\": \"Là đồng hồ.\", \"reference\": \"시계입니다.\"}"
                + "  ]"
                + "}"
                + "}";
    }
}