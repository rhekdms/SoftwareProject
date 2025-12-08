package edu.mokpo.minigame.controller;

import edu.mokpo.minigame.entity.Member; // Member import 확인!
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home(HttpSession session, Model model) {
        // 1. 세션에서 로그인한 회원 정보("loginMember")를 꺼내봅니다.
        Member loginMember = (Member) session.getAttribute("loginMember");

        // 2. 만약 로그인한 상태라면(정보가 있다면), 화면(HTML)에 전달해줍니다.
        if (loginMember != null) {
            model.addAttribute("member", loginMember);
        }

        return "index"; // templates/index.html을 보여줘라
    }
}