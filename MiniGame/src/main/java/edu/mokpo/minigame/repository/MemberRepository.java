package edu.mokpo.minigame.repository;

import edu.mokpo.minigame.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

// <관리할 엔티티 이름, PK의 데이터 타입>
// 우리는 PK인 id가 String(varchar) 타입이므로 String이라고 적습니다.
public interface MemberRepository extends JpaRepository<Member, String> {
}