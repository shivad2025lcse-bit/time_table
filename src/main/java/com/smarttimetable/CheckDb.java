package com.smarttimetable;
import com.smarttimetable.entity.Student;
import com.smarttimetable.entity.User;
import com.smarttimetable.repository.StudentRepository;
import com.smarttimetable.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class CheckDb {
    public static void main(String[] args) {
        SpringApplication.run(CheckDb.class, args).close();
    }
    @Bean
    public CommandLineRunner run(UserRepository userRepo, StudentRepository studentRepo) {
        return args -> {
            for (User u : userRepo.findAll()) {
                System.out.println("USER: " + u.getUsername() + " ID=" + u.getId());
            }
            for (Student s : studentRepo.findAll()) {
                System.out.println("STUDENT: " + s.getRegisterNumber() + " USERID=" + (s.getUser() != null ? s.getUser().getId() : "null") + " SEC=" + (s.getSection() != null ? s.getSection().getSectionName() : "null"));
            }
        };
    }
}
