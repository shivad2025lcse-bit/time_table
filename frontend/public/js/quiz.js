// quiz.js - AI-Evaluated Class Quizzes (Fixed & Enhanced)

// ── Initialisation ───────────────────────────────────────────────────────────
function initQuizSystem() {
    if (document.getElementById('facultyQuizModal')) return; // already injected
    injectQuizModals();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuizSystem);
} else {
    initQuizSystem();
}

// ── Modal HTML ───────────────────────────────────────────────────────────────
function injectQuizModals() {
    const html = `
    <!-- ============================================================ -->
    <!--  FACULTY: Manage Quizzes (Capacity Connect)                  -->
    <!-- ============================================================ -->
    <style>
        .cc-modal-content {
            background-color: #120326 !important;
            color: #ffffff;
            border: 1px solid #3b0764 !important;
            border-radius: 12px;
            overflow: hidden;
        }
        .cc-modal-header {
            background: linear-gradient(90deg, #1a0536, #14052e) !important;
            border-bottom: 1px solid #3b0764 !important;
            padding: 1rem 1.5rem;
        }
        .cc-title-brain {
            color: #fbbf24;
            font-size: 1.5rem;
            margin-right: 10px;
        }
        .cc-nav-tabs {
            border-bottom: 1px solid #3b0764;
            background-color: #1a0536;
            padding: 0 1rem;
        }
        .cc-nav-link {
            color: #e2e8f0;
            background: transparent;
            border: none;
            padding: 0.75rem 1.5rem;
            font-weight: 600;
            font-size: 0.95rem;
            opacity: 0.7;
        }
        .cc-nav-link:hover {
            opacity: 1;
        }
        .cc-nav-link.active {
            background-color: #ffffff !important;
            color: #000000 !important;
            border-radius: 6px 6px 0 0;
            opacity: 1;
        }
        .cc-form-label {
            font-size: 0.85rem;
            font-weight: 600;
            color: #e2e8f0;
            margin-bottom: 0.4rem;
        }
        .cc-form-control {
            background-color: #0a041f !important;
            border: 1px solid #4c1d95 !important;
            color: #ffffff !important;
            border-radius: 6px;
        }
        .cc-form-control:focus {
            border-color: #8b5cf6 !important;
            box-shadow: 0 0 0 0.25rem rgba(139, 92, 246, 0.25) !important;
        }
        .cc-btn-purple {
            background-color: #4c1d95 !important;
            color: #ffffff !important;
            border: none;
            border-radius: 6px;
        }
        .cc-btn-purple:hover {
            background-color: #5b21b6 !important;
        }
        .cc-btn-gray {
            background-color: #334155 !important;
            color: #ffffff !important;
            border: none;
            border-radius: 6px;
        }
        .cc-btn-gray:hover {
            background-color: #475569 !important;
        }
        .cc-q-card {
            background-color: #0a041f !important;
            border: 1px solid #4c1d95 !important;
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
    </style>
    <div class="modal fade" id="facultyQuizModal" tabindex="-1"
         data-bs-backdrop="static" data-bs-keyboard="false" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content cc-modal-content">
                <div class="modal-header cc-modal-header border-0 d-flex justify-content-between align-items-center">
                    <div>
                        <h4 class="modal-title fw-bold mb-1 d-flex align-items-center">
                            <i class="fa-solid fa-brain cc-title-brain"></i>
                            Capacity Connect – Quiz Management
                        </h4>
                        <small style="color: #94a3b8; font-size: 0.85rem; margin-left: 36px;">SIH26075 – Knowledge Assessment Module</small>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                
                <ul class="nav cc-nav-tabs mt-0" role="tablist">
                    <li class="nav-item">
                        <button class="cc-nav-link active" data-bs-toggle="tab" data-bs-target="#fqCreateTab" role="tab">
                            ✏️ Create Quiz
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="cc-nav-link" data-bs-toggle="tab" data-bs-target="#fqAiTab" role="tab" onclick="quizShowAiPrompt()">
                            🤖 AI Generator
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="cc-nav-link" data-bs-toggle="tab" data-bs-target="#fqResultsTab" role="tab" onclick="quizLoadFacultyList()">
                            📊 Class Analytics
                        </button>
                    </li>
                </ul>

                <div class="modal-body p-4" style="background-color: #120326;">
                    <div class="tab-content">
                        <!-- CREATE TAB -->
                        <div class="tab-pane fade show active" id="fqCreateTab" role="tabpanel">
                            <form id="quizCreateForm" onsubmit="quizHandleCreate(event)">
                                <div class="row g-3 mb-3">
                                    <div class="col-md-5">
                                        <label class="cc-form-label">Quiz Title *</label>
                                        <input type="text" id="fqTitle" class="form-control cc-form-control" placeholder="e.g. Data Structures – Linked List Quiz" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="cc-form-label">Section *</label>
                                        <input type="number" id="fqSectionId" class="form-control cc-form-control" placeholder="Error loading sections" required min="1">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="cc-form-label">Teacher *</label>
                                        <input type="text" id="fqTeacherDisplay" class="form-control cc-form-control" placeholder="Error loading teachers" readonly>
                                        <input type="hidden" id="fqTeacherId">
                                    </div>
                                </div>
                                <div class="row g-3 mb-4">
                                    <div class="col-md-4">
                                        <label class="cc-form-label">Subject</label>
                                        <input type="text" id="fqSubject" class="form-control cc-form-control" placeholder="e.g. Data Structures">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="cc-form-label">Topic / Chapter</label>
                                        <input type="text" id="fqTopic" class="form-control cc-form-control" placeholder="e.g. Linked List">
                                    </div>
                                    <div class="col-md-2">
                                        <label class="cc-form-label">Difficulty</label>
                                        <select id="fqDifficulty" class="form-select cc-form-control">
                                            <option value="Easy">Easy</option>
                                            <option value="Medium" selected>Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                    <div class="col-md-2">
                                        <label class="cc-form-label">Duration (min)</label>
                                        <input type="number" id="fqDuration" class="form-control cc-form-control" value="15">
                                    </div>
                                </div>
                                <div class="row g-3 mb-4">
                                    <div class="col-md-2">
                                        <label class="cc-form-label">Pass %</label>
                                        <input type="number" id="fqPassPercent" class="form-control cc-form-control" value="50">
                                    </div>
                                </div>

                                <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2" style="border-color: #3b0764 !important;">
                                    <h5 class="fw-bold mb-0" style="color: #eab308;"><i class="fa-solid fa-list-ul me-2"></i>Questions</h5>
                                    <div class="d-flex gap-2">
                                        <button type="button" class="btn cc-btn-gray btn-sm px-3 fw-semibold" onclick="quizShowAiPrompt()">
                                            <i class="fa-solid fa-file-import me-1"></i> Import from AI
                                        </button>
                                        <button type="button" class="btn cc-btn-purple btn-sm px-3 fw-semibold" onclick="quizAddQuestion()">
                                            + Add Question
                                        </button>
                                    </div>
                                </div>

                                <div id="fqQuestionsWrap">
                                    <!-- Dynamic question cards -->
                                </div>

                                <div class="mt-4 d-flex justify-content-end gap-2">
                                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" class="btn btn-success fw-bold" style="background:#10b981; border:none;">
                                        <i class="fa-solid fa-check me-1"></i> Save Quiz
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- RESULTS TAB -->
                        <div class="tab-pane fade" id="fqResultsTab" role="tabpanel">
                            <div class="mb-3 d-flex gap-2 align-items-end">
                                <div class="flex-grow-1">
                                    <label class="cc-form-label">Select Quiz</label>
                                    <select id="fqQuizSelect" class="form-select cc-form-control" onchange="quizLoadResults(this.value)">
                                        <option value="">-- Choose a Quiz --</option>
                                    </select>
                                </div>
                                <button type="button" class="btn btn-outline-danger fw-bold" id="fqDeleteQuizBtn" style="height: 38px; display: none;" onclick="quizDeleteSelected()">
                                    <i class="fa-solid fa-trash"></i> Delete
                                </button>
                            </div>
                            <div id="fqResultsBody" class="mt-3"></div>
                        </div>
                        
                        <!-- AI TAB PLACEHOLDER -->
                        <div class="tab-pane fade" id="fqAiTab" role="tabpanel">
                            <form id="aiGenForm" onsubmit="quizGenerateAI(event)">
                                <div class="row g-3 mb-3">
                                    <div class="col-md-6">
                                        <label class="cc-form-label">Topic *</label>
                                        <input type="text" id="aiTopic" class="form-control cc-form-control" placeholder="e.g. Linked Lists in Data Structures" required>
                                    </div>
                                    <div class="col-md-2">
                                        <label class="cc-form-label">Difficulty</label>
                                        <select id="aiDifficulty" class="form-select cc-form-control">
                                            <option value="Easy">Easy</option>
                                            <option value="Medium" selected>Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                    <div class="col-md-2">
                                        <label class="cc-form-label">No. Questions</label>
                                        <input type="number" id="aiNumQ" class="form-control cc-form-control" value="5" min="1" max="15" required>
                                    </div>
                                    <div class="col-md-2">
                                        <label class="cc-form-label">Type</label>
                                        <select id="aiType" class="form-select cc-form-control">
                                            <option value="MCQ" selected>MCQ</option>
                                            <option value="DESCRIPTIVE">Descriptive</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="row g-3 mb-4">
                                    <div class="col-12">
                                        <label class="cc-form-label">Learning Objectives / Notes</label>
                                        <textarea id="aiNotes" class="form-control cc-form-control" rows="4" placeholder="Paste your lesson notes or learning objectives here. The AI will generate questions based ONLY on this content..."></textarea>
                                    </div>
                                </div>
                                <button id="aiGenBtn" type="submit" class="btn cc-btn-purple fw-bold px-4 py-2">
                                    <i class="fa-solid fa-robot me-2"></i> Generate Questions with AI
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ============================================================ -->
    <!--  STUDENT: Take Quiz                                          -->
    <!-- ============================================================ -->
    <div class="modal fade" id="studentQuizModal" tabindex="-1"
         data-bs-backdrop="static" data-bs-keyboard="false" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content cc-modal-content">
                <div class="modal-header cc-modal-header border-0">
                    <h5 class="modal-title fw-bold">
                        <i class="fa-solid fa-pen-to-square text-info me-2"></i>
                        Class Quiz
                    </h5>
                    <!-- No close button during active quiz - controlled by firewall -->
                    <button id="sqCloseBtn" type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4" style="background-color: #120326;">
                    <!-- List of quizzes -->
                    <div id="sqListContainer">
                        <h6 class="fw-bold text-info mb-3">Available Quizzes</h6>
                        <div id="sqQuizList" class="list-group mb-3"></div>
                        <div id="sqNoQuiz" class="text-muted" style="display:none;">No quizzes assigned for your section yet.</div>
                    </div>

                    <!-- Active quiz view -->
                    <div id="sqActiveContainer" style="display:none;">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <h5 id="sqQuizTitle" class="fw-bold text-info mb-0"></h5>
                            <span class="badge bg-warning text-dark"><i class="fa-solid fa-lock me-1"></i> Quiz in progress</span>
                        </div>
                        <div class="alert" style="background:#1c1000;border:1px solid #f59e0b;color:#fbbf24;">
                            <i class="fa-solid fa-triangle-exclamation me-2"></i>
                            <strong>Firewall Active:</strong> You cannot logout or leave this page until you submit the quiz!
                        </div>
                        <form id="sqForm" onsubmit="quizStudentSubmit(event)">
                            <div id="sqQuestionsBody"></div>
                            <div class="mt-4 d-flex justify-content-end">
                                <button type="submit" class="btn fw-bold px-5" style="background:linear-gradient(135deg,#10b981,#3b82f6);color:#fff;">
                                    <i class="fa-solid fa-check-circle me-1"></i> Submit Answers
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Result view after submission -->
                    <div id="sqResultContainer" style="display:none;"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- ============================================================ -->
    <!--  STUDENT: Quiz History Modal                                 -->
    <!-- ============================================================ -->
    <div class="modal fade" id="studentQuizHistoryModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content cc-modal-content">
                <div class="modal-header cc-modal-header border-0">
                    <h5 class="modal-title fw-bold">
                        <i class="fa-solid fa-clock-rotate-left text-info me-2"></i>
                        My Quiz History
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4" style="background-color: #120326;">
                    <div id="sqHistoryListContainer">
                        <div id="sqHistoryList" class="list-group mb-3">
                            <div class="text-center py-4 text-muted">Loading history...</div>
                        </div>
                    </div>
                    
                    <div id="sqHistoryDetailContainer" style="display:none;">
                        <button class="btn btn-sm btn-outline-secondary mb-3" onclick="document.getElementById('sqHistoryDetailContainer').style.display='none'; document.getElementById('sqHistoryListContainer').style.display='block';">
                            <i class="fa-solid fa-arrow-left"></i> Back to History
                        </button>
                        <div id="sqHistoryDetailContent"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
}

// ── State ────────────────────────────────────────────────────────────────────
let _quizActive = false;           // firewall flag
let _currentQuizData = null;       // full quiz object for student
let _questionCount = 0;            // unique question card IDs
let _resolvedStudentId = null;     // resolved DB id of logged-in student
let _resolvedSectionId = null;     // resolved DB id of student's section

// ── Helpers ──────────────────────────────────────────────────────────────────
function _loggedInUsername() {
    return localStorage.getItem('sece_logged_in_user') || '';
}
function _teacherId() {
    // Try to get from session storage set by faculty login flow
    return localStorage.getItem('sece_teacher_id') ||
           sessionStorage.getItem('sece_teacher_id') || '1';
}

/**
 * Fetches the logged-in student's DB record and caches their ID + sectionId.
 * Returns { studentId, sectionId } or null on failure.
 */
async function _resolveStudentInfo() {
    if (_resolvedStudentId && _resolvedSectionId) {
        return { studentId: _resolvedStudentId, sectionId: _resolvedSectionId };
    }
    const username = _loggedInUsername();
    if (!username) return null;

    try {
        const token = localStorage.getItem('jwt_token') || '';
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        const res = await fetch('/api/students', { headers });
        if (!res.ok) return null;
        const students = await res.json();
        const me = students.find(s =>
            (s.user && s.user.username === username) ||
            s.username === username ||
            String(s.registerNumber || '').toLowerCase() === username
        );
        if (!me) return null;
        _resolvedStudentId = me.id;
        _resolvedSectionId = me.section ? me.section.id : null;
        return { studentId: me.id, sectionId: me.section ? me.section.id : null };
    } catch (err) {
        console.error('Could not resolve student info', err);
        return null;
    }
}
function _apiErr(res) {
    return res.text().then(t => { throw new Error(t || 'API error ' + res.status); });
}

/**
 * Fetches the logged-in faculty's DB record and returns their teacher ID.
 * Returns teacherId (number) or null on failure.
 */
async function _resolveTeacherInfo() {
    const username = _loggedInUsername();
    if (!username) return null;
    try {
        const token = localStorage.getItem('jwt_token') || '';
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        const res = await fetch('/api/teachers', { headers });
        if (!res.ok) return null;
        const teachers = await res.json();
        const me = teachers.find(t =>
            (t.user && t.user.username === username) ||
            t.username === username ||
            String(t.collegeEmail || '').toLowerCase().startsWith(username)
        );
        return me ? me.id : null;
    } catch (err) {
        console.error('Could not resolve teacher info', err);
        return null;
    }
}

// ── Faculty: Open Modal ──────────────────────────────────────────────────────
window.openFacultyQuizModal = async () => {
    // Resolve teacher ID from API
    let tchId = await _resolveTeacherInfo();
    if (!tchId) tchId = 1; // fallback

    document.getElementById('fqTeacherId').value = tchId;
    document.getElementById('fqTeacherDisplay').value = 'Teacher (Auto-detected): ID ' + tchId;

    // Reset form
    document.getElementById('quizCreateForm').reset();
    document.getElementById('fqTeacherId').value = tchId;
    document.getElementById('fqTeacherDisplay').value = 'Teacher (Auto-detected): ID ' + tchId;

    document.getElementById('fqQuestionsWrap').innerHTML = '';
    _questionCount = 0;
    quizAddQuestion();

    new bootstrap.Modal(document.getElementById('facultyQuizModal')).show();
};

window.quizShowAiPrompt = () => {
    const aiTab = new bootstrap.Tab(document.querySelector('button[data-bs-target="#fqAiTab"]'));
    aiTab.show();
};

window.quizGenerateAI = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('aiGenBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Generating...';

    const topic = document.getElementById('aiTopic').value;
    const diff = document.getElementById('aiDifficulty').value;
    const num = document.getElementById('aiNumQ').value;
    const type = document.getElementById('aiType') ? document.getElementById('aiType').value : 'MCQ';
    const notes = document.getElementById('aiNotes') ? document.getElementById('aiNotes').value : '';

    try {
        const token = localStorage.getItem('jwt_token') || '';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;

        const res = await fetch('/api/quizzes/generate', {
            method: 'POST',
            headers,
            body: JSON.stringify({ topic, notes, difficulty: diff, type, count: parseInt(num) })
        });
        
        if (res.ok) {
            const data = await res.json();
            // Automatically fill questions
            data.forEach(q => {
                quizAddQuestion();
                const cards = document.querySelectorAll('#fqQuestionsWrap .cc-q-card');
                const lastCard = cards[cards.length - 1];
                const qid = lastCard.querySelector('.q-text').dataset.qid;

                lastCard.querySelector('.q-text').value = q.questionText || '';
                lastCard.querySelector('.q-type').value = q.type || 'MCQ';
                quizToggleType(lastCard.querySelector('.q-type'), qid);
                lastCard.querySelector('.q-marks').value = q.marks || 10;

                if ((q.type || 'MCQ') === 'MCQ') {
                    if (q.options) {
                        const optsArr = q.options.split(',');
                        const optInputs = lastCard.querySelectorAll('.q-opt');
                        optInputs.forEach((input, idx) => {
                            if (optsArr[idx]) input.value = optsArr[idx].trim();
                        });
                    }
                    lastCard.querySelector('.q-answer').value = q.correctAnswer || '';
                } else {
                    const descInput = lastCard.querySelector('.q-answer-desc');
                    if(descInput) descInput.value = q.correctAnswer || q.explanation || '';
                }
            });
            document.getElementById('aiGenForm').reset();
            const createTab = new bootstrap.Tab(document.querySelector('button[data-bs-target="#fqCreateTab"]'));
            createTab.show();
            _showSuccess(`Successfully generated ${data.length} questions!`);
        } else {
            const errText = await res.text();
            alert(`Failed to generate questions (Status: ${res.status}): ${errText}`);
        }
    } catch (err) {
        console.error('Quiz Generation Error:', err);
        alert('Network error while generating AI questions: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-robot me-2"></i> Generate Questions with AI';
    }
};

// ── Faculty: Add Question Card ───────────────────────────────────────────────
window.quizAddQuestion = () => {
    _questionCount++;
    const n = _questionCount;
    const wrap = document.getElementById('fqQuestionsWrap');
    const card = document.createElement('div');
    card.className = 'cc-q-card';
    card.id = 'qcard_' + n;
    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-bold" style="color: #eab308;">Q${n}</span>
            <button type="button" class="btn btn-sm" style="color: #ef4444; border: 1px solid #ef4444;" onclick="document.getElementById('qcard_${n}').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="mb-2">
            <input type="text" class="form-control cc-form-control q-text" data-qid="${n}" placeholder="Type your question here..." required>
        </div>
        <div class="row g-2 mb-2">
            <div class="col-md-6">
                <select class="form-select cc-form-control q-type" data-qid="${n}" onchange="quizToggleType(this,${n})">
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="DESCRIPTIVE">Descriptive</option>
                </select>
            </div>
            <div class="col-md-6">
                <input type="number" class="form-control cc-form-control q-marks" data-qid="${n}" value="10" min="1" required placeholder="Marks">
            </div>
        </div>

        <!-- MCQ Options Section -->
        <div class="mcq-section-${n}">
            <div class="row g-2 mb-2">
                <div class="col-md-6">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background:#1a0536;color:#a78bfa;border-color:#4c1d95;">A</span>
                        <input type="text" class="form-control cc-form-control q-opt" data-qid="${n}" data-opt="0" placeholder="Option A" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background:#1a0536;color:#a78bfa;border-color:#4c1d95;">B</span>
                        <input type="text" class="form-control cc-form-control q-opt" data-qid="${n}" data-opt="1" placeholder="Option B" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background:#1a0536;color:#a78bfa;border-color:#4c1d95;">C</span>
                        <input type="text" class="form-control cc-form-control q-opt" data-qid="${n}" data-opt="2" placeholder="Option C">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background:#1a0536;color:#a78bfa;border-color:#4c1d95;">D</span>
                        <input type="text" class="form-control cc-form-control q-opt" data-qid="${n}" data-opt="3" placeholder="Option D">
                    </div>
                </div>
            </div>
            <div class="mb-2">
                <input type="text" class="form-control cc-form-control q-answer" data-qid="${n}" style="border-color:#10b981 !important;" placeholder="Correct Answer (type exactly as option)" required>
            </div>
        </div>

        <!-- Descriptive Section -->
        <div class="desc-section-${n}" style="display:none;">
            <div class="mb-2">
                <textarea class="form-control cc-form-control q-answer-desc" data-qid="${n}" rows="3" style="border-color:#10b981 !important;" placeholder="Model Answer (for faculty reference)"></textarea>
            </div>
        </div>
    `;
    wrap.appendChild(card);
};

