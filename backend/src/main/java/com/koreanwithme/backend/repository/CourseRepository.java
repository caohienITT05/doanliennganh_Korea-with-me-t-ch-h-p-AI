package com.koreanwithme.backend.repository;

import com.koreanwithme.backend.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {
    // Để trống interface, JpaRepository đã hỗ trợ đầy đủ findById, findAll, save, deleteById
}