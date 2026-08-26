package com.smarttimetable.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "students")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "register_number", unique = true, nullable = false)
    private String registerNumber;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(nullable = false)
    private String email;

    @Column(name = "college_email", nullable = false)
    private String collegeEmail;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    private Integer semester;

    @Column(name = "phone")
    private String phone;

    @Column(name = "parent_phone_1")
    private String parentPhone1;

    @Column(name = "parent_phone_2")
    private String parentPhone2;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id")
    private User user;

    public Student() {}

    public Student(String registerNumber, String firstName, String lastName, String email, String collegeEmail, Department department, Course course, Section section, Integer semester, User user) {
        this.registerNumber = registerNumber;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.collegeEmail = collegeEmail;
        this.department = department;
        this.course = course;
        this.section = section;
        this.semester = semester;
        this.user = user;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRegisterNumber() { return registerNumber; }
    public void setRegisterNumber(String registerNumber) { this.registerNumber = registerNumber; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    // Helper method to keep compatibility with AuthService
    public String getName() { return firstName + " " + lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCollegeEmail() { return collegeEmail; }
    public void setCollegeEmail(String collegeEmail) { this.collegeEmail = collegeEmail; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public Section getSection() { return section; }
    public void setSection(Section section) { this.section = section; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getParentPhone1() { return parentPhone1; }
    public void setParentPhone1(String parentPhone1) { this.parentPhone1 = parentPhone1; }

    public String getParentPhone2() { return parentPhone2; }
    public void setParentPhone2(String parentPhone2) { this.parentPhone2 = parentPhone2; }
}
