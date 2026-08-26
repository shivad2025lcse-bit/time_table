package com.smarttimetable.service;

import com.smarttimetable.entity.FacultyAvailability;
import com.smarttimetable.entity.Teacher;
import com.smarttimetable.entity.TimeSlot;
import com.smarttimetable.repository.FacultyAvailabilityRepository;
import com.smarttimetable.repository.TeacherRepository;
import com.smarttimetable.repository.TimeSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FacultyAvailabilityService {

    @Autowired
    private FacultyAvailabilityRepository facultyAvailabilityRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    public List<FacultyAvailability> getAllAvailabilities() {
        return facultyAvailabilityRepository.findAll();
    }

    public List<FacultyAvailability> getByTeacherId(Long teacherId) {
        return facultyAvailabilityRepository.findByTeacherId(teacherId);
    }

    public FacultyAvailability updateAvailability(Long teacherId, String day, Long timeSlotId, boolean available) {
        Optional<FacultyAvailability> opt = facultyAvailabilityRepository
                .findByTeacherIdAndDayAndTimeSlotId(teacherId, day, timeSlotId);
        FacultyAvailability fa;
        if (opt.isPresent()) {
            fa = opt.get();
            fa.setAvailable(available);
        } else {
            Teacher teacher = teacherRepository.findById(teacherId)
                    .orElseThrow(() -> new RuntimeException("Teacher not found"));
            TimeSlot timeSlot = timeSlotRepository.findById(timeSlotId)
                    .orElseThrow(() -> new RuntimeException("TimeSlot not found"));
            
            fa = new FacultyAvailability(teacher, day, timeSlot, available);
        }
        return facultyAvailabilityRepository.save(fa);
    }
}
