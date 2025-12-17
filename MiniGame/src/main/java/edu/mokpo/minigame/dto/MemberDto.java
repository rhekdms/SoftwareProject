/**
 * @FileName : MemberDto.java
 * @Project  : MiniGame
 * @Author   : 고다은
 */

package edu.mokpo.minigame.dto;

import edu.mokpo.minigame.entity.Member;

public class MemberDto {
    private String id;
    private String password;
    private String email;

    // 생성자, Getter, Setter (자동 생성 기능 쓰셔도 됩니다)
    public MemberDto(String id, String password, String email) {
        this.id = id;
        this.password = password;
        this.email = email;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    // ★ 핵심: DTO를 Entity로 변환하는 메서드
    public Member toEntity() {
        return new Member(this.id, this.password, this.email);
    }
}