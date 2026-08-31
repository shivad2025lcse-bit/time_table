package com.smarttimetable.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(name = "raw_password")
    private String rawPassword;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private boolean active = true;

    public User() {}

    public User(String username, String password, Role role, String email, boolean active) {
        this.username = username;
        this.password = password;
        this.rawPassword = password; // fallback, will be overwritten by services
        this.role = role;
        this.email = email;
        this.active = active;
    }

    public User(String username, String password, String rawPassword, Role role, String email, boolean active) {
        this.username = username;
        this.password = password;
        this.rawPassword = rawPassword;
        this.role = role;
        this.email = email;
        this.active = active;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRawPassword() { return rawPassword; }
    public void setRawPassword(String rawPassword) { this.rawPassword = rawPassword; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
