package com.smarttimetable.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "teachers")
public class Teacher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", unique = true, nullable = false)
    private String employeeId;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "personal_email", nullable = false)
    private String personalEmail;

    @Column(name = "college_email", nullable = false)
    private String collegeEmail;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "class_advisor_for")
    private String classAdvisorFor;

    @Column(name = "phone_1")
    private String phone1;

    @Column(name = "phone_2")
    private String phone2;

    @Column(name = "subject_handling")
    private String subjectHandling;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @OneToOne(fetch = FetchType.EAGER, cascade = {CascadeType.MERGE, CascadeType.REFRESH})
    @JoinColumn(name = "user_id")
    private User user;

    public Teacher() {}

    public Teacher(String employeeId, String firstName, String lastName, String personalEmail, String collegeEmail, String phone1, String phone2, String subjectHandling, Department department, User user) {
        this.employeeId = employeeId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.personalEmail = personalEmail;
        this.collegeEmail = collegeEmail;
        this.phone1 = phone1;
        this.phone2 = phone2;
        this.subjectHandling = subjectHandling;
        this.department = department;
        this.user = user;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getName() { return firstName + " " + lastName; }
    
    public String getPersonalEmail() { return personalEmail; }
    public void setPersonalEmail(String personalEmail) { this.personalEmail = personalEmail; }

    public String getCollegeEmail() { return collegeEmail; }
    public void setCollegeEmail(String collegeEmail) { this.collegeEmail = collegeEmail; }

    public String getPhone1() { return phone1; }
    public void setPhone1(String phone1) { this.phone1 = phone1; }

    public String getPhone2() { return phone2; }
    public void setPhone2(String phone2) { this.phone2 = phone2; }

    public String getSubjectHandling() { return subjectHandling; }
    public void setSubjectHandling(String subjectHandling) { this.subjectHandling = subjectHandling; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getClassAdvisorFor() { return classAdvisorFor; }
    public void setClassAdvisorFor(String classAdvisorFor) { this.classAdvisorFor = classAdvisorFor; }
}
