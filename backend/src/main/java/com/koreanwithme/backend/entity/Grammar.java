package com.koreanwithme.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "grammars")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Grammar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    // BỎ nullable = false ĐỂ KHÔNG BỊ CHẶN LỖI KHI TẠO
    @Column(name = "name")
    private String name;

    @Column(name = "structure", length = 500)
    private String structure;

    // Các trường cũ
    @Column(name = "usage_desc", columnDefinition = "TEXT")
    private String usageDesc;

    @Column(name = "example_kr", columnDefinition = "TEXT")
    private String exampleKr;

    @Column(name = "example_vn", columnDefinition = "TEXT")
    private String exampleVn;

    // Các trường mới cho bảng 4 ô & luyện dịch
    @Lob
    @Column(name = "definition", columnDefinition = "LONGTEXT")
    private String definition;

    @Lob
    @Column(name = "usage_scope", columnDefinition = "LONGTEXT")
    private String usageScope;

    @Lob
    @Column(name = "notes", columnDefinition = "LONGTEXT")
    private String notes;

    @Lob
    @Column(name = "examples_json", columnDefinition = "LONGTEXT")
    private String examplesJson;

    @Lob
    @Column(name = "exercises_json", columnDefinition = "LONGTEXT")
    private String exercisesJson;

    // TỰ ĐỘNG GÁN TÊN: Nếu Admin không nhập 'name', tự lấy 'structure' làm tên ngữ pháp
    @PrePersist
    @PreUpdate
    public void autoFillName() {
        if (this.name == null || this.name.trim().isEmpty()) {
            this.name = (this.structure != null && !this.structure.trim().isEmpty())
                    ? this.structure
                    : "Ngữ pháp mới";
        }
    }
}