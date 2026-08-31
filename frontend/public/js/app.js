let currentUser = null;
let authToken = localStorage.getItem('jwt_token');

setTimeout(() => {
    if (authToken) {
        currentUser = JSON.parse(localStorage.getItem('user_info') || '{}');
        showMainApp();
    } else {
        showLoginPage();
    }

    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('resetPasswordForm')?.addEventListener('submit', handleResetPassword);
    document.getElementById('notificationRegForm')?.addEventListener('submit', handleNotificationRegistration);
    document.getElementById('addSectionForm')?.addEventListener('submit', handleAddSection);
    document.getElementById('addStudentForm')?.addEventListener('submit', handleAddStudent);
});

async function apiFetch(url, options = {}) {
    options.headers = options.headers || {};
    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }
    if (options.body && typeof options.body === 'string' && !options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
        logout();
    }
    return response;
}

async function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('loginUsername').value;
    const passwordInput = document.getElementById('loginPassword').value;
    const alertBox = document.getElementById('loginAlert');

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        if (res.ok) {
            const data = await res.json();
            authToken = data.token;
            currentUser = data;
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user_info', JSON.stringify(data));
            showMainApp();
        } else {
            let errorMsg = "Invalid username or password!";
            if (res.status === 502 || res.status === 504) {
                errorMsg = "Backend server is down or unreachable.";
            } else if (res.status !== 401 && res.status !== 403) {
                errorMsg = "Server error occurred. Try again later.";
            }
            if (alertBox) {
                alertBox.classList.remove('d-none');
                alertBox.innerText = errorMsg;
            } else {
                alert(errorMsg);
            }
        }
    } catch (err) {
        console.error("Login fetch error:", err);
        if (alertBox) {
            alertBox.classList.remove('d-none');
            alertBox.innerText = "Error: " + err.message;
        } else {
            alert("Error: " + err.message);
        }
    }
}
window.handleLogin = handleLogin;


// Reset Password Handler (Available for all Admin, Faculty, and Students)
async function handleResetPassword(e) {
    e.preventDefault();
    const username = document.getElementById('resetUsername').value;
    const email = document.getElementById('resetEmail').value;
    const newPassword = document.getElementById('resetNewPassword').value;
    const alertBox = document.getElementById('resetAlert');

    try {
        const res = await fetch(`/api/auth/reset-password?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&newPassword=${encodeURIComponent(newPassword)}`, {
            method: 'POST'
        });

        if (res.ok) {
            const data = await res.json();
            alertBox.classList.remove('d-none', 'alert-danger');
            alertBox.classList.add('alert-success');
            alertBox.innerText = data.message || "Password reset successfully! You can now log in.";
            document.getElementById('resetPasswordForm').reset();
        } else {
            const err = await res.json();
            alertBox.classList.remove('d-none', 'alert-success');
            alertBox.classList.add('alert-danger');
            alertBox.innerText = err.message || "Failed to reset password. Verify username and email.";
        }
    } catch (err) {
        alertBox.classList.remove('d-none', 'alert-success');
        alertBox.classList.add('alert-danger');
        alertBox.innerText = "Error connecting to server.";
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    showLoginPage();
}

function showLoginPage() {
    document.getElementById('loginView')?.classList.remove('d-none');
    document.getElementById('appWrapper')?.classList.add('d-none');
}

function showMainApp() {
    document.getElementById('loginView')?.classList.add('d-none');
    document.getElementById('appWrapper')?.classList.remove('d-none');

    if (currentUser) {
        const navUserName = document.getElementById('navUserName');
        const navUserRole = document.getElementById('navUserRole');
        if (navUserName) navUserName.innerText = currentUser.name || currentUser.username;
        const shortRole = currentUser.role ? currentUser.role.replace('ROLE_', '') : '';
        if (navUserRole) navUserRole.innerText = shortRole;

        // Store username/role in localStorage so legacy frontend_app.js can find this session
        if (currentUser.username) {
            localStorage.setItem('sece_logged_in_user', currentUser.username.toLowerCase());
        }
        if (shortRole) {
            localStorage.setItem('sece_logged_in_role', shortRole);
        }

        // Defer switchRole so that legacy scripts (frontend_app.js) have time to load
        if (shortRole) {
            const trySwitch = (attempts) => {
                if (typeof window.switchRole === 'function') {
                    window.switchRole(shortRole, true);
                } else if (attempts > 0) {
                    setTimeout(() => trySwitch(attempts - 1), 300);
                }
            };
            trySwitch(10);
        }
    }

    if (currentUser && currentUser.role === 'ROLE_STUDENT') {
        if (window.location.pathname !== '/student') window.location.href = '/student';
    } else if (currentUser && currentUser.role === 'ROLE_FACULTY') {
        if (window.location.pathname !== '/faculty') window.location.href = '/faculty';
    } else if (currentUser && currentUser.role === 'ROLE_ADMIN') {
        if (window.location.pathname !== '/admin') window.location.href = '/admin';
    } else {
        // Fallback
        if (window.location.pathname !== '/student') window.location.href = '/student';
    }

    loadDashboardStats();
    if (typeof loadTimetableData === 'function') {
        loadTimetableData();
    }
    populateSectionDropdowns();
}

function switchTab(viewId) {
    document.querySelectorAll('.view-container').forEach(el => el.classList.add('d-none'));
    document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(el => el.classList.remove('active'));

    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('d-none');
    }

    const link = document.querySelector(`[onclick="switchTab('${viewId}')"]`);
    if (link) link.classList.add('active');

    if (viewId === 'view-admin-dashboard' || viewId === 'view-faculty-dashboard' || viewId === 'view-student-dashboard') {
        loadDashboardStats();
    } else if (viewId === 'view-teachers') loadTeachers();
    else if (viewId === 'view-students') loadStudents();
    else if (viewId === 'view-departments') loadDepartments();
    else if (viewId === 'view-subjects') loadSubjects();
    else if (viewId === 'view-classrooms') loadClassrooms();
    else if (viewId === 'view-labs') loadLabs();
    else if (viewId === 'view-sections') loadSections();
    else if (viewId === 'view-timeslots') loadTimeSlots();
    else if (viewId === 'view-conflicts') loadConflicts();
    else if (viewId === 'view-availability') loadFacultyAvailabilities();
}