window.quizToggleType = (sel, n) => {
    const mcqSec = document.querySelector('.mcq-section-' + n);
    const descSec = document.querySelector('.desc-section-' + n);
    if (sel.value === 'MCQ') {
        mcqSec.style.display = 'block';
        descSec.style.display = 'none';
    } else {
        mcqSec.style.display = 'none';
        descSec.style.display = 'block';
    }
};

// ── Faculty: Create Quiz ─────────────────────────────────────────────────────
window.quizHandleCreate = async (e) => {
    e.preventDefault();

    const title    = document.getElementById('fqTitle').value.trim();
    const sectionId = parseInt(document.getElementById('fqSectionId').value) || 1;
    const teacherId = parseInt(document.getElementById('fqTeacherId').value) || 1;

    const questions = [];
    document.querySelectorAll('[id^="qcard_"]').forEach(card => {
        const qid  = card.querySelector('.q-text').dataset.qid;
        const type = card.querySelector('.q-type').value;
        const text = card.querySelector('.q-text').value.trim();
        const marks = parseInt(card.querySelector('.q-marks').value) || 10;

        let options = '';
        let correct = '';

        if (type === 'MCQ') {
            const opts = [...card.querySelectorAll('.q-opt')].map(i => i.value.trim()).filter(v => v);
            options = opts.join(',');
            correct = card.querySelector('.q-answer').value.trim();
        } else {
            options = '';
            correct = card.querySelector('.q-answer-desc') ? card.querySelector('.q-answer-desc').value.trim() : '';
        }

        if (text) {
            questions.push({ questionText: text, type, options, correctAnswer: correct, marks });
        }
    });

    if (questions.length === 0) {
        alert('Please add at least one question.');
        return;
    }

    const payload = { sectionId, teacherId, title, questions };

    try {
        const res = await fetch('/api/quizzes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            _showSuccess('Quiz "' + title + '" created successfully! Students can now take it.');
            document.getElementById('quizCreateForm').reset();
            document.getElementById('fqQuestionsWrap').innerHTML = '';
            _questionCount = 0;
            quizAddQuestion();
        } else {
            const errText = await res.text();
            alert('Failed to create quiz:\n' + errText);
        }
    } catch (err) {
        console.error(err);
        alert('Network error. Is the backend running?');
    }
};

