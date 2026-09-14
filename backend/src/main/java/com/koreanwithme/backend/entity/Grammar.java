package com.koreanwithme.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "grammars")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Grammar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(nullable = false)
    private String structure;

    @Column(name = "usage_desc", columnDefinition = "TEXT")
    private String usageDesc; // Đổi thành usageDesc

    @Column(name = "example_kr", columnDefinition = "TEXT")
    private String exampleKr; // Đổi thành exampleKr

    @Column(name = "example_vn", columnDefinition = "TEXT")
    private String exampleVn; // Đổi thành exampleVn
}