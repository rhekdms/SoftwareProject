package edu.mokpo.minigame.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class GameController {

    // 1. 포션 게임 페이지로 이동
    @GetMapping("/game/potion")
    public String potionGame() {
        return "game/potion"; // templates/game/potion.mustache를 찾아감
    }

    // 2. (나중에) 두 번째 게임도 여기에 추가하면 됩니다.
}