package com.smarttimetable.service;

import com.smarttimetable.entity.Student;
import com.smarttimetable.entity.User;
import com.smarttimetable.repository.StudentRepository;
import org.springframework.stereotype.Service;
import com.smarttimetable.repository.DepartmentRepository;
import com.smarttimetable.repository.CourseRepository;
import com.smarttimetable.repository.SectionRepository;

import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    @org.springframework.beans.factory.annotation.Autowired
    private StudentRepository studentRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private DepartmentRepository departmentRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private CourseRepository courseRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private SectionRepository sectionRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.smarttimetable.repository.UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.smarttimetable.repository.QuizSubmissionRepository quizSubmissionRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.smarttimetable.repository.TopicPerformanceRepository topicPerformanceRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.smarttimetable.repository.EmailSubscriptionRepository emailSubscriptionRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.smarttimetable.repository.EmailNotificationLogRepository emailNotificationLogRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.smarttimetable.repository.StudentNotificationRepository studentNotificationRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }
    @org.springframework.transaction.annotation.Transactional
    public Student saveStudent(Student student) {
        if (student.getId() == null && student.getRegisterNumber() != null) {
            if (studentRepository.findByRegisterNumber(student.getRegisterNumber()).isPresent()) {
                throw new IllegalArgumentException("A student with Register Number " + student.getRegisterNumber() + " already exists!");
            }
        }
        if (student.getDepartment() != null && student.getDepartment().getId() == null && student.getDepartment().getName() != null) {
            student.setDepartment(departmentRepository.findByCode(student.getDepartment().getName())
                    .orElseGet(() -> departmentRepository.findByName(student.getDepartment().getName())
                    .orElseGet(() -> {
                        com.smarttimetable.entity.Department d = new com.smarttimetable.entity.Department();
                        d.setName(student.getDepartment().getName());
                        d.setCode(student.getDepartment().getName().toUpperCase());
                        return departmentRepository.save(d);
                    })));
        }
        if (student.getCourse() != null && student.getCourse().getId() == null && student.getCourse().getName() != null) {
            student.setCourse(courseRepository.findByCode(student.getCourse().getName())
                    .orElseGet(() -> courseRepository.findByName(student.getCourse().getName())
                    .orElseGet(() -> {
                        com.smarttimetable.entity.Course c = new com.smarttimetable.entity.Course();
                        c.setName(student.getCourse().getName());
                        c.setCode(student.getCourse().getName().toUpperCase());
                        c.setDepartment(student.getDepartment());
                        return courseRepository.save(c);
                    })));
        }
        if (student.getSection() != null && student.getSection().getSectionName() != null) {
            String normalizedSec = normalizeSectionName(
                    student.getSection().getSectionName(),
                    student.getDepartment() != null ? student.getDepartment().getCode() : null,
                    student.getSemester()
            );
            student.setSection(sectionRepository.findAll().stream()
                    .filter(s -> s.getSectionName() != null && s.getSectionName().equalsIgnoreCase(normalizedSec))
                    .findFirst()
                    .orElseGet(() -> {
                        com.smarttimetable.entity.Section s = new com.smarttimetable.entity.Section();
                        s.setSectionName(normalizedSec);
                        s.setCourse(student.getCourse());
                        s.setSemester(student.getSemester() != null ? student.getSemester() : 3);
                        return sectionRepository.save(s);
                    }));
        }

        if (student.getId() == null && student.getSection() != null && student.getSection().getId() != null) {
            long currentCount = studentRepository.countBySectionId(student.getSection().getId());
            if (currentCount >= 80) {
                throw new IllegalStateException("Section has reached its maximum capacity of 80 students.");
            }
        }
        
        if (student.getId() == null && student.getUser() == null) {
            String username = student.getRegisterNumber().toLowerCase();
            String firstName = student.getFirstName() != null ? student.getFirstName().toUpperCase().split(" ")[0] : "";
            String phone = student.getPhone() != null ? student.getPhone().replaceAll("\\D", "") : "";
            String last4 = phone.length() >= 4 ? phone.substring(phone.length() - 4) : "0000";
            String password = firstName + last4;
            
            // Check for orphaned user record from previous deletion before cascade was added
            com.smarttimetable.entity.User user = userRepository.findByUsername(username).orElse(null);
            
            if (user == null) {
                user = new com.smarttimetable.entity.User(
                    username,
                    passwordEncoder.encode(password),
                    password,
                    com.smarttimetable.entity.Role.ROLE_STUDENT,
                    student.getEmail(),
                    true
                );
            } else {
                // Reuse orphaned user and reset password/email
                user.setPassword(passwordEncoder.encode(password));
                user.setRawPassword(password);
                user.setEmail(student.getEmail());
                user.setRole(com.smarttimetable.entity.Role.ROLE_STUDENT);
                user.setActive(true);
            }
            user = userRepository.save(user);
            student.setUser(user);
        }
        
        return studentRepository.save(student);
    }

    private String normalizeSectionName(String raw, String deptCode, Integer semester) {
        String s = raw == null ? "" : raw.trim().replaceAll("\\s+", " ");
        // If duplicated like "2 CSE II CSE A" or "BTECH-CSE CSE II CSE A", keep the canonical trailing section
        java.util.regex.Matcher trail = java.util.regex.Pattern
                .compile("\\b(I|II|III|IV|[1-4])\\s+([A-Za-z&.-]+)\\s+([A-Za-z0-9]+)$", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(s);
        if (trail.find()) {
            return toRomanYear(trail.group(1)) + " " + trail.group(2).toUpperCase() + " " + trail.group(3).toUpperCase();
        }
        String dept = (deptCode != null && !deptCode.trim().isEmpty()) ? deptCode.trim().toUpperCase() : "CSE";
        int sem = semester != null ? semester : 3;
        String yr = toRomanYear(String.valueOf((sem + 1) / 2));
        if (s.matches("^[A-Za-z]$")) {
            return yr + " " + dept + " " + s.toUpperCase();
        }
        return s;
    }

    private String toRomanYear(String y) {
        String u = y == null ? "" : y.trim().toUpperCase();
        switch (u) {
            case "1": case "I": return "I";
            case "2": case "II": return "II";
            case "3": case "III": return "III";
            case "4": case "IV": return "IV";
            default: return u.isEmpty() ? "II" : u;
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public List<Student> updateStudentsSemester(List<Long> studentIds, Integer newSemester, String note) {
        if (studentIds == null || studentIds.isEmpty()) {
            throw new IllegalArgumentException("Please select at least one student.");
        }
        if (newSemester == null || newSemester < 1 || newSemester > 8) {
            throw new IllegalArgumentException("Semester must be between 1 and 8.");
        }
        List<Student> targets = studentRepository.findAllById(studentIds);
        String cleanNote = (note != null && !note.trim().isEmpty()) ? (" - " + note.trim()) : "";
        String today = java.time.LocalDate.now().toString();
        for (Student st : targets) {
            Integer prevSem = st.getSemester();
            st.setSemester(newSemester);
            st.setSemesterMarked(true);
            String changeLabel = (prevSem != null ? ("Sem " + prevSem + " -> " + newSemester) : ("Sem " + newSemester))
                    + " (" + today + ")" + cleanNote;
            st.setSemesterChangeNote(changeLabel);
        }
        return studentRepository.saveAll(targets);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteStudent(Long id) {
        if (id == null) return;
        Student student = studentRepository.findById(id).orElse(null);
        if (student == null) return;

        // Remove dependent quiz and notification records so deletion succeeds cleanly
        var submissions = quizSubmissionRepository.findByStudentId(id);
        if (submissions != null && !submissions.isEmpty()) {
            quizSubmissionRepository.deleteAll(submissions);
        }
        var topicPerfs = topicPerformanceRepository.findByStudentId(id);
        if (topicPerfs != null && !topicPerfs.isEmpty()) {
            topicPerformanceRepository.deleteAll(topicPerfs);
        }
        for (String mail : java.util.Arrays.asList(student.getEmail(), student.getCollegeEmail())) {
            if (mail != null && !mail.trim().isEmpty()) {
                var regs = studentNotificationRepository.findByEmail(mail.trim());
                if (regs != null && !regs.isEmpty()) {
                    studentNotificationRepository.deleteAll(regs);
                }
            }
        }

        // Gather linked website login account + any student user matching register number
        java.util.LinkedHashMap<Long, User> usersToDelete = new java.util.LinkedHashMap<>();
        if (student.getUser() != null && student.getUser().getId() != null) {
            usersToDelete.put(student.getUser().getId(), student.getUser());
        }
        if (student.getRegisterNumber() != null && !student.getRegisterNumber().trim().isEmpty()) {
            userRepository.findByUsernameIgnoreCase(student.getRegisterNumber().trim())
                    .filter(u -> u.getRole() == com.smarttimetable.entity.Role.ROLE_STUDENT)
                    .ifPresent(u -> usersToDelete.put(u.getId(), u));
        }

        student.setUser(null);
        studentRepository.save(student);
        studentRepository.delete(student);
        studentRepository.flush();

        for (User u : usersToDelete.values()) {
            emailSubscriptionRepository.findByUserId(u.getId())
                    .ifPresent(emailSubscriptionRepository::delete);
            var emailLogs = emailNotificationLogRepository.findByUserId(u.getId());
            if (emailLogs != null && !emailLogs.isEmpty()) {
                emailLogs.forEach(log -> log.setUser(null));
                emailNotificationLogRepository.saveAll(emailLogs);
            }
            userRepository.delete(u);
        }
        userRepository.flush();
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.Map<String, Object> deleteStudentsBulk(List<Long> studentIds) {
        if (studentIds == null || studentIds.isEmpty()) {
            throw new IllegalArgumentException("Please select at least one student to delete.");
        }
        List<Student> targets = studentRepository.findAllById(studentIds);
        List<String> deletedRolls = new java.util.ArrayList<>();
        List<String> deletedUsers = new java.util.ArrayList<>();
        int deletedCount = 0;

        for (Student st : targets) {
            if (st.getRegisterNumber() != null) {
                deletedRolls.add(st.getRegisterNumber());
            }
            if (st.getUser() != null && st.getUser().getUsername() != null) {
                deletedUsers.add(st.getUser().getUsername());
            }
            deleteStudent(st.getId());
            deletedCount++;
        }

        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("deletedCount", deletedCount);
        result.put("deletedRegisterNumbers", deletedRolls);
        result.put("removedUsernames", deletedUsers);
        result.put("message", "Permanently deleted " + deletedCount + " student(s) from database and revoked their website login access.");
        return result;
    }
}
