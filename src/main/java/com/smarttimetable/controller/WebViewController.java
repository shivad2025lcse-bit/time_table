package com.smarttimetable.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebViewController {

    @GetMapping("/")
    public String index() {
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String login() {
        return "forward:/index.html";
    }

    @GetMapping("/admin")
    public String adminDashboard() {
        return "forward:/index.html";
    }

    @GetMapping("/faculty")
    public String facultyDashboard() {
        return "forward:/index.html";
    }

    @GetMapping("/student")
    public String studentDashboard() {
        return "forward:/index.html";
    }
}
