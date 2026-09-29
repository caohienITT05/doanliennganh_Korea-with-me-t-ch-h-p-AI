package com.koreanwithme.backend.repository;

import com.koreanwithme.backend.entity.TopikSubmission;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TopikSubmissionRepository extends JpaRepository<TopikSubmission, Integer> {
    // Tự động JOIN nạp sẵn bảng exam trong 1 câu query duy nhất
    @EntityGraph(attributePaths = {"exam"})
    List<TopikSubmission> findByUserIdOrderByIdDesc(Integer userId);
}