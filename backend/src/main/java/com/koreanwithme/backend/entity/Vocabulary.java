package com.koreanwithme.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vocabularies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vocabulary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(name = "word_kr", nullable = false, length = 100)
    private String wordKr;

    @Column(name = "meaning_vn", nullable = false)
    private String meaningVn;

    @Column(name = "audio_url")
    private String audioUrl;
}