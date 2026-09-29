package com.koreanwithme.backend.repository;

import com.koreanwithme.backend.entity.TopikQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TopikQuestionRepository extends JpaRepository<TopikQuestion, Integer> {
    List<TopikQuestion> findByExamIdOrderByQuestionNumAsc(Integer examId);
    void deleteByExamId(Integer examId);
}