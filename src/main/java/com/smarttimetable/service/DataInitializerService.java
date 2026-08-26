package com.smarttimetable.service;

import com.smarttimetable.entity.*;
import com.smarttimetable.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class DataInitializerService implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private LaboratoryRepository laboratoryRepository;

    @Autowired
    private SectionRepository sectionRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private FacultyAvailabilityRepository facultyAvailabilityRepository;

    @Autowired
    private AcademicYearRepository academicYearRepository;

    @Autowired
    private TimetableRepository timetableRepository;

    @Autowired
    private StudentNotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            return; // Data already initialized
        }

        System.out.println(">>> INITIALIZING SRI ESHWAR COLLEGE OF ENGINEERING TIME TABLE GENERATOR DEMO DATA...");

        // 1. Create Users
        User adminUser = userRepository.save(new User("shiva25012007", passwordEncoder.encode("shiv2501"), Role.ROLE_ADMIN, "admin@sece.ac.in", true));
        User facultyUser1 = userRepository.save(new User("fkeerj012345", passwordEncoder.encode("keerj012345"), Role.ROLE_FACULTY, "faculty1@sece.ac.in", true));
        User facultyUser2 = userRepository.save(new User("fsarae012345", passwordEncoder.encode("sarae012345"), Role.ROLE_FACULTY, "faculty2@sece.ac.in", true));
        User facultyUser3 = userRepository.save(new User("fmurun012345", passwordEncoder.encode("murun012345"), Role.ROLE_FACULTY, "murugavelli@sece.ac.in", true));
        User facultyUser4 = userRepository.save(new User("fharis012345", passwordEncoder.encode("haris012345"), Role.ROLE_FACULTY, "harikarthick@sece.ac.in", true));
        User facultyUser5 = userRepository.save(new User("fkartm012345", passwordEncoder.encode("kartm012345"), Role.ROLE_FACULTY, "karthickraja@sece.ac.in", true));
        User facultyUser6 = userRepository.save(new User("fsaran012345", passwordEncoder.encode("saran012345"), Role.ROLE_FACULTY, "n.saranya@sece.ac.in", true));
        User facultyUser7 = userRepository.save(new User("fanant012345", passwordEncoder.encode("anant012345"), Role.ROLE_FACULTY, "s.ananthi@sece.ac.in", true));
        User facultyUser8 = userRepository.save(new User("fparth012345", passwordEncoder.encode("parth012345"), Role.ROLE_FACULTY, "v.parthipan@sece.ac.in", true));
        User facultyUser9 = userRepository.save(new User("fanand012345", passwordEncoder.encode("anand012345"), Role.ROLE_FACULTY, "a.anandaraj@sece.ac.in", true));
        User facultyUser10 = userRepository.save(new User("fsarfa012345", passwordEncoder.encode("sarfa012345"), Role.ROLE_FACULTY, "a.sarfaraz@sece.ac.in", true));
        User facultyUser11 = userRepository.save(new User("fsures012345", passwordEncoder.encode("sures012345"), Role.ROLE_FACULTY, "r.k.suresh@sece.ac.in", true));
        userRepository.save(new User("smithp012345", passwordEncoder.encode("mithp012345"), Role.ROLE_STUDENT, "student@sece.ac.in", true));

        // 2. Create Academic Year
        AcademicYear acYear = academicYearRepository.save(new AcademicYear("2026-2027", true));

        // 3. Create Departments: CSE, IT, AI & DS, AI & ML, ECE
        Department cseDept = departmentRepository.save(new Department("CSE", "Computer Science & Engineering"));
        Department itDept = departmentRepository.save(new Department("IT", "Information Technology"));
        Department aidsDept = departmentRepository.save(new Department("AI & DS", "Artificial Intelligence & Data Science"));
        Department aimlDept = departmentRepository.save(new Department("AI & ML", "Artificial Intelligence & Machine Learning"));
        Department eceDept = departmentRepository.save(new Department("ECE", "Electronics & Communication Engineering"));

        // 4. Create Courses
        Course cseCourse = courseRepository.save(new Course("BTECH-CSE", "B.E. Computer Science and Engineering", cseDept));
        Course itCourse = courseRepository.save(new Course("BTECH-IT", "B.Tech Information Technology", itDept));
        Course aidsCourse = courseRepository.save(new Course("BTECH-AIDS", "B.Tech AI & Data Science", aidsDept));
        Course aimlCourse = courseRepository.save(new Course("BTECH-AIML", "B.Tech AI & Machine Learning", aimlDept));
        Course meCseCourse = courseRepository.save(new Course("ME-CSE", "M.E. Computer Science and Engineering", cseDept));

        // 5. Create Teachers
        Teacher t1 = teacherRepository.save(new Teacher("EMP_CSE_01", "Karthick", "R", "r.karthick.personal@gmail.com", "r.karthick@sece.ac.in", "9876543210", "", "Design and Analysis of Algorithms", cseDept, facultyUser1));
        t1.setDisplayName("Mr.R.Karthick, AP/CSE");
        teacherRepository.save(t1);
        Teacher t2 = teacherRepository.save(new Teacher("EMP_CSE_02", "Saranya", "E", "saranya.e.personal@gmail.com", "e.saranya@sece.ac.in", "9876543211", "", "Database Management Systems", cseDept, facultyUser2));
        t2.setDisplayName("Ms.E.Saranya, AP/CSE");
        teacherRepository.save(t2);
        Teacher t3 = teacherRepository.save(new Teacher("EMP_MATH_01", "Murugavelli", "N", "muruga.personal@gmail.com", "murugavelli@sece.ac.in", "9876543212", "", "Discrete Mathematics", cseDept, facultyUser3));
        t3.setDisplayName("Dr.N.Murugavelli, AP/Maths");
        teacherRepository.save(t3);
        Teacher t4 = teacherRepository.save(new Teacher("EMP_CSE_03", "Harikarthick", "S.K.", "hari.personal@gmail.com", "harikarthick@sece.ac.in", "9876543213", "", "Software Engineering", cseDept, facultyUser4));
        t4.setDisplayName("Dr.S.K.Harikarthick, ASP/CSE");
        teacherRepository.save(t4);
        Teacher t5 = teacherRepository.save(new Teacher("EMP_CSE_04", "Karthickraja", "M", "karthickraja.personal@gmail.com", "karthickraja@sece.ac.in", "9876543214", "", "Java Programming", cseDept, facultyUser5));
        t5.setDisplayName("Mr.M.Karthickraja, AP/CSE");
        teacherRepository.save(t5);
        Teacher t6 = teacherRepository.save(new Teacher("EMP_CSE_05", "Saranya", "N", "n.saranya.personal@gmail.com", "n.saranya@sece.ac.in", "9876543215", "", "Artificial Intelligence", cseDept, facultyUser6));
        t6.setDisplayName("Dr.N.Saranya, AP/CSE");
        teacherRepository.save(t6);
        Teacher t7 = teacherRepository.save(new Teacher("EMP_CSE_06", "Ananthi", "S", "s.ananthi.personal@gmail.com", "s.ananthi@sece.ac.in", "9876543216", "", "Project Work", cseDept, facultyUser7));
        t7.setDisplayName("Dr.S.Ananthi, AP/CSE");
        t7.setClassAdvisorFor("II M.E. CSE");
        teacherRepository.save(t7);
        Teacher t8 = teacherRepository.save(new Teacher("EMP_ECE_01", "Parthipan", "V", "v.parthipan.personal@gmail.com", "v.parthipan@sece.ac.in", "9876543217", "", "Internet of Things", eceDept, facultyUser8));
        t8.setDisplayName("Mr.V.Parthipan, AP/ECE");
        teacherRepository.save(t8);
        Teacher t9 = teacherRepository.save(new Teacher("EMP_CSE_07", "Anandaraj", "A", "a.anandaraj.personal@gmail.com", "a.anandaraj@sece.ac.in", "9876543218", "", "Data Visualization Techniques", cseDept, facultyUser9));
        t9.setDisplayName("Dr.A.Anandaraj, AP/CSE");
        teacherRepository.save(t9);
        Teacher t10 = teacherRepository.save(new Teacher("EMP_CSE_08", "Sarfaraz Ahmed", "A", "a.sarfaraz.personal@gmail.com", "a.sarfaraz@sece.ac.in", "9876543219", "", "Big Data Analytics", cseDept, facultyUser10));
        t10.setDisplayName("Dr.A.Sarfaraz Ahmed, AP/CSE");
        teacherRepository.save(t10);
        Teacher t11 = teacherRepository.save(new Teacher("EMP_MECH_01", "Suresh", "R.K.", "r.k.suresh.personal@gmail.com", "r.k.suresh@sece.ac.in", "9876543220", "", "Total Quality Management", cseDept, facultyUser11));
        t11.setDisplayName("Dr.R.K.Suresh, Prof/MECH");
        teacherRepository.save(t11);
        Teacher tPlacement = teacherRepository.save(new Teacher("EMP_PLACE_01", "Placement", "Team", "placement@gmail.com", "placement@sece.ac.in", "9876543299", "", "Advanced Logical Thinking", cseDept, null));
        tPlacement.setDisplayName("Placement Team");
        teacherRepository.save(tPlacement);

        // 6. Create Venues / Classrooms & Labs
        Classroom sf04 = classroomRepository.save(new Classroom("SF 04", "Main Academic Block", 61, "THEORY"));
        Classroom sf05 = classroomRepository.save(new Classroom("SF 05", "Main Academic Block", 60, "THEORY"));

        Laboratory labFullStack = laboratoryRepository.save(new Laboratory("Full Stack Lab", "CS Block 2nd Floor", 65, "COMPUTER_LAB"));
        Laboratory labIntelAI = laboratoryRepository.save(new Laboratory("Intel AI Lab", "CS Block 3rd Floor", 65, "COMPUTER_LAB"));
        Laboratory labCloudDevOps = laboratoryRepository.save(new Laboratory("Cloud & DevOps Lab", "CS Block 2nd Floor", 65, "COMPUTER_LAB"));

        // 7. Create Section II CSE C
        Section sec2CseC = sectionRepository.save(new Section("II CSE C", cseCourse, 3, 61));
        Section sec2CseA = sectionRepository.save(new Section("II CSE A", cseCourse, 3, 60));
        Section sec2ItA = sectionRepository.save(new Section("II IT A", itCourse, 3, 60));
        Section sec2AidsA = sectionRepository.save(new Section("II AI&DS A", aidsCourse, 3, 60));
        Section sec2AimlA = sectionRepository.save(new Section("II AI&ML A", aimlCourse, 3, 60));
        Section secMeCse = sectionRepository.save(new Section("II M.E. CSE", meCseCourse, 3, 30));

        // 8. No default students — roster starts empty; Admin/Faculty can add students from the UI.

        // 9. Create Subjects
        Subject subDM = subjectRepository.save(new Subject("U23MA204", "Discrete Mathematics (DM)", cseDept, t3, 3, 4, 4, SubjectType.THEORY));
        Subject subDAA = subjectRepository.save(new Subject("U23CS403", "Design and Analysis of Algorithms (DAA)", cseDept, t1, 3, 3, 4, SubjectType.THEORY));
        Subject subDBMS = subjectRepository.save(new Subject("U23CS404", "Database Management Systems (DBMS)", cseDept, t2, 3, 3, 3, SubjectType.THEORY));
        Subject subSE = subjectRepository.save(new Subject("U23IT481", "Software Engineering (SE)", cseDept, t4, 3, 3, 5, SubjectType.THEORY));
        Subject subJAVA = subjectRepository.save(new Subject("U23CS491", "Java Programming (JAVA)", cseDept, t5, 3, 4, 5, SubjectType.THEORY));
        Subject subAIML = subjectRepository.save(new Subject("U23AM495", "AI & Machine Learning (AIML)", cseDept, t6, 3, 4, 6, SubjectType.THEORY));

        Subject subDAALab = subjectRepository.save(new Subject("U23CS453", "DAA Laboratory", cseDept, t1, 3, 2, 4, SubjectType.LAB));
        Subject subDBMSLab = subjectRepository.save(new Subject("U23CS454", "DBMS Laboratory", cseDept, t2, 3, 1, 2, SubjectType.LAB));
        Subject subSELab = subjectRepository.save(new Subject("U23IT481-LAB", "SE Laboratory", cseDept, t4, 3, 1, 2, SubjectType.LAB));
        Subject subJAVALab = subjectRepository.save(new Subject("U23CS491-LAB", "Java Laboratory", cseDept, t5, 3, 1, 2, SubjectType.LAB));
        Subject subAIMLLab = subjectRepository.save(new Subject("U23AM495-LAB", "AIML Laboratory", cseDept, t6, 3, 1, 2, SubjectType.LAB));

        Subject subALT = subjectRepository.save(new Subject("U23EM753", "Advanced Logical Thinking (ALT) - Placement Team", cseDept, tPlacement, 3, 1, 2, SubjectType.THEORY));
        Subject subSS = subjectRepository.save(new Subject("SS01", "Soft Skills (SS)", cseDept, t1, 3, 1, 1, SubjectType.THEORY));
        Subject subUHV = subjectRepository.save(new Subject("UHV01", "Universal Human Values (UHV)", cseDept, t2, 3, 1, 1, SubjectType.THEORY));
        Subject subLIB = subjectRepository.save(new Subject("LIB01", "Library Hour", cseDept, t1, 3, 0, 1, SubjectType.THEORY));
        Subject subCOE = subjectRepository.save(new Subject("COE01", "Center of Excellence (COE)", cseDept, t1, 3, 0, 2, SubjectType.PROJECT));
        Subject subTWM = subjectRepository.save(new Subject("TWM01", "Teamwork & Management (TWM)", cseDept, t2, 3, 0, 1, SubjectType.THEORY));
        Subject subJavaProj = subjectRepository.save(new Subject("JAVA-PROJ", "Java Project", cseDept, t5, 3, 1, 2, SubjectType.PROJECT));
        Subject subAimlProj = subjectRepository.save(new Subject("AIML-PROJ", "AIML Project", cseDept, t6, 3, 1, 2, SubjectType.PROJECT));
        Subject subMEProject = subjectRepository.save(new Subject("P23CS602", "Project Work - Phase I (PW)", cseDept, t7, 3, 1, 14, SubjectType.PROJECT));

        // 10. Create Exact Time Slots (08:40 AM to 04:10 PM)
        TimeSlot slot1 = timeSlotRepository.save(new TimeSlot(1, "08:40 AM", "09:40 AM"));
        TimeSlot slot2 = timeSlotRepository.save(new TimeSlot(2, "09:40 AM", "10:40 AM"));
        TimeSlot slot3 = timeSlotRepository.save(new TimeSlot(3, "11:00 AM", "12:00 PM"));
        TimeSlot slot4 = timeSlotRepository.save(new TimeSlot(4, "12:00 PM", "01:00 PM"));
        TimeSlot slot5 = timeSlotRepository.save(new TimeSlot(5, "01:40 PM", "02:30 PM"));
        TimeSlot slot6 = timeSlotRepository.save(new TimeSlot(6, "02:30 PM", "03:20 PM"));
        TimeSlot slot7 = timeSlotRepository.save(new TimeSlot(7, "03:20 PM", "04:10 PM"));

        // 11. Create Faculty Availability for 6 Working Days
        List<Teacher> teachers = Arrays.asList(t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, tPlacement);
        List<String> days = Arrays.asList("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
        List<TimeSlot> slots = Arrays.asList(slot1, slot2, slot3, slot4, slot5, slot6, slot7);

        for (Teacher t : teachers) {
            for (String day : days) {
                for (TimeSlot ts : slots) {
                    facultyAvailabilityRepository.save(new FacultyAvailability(t, day, ts, true));
                }
            }
        }


        // 12. Pre-populate Exact Timetable for II CSE A, B, C, D
        String yr = "2026-2027";
        timetableRepository.deleteAll();

        // SECTION II CSE A
        Section secA = sectionRepository.findBySectionName("II CSE A").orElseGet(() -> sectionRepository.save(new Section("II CSE A", cseCourse, 3, 60)));
        addTT("Monday", 1, "DAA", secA, yr, cseDept);
        addTT("Monday", 2, "AIML (Practical)", secA, yr, cseDept);
        addTT("Monday", 3, "AIML (Practical)", secA, yr, cseDept);
        addTT("Monday", 4, "DM", secA, yr, cseDept);
        addTT("Monday", 5, "DBMS LAB", secA, yr, cseDept);
        addTT("Monday", 6, "DBMS LAB", secA, yr, cseDept);
        addTT("Monday", 7, "DBMS LAB", secA, yr, cseDept);
        addTT("Tuesday", 1, "DM", secA, yr, cseDept);
        addTT("Tuesday", 2, "JAVA (Practical)", secA, yr, cseDept);
        addTT("Tuesday", 3, "JAVA (Practical)", secA, yr, cseDept);
        addTT("Tuesday", 4, "DBMS", secA, yr, cseDept);
        addTT("Tuesday", 5, "SS", secA, yr, cseDept);
        addTT("Tuesday", 6, "DAA LAB", secA, yr, cseDept);
        addTT("Tuesday", 7, "DAA LAB", secA, yr, cseDept);
        addTT("Wednesday", 1, "ALT", secA, yr, cseDept);
        addTT("Wednesday", 2, "ALT", secA, yr, cseDept);
        addTT("Wednesday", 3, "DBMS", secA, yr, cseDept);
        addTT("Wednesday", 4, "SE", secA, yr, cseDept);
        addTT("Wednesday", 5, "DM", secA, yr, cseDept);
        addTT("Wednesday", 6, "DAA", secA, yr, cseDept);
        addTT("Wednesday", 7, "JAVA", secA, yr, cseDept);
        addTT("Thursday", 1, "DBMS", secA, yr, cseDept);
        addTT("Thursday", 2, "DM", secA, yr, cseDept);
        addTT("Thursday", 3, "AIML", secA, yr, cseDept);
        addTT("Thursday", 4, "DAA", secA, yr, cseDept);
        addTT("Thursday", 5, "SE LAB", secA, yr, cseDept);
        addTT("Thursday", 6, "SE LAB", secA, yr, cseDept);
        addTT("Thursday", 7, "DBMS", secA, yr, cseDept);
        addTT("Friday", 1, "DAA LAB", secA, yr, cseDept);
        addTT("Friday", 2, "DAA LAB", secA, yr, cseDept);
        addTT("Friday", 3, "JAVA", secA, yr, cseDept);
        addTT("Friday", 4, "AIML", secA, yr, cseDept);
        addTT("Friday", 5, "DM-T", secA, yr, cseDept);
        addTT("Friday", 6, "LIB", secA, yr, cseDept);
        addTT("Friday", 7, "JAVA", secA, yr, cseDept);
        addTT("Saturday", 1, "UHV", secA, yr, cseDept);
        addTT("Saturday", 2, "CoE", secA, yr, cseDept);
        addTT("Saturday", 3, "CoE", secA, yr, cseDept);
        addTT("Saturday", 4, "CoE", secA, yr, cseDept);
        addTT("Saturday", 5, "AIML (Project)", secA, yr, cseDept);
        addTT("Saturday", 6, "AIML (Project)", secA, yr, cseDept);
        addTT("Saturday", 7, "TWM", secA, yr, cseDept);

        // SECTION II CSE B
        Section secB = sectionRepository.findBySectionName("II CSE B").orElseGet(() -> sectionRepository.save(new Section("II CSE B", cseCourse, 3, 60)));
        addTT("Monday", 1, "SE LAB", secB, yr, cseDept);
        addTT("Monday", 2, "SE LAB", secB, yr, cseDept);
        addTT("Monday", 3, "DBMS", secB, yr, cseDept);
        addTT("Monday", 4, "AIML", secB, yr, cseDept);
        addTT("Monday", 5, "DAA LAB", secB, yr, cseDept);
        addTT("Monday", 6, "DAA LAB", secB, yr, cseDept);
        addTT("Monday", 7, "DM", secB, yr, cseDept);
        addTT("Tuesday", 1, "DBMS", secB, yr, cseDept);
        addTT("Tuesday", 2, "AIML (Project)", secB, yr, cseDept);
        addTT("Tuesday", 3, "AIML (Project)", secB, yr, cseDept);
        addTT("Tuesday", 4, "DAA", secB, yr, cseDept);
        addTT("Tuesday", 5, "DM", secB, yr, cseDept);
        addTT("Tuesday", 6, "SS", secB, yr, cseDept);
        addTT("Tuesday", 7, "JAVA", secB, yr, cseDept);
        addTT("Wednesday", 1, "DAA", secB, yr, cseDept);
        addTT("Wednesday", 2, "DM", secB, yr, cseDept);
        addTT("Wednesday", 3, "ALT", secB, yr, cseDept);
        addTT("Wednesday", 4, "ALT", secB, yr, cseDept);
        addTT("Wednesday", 5, "DBMS LAB", secB, yr, cseDept);
        addTT("Wednesday", 6, "DBMS LAB", secB, yr, cseDept);
        addTT("Wednesday", 7, "DBMS LAB", secB, yr, cseDept);
        addTT("Thursday", 1, "JAVA", secB, yr, cseDept);
        addTT("Thursday", 2, "AIML (Practical)", secB, yr, cseDept);
        addTT("Thursday", 3, "AIML (Practical)", secB, yr, cseDept);
        addTT("Thursday", 4, "SE", secB, yr, cseDept);
        addTT("Thursday", 5, "DBMS", secB, yr, cseDept);
        addTT("Thursday", 6, "DAA", secB, yr, cseDept);
        addTT("Thursday", 7, "LIB", secB, yr, cseDept);
        addTT("Friday", 1, "DM", secB, yr, cseDept);
        addTT("Friday", 2, "JAVA (Practical)", secB, yr, cseDept);
        addTT("Friday", 3, "JAVA (Practical)", secB, yr, cseDept);
        addTT("Friday", 4, "DBMS", secB, yr, cseDept);
        addTT("Friday", 5, "DAA LAB", secB, yr, cseDept);
        addTT("Friday", 6, "DAA LAB", secB, yr, cseDept);
        addTT("Friday", 7, "AIML", secB, yr, cseDept);
        addTT("Saturday", 1, "UHV", secB, yr, cseDept);
        addTT("Saturday", 2, "CoE", secB, yr, cseDept);
        addTT("Saturday", 3, "CoE", secB, yr, cseDept);
        addTT("Saturday", 4, "CoE", secB, yr, cseDept);
        addTT("Saturday", 5, "DM-T", secB, yr, cseDept);
        addTT("Saturday", 6, "JAVA", secB, yr, cseDept);
        addTT("Saturday", 7, "TWM", secB, yr, cseDept);

        // SECTION II CSE C
        Section secC = sectionRepository.findBySectionName("II CSE C").orElseGet(() -> sectionRepository.save(new Section("II CSE C", cseCourse, 3, 60)));
        addTT("Monday", 1, "DAA LAB", secC, yr, cseDept);
        addTT("Monday", 2, "DAA LAB", secC, yr, cseDept);
        addTT("Monday", 3, "DBMS", secC, yr, cseDept);
        addTT("Monday", 4, "DM", secC, yr, cseDept);
        addTT("Monday", 5, "DAA", secC, yr, cseDept);
        addTT("Monday", 6, "SE", secC, yr, cseDept);
        addTT("Monday", 7, "DM-T", secC, yr, cseDept);
        addTT("Tuesday", 1, "DM", secC, yr, cseDept);
        addTT("Tuesday", 2, "DM", secC, yr, cseDept);
        addTT("Tuesday", 3, "ALT", secC, yr, cseDept);
        addTT("Tuesday", 4, "ALT", secC, yr, cseDept);
        addTT("Tuesday", 5, "JAVA (Practical)", secC, yr, cseDept);
        addTT("Tuesday", 6, "JAVA (Practical)", secC, yr, cseDept);
        addTT("Tuesday", 7, "SS", secC, yr, cseDept);
        addTT("Wednesday", 1, "SE LAB", secC, yr, cseDept);
        addTT("Wednesday", 2, "SE LAB", secC, yr, cseDept);
        addTT("Wednesday", 3, "DM", secC, yr, cseDept);
        addTT("Wednesday", 4, "AIML", secC, yr, cseDept);
        addTT("Wednesday", 5, "DAA LAB", secC, yr, cseDept);
        addTT("Wednesday", 6, "DAA LAB", secC, yr, cseDept);
        addTT("Wednesday", 7, "DBMS", secC, yr, cseDept);
        addTT("Thursday", 1, "JAVA", secC, yr, cseDept);
        addTT("Thursday", 2, "DBMS", secC, yr, cseDept);
        addTT("Thursday", 3, "DAA", secC, yr, cseDept);
        addTT("Thursday", 4, "AIML", secC, yr, cseDept);
        addTT("Thursday", 5, "DBMS", secC, yr, cseDept);
        addTT("Thursday", 6, "AIML (Project)", secC, yr, cseDept);
        addTT("Thursday", 7, "AIML (Project)", secC, yr, cseDept);
        addTT("Friday", 1, "JAVA", secC, yr, cseDept);
        addTT("Friday", 2, "AIML (Practical)", secC, yr, cseDept);
        addTT("Friday", 3, "AIML (Practical)", secC, yr, cseDept);
        addTT("Friday", 4, "DAA", secC, yr, cseDept);
        addTT("Friday", 5, "DBMS LAB", secC, yr, cseDept);
        addTT("Friday", 6, "DBMS LAB", secC, yr, cseDept);
        addTT("Friday", 7, "DBMS LAB", secC, yr, cseDept);
        addTT("Saturday", 1, "UHV", secC, yr, cseDept);
        addTT("Saturday", 2, "CoE", secC, yr, cseDept);
        addTT("Saturday", 3, "CoE", secC, yr, cseDept);
        addTT("Saturday", 4, "CoE", secC, yr, cseDept);
        addTT("Saturday", 5, "TWM", secC, yr, cseDept);
        addTT("Saturday", 6, "JAVA", secC, yr, cseDept);
        addTT("Saturday", 7, "LIB", secC, yr, cseDept);

        // SECTION II CSE D
        Section secD = sectionRepository.findBySectionName("II CSE D").orElseGet(() -> sectionRepository.save(new Section("II CSE D", cseCourse, 3, 60)));
        addTT("Monday", 1, "DM", secD, yr, cseDept);
        addTT("Monday", 2, "DBMS", secD, yr, cseDept);
        addTT("Monday", 3, "SE LAB", secD, yr, cseDept);
        addTT("Monday", 4, "SE LAB", secD, yr, cseDept);
        addTT("Monday", 5, "DAA", secD, yr, cseDept);
        addTT("Monday", 6, "DM", secD, yr, cseDept);
        addTT("Monday", 7, "DBMS", secD, yr, cseDept);
        addTT("Tuesday", 1, "DAA LAB", secD, yr, cseDept);
        addTT("Tuesday", 2, "DAA LAB", secD, yr, cseDept);
        addTT("Tuesday", 3, "DM", secD, yr, cseDept);
        addTT("Tuesday", 4, "JAVA", secD, yr, cseDept);
        addTT("Tuesday", 5, "SS", secD, yr, cseDept);
        addTT("Tuesday", 6, "SE", secD, yr, cseDept);
        addTT("Tuesday", 7, "DAA", secD, yr, cseDept);
        addTT("Wednesday", 1, "JAVA", secD, yr, cseDept);
        addTT("Wednesday", 2, "AIML", secD, yr, cseDept);
        addTT("Wednesday", 3, "JAVA (Practical)", secD, yr, cseDept);
        addTT("Wednesday", 4, "JAVA (Practical)", secD, yr, cseDept);
        addTT("Wednesday", 5, "DM", secD, yr, cseDept);
        addTT("Wednesday", 6, "AIML (Practical)", secD, yr, cseDept);
        addTT("Wednesday", 7, "AIML (Practical)", secD, yr, cseDept);
        addTT("Thursday", 1, "AIML", secD, yr, cseDept);
        addTT("Thursday", 2, "DBMS LAB", secD, yr, cseDept);
        addTT("Thursday", 3, "DBMS LAB", secD, yr, cseDept);
        addTT("Thursday", 4, "DBMS LAB", secD, yr, cseDept);
        addTT("Thursday", 5, "JAVA", secD, yr, cseDept);
        addTT("Thursday", 6, "DAA LAB", secD, yr, cseDept);
        addTT("Thursday", 7, "DAA LAB", secD, yr, cseDept);
        addTT("Friday", 1, "DAA", secD, yr, cseDept);
        addTT("Friday", 2, "DM", secD, yr, cseDept);
        addTT("Friday", 3, "ALT", secD, yr, cseDept);
        addTT("Friday", 4, "ALT", secD, yr, cseDept);
        addTT("Friday", 5, "DBMS", secD, yr, cseDept);
        addTT("Friday", 6, "AIML (Project)", secD, yr, cseDept);
        addTT("Friday", 7, "AIML (Project)", secD, yr, cseDept);
        addTT("Saturday", 1, "UHV", secD, yr, cseDept);
        addTT("Saturday", 2, "CoE", secD, yr, cseDept);
        addTT("Saturday", 3, "CoE", secD, yr, cseDept);
        addTT("Saturday", 4, "CoE", secD, yr, cseDept);
        addTT("Saturday", 5, "DBMS", secD, yr, cseDept);
        addTT("Saturday", 6, "LIB", secD, yr, cseDept);
        addTT("Saturday", 7, "TWM", secD, yr, cseDept);

        // SECTION II M.E. CSE
        // PW Slots from the uploaded timetable
        addTT("Monday", 4, "PW", secMeCse, yr, cseDept);
        addTT("Monday", 7, "PW", secMeCse, yr, cseDept);
        addTT("Tuesday", 2, "PW", secMeCse, yr, cseDept);
        addTT("Tuesday", 7, "PW", secMeCse, yr, cseDept);
        addTT("Wednesday", 2, "PW", secMeCse, yr, cseDept);
        addTT("Wednesday", 7, "PW", secMeCse, yr, cseDept);
        addTT("Thursday", 4, "PW", secMeCse, yr, cseDept);
        addTT("Thursday", 6, "PW", secMeCse, yr, cseDept);
        addTT("Friday", 4, "PW", secMeCse, yr, cseDept);
        addTT("Friday", 6, "PW", secMeCse, yr, cseDept);
        addTT("Friday", 7, "PW", secMeCse, yr, cseDept);
        addTT("Saturday", 1, "PW", secMeCse, yr, cseDept);
        addTT("Saturday", 3, "PW", secMeCse, yr, cseDept);
        addTT("Saturday", 4, "PW", secMeCse, yr, cseDept);
        addTT("Saturday", 7, "PW", secMeCse, yr, cseDept);

        // Create Student Users
        createTestStudent("studenta", "studentA", "A", "studenta@sece.ac.in", cseDept, cseCourse, secA);
        createTestStudent("studentb", "studentB", "B", "studentb@sece.ac.in", cseDept, cseCourse, secB);
        createTestStudent("studentc", "studentC", "C", "studentc@sece.ac.in", cseDept, cseCourse, secC);
        createTestStudent("studentd", "studentD", "D", "studentd@sece.ac.in", cseDept, cseCourse, secD);

        System.out.println(">>> SRI ESHWAR COLLEGE TIME TABLE GENERATOR INITIALIZATION COMPLETED!");
    }

    private void addTT(String day, int slotIndex, String subjectName, Section section, String yr, Department dept) {
        TimeSlot ts = timeSlotRepository.findById((long) slotIndex).orElseThrow();
        Subject subject = subjectRepository.findAll().stream()
                .filter(s -> s.getSubjectName().contains("(" + subjectName + ")") || s.getSubjectName().contains(subjectName))
                .findFirst()
                .orElseGet(() -> subjectRepository.save(new Subject("NEW_" + subjectName.replaceAll("\\s+",""), subjectName, dept, null, 3, 3, 3, SubjectType.THEORY)));
        Teacher teacher = subject.getAssignedTeacher();
        if (teacher == null) {
            teacher = teacherRepository.findAll().get(0); // Fallback to first teacher to avoid DB constraint violation
        }
        timetableRepository.save(new TimetableEntry(day, ts, subject, teacher, null, null, section, 3, yr));
    }

    private void createTestStudent(String username, String firstName, String lastName, String email, Department dept, Course course, Section section) {
        if (!userRepository.existsByUsername(username)) {
            User u = userRepository.save(new User(username, passwordEncoder.encode("student123"), Role.ROLE_STUDENT, email, true));
            studentRepository.save(new Student(username.toUpperCase(), firstName, lastName, email, email, dept, course, section, 3, u));
        }
    }
}
