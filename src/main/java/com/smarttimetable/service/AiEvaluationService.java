package com.smarttimetable.service;

import java.util.List;
import com.smarttimetable.entity.StudentAnswer;

public interface AiEvaluationService {
    String analyzeWeakness(List<StudentAnswer> incorrectAnswers);
}