async function populateSectionDropdowns() {
    const regSecSelect = document.getElementById('regUserSection');
    if (regSecSelect && regSecSelect.options.length <= 1) {
        const res = await apiFetch('/api/sections');
        if (res.ok) {
            const secs = await res.json();
            secs.forEach(s => regSecSelect.add(new Option(s.sectionName, s.id)));
        }
    }
}

// Registration for Phone SMS and Email Notifications
async function handleNotificationRegistration(e) {
    e.preventDefault();
    const name = document.getElementById('regUserName').value;
    const email = document.getElementById('regUserEmail').value;
    const phone = document.getElementById('regUserPhone').value;
    const role = document.getElementById('regUserRole').value;
    const sectionId = document.getElementById('regUserSection').value;
    const alertBox = document.getElementById('regNotificationAlert');

    try {
        const url = `/api/notifications/register?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&role=${role}&sectionId=${sectionId}`;
        const res = await fetch(url, { method: 'POST' });

        if (res.ok) {
            alertBox.classList.remove('d-none', 'alert-danger');
            alertBox.classList.add('alert-success');
            alertBox.innerText = `✅ Registered phone (${phone}) & email for period notifications!`;
            document.getElementById('notificationRegForm').reset();
        } else {
            alertBox.classList.remove('d-none', 'alert-success');
            alertBox.classList.add('alert-danger');
            alertBox.innerText = "Failed to register notifications.";
        }
    } catch (err) {
        alertBox.classList.remove('d-none', 'alert-success');
        alertBox.classList.add('alert-danger');
        alertBox.innerText = "Error connecting to server.";
    }
}

