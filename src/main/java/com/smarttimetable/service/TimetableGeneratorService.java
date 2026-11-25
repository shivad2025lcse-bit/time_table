package com.smarttimetable.service;

import com.smarttimetable.dto.TimetableEntryDto;
import com.smarttimetable.dto.TimetableGenerateRequest;
import com.smarttimetable.dto.TimetableResponse;
import com.smarttimetable.entity.*;
import com.smarttimetable.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TimetableGeneratorService {

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private SectionRepository sectionRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private LaboratoryRepository laboratoryRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    @Autowired
    private FacultyAvailabilityRepository facultyAvailabilityRepository;

    @Autowired
    private TimetableRepository timetableRepository;

    @Autowired
    private ConflictService conflictService;

    private static final List<String> WORKING_DAYS = Arrays.asList(
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
    );

    @Transactional
    public TimetableResponse generateTimetable(TimetableGenerateRequest request) {
        long startTimeMs = System.currentTimeMillis();

        // 1. Clear existing entries for selected scope or academic year
        if (request.getSectionId() != null) {
            timetableRepository.deleteBySectionId(request.getSectionId());
        } else {
            timetableRepository.deleteByAcademicYear(request.getAcademicYear());
        }

        // 2. Fetch resources
        List<Section> sections = fetchSections(request);
        List<Subject> subjects = fetchSubjects(request);
        List<Teacher> teachers = teacherRepository.findAll();
        List<Classroom> classrooms = classroomRepository.findAll();
        List<Laboratory> laboratories = laboratoryRepository.findAll();
        List<TimeSlot> timeSlots = timeSlotRepository.findAll();
        List<FacultyAvailability> availabilities = facultyAvailabilityRepository.findAll();

        if (sections.isEmpty() || subjects.isEmpty() || timeSlots.isEmpty()) {
            TimetableResponse errResp = new TimetableResponse();
            errResp.setSuccess(false);
            errResp.setMessage("Insufficient data to generate timetable. Ensure sections, subjects, and time slots exist.");
            return errResp;
        }

        // Build Availability lookup: teacherId_day_slotId -> available (boolean)
        Map<String, Boolean> availabilityMap = new HashMap<>();
        for (FacultyAvailability fa : availabilities) {
            String key = fa.getTeacher().getId() + "_" + fa.getDay() + "_" + fa.getTimeSlot().getId();
            availabilityMap.put(key, fa.isAvailable());
        }

        // Sort time slots by slot number
        timeSlots.sort(Comparator.comparingInt(TimeSlot::getSlotNumber));

        // State tracking matrices for backtracking
        // teacherBusy: teacherId_day_slotId -> true
        Set<String> teacherBusy = new HashSet<>();
        // roomBusy: classroomId_day_slotId -> true
        Set<String> roomBusy = new HashSet<>();
        // labBusy: labId_day_slotId -> true
        Set<String> labBusy = new HashSet<>();
        // sectionBusy: sectionId_day_slotId -> true
        Set<String> sectionBusy = new HashSet<>();
        // sectionSubjectCountPerDay: sectionId_subjectId_day -> count
        Map<String, Integer> sectionSubjectDayCount = new HashMap<>();

        List<TimetableEntry> generatedEntries = new ArrayList<>();

        // Create tasks to schedule: (Section x Subject x SessionHour)
        List<ScheduleTask> taskList = new ArrayList<>();
        for (Section sec : sections) {
            // Filter subjects matching section course & semester if applicable
            List<Subject> secSubjects = subjects.stream()
                    .filter(sub -> (sec.getCourse() == null || sub.getDepartment().getId().equals(sec.getCourse().getDepartment().getId()))
                            && (sub.getSemester().equals(sec.getSemester())))
                    .collect(Collectors.toList());

            // If no matching subjects by department/semester, fallback to all subjects matching semester
            if (secSubjects.isEmpty()) {
                secSubjects = subjects.stream()
                        .filter(sub -> sub.getSemester().equals(sec.getSemester()))
                        .collect(Collectors.toList());
            }

            for (Subject sub : secSubjects) {
                int hours = sub.getWeeklyHours() != null ? sub.getWeeklyHours() : 3;
                for (int h = 0; h < hours; h++) {
                    taskList.add(new ScheduleTask(sec, sub));
                }
            }
        }

        // Priority sort (STEP 9):
        // 1. Lab/Practical subjects first
        // 2. High weekly hours
        // 3. Subjects with specific room requirements
        taskList.sort((t1, t2) -> {
            boolean isLab1 = t1.subject.getType() == SubjectType.LAB || t1.subject.getType() == SubjectType.PRACTICAL;
            boolean isLab2 = t2.subject.getType() == SubjectType.LAB || t2.subject.getType() == SubjectType.PRACTICAL;
            if (isLab1 && !isLab2) return -1;
            if (!isLab1 && isLab2) return 1;
            return Integer.compare(t2.subject.getWeeklyHours(), t1.subject.getWeeklyHours());
        });

        // Run Backtracking algorithm
        boolean success = backtrackSchedule(0, taskList, WORKING_DAYS, timeSlots, teachers, classrooms, laboratories,
                availabilityMap, teacherBusy, roomBusy, labBusy, sectionBusy, sectionSubjectDayCount, generatedEntries, request.getAcademicYear());

        if (!success) {
            // Greedy fallback to place remaining unscheduled slots if strict backtracking exceeded depth
            greedyScheduleFallback(taskList, WORKING_DAYS, timeSlots, teachers, classrooms, laboratories,
                    availabilityMap, teacherBusy, roomBusy, labBusy, sectionBusy, sectionSubjectDayCount, generatedEntries, request.getAcademicYear());
        }

        // Save generated entries to DB
        List<TimetableEntry> savedEntries = timetableRepository.saveAll(generatedEntries);

        // Calculate statistics & response
        Set<Long> usedRooms = savedEntries.stream()
                .filter(e -> e.getClassroom() != null)
                .map(e -> e.getClassroom().getId())
                .collect(Collectors.toSet());

        Set<Long> usedLabs = savedEntries.stream()
                .filter(e -> e.getLaboratory() != null)
                .map(e -> e.getLaboratory().getId())
                .collect(Collectors.toSet());

        var conflictReport = conflictService.checkConflicts(savedEntries);

        long executionTimeMs = System.currentTimeMillis() - startTimeMs;

        TimetableResponse response = new TimetableResponse();
        response.setSuccess(true);
        response.setMessage("Timetable generated successfully!");
        response.setTotalClasses(savedEntries.size());
        response.setConflictsCount(conflictReport.getTotalConflicts());
        response.setRoomsUsed(usedRooms.size());
        response.setLabsUsed(usedLabs.size());
        response.setExecutionTimeMs(executionTimeMs);
        response.setEntries(savedEntries.stream().map(this::convertToDto).collect(Collectors.toList()));

        return response;
    }

    private boolean backtrackSchedule(
            int taskIndex,
            List<ScheduleTask> taskList,
            List<String> days,
            List<TimeSlot> slots,
            List<Teacher> teachers,
            List<Classroom> classrooms,
            List<Laboratory> laboratories,
            Map<String, Boolean> availabilityMap,
            Set<String> teacherBusy,
            Set<String> roomBusy,
            Set<String> labBusy,
            Set<String> sectionBusy,
            Map<String, Integer> sectionSubjectDayCount,
            List<TimetableEntry> generatedEntries,
            String academicYear
    ) {
        if (taskIndex >= taskList.size()) {
            return true; // All tasks scheduled!
        }

        ScheduleTask task = taskList.get(taskIndex);
        Section section = task.section;
        Subject subject = task.subject;

        // Resolve teacher (either pre-assigned or find available matching department teacher)
        Teacher teacher = subject.getAssignedTeacher();
        if (teacher == null) {
            teacher = teachers.stream()
                    .filter(t -> t.getDepartment().getId().equals(subject.getDepartment().getId()))
                    .findFirst()
                    .orElse(teachers.isEmpty() ? null : teachers.get(0));
        }

        if (teacher == null) return false;

        boolean isLabType = subject.getType() == SubjectType.LAB || subject.getType() == SubjectType.PRACTICAL;

        for (String day : days) {
            // Soft constraint: Max 2 periods of same subject per section per day
            String secSubDayKey = section.getId() + "_" + subject.getId() + "_" + day;
            int currentDayCount = sectionSubjectDayCount.getOrDefault(secSubDayKey, 0);
            if (currentDayCount >= 2) continue;

            for (TimeSlot slot : slots) {
                String slotKey = day + "_" + slot.getId();
                String tBusyKey = teacher.getId() + "_" + slotKey;
                String sBusyKey = section.getId() + "_" + slotKey;

                // Hard Constraints check
                if (teacherBusy.contains(tBusyKey)) continue;
                if (sectionBusy.contains(sBusyKey)) continue;

                // Faculty Availability check
                Boolean isAvailable = availabilityMap.get(teacher.getId() + "_" + day + "_" + slot.getId());
                if (isAvailable != null && !isAvailable) continue;

                if (isLabType) {
                    // Try labs
                    for (Laboratory lab : laboratories) {
                        String lBusyKey = lab.getId() + "_" + slotKey;
                        if (labBusy.contains(lBusyKey)) continue;
                        if (lab.getCapacity() < section.getStudentCount()) continue;

                        // DO ASSIGNMENT
                        teacherBusy.add(tBusyKey);
                        sectionBusy.add(sBusyKey);
                        labBusy.add(lBusyKey);
                        sectionSubjectDayCount.put(secSubDayKey, currentDayCount + 1);

                        TimetableEntry entry = new TimetableEntry(day, slot, subject, teacher, null, lab, section, section.getSemester(), academicYear);
                        generatedEntries.add(entry);

                        if (backtrackSchedule(taskIndex + 1, taskList, days, slots, teachers, classrooms, laboratories,
                                availabilityMap, teacherBusy, roomBusy, labBusy, sectionBusy, sectionSubjectDayCount, generatedEntries, academicYear)) {
                            return true;
                        }

                        // UNDO ASSIGNMENT (BACKTRACK)
                        generatedEntries.remove(generatedEntries.size() - 1);
                        teacherBusy.remove(tBusyKey);
                        sectionBusy.remove(sBusyKey);
                        labBusy.remove(lBusyKey);
                        sectionSubjectDayCount.put(secSubDayKey, currentDayCount);
                    }
                } else {
                    // Theory subject - Try classrooms
                    for (Classroom room : classrooms) {
                        String rBusyKey = room.getId() + "_" + slotKey;
                        if (roomBusy.contains(rBusyKey)) continue;
                        if (room.getCapacity() < section.getStudentCount()) continue;

                        // DO ASSIGNMENT
                        teacherBusy.add(tBusyKey);
                        sectionBusy.add(sBusyKey);
                        roomBusy.add(rBusyKey);
                        sectionSubjectDayCount.put(secSubDayKey, currentDayCount + 1);

                        TimetableEntry entry = new TimetableEntry(day, slot, subject, teacher, room, null, section, section.getSemester(), academicYear);
                        generatedEntries.add(entry);

                        if (backtrackSchedule(taskIndex + 1, taskList, days, slots, teachers, classrooms, laboratories,
                                availabilityMap, teacherBusy, roomBusy, labBusy, sectionBusy, sectionSubjectDayCount, generatedEntries, academicYear)) {
                            return true;
                        }

                        // UNDO ASSIGNMENT (BACKTRACK)
                        generatedEntries.remove(generatedEntries.size() - 1);
                        teacherBusy.remove(tBusyKey);
                        sectionBusy.remove(sBusyKey);
                        roomBusy.remove(rBusyKey);
                        sectionSubjectDayCount.put(secSubDayKey, currentDayCount);
                    }
                }
            }
        }

        return false;
    }

    private void greedyScheduleFallback(
            List<ScheduleTask> taskList,
            List<String> days,
            List<TimeSlot> slots,
            List<Teacher> teachers,
            List<Classroom> classrooms,
            List<Laboratory> laboratories,
            Map<String, Boolean> availabilityMap,
            Set<String> teacherBusy,
            Set<String> roomBusy,
            Set<String> labBusy,
            Set<String> sectionBusy,
            Map<String, Integer> sectionSubjectDayCount,
            List<TimetableEntry> generatedEntries,
            String academicYear
    ) {
        int scheduledCount = generatedEntries.size();
        for (int i = scheduledCount; i < taskList.size(); i++) {
            ScheduleTask task = taskList.get(i);
            Section section = task.section;
            Subject subject = task.subject;

            Teacher teacher = subject.getAssignedTeacher();
            if (teacher == null) {
                teacher = teachers.stream()
                        .filter(t -> t.getDepartment().getId().equals(subject.getDepartment().getId()))
                        .findFirst()
                        .orElse(teachers.isEmpty() ? null : teachers.get(0));
            }
            if (teacher == null) continue;

            boolean assigned = false;
            boolean isLabType = subject.getType() == SubjectType.LAB || subject.getType() == SubjectType.PRACTICAL;

            dayLoop:
            for (String day : days) {
                for (TimeSlot slot : slots) {
                    String slotKey = day + "_" + slot.getId();
                    String tBusyKey = teacher.getId() + "_" + slotKey;
                    String sBusyKey = section.getId() + "_" + slotKey;

                    if (teacherBusy.contains(tBusyKey) || sectionBusy.contains(sBusyKey)) continue;

                    if (isLabType) {
                        for (Laboratory lab : laboratories) {
                            String lBusyKey = lab.getId() + "_" + slotKey;
                            if (!labBusy.contains(lBusyKey)) {
                                teacherBusy.add(tBusyKey);
                                sectionBusy.add(sBusyKey);
                                labBusy.add(lBusyKey);
                                generatedEntries.add(new TimetableEntry(day, slot, subject, teacher, null, lab, section, section.getSemester(), academicYear));
                                assigned = true;
                                break dayLoop;
                            }
                        }
                    } else {
                        for (Classroom room : classrooms) {
                            String rBusyKey = room.getId() + "_" + slotKey;
                            if (!roomBusy.contains(rBusyKey)) {
                                teacherBusy.add(tBusyKey);
                                sectionBusy.add(sBusyKey);
                                roomBusy.add(rBusyKey);
                                generatedEntries.add(new TimetableEntry(day, slot, subject, teacher, room, null, section, section.getSemester(), academicYear));
                                assigned = true;
                                break dayLoop;
                            }
                        }
                    }
                }
            }
        }
    }

    private List<Section> fetchSections(TimetableGenerateRequest req) {
        if (req.getSectionId() != null) {
            return sectionRepository.findById(req.getSectionId()).stream().collect(Collectors.toList());
        } else if (req.getCourseId() != null && req.getSemester() != null) {
            return sectionRepository.findByCourseIdAndSemester(req.getCourseId(), req.getSemester());
        } else if (req.getCourseId() != null) {
            return sectionRepository.findByCourseId(req.getCourseId());
        }
        return sectionRepository.findAll();
    }

    private List<Subject> fetchSubjects(TimetableGenerateRequest req) {
        if (req.getDepartmentId() != null && req.getSemester() != null) {
            return subjectRepository.findByDepartmentIdAndSemester(req.getDepartmentId(), req.getSemester());
        } else if (req.getDepartmentId() != null) {
            return subjectRepository.findByDepartmentId(req.getDepartmentId());
        } else if (req.getSemester() != null) {
            return subjectRepository.findBySemester(req.getSemester());
        }
        return subjectRepository.findAll();
    }

    public TimetableEntryDto convertToDto(TimetableEntry entry) {
        TimetableEntryDto dto = new TimetableEntryDto();
        dto.setId(entry.getId());
        dto.setDay(entry.getDay());
        dto.setTimeSlotId(entry.getTimeSlot().getId());
        dto.setTimeSlotLabel(entry.getTimeSlot().getSlotLabel());
        dto.setSlotNumber(entry.getTimeSlot().getSlotNumber());

        dto.setSubjectId(entry.getSubject().getId());
        dto.setSubjectCode(entry.getSubject().getSubjectCode());
        dto.setSubjectName(entry.getSubject().getSubjectName());
        dto.setSubjectType(entry.getSubject().getType().name());

        dto.setTeacherId(entry.getTeacher().getId());
        String displayFaculty = (entry.getAssignedFaculty() != null && !entry.getAssignedFaculty().trim().isEmpty())
                ? entry.getAssignedFaculty().trim()
                : entry.getTeacher().getName();
        dto.setTeacherName(displayFaculty);

        if (entry.getClassroom() != null) {
            dto.setClassroomId(entry.getClassroom().getId());
            dto.setRoomNumber(entry.getClassroom().getRoomNumber());
        }

        if (entry.getLaboratory() != null) {
            dto.setLaboratoryId(entry.getLaboratory().getId());
            dto.setLabName(entry.getLaboratory().getLabName());
        }

        if (entry.getAssignedVenue() != null && !entry.getAssignedVenue().trim().isEmpty()) {
            dto.setRoomNumber(entry.getAssignedVenue().trim());
        }

        dto.setSectionId(entry.getSection().getId());
        dto.setSectionName(entry.getSection().getSectionName());
        dto.setSemester(entry.getSemester());

        return dto;
    }

    private static class ScheduleTask {
        Section section;
        Subject subject;

        ScheduleTask(Section section, Subject subject) {
            this.section = section;
            this.subject = subject;
        }
    }
}