// ── Faculty: Load Quiz List for Results Tab ──────────────────────────────────
window.quizLoadFacultyList = async () => {
    const tchId = document.getElementById('fqTeacherId').value || _teacherId();
    try {
        const res = await fetch('/api/quizzes/teacher/' + tchId);
        const list = await res.json();
        const sel = document.getElementById('fqQuizSelect');
        sel.innerHTML = '<option value="">-- Choose a Quiz --</option>' +
            list.map(q => `<option value="${q.id}">${q.title}</option>`).join('');
        document.getElementById('fqResultsBody').innerHTML = '';
    } catch (err) { console.error(err); }
};

// ── Faculty: Load Results for Selected Quiz ──────────────────────────────────
window.quizLoadResults = async (quizId) => {
    const body = document.getElementById('fqResultsBody');
    const deleteBtn = document.getElementById('fqDeleteQuizBtn');
    
    if (!quizId) { 
        body.innerHTML = ''; 
        if (deleteBtn) deleteBtn.style.display = 'none';
        return; 
    }
    
    if (deleteBtn) deleteBtn.style.display = 'block';
    
    body.innerHTML = '<div class="text-muted">Loading...</div>';

    const [allRes, weakRes] = await Promise.all([
        fetch('/api/quizzes/' + quizId + '/results'),
        fetch('/api/quizzes/' + quizId + '/results/weak')
    ]);
    const all  = await allRes.json();
    const weak = await weakRes.json();

    // ── Compute aggregate stats ───────────────────────────────────────────────
    const total = all.length;
    const passCount = all.filter(r => (r.percentage || 0) >= 50).length;
    const failCount = total - passCount;
    const avgPct = total > 0 ? (all.reduce((s, r) => s + (r.percentage || 0), 0) / total) : 0;
    const classAccuracy = avgPct.toFixed(1);
    const passRate = total > 0 ? ((passCount / total) * 100).toFixed(1) : '0.0';

    // ── Per-student row with precision/accuracy ───────────────────────────────
    const tableRows = all.map(r => {
        const pct = r.percentage != null ? r.percentage.toFixed(1) : '0.0';
        const name = r.student ? (r.student.studentName || ('ID:' + r.student.id)) : 'Unknown';
        // Compute per-student answer accuracy
        let correct = 0, totalQ = 0;
        if (r.answers && r.answers.length > 0) {
            totalQ = r.answers.length;
            correct = r.answers.filter(a => a.isCorrect).length;
        }
        const accuracy = totalQ > 0 ? ((correct / totalQ) * 100).toFixed(1) : '?';
        const level = parseFloat(pct) >= 75 ? {label:'Excellent',cls:'success'} :
                      parseFloat(pct) >= 50 ? {label:'Proficient',cls:'info'} :
                      parseFloat(pct) >= 35 ? {label:'Developing',cls:'warning'} :
                      {label:'Needs Help',cls:'danger'};
        const badgePct = `<span class="badge bg-${level.cls}">${pct}%</span>`;
        return `<tr>
            <td class="fw-bold">${name}</td>
            <td>${r.totalScore ?? 0}</td>
            <td>${badgePct}</td>
            <td>${correct}/${totalQ} <span class="text-muted small">(${accuracy}%)</span></td>
            <td><span class="badge bg-${level.cls}">${level.label}</span></td>
        </tr>`;
    }).join('');

    // ── Class performance chart data ──────────────────────────────────────────
    const chartId = 'fqClassChart_' + quizId;
    const studentNames = all.map(r => r.student ? (r.student.studentName || 'ID:'+r.student.id) : 'Unknown');
    const studentPcts  = all.map(r => +(r.percentage || 0).toFixed(1));

    const weakCards = weak.length === 0
        ? '<p class="text-success fw-bold"><i class="fa-solid fa-trophy me-1"></i> All students scored 50% or above!</p>'
        : weak.map(r => {
            const name = r.student ? (r.student.studentName || ('ID:' + r.student.id)) : 'Unknown';
            const pct = r.percentage != null ? r.percentage.toFixed(1) : '0.0';
            let correct = 0, totalQ = 0;
            if (r.answers && r.answers.length > 0) {
                totalQ = r.answers.length;
                correct = r.answers.filter(a => a.isCorrect).length;
            }
            const accuracy = totalQ > 0 ? ((correct / totalQ) * 100).toFixed(1) : '?';
            return `
            <div class="card mb-3" style="background:#1a0000;border:1px solid #dc2626;">
                <div class="card-header d-flex justify-content-between align-items-center" style="background:#2d0000;">
                    <strong class="text-danger"><i class="fa-solid fa-user-xmark me-1"></i>${name}</strong>
                    <div class="d-flex gap-2 align-items-center">
                        <span class="badge bg-danger">${pct}%</span>
                        <span class="badge bg-secondary">Accuracy: ${accuracy}%</span>
                    </div>
                </div>
                <div class="card-body">
                    <h6 class="text-warning"><i class="fa-solid fa-robot me-1"></i>AI Weakness Analysis</h6>
                    <p style="color:#fde68a;white-space:pre-wrap;">${r.aiWeaknessAnalysis || 'No analysis available.'}</p>
                </div>
            </div>`;
        }).join('');

    body.innerHTML = `
        <!-- Summary Stats Cards -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="p-3 rounded text-center" style="background:#0d1f12;border:1px solid #10b981;">
                    <div class="fs-4 fw-bold text-success">${total}</div>
                    <div class="small text-muted">Students Attempted</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="p-3 rounded text-center" style="background:#0d1a3a;border:1px solid #3b82f6;">
                    <div class="fs-4 fw-bold text-info">${classAccuracy}%</div>
                    <div class="small text-muted">Class Avg Score</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="p-3 rounded text-center" style="background:#1a1200;border:1px solid #eab308;">
                    <div class="fs-4 fw-bold text-warning">${passRate}%</div>
                    <div class="small text-muted">Pass Rate</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="p-3 rounded text-center" style="background:#1a0000;border:1px solid #ef4444;">
                    <div class="fs-4 fw-bold text-danger">${failCount}</div>
                    <div class="small text-muted">Need Attention</div>
                </div>
            </div>
        </div>

        <!-- Class Performance Bar Chart -->
        ${total > 0 ? `
        <div class="mb-4 p-3 rounded" style="background:#0a041f;border:1px solid #4c1d95;">
            <h6 class="fw-bold mb-3" style="color:#a78bfa;"><i class="fa-solid fa-chart-bar me-2"></i>Student Performance Overview</h6>
            <canvas id="${chartId}" height="120"></canvas>
        </div>` : ''}

        <!-- Detailed Table -->
        <h6 class="fw-bold mb-2">All Submissions (${all.length})</h6>
        <div class="table-responsive mb-4">
            <table class="table table-sm" style="color:#e0e0ff;background:#0d0d2e;">
                <thead style="background:#1a003a;">
                    <tr>
                        <th>Student</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Accuracy (Q)</th>
                        <th>Level</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
        <h6 class="fw-bold text-danger mb-2"><i class="fa-solid fa-triangle-exclamation me-1"></i>Needs Attention (below 50%)</h6>
        ${weakCards}
    `;

    // ── Render chart after DOM update ────────────────────────────────────────
    if (total > 0) {
        setTimeout(() => {
            _ensureChartJs(() => {
                const ctx = document.getElementById(chartId);
                if (!ctx) return;
                const colors = studentPcts.map(p =>
                    p >= 75 ? 'rgba(16,185,129,0.8)' :
                    p >= 50 ? 'rgba(59,130,246,0.8)' :
                    p >= 35 ? 'rgba(234,179,8,0.8)' :
                    'rgba(239,68,68,0.8)'
                );
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: studentNames,
                        datasets: [{
                            label: 'Score (%)',
                            data: studentPcts,
                            backgroundColor: colors,
                            borderColor: colors.map(c => c.replace('0.8','1')),
                            borderWidth: 1,
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: ctx => `Score: ${ctx.raw}%`
                                }
                            }
                        },
                        scales: {
                            y: {
                                min: 0, max: 100,
                                grid: { color: 'rgba(255,255,255,0.05)' },
                                ticks: { color: '#94a3b8', callback: v => v + '%' }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: '#94a3b8', maxRotation: 45 }
                            }
                        }
                    }
                });
            });
        }, 100);
    }
};

