package com.smarttimetable.service;

import com.smarttimetable.entity.QuizVisibilityConfig;
import com.smarttimetable.entity.Section;
import com.smarttimetable.entity.Student;
import com.smarttimetable.entity.User;
import com.smarttimetable.repository.QuizVisibilityConfigRepository;
import com.smarttimetable.repository.SectionRepository;
import com.smarttimetable.repository.StudentRepository;
import com.smarttimetable.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class QuizVisibilityService {

    @Autowired
    private QuizVisibilityConfigRepository configRepository;

    @Autowired
    private SectionRepository sectionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    public boolean isGlobalQuizEnabled() {
        return configRepository.findTopByOrderByIdAsc()
                .map(cfg -> Boolean.TRUE.equals(cfg.getGlobalQuizEnabled()))
                .orElse(true);
    }

    public boolean isDownloadTtEnabled() {
        return configRepository.findTopByOrderByIdAsc()
                .map(cfg -> Boolean.TRUE.equals(cfg.getDownloadTtEnabled()))
                .orElse(true);
    }

    @Transactional
    public Map<String, Object> setDownloadTtEnabled(boolean enabled, String actor) {
        QuizVisibilityConfig cfg = configRepository.findTopByOrderByIdAsc()
                .orElseGet(QuizVisibilityConfig::new);
        cfg.setDownloadTtEnabled(enabled);
        cfg.setUpdatedBy(actor);
        configRepository.save(cfg);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("downloadTtEnabled", Boolean.TRUE.equals(cfg.getDownloadTtEnabled()));
        res.put("updatedBy", actor);
        res.put("message", enabled ? "Download TT option is now ENABLED." : "Download TT option is now DISABLED.");
        return res;
    }

    public boolean isQuizVisibleForSection(Long sectionId) {
        if (!isGlobalQuizEnabled()) {
            return false;
        }
        if (sectionId == null) {
            return true;
        }
        return sectionRepository.findById(sectionId)
                .map(sec -> Boolean.TRUE.equals(sec.getQuizEnabled()))
                .orElse(true);
    }

    public Map<String, Object> getVisibilitySnapshot() {
        boolean globalEnabled = isGlobalQuizEnabled();
        List<Section> allSections = sectionRepository.findAll();
        List<Map<String, Object>> sectionDtos = new ArrayList<>();
        for (Section s : allSections) {
            Map<String, Object> dto = new LinkedHashMap<>();
            boolean secEnabled = Boolean.TRUE.equals(s.getQuizEnabled());
            dto.put("id", s.getId());
            dto.put("sectionName", s.getSectionName());
            dto.put("year", s.getYear());
            dto.put("semester", s.getSemester());
            dto.put("sectionIdentifier", s.getSectionIdentifier());
            dto.put("departmentCode", s.getCourse() != null && s.getCourse().getDepartment() != null
                    ? s.getCourse().getDepartment().getCode() : "");
            dto.put("departmentName", s.getCourse() != null && s.getCourse().getDepartment() != null
                    ? s.getCourse().getDepartment().getName() : "");
            dto.put("classCode", s.getCourse() != null ? s.getCourse().getCode() : "");
            dto.put("className", s.getCourse() != null ? s.getCourse().getName() : "");
            dto.put("quizEnabled", secEnabled);
            dto.put("effectiveQuizVisible", globalEnabled && secEnabled);
            sectionDtos.add(dto);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("globalQuizEnabled", globalEnabled);
        result.put("sections", sectionDtos);
        return result;
    }

    public Map<String, Object> getStudentQuizVisibility(Authentication authentication, Long fallbackSectionId) {
        boolean globalEnabled = isGlobalQuizEnabled();
        Long resolvedSectionId = fallbackSectionId;
        String sectionName = null;
        boolean sectionEnabled = true;

        if (authentication != null && authentication.isAuthenticated()) {
            String uname = authentication.getName();
            User user = userRepository.findByUsername(uname)
                    .or(() -> userRepository.findByUsernameIgnoreCase(uname))
                    .orElse(null);
            if (user != null) {
                Student student = studentRepository.findByUserId(user.getId()).orElse(null);
                if (student != null && student.getSection() != null) {
                    resolvedSectionId = student.getSection().getId();
                    sectionName = student.getSection().getSectionName();
                    sectionEnabled = Boolean.TRUE.equals(student.getSection().getQuizEnabled());
                }
            }
        }
        if (sectionName == null && resolvedSectionId != null) {
            Section sec = sectionRepository.findById(resolvedSectionId).orElse(null);
            if (sec != null) {
                sectionName = sec.getSectionName();
                sectionEnabled = Boolean.TRUE.equals(sec.getQuizEnabled());
            }
        }

        boolean visible = globalEnabled && sectionEnabled;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("visible", visible);
        result.put("globalQuizEnabled", globalEnabled);
        result.put("sectionQuizEnabled", sectionEnabled);
        result.put("sectionId", resolvedSectionId);
        result.put("sectionName", sectionName != null ? sectionName : "");
        return result;
    }

    @Transactional
    public Map<String, Object> setSectionQuizEnabled(Long sectionId, boolean enabled, String actor) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Section not found: " + sectionId));
        section.setQuizEnabled(enabled);
        sectionRepository.save(section);

        boolean globalEnabled = isGlobalQuizEnabled();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sectionId", section.getId());
        result.put("sectionName", section.getSectionName());
        result.put("quizEnabled", Boolean.TRUE.equals(section.getQuizEnabled()));
        result.put("globalQuizEnabled", globalEnabled);
        result.put("effectiveQuizVisible", globalEnabled && Boolean.TRUE.equals(section.getQuizEnabled()));
        result.put("updatedBy", actor);
        return result;
    }

    @Transactional
    public Map<String, Object> setGlobalQuizEnabled(boolean enabled, String actor) {
        QuizVisibilityConfig cfg = configRepository.findTopByOrderByIdAsc()
                .orElseGet(QuizVisibilityConfig::new);
        cfg.setGlobalQuizEnabled(enabled);
        cfg.setUpdatedBy(actor);
        configRepository.save(cfg);
        return getVisibilitySnapshot();
    }

    @Transactional
    public Map<String, Object> setAllSectionsQuizEnabled(boolean enabled, String actor) {
        QuizVisibilityConfig cfg = configRepository.findTopByOrderByIdAsc()
                .orElseGet(QuizVisibilityConfig::new);
        cfg.setGlobalQuizEnabled(enabled);
        cfg.setUpdatedBy(actor);
        configRepository.save(cfg);

        List<Section> sections = sectionRepository.findAll();
        for (Section s : sections) {
            s.setQuizEnabled(enabled);
        }
        sectionRepository.saveAll(sections);
        return getVisibilitySnapshot();
    }
}
