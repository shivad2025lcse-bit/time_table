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
    <!--  FACULTY: Manage Quizzes                                     -->
    <!-- ============================================================ -->
    <div class="modal fade" id="facultyQuizModal" tabindex="-1"
         data-bs-backdrop="static" data-bs-keyboard="false" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content" style="background:#1a1a2e;color:#e0e0ff;border:1px solid #7c3aed;">
                <div class="modal-header" style="border-bottom:1px solid #7c3aed;background:linear-gradient(135deg,#12002e,#1a0050);">
                    <h5 class="modal-title fw-bold">
                        <i class="fa-solid fa-clipboard-question text-warning me-2"></i>
                        Manage Class Quizzes
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <ul class="nav nav-tabs mb-4" role="tablist" style="border-bottom:1px solid #7c3aed;">
                        <li class="nav-item"><button class="nav-link active fw-bold" data-bs-toggle="tab" data-bs-target="#fqCreateTab" role="tab">➕ Create Quiz</button></li>
                        <li class="nav-item"><button class="nav-link fw-bold" data-bs-toggle="tab" data-bs-target="#fqResultsTab" role="tab" onclick="quizLoadFacultyList()">📊 View Results</button></li>
                    </ul>
                    <div class="tab-content">
                        <!-- CREATE TAB -->
                        <div class="tab-pane fade show active" id="fqCreateTab" role="tabpanel">
                            <form id="quizCreateForm" onsubmit="quizHandleCreate(event)">
                                <div class="row g-3 mb-4">
                                    <div class="col-md-5">
                                        <label class="form-label fw-semibold">Quiz Title *</label>
                                        <input type="text" id="fqTitle" class="form-control" style="background:#0d0d1a;color:#e0e0ff;border-color:#7c3aed;" placeholder="e.g. DBMS Unit-2 Quiz" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label fw-semibold">Section ID *</label>
                                        <input type="number" id="fqSectionId" class="form-control" style="background:#0d0d1a;color:#e0e0ff;border-color:#7c3aed;" placeholder="Enter Section ID (e.g. 1)" required min="1">
                                        <small class="text-muted">Check section IDs in Admin panel</small>
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label fw-semibold">Teacher (Auto)</label>
                                        <input type="text" id="fqTeacherDisplay" class="form-control" style="background:#0d0d1a;color:#aaa;border-color:#555;" readonly>
                                        <input type="hidden" id="fqTeacherId">
                                    </div>
                                </div>

                                <div id="fqQuestionsWrap">
                                    <div class="d-flex align-items-center justify-content-between mb-2">
                                        <h6 class="fw-bold mb-0 text-warning"><i class="fa-solid fa-list-ol me-1"></i>Questions</h6>
                                    </div>
                                    <!-- Dynamic question cards -->
                                </div>

                                <button type="button" class="btn btn-outline-info btn-sm mt-3"
                                    style="border-color:#06b6d4;" onclick="quizAddQuestion()">
                                    <i class="fa-solid fa-circle-plus me-1"></i> Add Question
                                </button>

                                <div class="mt-4 d-flex justify-content-end gap-2">
                                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" class="btn fw-bold" style="background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;">
                                        <i class="fa-solid fa-paper-plane me-1"></i> Create Quiz
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- RESULTS TAB -->
                        <div class="tab-pane fade" id="fqResultsTab" role="tabpanel">
                            <div class="mb-3">
                                <label class="form-label fw-semibold">Select Quiz</label>
                                <select id="fqQuizSelect" class="form-select" style="background:#0d0d1a;color:#e0e0ff;border-color:#7c3aed;" onchange="quizLoadResults(this.value)">
                                    <option value="">-- Choose a Quiz --</option>
                                </select>
                            </div>
                            <div id="fqResultsBody" class="mt-3"></div>
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
            <div class="modal-content" style="background:#0b1120;color:#e0f0ff;border:1px solid #3b82f6;">
                <div class="modal-header" style="border-bottom:1px solid #3b82f6;background:linear-gradient(135deg,#0a0a1a,#0d1f3c);">
                    <h5 class="modal-title fw-bold">
                        <i class="fa-solid fa-pen-to-square text-info me-2"></i>
                        Class Quiz
                    </h5>
                    <!-- No close button during active quiz - controlled by firewall -->
                    <button id="sqCloseBtn" type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
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

    document.getElementById('fqQuestionsWrap').innerHTML =
        '<div class="d-flex align-items-center justify-content-between mb-2"><h6 class="fw-bold mb-0 text-warning"><i class="fa-solid fa-list-ol me-1"></i>Questions</h6></div>';
    _questionCount = 0;
    quizAddQuestion();

    new bootstrap.Modal(document.getElementById('facultyQuizModal')).show();
};