// ── Student: Open Modal ──────────────────────────────────────────────────────
window.openStudentQuizModal = async () => {
    // Reset view
    document.getElementById('sqListContainer').style.display = 'block';
    document.getElementById('sqActiveContainer').style.display = 'none';
    document.getElementById('sqResultContainer').style.display = 'none';
    document.getElementById('sqCloseBtn').style.display = 'block';

    const listEl = document.getElementById('sqQuizList');
    const noEl   = document.getElementById('sqNoQuiz');
    listEl.innerHTML = '<p class="text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Loading...</p>';

    try {
        // Resolve real student + section IDs
        const info = await _resolveStudentInfo();
        const secId = (info && info.sectionId) ? info.sectionId : 1;

        const res  = await fetch('/api/quizzes/section/' + secId);
        const list = await res.json();

        if (!list || list.length === 0) {
            listEl.innerHTML = '';
            noEl.style.display = 'block';
        } else {
            noEl.style.display = 'none';
            listEl.innerHTML = list.map(q => `
                <button type="button" class="list-group-item list-group-item-action fw-bold"
                    style="background:#0d1f3c;color:#93c5fd;border-color:#3b82f6;"
                    onclick="quizStudentStart(${q.id})">
                    <i class="fa-solid fa-play-circle me-2 text-info"></i>${q.title}
                </button>`).join('');
        }
    } catch (err) {
        console.error(err);
        listEl.innerHTML = '<p class="text-danger">Error loading quizzes. Check backend is running on port 8081.</p>';
    }

    new bootstrap.Modal(document.getElementById('studentQuizModal')).show();
};

