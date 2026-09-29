package com.koreanwithme.backend.repository;

import com.koreanwithme.backend.entity.TopikExam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TopikExamRepository extends JpaRepository<TopikExam, Integer> {
    List<TopikExam> findByStatusOrderByCreatedAtDesc(TopikExam.Status status);
    List<TopikExam> findByLevelAndStatus(TopikExam.Level level, TopikExam.Status status);
}