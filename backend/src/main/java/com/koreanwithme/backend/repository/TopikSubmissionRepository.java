package com.koreanwithme.backend.repository;

import com.koreanwithme.backend.entity.TopikSubmission;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TopikSubmissionRepository extends JpaRepository<TopikSubmission, Integer> {

    // Cho học viên xem lịch sử của chính mình
    @EntityGraph(attributePaths = {"exam"})
    List<TopikSubmission> findByUserIdOrderByIdDesc(Integer userId);

    // Cho Admin: Lấy toàn bộ bài thi đã nộp của tất cả học viên (kèm thông tin user và exam)
    @EntityGraph(attributePaths = {"user", "exam"})
    List<TopikSubmission> findAllByOrderByIdDesc();

    // Cho Admin: Lấy chi tiết 1 bài nộp cụ thể
    @EntityGraph(attributePaths = {"user", "exam"})
    Optional<TopikSubmission> findWithUserAndExamById(Integer id);
}