// ── Student: Start Quiz (Firewall) ───────────────────────────────────────────
window.quizStudentStart = async (quizId) => {
    try {
        const info  = await _resolveStudentInfo();
        const secId = (info && info.sectionId) ? info.sectionId : 1;
        const res   = await fetch('/api/quizzes/section/' + secId);
        const list  = await res.json();
        const quiz  = list.find(q => q.id === quizId);
        if (!quiz) { alert('Quiz not found.'); return; }

        _currentQuizData = quiz;
        _quizActive = true;

        // ▸ Activate firewall
        document.getElementById('sqCloseBtn').style.display = 'none';
        document.getElementById('sqListContainer').style.display = 'none';
        document.getElementById('sqResultContainer').style.display = 'none';
        document.getElementById('sqActiveContainer').style.display = 'block';
        document.getElementById('sqQuizTitle').innerText = quiz.title;

        // Render questions
        const qBody = document.getElementById('sqQuestionsBody');
        qBody.innerHTML = quiz.questions.map((q, idx) => {
            const opts = q.type === 'MCQ'
                ? (q.options || '').split(',').map(o => o.trim()).filter(o => o)
                : [];
            const letters = ['A', 'B', 'C', 'D'];

            const inputHtml = q.type === 'MCQ'
                ? opts.map((opt, i) => `
                    <div class="form-check" style="background:#0a1628;border:1px solid #3b82f6;border-radius:8px;padding:10px 16px;margin-bottom:6px;">
                        <input class="form-check-input" type="radio" name="sq_q_${q.id}" id="sq_${q.id}_${i}" value="${opt}" required>
                        <label class="form-check-label" for="sq_${q.id}_${i}">
                            <span class="badge me-2" style="background:#1d4ed8;">${letters[i] || i+1}</span>${opt}
                        </label>
                    </div>`).join('')
                : `<textarea name="sq_q_${q.id}" id="sq_desc_${q.id}" rows="5" required
                        class="form-control mt-2"
                        style="background:#0a1628;color:#e0f0ff;border-color:#3b82f6;font-size:0.95rem;"
                        placeholder="Write your detailed answer here..."></textarea>`;

            return `
            <div class="mb-4 p-3" style="background:#0d1a30;border-radius:12px;border-left:4px solid #7c3aed;">
                <p class="fw-bold mb-2" style="color:#a78bfa;">
                    <span style="background:#7c3aed;color:#fff;border-radius:6px;padding:2px 10px;margin-right:8px;">${idx+1}</span>
                    ${q.questionText}
                    <span class="badge ms-2" style="background:#0f172a;border:1px solid #7c3aed;color:#c4b5fd;">${q.marks} Marks</span>
                </p>
                ${inputHtml}
            </div>`;
        }).join('');

        document.getElementById('sqForm').dataset.quizId = quizId;

    } catch (err) {
        console.error(err);
        alert('Error loading quiz: ' + err.message);
    }
};

