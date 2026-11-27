package com.smarttimetable;

import com.smarttimetable.entity.*;
import com.smarttimetable.repository.*;
import com.smarttimetable.security.CustomUserDetailsService;
import com.smarttimetable.security.JwtUtil;
import com.smarttimetable.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:temp_tt_suite;MODE=MySQL;DATABASE_TO_LOWER=TRUE;CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1",
        "app.timezone=Asia/Kolkata",
        "app.email.provider=AUTO",
        "app.email.brevo.api-key=",
        "spring.mail.host="
})
@Transactional
class TemporaryTimetableAndEmailTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private TemporaryTimetableService tempService;
    @Autowired private EmailSubscriptionService subscriptionService;
    @Autowired private EmailNotificationService emailService;
    @Autowired private TemporaryTimetableChangeRepository changeRepo;
    @Autowired private TemporaryChangeAuditLogRepository auditRepo;
    @Autowired private EmailSubscriptionRepository subscriptionRepo;
    @Autowired private EmailNotificationLogRepository emailLogRepo;
    @Autowired private DepartmentRepository deptRepo;
    @Autowired private CourseRepository courseRepo;
    @Autowired private SectionRepository sectionRepo;
    @Autowired private SubjectRepository subjectRepo;
    @Autowired private TeacherRepository teacherRepo;
    @Autowired private FacultyLeaveRepository facultyLeaveRepo;
    @Autowired private CoverageRequestRepository coverageRequestRepo;
    @Autowired private SubstitutionRepository substitutionRepo;
    @Autowired private ClassroomRepository classroomRepo;
    @Autowired private TimeSlotRepository slotRepo;
    @Autowired private TimetableRepository timetableRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private StudentRepository studentRepo;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private CustomUserDetailsService userDetailsService;

    private User adminUser, fac1User, fac2User, stu1User, stu2User;
    private Section secA, secB;
    private Teacher fac1, fac2;
    private Subject subjJava, subjDbms;
    private LocalDate nextMonday, followingMonday;

    @BeforeEach
    void setupFixtures() {
        Department dept = deptRepo.save(new Department("ZZC", "Test Computer Dept"));
        Course course = courseRepo.save(new Course("BTECH-ZZC", "B.Tech Test CSE", dept));
        secA = sectionRepo.save(new Section("II ZZC A", course, 3, 60, 2024, 2028, 2, "A"));
        secB = sectionRepo.save(new Section("II ZZC B", course, 3, 60, 2024, 2028, 2, "B"));

        adminUser = userRepo.save(new User("test_admin_zz", passwordEncoder.encode("pass123"), Role.ROLE_ADMIN, "admin_zz@test.edu", true));
        fac1User = userRepo.save(new User("test_fac1_zz", passwordEncoder.encode("pass123"), Role.ROLE_FACULTY, "fac1_zz@test.edu", true));
        fac2User = userRepo.save(new User("test_fac2_zz", passwordEncoder.encode("pass123"), Role.ROLE_FACULTY, "fac2_zz@test.edu", true));
        stu1User = userRepo.save(new User("test_stu1_zz", passwordEncoder.encode("pass123"), Role.ROLE_STUDENT, "stu1_zz@test.edu", true));
        stu2User = userRepo.save(new User("test_stu2_zz", passwordEncoder.encode("pass123"), Role.ROLE_STUDENT, "stu2_zz@test.edu", true));

        fac1 = new Teacher();
        fac1.setEmployeeId("EMPZZ1");
        fac1.setFirstName("Kumar");
        fac1.setLastName("R");
        fac1.setDisplayName("Mr. Kumar");
        fac1.setPersonalEmail("fac1_zz@personal.test");
        fac1.setCollegeEmail("fac1_zz@college.test");
        fac1.setPhone1("+91 98765 43210");
        fac1.setDepartment(dept);
        fac1.setUser(fac1User);
        fac1 = teacherRepo.save(fac1);

        fac2 = new Teacher();
        fac2.setEmployeeId("EMPZZ2");
        fac2.setFirstName("Priya");
        fac2.setLastName("S");
        fac2.setDisplayName("Ms. Priya");
        fac2.setPersonalEmail("fac2_zz@personal.test");
        fac2.setCollegeEmail("fac2_zz@college.test");
        fac2.setDepartment(dept);
        fac2.setUser(fac2User);
        fac2 = teacherRepo.save(fac2);

        Student st1 = new Student("ZZ001", "Arun", "K", "stu1_zz@test.edu", "stu1_zz@college.edu", dept, course, secA, 3, stu1User);
        st1.setPhone("9876543210");
        studentRepo.save(st1);
        Student st2 = new Student("ZZ002", "Bala", "M", "stu2_zz@test.edu", "stu2_zz@college.edu", dept, course, secB, 3, stu2User);
        studentRepo.save(st2);

        subjJava = new Subject();
        subjJava.setSubjectCode("ZZJAVA");
        subjJava.setSubjectName("Java Programming");
        subjJava.setDepartment(dept);
        subjJava.setSemester(3);
        subjJava.setType(SubjectType.THEORY);
        subjJava = subjectRepo.save(subjJava);

        subjDbms = new Subject();
        subjDbms.setSubjectCode("ZZDBMS");
        subjDbms.setSubjectName("Database Management Systems");
        subjDbms.setDepartment(dept);
        subjDbms.setSemester(3);
        subjDbms.setType(SubjectType.THEORY);
        subjDbms = subjectRepo.save(subjDbms);

        Classroom room101 = new Classroom();
        room101.setRoomNumber("ZZ-101");
        room101.setBuilding("Main");
        room101.setCapacity(60);
        room101 = classroomRepo.save(room101);

        Classroom room204 = new Classroom();
        room204.setRoomNumber("ZZ-204");
        room204.setBuilding("Block B");
        room204.setCapacity(60);
        room204 = classroomRepo.save(room204);

        TimeSlot p3 = slotRepo.findAll().stream().filter(s -> Objects.equals(s.getSlotNumber(), 3)).findFirst()
                .orElseGet(() -> slotRepo.save(new TimeSlot(3, "11:00", "12:00")));

        TimetableEntry entryA = new TimetableEntry();
        entryA.setSection(secA);
        entryA.setDay("Monday");
        entryA.setTimeSlot(p3);
        entryA.setSubject(subjJava);
        entryA.setTeacher(fac1);
        entryA.setAssignedFaculty("Mr. Kumar");
        entryA.setClassroom(room101);
        entryA.setAssignedVenue("ZZ-101");
        entryA.setSemester(3);
        timetableRepo.save(entryA);

        TimetableEntry entryB = new TimetableEntry();
        entryB.setSection(secB);
        entryB.setDay("Monday");
        entryB.setTimeSlot(p3);
        entryB.setSubject(subjDbms);
        entryB.setTeacher(fac2);
        entryB.setAssignedFaculty("Ms. Priya");
        entryB.setClassroom(room204);
        entryB.setAssignedVenue("ZZ-204");
        entryB.setSemester(3);
        timetableRepo.save(entryB);

        nextMonday = LocalDate.now(tempService.getCollegeZone()).with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        followingMonday = nextMonday.plusWeeks(1);
    }

    @Test
    void testDateSpecificOverridesPreservePermanentAndApplyToAllChangeTypes() {
        // 1. Subject Change on nextMonday P3 -> DBMS (only on nextMonday, followingMonday shows Java)
        Map<String, Object> req1 = Map.of(
                "changeType", "SUBJECT_CHANGE",
                "sectionId", secA.getId(),
                "startDate", nextMonday.toString(),
                "endDate", nextMonday.toString(),
                "periodNumber", 3,
                "updatedSubjectName", "Database Management Systems",
                "reason", "Guest lecture module",
                "publishNow", true
        );
        List<Map<String, Object>> created = tempService.createChanges(req1, adminUser, false);
        assertThat(created).hasSize(1);
        Long changeId = Long.valueOf(created.get(0).get("id").toString());

        // Verify permanent timetable DB row stays Java Programming
        List<TimetableEntry> permEntries = timetableRepo.findBySectionId(secA.getId());
        assertThat(permEntries).hasSize(1);
        assertThat(permEntries.get(0).getSubject().getSubjectName()).isEqualTo("Java Programming");

        // On nextMonday, P3 shows Database Management Systems with TEMPORARY CHANGE badge
        Map<String, Object> effTarget = tempService.getEffectiveSectionTimetable(secA.getId(), nextMonday, 3);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> targetSlots = (List<Map<String, Object>>) effTarget.get("slots");
        Map<String, Object> p3Target = targetSlots.stream().filter(s -> Objects.equals(s.get("periodNumber"), 3)).findFirst().orElseThrow();
        assertThat(p3Target.get("effectiveSubject")).isEqualTo("Database Management Systems");
        assertThat(p3Target.get("badgeType")).isEqualTo("TEMPORARY CHANGE");
        assertThat(p3Target.get("isTemporaryOverride")).isEqualTo(true);

        // On followingMonday, P3 shows original Java Programming (PERMANENT)
        Map<String, Object> effOther = tempService.getEffectiveSectionTimetable(secA.getId(), followingMonday, 3);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> otherSlots = (List<Map<String, Object>>) effOther.get("slots");
        Map<String, Object> p3Other = otherSlots.stream().filter(s -> Objects.equals(s.get("periodNumber"), 3)).findFirst().orElseThrow();
        assertThat(p3Other.get("effectiveSubject")).isEqualTo("Java Programming");
        assertThat(p3Other.get("badgeType")).isEqualTo("PERMANENT");
        assertThat(p3Other.get("isTemporaryOverride")).isEqualTo(false);

        // 2. Cancel that change and verify permanent slot immediately restored
        tempService.cancelChange(changeId, adminUser, "Reverted");
        Map<String, Object> effAfterCancel = tempService.getEffectiveSectionTimetable(secA.getId(), nextMonday, 3);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cancelSlots = (List<Map<String, Object>>) effAfterCancel.get("slots");
        Map<String, Object> p3AfterCancel = cancelSlots.stream().filter(s -> Objects.equals(s.get("periodNumber"), 3)).findFirst().orElseThrow();
        assertThat(p3AfterCancel.get("effectiveSubject")).isEqualTo("Java Programming");
        assertThat(p3AfterCancel.get("badgeType")).isEqualTo("PERMANENT");

        // 3. Period cancellation, Room change, Extra class & Multi-date creation
        LocalDate tuesday = nextMonday.plusDays(1);
        tempService.createChanges(Map.of(
                "changeType", "PERIOD_CANCELLATION",
                "sectionId", secA.getId(),
                "startDate", tuesday.toString(),
                "endDate", tuesday.toString(),
                "periodNumber", 3,
                "reason", "Holiday event",
                "publishNow", true
        ), adminUser, false);

        tempService.createChanges(Map.of(
                "changeType", "EXTRA_CLASS",
                "sectionId", secA.getId(),
                "dates", List.of(tuesday.toString(), tuesday.plusDays(1).toString()),
                "periodNumber", 8,
                "updatedSubjectName", "Extra Placement Coding",
                "updatedVenueName", "LH-EXTRA",
                "reason", "Extra placement prep",
                "publishNow", true
        ), adminUser, false);

        Map<String, Object> effTue = tempService.getEffectiveSectionTimetable(secA.getId(), tuesday, 3);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> tueSlots = (List<Map<String, Object>>) effTue.get("slots");
        assertThat(tueSlots.stream().filter(s -> Objects.equals(s.get("periodNumber"), 3)).findFirst().orElseThrow().get("badgeType")).isEqualTo("CANCELLED");
        assertThat(tueSlots.stream().filter(s -> Objects.equals(s.get("periodNumber"), 8)).findFirst().orElseThrow().get("badgeType")).isEqualTo("EXTRA CLASS");
    }

    @Test
    void testConflictPreventionForSectionFacultyAndClassroom() {
        // Publish a room change on secA P4
        LocalDate thu = nextMonday.plusDays(3);
        tempService.createChanges(Map.of(
                "changeType", "CLASSROOM_CHANGE",
                "sectionId", secA.getId(),
                "startDate", thu.toString(),
                "endDate", thu.toString(),
                "periodNumber", 4,
                "updatedVenueName", "SEMINAR-99",
                "reason", "Project demo",
                "publishNow", true
        ), adminUser, false);

        // 1. Overlapping temporary change on same section/date/period must fail with ConflictException
        assertThatThrownBy(() -> tempService.createChanges(Map.of(
                "changeType", "FREE_PERIOD",
                "sectionId", secA.getId(),
                "startDate", thu.toString(),
                "endDate", thu.toString(),
                "periodNumber", 4,
                "reason", "Duplicate",
                "publishNow", true
        ), adminUser, false)).isInstanceOf(TemporaryTimetableService.ConflictException.class);

        // 2. Room double-booking on different section same date & period must fail
        assertThatThrownBy(() -> tempService.createChanges(Map.of(
                "changeType", "CLASSROOM_CHANGE",
                "sectionId", secB.getId(),
                "startDate", thu.toString(),
                "endDate", thu.toString(),
                "periodNumber", 4,
                "updatedVenueName", "SEMINAR-99",
                "reason", "Clash room",
                "publishNow", true
        ), adminUser, false)).isInstanceOf(TemporaryTimetableService.ConflictException.class);

        // 3. Faculty double-booking against Ms. Priya's permanent Monday P3 class in secB must fail when assigning her to secA Monday P3
        assertThatThrownBy(() -> tempService.createChanges(Map.of(
                "changeType", "FACULTY_SUBSTITUTION",
                "sectionId", secA.getId(),
                "startDate", nextMonday.toString(),
                "endDate", nextMonday.toString(),
                "periodNumber", 3,
                "replacementFacultyName", "Ms. Priya",
                "reason", "Substitution clash",
                "publishNow", true
        ), adminUser, false)).isInstanceOf(TemporaryTimetableService.ConflictException.class);
    }

    @Test
    void testOtpVerificationAndDuplicateNotificationPrevention() {
        // 1. Invalid email rejected
        assertThatThrownBy(() -> subscriptionService.registerOrSendOtp(stu1User, "not-an-email"))
                .isInstanceOf(IllegalArgumentException.class);

        // 2. Register email & verify OTP guards (wrong OTP, resend cooldown, expiration, valid OTP)
        subscriptionService.registerOrSendOtp(stu1User, "stu1_verified@test.edu");
        // Cooldown immediately active
        assertThatThrownBy(() -> subscriptionService.registerOrSendOtp(stu1User, "stu1_verified@test.edu"))
                .isInstanceOf(IllegalStateException.class);

        // Force known OTP directly on subscription for deterministic attempt & expiry verification
        EmailSubscription sub1 = subscriptionRepo.findByUserId(stu1User.getId()).orElseThrow();
        sub1.setOtpCodeHash(subscriptionService.hashOtp("stu1_verified@test.edu", "123456"));
        sub1.setOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
        subscriptionRepo.save(sub1);

        // Wrong OTP decrements remaining attempts
        assertThatThrownBy(() -> subscriptionService.verifyOtp(stu1User, "000000"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("4 attempt(s) remaining");

        // Expired OTP fails cleanly
        sub1.setOtpExpiresAt(LocalDateTime.now().minusMinutes(1));
        subscriptionRepo.save(sub1);
        assertThatThrownBy(() -> subscriptionService.verifyOtp(stu1User, "123456"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expired");

        // Restore valid expiry & verify
        sub1.setOtpExpiresAt(LocalDateTime.now().plusMinutes(5));
        subscriptionRepo.save(sub1);
        Map<String, Object> verifiedRes = subscriptionService.verifyOtp(stu1User, "123456");
        assertThat(verifiedRes.get("verified")).isEqualTo(true);

        // Also mark fac1 & fac2 verified so we confirm both faculty + section student receive notifications (stu2 is in secB -> excluded!)
        for (Map.Entry<User, String> entry : List.of(
                Map.entry(fac1User, "kumar_fac1@test.edu"),
                Map.entry(fac2User, "priya_fac2@test.edu"),
                Map.entry(stu2User, "stu2_othersec@test.edu"))) {
            EmailSubscription s = new EmailSubscription();
            s.setUser(entry.getKey());
            s.setEmail(entry.getValue());
            s.setVerified(true);
            s.setNotificationsEnabled(true);
            subscriptionRepo.save(s);
        }

        // Create draft (no emails logged!)
        List<Map<String, Object>> draft = tempService.createChanges(Map.of(
                "changeType", "FACULTY_SUBSTITUTION",
                "sectionId", secA.getId(),
                "startDate", nextMonday.plusDays(4).toString(),
                "endDate", nextMonday.plusDays(4).toString(),
                "periodNumber", 5,
                "originalFacultyName", "Mr. Kumar",
                "replacementFacultyName", "Ms. Priya",
                "reason", "Faculty Substitution Test",
                "publishNow", false
        ), adminUser, false);
        Long subChangeId = Long.valueOf(draft.get(0).get("id").toString());
        assertThat(emailLogRepo.findByTemporaryChangeIdOrderBySentAtDesc(subChangeId)).isEmpty();

        // Dispatch sync for PUBLISHED event -> stu1 + fac1 + fac2 notified (3 emails, stu2 excluded!)
        TemporaryTimetableChange entity = changeRepo.findById(subChangeId).orElseThrow();
        entity.setStatus(TemporaryChangeStatus.PUBLISHED);
        entity = changeRepo.save(entity);
        int sentFirst = emailService.dispatchTemporaryChangeEmailsSync(entity, "TEMP_CHANGE_PUBLISHED", entity.getRevision());
        assertThat(sentFirst).isEqualTo(3);

        List<EmailNotificationLog> logs = emailLogRepo.findByTemporaryChangeIdOrderBySentAtDesc(subChangeId);
        assertThat(logs).extracting(EmailNotificationLog::getEmail)
                .containsExactlyInAnyOrder("stu1_verified@test.edu", "kumar_fac1@test.edu", "priya_fac2@test.edu")
                .doesNotContain("stu2_othersec@test.edu");

        // Calling dispatch again with SAME event & revision sends 0 duplicates!
        int sentDuplicate = emailService.dispatchTemporaryChangeEmailsSync(entity, "TEMP_CHANGE_PUBLISHED", entity.getRevision());
        assertThat(sentDuplicate).isEqualTo(0);
    }

    @Test
    void testAutomaticExpirationPreservesHistoricalRecord() {
        LocalDate pastDate = tempService.collegeToday().minusDays(2);
        TemporaryTimetableChange past = new TemporaryTimetableChange();
        past.setSection(secA);
        past.setSectionName(secA.getSectionName());
        past.setChangeType(TemporaryChangeType.SUBJECT_CHANGE);
        past.setChangeDate(pastDate);
        past.setStartDate(pastDate);
        past.setEndDate(pastDate);
        past.setDayOfWeek(pastDate.getDayOfWeek().name());
        past.setPeriodNumber(3);
        past.setOriginalSubjectName("Java Programming");
        past.setUpdatedSubjectName("Old Expired Subject");
        past.setReason("Expired change");
        past.setStatus(TemporaryChangeStatus.PUBLISHED);
        past.setRevision(1);
        past = changeRepo.save(past);

        int swept = tempService.expirePastPublishedChanges(tempService.collegeToday());
        assertThat(swept).isGreaterThanOrEqualTo(1);

        TemporaryTimetableChange reloaded = changeRepo.findById(past.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(TemporaryChangeStatus.EXPIRED);
        assertThat(reloaded.getExpiredAt()).isNotNull();
        assertThat(auditRepo.findByTemporaryChangeIdOrderByCreatedAtDesc(past.getId()))
                .extracting(TemporaryChangeAuditLog::getActionType)
                .contains("EXPIRED");
    }

    @Test
    void testRbacBlocksUnauthorizedAdminPublishAndIsolatesStudentView() throws Exception {
        String stuJwt = jwtUtil.generateToken(userDetailsService.loadUserByUsername("test_stu1_zz"), "ROLE_STUDENT");
        String body = String.format("{\"changeType\":\"FREE_PERIOD\",\"sectionId\":%d,\"startDate\":\"%s\",\"periodNumber\":3,\"reason\":\"Hack\"}",
                secA.getId(), nextMonday.toString());

        // Student cannot create/publish temp changes
        mockMvc.perform(post("/api/temp-timetable")
                        .header("Authorization", "Bearer " + stuJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());

        // Student effective view ignores foreign sectionId=secB and returns strictly stu1's secA
        mockMvc.perform(get("/api/temp-timetable/effective")
                        .header("Authorization", "Bearer " + stuJwt)
                        .param("sectionId", String.valueOf(secB.getId()))
                        .param("date", nextMonday.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sectionName").value("II ZZC A"));
    }

    @Test
    void testFacultyRequestCreatesPendingApprovalNotDirectPublish() throws Exception {
        String facJwt = jwtUtil.generateToken(userDetailsService.loadUserByUsername("test_fac1_zz"), "ROLE_FACULTY");
        String body = String.format("{\"changeType\":\"FACULTY_SUBSTITUTION\",\"sectionId\":%d,\"startDate\":\"%s\",\"periodNumber\":2,\"replacementFacultyName\":\"Ms. Priya\",\"reason\":\"Workshop\"}",
                secA.getId(), nextMonday.toString());

        // Direct publish endpoint rejected for faculty
        mockMvc.perform(post("/api/temp-timetable")
                        .header("Authorization", "Bearer " + facJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());

        // Faculty request endpoint creates PENDING_APPROVAL record awaiting admin
        mockMvc.perform(post("/api/temp-timetable/faculty-request")
                        .header("Authorization", "Bearer " + facJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.changes[0].status").value("PENDING_APPROVAL"));
    }

    @Test
    void testAdminApiLifecycleAndEmailSubscriptionEndpoints() throws Exception {
        String adminJwt = jwtUtil.generateToken(userDetailsService.loadUserByUsername("test_admin_zz"), "ROLE_ADMIN");
        String stuJwt = jwtUtil.generateToken(userDetailsService.loadUserByUsername("test_stu1_zz"), "ROLE_STUDENT");

        // Admin creates draft, then publishes, then receives 409 conflict on overlap, then cancels cleanly
        String createBody = String.format(
                "{\"changeType\":\"PERIOD_TIME_CHANGE\",\"sectionId\":%d,\"startDate\":\"%s\",\"periodNumber\":6,\"updatedStartTime\":\"14:35\",\"updatedEndTime\":\"15:25\",\"reason\":\"Exam briefing\",\"publishNow\":true}",
                secA.getId(), nextMonday.plusDays(2).toString());

        mockMvc.perform(post("/api/temp-timetable")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.changes[0].status").value("PUBLISHED"));

        // Duplicate same slot returns HTTP 409 Conflict
        mockMvc.perform(post("/api/temp-timetable")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isConflict());

        // Admin overview returns stats & changes
        mockMvc.perform(get("/api/temp-timetable/admin/overview")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.published").isNumber());

        // Email subscription endpoints for student
        mockMvc.perform(post("/api/email-subscriptions/send-otp")
                        .header("Authorization", "Bearer " + stuJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"student_mvc_zz@test.edu\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(false));

        mockMvc.perform(get("/api/email-subscriptions/me")
                        .header("Authorization", "Bearer " + stuJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("student_mvc_zz@test.edu"));
    }

    @Test
    void testFacultySelfOnlyLeaveSubstitutionAndClassStudentOnlyEmails() throws Exception {
        // Verify student in secA and student in secB + fac1 & fac2
        for (Map.Entry<User, String> entry : List.of(
                Map.entry(stu1User, "stu1_secA_zz@test.edu"),
                Map.entry(stu2User, "stu2_secB_zz@test.edu"),
                Map.entry(fac1User, "fac1_zz_email@test.edu"),
                Map.entry(fac2User, "fac2_zz_email@test.edu"))) {
            EmailSubscription s = new EmailSubscription();
            s.setUser(entry.getKey());
            s.setEmail(entry.getValue());
            s.setVerified(true);
            s.setNotificationsEnabled(true);
            subscriptionRepo.save(s);
        }

        String fac1Jwt = jwtUtil.generateToken(userDetailsService.loadUserByUsername("test_fac1_zz"), "ROLE_FACULTY");

        // 1. Faculty 1 CANNOT submit leave/substitution for Faculty 2 ("Ms. Priya")
        String spoofSubPayload = String.format(
                "{\"eventType\":\"SUBSTITUTION\",\"sectionName\":\"%s\",\"date\":\"2026-11-30\",\"day\":\"Monday\",\"periodNumber\":1,\"subject\":\"DBMS\",\"venue\":\"FF 04\",\"originalFaculty\":\"Ms. Priya\",\"substituteFaculty\":\"Mr. Kumar\",\"reason\":\"Spoof\"}",
                secA.getSectionName());
        mockMvc.perform(post("/api/operations/notify-class-leave-or-sub")
                        .header("Authorization", "Bearer " + fac1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(spoofSubPayload))
                .andExpect(status().isForbidden());

        // 2. Faculty 1 CANNOT toggle Faculty 2's availability
        mockMvc.perform(post("/api/faculty-availability")
                        .header("Authorization", "Bearer " + fac1Jwt)
                        .param("teacherId", String.valueOf(fac2.getId()))
                        .param("day", "Monday")
                        .param("timeSlotId", "1")
                        .param("available", "false"))
                .andExpect(status().isForbidden());

        // 3. Faculty 1 CAN notify absence/substitution for their OWN period in secA,
        //    and ONLY secA verified students receive email (NOT secB students, NOT other faculty)
        String ownSubPayload = String.format(
                "{\"eventType\":\"SUBSTITUTION\",\"sectionName\":\"%s\",\"date\":\"2026-11-30\",\"day\":\"Monday\",\"periodNumber\":1,\"subject\":\"Java Programming\",\"venue\":\"Room 101\",\"originalFaculty\":\"Mr. Kumar\",\"substituteFaculty\":\"Ms. Priya\",\"reason\":\"Personal leave\"}",
                secA.getSectionName());
        mockMvc.perform(post("/api/operations/notify-class-leave-or-sub")
                        .header("Authorization", "Bearer " + fac1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ownSubPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sectionName").value("II ZZC A"))
                .andExpect(jsonPath("$.totalRecipients").value(1));

        List<EmailNotificationLog> classLogs = emailLogRepo.findAll().stream()
                .filter(l -> "CLASS_FACULTY_SUBSTITUTION".equals(l.getEventType()))
                .toList();
        assertThat(classLogs).hasSize(1);
        assertThat(classLogs.get(0).getEmail()).isEqualTo("stu1_seca_zz@test.edu");
    }

    @Test
    void testFacultyLeaveCoverageAndSubstitutionAreSharedWithStudentsAndOwnerProtected() throws Exception {
        String fac1Jwt = jwtUtil.generateToken(userDetailsService.loadUserByUsername("test_fac1_zz"), "ROLE_FACULTY");
        String fac2Jwt = jwtUtil.generateToken(userDetailsService.loadUserByUsername("test_fac2_zz"), "ROLE_FACULTY");
        String adminJwt = jwtUtil.generateToken(userDetailsService.loadUserByUsername("test_admin_zz"), "ROLE_ADMIN");
        String studentJwt = jwtUtil.generateToken(userDetailsService.loadUserByUsername("test_stu1_zz"), "ROLE_STUDENT");

        String leavePayload = String.format(
                "{\"teacherId\":%d,\"date\":\"%s\",\"reason\":\"Medical leave\"}",
                fac1.getId(), nextMonday);
        mockMvc.perform(post("/api/faculty-leaves")
                        .header("Authorization", "Bearer " + fac1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(leavePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.staffName").value("Mr. Kumar"))
                .andExpect(jsonPath("$.date").value(nextMonday.toString()));

        mockMvc.perform(post("/api/faculty-leaves")
                        .header("Authorization", "Bearer " + fac1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format(
                                "{\"teacherId\":%d,\"date\":\"%s\",\"reason\":\"Spoof\"}",
                                fac2.getId(), nextMonday)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/faculty-leaves")
                        .header("Authorization", "Bearer " + studentJwt)
                        .param("date", nextMonday.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].staffName").value("Mr. Kumar"));

        mockMvc.perform(get("/api/faculty-leaves")
                        .header("Authorization", "Bearer " + adminJwt)
                        .param("date", nextMonday.toString()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/timetable/teacher/" + fac1.getId())
                        .header("Authorization", "Bearer " + fac1Jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sectionName").value(secA.getSectionName()))
                .andExpect(jsonPath("$[0].slotNumber").value(3));

        mockMvc.perform(get("/api/teachers/me")
                        .header("Authorization", "Bearer " + fac1Jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(fac1.getId()))
                .andExpect(jsonPath("$.firstName").value("Kumar"))
                .andExpect(jsonPath("$.user").doesNotExist());
        mockMvc.perform(get("/api/teachers/me")
                        .header("Authorization", "Bearer " + studentJwt))
                .andExpect(status().isForbidden());

        String coveragePayload = String.format(
                "{\"date\":\"%s\",\"sectionName\":\"%s\",\"day\":\"Monday\",\"periodIndex\":2,\"subjectName\":\"Java Programming\",\"absentStaff\":\"Mr. Kumar\",\"status\":\"OPEN\"}",
                nextMonday, secA.getSectionName());
        mockMvc.perform(post("/api/operations/coverage")
                        .header("Authorization", "Bearer " + fac1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(coveragePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"));

        mockMvc.perform(get("/api/operations/coverage")
                        .header("Authorization", "Bearer " + studentJwt))
                .andExpect(status().isForbidden());

        String substitutionPayload = String.format(
                "{\"date\":\"%s\",\"sectionName\":\"%s\",\"day\":\"Monday\",\"periodIndex\":2,\"originalFaculty\":\"Mr. Kumar\",\"substituteFaculty\":\"Ms. Priya\",\"reason\":\"Medical leave\"}",
                nextMonday, secA.getSectionName());
        mockMvc.perform(post("/api/operations/substitutions")
                        .header("Authorization", "Bearer " + fac1Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(substitutionPayload))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/operations/substitutions")
                        .header("Authorization", "Bearer " + fac2Jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(substitutionPayload))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/operations/substitutions")
                        .header("Authorization", "Bearer " + studentJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sectionName").value(secA.getSectionName()))
                .andExpect(jsonPath("$[0].substituteFaculty").value("Ms. Priya"));

        assertThat(facultyLeaveRepo.findByDate(nextMonday)).hasSize(1);
        assertThat(coverageRequestRepo.findAll()).anySatisfy(request ->
                assertThat(request.getAbsentStaff()).isEqualTo("Mr. Kumar"));
        assertThat(substitutionRepo.findAll()).anySatisfy(substitution ->
                assertThat(substitution.getOriginalFaculty()).isEqualTo("Mr. Kumar"));

        Long leaveId = facultyLeaveRepo.findByDate(nextMonday).get(0).getId();
        mockMvc.perform(delete("/api/faculty-leaves/" + leaveId)
                        .header("Authorization", "Bearer " + fac2Jwt))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/faculty-leaves/" + leaveId)
                        .header("Authorization", "Bearer " + fac1Jwt))
                .andExpect(status().isNoContent());
        assertThat(facultyLeaveRepo.findByDate(nextMonday)).isEmpty();
    }

    @Test
    void passwordRecoveryRequiresRegisteredMobileAndUpdatesLoginCredentials() throws Exception {
        mockMvc.perform(post("/api/auth/verify-recovery")
                        .param("username", stu1User.getUsername())
                        .param("accountType", "STUDENT")
                        .param("mobile", "1111111111"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/reset-password/mobile")
                        .param("username", stu1User.getUsername())
                        .param("accountType", "STUDENT")
                        .param("mobile", "1111111111")
                        .param("newPassword", "freshpass1"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/verify-recovery")
                        .param("username", stu1User.getUsername())
                        .param("accountType", "STUDENT")
                        .param("mobile", "9876543210"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));

        mockMvc.perform(post("/api/auth/reset-password/mobile")
                        .param("username", stu1User.getUsername())
                        .param("accountType", "STUDENT")
                        .param("mobile", "9876543210")
                        .param("newPassword", "freshpass1"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test_stu1_zz\",\"password\":\"pass123\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test_stu1_zz\",\"password\":\"freshpass1\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void facultyRecoveryAcceptsRegisteredPhoneWithCountryCode() throws Exception {
        mockMvc.perform(post("/api/auth/verify-recovery")
                        .param("username", fac1User.getUsername())
                        .param("accountType", "FACULTY")
                        .param("mobile", "9876543210"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));

        mockMvc.perform(post("/api/auth/verify-recovery")
                        .param("username", fac1User.getUsername())
                        .param("accountType", "STUDENT")
                        .param("mobile", "9876543210"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/reset-password")
                        .param("username", fac1User.getUsername())
                        .param("email", "fac1_zz@test.edu")
                        .param("newPassword", "freshpass1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void authenticatedPasswordChangeUpdatesTheCredentialUsedForLogin() throws Exception {
        String studentJwt = jwtUtil.generateToken(
                userDetailsService.loadUserByUsername(stu1User.getUsername()), "ROLE_STUDENT");

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + studentJwt)
                        .param("currentPassword", "pass123")
                        .param("newPassword", "changedpw1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test_stu1_zz\",\"password\":\"changedpw1\"}"))
                .andExpect(status().isOk());
    }
}
