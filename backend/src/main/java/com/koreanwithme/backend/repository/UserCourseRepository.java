package com.koreanwithme.backend.repository;

import com.koreanwithme.backend.entity.UserCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserCourseRepository extends JpaRepository<UserCourse, Integer> {
    boolean existsByUserIdAndCourseIdAndPaymentStatus(Integer userId, Integer courseId, String paymentStatus);
    Optional<UserCourse> findByUserIdAndCourseId(Integer userId, Integer courseId);
}