// ── Student: Submit Quiz ─────────────────────────────────────────────────────
window.quizStudentSubmit = async (e) => {
    e.preventDefault();
    if (!_currentQuizData) return;

    const quizId = document.getElementById('sqForm').dataset.quizId;

    // Resolve real student DB id
    const info = await _resolveStudentInfo();
    if (!info || !info.studentId) {
        alert('Could not identify your student account. Make sure you are logged in as a student.');
        return;
    }
    const studentId = info.studentId;

    const answers = _currentQuizData.questions.map(q => {
        let text = '';
        if (q.type === 'MCQ') {
            const checked = document.querySelector(`[name="sq_q_${q.id}"]:checked`);
            text = checked ? checked.value : '';
        } else {
            const area = document.getElementById('sq_desc_' + q.id);
            text = area ? area.value : '';
        }
        return { questionId: q.id, answerText: text };
    });

    try {
        const res = await fetch('/api/quizzes/' + quizId + '/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, answers })
        });

        if (res.ok) {
            const sub = await res.json();
            _quizActive = false;  // ▸ Deactivate firewall

            // Show result card
            document.getElementById('sqActiveContainer').style.display = 'none';
            document.getElementById('sqCloseBtn').style.display = 'block';

            const pct = sub.percentage != null ? sub.percentage.toFixed(1) : '0.0';
            const isPassed = parseFloat(pct) >= 50;

            // Compute accuracy from answers
            let correct = 0, totalQ = 0;
            if (sub.answers && sub.answers.length > 0) {
                totalQ = sub.answers.length;
                correct = sub.answers.filter(a => a.isCorrect).length;
            }
            const accuracy = totalQ > 0 ? ((correct / totalQ) * 100).toFixed(1) : '0.0';
            const level = parseFloat(pct) >= 75 ? {label:'Excellent 🌟',color:'#10b981'} :
                          parseFloat(pct) >= 50 ? {label:'Proficient ✅',color:'#3b82f6'} :
                          parseFloat(pct) >= 35 ? {label:'Developing 📈',color:'#eab308'} :
                          {label:'Needs Improvement 📚',color:'#ef4444'};
            const donutId = 'sq_donut_' + sub.id;

            document.getElementById('sqResultContainer').style.display = 'block';
            document.getElementById('sqResultContainer').innerHTML = `
                <div class="text-center mb-4">
                    <div style="font-size:3rem;">${isPassed ? '🎉' : '📚'}</div>
                    <h4 class="fw-bold mt-2" style="color:${level.color}">${level.label}</h4>
                </div>
                <div class="row g-3 mb-4">
                    <div class="col-6">
                        <div class="p-3 rounded text-center" style="background:#0d1f12;border:1px solid #10b981;">
                            <div class="fs-2 fw-bold" style="color:${level.color}">${pct}%</div>
                            <div class="small text-muted mt-1">Overall Score</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="p-3 rounded text-center" style="background:#0d1a3a;border:1px solid #3b82f6;">
                            <div class="fs-2 fw-bold text-info">${accuracy}%</div>
                            <div class="small text-muted mt-1">Accuracy</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="p-3 rounded text-center" style="background:#1a1200;border:1px solid #eab308;">
                            <div class="fs-2 fw-bold text-warning">${correct}/${totalQ}</div>
                            <div class="small text-muted mt-1">Correct / Total</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="p-3 rounded text-center" style="background:#0a041f;border:1px solid #8b5cf6;">
                            <div class="fs-4 fw-bold text-purple">${sub.totalScore ?? 0}</div>
                            <div class="small text-muted mt-1">Marks Scored</div>
                        </div>
                    </div>
                </div>
                <!-- Donut chart -->
                <div class="d-flex justify-content-center mb-4">
                    <div style="width:200px;height:200px;"><canvas id="${donutId}"></canvas></div>
                </div>
                ${!isPassed && sub.aiWeaknessAnalysis ? `
                <div class="p-3 rounded mb-3" style="background:#1a0000;border:1px solid #dc2626;">
                    <h6 class="text-warning fw-bold"><i class="fa-solid fa-robot me-1"></i>AI Study Recommendations</h6>
                    <p style="color:#fde68a;white-space:pre-wrap;">${sub.aiWeaknessAnalysis}</p>
                </div>` : ''}
                <div class="text-center mt-4">
                    <button class="btn btn-outline-info" data-bs-dismiss="modal">Close</button>
                </div>
            `;
            // Render donut chart
            _ensureChartJs(() => {
                const ctx = document.getElementById(donutId);
                if (!ctx) return;
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Correct', 'Incorrect'],
                        datasets: [{
                            data: [correct, Math.max(0, totalQ - correct)],
                            backgroundColor: ['rgba(16,185,129,0.85)', 'rgba(239,68,68,0.7)'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        cutout: '70%',
                        plugins: {
                            legend: { labels: { color: '#94a3b8' } },
                            tooltip: { callbacks: { label: c => c.label + ': ' + c.raw + ' Q' } }
                        }
                    }
                });
            });
        } else {
            const errText = await res.text();
            alert('Submission failed: ' + errText);
        }
    } catch (err) {
        console.error(err);
        alert('Network error during submission.');
    }
};

// ── Quiz Firewall: Block Navigation ──────────────────────────────────────────
window.addEventListener('beforeunload', (e) => {
    if (_quizActive) {
        e.preventDefault();
        e.returnValue = 'Quiz is in progress! You must submit before leaving.';
        return e.returnValue;
    }
});

// Block logout button while quiz is active
document.addEventListener('click', (e) => {
    if (!_quizActive) return;
    const target = e.target.closest('button, a');
    if (!target) return;
    // Allow only the quiz submit
    const isSubmit = target.closest('#sqForm');
    if (isSubmit) return;
    // Block close button
    if (target.id === 'sqCloseBtn' || target.closest('[data-bs-dismiss="modal"]')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        alert('⚠️ You cannot leave the quiz! Please submit your answers first.');
        return false;
    }
    // Block logout
    if (target.onclick && target.onclick.toString().includes('logout')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        alert('⚠️ Quiz is active! Submit the quiz before logging out.');
        return false;
    }
}, true);