// ── Faculty: Add Question Card ───────────────────────────────────────────────
window.quizAddQuestion = () => {
    _questionCount++;
    const n = _questionCount;
    const wrap = document.getElementById('fqQuestionsWrap');
    const card = document.createElement('div');
    card.className = 'quiz-q-card mb-3 p-3';
    card.id = 'qcard_' + n;
    card.style.cssText = 'background:#0d0d2e;border:1px solid #7c3aed;border-radius:10px;';
    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-bold text-warning">Q${n}</span>
            <button type="button" class="btn btn-sm btn-outline-danger px-2 py-0" onclick="document.getElementById('qcard_${n}').remove()">✕</button>
        </div>
        <div class="mb-2">
            <label class="form-label small fw-semibold">Question Text *</label>
            <input type="text" class="form-control q-text" data-qid="${n}"
                style="background:#0a0a1a;color:#e0e0ff;border-color:#7c3aed;" placeholder="Type your question here..." required>
        </div>
        <div class="mb-2">
            <label class="form-label small fw-semibold">Question Type *</label>
            <select class="form-select q-type" data-qid="${n}"
                style="background:#0a0a1a;color:#e0e0ff;border-color:#7c3aed;" onchange="quizToggleType(this,${n})">
                <option value="MCQ">Multiple Choice (MCQ)</option>
                <option value="DESCRIPTIVE">Descriptive</option>
            </select>
        </div>

        <!-- MCQ Options Section -->
        <div class="mcq-section-${n}">
            <label class="form-label small fw-semibold">Options (A, B, C, D)</label>
            <div class="row g-2 mb-2">
                <div class="col-md-6">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background:#1a003a;color:#a78bfa;border-color:#7c3aed;">A</span>
                        <input type="text" class="form-control q-opt" data-qid="${n}" data-opt="0"
                            style="background:#0a0a1a;color:#e0e0ff;border-color:#7c3aed;" placeholder="Option A" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background:#1a003a;color:#a78bfa;border-color:#7c3aed;">B</span>
                        <input type="text" class="form-control q-opt" data-qid="${n}" data-opt="1"
                            style="background:#0a0a1a;color:#e0e0ff;border-color:#7c3aed;" placeholder="Option B" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background:#1a003a;color:#a78bfa;border-color:#7c3aed;">C</span>
                        <input type="text" class="form-control q-opt" data-qid="${n}" data-opt="2"
                            style="background:#0a0a1a;color:#e0e0ff;border-color:#7c3aed;" placeholder="Option C">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background:#1a003a;color:#a78bfa;border-color:#7c3aed;">D</span>
                        <input type="text" class="form-control q-opt" data-qid="${n}" data-opt="3"
                            style="background:#0a0a1a;color:#e0e0ff;border-color:#7c3aed;" placeholder="Option D">
                    </div>
                </div>
            </div>
            <div class="mb-2">
                <label class="form-label small fw-semibold">Correct Answer (type exactly as option)</label>
                <input type="text" class="form-control q-answer" data-qid="${n}"
                    style="background:#0a0a1a;color:#10b981;border-color:#10b981;" placeholder="e.g. Database Management System" required>
            </div>
        </div>

        <!-- Descriptive Section (hidden by default) -->
        <div class="desc-section-${n}" style="display:none;">
            <div class="mb-2">
                <label class="form-label small fw-semibold">Model Answer (for faculty reference)</label>
                <textarea class="form-control q-answer-desc" data-qid="${n}" rows="3"
                    style="background:#0a0a1a;color:#10b981;border-color:#10b981;" placeholder="Type the ideal answer here..."></textarea>
            </div>
        </div>

        <div class="mt-2">
            <label class="form-label small fw-semibold">Marks</label>
            <input type="number" class="form-control form-control-sm q-marks" data-qid="${n}"
                style="background:#0a0a1a;color:#e0e0ff;border-color:#7c3aed;max-width:120px;" value="10" min="1" required>
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
            document.getElementById('fqQuestionsWrap').innerHTML =
                '<div class="d-flex align-items-center justify-content-between mb-2"><h6 class="fw-bold mb-0 text-warning"><i class="fa-solid fa-list-ol me-1"></i>Questions</h6></div>';
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
    if (!quizId) { body.innerHTML = ''; return; }
    body.innerHTML = '<div class="text-muted">Loading...</div>';

    const [allRes, weakRes] = await Promise.all([
        fetch('/api/quizzes/' + quizId + '/results'),
        fetch('/api/quizzes/' + quizId + '/results/weak')
    ]);
    const all  = await allRes.json();
    const weak = await weakRes.json();

    const tableRows = all.map(r => {
        const pct = r.percentage != null ? r.percentage.toFixed(1) : '0.0';
        const badge = r.percentage >= 50
            ? `<span class="badge bg-success">${pct}%</span>`
            : `<span class="badge bg-danger">${pct}%</span>`;
        const name = r.student ? (r.student.studentName || ('ID:' + r.student.id)) : 'Unknown';
        return `<tr><td>${name}</td><td>${r.totalScore ?? 0}</td><td>${badge}</td></tr>`;
    }).join('');

    const weakCards = weak.length === 0
        ? '<p class="text-success fw-bold"><i class="fa-solid fa-trophy me-1"></i> All students scored 50% or above!</p>'
        : weak.map(r => {
            const name = r.student ? (r.student.studentName || ('ID:' + r.student.id)) : 'Unknown';
            const pct = r.percentage != null ? r.percentage.toFixed(1) : '0.0';
            return `
            <div class="card mb-3" style="background:#1a0000;border:1px solid #dc2626;">
                <div class="card-header d-flex justify-content-between align-items-center" style="background:#2d0000;">
                    <strong class="text-danger"><i class="fa-solid fa-user-xmark me-1"></i>${name}</strong>
                    <span class="badge bg-danger">${pct}%</span>
                </div>
                <div class="card-body">
                    <h6 class="text-warning"><i class="fa-solid fa-robot me-1"></i>AI Weakness Analysis</h6>
                    <p style="color:#fde68a;white-space:pre-wrap;">${r.aiWeaknessAnalysis || 'No analysis available.'}</p>
                </div>
            </div>`;
        }).join('');

    body.innerHTML = `
        <h6 class="fw-bold mb-2">All Submissions (${all.length})</h6>
        <div class="table-responsive mb-4">
            <table class="table table-sm" style="color:#e0e0ff;background:#0d0d2e;">
                <thead style="background:#1a003a;">
                    <tr><th>Student</th><th>Score</th><th>Percentage</th></tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
        <h6 class="fw-bold text-danger mb-2"><i class="fa-solid fa-triangle-exclamation me-1"></i>Needs Attention (below 50%)</h6>
        ${weakCards}
    `;
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

            document.getElementById('sqResultContainer').style.display = 'block';
            document.getElementById('sqResultContainer').innerHTML = `
                <div class="text-center mb-4">
                    <div style="font-size:4rem;">${isPassed ? '🎉' : '📚'}</div>
                    <h4 class="fw-bold mt-2" style="color:${isPassed ? '#10b981' : '#ef4444'}">
                        ${isPassed ? 'Well Done!' : 'Needs Improvement'}
                    </h4>
                    <div class="display-4 fw-bold" style="color:${isPassed ? '#10b981' : '#ef4444'}">${pct}%</div>
                    <p class="text-muted mt-1">Score: ${sub.totalScore ?? 0}</p>
                </div>
                ${!isPassed && sub.aiWeaknessAnalysis ? `
                <div class="p-3 rounded" style="background:#1a0000;border:1px solid #dc2626;">
                    <h6 class="text-warning fw-bold"><i class="fa-solid fa-robot me-1"></i>AI Study Recommendations</h6>
                    <p style="color:#fde68a;white-space:pre-wrap;">${sub.aiWeaknessAnalysis}</p>
                </div>` : ''}
                <div class="text-center mt-4">
                    <button class="btn btn-outline-info" data-bs-dismiss="modal">Close</button>
                </div>
            `;
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
