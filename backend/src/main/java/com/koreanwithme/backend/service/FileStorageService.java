package com.koreanwithme.backend.service;

import com.koreanwithme.backend.dto.TopikDtos.AudioMappingResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class FileStorageService {

    @Value("${app.upload.dir:uploads}")
    private String baseUploadDir;

    public List<AudioMappingResponse> storeExamAudios(Integer examId, List<MultipartFile> files) throws IOException {
        Path targetDir = Paths.get(baseUploadDir, "exams", String.valueOf(examId), "audios")
                .toAbsolutePath().normalize();
        Files.createDirectories(targetDir);

        List<AudioMappingResponse> results = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String originalName = file.getOriginalFilename();
            if (originalName == null) continue;

            // Làm sạch tên file và lưu vào đĩa
            String safeFileName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
            Path destination = targetDir.resolve(safeFileName);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            // Đường dẫn URL công khai cho client
            String publicUrl = "/uploads/exams/" + examId + "/audios/" + safeFileName;

            // Tự động phân tích số câu hỏi từ tên file
            List<Integer> questionNums = extractQuestionNumbers(safeFileName);

            results.add(AudioMappingResponse.builder()
                    .originalFileName(originalName)
                    .audioUrl(publicUrl)
                    .mappedQuestionNums(questionNums)
                    .build());
        }

        return results;
    }

    private List<Integer> extractQuestionNumbers(String fileName) {
        List<Integer> numbers = new ArrayList<>();

        // Kiểm tra dạng dải câu: 21-22.mp3 hoặc 21_22.mp3
        Pattern rangePattern = Pattern.compile("(\\d+)[-_](\\d+)");
        Matcher rangeMatcher = rangePattern.matcher(fileName);
        if (rangeMatcher.find()) {
            int start = Integer.parseInt(rangeMatcher.group(1));
            int end = Integer.parseInt(rangeMatcher.group(2));
            if (start <= end && end - start <= 5) {
                for (int i = start; i <= end; i++) {
                    numbers.add(i);
                }
                return numbers;
            }
        }

        // Kiểm tra câu đơn lẻ: 1.mp3, cau_05.mp3, q12.mp3
        Pattern singlePattern = Pattern.compile("(\\d+)");
        Matcher singleMatcher = singlePattern.matcher(fileName);
        if (singleMatcher.find()) {
            numbers.add(Integer.parseInt(singleMatcher.group(1)));
        }

        return numbers;
    }
}