// ── Utility ──────────────────────────────────────────────────────────────────
function _showSuccess(msg) {
    const el = document.createElement('div');
    el.className = 'alert alert-success position-fixed bottom-0 end-0 m-3 shadow-lg';
    el.style.cssText = 'z-index:9999;max-width:360px;';
    el.innerHTML = `<i class="fa-solid fa-check-circle me-2"></i>${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

/**
 * Dynamically loads Chart.js if not already loaded, then calls `cb`.
 */
function _ensureChartJs(cb) {
    if (window.Chart) { cb(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js';
    s.onload = cb;
    document.head.appendChild(s);
}


// ── Student Quiz History ──────────────────────────────────────────────────────
window.openStudentQuizHistoryModal = async () => {
    document.getElementById('sqHistoryDetailContainer').style.display = 'none';
    document.getElementById('sqHistoryListContainer').style.display = 'block';
    const listEl = document.getElementById('sqHistoryList');
    listEl.innerHTML = '<div class="text-center py-4 text-muted">Loading history...</div>';
    
    new bootstrap.Modal(document.getElementById('studentQuizHistoryModal')).show();

    const info = await _resolveStudentInfo();
    if (!info) {
        listEl.innerHTML = '<div class="alert alert-danger">Could not resolve student ID.</div>';
        return;
    }

    try {
        const fetchFn = (typeof apiFetch === 'function') ? apiFetch : fetch;
        const res = await fetchFn(`/api/quizzes/student/${info.studentId}/history`);
        if (!res.ok) throw new Error('Failed to fetch history');
        const history = await res.json();
        
        if (!history || history.length === 0) {
            listEl.innerHTML = '<div class="text-center py-4 text-muted">No quiz history found.</div>';
            return;
        }

        listEl.innerHTML = '';
        history.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        window._quizHistoryData = history;
        
        // ── Performance Summary Chart ─────────────────────────────────────────
        const perfChartId = 'sqHistoryPerfChart';
        const histLabels = [...history].reverse().map(s => s.quiz ? s.quiz.title.substring(0,15) : 'Quiz');
        const histPcts   = [...history].reverse().map(s => +(s.percentage||0).toFixed(1));
        const histAcc    = [...history].reverse().map(s => {
            if (!s.answers || !s.answers.length) return 0;
            const c = s.answers.filter(a => a.isCorrect).length;
            return +((c / s.answers.length) * 100).toFixed(1);
        });

        // Overall stats
        const totalAttempted = history.length;
        const avgScore = (history.reduce((s, r) => s + (r.percentage||0), 0) / totalAttempted).toFixed(1);
        const bestScore = Math.max(...history.map(r => r.percentage||0)).toFixed(1);
        const passedCount = history.filter(r => (r.percentage||0) >= 50).length;
        const overallLevel = parseFloat(avgScore) >= 75 ? {label:'Excellent 🌟',cls:'success'} :
                             parseFloat(avgScore) >= 50 ? {label:'Proficient ✅',cls:'info'} :
                             parseFloat(avgScore) >= 35 ? {label:'Developing 📈',cls:'warning'} :
                             {label:'Needs Improvement 📚',cls:'danger'};

        const summaryHtml = `
            <div class="mb-4 p-3 rounded" style="background:#0a041f;border:1px solid #6d28d9;">
                <h6 class="fw-bold mb-3" style="color:#a78bfa;"><i class="fa-solid fa-chart-line me-2"></i>My Performance Dashboard</h6>
                <div class="row g-2 mb-3">
                    <div class="col-3"><div class="p-2 rounded text-center" style="background:#0d1f12;border:1px solid #10b981;">
                        <div class="fs-5 fw-bold text-success">${avgScore}%</div><div class="tiny text-muted" style="font-size:0.72rem;">Avg Score</div></div></div>
                    <div class="col-3"><div class="p-2 rounded text-center" style="background:#0d1a3a;border:1px solid #3b82f6;">
                        <div class="fs-5 fw-bold text-info">${bestScore}%</div><div class="tiny text-muted" style="font-size:0.72rem;">Best Score</div></div></div>
                    <div class="col-3"><div class="p-2 rounded text-center" style="background:#1a1200;border:1px solid #eab308;">
                        <div class="fs-5 fw-bold text-warning">${passedCount}/${totalAttempted}</div><div class="tiny text-muted" style="font-size:0.72rem;">Passed</div></div></div>
                    <div class="col-3"><div class="p-2 rounded text-center" style="background:#120326;border:1px solid #8b5cf6;">
                        <span class="badge bg-${overallLevel.cls} fs-6">${overallLevel.label}</span><div class="tiny text-muted mt-1" style="font-size:0.72rem;">Level</div></div></div>
                </div>
                <canvas id="${perfChartId}" height="100"></canvas>
            </div>
        `;

        const summaryEl = document.createElement('div');
        summaryEl.innerHTML = summaryHtml;
        listEl.parentNode.insertBefore(summaryEl, listEl);

        history.forEach(sub => {
            const quizTitle = sub.quiz ? sub.quiz.title : 'Unknown Quiz';
            const subject = (sub.quiz && sub.quiz.subjectName) ? sub.quiz.subjectName : '';
            const dt = new Date(sub.submittedAt).toLocaleString();
            
            let calculatedMaxMarks = 0;
            if (sub.answers && sub.answers.length > 0) {
                calculatedMaxMarks = sub.answers.reduce((sum, ans) => sum + (ans.question ? ans.question.marks : 0), 0);
            }
            const displayMaxMarks = calculatedMaxMarks > 0 ? calculatedMaxMarks : '?';

            // Per-quiz accuracy
            let correct = 0, totalQ = 0;
            if (sub.answers && sub.answers.length > 0) {
                totalQ = sub.answers.length;
                correct = sub.answers.filter(a => a.isCorrect).length;
            }
            const qAccuracy = totalQ > 0 ? ((correct / totalQ)*100).toFixed(0) : '?';

            let badgeColor = 'bg-danger';
            let levelLabel = 'Needs Help';
            const p = sub.percentage || 0;
            if (p >= 75) { badgeColor = 'bg-success'; levelLabel = 'Excellent'; }
            else if (p >= 50) { badgeColor = 'bg-info'; levelLabel = 'Proficient'; }
            else if (p >= 35) { badgeColor = 'bg-warning text-dark'; levelLabel = 'Developing'; }

            const item = document.createElement('div');
            item.className = 'list-group-item list-group-item-action bg-dark text-white border-secondary mb-2 rounded d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <div class="d-flex w-100 align-items-center" style="cursor:pointer;" onclick="showQuizHistoryDetailsById(${sub.id})">
                    <div class="flex-grow-1">
                        <h6 class="mb-1 text-info fw-bold">${quizTitle} ${subject && subject !== 'null' ? `<small class="text-muted ms-2">${subject}</small>` : ''}</h6>
                        <small class="text-muted"><i class="fa-solid fa-calendar me-1"></i> ${dt}</small>
                        <div class="mt-1">
                            <span class="badge ${badgeColor} me-1">${levelLabel}</span>
                            <span class="badge bg-secondary me-1">Accuracy: ${qAccuracy}%</span>
                            <span class="badge bg-dark border border-secondary">${correct}/${totalQ} Correct</span>
                        </div>
                    </div>
                    <div class="text-end me-3">
                        <span class="badge ${badgeColor} fs-6">${sub.totalScore} / ${displayMaxMarks}</span>
                        <div class="small mt-1">${sub.percentage ? sub.percentage.toFixed(1) : '0'}%</div>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-danger" title="Delete History" onclick="deleteQuizHistory(${sub.id}, event)">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;
            listEl.appendChild(item);
        });

        // Render performance trend chart
        if (histPcts.length > 0) {
            setTimeout(() => {
                _ensureChartJs(() => {
                    const ctx = document.getElementById(perfChartId);
                    if (!ctx) return;
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: histLabels,
                            datasets: [
                                {
                                    label: 'Score %',
                                    data: histPcts,
                                    borderColor: '#8b5cf6',
                                    backgroundColor: 'rgba(139,92,246,0.1)',
                                    tension: 0.4,
                                    fill: true,
                                    pointBackgroundColor: '#a78bfa',
                                    pointRadius: 5
                                },
                                {
                                    label: 'Accuracy %',
                                    data: histAcc,
                                    borderColor: '#10b981',
                                    backgroundColor: 'rgba(16,185,129,0.08)',
                                    tension: 0.4,
                                    fill: true,
                                    pointBackgroundColor: '#10b981',
                                    pointRadius: 5
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: { labels: { color: '#94a3b8' } },
                                tooltip: { callbacks: { label: c => c.dataset.label + ': ' + c.raw + '%' } }
                            },
                            scales: {
                                y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', callback: v => v + '%' } },
                                x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 30 } }
                            }
                        }
                    });
                });
            }, 200);
        }

    } catch (e) {
        console.error(e);
        listEl.innerHTML = '<div class="alert alert-danger">Error loading quiz history.</div>';
    }
};

window.showQuizHistoryDetailsById = (subId) => {
    if (!window._quizHistoryData) return;
    const sub = window._quizHistoryData.find(s => s.id === subId);
    if (!sub) return;
    showQuizHistoryDetails(sub);
};

window.deleteQuizHistory = async (subId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this quiz history?")) return;
    
    try {
        const fetchFn = (typeof apiFetch === 'function') ? apiFetch : fetch;
        const res = await fetchFn(`/api/quizzes/submission/${subId}`, {
            method: 'DELETE'
        });
        
        if (!res.ok) throw new Error("Failed to delete history");
        
        // Refresh the list
        window.openStudentQuizHistoryModal();
    } catch (err) {
        console.error(err);
        alert("Error deleting quiz history.");
    }
};

window.showQuizHistoryDetails = (sub) => {
    document.getElementById('sqHistoryListContainer').style.display = 'none';
    const detailEl = document.getElementById('sqHistoryDetailContent');
    
    // Calculate max marks
    let calculatedMaxMarks = 0;
    if (sub.answers && sub.answers.length > 0) {
        calculatedMaxMarks = sub.answers.reduce((sum, ans) => sum + (ans.question ? ans.question.marks : 0), 0);
    }
    const displayMaxMarks = calculatedMaxMarks > 0 ? calculatedMaxMarks : '?';

    // Compute accuracy
    let correctCount = 0;
    if (sub.answers && sub.answers.length > 0) {
        correctCount = sub.answers.filter(a => a.isCorrect).length;
    }
    const totalQCount = sub.answers ? sub.answers.length : 0;
    const detailAccuracy = totalQCount > 0 ? ((correctCount / totalQCount)*100).toFixed(1) : '0.0';
    const detailLevel = parseFloat(sub.percentage||0) >= 75 ? {label:'Excellent 🌟',color:'#10b981'} :
                        parseFloat(sub.percentage||0) >= 50 ? {label:'Proficient ✅',color:'#3b82f6'} :
                        parseFloat(sub.percentage||0) >= 35 ? {label:'Developing 📈',color:'#eab308'} :
                        {label:'Needs Improvement 📚',color:'#ef4444'};
    const detailDonutId = 'detail_donut_' + sub.id;

    let html = `
        <h5 class="text-info fw-bold mb-1">${sub.quiz ? sub.quiz.title : 'Quiz'}</h5>
        <div class="mb-3 text-muted small">Submitted: ${new Date(sub.submittedAt).toLocaleString()}</div>
        <!-- Metrics Row -->
        <div class="row g-2 mb-4">
            <div class="col-6 col-md-3">
                <div class="p-2 rounded text-center" style="background:#0d1f12;border:1px solid #10b981;">
                    <div class="fs-5 fw-bold" style="color:${detailLevel.color}">${sub.percentage ? sub.percentage.toFixed(1) : '0'}%</div>
                    <div class="tiny text-muted" style="font-size:0.72rem;">Score</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="p-2 rounded text-center" style="background:#0d1a3a;border:1px solid #3b82f6;">
                    <div class="fs-5 fw-bold text-info">${detailAccuracy}%</div>
                    <div class="tiny text-muted" style="font-size:0.72rem;">Accuracy</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="p-2 rounded text-center" style="background:#1a1200;border:1px solid #eab308;">
                    <div class="fs-5 fw-bold text-warning">${correctCount}/${totalQCount}</div>
                    <div class="tiny text-muted" style="font-size:0.72rem;">Correct / Total</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="p-2 rounded text-center" style="background:#120326;border:1px solid #8b5cf6;">
                    <div style="color:${detailLevel.color};font-size:0.85rem;font-weight:bold;">${detailLevel.label}</div>
                    <div class="tiny text-muted" style="font-size:0.72rem;">Level</div>
                </div>
            </div>
        </div>
        <!-- Accuracy Donut -->
        <div class="d-flex justify-content-center mb-4">
            <div style="width:160px;height:160px;"><canvas id="${detailDonutId}"></canvas></div>
        </div>
        ${sub.aiWeaknessAnalysis ? `<div class="p-3 rounded mb-3" style="background:#1a0000;border:1px solid #dc2626;"><div class="text-warning small"><strong>AI Feedback:</strong><br/>${sub.aiWeaknessAnalysis.replace(/\\n/g, '<br/>')}</div></div>` : ''}
        <h6 class="fw-bold mb-3 border-bottom border-secondary pb-2">Questions & Answers</h6>
    `;

    if (!sub.answers || sub.answers.length === 0) {
        html += `<div class="text-muted small">No detailed answers available.</div>`;
    } else {
        sub.answers.forEach((ans, idx) => {
            const q = ans.question;
            const isCorrect = ans.isCorrect;
            
            let colorClass = isCorrect ? 'text-success' : 'text-danger';
            let icon = isCorrect ? '<i class="fa-solid fa-check text-success"></i>' : '<i class="fa-solid fa-xmark text-danger"></i>';

            html += `
                <div class="mb-4 p-3 border border-secondary rounded" style="background:#1e1e1e;">
                    <div class="fw-bold mb-2">Q${idx + 1}. ${q ? q.questionText : 'Unknown Question'}</div>
                    <div class="small mb-1"><span class="text-muted">Your Answer:</span> <span class="${colorClass} fw-bold">${ans.answerText || '-'}</span> ${icon}</div>
                    ${!isCorrect && q && q.correctAnswer ? `<div class="small"><span class="text-muted">Correct Answer:</span> <span class="text-success fw-bold">${q.correctAnswer}</span></div>` : ''}
                    <div class="small text-muted mt-2 text-end">Marks: ${ans.marksAwarded || 0} / ${q ? q.marks : '-'}</div>
                </div>
            `;
        });
    }

    detailEl.innerHTML = html;
    document.getElementById('sqHistoryDetailContainer').style.display = 'block';

    // Render detail donut chart
    _ensureChartJs(() => {
        const ctx = document.getElementById(detailDonutId);
        if (!ctx) return;
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Incorrect'],
                datasets: [{
                    data: [correctCount, Math.max(0, totalQCount - correctCount)],
                    backgroundColor: ['rgba(16,185,129,0.85)', 'rgba(239,68,68,0.7)'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '65%',
                plugins: {
                    legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
                    tooltip: { callbacks: { label: c => c.label + ': ' + c.raw } }
                }
            }
        });
    });
};

// ── Faculty: Delete Quiz ─────────────────────────────────────────────────────
window.quizDeleteSelected = async () => {
    const sel = document.getElementById('fqQuizSelect');
    if (!sel) return;
    const quizId = sel.value;
    if (!quizId) {
        showToast('Error', 'Please select a quiz to delete.');
        return;
    }
    
    const quizName = sel.options[sel.selectedIndex].text;
    
    if (!confirm('Are you sure you want to permanently delete the quiz "' + quizName + '" and ALL its results? This action cannot be undone.')) {
        return;
    }

    try {
        const res = await fetch('/api/quizzes/' + quizId, { method: 'DELETE' });
        if (res.ok) {
            showToast('Success', 'Quiz deleted successfully.');
            // Refresh the faculty list
            window.quizLoadFacultyList();
            document.getElementById('fqResultsBody').innerHTML = '';
            document.getElementById('fqDeleteQuizBtn').style.display = 'none';
        } else {
            showToast('Error', 'Failed to delete quiz.');
        }
    } catch (e) {
        console.error('Delete quiz error:', e);
        showToast('Error', 'Network error while deleting quiz.');
    }
};
