package edu.mokpo.minigame.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity // "이 클래스는 DB 테이블입니다"라고 알려주는 표시
public class Member {

    @Id // Primary Key(기본키) 설정
    @Column(length = 20) // varchar(20)과 매칭
    private String id;

    @Column(columnDefinition = "TEXT") // text 타입과 매칭
    private String password;

    @Column(columnDefinition = "TEXT") // text 타입과 매칭
    private String email;

    // 기본 생성자 (필수)
    public Member() {
    }

    // 데이터를 쉽게 넣기 위한 생성자
    public Member(String id, String password, String email) {
        this.id = id;
        this.password = password;
        this.email = email;
    }

    // Getter & Setter (데이터를 넣고 빼기 위해 필요)
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}