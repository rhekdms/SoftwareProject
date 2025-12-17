/**
 * @FileName : MemberController.java
 * @Project  : MiniGame
 * @Author   : 고다은
 */

package edu.mokpo.minigame.controller;

import org.springframework.ui.Model;
import edu.mokpo.minigame.dto.MemberDto;
import edu.mokpo.minigame.entity.Member;
import edu.mokpo.minigame.repository.MemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import edu.mokpo.minigame.dto.LoginDto;
import jakarta.servlet.http.HttpSession; // 세션 사용을 위한 import
import java.util.Optional; // Optional 사용을 위한 import

@Controller
public class MemberController {

    @Autowired
    private MemberRepository memberRepository; // 아까 만든 Repository(심부름꾼) 소환

    // 1. 회원가입 페이지 보여주기 (GET 방식)
    @GetMapping("/signup")
    public String signupPage() {
        return "signup"; // templates/signup.html 파일을 보여줘라
    }

    // 2. 회원가입 버튼 눌렀을 때 실행 (POST 방식)
    @PostMapping("/signup")
    public String signupProcess(MemberDto memberDto, Model model) {

        // 1. 이미 존재하는 아이디인지 검사 (true면 이미 있음)
        if (memberRepository.existsById(memberDto.getId())) {

            // 2. 에러 메시지를 모델에 담음
            model.addAttribute("error", "이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.");

            // 3. redirect가 아니라, 다시 signup 페이지를 보여줌 (에러 메시지와 함께)
            return "signup";
        }

        // 4. 중복이 아니면 저장 진행
        Member member = memberDto.toEntity();
        memberRepository.save(member);

        return "redirect:/login";
    }

    // 1. 로그인 페이지 보여주기
    @GetMapping("/login")
    public String loginPage() {
        return "login";
    }

    // 2. 로그인 처리 로직
    @PostMapping("/login")
    public String loginProcess(LoginDto loginDto, HttpSession session) {

        // (1) DB에서 아이디로 회원 조회
        // findById는 "Optional"이라는 상자 안에 데이터를 담아서 줍니다. (없을 수도 있으니까요)
        Optional<Member> memberBox = memberRepository.findById(loginDto.getId());

        // (2) 아이디가 존재하는지 확인
        if (memberBox.isPresent()) {
            Member member = memberBox.get(); // 상자에서 회원 꺼내기

            // (3) 비밀번호가 일치하는지 확인
            if (member.getPassword().equals(loginDto.getPassword())) {

                // ★ 로그인 성공! 세션(서버의 기억장소)에 회원 정보를 저장합니다.
                // "loginMember"라는 이름표를 붙여서 저장해둡니다.
                session.setAttribute("loginMember", member);

                return "redirect:/"; // 메인 페이지로 이동
            }
        }

        // 로그인 실패 시 (아이디가 없거나 비번이 틀림) 다시 로그인 페이지로
        return "redirect:/login";
    }

    // 3. 로그아웃
    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate(); // 세션을 싹 비워서 로그인 정보를 날림
        return "redirect:/";
    }

    // 1. 회원 정보 페이지 보여주기
    @GetMapping("/myinfo")
    public String myInfoPage(HttpSession session, Model model) {
        // 세션에서 현재 로그인한 사람 정보를 가져옴
        Member loginMember = (Member) session.getAttribute("loginMember");

        if (loginMember == null) {
            return "redirect:/login"; // 로그인 안 했으면 튕겨내기
        }

        // DB에서 최신 정보를 다시 가져옴 (안전하게)
        Member member = memberRepository.findById(loginMember.getId()).get();
        model.addAttribute("member", member);

        return "myinfo"; // myinfo.mustache 로 이동
    }

    // 2. 회원 정보 수정하기
    @PostMapping("/myinfo/update")
    public String updateMember(MemberDto memberDto, HttpSession session) {
        // JPA의 save 함수는 똑같은 ID가 이미 있으면 '수정(Update)'을 수행합니다.
        Member member = memberDto.toEntity();
        memberRepository.save(member);

        // ★ 중요: 세션에 저장된 정보도 갱신해줘야 함! (안 그러면 재로그인 전까지 옛날 비번으로 기억함)
        session.setAttribute("loginMember", member);

        return "redirect:/"; // 메인으로 이동
    }

    // 3. 회원 탈퇴하기
    @GetMapping("/myinfo/delete")
    public String deleteMember(HttpSession session) {
        Member loginMember = (Member) session.getAttribute("loginMember");

        if (loginMember != null) {
            // DB에서 삭제
            memberRepository.delete(loginMember);

            // 세션 삭제 (로그아웃 처리)
            session.invalidate();
        }

        return "redirect:/"; // 로그인 전 메인 화면으로 이동
    }
}