// ===========================================================================
// CAPACITY CONNECT - AI-Powered Quiz & Knowledge Assessment Module
// Integrated with Smart Timetable Scheduler (SIH26075)
// ===========================================================================

// ── Boot ────────────────────────────────────────────────────────────────────
(function () {
    function boot() {
        if (document.getElementById('ccQuizFacultyModal')) return;
        _injectModals();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();

// ── State ────────────────────────────────────────────────────────────────────
let _quizActive = false;
let _currentQuiz = null;           // Quiz object being attempted
let _answers = {};                 // { questionId: answerText }
let _markedReview = new Set();     // question IDs marked for review
let _currentQIdx = 0;
let _timerInterval = null;
let _timerRemaining = 0;
let _questionCount = 0;            // counter for faculty question cards
let _aiGeneratedQuestions = [];    // questions returned by AI, pending review
let _resolvedStudentId = null;
let _resolvedSectionId = null;

// ── Session helpers ──────────────────────────────────────────────────────────
const _username = () => localStorage.getItem('sece_logged_in_user') || '';
const _token    = () => localStorage.getItem('jwt_token') || '';
const _authHdr  = () => _token() ? { 'Authorization': 'Bearer ' + _token() } : {};

async function _resolveStudent() {
    if (_resolvedStudentId) return { studentId: _resolvedStudentId, sectionId: _resolvedSectionId };
    try {
        const res  = await fetch('/api/students', { headers: _authHdr() });
        if (!res.ok) return null;
        const list = await res.json();
        const me   = list.find(s =>
            (s.user && s.user.username === _username()) ||
            s.username === _username() ||
            String(s.registerNumber || '').toLowerCase() === _username()
        );
        if (!me) return null;
        _resolvedStudentId = me.id;
        _resolvedSectionId = me.section ? me.section.id : null;
        return { studentId: me.id, sectionId: me.section ? me.section.id : null };
    } catch { return null; }
}

async function _resolveTeacher() {
    try {
        const res  = await fetch('/api/teachers', { headers: _authHdr() });
        if (!res.ok) return null;
        const list = await res.json();
        const me   = list.find(t =>
            (t.user && t.user.username === _username()) || t.username === _username()
        );
        return me ? me.id : null;
    } catch { return null; }
}

// ── Competency helper ────────────────────────────────────────────────────────
function _competencyLabel(pct) {
    if (pct >= 90) return { label: 'Excellent', color: '#10b981', emoji: '🏆' };
    if (pct >= 75) return { label: 'Good',      color: '#3b82f6', emoji: '👍' };
    if (pct >= 50) return { label: 'Developing',color: '#f59e0b', emoji: '📈' };
    return { label: 'Needs Improvement', color: '#ef4444', emoji: '📚' };
}

// ── Toast helper ─────────────────────────────────────────────────────────────
function _toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = 'position-fixed bottom-0 end-0 m-3 p-3 rounded shadow-lg fw-bold';
    el.style.cssText = `z-index:99999;max-width:380px;background:${type === 'success' ? '#064e3b' : '#7f1d1d'};color:#fff;border:1px solid ${type === 'success' ? '#10b981' : '#ef4444'};`;
    el.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'triangle-exclamation'} me-2"></i>${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

// ===========================================================================
// MODAL HTML INJECTION
// ===========================================================================
function _injectModals() {
    const html = `
<!-- =========================================================
     FACULTY: Manage Quizzes (Create + AI Generate + Results)
     ========================================================= -->
<div class="modal fade" id="ccQuizFacultyModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
  <div class="modal-dialog modal-xl modal-dialog-scrollable">
    <div class="modal-content" style="background:#0d0d1e;color:#e0e0ff;border:1px solid #7c3aed;">
      <div class="modal-header" style="background:linear-gradient(135deg,#0a0020,#160040);border-bottom:1px solid #7c3aed;">
        <div>
          <h5 class="fw-bold mb-0"><i class="fa-solid fa-brain text-warning me-2"></i>Capacity Connect – Quiz Management</h5>
          <small class="text-muted">SIH26075 – Knowledge Assessment Module</small>
        </div>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body p-0">
        <ul class="nav nav-tabs px-3 pt-2" style="border-bottom:1px solid #7c3aed;">
          <li class="nav-item"><button class="nav-link active text-light fw-bold" data-bs-toggle="tab" data-bs-target="#ccFqCreate" type="button">✏️ Create Quiz</button></li>
          <li class="nav-item"><button class="nav-link text-light fw-bold" data-bs-toggle="tab" data-bs-target="#ccFqAI" type="button" onclick="ccFacultyAITab()">🤖 AI Generator</button></li>
          <li class="nav-item"><button class="nav-link text-light fw-bold" data-bs-toggle="tab" data-bs-target="#ccFqResults" type="button" onclick="ccLoadFacultyQuizzes()">📊 Class Analytics</button></li>
        </ul>
        <div class="tab-content p-4">

          <!-- CREATE QUIZ TAB -->
          <div class="tab-pane fade show active" id="ccFqCreate">
            <form id="ccCreateQuizForm" onsubmit="ccHandleCreateQuiz(event)">
              <div class="row g-3 mb-3">
                <div class="col-md-5">
                  <label class="form-label fw-semibold">Quiz Title *</label>
                  <input type="text" id="ccFqTitle" class="form-control cc-inp" placeholder="e.g. Data Structures – Linked List Quiz" required>
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-semibold">Subject</label>
                  <input type="text" id="ccFqSubject" class="form-control cc-inp" placeholder="e.g. Data Structures">
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Topic / Chapter</label>
                  <input type="text" id="ccFqTopic" class="form-control cc-inp" placeholder="e.g. Linked List">
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-semibold">Section ID *</label>
                  <input type="number" id="ccFqSectionId" class="form-control cc-inp" placeholder="e.g. 1" required min="1">
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-semibold">Teacher (Auto)</label>
                  <input type="text" id="ccFqTeacherDisplay" class="form-control cc-inp-ro" readonly>
                  <input type="hidden" id="ccFqTeacherId">
                </div>
                <div class="col-md-2">
                  <label class="form-label fw-semibold">Difficulty</label>
                  <select id="ccFqDifficulty" class="form-select cc-sel">
                    <option>Easy</option><option selected>Medium</option><option>Hard</option>
                  </select>
                </div>
                <div class="col-md-2">
                  <label class="form-label fw-semibold">Duration (min)</label>
                  <input type="number" id="ccFqDuration" class="form-control cc-inp" value="15" min="1">
                </div>
                <div class="col-md-2">
                  <label class="form-label fw-semibold">Pass % </label>
                  <input type="number" id="ccFqPassPct" class="form-control cc-inp" value="50" min="1" max="100">
                </div>
              </div>

              <div class="d-flex align-items-center justify-content-between mb-2">
                <h6 class="fw-bold mb-0 text-warning"><i class="fa-solid fa-list-ol me-1"></i>Questions</h6>
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-sm" style="background:#1e3a5f;color:#93c5fd;border:1px solid #3b82f6;" onclick="ccImportAIQuestions()">📋 Import from AI</button>
                  <button type="button" class="btn btn-sm" style="background:#1a003a;color:#a78bfa;border:1px solid #7c3aed;" onclick="ccAddQuestion()">+ Add Question</button>
                </div>
              </div>
              <div id="ccFqQuestionsWrap"></div>

              <div class="mt-4 d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn fw-bold px-4" style="background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;">
                  <i class="fa-solid fa-paper-plane me-1"></i> Publish Quiz
                </button>
              </div>
            </form>
          </div>

          <!-- AI GENERATOR TAB -->
          <div class="tab-pane fade" id="ccFqAI">
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold">Topic *</label>
                <input type="text" id="ccAITopic" class="form-control cc-inp" placeholder="e.g. Linked Lists in Data Structures">
              </div>
              <div class="col-md-2">
                <label class="form-label fw-semibold">Difficulty</label>
                <select id="ccAIDifficulty" class="form-select cc-sel">
                  <option>Easy</option><option selected>Medium</option><option>Hard</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label fw-semibold">No. Questions</label>
                <input type="number" id="ccAICount" class="form-control cc-inp" value="5" min="1" max="20">
              </div>
              <div class="col-md-2">
                <label class="form-label fw-semibold">Type</label>
                <select id="ccAIType" class="form-select cc-sel">
                  <option value="MCQ">MCQ</option>
                  <option value="DESCRIPTIVE">Descriptive</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Learning Objectives / Notes</label>
                <textarea id="ccAINotes" class="form-control cc-inp" rows="4" placeholder="Paste your lesson notes or learning objectives here. The AI will generate questions based ONLY on this content..."></textarea>
              </div>
            </div>
            <button type="button" class="btn fw-bold px-4 mb-4" style="background:linear-gradient(135deg,#1a003a,#3b0080);color:#fff;border:1px solid #7c3aed;" onclick="ccGenerateAIQuestions()">
              <i class="fa-solid fa-robot me-2"></i>Generate Questions with AI
            </button>

            <div id="ccAIResultsWrap" style="display:none;">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="fw-bold text-warning mb-0"><i class="fa-solid fa-eye me-1"></i>Review AI Questions (Edit before publishing)</h6>
                <button type="button" class="btn btn-sm" style="background:#064e3b;color:#6ee7b7;border:1px solid #10b981;" onclick="ccSendAIToCreate()">
                  ✅ Use These Questions
                </button>
              </div>
              <div id="ccAIQuestionsList"></div>
            </div>
          </div>

          <!-- CLASS ANALYTICS TAB -->
          <div class="tab-pane fade" id="ccFqResults">
            <div class="mb-3 d-flex gap-2 align-items-end">
              <div class="flex-grow-1">
                <label class="form-label fw-semibold">Select Quiz</label>
                <select id="ccFqQuizSelect" class="form-select cc-sel" onchange="ccLoadClassAnalytics(this.value)">
                  <option value="">-- Choose a Quiz --</option>
                </select>
              </div>
              <button type="button" class="btn btn-outline-danger" onclick="ccDeleteQuiz()" title="Delete Selected Quiz">
                <i class="fa-solid fa-trash me-1"></i> Delete
              </button>
            </div>
            <div id="ccClassAnalyticsBody"></div>
          </div>

        </div>
      </div>
    </div>
  </div>
</div>

<!-- =========================================================
     STUDENT: My Quizzes (List + Quiz Interface + Results)
     ========================================================= -->
<div class="modal fade" id="ccQuizStudentModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
  <div class="modal-dialog modal-xl modal-dialog-scrollable">
    <div class="modal-content" style="background:#080e1a;color:#e0f0ff;border:1px solid #1d4ed8;">
      <div class="modal-header" style="background:linear-gradient(135deg,#050a14,#0c1f40);border-bottom:1px solid #1d4ed8;">
        <div>
          <h5 class="fw-bold mb-0"><i class="fa-solid fa-graduation-cap text-info me-2"></i>My Quizzes</h5>
          <small class="text-muted" id="ccSqTimerWrap" style="display:none;">
            ⏱️ Time remaining: <span id="ccSqTimer" class="fw-bold text-warning">--:--</span>
          </small>
        </div>
        <button id="ccSqCloseBtn" type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body p-0">
        <div class="tab-content">

          <!-- QUIZ LIST -->
          <div id="ccSqListView" class="p-4">
            <h6 class="fw-bold text-info mb-3">Available Quizzes</h6>
            <div id="ccSqQuizCards"></div>
          </div>

          <!-- QUIZ INTERFACE -->
          <div id="ccSqQuizView" style="display:none;">
            <div class="d-flex gap-0" style="min-height:60vh;">
              <!-- Sidebar navigation -->
              <div class="p-3" style="width:200px;min-width:140px;background:#0a1020;border-right:1px solid #1d4ed8;flex-shrink:0;">
                <p class="fw-bold text-info mb-2 small">Questions</p>
                <div id="ccSqNavGrid" class="d-flex flex-wrap gap-1 mb-3"></div>
                <div class="mt-3" style="font-size:0.7rem;">
                  <div class="d-flex align-items-center gap-1 mb-1"><span style="width:16px;height:16px;background:#10b981;border-radius:3px;display:inline-block;"></span> Answered</div>
                  <div class="d-flex align-items-center gap-1 mb-1"><span style="width:16px;height:16px;background:#0a1020;border:1px solid #475569;border-radius:3px;display:inline-block;"></span> Not Answered</div>
                  <div class="d-flex align-items-center gap-1"><span style="width:16px;height:16px;background:#f59e0b;border-radius:3px;display:inline-block;"></span> Marked Review</div>
                </div>
              </div>
              <!-- Question body -->
              <div class="p-4 flex-grow-1">
                <div id="ccSqQuestionBody"></div>
                <div class="d-flex justify-content-between mt-4">
                  <button class="btn btn-outline-secondary" onclick="ccNavQuestion(-1)"><i class="fa-solid fa-arrow-left me-1"></i>Previous</button>
                  <button class="btn btn-outline-warning" onclick="ccMarkReview()"><i class="fa-regular fa-bookmark me-1"></i>Mark for Review</button>
                  <button class="btn btn-outline-info" onclick="ccNavQuestion(1)">Next<i class="fa-solid fa-arrow-right ms-1"></i></button>
                </div>
              </div>
            </div>
            <div class="p-3 d-flex justify-content-end" style="border-top:1px solid #1d4ed8;background:#0a1020;">
              <button class="btn fw-bold px-5" style="background:linear-gradient(135deg,#10b981,#3b82f6);color:#fff;" onclick="ccConfirmSubmit()">
                <i class="fa-solid fa-check-circle me-1"></i>Submit Quiz
              </button>
            </div>
          </div>

          <!-- RESULTS VIEW -->
          <div id="ccSqResultView" class="p-4" style="display:none;"></div>

        </div>
      </div>
    </div>
  </div>
</div>

<style>
.cc-inp  { background:#0a0a1e;color:#e0e0ff;border-color:#7c3aed; }
.cc-inp:focus { background:#0a0a1e;color:#e0e0ff;border-color:#a78bfa;box-shadow:0 0 0 3px rgba(124,58,237,.2); }
.cc-inp-ro { background:#050510;color:#888;border-color:#444; }
.cc-sel  { background:#0a0a1e;color:#e0e0ff;border-color:#7c3aed; }
.cc-qcard { background:#0d0d2e;border:1px solid #7c3aed;border-radius:12px;padding:16px;margin-bottom:12px; }
.cc-opt-btn { border:1px solid #1d4ed8;background:#0a1020;color:#93c5fd;border-radius:8px;padding:10px 14px;text-align:left;width:100%;margin-bottom:6px;cursor:pointer;transition:.2s; }
.cc-opt-btn:hover { border-color:#3b82f6;background:#0d1f3c; }
.cc-opt-btn.selected { border-color:#10b981;background:#064e3b;color:#6ee7b7; }
.cc-nav-btn { width:30px;height:30px;border-radius:6px;border:1px solid #475569;background:#0a1020;color:#94a3b8;font-size:.8rem;cursor:pointer;display:flex;align-items:center;justify-content:center; }
.cc-nav-btn.answered { background:#10b981;border-color:#10b981;color:#fff; }
.cc-nav-btn.marked { background:#f59e0b;border-color:#f59e0b;color:#fff; }
.cc-nav-btn.current { outline:2px solid #fff;outline-offset:1px; }
</style>
    `;
    const d = document.createElement('div');
    d.innerHTML = html;
    document.body.appendChild(d);
}

// ===========================================================================
// FACULTY: Open Modal
// ===========================================================================
window.openFacultyQuizModal = async () => {
    const tchId = await _resolveTeacher() || 1;
    document.getElementById('ccFqTeacherId').value = tchId;
    document.getElementById('ccFqTeacherDisplay').value = 'ID: ' + tchId + ' (auto)';

    // Reset form and questions
    document.getElementById('ccCreateQuizForm').reset();
    document.getElementById('ccFqTeacherId').value = tchId;
    document.getElementById('ccFqTeacherDisplay').value = 'ID: ' + tchId + ' (auto)';
    document.getElementById('ccFqQuestionsWrap').innerHTML = '';
    _questionCount = 0;
    _aiGeneratedQuestions = [];
    ccAddQuestion();

    new bootstrap.Modal(document.getElementById('ccQuizFacultyModal')).show();
};

// ===========================================================================
// FACULTY: Add Manual Question Card
// ===========================================================================
window.ccAddQuestion = () => {
    _questionCount++;
    const n = _questionCount;
    const wrap = document.getElementById('ccFqQuestionsWrap');
    const card = document.createElement('div');
    card.className = 'cc-qcard';
    card.id = 'ccQCard_' + n;
    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="fw-bold text-warning">Q${n}</span>
          <button type="button" class="btn btn-sm btn-outline-danger px-2 py-0" onclick="document.getElementById('ccQCard_${n}').remove()">✕</button>
        </div>
        <div class="mb-2">
          <input type="text" class="form-control cc-inp q-text" placeholder="Question text *" required>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-md-4">
            <select class="form-select cc-sel q-type" onchange="ccToggleQType(this,${n})">
              <option value="MCQ">MCQ</option>
              <option value="DESCRIPTIVE">Descriptive</option>
              <option value="TRUE_FALSE">True / False</option>
              <option value="FILL_BLANK">Fill in the Blank</option>
            </select>
          </div>
          <div class="col-md-4">
            <input type="text" class="form-control cc-inp q-topic" placeholder="Topic / Concept tested">
          </div>
          <div class="col-md-2">
            <select class="form-select cc-sel q-diff">
              <option>Easy</option><option selected>Medium</option><option>Hard</option>
            </select>
          </div>
          <div class="col-md-2">
            <input type="number" class="form-control cc-inp q-marks" value="10" min="1" placeholder="Marks">
          </div>
        </div>
        <div class="mcq-opts-${n}">
          <div class="row g-2 mb-2">
            <div class="col-md-6"><div class="input-group input-group-sm"><span class="input-group-text" style="background:#1a003a;color:#a78bfa;border-color:#7c3aed;">A</span><input type="text" class="form-control cc-inp q-opt" placeholder="Option A"></div></div>
            <div class="col-md-6"><div class="input-group input-group-sm"><span class="input-group-text" style="background:#1a003a;color:#a78bfa;border-color:#7c3aed;">B</span><input type="text" class="form-control cc-inp q-opt" placeholder="Option B"></div></div>
            <div class="col-md-6"><div class="input-group input-group-sm"><span class="input-group-text" style="background:#1a003a;color:#a78bfa;border-color:#7c3aed;">C</span><input type="text" class="form-control cc-inp q-opt" placeholder="Option C"></div></div>
            <div class="col-md-6"><div class="input-group input-group-sm"><span class="input-group-text" style="background:#1a003a;color:#a78bfa;border-color:#7c3aed;">D</span><input type="text" class="form-control cc-inp q-opt" placeholder="Option D"></div></div>
          </div>
          <div class="mb-2"><input type="text" class="form-control cc-inp q-answer" placeholder="Correct answer (type exactly as option)"></div>
        </div>
        <div class="desc-box-${n}" style="display:none;">
          <textarea class="form-control cc-inp q-answer-desc" rows="4" placeholder="Model answer / expected response..."></textarea>
        </div>
        <div class="tf-box-${n}" style="display:none;">
          <div class="row g-2">
            <div class="col-md-6"><div class="input-group input-group-sm"><span class="input-group-text" style="background:#1a003a;color:#a78bfa;border-color:#7c3aed;">A</span><input type="text" class="form-control cc-inp q-opt" value="True" readonly></div></div>
            <div class="col-md-6"><div class="input-group input-group-sm"><span class="input-group-text" style="background:#1a003a;color:#a78bfa;border-color:#7c3aed;">B</span><input type="text" class="form-control cc-inp q-opt" value="False" readonly></div></div>
          </div>
          <div class="mt-2"><input type="text" class="form-control cc-inp q-answer" placeholder="Correct: True or False"></div>
        </div>
        <div class="fb-box-${n}" style="display:none;">
          <input type="text" class="form-control cc-inp q-answer" placeholder="Correct fill-in-the-blank answer">
        </div>
    `;
    wrap.appendChild(card);
};

window.ccToggleQType = (sel, n) => {
    document.querySelector('.mcq-opts-' + n).style.display = sel.value === 'MCQ'         ? '' : 'none';
    document.querySelector('.desc-box-' + n).style.display = sel.value === 'DESCRIPTIVE'  ? '' : 'none';
    document.querySelector('.tf-box-' + n).style.display   = sel.value === 'TRUE_FALSE'   ? '' : 'none';
    document.querySelector('.fb-box-' + n).style.display   = sel.value === 'FILL_BLANK'   ? '' : 'none';
};

// ===========================================================================
// FACULTY: AI Generator Tab
// ===========================================================================
window.ccFacultyAITab = () => {
    document.getElementById('ccAIResultsWrap').style.display = 'none';
    document.getElementById('ccAIQuestionsList').innerHTML = '';
    _aiGeneratedQuestions = [];
};

window.ccGenerateAIQuestions = async () => {
    const topic      = document.getElementById('ccAITopic').value.trim();
    const notes      = document.getElementById('ccAINotes').value.trim();
    const difficulty = document.getElementById('ccAIDifficulty').value;
    const count      = parseInt(document.getElementById('ccAICount').value) || 5;
    const type       = document.getElementById('ccAIType').value;

    if (!topic) { alert('Please enter a topic.'); return; }

    const btn = document.querySelector('#ccFqAI button');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/quizzes/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ..._authHdr() },
            body: JSON.stringify({ topic, notes, difficulty, count, type })
        });
        if (!res.ok) throw new Error(await res.text());
        _aiGeneratedQuestions = await res.json();
        _renderAIQuestions();
    } catch (err) {
        alert('AI generation failed: ' + err.message);
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-robot me-2"></i>Generate Questions with AI';
        btn.disabled = false;
    }
};

function _renderAIQuestions() {
    const wrap = document.getElementById('ccAIQuestionsList');
    wrap.innerHTML = _aiGeneratedQuestions.map((q, i) => `
        <div class="cc-qcard mb-3" id="aiQ_${i}">
          <div class="d-flex justify-content-between mb-2">
            <span class="fw-bold text-warning">Q${i+1} <span class="badge ms-1" style="background:#1a003a;color:#a78bfa;">${q.difficulty || 'Medium'}</span>
            ${q.topicConcept ? `<span class="badge ms-1" style="background:#0c2a1a;color:#6ee7b7;">${q.topicConcept}</span>` : ''}</span>
            <button type="button" class="btn btn-sm btn-outline-danger px-2 py-0" onclick="_aiGeneratedQuestions.splice(${i},1);_renderAIQuestions()">✕</button>
          </div>
          <div class="mb-2">
            <input type="text" class="form-control cc-inp" value="${_esc(q.questionText)}" onchange="_aiGeneratedQuestions[${i}].questionText=this.value">
          </div>
          ${q.type === 'MCQ' ? `
            <div class="row g-2 mb-2">
              ${(q.options||'').split(',').map((opt,oi) => `
                <div class="col-md-6"><div class="input-group input-group-sm">
                  <span class="input-group-text" style="background:#1a003a;color:#a78bfa;border-color:#7c3aed;">${['A','B','C','D'][oi]}</span>
                  <input type="text" class="form-control cc-inp" value="${_esc(opt.trim())}"
                    onchange="let o=_aiGeneratedQuestions[${i}].options.split(',');o[${oi}]=this.value;_aiGeneratedQuestions[${i}].options=o.join(',')">
                </div></div>`).join('')}
            </div>
            <div class="mb-2"><label class="form-label small fw-semibold text-success">✅ Correct Answer</label>
              <input type="text" class="form-control cc-inp" style="border-color:#10b981;" value="${_esc(q.correctAnswer)}" onchange="_aiGeneratedQuestions[${i}].correctAnswer=this.value">
            </div>
            ${q.explanation ? `<div class="p-2 rounded" style="background:#0a1a0a;border:1px solid #166534;color:#86efac;font-size:.85rem;">💡 ${_esc(q.explanation)}</div>` : ''}
          ` : `
            <textarea class="form-control cc-inp" rows="3" onchange="_aiGeneratedQuestions[${i}].correctAnswer=this.value">${_esc(q.correctAnswer||q.explanation||'')}</textarea>
          `}
        </div>
    `).join('');
    document.getElementById('ccAIResultsWrap').style.display = _aiGeneratedQuestions.length ? 'block' : 'none';
}

window.ccSendAIToCreate = () => {
    // Switch to Create tab and import questions
    document.querySelector('[data-bs-target="#ccFqCreate"]').click();
    document.getElementById('ccFqQuestionsWrap').innerHTML = '';
    _questionCount = 0;
    _aiGeneratedQuestions.forEach((q, i) => {
        _questionCount++;
        const n = _questionCount;
        const wrap = document.getElementById('ccFqQuestionsWrap');
        const card = document.createElement('div');
        card.className = 'cc-qcard';
        card.id = 'ccQCard_' + n;
        const opts = (q.options || '').split(',').map(o => o.trim()).filter(Boolean);
        const letters = ['A','B','C','D'];
        const optsHtml = opts.map((opt, oi) => `
            <div class="col-md-6"><div class="input-group input-group-sm">
              <span class="input-group-text" style="background:#1a003a;color:#a78bfa;border-color:#7c3aed;">${letters[oi]}</span>
              <input type="text" class="form-control cc-inp q-opt" value="${_esc(opt)}">
            </div></div>`).join('');
        card.innerHTML = `
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-bold text-warning">Q${n} <span class="badge" style="background:#1a003a;color:#a78bfa;">${q.difficulty||'Medium'}</span> <span class="badge" style="background:#0c2a1a;color:#6ee7b7;">${q.topicConcept||''}</span></span>
            <button type="button" class="btn btn-sm btn-outline-danger px-2 py-0" onclick="document.getElementById('ccQCard_${n}').remove()">✕</button>
          </div>
          <div class="mb-2"><input type="text" class="form-control cc-inp q-text" value="${_esc(q.questionText)}" required></div>
          <div class="row g-2 mb-2">
            <div class="col-md-4"><select class="form-select cc-sel q-type"><option ${q.type==='MCQ'?'selected':''}>MCQ</option><option ${q.type==='DESCRIPTIVE'?'selected':''}>DESCRIPTIVE</option></select></div>
            <div class="col-md-4"><input type="text" class="form-control cc-inp q-topic" value="${_esc(q.topicConcept||'')}"></div>
            <div class="col-md-2"><select class="form-select cc-sel q-diff"><option ${q.difficulty==='Easy'?'selected':''}>Easy</option><option ${(q.difficulty||'Medium')==='Medium'?'selected':''}>Medium</option><option ${q.difficulty==='Hard'?'selected':''}>Hard</option></select></div>
            <div class="col-md-2"><input type="number" class="form-control cc-inp q-marks" value="${q.marks||10}"></div>
          </div>
          <div class="mcq-opts-${n}">
            <div class="row g-2 mb-2">${optsHtml}</div>
            <input type="text" class="form-control cc-inp q-answer" value="${_esc(q.correctAnswer||'')}">
          </div>
          <div class="desc-box-${n}" style="display:none;">
            <textarea class="form-control cc-inp q-answer-desc" rows="4">${_esc(q.correctAnswer||'')}</textarea>
          </div>
        `;
        wrap.appendChild(card);
    });
    _toast('AI questions imported! Review and click Publish Quiz.');
};

window.ccImportAIQuestions = () => {
    if (!_aiGeneratedQuestions.length) {
        alert('No AI questions available. Go to the AI Generator tab first.');
        return;
    }
    ccSendAIToCreate();
};

// ===========================================================================
// FACULTY: Submit Create Quiz
// ===========================================================================
window.ccHandleCreateQuiz = async (e) => {
    e.preventDefault();
    const title          = document.getElementById('ccFqTitle').value.trim();
    const subjectName    = document.getElementById('ccFqSubject').value.trim();
    const topic          = document.getElementById('ccFqTopic').value.trim();
    const sectionId      = parseInt(document.getElementById('ccFqSectionId').value);
    const teacherId      = parseInt(document.getElementById('ccFqTeacherId').value) || 1;
    const difficulty     = document.getElementById('ccFqDifficulty').value;
    const durationMinutes= parseInt(document.getElementById('ccFqDuration').value) || 15;
    const passingPercentage = parseFloat(document.getElementById('ccFqPassPct').value) || 50;

    const questions = [];
    document.querySelectorAll('[id^="ccQCard_"]').forEach(card => {
        const type = card.querySelector('.q-type').value;
        const text = card.querySelector('.q-text').value.trim();
        if (!text) return;

        let options = '';
        let correctAnswer = '';

        if (type === 'MCQ' || type === 'TRUE_FALSE') {
            options = [...card.querySelectorAll('.q-opt')].map(i => i.value.trim()).filter(Boolean).join(',');
            correctAnswer = card.querySelector('.q-answer') ? card.querySelector('.q-answer').value.trim() : '';
        } else if (type === 'DESCRIPTIVE') {
            correctAnswer = card.querySelector('.q-answer-desc') ? card.querySelector('.q-answer-desc').value.trim() : '';
        } else {
            correctAnswer = card.querySelector('.q-answer') ? card.querySelector('.q-answer').value.trim() : '';
        }

        questions.push({
            questionText: text,
            type,
            options,
            correctAnswer,
            marks: parseInt(card.querySelector('.q-marks').value) || 10,
            topicConcept: card.querySelector('.q-topic') ? card.querySelector('.q-topic').value.trim() : '',
            difficulty:   card.querySelector('.q-diff')  ? card.querySelector('.q-diff').value  : 'Medium',
        });
    });

    if (!questions.length) { alert('Add at least one question.'); return; }

    const payload = { sectionId, teacherId, title, subjectName, topic, difficulty, durationMinutes, passingPercentage, questions };

    try {
        const res = await fetch('/api/quizzes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ..._authHdr() },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            _toast('Quiz "' + title + '" published! Students will see it in My Quizzes.');
            bootstrap.Modal.getInstance(document.getElementById('ccQuizFacultyModal')).hide();
        } else {
            const err = await res.text();
            alert('Failed to publish quiz:\n' + err);
        }
    } catch (err) {
        alert('Network error: ' + err.message);
    }
};

// ===========================================================================
// FACULTY: Load Class Analytics
// ===========================================================================
window.ccLoadFacultyQuizzes = async () => {
    const tchId = document.getElementById('ccFqTeacherId').value || (await _resolveTeacher()) || 1;
    try {
        const res = await fetch('/api/quizzes/teacher/' + tchId, { headers: _authHdr() });
        const list = await res.json();
        const sel = document.getElementById('ccFqQuizSelect');
        sel.innerHTML = '<option value="">-- Choose a Quiz --</option>' +
            list.map(q => `<option value="${q.id}">[${q.subjectName||q.title}] ${q.topic||q.title} (${q.difficulty||''})</option>`).join('');
        document.getElementById('ccClassAnalyticsBody').innerHTML = '';
    } catch (err) { console.error(err); }
};

window.ccDeleteQuiz = async () => {
    const quizId = document.getElementById('ccFqQuizSelect').value;
    if (!quizId) {
        alert('Please select a quiz to delete.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone and will also delete all student submissions for this quiz.')) {
        return;
    }

    try {
        const res = await fetch('/api/quizzes/' + quizId, {
            method: 'DELETE',
            headers: _authHdr()
        });

        if (res.ok) {
            _toast('Quiz deleted successfully.');
            // Reload the quiz list
            ccLoadFacultyQuizzes();
        } else {
            const errText = await res.text();
            alert('Failed to delete quiz: ' + errText);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
};

window.ccLoadClassAnalytics = async (quizId) => {
    const body = document.getElementById('ccClassAnalyticsBody');
    if (!quizId) { body.innerHTML = ''; return; }
    body.innerHTML = '<div class="text-muted py-3"><span class="spinner-border spinner-border-sm me-2"></span>Loading analytics...</div>';

    try {
        const [allRes, weakRes] = await Promise.all([
            fetch('/api/quizzes/' + quizId + '/results', { headers: _authHdr() }),
            fetch('/api/quizzes/' + quizId + '/results/weak', { headers: _authHdr() })
        ]);
        const all  = await allRes.json();
        const weak = await weakRes.json();

        if (!all.length) { body.innerHTML = '<p class="text-muted">No submissions yet.</p>'; return; }

        const pcts = all.map(r => r.percentage || 0);
        const avg  = pcts.reduce((s, p) => s + p, 0) / pcts.length;
        const high = Math.max(...pcts);
        const low  = Math.min(...pcts);

        const countByComp = { Excellent: 0, Good: 0, Developing: 0, 'Needs Improvement': 0 };
        all.forEach(r => { const c = _competencyLabel(r.percentage||0); countByComp[c.label]++; });

        // Topic-level breakdown
        const topicMap = {};
        all.forEach(r => {
            if (!r.quiz || !r.quiz.questions) return;
            r.quiz.questions.forEach(q => {
                const t = q.topicConcept || q.questionText?.slice(0, 20) || 'General';
                if (!topicMap[t]) topicMap[t] = { correct: 0, total: 0 };
                topicMap[t].total++;
            });
        });

        const topicRows = Object.entries(topicMap).map(([t, d]) => {
            const pct = d.total > 0 ? (d.correct / d.total * 100).toFixed(0) : 'N/A';
            const bar = pct !== 'N/A' ? `<div style="height:6px;background:#1e3a5f;border-radius:3px;"><div style="height:6px;width:${pct}%;background:#3b82f6;border-radius:3px;"></div></div>` : '';
            return `<tr><td>${t}</td><td>${pct}%</td><td>${bar}</td></tr>`;
        }).join('');

        const weakCards = weak.length === 0
            ? '<div class="alert alert-success"><i class="fa-solid fa-trophy me-2"></i>All students scored above 50%!</div>'
            : weak.map(r => {
                const name = r.student ? (r.student.studentName || 'ID:' + r.student.id) : 'Unknown';
                const pct  = (r.percentage || 0).toFixed(1);
                const comp = _competencyLabel(r.percentage || 0);
                return `<div class="p-3 rounded mb-2" style="background:#1a0000;border-left:4px solid #ef4444;">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <strong style="color:#fca5a5;">${name}</strong>
                        <span class="badge" style="background:#7f1d1d;">${pct}% — ${comp.label}</span>
                    </div>
                    <p class="small mb-1 text-warning"><i class="fa-solid fa-robot me-1"></i>${r.aiWeaknessAnalysis || 'AI analysis not available.'}</p>
                </div>`;
            }).join('');

        body.innerHTML = `
            <div class="row g-3 mb-4">
                <div class="col-md-3"><div class="p-3 rounded text-center" style="background:#0a1020;border:1px solid #1d4ed8;">
                    <div class="display-6 fw-bold text-info">${all.length}</div><small>Total Attempts</small></div></div>
                <div class="col-md-3"><div class="p-3 rounded text-center" style="background:#0a1020;border:1px solid #7c3aed;">
                    <div class="display-6 fw-bold text-warning">${avg.toFixed(1)}%</div><small>Class Average</small></div></div>
                <div class="col-md-3"><div class="p-3 rounded text-center" style="background:#0a1020;border:1px solid #10b981;">
                    <div class="display-6 fw-bold text-success">${high.toFixed(1)}%</div><small>Highest</small></div></div>
                <div class="col-md-3"><div class="p-3 rounded text-center" style="background:#0a1020;border:1px solid #ef4444;">
                    <div class="display-6 fw-bold text-danger">${low.toFixed(1)}%</div><small>Lowest</small></div></div>
            </div>

            <div class="row g-3 mb-4">
                ${Object.entries(countByComp).map(([label, count]) => {
                    const comp = _competencyLabel(label === 'Excellent' ? 95 : label === 'Good' ? 80 : label === 'Developing' ? 60 : 30);
                    return `<div class="col-md-3"><div class="p-2 rounded text-center" style="background:#0a1020;border:1px solid ${comp.color};">
                        <div class="fw-bold" style="color:${comp.color};font-size:1.5rem;">${count}</div>
                        <small>${comp.emoji} ${label}</small></div></div>`;
                }).join('')}
            </div>

            <h6 class="fw-bold text-danger mb-2"><i class="fa-solid fa-triangle-exclamation me-1"></i>Students Needing Improvement (&lt;50%)</h6>
            <div class="mb-4">${weakCards}</div>

            <h6 class="fw-bold mb-3">All Submissions</h6>
            <div class="table-responsive">
                <table class="table table-sm" style="color:#e0e0ff;background:#0a1020;">
                    <thead style="background:#1a003a;"><tr><th>Student</th><th>Score</th><th>%</th><th>Competency</th></tr></thead>
                    <tbody>
                        ${all.map(r => {
                            const name = r.student ? (r.student.studentName || 'ID:' + r.student.id) : 'Unknown';
                            const pct  = (r.percentage || 0).toFixed(1);
                            const comp = _competencyLabel(r.percentage || 0);
                            return `<tr>
                                <td>${name}</td>
                                <td>${r.totalScore || 0}</td>
                                <td><span class="badge" style="background:${comp.color};">${pct}%</span></td>
                                <td>${comp.emoji} ${comp.label}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (err) {
        body.innerHTML = '<p class="text-danger">Error loading results: ' + err.message + '</p>';
    }
};

// ===========================================================================
// STUDENT: Open My Quizzes Modal
// ===========================================================================
window.openStudentQuizModal = async () => {
    const modal = new bootstrap.Modal(document.getElementById('ccQuizStudentModal'));
    _showView('list');
    document.getElementById('ccSqTimerWrap').style.display = 'none';
    document.getElementById('ccSqCloseBtn').style.display = 'block';

    const cardsEl = document.getElementById('ccSqQuizCards');
    cardsEl.innerHTML = '<p class="text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Loading quizzes...</p>';
    modal.show();

    try {
        const info  = await _resolveStudent();
        const secId = info ? info.sectionId : 1;
        const res   = await fetch('/api/quizzes/section/' + secId, { headers: _authHdr() });
        const list  = await res.json();

        if (!list || !list.length) {
            cardsEl.innerHTML = '<div class="text-muted text-center py-5"><i class="fa-solid fa-clipboard-question fa-2x mb-2"></i><br>No quizzes assigned for your section yet.</div>';
            return;
        }
        cardsEl.innerHTML = list.map(q => `
            <div class="p-4 mb-3 rounded" style="background:#0d1a30;border:1px solid #1d4ed8;">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="fw-bold text-info mb-1">${q.title}</h6>
                        <div class="small text-muted mb-2">
                            ${q.subjectName ? `📚 ${q.subjectName}` : ''} 
                            ${q.topic ? ` · 📖 ${q.topic}` : ''}
                            ${q.difficulty ? ` · 🎯 ${q.difficulty}` : ''}
                        </div>
                        <div class="small mb-2">
                            <span class="badge me-1" style="background:#1e3a5f;">⏱ ${q.durationMinutes || 15} min</span>
                            <span class="badge me-1" style="background:#1a003a;">${(q.questions||[]).length} questions</span>
                            <span class="badge" style="background:#064e3b;">Pass: ${q.passingPercentage || 50}%</span>
                        </div>
                    </div>
                    <button class="btn btn-sm fw-bold" style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);color:#fff;"
                        onclick="ccStartQuiz(${q.id})">
                        <i class="fa-solid fa-play-circle me-1"></i>Start Quiz
                    </button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        cardsEl.innerHTML = '<p class="text-danger">Error loading quizzes: ' + err.message + '</p>';
    }
};

// ===========================================================================
// STUDENT: Start Quiz (with Firewall)
// ===========================================================================
window.ccStartQuiz = async (quizId) => {
    try {
        const info  = await _resolveStudent();
        const secId = info ? info.sectionId : 1;
        const res   = await fetch('/api/quizzes/section/' + secId, { headers: _authHdr() });
        const list  = await res.json();
        const quiz  = list.find(q => q.id === quizId);
        if (!quiz) { alert('Quiz not found.'); return; }

        _currentQuiz = quiz;
        _answers = {};
        _markedReview = new Set();
        _currentQIdx = 0;
        _quizActive = true;

        // Activate firewall — hide close button
        document.getElementById('ccSqCloseBtn').style.display = 'none';

        // Show quiz view
        _showView('quiz');

        // Render nav grid
        _renderNavGrid();
        _renderQuestion(0);

        // Start timer
        _timerRemaining = (quiz.durationMinutes || 15) * 60;
        document.getElementById('ccSqTimerWrap').style.display = 'block';
        _startTimer();

        document.getElementById('ccSqQuizView').dataset.quizId = quizId;

    } catch (err) {
        alert('Error loading quiz: ' + err.message);
    }
};

function _startTimer() {
    clearInterval(_timerInterval);
    _timerInterval = setInterval(() => {
        _timerRemaining--;
        const m = Math.floor(_timerRemaining / 60).toString().padStart(2, '0');
        const s = (_timerRemaining % 60).toString().padStart(2, '0');
        const el = document.getElementById('ccSqTimer');
        if (el) {
            el.innerText = `${m}:${s}`;
            el.style.color = _timerRemaining < 60 ? '#ef4444' : '#f59e0b';
        }
        if (_timerRemaining <= 0) {
            clearInterval(_timerInterval);
            _toast('⏰ Time is up! Auto-submitting...', 'error');
            _doSubmitQuiz(true);
        }
    }, 1000);
}

function _renderNavGrid() {
    const grid = document.getElementById('ccSqNavGrid');
    grid.innerHTML = (_currentQuiz.questions || []).map((q, i) => {
        let cls = 'cc-nav-btn';
        if (_answers[q.id] !== undefined) cls += ' answered';
        if (_markedReview.has(q.id))      cls += ' marked';
        if (i === _currentQIdx)           cls += ' current';
        return `<div class="${cls}" onclick="ccNavQuestion(${i - _currentQIdx})" title="Q${i+1}">${i+1}</div>`;
    }).join('');
}

function _renderQuestion(idx) {
    const q = _currentQuiz.questions[idx];
    if (!q) return;
    const opts = (q.options || '').split(',').map(o => o.trim()).filter(Boolean);
    const letters = ['A','B','C','D'];

    let inputHtml = '';
    if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
        inputHtml = opts.map((opt, i) => {
            const sel = _answers[q.id] === opt ? ' selected' : '';
            return `<button type="button" class="cc-opt-btn${sel}" onclick="ccSelectOpt(${q.id},'${_esc(opt)}',this)">
                <span class="badge me-2" style="background:#1d4ed8;">${letters[i]||i+1}</span>${opt}
            </button>`;
        }).join('');
    } else if (q.type === 'FILL_BLANK') {
        inputHtml = `<input type="text" class="form-control cc-inp mt-2" value="${_esc(_answers[q.id]||'')}"
            placeholder="Type your answer..." onchange="ccSaveText(${q.id},this.value)">`;
    } else {
        inputHtml = `<textarea class="form-control cc-inp mt-2" rows="6"
            placeholder="Write your detailed answer here..." onchange="ccSaveText(${q.id},this.value)">${_esc(_answers[q.id]||'')}</textarea>`;
    }

    document.getElementById('ccSqQuestionBody').innerHTML = `
        <div class="mb-2 d-flex justify-content-between align-items-center">
            <span class="small text-muted">Question ${idx+1} of ${_currentQuiz.questions.length}</span>
            <div>
                ${q.topicConcept ? `<span class="badge me-1" style="background:#0c2a1a;color:#6ee7b7;">${q.topicConcept}</span>` : ''}
                ${q.difficulty ? `<span class="badge" style="background:#1a003a;color:#a78bfa;">${q.difficulty}</span>` : ''}
                <span class="badge ms-1" style="background:#0f172a;border:1px solid #7c3aed;">${q.marks} Marks</span>
            </div>
        </div>
        <div class="p-3 rounded mb-4" style="background:#0d1a30;border-left:4px solid #7c3aed;">
            <p class="fw-bold mb-0" style="color:#c4b5fd;font-size:1.05rem;">${q.questionText}</p>
        </div>
        ${inputHtml}
    `;
    _renderNavGrid();
}

window.ccSelectOpt = (qId, val, btn) => {
    _answers[qId] = val;
    btn.closest('#ccSqQuestionBody').querySelectorAll('.cc-opt-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    _renderNavGrid();
};
window.ccSaveText = (qId, val) => { _answers[qId] = val; _renderNavGrid(); };

window.ccNavQuestion = (delta) => {
    const newIdx = _currentQIdx + delta;
    if (newIdx < 0 || newIdx >= _currentQuiz.questions.length) return;
    _currentQIdx = newIdx;
    _renderQuestion(_currentQIdx);
};

window.ccMarkReview = () => {
    const q = _currentQuiz.questions[_currentQIdx];
    if (!q) return;
    if (_markedReview.has(q.id)) _markedReview.delete(q.id);
    else _markedReview.add(q.id);
    _renderNavGrid();
};

window.ccConfirmSubmit = () => {
    const total     = _currentQuiz.questions.length;
    const answered  = Object.keys(_answers).length;
    const unanswered = total - answered;
    const marked    = _markedReview.size;

    if (!confirm(`📋 Quiz Summary\n\n✅ Answered: ${answered}/${total}\n⚠️ Unanswered: ${unanswered}\n🔖 Marked for review: ${marked}\n\nAre you sure you want to submit?`)) return;
    _doSubmitQuiz(false);
};

async function _doSubmitQuiz(autoSubmit) {
    clearInterval(_timerInterval);
    document.getElementById('ccSqTimerWrap').style.display = 'none';

    const quizId   = document.getElementById('ccSqQuizView').dataset.quizId;
    const info     = await _resolveStudent();
    if (!info || !info.studentId) {
        alert('Could not identify your student account.');
        _quizActive = false;
        document.getElementById('ccSqCloseBtn').style.display = 'block';
        return;
    }
    const studentId = info.studentId;

    const answers = _currentQuiz.questions.map(q => ({
        questionId: q.id,
        answerText: _answers[q.id] || ''
    }));

    try {
        const res = await fetch('/api/quizzes/' + quizId + '/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ..._authHdr() },
            body: JSON.stringify({ studentId, answers })
        });

        if (!res.ok) throw new Error(await res.text());
        const sub = await res.json();

        _quizActive = false;
        document.getElementById('ccSqCloseBtn').style.display = 'block';
        _showView('result');
        _renderResult(sub);

    } catch (err) {
        alert('Submission failed: ' + err.message);
    }
}

function _renderResult(sub) {
    const pct  = (sub.percentage || 0);
    const comp = _competencyLabel(pct);
    const quiz = _currentQuiz;
    const pass = pct >= (quiz.passingPercentage || 50);

    // Topic-level breakdown
    const topicMap = {};
    quiz.questions.forEach(q => {
        const t = q.topicConcept || 'General';
        if (!topicMap[t]) topicMap[t] = { earned: 0, total: 0 };
        topicMap[t].total += q.marks || 10;
    });
    quiz.questions.forEach(q => {
        const t = q.topicConcept || 'General';
        const ans = _answers[q.id] || '';
        if (q.type === 'MCQ' || q.type === 'TRUE_FALSE' || q.type === 'FILL_BLANK') {
            if (q.correctAnswer && q.correctAnswer.toLowerCase() === ans.toLowerCase()) {
                topicMap[t].earned += q.marks || 10;
            }
        }
    });

    const topicRows = Object.entries(topicMap).map(([t, d]) => {
        const tPct = d.total > 0 ? ((d.earned / d.total) * 100) : 0;
        const tc   = _competencyLabel(tPct);
        return `
            <div class="p-3 rounded mb-2" style="background:#0a1020;border:1px solid #1d4ed8;">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-semibold">${t}</span>
                    <span class="badge" style="background:${tc.color};">${tPct.toFixed(0)}%</span>
                </div>
                <div style="height:8px;background:#1e3a5f;border-radius:4px;">
                    <div style="height:8px;width:${tPct}%;background:${tc.color};border-radius:4px;transition:.5s;"></div>
                </div>
                <small style="color:${tc.color};">${tc.emoji} ${tc.label}</small>
            </div>`;
    }).join('');

    document.getElementById('ccSqResultView').innerHTML = `
        <div class="text-center py-4" style="background:linear-gradient(135deg,#050a14,#0c1f40);border-bottom:1px solid #1d4ed8;">
            <div style="font-size:5rem;">${comp.emoji}</div>
            <h3 class="fw-bold mt-2" style="color:${comp.color};">${comp.label}</h3>
            <div style="font-size:3.5rem;font-weight:900;color:${comp.color};">${pct.toFixed(1)}%</div>
            <p class="text-muted mt-1">Your Knowledge Score</p>
            <span class="badge px-3 py-2 mt-1" style="background:${pass ? '#064e3b' : '#7f1d1d'};color:#fff;font-size:.9rem;">
                ${pass ? '✅ PASSED' : '❌ Needs Improvement'}
            </span>
        </div>

        <div class="p-4">
            <div class="row g-3 mb-4">
                <div class="col-md-4 text-center"><div class="p-3 rounded" style="background:#0a1020;border:1px solid #10b981;"><div class="fw-bold text-success" style="font-size:1.5rem;">${sub.totalScore || 0}</div><small>Total Score</small></div></div>
                <div class="col-md-4 text-center"><div class="p-3 rounded" style="background:#0a1020;border:1px solid #3b82f6;"><div class="fw-bold text-info" style="font-size:1.5rem;">${quiz.questions.length}</div><small>Total Questions</small></div></div>
                <div class="col-md-4 text-center"><div class="p-3 rounded" style="background:#0a1020;border:1px solid #7c3aed;"><div class="fw-bold text-purple" style="font-size:1.5rem;color:#a78bfa;">${quiz.passingPercentage || 50}%</div><small>Pass Mark</small></div></div>
            </div>

            <h6 class="fw-bold text-warning mb-3">📊 Topic-wise Competency</h6>
            <div class="mb-4">${topicRows || '<p class="text-muted">Topic data not available.</p>'}</div>

            ${sub.aiWeaknessAnalysis ? `
                <div class="p-3 rounded mb-4" style="background:#1a0a00;border:1px solid #f59e0b;">
                    <h6 class="fw-bold text-warning mb-2"><i class="fa-solid fa-robot me-1"></i>AI Study Recommendation</h6>
                    <p style="color:#fde68a;white-space:pre-wrap;margin:0;">${sub.aiWeaknessAnalysis}</p>
                </div>` : ''}

            <div class="text-center mt-2">
                <button class="btn btn-outline-info px-4" data-bs-dismiss="modal">Close & Back to Dashboard</button>
            </div>
        </div>
    `;
}

// ===========================================================================
// VIEW SWITCHER
// ===========================================================================
function _showView(name) {
    document.getElementById('ccSqListView').style.display  = name === 'list'   ? 'block' : 'none';
    document.getElementById('ccSqQuizView').style.display  = name === 'quiz'   ? 'block' : 'none';
    document.getElementById('ccSqResultView').style.display= name === 'result' ? 'block' : 'none';
}

// ===========================================================================
// QUIZ FIREWALL
// ===========================================================================
window.addEventListener('beforeunload', e => {
    if (_quizActive) {
        e.preventDefault();
        return (e.returnValue = '⚠ Quiz in progress! Submit your answers before leaving.');
    }
});

// Block tab-switching and logout clicks while quiz is active
document.addEventListener('click', e => {
    if (!_quizActive) return;
    const target = e.target.closest('button, a');
    if (!target) return;

    // Allow quiz submit trigger
    if (target.closest('#ccSqQuizView')) return;

    // Block modal close button
    if (target.id === 'ccSqCloseBtn' || target.getAttribute('data-bs-dismiss') === 'modal') {
        e.preventDefault();
        e.stopImmediatePropagation();
        alert('⚠️ You cannot close the quiz! Please submit your answers first.');
        return;
    }

    // Block logout
    const onclick = target.getAttribute('onclick') || '';
    if (onclick.includes('logout') || onclick.includes('logoutUser')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        alert('⚠️ Quiz is active! You must submit the quiz before logging out.');
    }
}, true);

// ===========================================================================
// UTILITY
// ===========================================================================
function _esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