// Add Section (Faculty & Admin access)
async function handleAddSection(e) {
    e.preventDefault();
    const secName = document.getElementById('addSecName').value;
    const sem = document.getElementById('addSecSem').value;
    const count = document.getElementById('addSecCount').value;

    try {
        const res = await apiFetch('/api/sections', {
            method: 'POST',
            body: JSON.stringify({ sectionName: secName, semester: parseInt(sem), studentCount: parseInt(count), course: { id: 1 } })
        });
        if (res.ok) {
            const modalEl = document.getElementById('addSectionModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            loadSections();
            alert("Section added successfully!");
        }
    } catch (err) {
        alert("Failed to add section");
    }
}

// Add Student (Faculty & Admin access)
async function handleAddStudent(e) {
    e.preventDefault();
    const regNo = document.getElementById('addStudReg').value;
    const name = document.getElementById('addStudName').value;
    const email = document.getElementById('addStudEmail').value;
    const sem = document.getElementById('addStudSem').value;

    try {
        const res = await apiFetch('/api/students', {
            method: 'POST',
            body: JSON.stringify({
                registerNumber: regNo,
                name: name,
                email: email,
                semester: parseInt(sem),
                department: { id: 1 },
                course: { id: 1 },
                section: { id: 1 }
            })
        });
        if (res.ok) {
            const modalEl = document.getElementById('addStudentModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            loadStudents();
            alert("Student added successfully!");
        }
    } catch (err) {
        alert("Failed to add student");
    }
}

async function loadDashboardStats() {
    try {
        const res = await apiFetch('/api/dashboard/stats');
        if (res.ok) {
            const stats = await res.json();
            document.querySelectorAll('.stat-teachers-count').forEach(e => e.innerText = stats.totalTeachers);
            document.querySelectorAll('.stat-students-count').forEach(e => e.innerText = stats.totalStudents);
            document.querySelectorAll('.stat-subjects-count').forEach(e => e.innerText = stats.totalSubjects);
            document.querySelectorAll('.stat-rooms-count').forEach(e => e.innerText = stats.totalClassrooms);
            document.querySelectorAll('.stat-labs-count').forEach(e => e.innerText = stats.totalLabs);
            document.querySelectorAll('.stat-sections-count').forEach(e => e.innerText = stats.totalSections);
            document.querySelectorAll('.stat-conflicts-count').forEach(e => e.innerText = stats.conflictsCount);

            renderDashboardCharts(stats);
        }
    } catch (e) {
        console.error("Dashboard error", e);
    }
}

// CRUD Loaders
async function loadTeachers() {
    const res = await apiFetch('/api/teachers');
    if (!res.ok) return;
    const teachers = await res.json();
    const tbody = document.getElementById('teacherTableBody');
    if (!tbody) return;
    tbody.innerHTML = teachers.map(t => `
        <tr>
            <td>${t.employeeId}</td>
            <td><strong>${t.name}</strong></td>
            <td>${t.email}</td>
            <td>${t.phone || 'N/A'}</td>
            <td>${t.department ? t.department.code : 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTeacher(${t.id})"><i class="bi bi-trash"></i> Remove</button>
            </td>
        </tr>
    `).join('');
}

async function loadStudents() {
    const res = await apiFetch('/api/students');
    if (!res.ok) return;
    const students = await res.json();
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;
    tbody.innerHTML = students.map(s => `
        <tr>
            <td>${s.registerNumber}</td>
            <td><strong>${s.name}</strong></td>
            <td>${s.email}</td>
            <td>${s.department ? s.department.code : 'N/A'}</td>
            <td>Semester ${s.semester}</td>
            <td>${s.section ? s.section.sectionName : 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${s.id})"><i class="bi bi-trash"></i> Remove Student</button>
            </td>
        </tr>
    `).join('');
}

async function loadDepartments() {
    const res = await apiFetch('/api/departments');
    if (!res.ok) return;
    const depts = await res.json();
    const tbody = document.getElementById('deptTableBody');
    if (!tbody) return;
    tbody.innerHTML = depts.map(d => `
        <tr>
            <td><strong>${d.code}</strong></td>
            <td>${d.name}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDepartment(${d.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function loadSubjects() {
    const res = await apiFetch('/api/subjects');
    if (!res.ok) return;
    const subjects = await res.json();
    const tbody = document.getElementById('subjectTableBody');
    if (!tbody) return;
    tbody.innerHTML = subjects.map(s => `
        <tr>
            <td><strong>${s.subjectCode}</strong></td>
            <td>${s.subjectName}</td>
            <td>${s.department ? s.department.code : 'N/A'}</td>
            <td>Sem ${s.semester}</td>
            <td><span class="badge ${s.type==='LAB'?'bg-purple':'bg-info'}">${s.type}</span></td>
            <td>${s.weeklyHours} hrs/wk</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteSubject(${s.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function loadClassrooms() {
    const res = await apiFetch('/api/classrooms');
    if (!res.ok) return;
    const rooms = await res.json();
    const tbody = document.getElementById('classroomTableBody');
    if (!tbody) return;
    tbody.innerHTML = rooms.map(r => `
        <tr>
            <td><strong>${r.roomNumber}</strong></td>
            <td>${r.building}</td>
            <td>${r.capacity} Seats</td>
            <td>${r.roomType}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteClassroom(${r.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function loadLabs() {
    const res = await apiFetch('/api/laboratories');
    if (!res.ok) return;
    const labs = await res.json();
    const tbody = document.getElementById('labTableBody');
    if (!tbody) return;
    tbody.innerHTML = labs.map(l => `
        <tr>
            <td><strong>${l.labName}</strong></td>
            <td>${l.building}</td>
            <td>${l.capacity} Workstations</td>
            <td>${l.labType}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteLab(${l.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function loadSections() {
    const res = await apiFetch('/api/sections');
    if (!res.ok) return;
    const secs = await res.json();
    const tbody = document.getElementById('sectionTableBody');
    if (!tbody) return;
    tbody.innerHTML = secs.map(s => `
        <tr>
            <td><strong>${s.sectionName}</strong></td>
            <td>${s.course ? s.course.name : 'N/A'}</td>
            <td>Semester ${s.semester}</td>
            <td>${s.studentCount} Students</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteSection(${s.id})"><i class="bi bi-trash"></i> Remove Section</button>
            </td>
        </tr>
    `).join('');
}

async function loadTimeSlots() {
    const res = await apiFetch('/api/timeslots');
    if (!res.ok) return;
    const slots = await res.json();
    const tbody = document.getElementById('slotTableBody');
    if (!tbody) return;
    tbody.innerHTML = slots.map(sl => `
        <tr>
            <td>Slot ${sl.slotNumber}</td>
            <td><strong>${sl.startTime}</strong></td>
            <td><strong>${sl.endTime}</strong></td>
            <td>${sl.slotLabel}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTimeSlot(${sl.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function loadConflicts() {
    const res = await apiFetch('/api/timetable/conflicts');
    if (!res.ok) return;
    const data = await res.json();
    const container = document.getElementById('conflictReportList');
    if (!container) return;

    if (data.valid || data.totalConflicts === 0) {
        container.innerHTML = `
            <div class="alert alert-success d-flex align-items-center gap-3">
                <i class="bi bi-check-circle-fill fs-2"></i>
                <div>
                    <h5 class="mb-0">NO CONFLICTS DETECTED</h5>
                    <p class="mb-0 text-muted">The current Sri Eshwar College schedule strictly satisfies all teacher, room, lab, section, capacity, and availability constraints.</p>
                </div>
            </div>
        `;
        return;
    }

    let html = `
        <div class="alert alert-danger mb-4">
            <h5 class="mb-1"><i class="bi bi-exclamation-triangle-fill"></i> ${data.totalConflicts} CONFLICTS DETECTED</h5>
            <div>Teacher conflicts: ${data.teacherConflictsCount} | Room conflicts: ${data.roomConflictsCount} | Lab conflicts: ${data.labConflictsCount} | Section conflicts: ${data.sectionConflictsCount}</div>
        </div>
        <div class="table-responsive">
            <table class="table table-bordered table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Conflict Type</th>
                        <th>Severity</th>
                        <th>Day & Time</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
    `;

    data.conflicts.forEach(c => {
        html += `
            <tr>
                <td><span class="badge bg-danger">${c.type}</span></td>
                <td><span class="conflict-badge-high">${c.severity}</span></td>
                <td>${c.day} (${c.timeSlotLabel})</td>
                <td>${c.description}</td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

async function loadFacultyAvailabilities() {
    const resTeachers = await apiFetch('/api/teachers');
    const resSlots = await apiFetch('/api/timeslots');
    const resAvail = await apiFetch('/api/faculty-availability');

    if (!resTeachers.ok || !resSlots.ok) return;

    const teachers = await resTeachers.json();
    const slots = await resSlots.json();
    slots.sort((a, b) => a.slotNumber - b.slotNumber);
    const availabilities = resAvail.ok ? await resAvail.json() : [];

    const container = document.getElementById('availabilityGridContainer');
    if (!container) return;

    let html = '';
    teachers.forEach(t => {
        html += `
            <div class="card mb-3">
                <div class="card-header bg-dark text-white fw-bold d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-person-badge"></i> ${t.name} (${t.employeeId}) - ${t.department ? t.department.code : ''}</span>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered text-center mb-0">
                            <thead>
                                <tr class="bg-light">
                                    <th>Day / Time</th>
                                    ${slots.map(s => `<th>${s.slotLabel}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
        `;

        DAYS_OF_WEEK.forEach(day => {
            html += `<tr><td class="fw-bold bg-light">${day}</td>`;
            slots.forEach(s => {
                const match = availabilities.find(a => a.teacher.id === t.id && a.day === day && a.timeSlot.id === s.id);
                const isAvail = match ? match.available : true;
                html += `
                    <td>
                        <button class="btn btn-sm ${isAvail ? 'btn-success' : 'btn-danger'}"
                            onclick="toggleAvailability(${t.id}, '${day}', ${s.id}, ${!isAvail})">
                            ${isAvail ? 'AVAILABLE' : 'UNAVAILABLE'}
                        </button>
                    </td>
                `;
            });
            html += '</tr>';
        });

        html += '</tbody></table></div></div></div>';
    });

    container.innerHTML = html;
}

async function toggleAvailability(teacherId, day, slotId, status) {
    await apiFetch(`/api/faculty-availability?teacherId=${teacherId}&day=${day}&timeSlotId=${slotId}&available=${status}`, {
        method: 'POST'
    });
    loadFacultyAvailabilities();
}

// Delete functions (Faculty & Admin permissions)
window.deleteTeacher = async function(id) {
    if (confirm("Delete this teacher?")) {
        try {
            const res = await apiFetch(`/api/teachers/${id}`, { method: 'DELETE' });
            if (res.ok) { loadTeachers(); } 
            else { const err = await res.text().catch(()=>''); alert("Error: " + err); }
        } catch (e) { alert("Network error."); }
    }
}
window.deleteStudent = async function(id) {
    if (confirm("Remove this student from institution records?")) {
        try {
            const res = await apiFetch(`/api/students/${id}`, { method: 'DELETE' });
            if (res.ok) { loadStudents(); } 
            else { const err = await res.text().catch(()=>''); alert("Error: " + err); }
        } catch (e) { alert("Network error."); }
    }
}
window.deleteDepartment = async function(id) {
    if (confirm("Delete this department?")) {
        try {
            const res = await apiFetch(`/api/departments/${id}`, { method: 'DELETE' });
            if (res.ok) { loadDepartments(); } 
            else { const err = await res.text().catch(()=>''); alert("Error: " + err); }
        } catch (e) { alert("Network error."); }
    }
}
window.deleteSubject = async function(id) {
    if (confirm("Delete this subject?")) {
        try {
            const res = await apiFetch(`/api/subjects/${id}`, { method: 'DELETE' });
            if (res.ok) { loadSubjects(); } 
            else { const err = await res.text().catch(()=>''); alert("Error: " + err); }
        } catch (e) { alert("Network error."); }
    }
}
window.deleteClassroom = async function(id) {
    if (confirm("Delete this classroom?")) {
        try {
            const res = await apiFetch(`/api/classrooms/${id}`, { method: 'DELETE' });
            if (res.ok) { loadClassrooms(); } 
            else { const err = await res.text().catch(()=>''); alert("Error: " + err); }
        } catch (e) { alert("Network error."); }
    }
}
window.deleteLab = async function(id) {
    if (confirm("Delete this laboratory?")) {
        try {
            const res = await apiFetch(`/api/laboratories/${id}`, { method: 'DELETE' });
            if (res.ok) { loadLabs(); } 
            else { const err = await res.text().catch(()=>''); alert("Error: " + err); }
        } catch (e) { alert("Network error."); }
    }
}
window.deleteSection = async function(id) {
    if (confirm("Remove this class section?")) {
        try {
            const res = await apiFetch(`/api/sections/${id}`, { method: 'DELETE' });
            if (res.ok) { loadSections(); } 
            else { const err = await res.text().catch(()=>''); alert("Error: " + err); }
        } catch (e) { alert("Network error."); }
    }
}
window.deleteTimeSlot = async function(id) {
    if (confirm("Delete this time slot?")) {
        try {
            const res = await apiFetch(`/api/timeslots/${id}`, { method: 'DELETE' });
            if (res.ok) { loadTimeSlots(); } 
            else { const err = await res.text().catch(()=>''); alert("Error: " + err); }
        } catch (e) { alert("Network error."); }
    }
}

// Expose all functions to window
window.logout = logout;
window.showLoginPage = showLoginPage;
window.showMainApp = showMainApp;
window.switchTab = switchTab;
