package com.koreanwithme.backend.repository;

import com.koreanwithme.backend.entity.TopikSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TopikSubmissionRepository extends JpaRepository<TopikSubmission, Integer> {
    List<TopikSubmission> findByUserIdOrderByCompletedAtDesc(Integer userId);
    List<TopikSubmission> findByExamIdOrderByTotalScoreDesc(Integer examId);
}