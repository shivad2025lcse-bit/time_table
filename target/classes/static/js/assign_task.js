// ─────────────────────────────────────────────────────────────────────────────
//  assign_task.js  –  Faculty "Assign Task" Feature
//  Tasks stored in localStorage keyed by teacher username.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
    function _injectModal() {
        if (document.getElementById('assignTaskModal')) return;
        var html = '<style>' +
            '.at-modal{background:#0d0a1f!important;color:#fff;border:1px solid #7c3aed!important;border-radius:14px}' +
            '.at-header{background:linear-gradient(90deg,#1a0536,#14052e)!important;border-bottom:1px solid #7c3aed!important}' +
            '.at-label{font-size:.82rem;font-weight:600;color:#c4b5fd;margin-bottom:.3rem;display:block}' +
            '.at-ctrl{background:#0a041f!important;border:1px solid #4c1d95!important;color:#fff!important;border-radius:7px}' +
            '.at-ctrl:focus{border-color:#8b5cf6!important;box-shadow:0 0 0 .2rem rgba(139,92,246,.25)!important}' +
            '.at-card{background:#120326;border:1px solid #4c1d95;border-radius:10px;padding:1rem;margin-bottom:.75rem;transition:.2s}' +
            '.at-card:hover{border-color:#8b5cf6}' +
            '.at-overdue{border-color:#dc2626!important}' +
            '.at-pri-high{background:#7f1d1d;color:#fca5a5;padding:2px 8px;border-radius:5px;font-size:.72rem}' +
            '.at-pri-med{background:#78350f;color:#fcd34d;padding:2px 8px;border-radius:5px;font-size:.72rem}' +
            '.at-pri-low{background:#1e3a5f;color:#93c5fd;padding:2px 8px;border-radius:5px;font-size:.72rem}' +
        '</style>' +
        '<div class="modal fade" id="assignTaskModal" tabindex="-1" data-bs-backdrop="static">' +
        '<div class="modal-dialog modal-xl modal-dialog-scrollable">' +
        '<div class="modal-content at-modal">' +
        '<div class="modal-header at-header">' +
            '<div>' +
                '<h4 class="modal-title fw-bold mb-0 d-flex align-items-center gap-2"><i class="fa-solid fa-list-check" style="color:#fbbf24;"></i> Assign Task to Class</h4>' +
                '<small style="color:#94a3b8;margin-left:36px;">Send tasks/assignments to specific sections</small>' +
            '</div>' +
            '<button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>' +
        '</div>' +
        '<div class="modal-body p-4" style="background:#0d0a1f;">' +
            '<!-- Form Panel -->' +
            '<div id="atFormPanel" class="mb-4 p-4 rounded" style="background:#120326;border:1px solid #7c3aed;">' +
                '<h6 class="fw-bold mb-3" style="color:#a78bfa;" id="atFormTitle"><i class="fa-solid fa-plus-circle me-2"></i>Create New Task</h6>' +
                '<input type="hidden" id="atEditId" value="">' +
                '<div class="row g-3 mb-3">' +
                    '<div class="col-md-5"><label class="at-label">Task Title *</label>' +
                    '<input type="text" id="atTitle" class="form-control at-ctrl" placeholder="e.g. Submit Lab Record by Friday"></div>' +
                    '<div class="col-md-4"><label class="at-label">Section / Class *</label>' +
                    '<select id="atSection" class="form-select at-ctrl"><option value="">Loading sections...</option></select></div>' +
                    '<div class="col-md-3"><label class="at-label">Priority</label>' +
                    '<select id="atPriority" class="form-select at-ctrl"><option value="Medium" selected>🟡 Medium</option><option value="High">🔴 High</option><option value="Low">🔵 Low</option></select></div>' +
                '</div>' +
                '<div class="row g-3 mb-3">' +
                    '<div class="col-md-4"><label class="at-label">Due Date</label>' +
                    '<input type="date" id="atDueDate" class="form-control at-ctrl"></div>' +
                    '<div class="col-md-4"><label class="at-label">Subject</label>' +
                    '<input type="text" id="atSubject" class="form-control at-ctrl" placeholder="e.g. Data Structures"></div>' +
                    '<div class="col-md-4"><label class="at-label">Task Type</label>' +
                    '<select id="atType" class="form-select at-ctrl"><option value="Assignment">📝 Assignment</option><option value="Lab Work">🔬 Lab Work</option><option value="Project">🏗️ Project</option><option value="Reading">📖 Reading</option><option value="Revision">🔁 Revision</option><option value="Other">📌 Other</option></select></div>' +
                '</div>' +
                '<div class="mb-3"><label class="at-label">Task Description / Instructions *</label>' +
                '<textarea id="atDescription" class="form-control at-ctrl" rows="4" placeholder="Type the task details, instructions, submission deadline..."></textarea></div>' +
                '<div class="d-flex gap-2 justify-content-end">' +
                    '<button type="button" class="btn btn-outline-secondary" onclick="_atResetForm()"><i class="fa-solid fa-xmark me-1"></i> Cancel</button>' +
                    '<button type="button" class="btn fw-bold px-4" id="atSubmitBtn" style="background:linear-gradient(135deg,#7c3aed,#4c1d95);color:#fff;border:none;" onclick="_atSaveTask()"><i class="fa-solid fa-paper-plane me-2"></i> Assign Task</button>' +
                '</div>' +
            '</div>' +
            '<!-- Filter Bar -->' +
            '<div class="d-flex flex-wrap align-items-center gap-3 mb-3">' +
                '<h6 class="fw-bold mb-0" style="color:#a78bfa;"><i class="fa-solid fa-inbox me-2"></i>Assigned Tasks</h6>' +
                '<select id="atFilterSection" class="form-select form-select-sm at-ctrl" style="width:220px;" onchange="_atRenderTasks()"><option value="">All Sections</option></select>' +
                '<select id="atFilterPriority" class="form-select form-select-sm at-ctrl" style="width:160px;" onchange="_atRenderTasks()"><option value="">All Priorities</option><option value="High">🔴 High</option><option value="Medium">🟡 Medium</option><option value="Low">🔵 Low</option></select>' +
                '<select id="atFilterType" class="form-select form-select-sm at-ctrl" style="width:160px;" onchange="_atRenderTasks()"><option value="">All Types</option><option value="Assignment">📝 Assignment</option><option value="Lab Work">🔬 Lab Work</option><option value="Project">🏗️ Project</option><option value="Reading">📖 Reading</option><option value="Revision">🔁 Revision</option><option value="Other">📌 Other</option></select>' +
                '<span id="atTaskCount" class="badge bg-secondary ms-auto"></span>' +
            '</div>' +
            '<!-- Task List -->' +
            '<div id="atTaskList"></div>' +
        '</div>' +
        '</div></div></div>';
        var div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div);
    }

    function _storageKey() {
        return 'at_tasks_' + (localStorage.getItem('sece_logged_in_user') || 'faculty');
    }
    function _loadTasks() {
        try { return JSON.parse(localStorage.getItem(_storageKey()) || '[]'); } catch(e) { return []; }
    }
    function _saveTasks(tasks) {
        localStorage.setItem(_storageKey(), JSON.stringify(tasks));
    }

    async function _loadSections() {
        try {
            var token = localStorage.getItem('jwt_token') || '';
            var headers = token ? { Authorization: 'Bearer ' + token } : {};
            var res = await fetch('/api/sections', { headers: headers });
            if (!res.ok) return [];
            return await res.json();
        } catch(e) { return []; }
    }

    function _populateSectionDropdowns(sections) {
        window._atSections = sections;
        ['atSection', 'atFilterSection'].forEach(function(id) {
            var sel = document.getElementById(id);
            if (!sel) return;
            var isFilter = id === 'atFilterSection';
            var placeholder = isFilter ? '<option value="">All Sections</option>' : '<option value="">-- Select Section --</option>';
            sel.innerHTML = placeholder + sections.map(function(s) {
                return '<option value="' + s.id + '">' + (s.sectionName || 'Section ' + s.id) + '</option>';
            }).join('');
        });
    }

    function _getSectionLabel(id) {
        if (!window._atSections) return 'Section ' + id;
        var s = window._atSections.find(function(x) { return String(x.id) === String(id); });
        return s ? (s.sectionName || 'Section ' + s.id) : 'Section ' + id;
    }

    function _esc(str) {
        return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    window._atRenderTasks = function() {
        var tasks = _loadTasks();
        var list = document.getElementById('atTaskList');
        if (!list) return;
        var fSec  = (document.getElementById('atFilterSection')  || {}).value || '';
        var fPri  = (document.getElementById('atFilterPriority') || {}).value || '';
        var fType = (document.getElementById('atFilterType')     || {}).value || '';
        var filtered = tasks.filter(function(t) {
            return (!fSec  || String(t.sectionId) === fSec) &&
                   (!fPri  || t.priority === fPri) &&
                   (!fType || t.type === fType);
        }).sort(function(a,b) { return new Date(b.createdAt) - new Date(a.createdAt); });

        var cnt = document.getElementById('atTaskCount');
        if (cnt) cnt.textContent = filtered.length + ' task(s)';

        if (filtered.length === 0) {
            list.innerHTML = '<div class="text-center py-5 text-muted"><i class="fa-solid fa-inbox fa-3x mb-3 d-block" style="color:#4c1d95;"></i>No tasks found. Create one above!</div>';
            return;
        }

        list.innerHTML = filtered.map(function(t) {
            var sLabel = _getSectionLabel(t.sectionId);
            var now = new Date();
            var due = t.dueDate ? new Date(t.dueDate) : null;
            var isOver = due && due < now;
            var dueTxt = due ? '<span class="' + (isOver ? 'text-danger' : 'text-warning') + ' small"><i class="fa-solid fa-clock me-1"></i>' + (isOver ? 'Overdue: ' : 'Due: ') + due.toLocaleDateString() + '</span>' : '';
            var priCls = t.priority === 'High' ? 'at-pri-high' : t.priority === 'Low' ? 'at-pri-low' : 'at-pri-med';
            var priIco = t.priority === 'High' ? '🔴' : t.priority === 'Low' ? '🔵' : '🟡';
            var typeIcons = {Assignment:'📝','Lab Work':'🔬',Project:'🏗️',Reading:'📖',Revision:'🔁',Other:'📌'};
            var tIco = typeIcons[t.type] || '📌';
            var created = new Date(t.createdAt).toLocaleString();
            var updated = t.updatedAt ? ' <span class="text-info" style="font-size:.7rem;">(edited)</span>' : '';

            return '<div class="at-card' + (isOver ? ' at-overdue' : '') + '" id="at_card_' + t.id + '">' +
                '<div class="d-flex justify-content-between align-items-start mb-2">' +
                    '<div class="flex-grow-1">' +
                        '<div class="d-flex flex-wrap gap-2 align-items-center mb-1">' +
                            '<span class="fw-bold" style="color:#e2e8f0;font-size:1rem;">' + tIco + ' ' + _esc(t.title) + '</span>' +
                            '<span class="' + priCls + '">' + priIco + ' ' + t.priority + '</span>' +
                            '<span class="badge" style="background:#1e1b4b;color:#a78bfa;">' + _esc(sLabel) + '</span>' +
                            (t.subject ? '<span class="badge bg-secondary">' + _esc(t.subject) + '</span>' : '') +
                            '<span class="badge" style="background:#1a2744;color:#93c5fd;">' + t.type + '</span>' +
                        '</div>' +
                        '<div class="d-flex gap-3 align-items-center">' +
                            dueTxt +
                            '<span class="text-muted" style="font-size:.72rem;"><i class="fa-solid fa-calendar-plus me-1"></i>' + created + updated + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="d-flex gap-2 ms-3 flex-shrink-0">' +
                        '<button class="btn btn-sm btn-outline-info" title="Edit" onclick="_atEditTask(\'' + t.id + '\')"><i class="fa-solid fa-pen-to-square"></i> Edit</button>' +
                        '<button class="btn btn-sm btn-outline-danger" title="Delete" onclick="_atDeleteTask(\'' + t.id + '\')"><i class="fa-solid fa-trash"></i> Delete</button>' +
                    '</div>' +
                '</div>' +
                '<div class="mt-2 p-3 rounded" style="background:#0a041f;border-left:3px solid #7c3aed;white-space:pre-wrap;color:#cbd5e1;font-size:.88rem;">' +
                    _esc(t.description) +
                '</div>' +
            '</div>';
        }).join('');
    };

    window._atSaveTask = function() {
        var title       = (document.getElementById('atTitle')       || {}).value.trim();
        var sectionId   = (document.getElementById('atSection')     || {}).value;
        var priority    = (document.getElementById('atPriority')    || {}).value;
        var dueDate     = (document.getElementById('atDueDate')     || {}).value;
        var subject     = (document.getElementById('atSubject')     || {}).value.trim();
        var type        = (document.getElementById('atType')        || {}).value;
        var description = (document.getElementById('atDescription') || {}).value.trim();
        var editId      = (document.getElementById('atEditId')      || {}).value;

        if (!title)       { alert('Please enter a task title.'); return; }
        if (!sectionId)   { alert('Please select a section.'); return; }
        if (!description) { alert('Please enter task description.'); return; }

        var tasks = _loadTasks();
        if (editId) {
            var idx = tasks.findIndex(function(t) { return t.id === editId; });
            if (idx !== -1) {
                tasks[idx] = Object.assign({}, tasks[idx], { title, sectionId, priority, dueDate, subject, type, description, updatedAt: new Date().toISOString() });
            }
        } else {
            tasks.push({ id: 'at_' + Date.now(), title, sectionId, priority, dueDate, subject, type, description, createdAt: new Date().toISOString(), updatedAt: null });
        }

        _saveTasks(tasks);
        _atResetForm();
        _atRenderTasks();
        _atToast(editId ? 'Task updated!' : 'Task assigned to ' + _getSectionLabel(sectionId) + '!');
    };

    window._atEditTask = function(id) {
        var tasks = _loadTasks();
        var t = tasks.find(function(x) { return x.id === id; });
        if (!t) return;
        document.getElementById('atEditId').value      = t.id;
        document.getElementById('atTitle').value       = t.title;
        document.getElementById('atSection').value     = t.sectionId;
        document.getElementById('atPriority').value    = t.priority;
        document.getElementById('atDueDate').value     = t.dueDate || '';
        document.getElementById('atSubject').value     = t.subject || '';
        document.getElementById('atType').value        = t.type || 'Assignment';
        document.getElementById('atDescription').value = t.description;
        document.getElementById('atFormTitle').innerHTML = '<i class="fa-solid fa-pen-to-square me-2 text-info"></i>Edit Task';
        document.getElementById('atSubmitBtn').innerHTML = '<i class="fa-solid fa-floppy-disk me-2"></i> Update Task';
        document.getElementById('atFormPanel').scrollIntoView({ behavior: 'smooth' });
    };

    window._atDeleteTask = function(id) {
        var tasks = _loadTasks();
        var t = tasks.find(function(x) { return x.id === id; });
        if (!t) return;
        if (!confirm('Delete task "' + t.title + '"?\nThis cannot be undone.')) return;
        _saveTasks(tasks.filter(function(x) { return x.id !== id; }));
        _atRenderTasks();
        _atToast('Task deleted.');
    };

    window._atResetForm = function() {
        ['atEditId','atTitle','atDueDate','atSubject','atDescription'].forEach(function(id) {
            var el = document.getElementById(id); if (el) el.value = '';
        });
        var p = document.getElementById('atPriority'); if (p) p.value = 'Medium';
        var ty = document.getElementById('atType'); if (ty) ty.value = 'Assignment';
        var s = document.getElementById('atSection'); if (s) s.value = '';
        var ft = document.getElementById('atFormTitle'); if (ft) ft.innerHTML = '<i class="fa-solid fa-plus-circle me-2"></i>Create New Task';
        var sb = document.getElementById('atSubmitBtn'); if (sb) sb.innerHTML = '<i class="fa-solid fa-paper-plane me-2"></i> Assign Task';
    };

    window.openAssignTaskModal = async function() {
        _injectModal();
        var el = document.getElementById('assignTaskModal');
        bootstrap.Modal.getOrCreateInstance(el).show();
        var sections = await _loadSections();
        _populateSectionDropdowns(sections);
        _atRenderTasks();
    };

    function _atToast(msg) {
        var el = document.createElement('div');
        el.className = 'alert alert-success position-fixed bottom-0 end-0 m-3 shadow-lg';
        el.style.cssText = 'z-index:9999;max-width:360px;';
        el.innerHTML = '<i class="fa-solid fa-check-circle me-2"></i>' + msg;
        document.body.appendChild(el);
        setTimeout(function() { el.remove(); }, 3500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _injectModal);
    } else {
        _injectModal();
    }
})();
