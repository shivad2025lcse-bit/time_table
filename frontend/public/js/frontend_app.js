// =========================
// ROLE-BASED AUTHENTICATION
// =========================
const AUTH_CONFIG = {
    STUDENT: { prefix: 's', title: 'Student Login', example: '711122104033', icon: 'fa-user-graduate', color: 'success' },
    FACULTY: { prefix: 'f', title: 'Faculty Login', example: 'fkeerj012345', icon: 'fa-chalkboard-user', color: 'warning' },
    ADMIN: { prefix: 'a', title: 'Admin Login', example: 'shiva25012007', icon: 'fa-user-shield', color: 'danger' }
};
const ADMIN_USERNAME = 'shiva25012007';
const ADMIN_INITIAL_PASSWORD = 'shiv2501';

function normalizeNamePart(name) {
    return String(name || '').toLowerCase().replace(/[^a-z]/g, '');
}

function buildGeneratedUsername(role, fullName) {
    if (role === 'STUDENT') return ''; // Students now use Register Number
    const clean = normalizeNamePart(fullName);
    const words = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    const first = normalizeNamePart(words[0] || '');
    const last = normalizeNamePart(words[words.length - 1] || '');
    if (!first || !last || first.length < 4) return '';
    return AUTH_CONFIG[role].prefix + first.slice(0, 4) + last.charAt(0) + '012345';
}

function buildClassAdvisorUsername(fullName) {
    const words = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    const first = normalizeNamePart(words[0] || '');
    if (!first || first.length < 4) return '';
    return 'a' + first.slice(0, 4);
}

function getClassAdvisorPassword(username) {
    const clean = String(username || '').toLowerCase();
    const saved = localStorage.getItem('sece_password_' + clean);
    return saved ? saved : '12345';
}

function buildGeneratedPassword(role, username) {
    const clean = String(username || '').toLowerCase();
    if (role === 'ADMIN') return ADMIN_INITIAL_PASSWORD;
    if (role === 'STUDENT') return ''; // Handled by getStudentPassword
    return clean.startsWith(AUTH_CONFIG[role].prefix) ? clean.slice(1) : clean;
}

function getStudentPassword(student) {
    const firstName = String(student.firstName || student.name || '').split(' ')[0].toUpperCase();
    const phoneStr = String(student.phone || '').replace(/\D/g, '');
    const last4 = phoneStr.length >= 4 ? phoneStr.slice(-4) : '0000';
    return firstName + last4;
}

function isLowercaseAlnum(value) {
    return /^[a-z0-9]+$/.test(value);
}

function getStoredPassword(username) {
    const clean = String(username || '').toLowerCase();
    if (clean === '25cs316') return 'shiv9293';

    const saved = localStorage.getItem('sece_password_' + clean);
    if (saved) return saved;
    if (clean === ADMIN_USERNAME) return ADMIN_INITIAL_PASSWORD;

    const student = studentsRoster.find(s => String(s.roll || '').toLowerCase() === clean);
    if (student) return getStudentPassword(student);

    if (clean.startsWith('f')) {
        const staff = staffDirectory.find(s => buildGeneratedUsername('FACULTY', s.name) === clean);
        return staff ? buildGeneratedPassword('FACULTY', clean) : null;
    }
    return null;
}

function isValidUsername(role, username) {
    const clean = String(username || '').trim().toLowerCase();
    if (role === 'ADMIN') return clean === ADMIN_USERNAME;
    if (role === 'STUDENT') {
        if (clean === '25cs316') return true;
        return studentsRoster.some(s => String(s.roll || '').toLowerCase() === clean);
    }
    if (role === 'FACULTY') {
        if (!isLowercaseAlnum(clean)) return false;
        return staffDirectory.some(s => buildGeneratedUsername('FACULTY', s.name) === clean);
    }
    if (role === 'CLASS_ADVISOR') {
        if (!isLowercaseAlnum(clean)) return false;
        return staffDirectory.some(s => buildClassAdvisorUsername(s.name) === clean);
    }
    return false;
}

function usernameRuleText(role) {
    if (role === 'ADMIN') return `Admin username is fixed: "${ADMIN_USERNAME}". Initial password: "${ADMIN_INITIAL_PASSWORD}".`;
    if (role === 'FACULTY') return `Enter your generated username provided by the Administrator.`;
    if (role === 'STUDENT') return `Student username is your Register Number. Initial password is UPPERCASE First Name + last 4 digits of Mobile Number.`;
    const config = AUTH_CONFIG[role];
    return `${role} username = "${config.prefix}" + first 4 letters of first name + last name initial + 012345. Example: ${config.example}.`;
}

function openLoginForm(role) {
    const config = AUTH_CONFIG[role];
    document.getElementById('selectedLoginRole').value = role;
    document.getElementById('loginRoleBadge').innerText = role;
    document.getElementById('loginTitle').innerText = config.title;
    document.getElementById('loginHint').innerText = usernameRuleText(role);
    document.getElementById('usernameRule').innerText = role === 'FACULTY' ? '' : (role === 'STUDENT' ? 'Example: 25CS316 (Case-insensitive)' : `Example: ${config.example}`);
    document.getElementById('loginUsername').placeholder = role === 'FACULTY' ? 'Your Username' : config.example;
    document.getElementById('loginIcon').innerHTML =
        `<i class="fa-solid ${config.icon}"></i>`;

    document.getElementById('roleSelection').classList.add('login-hidden');
    document.getElementById('loginFormPanel').classList.remove('login-hidden');
    document.getElementById('loginUsername').focus();
}

function backToRoleSelection() {
    document.getElementById('loginFormPanel').classList.add('login-hidden');
    document.getElementById('roleSelection').classList.remove('login-hidden');
    document.getElementById('roleLoginForm').reset();
}

function toggleLoginPassword() {
    const input = document.getElementById('loginPassword');
    const icon = document.getElementById('loginPasswordEye');
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.className = input.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
}

async function handleRoleLogin(e) {
    e.preventDefault();
    const role = document.getElementById('selectedLoginRole').value;
    const username = document.getElementById('loginUsername').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('roleLoginBtn');

    if (!username || !password) {
        alert('Please enter your username and password.');
        return;
    }

    // Show loading state
    if (loginBtn) { loginBtn.disabled = true; loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...'; }

    // Step 1: Try backend API authentication first (works for all backend users)
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            const data = await res.json();
            // Backend login success â€” store token and user info
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user_info', JSON.stringify(data));
            localStorage.setItem('sece_logged_in_user', username);
            localStorage.setItem('sece_logged_in_role', role);
            currentUserRole = role;

            // Fetch student's section from backend before redirecting
            if (role === 'STUDENT') {
                try {
                    const stuRes = await fetch('/api/students', { headers: { 'Authorization': 'Bearer ' + data.token } });
                    if (stuRes.ok) {
                        const students = await stuRes.json();
                        const me = students.find(s => s.user && s.user.username === username);
                        if (me && me.section) {
                            const secName = me.section.sectionName || me.section.name || '';
                            if (secName) {
                                currentSection = secName;
                                localStorage.setItem('sece_last_viewed_section', secName);
                            }
                        }
                    }
                } catch(err) { console.warn('Could not fetch student section', err); }
                window.location.href = '/student';
            } else if (role === 'ADMIN') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/faculty';
            }
            return;
        }
        // Backend returned 401/403 â€” fall through to local validation below
    } catch (networkErr) {
        console.warn('Backend unreachable, falling back to local auth', networkErr);
    }

    // Step 2: Fallback to local validation (for hardcoded admin / offline mode)
    if (loginBtn) { loginBtn.disabled = false; loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket me-2"></i>Login'; }

    if (!isLowercaseAlnum(username) || !/^[a-zA-Z0-9]+$/.test(password)) {
        alert('Username must be lowercase letters and numbers. Password can contain both uppercase and lowercase letters and numbers.');
        return;
    }
    if (!isValidUsername(role, username)) {
        alert(`Invalid ${role.toLowerCase()} username.\n${usernameRuleText(role)}`);
        return;
    }
    const expectedPassword = getStoredPassword(username);
    if (!expectedPassword || password !== expectedPassword) {
        alert('Invalid username or password.');
        return;
    }

    currentUserRole = role;
    localStorage.setItem('sece_logged_in_user', username);
    localStorage.setItem('sece_logged_in_role', role);

    if (role === 'STUDENT') {
        const stu = typeof studentsRoster !== 'undefined' ? studentsRoster.find(s => (s.username || String(s.roll || '').toLowerCase()) === username) : null;
        if (stu) {
            const sec = stu.sec || (stu.section ? (stu.section.sectionName || stu.section.name || stu.section) : null);
            if (sec) { currentSection = sec; localStorage.setItem('sece_last_viewed_section', currentSection); }
        }
    }

    if (role === 'ADMIN') { window.location.href = '/admin'; }
    else if (role === 'FACULTY') { window.location.href = '/faculty'; }
    else { window.location.href = '/student'; }
}

function logoutUser() {
    localStorage.removeItem('sece_logged_in_user');
    localStorage.removeItem('sece_logged_in_role');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    currentUserRole = null;
    window.location.href = '/login';
}

// =========================
// ACCOUNT SETTINGS: change username / password after login
// =========================
function openAccountSettingsModal() {
    const username = localStorage.getItem('sece_logged_in_user') || '';
    const role = currentUserRole;
    document.getElementById('asCurrentUsername').innerText = username || '-';
    document.getElementById('asUsernameHint').innerText =
        role === 'ADMIN' ? 'Admin username is fixed and cannot be changed.' :
            'Username is fixed from the enrolled/staff name. Only the password can be changed.';
    const u = document.getElementById('asNewUsername');
    if (u) { u.value = ''; u.disabled = true; u.placeholder = 'Username cannot be changed'; }
    document.getElementById('accountSettingsForm').reset();
    new bootstrap.Modal(document.getElementById('accountSettingsModal')).show();
}

function handleAccountSettingsSubmit(e) {
    e.preventDefault();
    const username = localStorage.getItem('sece_logged_in_user');
    const role = currentUserRole;
    if (!username || !role) { alert('Please log in first.'); return; }

    const newPassword = document.getElementById('asNewPassword').value;
    const confirmPassword = document.getElementById('asConfirmPassword').value;
    if (!newPassword || !confirmPassword) { alert('Enter and confirm your new password.'); return; }
    if (!isLowercaseAlnum(newPassword) || !isLowercaseAlnum(confirmPassword)) {
        alert('Password can contain only lowercase letters and numbers.');
        return;
    }
    if (newPassword.length < 4) { alert('Password must be at least 4 characters.'); return; }
    if (newPassword !== confirmPassword) { alert('New passwords do not match.'); return; }

    localStorage.setItem('sece_password_' + username, newPassword);
    const modalEl = document.getElementById('accountSettingsModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    document.getElementById('accountSettingsForm').reset();
    showToast('Password Updated', 'Your new password has been saved successfully.');
}

function updateForgotPasswordHint() {
    const role = document.getElementById('fpUserType').value;
    const config = AUTH_CONFIG[role];
    document.getElementById('fpIdentifier').placeholder = config.example;
    document.getElementById('fpUsernameHint').innerText = usernameRuleText(role);
}

function openForgotPasswordForLogin() {
    const role = document.getElementById('selectedLoginRole').value || 'STUDENT';
    document.getElementById('fpUserType').value = role;
    updateForgotPasswordHint();
    const modal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
    modal.show();
}

function restoreLoginSession() {
    const username = localStorage.getItem('sece_logged_in_user');
    const role = localStorage.getItem('sece_logged_in_role');
    const hasBackendToken = !!localStorage.getItem('jwt_token');

    if (hasBackendToken) {
        // We are using backend auth
        try {
            const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
            if (userInfo && userInfo.role) {
                const shortRole = userInfo.role.replace('ROLE_', '');
                currentUserRole = shortRole;
                // For backend students, store their username so currentStudentRecord() can find them
                if (shortRole === 'STUDENT' && userInfo.username) {
                    localStorage.setItem('sece_logged_in_user', userInfo.username);
                    // Load student's section from backend
                    apiFetch('/api/students').then(res => {
                        if (res && res.ok) {
                            res.json().then(students => {
                                const me = students.find(s => s.user && s.user.username === userInfo.username);
                                if (me) {
                                    const secObj = me.section || me.sec;
                                    let secName = typeof secObj === 'string' ? secObj : (secObj ? (secObj.sectionName || secObj.name || '') : '');
                                    if (secName) {
                                        currentSection = secName;
                                        localStorage.setItem('sece_last_viewed_section', secName);
                                    }
                                    // Add to studentsRoster if not present
                                    const alreadyInRoster = studentsRoster.find(s => s.username === userInfo.username);
                                    if (!alreadyInRoster) {
                                        studentsRoster.push({
                                            id: me.id,
                                            roll: me.registerNumber || me.roll || userInfo.username,
                                            firstName: me.firstName || '',
                                            name: me.name || (me.firstName + ' ' + (me.lastName || '')).trim(),
                                            email: me.email || '-',
                                            collegeEmail: me.collegeEmail || '-',
                                            phone: me.phone || '0000000000',
                                            username: userInfo.username,
                                            sec: secName || 'II CSE A',
                                            section: secObj
                                        });
                                    }
                                }
                                switchRole(shortRole, true);
                            });
                        } else {
                            switchRole(shortRole, true);
                        }
                    }).catch(() => switchRole(shortRole, true));
                } else {
                    switchRole(shortRole, true);
                }
            }
        } catch (e) {
            console.error('Error restoring backend session roles in UI', e);
        }
        return;
    }

    if (username && role && isValidUsername(role, username) && getStoredPassword(username)) {
        currentUserRole = role;

        if (role === 'STUDENT') {
            const stu = typeof studentsRoster !== 'undefined' ? studentsRoster.find(s => (s.username || String(s.roll || '').toLowerCase()) === username) : null;
            if (stu) {
                const sec = stu.sec || (stu.section ? (stu.section.sectionName || stu.section.name || stu.section) : null);
                if (sec) {
                    currentSection = sec;
                    localStorage.setItem('sece_last_viewed_section', currentSection);
                }
            }
        }

        const currentRoleLabel = document.getElementById('currentRoleLabel');
        if (currentRoleLabel) currentRoleLabel.innerText = `Role: ${role}`;
        const usernameLabel = document.getElementById('loggedInUsernameLabel');
        if (usernameLabel) usernameLabel.innerText = `Username: ${username}`;

        // Don't redirect if we are already on a dashboard page
        if (window.location.pathname === '/login' || window.location.pathname === '/' || window.location.pathname === '/login.html') {
            if (role === 'ADMIN') window.location.href = '/admin';
            else if (role === 'FACULTY') window.location.href = '/faculty';
            else window.location.href = '/student';
        } else {
            switchRole(role, true);
        }
    } else {
        // If not logged in and not on login page, redirect to login
        if (window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/login.html') {
            window.location.href = '/login';
        }
    }
}


// =========================
// Storage Keys
// =========================
const STUDENT_STORAGE_KEY = 'sece_students_roster_v1';
const TIMETABLE_STORAGE_KEY = 'sece_timetable_edits_v1';
const SECTIONS_STORAGE_KEY = 'sece_sections_v2';
const RESOURCES_STORAGE_KEY = 'sece_admin_resources_v1';
const STAFF_STORAGE_KEY = 'sece_staff_directory_v1';
const SUBSTITUTION_STORAGE_KEY = 'sece_substitutions_v1';
const COVERAGE_REQUESTS_KEY = 'sece_coverage_requests_v1';
const LEAVE_STATE_KEY_PREFIX = 'sece_on_leave_';

// =========================
// PERSISTENT STUDENT ROSTER
// =========================

function loadSavedStudents() {
    try {
        const saved = localStorage.getItem(STUDENT_STORAGE_KEY);
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Unable to load saved students:', error);
        return [];
    }
}

function saveStudents() {
    localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(studentsRoster));
}

function canManageStudents() {
    const effectiveRole = getEffectiveRole();
    if (!currentUserRole && (effectiveRole === 'ADMIN' || effectiveRole === 'FACULTY')) {
        currentUserRole = effectiveRole;
    }
    return effectiveRole === 'ADMIN' || effectiveRole === 'FACULTY';
}
function ensureStudentManagementAccess() {
    if (!canManageStudents()) {
        alert('Access denied. Only Faculty and Admin can add or remove students.');
        return false;
    }
    return true;
}

function canManageSections() {
    const effectiveRole = getEffectiveRole();
    if (!currentUserRole && effectiveRole === 'ADMIN') {
        currentUserRole = effectiveRole;
    }
    return effectiveRole === 'ADMIN';
}
function ensureSectionManagementAccess() {
    if (!canManageSections()) {
        alert('Access denied. Only Admin can add or remove sections.');
        return false;
    }
    return true;
}

function clearSavedStudents() {
    if (currentUserRole !== 'ADMIN') {
        alert('Only Admin can clear the saved student roster.');
        return;
    }
    if (!confirm('Delete all saved student records from this browser?')) return;
    studentsRoster = [];
    saveStudents();
    localStorage.setItem('sece_students_roster_v1', JSON.stringify(studentsRoster));
    renderStudentsRoster();
    showToast('Student Records Cleared', 'All locally saved student records were removed.');
}

// System State
let currentUserRole = null; // Set only after successful login
let currentDept = localStorage.getItem('sece_last_viewed_dept') || '';
let currentSection = localStorage.getItem('sece_last_viewed_section') || '';

// Official Data Extracted from Uploaded Schedule Image (II CSE C)
const DEFAULT_TIMETABLE_DATA = {
    'II CSE C': {
        'Monday': [
            { sub: 'SE', code: 'U23IT481', faculty: 'Dr.S.K.Harikarthick', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'AIML LAB', code: 'U23AM495', faculty: 'Dr.N.Saranya / Dr.M.Praveen', venue: 'Intel AI Lab', cat: 'cat-lab' },
            { sub: 'AIML LAB', code: 'U23AM495', faculty: 'Dr.N.Saranya / Dr.M.Praveen', venue: 'Intel AI Lab', cat: 'cat-lab' },
            { sub: 'JAVA', code: 'U23CS491', faculty: 'Mr.M.Karthickraja', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'DAA', code: 'U23CS403', faculty: 'Mr.R.Karthick', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'DM', code: 'U23MA204', faculty: 'Dr.N.Murugavelli', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'SE', code: 'U23IT481', faculty: 'Dr.S.K.Harikarthick', venue: 'SF 04', cat: 'cat-theory' }
        ],
        'Tuesday': [
            { sub: 'JAVA', code: 'U23CS491', faculty: 'Mr.M.Karthickraja', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'DBMS', code: 'U23CS404', faculty: 'Ms.E.Saranya', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'AIML', code: 'U23AM495', faculty: 'Dr.N.Saranya', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'JAVA LAB', code: 'U23CS491', faculty: 'Mr.M.Karthickraja / Mr.B.Saravanan', venue: 'Full Stack Lab', cat: 'cat-lab' },
            { sub: 'JAVA LAB', code: 'U23CS491', faculty: 'Mr.M.Karthickraja / Mr.B.Saravanan', venue: 'Full Stack Lab', cat: 'cat-lab' },
            { sub: 'DM', code: 'U23MA204', faculty: 'Dr.N.Murugavelli', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'UHV', code: 'U23HV101', faculty: 'Dr.M.P.Sindhu', venue: 'SF 04', cat: 'cat-theory' }
        ],
        'Wednesday': [
            { sub: 'DAA', code: 'U23CS403', faculty: 'Mr.R.Karthick', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'SE LAB', code: 'U23IT481', faculty: 'Dr.S.K.Harikarthick / Mr.P.Arunprakash', venue: 'Intel AI Lab', cat: 'cat-lab' },
            { sub: 'SE LAB', code: 'U23IT481', faculty: 'Dr.S.K.Harikarthick / Mr.P.Arunprakash', venue: 'Intel AI Lab', cat: 'cat-lab' },
            { sub: 'ALT', code: 'U23EM753', faculty: 'Placement Team', venue: 'SF 05', cat: 'cat-alt' },
            { sub: 'ALT', code: 'U23EM753', faculty: 'Placement Team', venue: 'SF 05', cat: 'cat-alt' },
            { sub: 'COE', code: 'COE2026', faculty: 'Domain Experts', venue: 'COE Lab', cat: 'cat-project' },
            { sub: 'COE', code: 'COE2026', faculty: 'Domain Experts', venue: 'COE Lab', cat: 'cat-project' }
        ],
        'Thursday': [
            { sub: 'AIML', code: 'U23AM495', faculty: 'Dr.N.Saranya', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'DAA LAB', code: 'U23CS453', faculty: 'Mr.R.Karthick / Ms.Rajeswari', venue: 'Full Stack Lab', cat: 'cat-lab' },
            { sub: 'DAA LAB', code: 'U23CS453', faculty: 'Mr.R.Karthick / Ms.Rajeswari', venue: 'Full Stack Lab', cat: 'cat-lab' },
            { sub: 'DM', code: 'U23MA204', faculty: 'Dr.N.Murugavelli', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'SS', code: 'U23SS101', faculty: 'Placement Team', venue: 'SF 04', cat: 'cat-alt' },
            { sub: 'DBMS LAB', code: 'U23CS454', faculty: 'Ms.E.Saranya / Dr.K.Suresh kumar', venue: 'Cloud & DevOps Lab', cat: 'cat-lab' },
            { sub: 'DBMS LAB', code: 'U23CS454', faculty: 'Ms.E.Saranya / Dr.K.Suresh kumar', venue: 'Cloud & DevOps Lab', cat: 'cat-lab' }
        ],
        'Friday': [
            { sub: 'DM', code: 'U23MA204', faculty: 'Dr.N.Murugavelli', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'LIB', code: 'LIB101', faculty: 'Librarian', venue: 'Library', cat: 'cat-theory' },
            { sub: 'JAVA', code: 'U23CS491', faculty: 'Mr.M.Karthickraja', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'DAA LAB', code: 'U23CS453', faculty: 'Mr.R.Karthick / Ms.Rajeswari', venue: 'Full Stack Lab', cat: 'cat-lab' },
            { sub: 'DAA LAB', code: 'U23CS453', faculty: 'Mr.R.Karthick / Ms.Rajeswari', venue: 'Full Stack Lab', cat: 'cat-lab' },
            { sub: 'DM', code: 'U23MA204', faculty: 'Dr.N.Murugavelli', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'DBMS', code: 'U23CS404', faculty: 'Ms.E.Saranya', venue: 'SF 04', cat: 'cat-theory' }
        ],
        'Saturday': [
            { sub: 'DBMS', code: 'U23CS404', faculty: 'Ms.E.Saranya', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'JAVA PROJECT', code: 'U23CS491', faculty: 'Mr.M.Karthickraja', venue: 'Full Stack Lab', cat: 'cat-project' },
            { sub: 'JAVA PROJECT', code: 'U23CS491', faculty: 'Mr.M.Karthickraja', venue: 'Full Stack Lab', cat: 'cat-project' },
            { sub: 'DAA', code: 'U23CS403', faculty: 'Mr.R.Karthick', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'TWM', code: 'U23TWM01', faculty: 'Wellness Dept', venue: 'SF 04', cat: 'cat-theory' },
            { sub: 'AIML Project', code: 'U23AM495', faculty: 'Dr.N.Saranya', venue: 'Intel AI Lab', cat: 'cat-project' },
            { sub: 'AIML Project', code: 'U23AM495', faculty: 'Dr.N.Saranya', venue: 'Intel AI Lab', cat: 'cat-project' }
        ]
    }
};

// =========================
// PERSISTENT TIMETABLE EDITS
// =========================

function loadSavedTimetable() {
    const merged = JSON.parse(JSON.stringify(DEFAULT_TIMETABLE_DATA));
    
    // 1. Inject custom built timetables
    activeSections.forEach(sec => {
        const builtSaved = localStorage.getItem(`sece_tt_built_${sec.name}`);
        if (builtSaved) {
            try {
                const built = JSON.parse(builtSaved);
                if (built && built.grid) {
                    merged[sec.name] = {};
                    Object.keys(built.grid).forEach(day => {
                        merged[sec.name][day] = [];
                        for(let i=1; i<=7; i++) {
                             const pData = built.grid[day][`P${i}`] || '';
                             const parts = pData.split(',').map(s => s.trim());
                             merged[sec.name][day].push({
                                 sub: parts[0] || '',
                                 faculty: parts[1] || '',
                                 venue: parts[2] || '',
                                 cat: 'cat-theory'
                             });
                        }
                    });
                }
            } catch (e) { console.error('Error parsing built timetable:', e); }
        }
    });

    // 2. Layer on top period-level edits
    try {
        const saved = localStorage.getItem(TIMETABLE_STORAGE_KEY);
        if (!saved) return merged;
        const edits = JSON.parse(saved);
        Object.keys(edits).forEach(section => {
            if (!merged[section]) merged[section] = {};
            Object.keys(edits[section]).forEach(day => {
                if (!merged[section][day]) merged[section][day] = [];
                Object.keys(edits[section][day]).forEach(pIdx => {
                    merged[section][day][pIdx] = edits[section][day][pIdx];
                });
            });
        });
        return merged;
    } catch (error) {
        console.error('Unable to load saved timetable edits:', error);
        return merged;
    }
}

// Save only the single slot that changed, keyed by section/day/period,
// so each edit is stored independently and never overwrites unrelated slots.
function saveTimetableEdit(section, day, pIdx, slotData) {
    let edits = {};
    try {
        const saved = localStorage.getItem(TIMETABLE_STORAGE_KEY);
        if (saved) edits = JSON.parse(saved);
    } catch (error) {
        console.error('Unable to read existing timetable edits:', error);
    }
    if (!edits[section]) edits[section] = {};
    if (!edits[section][day]) edits[section][day] = {};
    edits[section][day][pIdx] = slotData;
    localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(edits));

    // API Integration: Persist override to MySQL backend
    fetch('/api/operations/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            section: section,
            day: day,
            periodIndex: pIdx,
            subject: slotData.subject || '',
            faculty: slotData.faculty || '',
            venue: slotData.venue || '',
            category: slotData.cat || ''
        })
    }).catch(err => console.error("API Sync failed", err));
}

// Course Incharge Reference List
const courseReferenceList = [
    { short: 'IoT', code: 'P23CS408 Internet of Things', faculty: 'Mr.V.Parthipan, AP/ECE', venue: '1CloudHub', cat: 'PC', credits: 3, hrs: '4' },
    { short: 'DVT', code: 'P23CS513 Data Visualization Techniques', faculty: 'Dr.A.Anandaraj, AP/CSE', venue: '1CloudHub', cat: 'PE', credits: 3, hrs: '4' },
    { short: 'BDA', code: 'P23CS521 Big Data Analytics', faculty: 'Dr.A.Sarfaraz Ahmed,AP/CSE', venue: '1CloudHub', cat: 'PE', credits: 3, hrs: '4' },
    { short: 'TQM', code: 'P23CS507 Total Quality Management', faculty: 'Dr.R.K.Suresh, Prof/MECH', venue: '1CloudHub', cat: 'OE', credits: 3, hrs: '3' },
    { short: 'PW', code: 'P23CS602 Project Work Ã¢â‚¬â€œ Phase I', faculty: 'Dr.S.Ananthi, AP/CSE', venue: '1CloudHub', cat: 'PW', credits: 6, hrs: '14+7*' },
    { short: 'LIB', code: 'Library Hour', faculty: '-', venue: 'Library', cat: '-', credits: '-', hrs: '1*' },
    { short: 'TWM', code: 'Tutor Ward Meeting', faculty: 'Dr.S.Ananthi, AP/CSE', venue: '1CloudHub', cat: '-', credits: '-', hrs: '1' }
];

// Sample Students Roster Data
let studentsRoster = loadSavedStudents();

const DEFAULT_SECTIONS = [
    { dept: 'CSE', name: 'II CSE C', classroom: 'SF 04', capacity: 61 },
    { dept: 'CSE', name: 'II CSE A', classroom: 'SF 02', capacity: 60 },
    { dept: 'CSE', name: 'II CSE B', classroom: 'SF 03', capacity: 60 },
    { dept: 'IT', name: 'II IT A', classroom: 'IT 101', capacity: 60 },
    { dept: 'AIDS', name: 'II AI&DS A', classroom: 'AI 201', capacity: 60 }
];

function loadSections() {
    try {
        const saved = JSON.parse(localStorage.getItem(SECTIONS_STORAGE_KEY));
        return Array.isArray(saved) ? saved : JSON.parse(JSON.stringify(DEFAULT_SECTIONS));
    } catch (_) { return JSON.parse(JSON.stringify(DEFAULT_SECTIONS)); }
}
function saveSections() { localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(activeSections)); }
let activeSections = loadSections();

// Active timetable data = default schedule + any saved edits from Admin/Faculty
let timetableData = loadSavedTimetable();

// Remove legacy Admin credentials from the old version.
localStorage.removeItem('sece_password_shiv');
localStorage.removeItem('sece_recovery_mobile_shiv');
localStorage.removeItem('sece_password_aashwk01');

// Clear the old default student roster (Arun Kumar was removed; roster now starts empty).
// This runs once and is idempotent.
if (!localStorage.getItem('sece_roster_cleared_v2')) {
    localStorage.removeItem('sece_students_roster_v1');
    localStorage.setItem('sece_roster_cleared_v2', '1');
}

// Initial Load
setTimeout(() => {
    renderTimetableGrid();
    renderCourseRefTable();
    renderStudentsRoster();
    renderSectionsList();
    mergeCustomSubjectsIntoCourseList();
    populateEditSubjectSelect();
    populateEditVenueSelect();
    renderAdminResourcesUI();
    updateForgotPasswordHint();
    restoreLoginSession();
    // Populate faculty personal TT panel on load
    if (typeof window.renderFacultyPersonalTT === 'function') window.renderFacultyPersonalTT();

    renderNotificationStatus();
    toggleSubstitutionUI();
    const facultyDetailsModalEl = document.getElementById('facultyDetailsModal');
    if (facultyDetailsModalEl) facultyDetailsModalEl.addEventListener('show.bs.modal', renderFacultyDetailsView);

    const substModalEl = document.getElementById('substitutionModal');
    if (substModalEl) {
        substModalEl.addEventListener('show.bs.modal', initSubstitutionModal);
    }
    
    const defaultsModalEl = document.getElementById('timetableDefaultsModal');
    if (defaultsModalEl) {
        defaultsModalEl.addEventListener('show.bs.modal', () => {
            const batchStart = localStorage.getItem('sece_global_custom_batch');
            const semText = localStorage.getItem('sece_global_custom_sem');
            const ay = localStorage.getItem('sece_global_custom_ay');
            
            if (batchStart) {
                const yearMatch = batchStart.match(/^(\d{4})/);
                if (yearMatch) {
                    const el = document.getElementById('modalBatchInputStandalone') || document.getElementById('modalBatchInput');
                    if (el) el.value = yearMatch[1];
                }
            }
            if (semText) {
                const el = document.getElementById('modalSemSelectStandalone') || document.getElementById('modalSemSelect');
                if (el) el.value = semText;
            }
            if (ay) {
                const el = document.getElementById('modalAcademicYearStandalone') || document.getElementById('modalAcademicYear');
                if (el) el.value = ay;
            }
        });
    }
});

// =========================
// STAFF AVAILABILITY & PERIOD SUBSTITUTION
// =========================

const DEFAULT_STAFF_DIRECTORY = [
    { name: 'Dr.S.K.Harikarthick', dept: 'CSE', status: 'Available' },
    { name: 'Mr.M.Karthickraja', dept: 'CSE', status: 'Available' },
    { name: 'Dr.N.Saranya', dept: 'CSE', status: 'Available' },
    { name: 'Mr.R.Karthick', dept: 'CSE', status: 'Available' },
    { name: 'Ms.E.Saranya', dept: 'CSE', status: 'Available' },
    { name: 'Dr.N.Murugavelli', dept: 'CSE', status: 'Available' },
    { name: 'Dr.M.P.Sindhu', dept: 'CSE', status: 'Available' },
    { name: 'Mr.B.Saravanan', dept: 'CSE', status: 'Available' },
    { name: 'Mr.P.Arunprakash', dept: 'IT', status: 'Available' },
    { name: 'Ms.R.Rajeswari', dept: 'AI&DS', status: 'Available' },
    { name: 'Keerthika J', displayName: 'Ms.J.Keerthika', dept: 'CSE', status: 'Available', classAdvisorFor: 'II CSE C' }
];

// Returns the localStorage key tracking whether a given staff member is on leave today
function leaveStateKey(staffName) {
    return LEAVE_STATE_KEY_PREFIX + staffName.replace(/\s+/g, '_') + '_' + todayDateStr();
}

// Returns true if the given staff name is recorded as on leave today
function isStaffOnLeaveToday(staffName) {
    return localStorage.getItem(leaveStateKey(staffName)) === 'true';
}

// Staff availability directory + today's period substitutions + leave/coverage requests
// (initialized here, after their storage-key constants above, to avoid a
// temporal-dead-zone crash on page load)
let staffDirectory = loadStaffDirectory();
// Keep the known Class Advisor available even when an older localStorage staff list exists.
if (!staffDirectory.some(s => String(s.displayName || s.name).toLowerCase() === 'ms.j.keerthika' || buildGeneratedUsername('FACULTY', s.name) === 'fkeerj012345')) {
    staffDirectory.push({ name: 'Keerthika J', displayName: 'Ms.J.Keerthika', dept: 'CSE', status: 'Available', classAdvisorFor: 'II CSE C', personalEmail: '', collegeEmail: '' });
    saveStaffDirectory();
}
const CLASS_ADVISOR_ASSIGNMENTS = { 'adkeerj012345': 'II CSE C' };
let substitutions = loadSubstitutions();
let coverageRequests = loadCoverageRequests();

function loadStaffDirectory() {
    try {
        const saved = localStorage.getItem(STAFF_STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_STAFF_DIRECTORY));
        return data.map(staff => ({ ...staff, personalEmail: staff.personalEmail || '', collegeEmail: staff.collegeEmail || '' }));
    } catch (error) {
        console.error('Unable to load staff directory:', error);
        return JSON.parse(JSON.stringify(DEFAULT_STAFF_DIRECTORY)).map(staff => ({ ...staff, personalEmail: '', collegeEmail: '' }));
    }
}

function saveStaffDirectory() {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffDirectory));
}

function loadSubstitutions() {
    try {
        const saved = localStorage.getItem(SUBSTITUTION_STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (error) {
        console.error('Unable to load substitutions:', error);
        return {};
    }
}

function saveSubstitutions() {
    localStorage.setItem(SUBSTITUTION_STORAGE_KEY, JSON.stringify(substitutions));
}

function todayDateStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTodayDayName() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
}

function substitutionKey(dateStr, section, day, pIdx) {
    return `${dateStr}__${section}__${day}__${pIdx}`;
}

// Only returns a substitution if "day" is today's actual weekday AND the stored
// date is today's exact date Ã¢â‚¬â€ so it naturally stops applying tomorrow, and next
// week's occurrence of the same weekday is unaffected.
function getSubstitutionFor(section, day, pIdx) {
    if (day !== getTodayDayName()) return null;
    const key = substitutionKey(todayDateStr(), section, day, pIdx);
    return substitutions[key] || null;
}

function canManageSubstitutions() {
    const role = getEffectiveRole();
    return role === 'ADMIN' || role === 'FACULTY';
}

function toggleSubstitutionUI() {
    const btn = document.getElementById('substitutionBtn');
    if (btn) btn.style.display = canManageSubstitutions() ? 'inline-flex' : 'none';
}

function renderStaffAvailability() {
    const tbody = document.getElementById('staffAvailabilityBody');
    const studentTbody = document.getElementById('studentFacultyAvailabilityBody');
    if (!tbody && !studentTbody) return;
    
    try {
        const canManage = canManageSubstitutions();
        const dateStr = todayDateStr();
        
        if (tbody) tbody.innerHTML = '';
        if (studentTbody) studentTbody.innerHTML = '';
        
        if (!staffDirectory || staffDirectory.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-danger">DEBUG: staffDirectory is empty or undefined!</td></tr>';
            if (studentTbody) studentTbody.innerHTML = '<tr><td colspan="3" class="text-danger">DEBUG: staffDirectory is empty or undefined!</td></tr>';
            return;
        }
        
        staffDirectory.forEach((staff, idx) => {
            const dayKey = 'sece_staff_availability_' + dateStr;
            const daily = JSON.parse(localStorage.getItem(dayKey) || '{}');
            const isAvailable = daily[staff.name] !== false;
            const onLeave = isStaffOnLeaveToday(staff.name);

            let statusBadge;
            if (isAvailable) {
                statusBadge = '<span class="badge bg-success">Available</span>';
            } else if (onLeave) {
                statusBadge = '<span class="badge bg-danger me-1">Unavailable</span><span class="badge bg-warning text-dark"><i class="fa-solid fa-house-medical me-1"></i>On Leave</span>';
            } else {
                statusBadge = '<span class="badge bg-secondary">Unavailable</span>';
            }

            if (tbody) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${staff.displayName || staff.name}</td>
                    <td>${staff.dept}</td>
                    <td>${statusBadge}</td>
                    <td class="text-center">
                        ${canManage ? `<button class="btn btn-sm ${isAvailable ? 'btn-outline-danger' : 'btn-outline-success'} py-0" onclick="toggleStaffAvailability(${idx})">
                            ${isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                        </button>` : '<span class="text-muted small">View only</span>'}
                    </td>
                `;
                tbody.appendChild(tr);
            }
            
            if (studentTbody) {
                const tr2 = document.createElement('tr');
                tr2.innerHTML = `
                    <td class="align-middle">${staff.displayName || staff.name}</td>
                    <td class="align-middle">${staff.dept}</td>
                    <td class="align-middle">${statusBadge}</td>
                `;
                studentTbody.appendChild(tr2);
            }
        });
    } catch (e) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="text-danger">DEBUG ERROR: ${e.message}</td></tr>`;
        if (studentTbody) studentTbody.innerHTML = `<tr><td colspan="3" class="text-danger">DEBUG ERROR: ${e.message}</td></tr>`;
    }
}

async function toggleStaffAvailability(idx) {
    if (!canManageSubstitutions()) {
        alert('Access denied. Only Faculty and Admin can update staff availability.');
        return;
    }
    const name = staffDirectory[idx].name;
    const isLeave = isStaffOnLeaveToday(name);
    if (isLeave) {
        await cancelStaffLeave(name);
    } else {
        await markStaffOnLeave(name, "Admin marked as unavailable");
    }
}

// Fill the "Period to Cover" dropdown with today's periods for the currently viewed section
function populateSubPeriodOptions() {
    const select = document.getElementById('subPeriodSelect');
    if (!select) return;
    const todayName = getTodayDayName();
    document.getElementById('substTodayLabel').innerText = `${todayName}, ${todayDateStr()}`;
    document.getElementById('substSectionLabel').innerText = currentSection;

    select.innerHTML = '';
    const dayData = (timetableData[currentSection] || timetableData['II CSE C'])[todayName] || [];

    if (todayName === 'Sunday' || dayData.length === 0) {
        select.innerHTML = '<option value="">No periods scheduled today</option>';
        document.getElementById('subOriginalFaculty').value = '';
        return;
    }

    dayData.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.text = `Period ${idx + 1} Ã¢â‚¬â€ ${p.sub} (${p.faculty})`;
        select.appendChild(opt);
    });
    onSubPeriodChange();
}

function onSubPeriodChange() {
    const select = document.getElementById('subPeriodSelect');
    const pIdx = parseInt(select.value);
    if (isNaN(pIdx)) return;
    const todayName = getTodayDayName();
    const dayData = (timetableData[currentSection] || timetableData['II CSE C'])[todayName] || [];
    document.getElementById('subOriginalFaculty').value = dayData[pIdx] ? dayData[pIdx].faculty : '';
}

function populateSubstituteFacultyOptions() {
    const select = document.getElementById('subSubstituteFaculty');
    if (!select) return;
    const available = staffDirectory.filter(s => s.status === 'Available');
    select.innerHTML = available.length
        ? available.map(s => `<option value="${s.name}">${s.name} (${s.dept})</option>`).join('')
        : '<option value="">No staff currently marked Available</option>';
}

async function handleArrangeSubstitution(e) {
    e.preventDefault();
    if (!canManageSubstitutions()) {
        alert('Access denied. Only Faculty and Admin can arrange substitutions.');
        return;
    }
    const todayName = getTodayDayName();
    if (todayName === 'Sunday') {
        alert('No classes scheduled on Sunday Ã¢â‚¬â€ nothing to substitute.');
        return;
    }
    const pIdx = parseInt(document.getElementById('subPeriodSelect').value);
    if (isNaN(pIdx)) {
        alert('Please select a valid period.');
        return;
    }
    const substituteFaculty = document.getElementById('subSubstituteFaculty').value;
    if (!substituteFaculty) {
        alert('Please select an available substitute staff member.');
        return;
    }
    const reason = document.getElementById('subReason').value;
    const originalFaculty = document.getElementById('subOriginalFaculty').value;

    const key = substitutionKey(todayDateStr(), currentSection, todayName, pIdx);
    substitutions[key] = {
        date: todayDateStr(),
        section: currentSection,
        day: todayName,
        pIdx: pIdx,
        originalFaculty: originalFaculty,
        substituteFaculty: substituteFaculty,
        reason: reason,
        assignedBy: localStorage.getItem('sece_logged_in_user') || currentUserRole,
        assignedAt: new Date().toISOString()
    };
    saveSubstitutions();

    // Save substitution notification to backend API so all users can see it
    const todayName2 = todayName;
    const subNotifDate = todayDateStr();
    const dayData2 = (timetableData[currentSection] || {})[todayName2] || [];
    const periodEntry = dayData2[pIdx] || {};
    await savePeriodNotificationToAPI({
        date: subNotifDate,
        day: todayName2,
        period: pIdx + 1,
        section: currentSection,
        originalFaculty: originalFaculty,
        staff: substituteFaculty,
        subject: periodEntry.sub || reason || 'Substitution',
        reason: reason || 'Substitution arranged',
        source: 'substitution'
    });

    renderTimetableGrid();
    renderTodaysSubstitutions();
    document.getElementById('arrangeSubForm').reset();
    populateSubPeriodOptions();
    populateSubstituteFacultyOptions();

    showToast('Substitute Assigned!', `${substituteFaculty} will cover Period ${pIdx + 1} today in place of ${originalFaculty}. Reverts automatically tomorrow.`);
}

function renderTodaysSubstitutions() {
    const list = document.getElementById('todaysSubstitutionsList');
    if (!list) return;
    const todayName = getTodayDayName();
    const dateStr = todayDateStr();
    let filterSection = currentSection;
    if (currentUserRole === 'STUDENT') {
        if (typeof currentStudentRecord === 'function') {
            const rec = currentStudentRecord();
            if (rec && rec.sec) filterSection = rec.sec;
        }
    }
    const relevant = Object.entries(substitutions).filter(([key, s]) =>
        s.date === dateStr && s.section === filterSection && s.day === todayName
    );

    if (relevant.length === 0) {
        list.innerHTML = '<li class="list-group-item bg-dark text-muted small">No substitutions arranged for today in this section.</li>';
        return;
    }

    list.innerHTML = relevant.map(([key, s]) => `
        <li class="list-group-item bg-dark text-white d-flex justify-content-between align-items-center small">
            <span>Period ${s.pIdx + 1}: <strong>${s.substituteFaculty}</strong> covering for ${s.originalFaculty}${s.reason ? ' Ã¢â‚¬â€ ' + s.reason : ''}</span>
            ${canManageSubstitutions() ? `<button class="btn btn-sm btn-outline-danger py-0" onclick="cancelSubstitution('${key}')">Cancel</button>` : ''}
        </li>
    `).join('');
}

async function cancelSubstitution(key) {
    if (!canManageSubstitutions()) {
        alert('Access denied. Only Faculty and Admin can cancel substitutions.');
        return;
    }
    const cancelledSub = substitutions[key];
    delete substitutions[key];
    saveSubstitutions();
    // If this substitution came from an accepted coverage request, reopen it
    if (coverageRequests[key] && coverageRequests[key].status === 'ACCEPTED') {
        coverageRequests[key].status = 'OPEN';
        coverageRequests[key].requestedBy = null;
        saveCoverageRequests();
        renderCoverageRequests();
    }
    // Also remove the matching period notification from the backend API
    if (cancelledSub) {
        const cancelDate = cancelledSub.date || todayDateStr();
        // Force refresh from API to ensure we have the IDs
        await fetchPeriodNotificationsFromAPI();
        const cancelNotifArr = purgeExpiredPeriodNotifications();

        const toDelete = cancelNotifArr.filter(n =>
        (n.date === cancelDate && n.section === cancelledSub.section &&
            Number(n.period) === cancelledSub.pIdx + 1 &&
            (n.source === 'auto' || n.source === 'substitution'))
        );
        await Promise.all(toDelete.map(n => {
            if (n._id) return deletePeriodNotificationFromAPI(n);
            return Promise.resolve();
        }));

        const cancelNotifFiltered = purgeExpiredPeriodNotifications(); // Re-purge after delete updates cache
        savePeriodNotifications(cancelNotifFiltered);
    }
    renderTimetableGrid();
    renderTodaysSubstitutions();
    showToast('Substitution Cancelled', 'Reverted back to the original scheduled faculty for that period.');
}

// =========================
// STAFF LEAVE & REAL-TIME COVERAGE REQUESTS
// =========================
function loadCoverageRequests() {
    try {
        const saved = localStorage.getItem(COVERAGE_REQUESTS_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (error) {
        console.error('Unable to load coverage requests:', error);
        return {};
    }
}

function saveCoverageRequests() {
    localStorage.setItem(COVERAGE_REQUESTS_KEY, JSON.stringify(coverageRequests));
}

// Scan every section's schedule for today and find every period this staff member teaches.
// Checks both the backend-loaded timetable (window.currentTimetableEntries) and the local static timetableData.
function findTodaysPeriodsForStaff(staffName) {
    const todayName = getTodayDayName();
    const results = [];
    const seen = new Set(); // Avoid duplicates

    // Primary: search the real backend-loaded timetable entries
    if (window.currentTimetableEntries && window.currentTimetableEntries.length > 0) {
        window.currentTimetableEntries.forEach(entry => {
            if (!entry.teacherName || !entry.teacherName.includes(staffName)) return;
            const entryDay = entry.day;
            if (entryDay !== todayName) return;
            const pIdx = (entry.slotNumber || 1) - 1;
            const section = entry.sectionName || currentSection || entry.section || '';
            const key = `${section}_${pIdx}`;
            if (seen.has(key)) return;
            seen.add(key);
            results.push({
                section,
                day: todayName,
                pIdx,
                subject: entry.subjectName || entry.subjectCode || '',
                venue: entry.roomNumber || entry.labName || ''
            });
        });
    }

    // Fallback / supplement: search local static timetableData
    Object.keys(timetableData).forEach(section => {
        const dayData = timetableData[section] && timetableData[section][todayName];
        if (!dayData) return;
        dayData.forEach((p, pIdx) => {
            if (p && p.faculty && p.faculty.includes(staffName)) {
                const key = `${section}_${pIdx}`;
                if (seen.has(key)) return;
                seen.add(key);
                results.push({ section, day: todayName, pIdx, subject: p.sub, venue: p.venue });
            }
        });
    });
    return results;
}

function getMyStaffIdentity() {
    const username = localStorage.getItem('sece_logged_in_user');
    if (!username) return null;
    return localStorage.getItem('sece_staff_identity_' + username.toLowerCase()) || null;
}

function setMyStaffIdentity(name) {
    const username = localStorage.getItem('sece_logged_in_user');
    if (!username) return;
    localStorage.setItem('sece_staff_identity_' + username.toLowerCase(), name);
}

function populateStaffIdentityDropdown() {
    const select = document.getElementById('myStaffIdentitySelect');
    if (!select) return;
    const saved = getMyStaffIdentity();
    select.innerHTML = '<option value="">-- Select your name --</option>' +
        staffDirectory.map(s => `<option value="${s.name}" ${s.name === saved ? 'selected' : ''}>${s.name} (${s.dept})</option>`).join('');
}

function onStaffIdentityChange() {
    const select = document.getElementById('myStaffIdentitySelect');
    if (select.value) setMyStaffIdentity(select.value);
    updateLeaveButtonState();
}

async function markStaffOnLeave(name, reason) {
    const staffIdx = staffDirectory.findIndex(s => s.name === name);
    if (staffIdx > -1) staffDirectory[staffIdx].status = 'Unavailable';
    saveStaffDirectory();

    const dateStr = todayDateStr();
    const dayKey = 'sece_staff_availability_' + dateStr;
    const daily = JSON.parse(localStorage.getItem(dayKey) || '{}');
    daily[name] = false;
    localStorage.setItem(dayKey, JSON.stringify(daily));

    localStorage.setItem(leaveStateKey(name), 'true');

    const periods = findTodaysPeriodsForStaff(name);
    periods.forEach(p => {
        const key = substitutionKey(dateStr, p.section, p.day, p.pIdx);
        if (!coverageRequests[key] || coverageRequests[key].date !== dateStr) {
            coverageRequests[key] = {
                date: dateStr, section: p.section, day: p.day, pIdx: p.pIdx,
                subject: p.subject, venue: p.venue,
                absentStaff: name, reason: reason,
                status: 'OPEN', requestedBy: null,
                createdAt: new Date().toISOString()
            };
        }
    });
    saveCoverageRequests();

    // Save leave notifications to backend API (shared across all users)
    await Promise.all(periods.map(p => savePeriodNotificationToAPI({
        date: dateStr,
        day: p.day,
        period: p.pIdx + 1,
        section: p.section,
        originalFaculty: name,
        staff: 'Ã¢â‚¬â€ (Coverage Needed)',
        subject: reason + ' Ã¢â‚¬â€ Period open for substitution.',
        reason: reason + ' Ã¢â‚¬â€ Period open for substitution.',
        source: 'leave'
    })));

    renderStaffAvailability();
    populateSubstituteFacultyOptions();
    renderCoverageRequests();
    updateLeaveButtonState();

    showToast('Marked as On Leave',
        periods.length
            ? `${name} is on leave today. ${periods.length} period(s) flagged for coverage Ã¢â‚¬â€ other staff have been notified.`
            : `${name} is marked on leave today (no periods scheduled).`
    );
}

async function cancelStaffLeave(name) {
    const dateStr = todayDateStr();

    localStorage.removeItem(leaveStateKey(name));

    const dayKey = 'sece_staff_availability_' + dateStr;
    const daily = JSON.parse(localStorage.getItem(dayKey) || '{}');
    delete daily[name];
    localStorage.setItem(dayKey, JSON.stringify(daily));

    const staffIdx = staffDirectory.findIndex(s => s.name === name);
    if (staffIdx > -1) staffDirectory[staffIdx].status = 'Available';
    saveStaffDirectory();

    let removedCount = 0;
    Object.keys(coverageRequests).forEach(key => {
        const req = coverageRequests[key];
        if (req.absentStaff === name && req.date === dateStr && req.status === 'OPEN') {
            delete coverageRequests[key];
            removedCount++;
        }
    });
    saveCoverageRequests();

    // Force refresh from API to guarantee we have the IDs
    await fetchPeriodNotificationsFromAPI();
    const notifArr = purgeExpiredPeriodNotifications();
    // Find matching notifications and delete them from the backend API
    const toDelete = notifArr.filter(n => (n.source === 'leave' && n.originalFaculty === name && n.date === dateStr));
    await Promise.all(toDelete.map(n => {
        if (n._id) return deletePeriodNotificationFromAPI(n);
        return Promise.resolve();
    }));

    const cleaned = purgeExpiredPeriodNotifications(); // Re-purge after delete updates cache
    savePeriodNotifications(cleaned);

    renderStaffAvailability();
    populateSubstituteFacultyOptions();
    renderCoverageRequests();
    updateLeaveButtonState();

    showToast('Leave Cancelled',
        removedCount > 0
            ? `${name}'s leave has been cancelled. ${removedCount} open coverage request(s) removed.`
            : `${name}'s leave has been cancelled.`
    );
}

window.markMyselfOnLeave = async function () {
    if (!canManageSubstitutions()) {
        alert('Only Faculty and Admin can mark themselves on leave.');
        return;
    }
    const name = document.getElementById('myStaffIdentitySelect').value;
    if (!name) {
        alert('Please select which staff member you are first.');
        return;
    }
    setMyStaffIdentity(name);
    const reason = document.getElementById('leaveReasonInput').value || 'On Leave';
    await markStaffOnLeave(name, reason);
    document.getElementById('leaveReasonInput').value = '';
}

window.cancelMyLeave = async function () {
    if (!canManageSubstitutions()) {
        alert('Only Faculty and Admin can cancel their leave.');
        return;
    }
    const name = getMyStaffIdentity() || document.getElementById('myStaffIdentitySelect')?.value;
    if (!name) {
        alert('No staff identity found. Please select your name first.');
        return;
    }
    await cancelStaffLeave(name);
}

// Dynamically updates the leave action button group
function updateLeaveButtonState() {
    const container = document.getElementById('leaveActionBtnGroup');
    if (!container) return;
    const name = getMyStaffIdentity() || document.getElementById('myStaffIdentitySelect')?.value;
    if (!name || !isStaffOnLeaveToday(name)) {
        container.innerHTML = `
            <button type="button" class="btn btn-sm btn-danger fw-bold"
                    onclick="window.markMyselfOnLeave()" id="markLeaveBtn">
                <i class="fa-solid fa-house-medical me-1"></i> I'm on Leave Today
            </button>`;
    } else {
        container.innerHTML = `
            <span class="badge bg-danger me-2 align-self-center px-3 py-2">
                <i class="fa-solid fa-house-medical me-1"></i> On Leave Today
            </span>
            <button type="button" class="btn btn-sm btn-warning fw-bold"
                    onclick="window.cancelMyLeave()" id="cancelLeaveBtn">
                <i class="fa-solid fa-rotate-left me-1"></i> Cancel My Leave
            </button>`;
    }
}

function requestToCover(key) {
    if (!canManageSubstitutions()) {
        alert('Only Faculty and Admin can request to cover a period.');
        return;
    }
    const myName = getMyStaffIdentity();
    if (!myName) {
        alert('Please select which staff member you are first, at the top of this tab.');
        return;
    }
    const req = coverageRequests[key];
    if (!req) return;
    if (req.absentStaff === myName) {
        alert('You cannot request to cover your own period.');
        return;
    }
    if (req.status !== 'OPEN') {
        alert('This period is no longer open for requests.');
        return;
    }
    req.status = 'REQUESTED';
    req.requestedBy = myName;
    req.requestedAt = new Date().toISOString();
    saveCoverageRequests();
    renderCoverageRequests();
    showToast('Request Sent', `Your request to cover ${req.subject} (Period ${req.pIdx + 1}, ${req.section}) was sent to ${req.absentStaff}. Waiting for their confirmation.`);
}

function respondToCoverageRequest(key, accept) {
    const req = coverageRequests[key];
    if (!req) return;
    const myName = getMyStaffIdentity();
    const isAdmin = currentUserRole === 'ADMIN';
    if (!isAdmin && myName !== req.absentStaff) {
        alert('Only the absent staff member (or Admin) can accept or decline this request.');
        return;
    }

    if (accept) {
        req.status = 'ACCEPTED';
        req.decidedAt = new Date().toISOString();

        const subKey = substitutionKey(req.date, req.section, req.day, req.pIdx);
        substitutions[subKey] = {
            date: req.date, section: req.section, day: req.day, pIdx: req.pIdx,
            originalFaculty: req.absentStaff, substituteFaculty: req.requestedBy,
            reason: req.reason,
            assignedBy: localStorage.getItem('sece_logged_in_user') || currentUserRole,
            assignedAt: new Date().toISOString()
        };
        saveSubstitutions();

        // Add substitution to period notifications so it displays in the Day/Period Notifications modal
        const notifArr = purgeExpiredPeriodNotifications();
        notifArr.push({
            date: req.date,
            day: req.day,
            period: parseInt(req.pIdx) + 1,
            section: req.section,
            originalFaculty: req.absentStaff,
            staff: req.requestedBy,
            subject: req.subject,
            venue: req.venue,
            reason: `Substitution accepted`,
            source: 'auto'
        });
        savePeriodNotifications(notifArr);

        showToast('Coverage Accepted', `${req.requestedBy} will cover ${req.subject} (Period ${req.pIdx + 1}) today.`);
    } else {
        req.status = 'OPEN';
        req.requestedBy = null;
        req.declinedAt = new Date().toISOString();
        showToast('Coverage Declined', 'Request declined. The period is open for other staff to request again.');
    }
    saveCoverageRequests();
    renderCoverageRequests();
    renderTimetableGrid();
    renderTodaysSubstitutions();
}

function renderCoverageRequests() {
    const list = document.getElementById('coverageRequestsList');
    if (!list) return;
    const dateStr = todayDateStr();
    const myName = getMyStaffIdentity();
    const todays = Object.entries(coverageRequests).filter(([key, r]) => r.date === dateStr);

    if (todays.length === 0) {
        list.innerHTML = '<li class="list-group-item bg-dark text-muted small">No leave or coverage activity today.</li>';
        return;
    }

    list.innerHTML = todays.map(([key, r]) => {
        const isMyLeave = r.absentStaff === myName;
        const isAdmin = currentUserRole === 'ADMIN';
        let actions = '';
        if (r.status === 'OPEN' && !isMyLeave) {
            actions = `<button class="btn btn-sm btn-outline-success py-0" onclick="requestToCover('${key}')">Request to Cover</button>`;
        } else if (r.status === 'REQUESTED' && (isMyLeave || isAdmin)) {
            actions = `<button class="btn btn-sm btn-success py-0 me-1" onclick="respondToCoverageRequest('${key}', true)">Accept</button>
                       <button class="btn btn-sm btn-outline-danger py-0" onclick="respondToCoverageRequest('${key}', false)">Decline</button>`;
        }
        // Show Cancel Leave inline for the absent faculty's own OPEN entries
        const cancelBtn = (isMyLeave && r.status === 'OPEN')
            ? `<button class="btn btn-sm btn-warning py-0 mt-1" onclick="window.cancelMyLeave()">
                   <i class="fa-solid fa-rotate-left me-1"></i>Cancel Leave
               </button>`
            : '';
        const statusBadge = {
            OPEN: '<span class="badge bg-warning text-dark">Open</span>',
            REQUESTED: `<span class="badge bg-info text-dark">Requested by ${r.requestedBy}</span>`,
            ACCEPTED: `<span class="badge bg-success">Covered by ${r.requestedBy}</span>`
        }[r.status] || '';
        const rowHighlight = isMyLeave ? 'border-start border-3 border-warning' : '';
        return `<li class="list-group-item bg-dark text-white small ${rowHighlight}">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                    ${isMyLeave ? '<span class="badge bg-warning text-dark me-1">You</span>' : ''}
                    <strong>${r.absentStaff}</strong> is on leave Ã¢â‚¬â€ Period ${r.pIdx + 1} (${r.subject}), ${r.section}, ${r.venue}.
                    ${r.reason ? '<br><span class="text-muted">Reason: ' + r.reason + '</span>' : ''}
                </div>
                <div class="text-end">${statusBadge}<br>${actions}${cancelBtn}</div>
            </div>
        </li>`;
    }).join('');
}

// Real-time updates across browser tabs of the same origin: the 'storage' event
// fires automatically in every OTHER open tab whenever localStorage changes here.
window.addEventListener('storage', (e) => {
    if (!currentUserRole) return;

    if (e.key === COVERAGE_REQUESTS_KEY) {
        const oldData = coverageRequests;
        const newData = loadCoverageRequests();
        const myName = getMyStaffIdentity();

        Object.keys(newData).forEach(key => {
            const oldReq = oldData[key];
            const newReq = newData[key];
            if (!oldReq && newReq && newReq.status === 'OPEN') {
                showToast('Staff Leave Alert', `${newReq.absentStaff} is on leave today Ã¢â‚¬â€ Period ${newReq.pIdx + 1} (${newReq.subject}), ${newReq.section} needs coverage.`);
            } else if (oldReq && newReq && oldReq.status !== newReq.status) {
                if (newReq.status === 'REQUESTED' && newReq.absentStaff === myName) {
                    showToast('Coverage Request Received', `${newReq.requestedBy} wants to cover your Period ${newReq.pIdx + 1} (${newReq.subject}) today. Please accept or decline.`);
                } else if (newReq.status === 'ACCEPTED' && newReq.requestedBy === myName) {
                    showToast('Request Accepted!', `You're confirmed to cover Period ${newReq.pIdx + 1} (${newReq.subject}), ${newReq.section} today.`);
                } else if (newReq.status === 'OPEN' && oldReq.status === 'REQUESTED' && oldReq.requestedBy === myName) {
                    showToast('Request Declined', `Your request to cover Period ${newReq.pIdx + 1} was declined.`);
                }
            }
        });

        coverageRequests = newData;
        renderCoverageRequests();
    }

    if (e.key === STAFF_STORAGE_KEY) {
        staffDirectory = loadStaffDirectory();
        renderStaffAvailability();
        populateSubstituteFacultyOptions();
        populateStaffIdentityDropdown();
    }

    if (e.key === SUBSTITUTION_STORAGE_KEY) {
        substitutions = loadSubstitutions();
        renderTimetableGrid();
        renderTodaysSubstitutions();
    }
});

function initSubstitutionModal() {
    renderStaffAvailability();
    populateSubstituteFacultyOptions();
    populateSubPeriodOptions();
    renderTodaysSubstitutions();
    populateStaffIdentityDropdown();
    renderCoverageRequests();
    updateLeaveButtonState();
}

function renderAdminLeaveNotifications() {
    const list = document.getElementById('adminAbsentNotifList');
    if (!list) return;

    const dateStr = todayDateStr();

    const todaysLeaves = {};
    Object.values(coverageRequests).forEach(req => {
        if (req.date === dateStr && req.absentStaff) {
            if (!todaysLeaves[req.absentStaff]) todaysLeaves[req.absentStaff] = [];
            todaysLeaves[req.absentStaff].push(req);
        }
    });

    const staffNames = Object.keys(todaysLeaves);
    if (staffNames.length === 0) {
        list.innerHTML = '<div class="alert alert-success small py-2 mb-0"><i class="fa-solid fa-check-circle me-1"></i> No faculty members are reported absent today.</div>';
        return;
    }

    let html = '<ul class="list-group list-group-flush">';
    staffNames.forEach(staff => {
        const periods = todaysLeaves[staff].map(r => `Period ${parseInt(r.pIdx) + 1} (${r.section})`).join(', ');
        html += `<li class="list-group-item bg-dark text-white border-secondary">
            <strong class="text-danger"><i class="fa-solid fa-user-xmark me-2"></i> ${staff}</strong><br>
            <small class="text-muted">Absent for: ${periods}</small>
        </li>`;
    });
    html += '</ul>';
    list.innerHTML = html;
}

function renderTimetableGrid() {
    const tbody = document.getElementById('ttGridBody');
    tbody.innerHTML = '';

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let data = {};
    if (window.currentTimetableEntries && window.currentTimetableEntries.length > 0) {
        days.forEach(day => {
            data[day] = Array(7).fill({ sub: 'FREE', code: '-', faculty: '-', venue: '-', cat: 'cat-theory' });
        });
        
        let filteredEntries = window.currentTimetableEntries;
        if (typeof currentSection !== 'undefined' && currentSection) {
            let q1 = currentSection.toUpperCase();
            let q2 = currentSection.replace('_', ' ').toUpperCase();
            filteredEntries = filteredEntries.filter(e => {
                if (!e.sectionName) return false;
                let sName = e.sectionName.toUpperCase();
                return sName.includes(q1) || sName.includes(q2) || sName === q1 || sName === q2;
            });
        }
        
        filteredEntries.forEach(entry => {
            let day = entry.day;
            let pIdx = entry.slotNumber - 1;
            if (pIdx >= 0 && pIdx < 7 && data[day]) {
                data[day][pIdx] = {
                    sub: entry.subjectName || entry.subjectCode,
                    code: entry.subjectCode,
                    faculty: entry.teacherName,
                    venue: entry.roomNumber || entry.labName || 'TBA',
                    cat: entry.subjectType === 'LAB' || entry.subjectType === 'PROJECT' ? 'cat-lab' : 'cat-theory'
                };
            }
        });
    } else {
        data = timetableData[currentSection];
        if (!data) {
            data = {};
            days.forEach(day => {
                data[day] = Array(7).fill({ sub: 'FREE', code: '-', faculty: '-', venue: '-', cat: 'cat-theory' });
            });
        }
    }

    days.forEach(day => {
        const tr = document.createElement('tr');

        // Day header cell
        const dayTd = document.createElement('td');
        dayTd.className = 'fw-bold bg-dark text-info text-center align-middle';
        dayTd.style.fontSize = '0.8rem';
        dayTd.innerHTML = `${day}`;
        tr.appendChild(dayTd);

        const periods = data[day] || Array(7).fill({ sub: 'FREE', code: '-', faculty: '-', venue: '-', cat: 'cat-theory' });

        // Period 1
        tr.appendChild(createCell(day, 0, periods[0]));
        // Period 2
        tr.appendChild(createCell(day, 1, periods[1]));

        // Tea Break Cell
        if (day === 'Monday') {
            const teaTd = document.createElement('td');
            teaTd.className = 'tt-break-cell align-middle';
            teaTd.rowSpan = 6;
            teaTd.innerHTML = 'T<br/>E<br/>A<br/><br/>B<br/>R<br/>E<br/>A<br/>K<br/><div style="font-size:0.55rem; line-height: 1.1; margin-top: 10px;">10.40<br/>-<br/>11.00</div>';
            tr.appendChild(teaTd);
        }

        // Period 3
        tr.appendChild(createCell(day, 2, periods[2]));
        // Period 4
        tr.appendChild(createCell(day, 3, periods[3]));

        // Lunch Break Cell
        if (day === 'Monday') {
            const lunchTd = document.createElement('td');
            lunchTd.className = 'tt-break-cell align-middle';
            lunchTd.rowSpan = 6;
            lunchTd.innerHTML = 'L<br/>U<br/>N<br/>C<br/>H<br/><br/>B<br/>R<br/>E<br/>A<br/>K<br/><div style="font-size:0.55rem; line-height: 1.1; margin-top: 10px;">01.00<br/>-<br/>01.40</div>';
            tr.appendChild(lunchTd);
        }

        // Period 5
        tr.appendChild(createCell(day, 4, periods[4]));
        
        // Activity Hour (Empty/Placeholder to fix column shift)
        const actTd = document.createElement('td');
        actTd.className = 'align-middle cat-theory';
        actTd.innerHTML = '<div class="text-secondary" style="font-size:0.7rem">-</div>';
        tr.appendChild(actTd);
        
        // Period 6
        tr.appendChild(createCell(day, 5, periods[5]));
        // Period 7
        tr.appendChild(createCell(day, 6, periods[6]));

        tbody.appendChild(tr);
    });

    updateStudentDashboardPeriod();
}

// Student Dashboard Ongoing Period Logic
function updateStudentDashboardPeriod() {
    if (typeof currentUserRole !== 'undefined' && currentUserRole !== 'STUDENT') {
        const studentAlert = document.getElementById('studentUpcomingClassAlert');
        if (studentAlert) studentAlert.classList.add('d-none');
        return;
    }

    const studentAlert = document.getElementById('studentUpcomingClassAlert');
    const studentTitle = document.getElementById('studentUpcomingClassTitle');
    const studentText = document.getElementById('studentUpcomingClassText');
    
    if (!studentAlert || !studentTitle || !studentText) return;

    if (!window.currentTimetableEntries || window.currentTimetableEntries.length === 0) {
        studentAlert.classList.add('d-none');
        return;
    }

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
    const h = now.getHours();
    const m = now.getMinutes();
    const time = h + m / 60.0;

    const timeSlots = [
        { idx: 1, start: 8.66, end: 9.66, label: "08:40 AM - 09:40 AM" }, // Period 1
        { idx: 2, start: 9.66, end: 10.66, label: "09:40 AM - 10:40 AM" }, // Period 2
        { idx: 3, start: 11.00, end: 12.00, label: "11:00 AM - 12:00 PM" }, // Period 3
        { idx: 4, start: 12.00, end: 13.00, label: "12:00 PM - 01:00 PM" }, // Period 4
        { idx: 5, start: 13.66, end: 14.50, label: "01:40 PM - 02:30 PM" }, // Period 5
        { idx: 6, start: 14.50, end: 15.33, label: "02:30 PM - 03:20 PM" }, // Period 6
        { idx: 7, start: 15.33, end: 16.16, label: "03:20 PM - 04:10 PM" }  // Period 7
    ];

    const todaysEntries = window.currentTimetableEntries.filter(e => e.day === todayStr);
    
    let activeEntry = null;
    let matchingSlot = null;
    let isOngoing = false;

    // First, check if there is a class going on RIGHT NOW
    for (let slot of timeSlots) {
        if (time >= slot.start && time < slot.end) {
            const entry = todaysEntries.find(e => parseInt(e.periodIndex) === slot.idx);
            if (entry) {
                activeEntry = entry;
                matchingSlot = slot;
                isOngoing = true;
                break;
            }
        }
    }

    // If no class is ongoing right now, find the NEXT upcoming class for today
    if (!activeEntry) {
        for (let slot of timeSlots) {
            if (slot.start > time) {
                const entry = todaysEntries.find(e => parseInt(e.periodIndex) === slot.idx);
                if (entry) {
                    activeEntry = entry;
                    matchingSlot = slot;
                    break;
                }
            }
        }
    }

    if (activeEntry && matchingSlot) {
        studentAlert.classList.remove('d-none');
        studentAlert.classList.add('d-flex');
        
        studentTitle.innerText = isOngoing ? "Currently Ongoing Period" : "Next Upcoming Class";
        if (isOngoing) {
            studentAlert.style.borderLeft = "4px solid #198754";
            studentAlert.className = "alert alert-success mb-3 align-items-center shadow-sm d-flex";
            studentAlert.querySelector('i').className = "fa-solid fa-clock fa-spin fa-2x me-3 text-success";
        } else {
            studentAlert.style.borderLeft = "4px solid #0dcaf0";
            studentAlert.className = "alert alert-info mb-3 align-items-center shadow-sm d-flex";
            studentAlert.querySelector('i').className = "fa-solid fa-clock fa-2x me-3 text-info";
        }

        const subName = activeEntry.subjectName || 'Unknown Subject';
        const teacher = activeEntry.teacherName || 'Unknown Faculty';
        const room = activeEntry.classroomNumber || activeEntry.laboratoryName || 'Unknown Venue';
        
        studentText.innerHTML = `<strong>${subName}</strong> &bull; ${matchingSlot.label}<br/><span class="text-muted small">Faculty: ${teacher} | Venue: ${room}</span>`;
    } else {
        studentAlert.classList.remove('d-none');
        studentAlert.classList.add('d-flex');
        studentTitle.innerText = "No More Classes";
        studentAlert.style.borderLeft = "4px solid #6c757d";
        studentAlert.className = "alert alert-secondary mb-3 align-items-center shadow-sm d-flex";
        studentAlert.querySelector('i').className = "fa-solid fa-mug-hot fa-2x me-3 text-secondary";
        
        if (todaysEntries.length === 0) {
            studentText.innerHTML = `You have no classes scheduled for today (${todayStr}). Enjoy your day!`;
        } else {
            studentText.innerHTML = `You have finished all your scheduled classes for today.`;
        }
    }
}

// Call on load and every minute
setInterval(updateStudentDashboardPeriod, 60000);
window.addEventListener('load', () => setTimeout(updateStudentDashboardPeriod, 1000));


// Helper to Create Period Cell
function createCell(day, pIdx, pData) {
    const td = document.createElement('td');
    const isEditable = (currentUserRole === 'ADMIN' || currentUserRole === 'FACULTY');
    const sub = getSubstitutionFor(currentSection, day, pIdx);

    td.className = `${pData.cat || 'cat-theory'} ${isEditable ? 'editable-cell' : ''} ${sub ? 'substituted-cell' : ''} position-relative`;

    if (sub && currentUserRole !== 'STUDENT') {
        td.innerHTML = `
            <span class="slot-badge">${pData.sub}</span>
            <span class="slot-subtext">${sub.substituteFaculty}</span>
            <span class="slot-venue">${pData.venue}</span>
            <span class="substituted-badge">Substitute Ã¢â‚¬â€ Today Only</span>
            ${isEditable ? '<button class="btn btn-outline-warning btn-sm mt-2 py-0 px-2" style="font-size: 0.75rem; border-radius: 4px;" onclick="openEditPeriodModal(\'' + day + '\', ' + pIdx + ', ' + JSON.stringify(pData).replace(/"/g, '&quot;') + ')"><i class="fa-solid fa-pen-to-square me-1"></i>Edit</button>' : ''}
        `;
    } else {
        td.innerHTML = `
            <span class="slot-badge">${pData.sub}</span>
            <span class="slot-subtext">${pData.faculty}</span>
            <span class="slot-venue">${pData.venue}</span>
            ${isEditable ? '<button class="btn btn-outline-warning btn-sm mt-2 py-0 px-2" style="font-size: 0.75rem; border-radius: 4px;" onclick="openEditPeriodModal(\'' + day + '\', ' + pIdx + ', ' + JSON.stringify(pData).replace(/"/g, '&quot;') + ')"><i class="fa-solid fa-pen-to-square me-1"></i>Edit</button>' : ''}
        `;
    }

    if (isEditable) {
        // Editing still targets the original recurring slot, not today's one-off substitute
        td.onclick = () => openEditPeriodModal(day, pIdx, pData);
    }

    return td;
}

// Admin-only: clear all saved timetable edits and go back to the original default schedule
function resetTimetableEdits() {
    if (currentUserRole !== 'ADMIN') {
        alert('Only Admin can reset the timetable to defaults.');
        return;
    }
    if (!confirm('This will permanently discard all saved period edits (for every section) and restore the original default schedule. Continue?')) return;
    localStorage.removeItem(TIMETABLE_STORAGE_KEY);
    timetableData = loadSavedTimetable();
    renderTimetableGrid();
    showToast('Timetable Reset', 'All saved edits cleared. Showing the original default schedule.');
}

// Render Course Reference Table
function renderCourseRefTable() {
    const tbody = document.getElementById('courseRefBody');
    tbody.innerHTML = '';

    courseReferenceList.forEach(item => {
        const tr = document.createElement('tr');
        if (item.short === 'ALT') tr.className = 'table-warning text-dark font-semibold';

        tr.innerHTML = `
            <td><strong class="text-info">${item.short}</strong></td>
            <td>${item.code}</td>
            <td>${item.faculty}</td>
            <td><span class="badge bg-secondary">${item.venue}</span></td>
            <td>${item.cat}</td>
            <td>${item.credits}</td>
            <td>${item.hrs}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Role Switcher Handler
function switchRole(role, silent = false) {
    if (!currentUserRole && !silent) return;
    if (!silent && role !== currentUserRole) {
        showToast('Access Denied', 'Please log out and sign in with the required account type.');
        return;
    }
    currentUserRole = role;
    document.body.classList.toggle('student-view', role === 'STUDENT');
    const crLabel = document.getElementById('currentRoleLabel'); if (crLabel) crLabel.innerText = `Role: ${role}`;

    const bannerText = document.getElementById('roleBannerText');
    if (bannerText) {
        if (role === 'ADMIN') {
            bannerText.innerHTML = `Logged in as <strong>ADMIN</strong>. Full permission enabled: Edit periods and manage subjects/classes/venues.`;
        } else if (role === 'FACULTY') {
            bannerText.innerHTML = `Logged in as <strong>FACULTY</strong>. You have period editing privileges and Class Advisor access where assigned.`;
        } else {
            bannerText.innerHTML = `Logged in as <strong>STUDENT</strong>. View mode active. Your email and full contact numbers are hidden from student view.`;
        }
    }

    const classInfoBlock = document.getElementById('classInfoBlock');
    if (classInfoBlock) {
        if (role === 'STUDENT') {
            classInfoBlock.classList.add('d-none');
            classInfoBlock.classList.remove('d-flex');
        } else {
            classInfoBlock.classList.remove('d-none');
            classInfoBlock.classList.add('d-flex');
        }
    }

    const roleBanner = document.getElementById('roleBanner');
    if (roleBanner) {
        if (role === 'ADMIN') {
            roleBanner.classList.add('d-none');
        } else {
            roleBanner.classList.remove('d-none');
        }
    }

    const roleBannerTextContainer = document.getElementById('roleBannerTextContainer');
    if (roleBannerTextContainer) {
        if (role === 'STUDENT') {
            roleBannerTextContainer.classList.add('d-none');
        } else {
            roleBannerTextContainer.classList.remove('d-none');
        }
    }

    const batchInfoCard = document.getElementById('batchInfoCard');
    const batchInfoCardBody = document.getElementById('batchInfoCardBody');
    if (batchInfoCard && batchInfoCardBody) {
        if (role === 'STUDENT') {
            batchInfoCard.classList.remove('card', 'shadow', 'border-secondary', 'bg-dark');
            batchInfoCardBody.classList.remove('card-body', 'p-3');
            batchInfoCardBody.classList.add('d-flex', 'flex-row', 'gap-4', 'align-items-center');
            batchInfoCardBody.style.fontSize = '1.1rem';
            Array.from(batchInfoCardBody.children).forEach(child => {
                child.classList.remove('justify-content-between', 'mb-2');
                child.classList.add('gap-2');
            });
        } else {
            batchInfoCard.classList.add('card', 'shadow', 'border-secondary', 'bg-dark');
            batchInfoCardBody.classList.add('card-body', 'p-3');
            batchInfoCardBody.classList.remove('d-flex', 'flex-row', 'gap-4', 'align-items-center');
            batchInfoCardBody.style.fontSize = '0.9rem';
            Array.from(batchInfoCardBody.children).forEach((child, index) => {
                child.classList.add('justify-content-between');
                child.classList.remove('gap-2');
                if (index < 2) child.classList.add('mb-2'); // Add mb-2 to first two
            });
        }
    }

    // Role-specific visibility logic according to implementation plan

    // 1. Account Settings -> hide entirely
    const accBtn = document.getElementById('accountSettingsBtn');
    if (accBtn) accBtn.style.display = 'none';

    // 2. Student Profile (My Student Detail) -> visible only for STUDENT
    const profileBtn = document.getElementById('studentProfileBtn');
    if (profileBtn) {
        if (role === 'STUDENT') {
            profileBtn.classList.remove('d-none');
            profileBtn.classList.add('d-flex');
        } else {
            profileBtn.classList.add('d-none');
            profileBtn.classList.remove('d-flex');
        }
    }

    // Manage Sections -> Visible only to ADMIN
    const manageSectionsBtn = document.getElementById('manageSectionsBtn');
    if (manageSectionsBtn) {
        if (role === 'ADMIN') {
            manageSectionsBtn.classList.remove('d-none');
            manageSectionsBtn.classList.add('d-flex');
        } else {
            manageSectionsBtn.classList.add('d-none');
            manageSectionsBtn.classList.remove('d-flex');
        }
    }

    // Additional: Period Notifications (Visible to ALL roles now)
    const studentDayNotificationBtn = document.getElementById('studentDayNotificationBtn');
    if (studentDayNotificationBtn) {
        studentDayNotificationBtn.classList.remove('d-none');
        studentDayNotificationBtn.classList.add('d-flex');
    }

    // 3. Register Notifications Modal options
    const notifBellBtn = document.getElementById('notifBellBtn');
    if (notifBellBtn) {
        if (role === 'ADMIN') {
            notifBellBtn.classList.add('d-none');
            notifBellBtn.classList.remove('d-flex');
        } else {
            notifBellBtn.classList.remove('d-none');
            notifBellBtn.classList.add('d-flex');
        }
    }

    const deptFilterWrapper = document.getElementById('deptFilterWrapper');
    const secFilterWrapper = document.getElementById('secFilterWrapper');
    const ttPopupOverlayWrapper = document.getElementById('ttPopupOverlayWrapper');
    const adminControlPanelContainer = document.getElementById('adminControlPanelContainer');
    const referenceTableArea = document.getElementById('referenceTableArea');
    const studentFacultyAvailabilityArea = document.getElementById('studentFacultyAvailabilityArea');
    const adminTTPlaceholder = document.getElementById('adminTTPlaceholder');

    // Admin Control Panel
    if (adminControlPanelContainer) {
        if (role === 'ADMIN') {
            adminControlPanelContainer.style.display = 'block';
        } else {
            adminControlPanelContainer.style.display = 'none';
        }
    }

    // Timetable & Related Tables Visibility
    if (role === 'ADMIN') {
        if (ttPopupOverlayWrapper) ttPopupOverlayWrapper.classList.add('d-none');
        if (referenceTableArea) referenceTableArea.classList.add('d-none');
        if (studentFacultyAvailabilityArea) studentFacultyAvailabilityArea.classList.add('d-none');
        if (adminTTPlaceholder) adminTTPlaceholder.classList.add('d-none'); // Hide the placeholder too
    } else if (role === 'FACULTY') {
        if (ttPopupOverlayWrapper) ttPopupOverlayWrapper.classList.remove('d-none');
        if (referenceTableArea) referenceTableArea.classList.remove('d-none');
        if (studentFacultyAvailabilityArea) studentFacultyAvailabilityArea.classList.add('d-none');
        if (adminTTPlaceholder) adminTTPlaceholder.classList.add('d-none');
    } else { // STUDENT
        if (ttPopupOverlayWrapper) ttPopupOverlayWrapper.classList.remove('d-none');
        if (referenceTableArea) referenceTableArea.classList.add('d-none');
        if (studentFacultyAvailabilityArea) studentFacultyAvailabilityArea.classList.remove('d-none');
        if (adminTTPlaceholder) adminTTPlaceholder.classList.add('d-none');
    }

    // Filters Visibility
    if (deptFilterWrapper && secFilterWrapper) {
        if (role === 'STUDENT') {
            deptFilterWrapper.classList.add('d-none');
            secFilterWrapper.classList.add('d-none');
        } else {
            deptFilterWrapper.classList.remove('d-none');
            secFilterWrapper.classList.remove('d-none');
        }
    }

    const facultyAdminNotificationsBtn = document.getElementById('facultyAdminNotificationsBtn');
    if (facultyAdminNotificationsBtn) {
        facultyAdminNotificationsBtn.style.setProperty('display', (role === 'ADMIN' || role === 'FACULTY') ? 'inline-flex' : 'none', 'important');
    }

    const studentEmailLabel = document.getElementById('studentEmailLabel');
    if (studentEmailLabel) {
        if (role === 'FACULTY') {
            studentEmailLabel.innerHTML = '<i class="fa-solid fa-envelope text-info me-1"></i> Faculty college email id';
        } else {
            studentEmailLabel.innerHTML = '<i class="fa-solid fa-envelope text-info me-1"></i> Student Email ID';
        }
    }

    // Hide all legacy 'Add New Student' buttons everywhere for ALL roles since we have the new dedicated button
    const addStudentBtns = document.querySelectorAll('button[onClick="window.openAddStudentFromDetails()"]');
    addStudentBtns.forEach(btn => btn.style.display = 'none');

    // Remove "Wednesday Placement ALT Class Reminder" for STUDENT, FACULTY
    const prefWed = document.getElementById('prefWedContainer');
    if (prefWed) prefWed.style.display = (role === 'STUDENT' || role === 'FACULTY') ? 'none' : 'block';

    // Remove "Timetable / Period Substitution SMS Alert" for FACULTY
    const prefTimetable = document.getElementById('prefTimetableContainer');
    if (prefTimetable) prefTimetable.style.display = (role === 'FACULTY') ? 'none' : 'block';

    // My Leave & Coverage Requests -> hide for ADMIN
    const myLeaveTabLi = document.getElementById('myLeaveTabLi');
    if (myLeaveTabLi) {
        if (role === 'ADMIN') {
            myLeaveTabLi.classList.add('d-none');
        } else {
            myLeaveTabLi.classList.remove('d-none');
        }
    }

    // Faculty Email Directory in Manage Sections -> remove for FACULTY
    const facEmailDir = document.getElementById('facultyEmailDirectory');
    if (facEmailDir) facEmailDir.style.display = role === 'FACULTY' ? 'none' : 'block';

    // New Feature: "Manage Students / Add Students"
    const manageStudentsBtn = document.getElementById('manageStudentsBtn');
    if (manageStudentsBtn) {
        if (role === 'ADMIN') {
            manageStudentsBtn.classList.remove('d-none');
            manageStudentsBtn.classList.add('d-flex');
        } else {
            manageStudentsBtn.classList.add('d-none');
            manageStudentsBtn.classList.remove('d-flex');
        }
    }

    // Removed old Enrolled Students Roster hiding logic since modals are now separated

    const manageFacultyBtn = document.getElementById('manageFacultyBtn');
    if (manageFacultyBtn) {
        if (role === 'ADMIN') {
            manageFacultyBtn.classList.remove('d-none');
            manageFacultyBtn.classList.add('d-flex');
        } else {
            manageFacultyBtn.classList.add('d-none');
            manageFacultyBtn.classList.remove('d-flex');
        }
    }

    // Manage Announcements -> visible for ADMIN and FACULTY, hidden for STUDENT
    const manageAnnouncementsBtn = document.getElementById('manageAnnouncementsBtn');
    if (manageAnnouncementsBtn) {
        if (role === 'ADMIN' || role === 'FACULTY') {
            manageAnnouncementsBtn.classList.remove('d-none');
            manageAnnouncementsBtn.classList.add('d-flex');
        } else {
            manageAnnouncementsBtn.classList.add('d-none');
            manageAnnouncementsBtn.classList.remove('d-flex');
        }
    }

    // Always refresh the ticker for all roles so students see current announcements
    if (typeof updateAnnouncementTicker === 'function') updateAnnouncementTicker();

    // Make Timetable Title Editable for Admin & Faculty
    const ttTitleHeader = document.getElementById('ttTitleHeader');
    const ttTitleEditIcon = document.getElementById('ttTitleEditIcon');
    if (ttTitleHeader && ttTitleEditIcon) {
        if (role === 'ADMIN' || role === 'FACULTY') {
            ttTitleHeader.contentEditable = true;
            ttTitleHeader.style.borderColor = 'var(--bs-secondary)';
            ttTitleEditIcon.classList.remove('d-none');

            ttTitleHeader.addEventListener('blur', function () {
                localStorage.setItem('sece_custom_tt_title_' + currentSection, this.innerText);
                showToast('Title Saved', 'Custom timetable title saved successfully.');
            });

            ttTitleEditIcon.addEventListener('click', function () {
                ttTitleHeader.focus();
                // Select all text
                const range = document.createRange();
                range.selectNodeContents(ttTitleHeader);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            });
        } else {
            ttTitleHeader.contentEditable = false;
            ttTitleHeader.style.borderColor = 'transparent';
            ttTitleEditIcon.classList.add('d-none');
        }

        // Load custom title on startup
        const customTitle = localStorage.getItem('sece_custom_tt_title_' + currentSection);
        if (customTitle && role !== 'STUDENT') {
            ttTitleHeader.innerText = customTitle;
        } else if (role === 'STUDENT') {
            let studentSec = typeof currentSection !== 'undefined' ? currentSection : '';
            const s = currentStudentRecord();
            if (s && (s.sec || s.section)) {
                studentSec = s.sec || (s.section.sectionName || s.section.name || s.section);
            }
            if (studentSec) {
                ttTitleHeader.innerText = studentSec;
            }
        }
    }

    // Setup edit icons to open modal
    const batchEditIcon = document.getElementById('batchEditIcon');
    const semEditIcon = document.getElementById('semEditIcon');
    const ayEditIcon = document.getElementById('ayEditIcon');

    const bannerBatchRow = document.getElementById('bannerBatchRow');
    const bannerSemRow = document.getElementById('bannerSemRow');

    if (role === 'FACULTY') {
        if (bannerBatchRow) bannerBatchRow.classList.add('d-none');
        if (bannerSemRow) bannerSemRow.classList.add('d-none');
    }

    if (role === 'ADMIN' || role === 'FACULTY') {
        if (batchEditIcon) batchEditIcon.classList.add('d-none');
        if (semEditIcon) semEditIcon.classList.add('d-none');
        if (ayEditIcon) {
            ayEditIcon.classList.remove('d-none');
            ayEditIcon.addEventListener('click', () => {
                if (window.openEditAyModal) window.openEditAyModal();
            });
        }
    } else {
        if (batchEditIcon) batchEditIcon.classList.add('d-none');
        if (semEditIcon) semEditIcon.classList.add('d-none');
        if (ayEditIcon) ayEditIcon.classList.add('d-none');
    }

    window.updateBannerHeaders(targetSec);

    // Standard dashboard updates
    if (role === 'STUDENT') {
        renderTimetableGrid();
        renderStudentsRoster();
        if (typeof window.fetchStudentDynamicDashboard === 'function') {
            window.fetchStudentDynamicDashboard();
            if (window.dynamicDashboardInterval) clearInterval(window.dynamicDashboardInterval);
            window.dynamicDashboardInterval = setInterval(window.fetchStudentDynamicDashboard, 30000);
        }
    } else {
        if (typeof onFilterChange === 'function') {
            onFilterChange();
        } else {
            renderTimetableGrid();
            renderStudentsRoster();
        }
    }

    renderNotificationStatus();
    toggleSubstitutionUI();
    if (typeof window.renderFacultyPersonalTT === 'function') window.renderFacultyPersonalTT();

    const resetBtn = document.getElementById('resetTimetableBtn');
    if (resetBtn) resetBtn.classList.toggle('d-none', role !== 'ADMIN');

    const resourcesBtn = document.getElementById('manageResourcesBtn');
    if (resourcesBtn) {
        if (role === 'ADMIN') {
            resourcesBtn.classList.remove('d-none');
            resourcesBtn.classList.add('d-flex');
        } else {
            resourcesBtn.classList.add('d-none');
            resourcesBtn.classList.remove('d-flex');
        }
    }

    const notifAdminForm = document.getElementById('periodNotificationAdminForm');
    if (notifAdminForm) notifAdminForm.classList.toggle('d-none', !(role === 'ADMIN' || role === 'FACULTY'));

    const subBtn = document.getElementById('substitutionBtn');
    if (subBtn) {
        if (role === 'STUDENT') {
            subBtn.classList.add('d-none');
            subBtn.classList.remove('d-flex');
        } else {
            subBtn.classList.remove('d-none');
            subBtn.classList.add('d-flex');
        }
    }

    const rosterManageBtn = document.getElementById('manageRosterBtn');
    if (rosterManageBtn) {
        if (role === 'ADMIN' || role === 'FACULTY') {
            rosterManageBtn.classList.remove('d-none');
            rosterManageBtn.classList.add('d-flex');
            rosterManageBtn.style.display = '';
        } else {
            rosterManageBtn.classList.add('d-none');
            rosterManageBtn.classList.remove('d-flex');
            rosterManageBtn.style.display = 'none';
        }
    }

    const addStudentDirectBtn = document.getElementById('addStudentDirectBtn');
    if (addStudentDirectBtn) {
        if (role === 'FACULTY') {
            addStudentDirectBtn.classList.remove('d-none');
            addStudentDirectBtn.classList.add('d-flex');
        } else {
            addStudentDirectBtn.classList.add('d-none');
            addStudentDirectBtn.classList.remove('d-flex');
        }
    }

    const facultyDetailsBtn = document.getElementById('facultyDetailsBtn');
    if (facultyDetailsBtn) {
        facultyDetailsBtn.classList.toggle('d-none', role !== 'FACULTY');
        facultyDetailsBtn.classList.toggle('d-flex', role === 'FACULTY');
    }

    const classAdvisorBtn = document.getElementById('classAdvisorBtn');
    if (classAdvisorBtn) {
        classAdvisorBtn.classList.toggle('d-none', role !== 'FACULTY');
        classAdvisorBtn.classList.toggle('d-flex', role === 'FACULTY');
    }

    const adminViewFacultyBtn = document.getElementById('adminViewFacultyBtn');
    if (adminViewFacultyBtn) {
        adminViewFacultyBtn.classList.toggle('d-none', role !== 'ADMIN');
        adminViewFacultyBtn.classList.toggle('d-flex', role === 'ADMIN');
    }

    renderAdminResourcesUI();
    if (!silent) showToast(`Role switched to ${role}`, `Permissions updated for ${role} access.`);
}

// Open Edit Period Modal
function openEditPeriodModal(day, pIdx, pData) {
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'FACULTY') {
        alert('Student view is read-only.');
        return;
    }
    document.getElementById('editDay').value = day;
    document.getElementById('editPeriod').value = pIdx;
    document.getElementById('editSlotLabel').value = `${day} - Period ${pIdx + 1}`;

    if (document.getElementById('editTypeTemporary')) {
        document.getElementById('editTypeTemporary').checked = true;
    }

    document.getElementById('editSubjectSelect').value = pData.sub || 'SE';
    document.getElementById('editFaculty').value = pData.faculty || 'Dr.S.K.Harikarthick, ASP/CSE';
    document.getElementById('editVenue').value = pData.venue || 'SF 04';
    document.getElementById('editCategory').value = pData.cat || 'cat-theory';

    const modal = new bootstrap.Modal(document.getElementById('editPeriodModal'));
    modal.show();
}

// Subject Select Auto-fill helper
function onSubjectSelectChange() {
    const sub = document.getElementById('editSubjectSelect').value;
    const ref = courseReferenceList.find(c => c.short === sub);
    if (ref) {
        document.getElementById('editFaculty').value = ref.faculty;
        document.getElementById('editVenue').value = ref.venue || '';
        if (sub === 'ALT') {
            document.getElementById('editCategory').value = 'cat-alt';
        } else if (sub.includes('LAB')) {
            document.getElementById('editCategory').value = 'cat-lab';
        }
    }
}

// Set Quick Wednesday ALT
function setAsWednesdayALT() {
    document.getElementById('editSubjectSelect').value = 'ALT';
    document.getElementById('editFaculty').value = 'Placement Team';
    document.getElementById('editVenue').value = 'SF 05';
    document.getElementById('editCategory').value = 'cat-alt';
}

// Save Period Changes
function savePeriodChanges() {
    const day = document.getElementById('editDay').value;
    const pIdx = parseInt(document.getElementById('editPeriod').value);

    const sub = document.getElementById('editSubjectSelect').value;
    const faculty = document.getElementById('editFaculty').value;
    const venue = document.getElementById('editVenue').value;
    const cat = document.getElementById('editCategory').value;

    const isTemporary = document.getElementById('editTypeTemporary') && document.getElementById('editTypeTemporary').checked;

    if (isTemporary) {
        const dateStr = todayDateStr();
        const key = substitutionKey(dateStr, currentSection, day, pIdx);
        const originalSlot = timetableData[currentSection] && timetableData[currentSection][day] && timetableData[currentSection][day][pIdx]
            ? timetableData[currentSection][day][pIdx] : null;

        substitutions[key] = {
            date: dateStr,
            section: currentSection,
            day: day,
            pIdx: pIdx,
            originalFaculty: originalSlot ? originalSlot.faculty : 'Unknown',
            substituteFaculty: faculty,
            reason: `Temporary override: ${sub} in ${venue}`
        };
        saveSubstitutions();
        createFacultyChangeNotification(day, pIdx, null, null, currentSection);
        showToast('Temporary Override Saved!', `Assigned ${faculty} to Period ${pIdx + 1} today only. SMS sent to students.`);
    } else {
        if (!timetableData[currentSection]) {
            timetableData[currentSection] = JSON.parse(JSON.stringify(DEFAULT_TIMETABLE_DATA['II CSE C']));
        }
        const originalSlot = timetableData[currentSection][day] && timetableData[currentSection][day][pIdx]
            ? JSON.parse(JSON.stringify(timetableData[currentSection][day][pIdx])) : null;
        const updatedSlot = { sub, faculty, venue, cat, code: 'MODIFIED' };
        timetableData[currentSection][day][pIdx] = updatedSlot;

        saveTimetableEdit(currentSection, day, pIdx, updatedSlot);
        createFacultyChangeNotification(day, pIdx, originalSlot, updatedSlot, currentSection);
        showToast('Period Permanently Updated!', `Updated base schedule for ${day} Period ${pIdx + 1}. SMS sent to students.`);
    }

    renderTimetableGrid();
    if (typeof renderTodaysSubstitutions === 'function') renderTodaysSubstitutions();

    const modalEl = document.getElementById('editPeriodModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
}

// Quick Wednesday ALT Preset
function quickAssignWednesdayALT() {
    if (!timetableData['II CSE C']) return;
    // Wednesday Period 4 (index 3) and Period 5 (index 4)
    const altSlot = { sub: 'ALT', code: 'U23EM753', faculty: 'Placement Team', venue: 'SF 05', cat: 'cat-alt' };
    timetableData['II CSE C']['Wednesday'][3] = altSlot;
    timetableData['II CSE C']['Wednesday'][4] = altSlot;
    saveTimetableEdit('II CSE C', 'Wednesday', 3, altSlot);
    saveTimetableEdit('II CSE C', 'Wednesday', 4, altSlot);

    renderTimetableGrid();
    showToast('Placement ALT Assigned!', 'Wednesday 4th & 5th Periods successfully set to Advanced Logical Thinking (Placement Team - SF 05).');
}

// Filter Change Handler
function onFilterChange() {
    currentDept = document.getElementById('deptSelect').value;
    currentSection = document.getElementById('sectionSelect').value;
    localStorage.setItem('sece_last_viewed_dept', currentDept);
    localStorage.setItem('sece_last_viewed_section', currentSection);

    const customTitle = localStorage.getItem('sece_custom_tt_title_' + currentSection);
    if (customTitle) {
        if (document.getElementById('ttTitleHeader')) {
            document.getElementById('ttTitleHeader').innerText = customTitle;
        }
    } else {
        if (document.getElementById('ttTitleHeader')) {
            document.getElementById('ttTitleHeader').innerText = `Class Timetable - Academic Schedule (${currentDept} - ${currentSection})`;
        }
    }

    window.updateBannerHeaders(currentSection);

    const placeholder = document.getElementById('adminTTPlaceholder');
    const ttArea = document.getElementById('timetableCaptureArea');
    const refArea = document.getElementById('referenceTableArea');

    if (getEffectiveRole() === 'ADMIN' && (!currentSection || currentSection === '')) {
        if (placeholder) placeholder.classList.remove('d-none');
        if (ttArea) ttArea.classList.add('d-none');
        if (refArea) refArea.classList.add('d-none');
    } else {
        if (placeholder) placeholder.classList.add('d-none');
        if (ttArea) ttArea.classList.remove('d-none');
        if (refArea) refArea.classList.remove('d-none');
    }

    renderTimetableGrid();
    renderStudentsRoster();
}

// Manage Students & Sections Roster Handlers
function currentStudentRecord() {
    let username = localStorage.getItem('sece_logged_in_user');
    let userInfo = null;
    try {
        userInfo = JSON.parse(localStorage.getItem('user_info'));
        if (userInfo && userInfo.username) username = userInfo.username;
    } catch (e) {}
    if (!username) return null;
    
    if (username === '25cs316') {
        return {
            id: 99999,
            roll: '25cs316',
            firstName: 'Shiv',
            name: 'Shiv',
            email: 'shiv@test.com',
            collegeEmail: 'shiv@sece.ac.in',
            phone: '9999999293',
            username: '25cs316',
            sec: 'II CSE C'
        };
    }
    const student = (typeof studentsRoster !== 'undefined' ? studentsRoster : []).find(s => (s.username || String(s.roll || '').toLowerCase()) === username.toLowerCase());
    
    if (student) return student;
    
    // Fallback for API authenticated students not in mock roster
    if (userInfo && userInfo.role === 'ROLE_STUDENT') {
        return {
            id: 99999,
            roll: userInfo.username,
            firstName: userInfo.name || userInfo.username,
            name: userInfo.name || userInfo.username,
            email: '-',
            collegeEmail: '-',
            phone: '0000000000',
            username: userInfo.username,
            sec: 'II CSE A'
        };
    }
    return null;
}

function maskStudentPhone(phone) {
    const digits = safetyNormalizePhone(phone);
    return digits ? digits.slice(-4) : '-';
}

function renderStudentsRoster() {
    if (typeof window.renderEnrolledStudentsRoster === 'function') {
        window.renderEnrolledStudentsRoster();
    }
    const tbody = document.getElementById('studentRosterBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const canManage = canManageStudents();
    const isStudent = currentUserRole === 'STUDENT';

    const visibleStudents = isStudent ? (currentStudentRecord() ? [currentStudentRecord()] : []) : studentsRoster;

    // Roster count on the students tab shows total available
    const rosterCountEl = document.getElementById('rosterCount');
    if (rosterCountEl) rosterCountEl.innerText = isStudent ? visibleStudents.length : studentsRoster.length;

    // Class Strength badge shows only the currently selected section's strength
    const strengthBadge = document.getElementById('classStrengthBadge');
    if (strengthBadge && !isStudent) {
        const activeSec = document.getElementById('sectionSelect') ? document.getElementById('sectionSelect').value : currentSection;
        const sectionCount = studentsRoster.filter(s => {
            const sn = (s.section && (s.section.sectionName || s.section.name)) || s.sec || '';
            return sn.trim().toLowerCase() === String(activeSec).trim().toLowerCase();
        }).length;
        strengthBadge.innerText = `${sectionCount} Students`;
    }

    const table = tbody.closest('table');
    const thead = table ? table.querySelector('thead tr') : null;
    if (thead) {
        thead.innerHTML = isStudent
            ? '<th>Roll No</th><th>Name</th><th>Department & Sec</th><th>Mobile</th><th>Parent Mobile 1</th><th>Parent Mobile 2</th>'
            : currentUserRole === 'ADMIN' ? '<th>Roll No</th><th>Name</th><th>Department & Sec</th><th>Username</th><th>Password</th><th>Personal Email</th><th>College Mail ID</th><th>Phone</th><th>Parent 1</th><th>Parent 2</th><th class="text-center">Action</th>' : '<th>Roll No</th><th>Name</th><th>Department & Sec</th><th>Username</th><th>Personal Email</th><th>College Mail ID</th><th>Phone</th><th>Parent 1</th><th>Parent 2</th><th class="text-center">Action</th>';
    }

    if (visibleStudents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${isStudent ? 6 : (currentUserRole === 'ADMIN' ? 11 : 10)}" class="text-center text-muted py-3">${isStudent ? 'Your enrolled student profile was not found.' : 'No students saved yet. Use "Add New Student" above to enroll one.'
            }</td></tr>`;
    }

    visibleStudents.forEach((s, idx) => {
        const username = s.username || s.roll;
        const tr = document.createElement('tr');
        if (isStudent) {
            tr.innerHTML = `
                <td><strong class="text-info">${s.roll || '-'}</strong></td>
                <td>${s.name || '-'}</td>
                <td>${s.sec || '-'}</td>
                <td>${maskStudentPhone(s.phone)}</td>
                <td>${maskStudentPhone(s.parentPhone1)}</td>
                <td>${maskStudentPhone(s.parentPhone2)}</td>`;
        } else {
            const actualIdx = studentsRoster.indexOf(s);
            tr.innerHTML = `
                <td><strong class="text-info">${s.roll || '-'}</strong></td>
                <td>${s.name || '-'}</td>
                <td>${s.sec || '-'}</td>
                <td>${username || '-'}</td>
                ${currentUserRole === 'ADMIN' ? `<td><code class="text-warning">${getStoredPassword(username) || getStudentPassword(s)}</code></td>` : ''}
                <td>${s.email || '-'}</td>
                <td>${s.collegeEmail || '-'}</td>
                <td>${s.phone || '-'}</td>
                <td>${s.parentPhone1 || '-'}</td>
                <td>${s.parentPhone2 || '-'}</td>
                <td>${canManage ? `<button class="btn btn-sm btn-outline-danger" onclick="removeStudent(${actualIdx})"><i class="fa-solid fa-trash"></i></button>` : '<span class="badge bg-secondary">View Only</span>'}</td>`;
        }
        tbody.appendChild(tr);
    });


    const addBtn = document.getElementById('addStudentBtn');
    if (addBtn) addBtn.classList.toggle('d-none', !canManage || currentUserRole === 'ADMIN');
    const managementNote = document.getElementById('studentManagementNote');
    if (managementNote) {
        managementNote.innerText = isStudent
            ? 'Student view: only your own profile is shown. Personal/college email and full mobile numbers are hidden.'
            : 'Faculty/Admin view: complete enrolled-student contact details are visible.';
    }
}

function saveFacultyEmail(index) {
    if (!(currentUserRole === 'ADMIN' || currentUserRole === 'FACULTY')) {
        alert('Only Faculty and Admin can manage faculty email details.');
        return;
    }
    const staff = staffDirectory[index];
    if (!staff) return;
    const fu = buildGeneratedUsername('FACULTY', staff.name);
    const myUsername = String(localStorage.getItem('sece_logged_in_user') || '').toLowerCase();
    if (currentUserRole !== 'ADMIN' && fu !== myUsername) {
        alert('Faculty can update only their own email details.');
        return;
    }
    const personalEl = document.querySelector(`.faculty-personal-email[data-index="${index}"]`);
    const collegeEl = document.querySelector(`.faculty-college-email[data-index="${index}"]`);
    const personalEmail = personalEl ? personalEl.value.trim().toLowerCase() : '';
    const collegeEmail = collegeEl ? collegeEl.value.trim().toLowerCase() : '';
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(personalEmail) || !emailRe.test(collegeEmail)) {
        alert('Both Personal Email and College Mail ID are compulsory and must be valid email addresses.');
        return;
    }
    staff.personalEmail = personalEmail;
    staff.collegeEmail = collegeEmail;
    saveStaffDirectory();
    renderStudentsRoster();
    showToast('Faculty Email Saved', `${staff.name} email details were saved successfully.`);
}

function toggleAddStudentForm() {
    const card = document.getElementById('addStudentCard');
    card.classList.toggle('d-none');
}

function handleAddStudent(e) {
    e.preventDefault();
    if (!ensureStudentManagementAccess()) return;

    const fName = document.getElementById('rsFirstName').value;
    const lName = document.getElementById('rsLastName').value;
    const regNo = document.getElementById('rsRegNo').value.trim();
    const email = document.getElementById('rsEmail').value.trim().toLowerCase();
    const collegeEmail = document.getElementById('rsCollegeEmail').value.trim().toLowerCase();
    const phone = safetyNormalizePhone(document.getElementById('rsPhone').value);
    const parentPhone1 = safetyNormalizePhone(document.getElementById('rsParentPhone1').value);
    const parentPhone2 = safetyNormalizePhone(document.getElementById('rsParentPhone2').value);
    const residentType = document.getElementById('rsResidentType').value;
    const hostelBlock = residentType === 'Hosteller' ? document.getElementById('rsHostelBlock').value.trim() : null;
    const roomNumber = residentType === 'Hosteller' ? document.getElementById('rsRoomNumber').value.trim() : null;
    const deptId = document.getElementById('rsDept').value.trim();
    const courseId = document.getElementById('rsCourse').value.trim();
    const secId = document.getElementById('rsSection').value.trim();
    const semester = document.getElementById('rsSemester').value;

    if (!collegeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collegeEmail)) {
        alert('College Mail ID is compulsory and must be a valid email address.');
        return;
    }
    if (!/^\d{10}$/.test(phone) || !/^\d{10}$/.test(parentPhone1)) {
        alert('Student mobile and Parent Mobile 1 must each contain exactly 10 digits.');
        return;
    }
    if (parentPhone2 && !/^\d{10}$/.test(parentPhone2)) {
        alert('Parent Mobile 2 must contain exactly 10 digits when provided.');
        return;
    }
    if (residentType === 'Hosteller' && (!hostelBlock || !roomNumber)) {
        alert('Hostel Block and Room Number are required for Hostellers.');
        return;
    }
    if (studentsRoster.some(s => String(s.roll || s.registerNumber || '').toLowerCase() === regNo.toLowerCase())) {
        alert('That roll number is already enrolled.');
        return;
    }

    const nameParts = fName.trim().split(/\s+/);
    const firstName = nameParts[0] || fName;
    const lastName = lName.trim() || nameParts.slice(1).join(' ') || firstName;

    const deptCourseMap = {
        'CSE': 'BTECH-CSE',
        'IT': 'BTECH-IT',
        'AI&DS': 'BTECH-AIDS',
        'AI&ML': 'BTECH-AIML',
        'ECE': 'BTECH-ECE'
    };
    const actualCourseId = deptCourseMap[deptId] || 'BTECH-' + deptId;
    const fullSectionName = courseId + ' ' + deptId + ' ' + secId;

    const payload = {
        registerNumber: regNo,
        firstName: firstName,
        lastName: lastName,
        email: email || collegeEmail,
        collegeEmail: collegeEmail,
        phone: phone,
        parentPhone1: parentPhone1,
        parentPhone2: parentPhone2 || null,
        residentType: residentType,
        hostelBlock: hostelBlock,
        roomNumber: roomNumber,
        semester: parseInt(semester),
        department: { name: deptId },
        course: { name: actualCourseId },
        section: { sectionName: fullSectionName }
    };

    apiFetch('/api/students', {
        method: 'POST',
        body: JSON.stringify(payload)
    }).then(async res => {
        if (res.ok) {
            const username = regNo;
            const newStudent = { roll: regNo, name: firstName + ' ' + lastName, sec: fullSectionName, email, collegeEmail, phone, parentPhone1, parentPhone2, residentType, hostelBlock, roomNumber, username, registerNumber: regNo };
            studentsRoster.push(newStudent);
            saveStudents();
            if (typeof loadRecentStudents === 'function') loadRecentStudents();
            renderStudentsRoster();
            renderSectionsList();
            document.getElementById('addStudentForm').reset();
            toggleAddStudentForm();
            showToast('Student Enrolled & Saved!', `Added ${firstName} ${lastName}. Username: ${username}. Initial password: ${getStudentPassword(newStudent)}.`);
        } else {
            const errText = await res.text().catch(() => res.status);
            alert("Failed to add student: " + errText);
        }
    }).catch(err => {
        console.error(err);
        alert("Error connecting to backend while adding student.");
    });
}

function removeStudent(idx) {
    if (!ensureStudentManagementAccess()) return;

    if (!confirm('Are you sure you want to delete this student permanently?')) return;

    const removed = studentsRoster.splice(idx, 1)[0];
    saveStudents();
    renderStudentsRoster();
    showToast('Student Removed', `Removed ${removed.name} from section roster.`);

    if (removed && removed.id) {
        apiFetch(`/api/students/${removed.id}`, { method: 'DELETE' }).then(res => {
            if (res.ok) loadRecentStudents();
        }).catch(err => console.error(err));
    }
}

// Add / Remove Section
function populateSectionSelects() {
    const deptSelect = document.getElementById('deptSelect');
    if (deptSelect) {
        const uniqueDepts = [...new Set(activeSections.map(s => s.dept))]
            .filter(d => d && d !== 'Select Department...' && d.trim() !== '')
            .sort();
        
        let deptHTML = '<option value="">Select Dept...</option>';
        uniqueDepts.forEach(d => {
            deptHTML += `<option value="${d}">${d}</option>`;
        });
        deptSelect.innerHTML = deptHTML;
        
        if (typeof currentDept !== 'undefined' && currentDept) {
            const exists = uniqueDepts.includes(currentDept);
            if (exists) deptSelect.value = currentDept;
        }
    }
    const deptVal = deptSelect ? deptSelect.value : null;

    // Only include actual <select> elements in this iteration
    const selects = [document.getElementById('sectionSelect')];
    selects.forEach(select => {
        if (!select) return;
        let current = select.value;
        if (current === '' && typeof currentSection !== 'undefined' && currentSection) {
            current = currentSection;
        }
        let prefix = '<option value="">-- Select Section --</option>';

        let filtered = [...activeSections];
        // Filter the main section select by the currently selected department, if any
        if (select.id === 'sectionSelect' && deptVal) {
            filtered = filtered.filter(s => s.dept === deptVal);
        }

        const sortedSections = filtered.sort((a, b) => a.name.localeCompare(b.name));
        select.innerHTML = prefix + sortedSections.map(s =>
            `<option value="${s.name.replace(/"/g, '&quot;')}">${s.name} [${s.classroom}]</option>`
        ).join('');
        if (filtered.some(s => s.name === current)) select.value = current;
    });

    // Populate the <datalist> elements used for typing sections
    const datalists = [document.getElementById('stdSecList'), document.getElementById('sectionDatalist'), document.getElementById('rosterFilterDatalist')];
    const sortedDatalistOptions = [...activeSections].sort((a, b) => a.name.localeCompare(b.name));
    const datalistHTML = sortedDatalistOptions.map(s =>
        `<option value="${s.name.replace(/"/g, '&quot;')}">${s.name}</option>`
    ).join('');

    datalists.forEach(dl => {
        if (dl) dl.innerHTML = datalistHTML;
    });
}

function renderSectionsList() {
    const ul = document.getElementById('sectionsList');
    const ul2 = document.getElementById('sectionsListOnly');
    if (ul) ul.innerHTML = '';
    if (ul2) ul2.innerHTML = '';
    
    activeSections.forEach((s, idx) => {
        if (ul) {
            const li = document.createElement('li');
            li.className = 'list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center py-2';
            li.innerHTML = `
                <div><strong class="text-info">${s.name}</strong> <small class="text-muted">(${s.dept})</small>
                <br><small class="text-muted">Classroom: ${s.classroom}</small></div>
                <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="removeSection(${idx})"><i class="fa-solid fa-xmark"></i></button>`;
            ul.appendChild(li);
        }
        
        if (ul2) {
            const li2 = document.createElement('li');
            li2.className = 'list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center py-2';
            li2.innerHTML = `
                <div><strong class="text-info">${s.name}</strong> <small class="text-muted">(${s.dept})</small>
                <br><small class="text-muted">Classroom: ${s.classroom}</small></div>`;
            ul2.appendChild(li2);
        }
    });
    populateSectionSelects();
    renderAdminResourcesUI();
}

function handleAddSection(e) {
    e.preventDefault();
    if (!ensureSectionManagementAccess()) return;
    const dept = document.getElementById('secDept').value.trim();
    const name = document.getElementById('secName').value.trim();
    const classroom = document.getElementById('secClassroom').value.trim();
    const capacityInput = document.getElementById('secCapacity');
    const capacity = capacityInput ? parseInt(capacityInput.value) : 60;

    if (activeSections.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        alert('That class/section already exists.');
        return;
    }
    activeSections.push({ dept, name, classroom, capacity });
    saveSections();
    renderSectionsList();
    document.getElementById('addSectionForm').reset();
    showToast('Section Created!', `Created ${name} in ${classroom}.`);
}

function removeSection(idx) {
    if (!ensureSectionManagementAccess()) return;
    const removed = activeSections.splice(idx, 1)[0];
    saveSections();
    renderSectionsList();
    showToast('Section Removed', `Section ${removed.name} removed.`);
}

function handleClassAdvisorLogin(e) {
    e.preventDefault();
    if (currentUserRole !== 'FACULTY') {
        alert('Class Advisor View is available only inside the Faculty view.');
        return;
    }
    const username = String(document.getElementById('advisorLoginUsername').value || '').trim().toLowerCase();
    const password = String(document.getElementById('advisorLoginPassword').value || '');
    const faculty = staffDirectory.find(s => buildClassAdvisorUsername(s.name) === username && s.classAdvisorFor);
    if (!faculty) {
        alert('Invalid Class Advisor username or this faculty member is not assigned as a Class Advisor.');
        return;
    }
    const assignedSection = String(faculty.classAdvisorFor || '').trim();
    if (!assignedSection || getClassAdvisorPassword(username) !== password) {
        alert('Invalid Class Advisor username/password or advisor assignment.');
        return;
    }
    document.getElementById('classAdvisorLoginForm').reset();
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('classAdvisorLoginModal'));
    if (loginModal) loginModal.hide();
    renderClassAdvisorStudents(assignedSection, faculty);
    const viewModal = new bootstrap.Modal(document.getElementById('classAdvisorViewModal'));
    viewModal.show();
}

window.renderClassAdvisorStudents = async function (section, faculty) {
    const body = document.getElementById('classAdvisorStudentsBody');
    const subtitle = document.getElementById('classAdvisorViewSubtitle');
    if (!body || !subtitle) return;

    subtitle.innerText = `${faculty.displayName || faculty.name} â€” Class Advisor for ${section}`;
    body.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-info" role="status"></div></div>';

    try {
        const res = await apiFetch('/api/students');
        if (!res.ok) throw new Error("Failed to load");
        const allStudents = await res.json();
        // Assume section in API matches section name loosely, or section.id.
        // The API returns section as object: { id: 1, name: "II CSE C", ... }
        const students = allStudents.filter(s => {
            if (!s.section) return false;
            const secName = (s.section.sectionName || s.section.name || '').trim();
            return secName.toLowerCase() === String(section || '').trim().toLowerCase();
        });

        body.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <div class="alert alert-info py-2 small mb-0 flex-grow-1">Only this Class Advisor's assigned class is shown.</div>
                <button class="btn btn-sm btn-success text-nowrap" onclick="document.getElementById('caAddStudentForm').classList.toggle('d-none')"><i class="fa-solid fa-user-plus me-1"></i> Add Student</button>
            </div>

            <div id="caAddStudentForm" class="card card-body bg-secondary border-0 mb-3 d-none">
                <h6 class="fw-bold text-warning mb-2">Register New Student</h6>
                <form onsubmit="window.handleClassAdvisorAddStudent(event, '${section}')">
                    <div class="row g-2 mb-2">
                        <div class="col-md-4">
                            <label class="form-label small mb-1">First Name <span class="text-danger">*</span></label>
                            <input type="text" id="caStdFirstName" class="form-control form-control-sm bg-dark text-white border-secondary" required />
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small mb-1">Last Name <span class="text-danger">*</span></label>
                            <input type="text" id="caStdLastName" class="form-control form-control-sm bg-dark text-white border-secondary" required />
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small mb-1">Register Number <span class="text-danger">*</span></label>
                            <input type="text" id="caStdRoll" class="form-control form-control-sm bg-dark text-white border-secondary" placeholder="e.g. 71812423001" required />
                        </div>
                    </div>
                    <div class="row g-2 mb-2">
                        <div class="col-md-4">
                            <label class="form-label small mb-1">Personal Email <span class="text-danger">*</span></label>
                            <input type="email" id="caStdEmail" class="form-control form-control-sm bg-dark text-white border-secondary" required />
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small mb-1">College Email <span class="text-danger">*</span></label>
                            <input type="email" id="caStdCollegeEmail" class="form-control form-control-sm bg-dark text-white border-secondary" required />
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small mb-1">Mobile Number <span class="text-danger">*</span></label>
                            <input type="tel" id="caStdPhone" class="form-control form-control-sm bg-dark text-white border-secondary" required pattern="[0-9]{10}" />
                        </div>
                    </div>
                    <div class="row g-2 mb-2">
                        <div class="col-md-4">
                            <label class="form-label small mb-1">Parent 1 Mobile <span class="text-danger">*</span></label>
                            <input type="tel" id="caStdParent1" class="form-control form-control-sm bg-dark text-white border-secondary" required pattern="[0-9]{10}" />
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small mb-1">Parent 2 Mobile <span class="text-muted">(Optional)</span></label>
                            <input type="tel" id="caStdParent2" class="form-control form-control-sm bg-dark text-white border-secondary" pattern="[0-9]{10}" />
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small mb-1">Resident Type <span class="text-danger">*</span></label>
                            <select id="caStdResidentType" class="form-select form-select-sm bg-dark text-white border-secondary" required onchange="const el = document.getElementById('caHostelFields'); if (el) el.classList.toggle('d-none', this.value !== 'Hosteller');">
                                <option value="">Select...</option>
                                <option value="Hosteller">Hosteller</option>
                                <option value="Day Scholar">Day Scholar</option>
                            </select>
                        </div>
                    </div>
                    <div id="caHostelFields" class="row g-2 mb-2 d-none">
                        <div class="col-md-6">
                            <label class="form-label small mb-1">Hostel Block</label>
                            <input type="text" id="caStdHostelBlock" class="form-control form-control-sm bg-dark text-white border-secondary" placeholder="e.g. A Block" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small mb-1">Room Number</label>
                            <input type="text" id="caStdRoomNumber" class="form-control form-control-sm bg-dark text-white border-secondary" placeholder="e.g. 204" />
                        </div>
                    </div>
                    <div class="row g-2 mb-3">
                        <div class="col-md-3">
                            <label class="form-label small mb-1">Department <span class="text-danger">*</span></label>
                            <input type="text" id="caStdDept" list="deptDatalist" class="form-control form-control-sm bg-dark text-white border-secondary" required placeholder="e.g. CSE" autocomplete="off" />
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small mb-1">Class <span class="text-danger">*</span></label>
                            <input type="text" id="caStdCourse" list="courseDatalist" class="form-control form-control-sm bg-dark text-white border-secondary" required placeholder="e.g. BTECH-CSE" autocomplete="off" />
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small mb-1">Section <span class="text-danger">*</span></label>
                            <input type="text" id="caStdSection" list="sectionDatalist" class="form-control form-control-sm bg-dark text-white border-secondary" required value="${section}" />
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small mb-1">Semester <span class="text-danger">*</span></label>
                            <input type="number" id="caStdSemester" class="form-control form-control-sm bg-dark text-white border-secondary" required min="1" max="8" value="3" />
                        </div>
                    </div>
                    <button type="submit" class="btn btn-sm btn-primary font-semibold w-100"><i class="fa-solid fa-plus me-1"></i> Add Student</button>
                </form>
            </div>

            ${students.length === 0 ? '<div class="alert alert-warning mt-2">No students are currently enrolled in this class.</div>' : `
            <div class="table-responsive">
                <table class="table table-dark table-striped table-hover align-middle small">
                    <thead><tr><th>#</th><th>Roll No</th><th>Name</th><th>Class / Section</th><th>Semester</th><th>Personal Email</th><th>College Mail ID</th><th>Mobile</th><th>Parent Mobile 1</th><th>Parent Mobile 2</th><th>Action</th></tr></thead>
                    <tbody>${students.map((s, i) => {
            return `<tr>
                            <td class="text-muted">${i + 1}</td>
                            <td><code class="text-warning fw-bold">${s.registerNumber || '-'}</code></td>
                            <td><strong>${(s.firstName || '')} ${(s.lastName || '')}</strong></td>
                            <td><span class="badge bg-primary">${s.section ? (s.section.sectionName || '-') : '-'}</span></td>
                            <td class="text-center">${s.semester || '-'}</td>
                            <td><small>${s.email || '-'}</small></td>
                            <td><small>${s.collegeEmail || '-'}</small></td>
                            <td>${s.phone || '-'}</td>
                            <td>${s.parentPhone1 || '-'}</td>
                            <td>${s.parentPhone2 || '-'}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-danger" onclick="window.deletePersistentStudent(${s.id})" title="Delete student"><i class="fa-solid fa-trash"></i></button>
                            </td>
                        </tr>`;
        }).join('')}</tbody>
                </table>
            </div>`}
        `;
    } catch (e) {
        body.innerHTML = '<div class="alert alert-danger">Error loading students from server.</div>';
    }
};

window.handleClassAdvisorAddStudent = async function (e, prefilledSection) {
    e.preventDefault();
    const roll = document.getElementById('caStdRoll').value.trim();
    const firstName = document.getElementById('caStdFirstName').value.trim();
    const lastName = document.getElementById('caStdLastName').value.trim();
    const email = document.getElementById('caStdEmail').value.trim();
    const collegeEmail = document.getElementById('caStdCollegeEmail').value.trim();
    const phone = document.getElementById('caStdPhone').value.trim();
    const parentPhone1 = document.getElementById('caStdParent1').value.trim();
    const parentPhone2 = document.getElementById('caStdParent2').value.trim();
    const residentType = document.getElementById('caStdResidentType').value.trim();
    const hostelBlock = residentType === 'Hosteller' ? document.getElementById('caStdHostelBlock').value.trim() : null;
    const roomNumber = residentType === 'Hosteller' ? document.getElementById('caStdRoomNumber').value.trim() : null;
    const deptId = document.getElementById('caStdDept').value.trim();
    const courseId = document.getElementById('caStdCourse').value.trim();
    const secId = document.getElementById('caStdSection').value.trim();
    const semester = document.getElementById('caStdSemester').value;

    if (!collegeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collegeEmail)) {
        alert('College Mail ID is required and must be a valid email.');
        return;
    }

    const payload = {
        registerNumber: roll,
        firstName: firstName,
        lastName: lastName,
        email: email || collegeEmail,
        collegeEmail: collegeEmail,
        phone: phone,
        parentPhone1: parentPhone1,
        parentPhone2: parentPhone2 || null,
        residentType: residentType,
        hostelBlock: hostelBlock,
        roomNumber: roomNumber,
        semester: parseInt(semester),
        department: { name: deptId },
        course: { name: courseId },
        section: { sectionName: secId }
    };

    try {
        const res = await apiFetch('/api/students', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            showToast('Student Added', `${firstName} ${lastName} has been enrolled in ${prefilledSection}.`);
            // Reload the view
            const faculty = staffDirectory.find(s => s.classAdvisorFor === prefilledSection);
            if (faculty) window.renderClassAdvisorStudents(prefilledSection, faculty);
        } else {
            const errText = await res.text().catch(() => res.status);
            alert('Failed to add student: ' + errText);
        }
    } catch (err) {
        console.error(err);
        alert('Error connecting to backend while adding student.');
    }
};

window.searchStudentInRoster = function() {
    const input = document.getElementById('rosterSearchRegNo');
    if (!input) return;
    const query = input.value.trim();
    if (!query) {
        alert("Please enter a Register Number to search.");
        return;
    }
    const rosterModalEl = document.getElementById('manageRosterModal');
    if (rosterModalEl) {
        const rosterModal = bootstrap.Modal.getInstance(rosterModalEl);
        if (rosterModal) rosterModal.hide();
    }
    openStudentDetailsModal(query);
};

window.openStudentDetailsModal = async function (searchQuery = '') {
    const body = document.getElementById('studentDetailsOnlyBody');
    if (!body) return;

    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'FACULTY') {
        alert('Access denied. Only Admin and Faculty can view full student details here.');
        return;
    }

    const viewModal = new bootstrap.Modal(document.getElementById('studentDetailsOnlyModal'));
    viewModal.show();

    body.innerHTML = '<tr><td colspan="11" class="text-center text-muted">Loading student details...</td></tr>';

    try {
        const res = await apiFetch('/api/students');
        if (res.ok) {
            let data = await res.json();
            if (searchQuery) {
                const queryLower = searchQuery.toLowerCase();
                data = data.filter(s => s.registerNumber && s.registerNumber.toLowerCase().includes(queryLower));
            }
            body.innerHTML = '';
            data.forEach((s, i) => {
                let username = s.registerNumber ? String(s.registerNumber).toLowerCase() : '-';
                if (s.user && s.user.username) username = s.user.username;
                
                let password = 'student123';
                if (s.user && s.user.rawPassword) {
                    password = s.user.rawPassword;
                } else if (s.phone && String(s.phone).length >= 4 && s.firstName) {
                    const phoneStr = String(s.phone).replace(/\D/g, '');
                    const last4 = phoneStr.length >= 4 ? phoneStr.slice(-4) : '0000';
                    password = s.firstName.split(' ')[0].toUpperCase() + last4;
                }
                
                const secDisplay = s.section ? (s.section.sectionName || s.section.name || s.section.id || s.section) : '-';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${s.registerNumber || '-'}</td>
                    <td>${s.firstName || ''} ${s.lastName || ''}</td>
                    <td><span class="badge bg-secondary">${secDisplay}</span></td>
                    <td><small>${s.email || '-'}</small></td>
                    <td><small>${s.collegeEmail || '-'}</small></td>
                    <td>${s.phone || '-'}</td>
                    <td>${s.parentPhone1 || '-'}</td>
                    <td>${s.parentPhone2 || '-'}</td>
                    <td><code>${username || '-'}</code></td>
                    <td>${currentUserRole === 'ADMIN' ? `<code class="text-warning">${password}</code>` : '<span class="badge bg-secondary">Hidden</span>'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="window.editPersistentStudent(${s.id || `'${s.registerNumber}'`})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="window.deletePersistentStudent(${s.id || `'${s.registerNumber}'`})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                body.appendChild(tr);
            });
            if (data.length === 0) {
                body.innerHTML = '<tr><td colspan="11" class="text-center text-muted">No students found.</td></tr>';
            }
        } else {
            body.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Failed to fetch students.</td></tr>';
        }
    } catch (err) {
        body.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Error connecting to server.</td></tr>';
    }
};

function openAddStudentFromDetails() {
    // Hide the details modal and open the add student modal
    const viewModalEl = document.getElementById('studentDetailsOnlyModal');
    const viewModal = bootstrap.Modal.getInstance(viewModalEl);
    if (viewModal) viewModal.hide();

    // Open the manage roster modal and switch to the add student tab
    const rosterModal = new bootstrap.Modal(document.getElementById('manageRosterModal'));
    rosterModal.show();

    // Switch to Add Student tab automatically
    setTimeout(() => {
        const addStudentTab = document.querySelector('button[data-bs-target="#tabAddStudent"]');
        if (addStudentTab) {
            new bootstrap.Tab(addStudentTab).show();
        }
    }, 200);
}

function removeStudentDetails(idx) {
    if (!confirm('Are you sure you want to permanently delete this student?')) return;
    const removed = studentsRoster.splice(idx, 1)[0];
    localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(studentsRoster));
    showToast('Student Removed', `Student ${removed.name} has been deleted.`);
    openStudentDetailsModal(); // Refresh the list
    if (document.getElementById('manageRosterModal').classList.contains('show')) {
        renderStudentsRoster(); // Refresh roster if open
    }
}

window.openAddStudentDirectly = function () {
    const rosterModalEl = document.getElementById('manageRosterModal');
    if (!rosterModalEl) return;
    const rosterModal = new bootstrap.Modal(rosterModalEl);
    rosterModal.show();

    setTimeout(() => {
        const addStudentTab = document.querySelector('button[data-bs-target="#tabStudents"]');
        if (addStudentTab) {
            new bootstrap.Tab(addStudentTab).show();
            const card = document.getElementById('addStudentCard');
            if (card && card.classList.contains('d-none')) {
                card.classList.remove('d-none');
            }
        }
    }, 200);
}

function renderFacultyDetailsView() {
    if (currentUserRole !== 'FACULTY' && currentUserRole !== 'ADMIN') return;

    const body = document.getElementById('facultyDetailsBody');
    if (body) {
        const myUsername = String(localStorage.getItem('sece_logged_in_user') || '').toLowerCase();
        body.innerHTML = staffDirectory.map((staff, i) => {
            const fu = buildGeneratedUsername('FACULTY', staff.name);
            const canEdit = fu === myUsername;
            return `<tr>
                <td>${staff.displayName || staff.name || '-'}</td><td>${staff.dept || '-'}</td><td><code>${fu || '-'}</code></td>
                <td><input type="email" class="form-control form-control-sm bg-dark text-white border-secondary faculty-detail-personal" data-index="${i}" value="${staff.personalEmail || ''}" placeholder="personal@gmail.com" ${canEdit ? '' : 'disabled'}></td>
                <td><input type="email" class="form-control form-control-sm bg-dark text-white border-secondary faculty-detail-college" data-index="${i}" value="${staff.collegeEmail || ''}" placeholder="name@sece.ac.in" ${canEdit ? '' : 'disabled'}></td>
                <td>${canEdit ? `<button class="btn btn-sm btn-success" onclick="saveFacultyDetailsView(${i})">Save</button>` : '<span class="badge bg-secondary">View Only</span>'}</td>
            </tr>`;
        }).join('');
    }

    const credentialsPanel = document.getElementById('adminCredentialsPanel');
    if (credentialsPanel) credentialsPanel.classList.toggle('d-none', currentUserRole !== 'ADMIN');
    const facultyCredBody = document.getElementById('facultyCredentialsBody');
    if (facultyCredBody) {
        facultyCredBody.innerHTML = currentUserRole === 'ADMIN' ? staffDirectory.map(staff => {
            const fu = buildGeneratedUsername('FACULTY', staff.name);
            return `<tr><td>${staff.name}</td><td>${staff.dept || '-'}</td><td><code>${fu || '-'}</code></td><td><code class="text-warning">${fu ? (getStoredPassword(fu) || buildGeneratedPassword('FACULTY', fu)) : '-'}</code></td></tr>`;
        }).join('') : '';
    }

    const facultyEmailPanel = document.getElementById('facultyEmailDirectoryPanel');
    const facultyEmailBody = document.getElementById('facultyEmailDirectoryBody');
    if (facultyEmailPanel) facultyEmailPanel.classList.toggle('d-none', !(currentUserRole === 'ADMIN' || currentUserRole === 'FACULTY'));
    if (facultyEmailBody && (currentUserRole === 'ADMIN' || currentUserRole === 'FACULTY')) {
        const myUsername = String(localStorage.getItem('sece_logged_in_user') || '').toLowerCase();
        facultyEmailBody.innerHTML = staffDirectory.map((staff, i) => {
            const fu = buildGeneratedUsername('FACULTY', staff.name);
            const canEdit = currentUserRole === 'ADMIN' || fu === myUsername;
            return `<tr>
                <td>${staff.name || '-'}</td><td>${staff.dept || '-'}</td><td><code>${fu || '-'}</code></td>
                <td><input type="email" class="form-control form-control-sm bg-dark text-white border-secondary faculty-personal-email" data-index="${i}" value="${staff.personalEmail || ''}" placeholder="personal@gmail.com" ${canEdit ? '' : 'disabled'}></td>
                <td><input type="email" class="form-control form-control-sm bg-dark text-white border-secondary faculty-college-email" data-index="${i}" value="${staff.collegeEmail || ''}" placeholder="name@sece.ac.in" ${canEdit ? '' : 'disabled'}></td>
                <td>${canEdit ? `<button class="btn btn-sm btn-success" onclick="saveFacultyEmail(${i})">Save</button>` : '<span class="badge bg-secondary">View Only</span>'}</td>
            </tr>`;
        }).join('');
    }
}

function saveFacultyDetailsView(index) {
    if (currentUserRole !== 'FACULTY') {
        alert('Faculty Details are available only in Faculty view.');
        return;
    }
    const staff = staffDirectory[index];
    if (!staff) return;
    const myUsername = String(localStorage.getItem('sece_logged_in_user') || '').toLowerCase();
    if (buildGeneratedUsername('FACULTY', staff.name) !== myUsername) {
        alert('You can update only your own faculty email details.');
        return;
    }
    const personalEl = document.querySelector(`.faculty-detail-personal[data-index="${index}"]`);
    const collegeEl = document.querySelector(`.faculty-detail-college[data-index="${index}"]`);
    const personalEmail = personalEl ? personalEl.value.trim().toLowerCase() : '';
    const collegeEmail = collegeEl ? collegeEl.value.trim().toLowerCase() : '';
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(personalEmail) || !emailRe.test(collegeEmail)) {
        alert('Both Personal Email and College Mail ID are compulsory and must be valid email addresses.');
        return;
    }
    staff.personalEmail = personalEmail;
    staff.collegeEmail = collegeEmail;
    saveStaffDirectory();
    renderFacultyDetailsView();
    showToast('Faculty Details Saved', 'Your personal and college email details were saved successfully.');
}

async function openStudentProfileModal() {
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'FACULTY' && currentUserRole !== 'STUDENT') { return; }

    if (currentUserRole !== 'STUDENT') { alert('This profile is available only to Student accounts.'); return; }

    const body = document.getElementById('studentProfileBody');
    if (!body) return;
    
    // Unconditionally fetch from API to get the most updated admin details
    let s = null;
    let username = localStorage.getItem('sece_logged_in_user');
    try {
        const userInfo = JSON.parse(localStorage.getItem('user_info'));
        if (userInfo && userInfo.username) username = userInfo.username;
    } catch (e) {}

    try {
        body.innerHTML = '<div class="text-center py-2"><div class="spinner-border text-success" role="status"></div></div>';
        const fetchFn = (typeof apiFetch === 'function') ? apiFetch : fetch;
        const res = await fetchFn('/api/students');
        if (res.ok) {
            const data = await res.json();
            const backendStudent = data.find(st => 
                (st.user && st.user.username === username) || 
                (st.registerNumber && String(st.registerNumber).toLowerCase() === String(username).toLowerCase())
            );
            if (backendStudent) {
                s = {
                    id: backendStudent.id,
                    firstName: backendStudent.firstName || '',
                    lastName: backendStudent.lastName || '',
                    roll: backendStudent.registerNumber,
                    name: `${backendStudent.firstName || ''} ${backendStudent.lastName || ''}`.trim(),
                    sec: backendStudent.section ? (backendStudent.section.sectionName || backendStudent.section.name || backendStudent.section.id) : (backendStudent.sec || ''),
                    email: backendStudent.email || '',
                    collegeEmail: backendStudent.collegeEmail || '',
                    phone: backendStudent.phone || '',
                    parentPhone1: backendStudent.parentPhone1 || '',
                    parentPhone2: backendStudent.parentPhone2 || '',
                    semester: backendStudent.semester || '',
                    residentType: backendStudent.residentType || '',
                    roomNumber: backendStudent.roomNumber || '',
                    hostelBlock: backendStudent.hostelBlock || ''
                };
            }
        }
    } catch (e) {
        console.error('Error fetching student profile from backend:', e);
    }

    if (!s) {
        s = currentStudentRecord();
    }

    if (!s) {
        body.innerHTML = '<div class="alert alert-warning">Your enrolled student record could not be found.</div>';
    } else {
        const computedUsername = s.roll ? String(s.roll).toLowerCase() : '-';
        const password = getStoredPassword(computedUsername) || 'student123';
        body.innerHTML = `
            <div class="row g-2 small">
                <div class="col-6"><strong>Roll No:</strong><br>${s.roll || '-'}</div>
                <div class="col-6"><strong>Name:</strong><br>${s.name || '-'}</div>
                <div class="col-6"><strong>Section:</strong><br>${s.sec || '-'}</div>
                <div class="col-6"><strong>Semester:</strong><br>${s.semester || '-'}</div>
                <div class="col-6"><strong>Personal Email:</strong><br>${s.email || '-'}</div>
                <div class="col-6"><strong>College Email:</strong><br>${s.collegeEmail || '-'}</div>
                <div class="col-12"><strong>My Mobile:</strong><br>${s.phone || '-'}</div>
                <div class="col-6"><strong>Parent Mobile 1:</strong><br>${s.parentPhone1 || '-'}</div>
                <div class="col-6"><strong>Parent Mobile 2:</strong><br>${s.parentPhone2 || '-'}</div>
                <div class="col-6"><strong>Resident Type:</strong><br>${s.residentType || 'Day Scholar'}</div>
                <div class="col-6"><strong>Room / Block:</strong><br>${s.roomNumber ? s.roomNumber + ' / ' + (s.hostelBlock||'') : '-'}</div>
                <div class="col-6"><strong>Username:</strong><br><code>${computedUsername}</code></div>
                <div class="col-6"><strong>Password:</strong><br><code class="text-warning">${password}</code></div>
            </div>`;
    }
    new bootstrap.Modal(document.getElementById('studentProfileModal')).show();
}

window.updateMyStudentProfile = async function (event, id) {
    event.preventDefault();
    const alertBox = document.getElementById('studentProfileAlert');
    alertBox.classList.add('d-none');

    const payload = {
        firstName: document.getElementById('spFirstName').value,
        lastName: document.getElementById('spLastName').value,
        email: document.getElementById('spEmail').value,
        collegeEmail: document.getElementById('spCollegeEmail').value,
        phone: document.getElementById('spPhone').value,
        parentPhone1: document.getElementById('spParentPhone1').value,
        parentPhone2: document.getElementById('spParentPhone2').value,
        semester: document.getElementById('spSemester').value,
    };

    try {
        const res = await apiFetch(`/api/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alertBox.className = 'alert alert-success small py-2';
            alertBox.innerText = 'Details updated successfully!';
            showToast('Success', 'Your student profile has been updated.');
        } else {
            alertBox.className = 'alert alert-danger small py-2';
            alertBox.innerText = 'Failed to update details.';
        }
    } catch (err) {
        alertBox.className = 'alert alert-danger small py-2';
        alertBox.innerText = 'Error connecting to server.';
    }
}

function getEffectiveRole() {
    if (currentUserRole) return String(currentUserRole).toUpperCase();
    const legacyRole = localStorage.getItem('sece_logged_in_role');
    if (legacyRole) return String(legacyRole).toUpperCase();
    try {
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        if (userInfo && userInfo.role) {
            return String(userInfo.role.replace('ROLE_', '')).toUpperCase();
        }
    } catch (e) { }
    return '';
}

// =========================
// ADMIN SUBJECT / CLASS / VENUE RESOURCES
// =========================
function adminOnly() {
    const effectiveRole = getEffectiveRole();
    if (effectiveRole !== 'ADMIN') {
        alert('Access denied. Only Admin can manage subjects, classes and venues.');
        return false;
    }
    // Keep currentUserRole in sync
    if (!currentUserRole && effectiveRole === 'ADMIN') {
        currentUserRole = effectiveRole;
    }
    return true;
}

function loadAdminResources() {
    try {
        const saved = JSON.parse(localStorage.getItem(RESOURCES_STORAGE_KEY) || 'null');
        return saved && typeof saved === 'object' ? saved : { subjects: [], venues: [] };
    } catch (_) { return { subjects: [], venues: [] }; }
}
let adminResources = loadAdminResources();
function saveAdminResources() { localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(adminResources)); }

function mergeCustomSubjectsIntoCourseList() {
    adminResources.subjects.forEach(s => {
        if (!courseReferenceList.some(c => c.short === s.short)) {
            courseReferenceList.push({
                short: s.short, code: `${s.code} ${s.title}`, faculty: s.faculty,
                venue: s.venue || 'Not Assigned', cat: s.category || 'PC', credits: '-', hrs: '-'
            });
        }
    });
}

function renderAdminResourcesUI() {
    mergeCustomSubjectsIntoCourseList();
    const subList = document.getElementById('adminSubjectsList');
    const venueList = document.getElementById('adminVenuesList');
    const classList = document.getElementById('adminClassesList');

    if (subList) {
        // All built-in TT subjects (editable via override, deletable)
        const builtInDefaults = [
            { code: 'SE',        title: 'Software Engineering',                     faculty: 'Dr.S.K.Harikarthick',                        venue: 'SF 04' },
            { code: 'JAVA',      title: 'Java Programming',                         faculty: 'Mr.M.Karthickraja',                          venue: 'SF 04' },
            { code: 'AIML',      title: 'Artificial Intelligence & ML',             faculty: 'Dr.N.Saranya',                               venue: 'SF 04' },
            { code: 'DM',        title: 'Discrete Mathematics',                     faculty: 'Dr.N.Murugavelli',                           venue: 'SF 04' },
            { code: 'DAA',       title: 'Design & Analysis of Algorithms',          faculty: 'Mr.R.Karthick',                              venue: 'SF 04' },
            { code: 'DBMS',      title: 'Database Management Systems',              faculty: 'Ms.E.Saranya',                               venue: 'SF 04' },
            { code: 'UHV',       title: 'Universal Human Values',                   faculty: 'Dr.M.P.Sindhu',                              venue: 'SF 04' },
            { code: 'COE',       title: 'Center of Excellence',                     faculty: 'Domain Experts',                             venue: 'COE Lab' },
            { code: 'SS',        title: 'Soft Skills',                              faculty: 'Placement Team',                             venue: 'SF 04' },
            { code: 'ALT',       title: 'Advanced Logical Thinking',                faculty: 'Placement Team',                             venue: 'SF 05' },
            { code: 'LIB',       title: 'Library Hour',                             faculty: '-',                                          venue: 'Library' },
            { code: 'TWM',       title: 'Tutor Ward Meeting',                       faculty: 'Class Advisor',                              venue: 'SF 04' },
            { code: 'AIML LAB',  title: 'AIML Laboratory',                          faculty: 'Dr.N.Saranya / Dr.M.Praveen',                venue: 'Intel AI Lab' },
            { code: 'JAVA LAB',  title: 'Java Programming Laboratory',              faculty: 'Mr.M.Karthickraja / Mr.B.Saravanan',         venue: 'Full Stack Lab' },
            { code: 'SE LAB',    title: 'Software Engineering Laboratory',          faculty: 'Dr.S.K.Harikarthick / Mr.P.Arunprakash',     venue: 'Intel AI Lab' },
            { code: 'DAA LAB',   title: 'Design & Analysis Lab',                    faculty: 'Mr.R.Karthick / Ms.Rajeswari',               venue: 'Full Stack Lab' },
            { code: 'DBMS LAB',  title: 'Database Management Lab',                  faculty: 'Ms.E.Saranya / Dr.K.Suresh kumar',           venue: 'Cloud & DevOps Lab' },
        ];

        // Merge courseReferenceList
        courseReferenceList.forEach(c => {
            const code = c.short || (c.code || '').split(' ')[0];
            if (!builtInDefaults.some(b => b.code.toUpperCase() === code.toUpperCase())) {
                builtInDefaults.push({ code, title: c.code || '', faculty: c.faculty || '-', venue: c.venue || '-' });
            }
        });

        // Load any built-in overrides saved by admin
        let builtInOverrides = {};
        let hiddenBuiltIns = [];
        try {
            builtInOverrides = JSON.parse(localStorage.getItem('sece_builtin_subject_overrides') || '{}');
            hiddenBuiltIns = JSON.parse(localStorage.getItem('sece_hidden_builtin_subjects') || '[]');
        } catch(e) {}

        // Custom rows (fully editable + removable)
        const customRows = adminResources.subjects.map((s, i) =>
            `<tr style="background:rgba(13,202,240,0.08)">
                <td><span class="badge bg-info text-dark">${s.code}</span></td>
                <td class="fw-bold">${s.title}</td>
                <td class="small">${s.faculty || '-'}</td>
                <td class="small text-success">${s.venue || '-'}</td>
                <td class="text-center">
                    <div class="d-flex gap-1 justify-content-center">
                        <span class="badge bg-success" style="font-size:0.65rem">Custom</span>
                        <button class="btn btn-sm btn-outline-warning py-0 px-1" onclick="editAdminSubject('custom',${i})" title="Edit Subject">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="deleteAdminSubject('custom',${i})" title="Delete Subject">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>`
        ).join('');

        // Built-in rows (editable with override, deletable/hideable)
        const builtInRows = builtInDefaults
            .filter(s => !hiddenBuiltIns.includes(s.code))
            .map((s, i) => {
                const ov = builtInOverrides[s.code] || {};
                const code    = ov.code    || s.code;
                const title   = ov.title   || s.title;
                const faculty = ov.faculty || s.faculty;
                const venue   = ov.venue   || s.venue;
                const isEdited = !!builtInOverrides[s.code];
                return `<tr>
                    <td><span class="badge ${isEdited ? 'bg-warning text-dark' : 'bg-secondary'}">${code}</span></td>
                    <td>${title}${isEdited ? ' <span class="badge bg-warning text-dark ms-1" style="font-size:0.6rem">Edited</span>' : ''}</td>
                    <td class="text-muted small">${faculty}</td>
                    <td class="text-muted small">${venue}</td>
                    <td class="text-center">
                        <div class="d-flex gap-1 justify-content-center">
                            <button class="btn btn-sm btn-outline-warning py-0 px-1" onclick="editAdminSubject('builtin','${s.code}')" title="Edit Subject">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="deleteAdminSubject('builtin','${s.code}')" title="Hide Subject">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }).join('');

        subList.innerHTML = (customRows + builtInRows) ||
            '<tr><td colspan="5" class="text-muted text-center py-3">No subjects found.</td></tr>';
    }

            if (venueList) {
        // Collect built-in venues from defaults and active sections
        const builtInVenueNames = new Set([
            'SF 04', 'SF 05', 'Library', 'Intel AI Lab', 'Full Stack Lab', 'Cloud & DevOps Lab', 'COE Lab', '1CloudHub'
        ]);
        
        courseReferenceList.forEach(c => { if(c.venue && c.venue !== '-' && c.venue !== 'TBD') builtInVenueNames.add(c.venue.trim()); });
        activeSections.forEach(s => { if(s.classroom && s.classroom !== '-' && s.classroom !== 'TBD') builtInVenueNames.add(s.classroom.trim()); });
        
        const builtInVenues = Array.from(builtInVenueNames).map(name => ({ name, type: 'Built-in', block: '', capacity: '' }));

        // Load venue overrides
        let builtInVenueOverrides = {};
        let hiddenBuiltInVenues = [];
        try {
            builtInVenueOverrides = JSON.parse(localStorage.getItem('sece_builtin_venue_overrides') || '{}');
            hiddenBuiltInVenues = JSON.parse(localStorage.getItem('sece_hidden_builtin_venues') || '[]');
        } catch(e) {}

        const customRows = adminResources.venues.map((v, i) =>
            `<div class="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center" style="background:rgba(13,202,240,0.05) !important;">
                <span>
                    <strong>${v.name || v}</strong> 
                    <small class="text-muted">${v.type || ''} ${v.block ? '— Block ' + v.block : ''}${v.capacity ? ' — Capacity ' + v.capacity : ''}</small>
                </span>
                <div class="d-flex gap-1 align-items-center">
                    <span class="badge bg-success me-1">Custom</span>
                    <button class="btn btn-sm btn-outline-warning py-0 px-1" onclick="editAdminVenue('custom', ${i})" title="Edit Venue"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="deleteAdminVenue('custom', ${i})" title="Delete Venue"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>`
        ).join('');

        const builtInRows = builtInVenues
            .filter(v => !hiddenBuiltInVenues.includes(v.name))
            .map(v => {
                const ov = builtInVenueOverrides[v.name] || {};
                const name = ov.name || v.name;
                const type = ov.type || v.type;
                const block = ov.block || v.block;
                const capacity = ov.capacity || v.capacity;
                const isEdited = !!builtInVenueOverrides[v.name];

                return `<div class="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center">
                    <span>
                        <strong>${name}</strong>
                        <small class="text-muted ms-2">${type || ''} ${block ? '— Block ' + block : ''}${capacity ? ' — Capacity ' + capacity : ''}</small>
                        ${isEdited ? '<span class="badge bg-warning text-dark ms-2" style="font-size:0.6rem">Edited</span>' : ''}
                    </span>
                    <div class="d-flex gap-1 align-items-center">
                        <button class="btn btn-sm btn-outline-warning py-0 px-1" onclick="editAdminVenue('builtin', '${v.name}')" title="Edit Venue"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="deleteAdminVenue('builtin', '${v.name}')" title="Hide Venue"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>`;
            }).join('');

        venueList.innerHTML = (customRows + builtInRows) || '<div class="list-group-item bg-dark text-muted border-secondary">No venues found.</div>';
    }
    if (classList) {
        classList.innerHTML = activeSections.length ? activeSections.map((s, i) =>
            `<div class="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center">
                <span><strong>${s.name}</strong> <small class="text-muted">(${s.dept}) – ${s.classroom}${s.block ? ' – Block ' + s.block : ''}</small></span>
                <button class="btn btn-sm btn-outline-danger" onclick="removeSection(${i})">Remove</button>
            </div>`
        ).join('') : '<div class="list-group-item bg-dark text-muted border-secondary">No classes.</div>';
    }
    const resourceBtn = document.getElementById('manageResourcesBtn');
    if (resourceBtn) resourceBtn.style.display = currentUserRole === 'ADMIN' ? 'inline-flex' : 'none';
    const manageVenuesBtn = document.getElementById('manageVenuesBtn');
    if (manageVenuesBtn) manageVenuesBtn.style.display = currentUserRole === 'ADMIN' ? 'inline-flex' : 'none';
}

function handleAddSubject(e) {
    e.preventDefault();
    if (!adminOnly()) return;
    const code = document.getElementById('newSubjectCode').value.trim().toUpperCase();
    const short = code; // Using code as short identifier since the separate short name field was removed
    const title = document.getElementById('newSubjectTitle').value.trim();
    const faculty = document.getElementById('newSubjectFaculty').value.trim();
    const venue = document.getElementById('newSubjectVenue').value.trim();
    const category = 'cat-theory'; // default to theory since the dropdown was removed

    if (adminResources.subjects.some(s => s.code === code) || courseReferenceList.some(s => s.code === code || s.short === short)) {
        alert('That subject code already exists.');
        return;
    }
    adminResources.subjects.push({ short, code, title, faculty, category, venue });
    saveAdminResources();
    mergeCustomSubjectsIntoCourseList();
    renderAdminResourcesUI();
    renderCourseRefTable();
    populateEditSubjectSelect();
    document.getElementById('addSubjectForm').reset();
    showToast('Subject Added', `${short} - ${title} is now available in Edit Period.`);
}


window.editAdminSubject = function(type, id) {
    if (!adminOnly()) return;
    
    // Find the subject
    let subject = null;
    let originalCode = null;
    if (type === 'custom') {
        subject = adminResources.subjects[id];
        originalCode = subject.code;
    } else {
        originalCode = id;
        let overrides = {};
        try { overrides = JSON.parse(localStorage.getItem('sece_builtin_subject_overrides') || '{}'); } catch(e){}
        subject = overrides[id];
        if (!subject) {
            // Need to find it from built-in defaults if not overridden yet. We can grab it from courseReferenceList
            subject = courseReferenceList.find(c => c.short === id || (c.code || '').startsWith(id));
            if (!subject) {
                // Hardcoded fallback for known built-ins if not in courseReferenceList
                const known = {
                    'SE': { code: 'SE', title: 'Software Engineering', faculty: 'Dr.S.K.Harikarthick', venue: 'SF 04' },
                    'JAVA': { code: 'JAVA', title: 'Java Programming', faculty: 'Mr.M.Karthickraja', venue: 'SF 04' },
                    'AIML': { code: 'AIML', title: 'Artificial Intelligence & ML', faculty: 'Dr.N.Saranya', venue: 'SF 04' },
                    'DM': { code: 'DM', title: 'Discrete Mathematics', faculty: 'Dr.N.Murugavelli', venue: 'SF 04' },
                    'DAA': { code: 'DAA', title: 'Design & Analysis of Algorithms', faculty: 'Mr.R.Karthick', venue: 'SF 04' },
                    'DBMS': { code: 'DBMS', title: 'Database Management Systems', faculty: 'Ms.E.Saranya', venue: 'SF 04' },
                    'UHV': { code: 'UHV', title: 'Universal Human Values', faculty: 'Dr.M.P.Sindhu', venue: 'SF 04' },
                    'COE': { code: 'COE', title: 'Center of Excellence', faculty: 'Domain Experts', venue: 'COE Lab' },
                    'SS': { code: 'SS', title: 'Soft Skills', faculty: 'Placement Team', venue: 'SF 04' },
                    'ALT': { code: 'ALT', title: 'Advanced Logical Thinking', faculty: 'Placement Team', venue: 'SF 05' },
                    'LIB': { code: 'LIB', title: 'Library Hour', faculty: '-', venue: 'Library' },
                    'TWM': { code: 'TWM', title: 'Tutor Ward Meeting', faculty: 'Class Advisor', venue: 'SF 04' },
                    'AIML LAB': { code: 'AIML LAB', title: 'AIML Laboratory', faculty: 'Dr.N.Saranya / Dr.M.Praveen', venue: 'Intel AI Lab' },
                    'JAVA LAB': { code: 'JAVA LAB', title: 'Java Programming Laboratory', faculty: 'Mr.M.Karthickraja / Mr.B.Saravanan', venue: 'Full Stack Lab' },
                    'SE LAB': { code: 'SE LAB', title: 'Software Engineering Laboratory', faculty: 'Dr.S.K.Harikarthick / Mr.P.Arunprakash', venue: 'Intel AI Lab' },
                    'DAA LAB': { code: 'DAA LAB', title: 'Design & Analysis Lab', faculty: 'Mr.R.Karthick / Ms.Rajeswari', venue: 'Full Stack Lab' },
                    'DBMS LAB': { code: 'DBMS LAB', title: 'Database Management Lab', faculty: 'Ms.E.Saranya / Dr.K.Suresh kumar', venue: 'Cloud & DevOps Lab' }
                };
                subject = known[id] || { code: id, title: id, faculty: '-', venue: '-' };
            } else {
                subject = { code: originalCode, title: subject.code, faculty: subject.faculty, venue: subject.venue };
            }
        }
    }
    
    if (!subject) return;

    let modal = document.getElementById('editSubjectModalDynamic');
    if (!modal) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="editSubjectModalDynamic" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content bg-dark text-white border-secondary">
                        <div class="modal-header border-secondary">
                            <h5 class="modal-title text-info"><i class="fa-solid fa-pen me-2"></i> Edit Subject</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="dynamicEditSubjectForm">
                                <input type="hidden" id="editSubjectOriginalCode">
                                <input type="hidden" id="editSubjectType">
                                <input type="hidden" id="editSubjectCustomIndex">
                                <div class="mb-2">
                                    <label class="form-label small">Subject Code (Cannot change for Built-in)</label>
                                    <input type="text" id="editSubjectCode" class="form-control form-control-sm bg-dark text-white border-secondary" required>
                                </div>
                                <div class="mb-2">
                                    <label class="form-label small">Subject Name</label>
                                    <input type="text" id="editSubjectTitle" class="form-control form-control-sm bg-dark text-white border-secondary" required>
                                </div>
                                <div class="mb-2">
                                    <label class="form-label small">Faculty incharge</label>
                                    <input type="text" id="editSubjectFaculty" class="form-control form-control-sm bg-dark text-white border-secondary" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label small">Venue</label>
                                    <input type="text" id="editSubjectVenue" class="form-control form-control-sm bg-dark text-white border-secondary">
                                </div>
                                <div class="text-end">
                                    <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" class="btn btn-sm btn-success">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        document.getElementById('dynamicEditSubjectForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const origCode = document.getElementById('editSubjectOriginalCode').value;
            const t = document.getElementById('editSubjectType').value;
            const customIdx = document.getElementById('editSubjectCustomIndex').value;
            
            const code = document.getElementById('editSubjectCode').value.trim().toUpperCase();
            const title = document.getElementById('editSubjectTitle').value.trim();
            const faculty = document.getElementById('editSubjectFaculty').value.trim();
            const venue = document.getElementById('editSubjectVenue').value.trim();
            
            if (t === 'custom') {
                adminResources.subjects[customIdx] = { ...adminResources.subjects[customIdx], code, short: code, title, faculty, venue };
                saveAdminResources();
                // Also update courseReferenceList
                const refIdx = courseReferenceList.findIndex(c => c.short === origCode);
                if(refIdx >= 0) {
                    courseReferenceList[refIdx] = { ...courseReferenceList[refIdx], short: code, code: `${code} ${title}`, faculty, venue };
                }
            } else {
                let overrides = {};
                try { overrides = JSON.parse(localStorage.getItem('sece_builtin_subject_overrides') || '{}'); } catch(e){}
                overrides[origCode] = { code, title, faculty, venue };
                localStorage.setItem('sece_builtin_subject_overrides', JSON.stringify(overrides));
            }
            
            bootstrap.Modal.getInstance(document.getElementById('editSubjectModalDynamic')).hide();
            renderAdminResourcesUI();
            renderCourseRefTable();
            populateEditSubjectSelect();
            if(window.renderFacultyPersonalTT) window.renderFacultyPersonalTT();
            showToast('Subject Updated', `${code} has been updated.`);
        });
    }
    
    document.getElementById('editSubjectOriginalCode').value = originalCode;
    document.getElementById('editSubjectType').value = type;
    document.getElementById('editSubjectCustomIndex').value = id; 
    
    const codeInput = document.getElementById('editSubjectCode');
    codeInput.value = subject.code || originalCode;
    codeInput.disabled = (type === 'builtin'); 
    
    document.getElementById('editSubjectTitle').value = subject.title || '';
    document.getElementById('editSubjectFaculty').value = subject.faculty || '';
    document.getElementById('editSubjectVenue').value = subject.venue || '';
    
    new bootstrap.Modal(document.getElementById('editSubjectModalDynamic')).show();
};

window.deleteAdminSubject = function(type, id) {
    if (!adminOnly()) return;
    
    if (type === 'custom') {
        if (!confirm('Are you sure you want to delete this custom subject?')) return;
        const removed = adminResources.subjects.splice(id, 1)[0];
        saveAdminResources();
        
        // Remove from course reference list
        const ci = courseReferenceList.findIndex(c => c.short === removed.short);
        if (ci >= 0) courseReferenceList.splice(ci, 1);
        
        renderAdminResourcesUI();
        renderCourseRefTable();
        populateEditSubjectSelect();
        showToast('Subject Deleted', `Custom subject removed.`);
    } else {
        if (!confirm('Are you sure you want to hide this built-in subject? It will not appear in the View Subjects list but will still function in the timetable.')) return;
        let hidden = [];
        try { hidden = JSON.parse(localStorage.getItem('sece_hidden_builtin_subjects') || '[]'); } catch(e){}
        if (!hidden.includes(id)) {
            hidden.push(id);
            localStorage.setItem('sece_hidden_builtin_subjects', JSON.stringify(hidden));
        }
        renderAdminResourcesUI();
        showToast('Subject Hidden', `Built-in subject hidden from list.`);
    }
};

window.editAdminVenue = function(type, id) {
    if (!adminOnly()) return;
    
    let venue = null;
    let originalName = null;
    
    if (type === 'custom') {
        venue = adminResources.venues[id];
        originalName = typeof venue === 'string' ? venue : venue.name;
        if (typeof venue === 'string') venue = { name: venue, type: '', block: '', capacity: '' };
    } else {
        originalName = id;
        let overrides = {};
        try { overrides = JSON.parse(localStorage.getItem('sece_builtin_venue_overrides') || '{}'); } catch(e){}
        venue = overrides[id] || { name: id, type: 'Built-in', block: '', capacity: '' };
    }

    let modal = document.getElementById('editVenueModalDynamic');
    if (!modal) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="editVenueModalDynamic" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content bg-dark text-white border-secondary">
                        <div class="modal-header border-secondary">
                            <h5 class="modal-title text-info"><i class="fa-solid fa-pen me-2"></i> Edit Venue</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="dynamicEditVenueForm">
                                <input type="hidden" id="editVenueOriginalName">
                                <input type="hidden" id="editVenueType">
                                <input type="hidden" id="editVenueCustomIndex">
                                <div class="mb-2">
                                    <label class="form-label small">Venue Name (Cannot change for Built-in)</label>
                                    <input type="text" id="editVenueName" class="form-control form-control-sm bg-dark text-white border-secondary" required>
                                </div>
                                <div class="mb-2">
                                    <label class="form-label small">Type (e.g., Lab, Lecture Hall)</label>
                                    <input type="text" id="editVenueTypeInput" class="form-control form-control-sm bg-dark text-white border-secondary">
                                </div>
                                <div class="mb-2">
                                    <label class="form-label small">Block</label>
                                    <input type="text" id="editVenueBlock" class="form-control form-control-sm bg-dark text-white border-secondary">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label small">Capacity</label>
                                    <input type="text" id="editVenueCapacity" class="form-control form-control-sm bg-dark text-white border-secondary">
                                </div>
                                <div class="text-end">
                                    <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" class="btn btn-sm btn-success">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        document.getElementById('dynamicEditVenueForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const origName = document.getElementById('editVenueOriginalName').value;
            const t = document.getElementById('editVenueType').value;
            const customIdx = document.getElementById('editVenueCustomIndex').value;
            
            const name = document.getElementById('editVenueName').value.trim();
            const typeVal = document.getElementById('editVenueTypeInput').value.trim();
            const block = document.getElementById('editVenueBlock').value.trim();
            const capacity = document.getElementById('editVenueCapacity').value.trim();
            
            if (t === 'custom') {
                adminResources.venues[customIdx] = { name, type: typeVal, block, capacity };
                saveAdminResources();
            } else {
                let overrides = {};
                try { overrides = JSON.parse(localStorage.getItem('sece_builtin_venue_overrides') || '{}'); } catch(e){}
                overrides[origName] = { name, type: typeVal, block, capacity };
                localStorage.setItem('sece_builtin_venue_overrides', JSON.stringify(overrides));
            }
            
            bootstrap.Modal.getInstance(document.getElementById('editVenueModalDynamic')).hide();
            renderAdminResourcesUI();
            showToast('Venue Updated', `${name} has been updated.`);
        });
    }

    document.getElementById('editVenueOriginalName').value = originalName;
    document.getElementById('editVenueType').value = type;
    document.getElementById('editVenueCustomIndex').value = id; 
    
    const nameInput = document.getElementById('editVenueName');
    nameInput.value = venue.name || originalName;
    nameInput.disabled = (type === 'builtin'); 
    
    document.getElementById('editVenueTypeInput').value = venue.type || '';
    document.getElementById('editVenueBlock').value = venue.block || '';
    document.getElementById('editVenueCapacity').value = venue.capacity || '';
    
    new bootstrap.Modal(document.getElementById('editVenueModalDynamic')).show();
};

window.deleteAdminVenue = function(type, id) {
    if (!adminOnly()) return;
    
    if (type === 'custom') {
        if (!confirm('Are you sure you want to delete this custom venue?')) return;
        adminResources.venues.splice(id, 1);
        saveAdminResources();
        renderAdminResourcesUI();
        showToast('Venue Deleted', `Custom venue removed.`);
    } else {
        if (!confirm('Are you sure you want to hide this built-in venue?')) return;
        let hidden = [];
        try { hidden = JSON.parse(localStorage.getItem('sece_hidden_builtin_venues') || '[]'); } catch(e){}
        if (!hidden.includes(id)) {
            hidden.push(id);
            localStorage.setItem('sece_hidden_builtin_venues', JSON.stringify(hidden));
        }
        renderAdminResourcesUI();
        showToast('Venue Hidden', `Built-in venue hidden from list.`);
    }
};


function importAdminSubjectExcel(event) {
    if (!adminOnly()) return;
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (rows.length < 2) {
                alert('The imported file is empty or missing headers.');
                return;
            }
            
            let addedCount = 0;
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;
                
                const code = String(row[0] || '').trim().toUpperCase();
                const title = String(row[1] || '').trim();
                const faculty = String(row[2] || '').trim();
                const venue = String(row[3] || '').trim();
                
                if (!code || !title) continue;
                
                const short = code;
                if (!adminResources.subjects.some(s => s.code === code) && 
                    !courseReferenceList.some(s => s.code === code || s.short === short)) {
                    adminResources.subjects.push({ short, code, title, faculty, category: 'cat-theory', venue });
                    addedCount++;
                }
            }
            
            if (addedCount > 0) {
                saveAdminResources();
                mergeCustomSubjectsIntoCourseList();
                renderAdminResourcesUI();
                renderCourseRefTable();
                populateEditSubjectSelect();
                showToast('Import Successful', `Successfully imported ${addedCount} subjects.`);
            } else {
                alert('No new subjects were imported. Ensure codes are unique and headers are correct.');
            }
        } catch (error) {
            console.error('Error parsing Excel:', error);
            alert('Error parsing the Excel file. Please ensure it is a valid .xlsx or .csv format.');
        }
    };
    reader.readAsBinaryString(file);
    event.target.value = '';
}

function removeAdminSubject(idx) {
    if (!adminOnly()) return;
    const removed = adminResources.subjects.splice(idx, 1)[0];
    saveAdminResources();
    const ci = courseReferenceList.findIndex(c => c.short === removed.short);
    if (ci >= 0) courseReferenceList.splice(ci, 1);
    renderAdminResourcesUI();
    renderCourseRefTable();
    populateEditSubjectSelect();
    showToast('Subject Removed', `${removed.short} was removed from custom resources.`);
}


function handleAdminAddClass(e) {
    e.preventDefault();
    if (!adminOnly()) return;
    const dept = document.getElementById('adminClassDept').value.trim();
    const name = document.getElementById('adminClassName').value.trim();
    const classroom = document.getElementById('adminClassRoom').value.trim();
    const capacityInput = document.getElementById('adminClassCapacity');
    const capacity = capacityInput ? parseInt(capacityInput.value) : 60;

    if (activeSections.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        alert('That class/section already exists.');
        return;
    }
    activeSections.push({ dept, name, classroom, capacity });
    saveSections();
    renderSectionsList();
    document.getElementById('adminClassForm').reset();
    showToast('Class Added', `${name} was saved.`);
}

function handleAddVenue(e) {
    e.preventDefault();
    if (!adminOnly()) return;
    const venueName = document.getElementById('newVenueName').value.trim();
    const type = document.getElementById('newVenueType') ? document.getElementById('newVenueType').value.trim() : '';
    const block = document.getElementById('newVenueBlock') ? document.getElementById('newVenueBlock').value.trim() : '';
    const capacity = document.getElementById('newVenueCapacity') ? document.getElementById('newVenueCapacity').value.trim() : '';
    
    if (!venueName) return;
    
    // Check built-in venues too
    const builtInVenueNames = new Set([
        'SF 04', 'SF 05', 'Library', 'Intel AI Lab', 'Full Stack Lab', 'Cloud & DevOps Lab', 'COE Lab', '1CloudHub'
    ]);
    courseReferenceList.forEach(c => { if(c.venue && c.venue !== '-' && c.venue !== 'TBD') builtInVenueNames.add(c.venue.trim().toLowerCase()); });
    activeSections.forEach(s => { if(s.classroom && s.classroom !== '-' && s.classroom !== 'TBD') builtInVenueNames.add(s.classroom.trim().toLowerCase()); });
    
    const isBuiltIn = builtInVenueNames.has(venueName.toLowerCase());
    const isCustom = adminResources.venues.some(v => (typeof v === 'string' ? v.toLowerCase() : v.name.toLowerCase()) === venueName.toLowerCase());
    
    if (isBuiltIn || isCustom) {
        alert('That venue already exists.');
        return;
    }
    
    const venueObj = { name: venueName, type: type, block: block, capacity: capacity };
    adminResources.venues.push(venueObj);
    saveAdminResources();
    renderAdminResourcesUI();
    populateEditVenueSelect();
    document.getElementById('adminVenueForm').reset();
    showToast('Venue Added', `${venueName} is now available in Edit Period.`);
}

function importAdminVenueExcel(event) {
    if (!adminOnly()) return;
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (rows.length < 2) {
                alert('The imported file is empty or missing headers.');
                return;
            }
            
            let addedCount = 0;
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;
                
                const venueName = String(row[0] || '').trim();
                const type = String(row[1] || '').trim();
                const block = String(row[2] || '').trim();
                const capacity = String(row[3] || '').trim();
                
                if (!venueName) continue;
                
                if (!adminResources.venues.some(v => (typeof v === 'string' ? v.toLowerCase() : (v.name || '').toLowerCase()) === venueName.toLowerCase())) {
                    adminResources.venues.push({ name: venueName, type: type, block: block, capacity: capacity });
                    addedCount++;
                }
            }
            
            if (addedCount > 0) {
                saveAdminResources();
                renderAdminResourcesUI();
                populateEditVenueSelect();
                showToast('Import Successful', `Successfully imported ${addedCount} venues.`);
            } else {
                alert('No new venues were imported. Ensure venue names are unique.');
            }
        } catch (error) {
            console.error('Error parsing Excel:', error);
            alert('Error parsing the Excel file. Please ensure it is a valid .xlsx or .csv format.');
        }
    };
    reader.readAsBinaryString(file);
    event.target.value = '';
}

function removeAdminVenue(idx) {
    if (!adminOnly()) return;
    const removed = adminResources.venues.splice(idx, 1)[0];
    saveAdminResources();
    renderAdminResourcesUI();
    populateEditVenueSelect();
    showToast('Venue Removed', `${removed} was removed.`);
}

function populateEditSubjectSelect() {
    const select = document.getElementById('editSubjectSelect');
    if (!select) return;
    const current = select.value;
    const defaults = [
        ['ALT', 'U23EM753 Advanced Logical Thinking (Placement Team)'],
        ['SE', 'U23IT481 Software Engineering'],
        ['JAVA', 'U23CS491 Java Programming'],
        ['AIML', 'U23AM495 Artificial Intelligence & ML'],
        ['DM', 'U23MA204 Discrete Mathematics'],
        ['DAA', 'U23CS403 Design & Analysis of Algorithms'],
        ['DBMS', 'U23CS404 Database Management Systems'],
        ['JAVA LAB', 'Full Stack Lab'],
        ['SE LAB', 'Intel AI Lab'],
        ['DAA LAB', 'Full Stack Lab'],
        ['DBMS LAB', 'Cloud & DevOps Lab'],
        ['COE', 'Center of Excellence'],
        ['UHV', 'Universal Human Values'],
        ['SS', 'Soft Skills'],
        ['LIB', 'Library'],
        ['TWM', 'Total Wellness Management'],
        ['AIML Project', 'Project Lab'],
        ['JAVA PROJECT', 'Full Stack Lab']
    ];
    const entries = [...defaults];
    adminResources.subjects.forEach(s => {
        if (!entries.some(e => e[0] === s.short)) entries.push([s.short, `${s.code} ${s.title}`]);
    });
    const datalist = document.getElementById('subjectOptions');
    if (datalist) {
        datalist.innerHTML = entries.map(([value, label]) =>
            `<option value="${value.replace(/"/g, '&quot;')}">${value} - ${label}</option>`
        ).join('');
    }
    if (current) select.value = current;
}

function populateEditVenueSelect() {
    const input = document.getElementById('editVenue');
    if (!input || input.tagName === 'SELECT') return;
    // Keep the existing editable text field while showing a datalist of saved venues.
    let dl = document.getElementById('savedVenueOptions');
    if (!dl) {
        dl = document.createElement('datalist');
        dl.id = 'savedVenueOptions';
        document.body.appendChild(dl);
        input.setAttribute('list', 'savedVenueOptions');
    }
    dl.innerHTML = adminResources.venues.map(v => `<option value="${v}"></option>`).join('');
}

// =========================
// PERSISTENT NOTIFICATION REGISTRATION (per logged-in user)
// =========================
function currentNotifKey() {
    const username = localStorage.getItem('sece_logged_in_user');
    return username ? 'sece_notif_' + username.toLowerCase() : null;
}

function loadNotificationRecord() {
    const key = currentNotifKey();
    if (!key) return null;
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error('Unable to load notification record:', error);
        return null;
    }
}

function saveNotificationRecord(record) {
    const key = currentNotifKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(record));
}

// Open modal, pre-filling with any previously saved registration
function openNotificationModal() {
    const record = loadNotificationRecord();
    if (record) {
        document.getElementById('notifName').value = record.name || '';
        document.getElementById('notifEmail').value = record.email || '';
        document.getElementById('notifPhone').value = record.phone || '';
        document.getElementById('prefClassAlert').checked = record.prefs?.classAlert !== false;
        document.getElementById('prefChangeAlert').checked = record.prefs?.changeAlert !== false;
        document.getElementById('prefWednesdayALT').checked = record.prefs?.wednesdayALT !== false;
    } else {
        document.getElementById('notifRegisterForm').reset();
    }
    const modal = new bootstrap.Modal(document.getElementById('notificationModal'));
    modal.show();
}

// Handle Notification Registration Submit
function handleNotificationRegister(e) {
    e.preventDefault();
    const name = document.getElementById('notifName').value;
    const email = document.getElementById('notifEmail').value;
    const phone = document.getElementById('notifPhone').value;
    const prefs = {
        classAlert: document.getElementById('prefClassAlert').checked,
        changeAlert: document.getElementById('prefChangeAlert').checked,
        wednesdayALT: document.getElementById('prefWednesdayALT').checked
    };

    saveNotificationRecord({ name, email, phone, prefs, registeredAt: new Date().toISOString() });
    renderNotificationStatus();

    const modalEl = document.getElementById('notificationModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    showToast('Registration Saved!', `${name} will get alerts at ${email} & ${phone}. Saved â€” visible next time you log in.`);
}

// Render the "My Notifications" status panel + bell button label
function renderNotificationStatus() {
    const panel = document.getElementById('notifStatusPanel');
    const bellLabel = document.getElementById('notifBellLabel');
    if (!panel) return;

    if (!currentUserRole) {
        panel.classList.add('d-none');
        return;
    }
    panel.classList.remove('d-none');

    const record = loadNotificationRecord();
    if (record) {
        if (bellLabel) bellLabel.innerText = 'Notifications Active';
        const activePrefs = [];
        if (record.prefs?.classAlert) activePrefs.push('15-min class reminder');
        if (record.prefs?.changeAlert) activePrefs.push('period-change alerts');
        if (record.prefs?.wednesdayALT) activePrefs.push('Wednesday ALT reminder');
        panel.className = 'alert alert-success py-2 px-3 border-0 rounded-3 mb-3 shadow-sm small';
        panel.innerHTML = `<i class="fa-solid fa-bell-on me-2"></i>
            <strong>Notifications ON</strong> for ${record.name} â€” ${record.email} / ${record.phone}.
            ${activePrefs.length ? 'Subscribed: ' + activePrefs.join(', ') + '.' : ''}
            <a href="#" class="ms-2" onclick="event.preventDefault(); openNotificationModal();">Update</a>`;
    } else {
        if (bellLabel) bellLabel.innerText = 'Register SMS / Email Alerts';
        panel.className = 'alert alert-secondary py-2 px-3 border-0 rounded-3 mb-3 shadow-sm small';
        panel.innerHTML = `<i class="fa-solid fa-bell-slash me-2"></i>
            You're not registered for SMS/Email alerts yet.
            <a href="#" class="ms-1" onclick="event.preventDefault(); openNotificationModal();">Register now</a>`;
    }
}

// Handle Forgot Password Submit
function handleForgotPasswordSubmit(e) {
    e.preventDefault();
    const userType = document.getElementById('fpUserType').value;
    const identifier = document.getElementById('fpIdentifier').value.trim().toLowerCase();
    const mobile = document.getElementById('fpMobile').value.replace(/\D/g, '');
    const newPassword = document.getElementById('fpNewPassword').value;
    const confirmPassword = document.getElementById('fpConfirmPassword').value;

    if (!isValidUsername(userType, identifier)) {
        alert(`Invalid username for ${userType}.`);
        return;
    }
    if (userType !== 'ADMIN' && !/^\d{10}$/.test(mobile)) {
        alert('Enter a valid 10-digit registered mobile number.');
        return;
    }
    if (!isLowercaseAlnum(newPassword) || !isLowercaseAlnum(confirmPassword) || newPassword.length < 4) {
        alert('Password must contain at least 4 lowercase letters/numbers and no spaces or symbols.');
        return;
    }
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    // For Admin, the fixed username is sufficient for the local demo.
    // For Student/Faculty, recovery requires the registered mobile number.
    if (userType === 'ADMIN') {
        if (identifier !== ADMIN_USERNAME) {
            alert('Invalid Admin username.');
            return;
        }
    } else {
        let record = null;
        if (userType === 'STUDENT') {
            record = studentsRoster.find(s => (s.username || buildGeneratedUsername('STUDENT', s.name)) === identifier);
            if (!record || String(record.phone || '').replace(/\D/g, '') !== mobile) {
                alert('The mobile number does not match the enrolled student account.');
                return;
            }
        } else if (userType === 'CLASS_ADVISOR') {
            record = staffDirectory.find(s => buildClassAdvisorUsername(s.name) === identifier);
            if (!record || (safetyNormalizePhone(record.phone) !== mobile && record.mobile !== mobile)) {
                alert('Class Advisor mobile number is not registered for this account. Ask Admin to register it first.');
                return;
            }
        } else {
            record = staffDirectory.find(s => buildGeneratedUsername('FACULTY', s.name) === identifier);
            if (!record || (safetyNormalizePhone(record.phone) !== mobile && record.mobile !== mobile)) {
                // Staff records in this original file do not contain phone numbers.
                // If a faculty mobile is not registered, recovery is denied rather than guessed.
                alert('Faculty mobile number is not registered for this account. Ask Admin to register it first.');
                return;
            }
        }
    }

    localStorage.setItem('sece_password_' + identifier, newPassword);

    const modalEl = document.getElementById('forgotPasswordModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    document.getElementById('forgotPasswordForm').reset();
    updateForgotPasswordHint();
    showToast('Password Reset Successfully!', `Password updated for ${userType} account ${identifier}.`);
}

function safetyNormalizePhone(value) {
    return String(value || '').replace(/\D/g, '');
}

function downloadTimetablePNG() {
    showToast('Generating Timetable PNG...', 'Capturing high-resolution image...');
    let element = document.getElementById('timetableCaptureArea');
    let fileName = `SRI_ESHWAR_TIMETABLE_${currentSection}_2026.png`;

    if (currentUserRole === 'FACULTY' && (!element || !element.offsetParent)) {
        element = document.getElementById('facultyPersonalTTArea');
        const uname = String(localStorage.getItem('sece_logged_in_user') || 'faculty').toUpperCase();
        fileName = `FACULTY_TIMETABLE_${uname}_2026.png`;
    }

    if (!element) {
        showToast('Download Error', 'No timetable visible to capture.');
        return;
    }

    html2canvas(element, {
        backgroundColor: '#0b0f17',
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('PNG Downloaded!', `Saved ${fileName} to your device.`);
    }).catch(err => {
        console.error(err);
        showToast('Download Error', 'Could not generate PNG image.');
    });
}

// Export Timetable as CSV
/* replaced */

// =============================================
// PERIOD NOTIFICATIONS â€” Backend API Storage
// Data is persisted to the database so ALL
// users (students, faculty, admin) see updates.
// =============================================
const PERIOD_NOTIFICATIONS_KEY = 'sece_period_notifications_v2'; // kept for legacy purge

// In-memory cache of notifications fetched from API
let _periodNotifCache = null;

async function fetchPeriodNotificationsFromAPI() {
    try {
        const res = await fetch('/api/operations/period-notifications');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        // Map backend PeriodNotification entity fields to frontend shape
        _periodNotifCache = data.map(n => ({
            _id: n.id,
            date: n.date,
            day: n.day || n.dayOfWeek || '',
            period: n.periodIndex,
            section: n.sectionName || '',
            originalFaculty: n.originalFaculty || '',
            staff: n.staff || '',
            subject: n.reason || '',
            reason: n.reason || '',
            venue: '',
            source: n.source || 'manual'
        })).filter(n => n.date >= todayDateStr());
        return _periodNotifCache;
    } catch (e) {
        console.warn('Period notifications API unavailable, using localStorage fallback:', e);
        try {
            const a = JSON.parse(localStorage.getItem(PERIOD_NOTIFICATIONS_KEY) || '[]');
            return Array.isArray(a) ? a : [];
        } catch (_) { return []; }
    }
}

function loadPeriodNotifications() {
    // Return the in-memory cache synchronously (populated by fetchPeriodNotificationsFromAPI)
    if (_periodNotifCache !== null) return _periodNotifCache.filter(n => n.date >= todayDateStr());
    // Fallback: localStorage
    try {
        const a = JSON.parse(localStorage.getItem(PERIOD_NOTIFICATIONS_KEY) || '[]');
        return Array.isArray(a) ? a : [];
    } catch (_) { return []; }
}

async function savePeriodNotificationToAPI(notif) {
    // Map frontend shape to backend PeriodNotification entity fields
    const payload = {
        date: notif.date,
        day: notif.day,
        periodIndex: notif.period,
        sectionName: notif.section || '',
        originalFaculty: notif.originalFaculty || '',
        staff: notif.staff || '',
        reason: notif.subject || notif.reason || '',
        source: notif.source || 'manual'
    };
    try {
        const res = await fetch('/api/operations/period-notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Save failed');
        const saved = await res.json();
        // Refresh cache
        await fetchPeriodNotificationsFromAPI();
        return saved;
    } catch (e) {
        console.warn('Could not save notification to API, saving to localStorage:', e);
        const arr = loadPeriodNotifications();
        arr.push(notif);
        localStorage.setItem(PERIOD_NOTIFICATIONS_KEY, JSON.stringify(arr));
    }
}

async function deletePeriodNotificationFromAPI(notif) {
    if (notif && notif._id) {
        try {
            await fetch('/api/operations/period-notifications/' + notif._id, { method: 'DELETE' });
            await fetchPeriodNotificationsFromAPI();
            return;
        } catch (e) { console.warn('Could not delete notification from API:', e); }
    }
    // Fallback: remove from localStorage
    const arr = loadPeriodNotifications().filter(n => n !== notif);
    localStorage.setItem(PERIOD_NOTIFICATIONS_KEY, JSON.stringify(arr));
}

function savePeriodNotifications(a) {
    // Keep localStorage in sync as a fallback
    localStorage.setItem(PERIOD_NOTIFICATIONS_KEY, JSON.stringify(a));
    if (_periodNotifCache !== null) _periodNotifCache = a;
}
function getDateForDayName(dayName) {
    const today = new Date();
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const target = names.indexOf(dayName);
    if (target < 0) return todayDateStr();
    const diff = (target - today.getDay() + 7) % 7;
    const d = new Date(today);
    d.setDate(today.getDate() + diff);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function purgeExpiredPeriodNotifications() {
    const today = todayDateStr();
    const all = loadPeriodNotifications();
    return all.filter(n => n.date >= today);
}
async function renderPeriodNotifications() {
    const el = document.getElementById('periodNotificationsList'); if (!el) return;
    el.innerHTML = '<div class="text-center text-muted py-3"><i class="fa-solid fa-spinner fa-spin me-2"></i>Loading notifications...</div>';
    await fetchPeriodNotificationsFromAPI();
    const arr = purgeExpiredPeriodNotifications();

    // Filter to only show notifications for the CURRENT view's Section if applicable, unless they don't have a section attached.
    let filteredArr = arr;
    // Only strictly filter by section for Students. Faculty and Admins need to see all active notifications.
    if (currentUserRole === 'STUDENT') {
        let studentSec = currentSection;
        if (typeof currentStudentRecord === 'function') {
            const rec = currentStudentRecord();
            if (rec && rec.sec) {
                studentSec = rec.sec;
            }
        }
        if (studentSec && studentSec !== '') {
            filteredArr = arr.filter(n => !n.section || n.section === studentSec || n.section === 'All');
        }
    }

    if (filteredArr.length === 0) {
        el.innerHTML = '<div class="text-muted">No period notifications found for any upcoming days.</div>';
        return;
    }

    let rowsHtml = filteredArr.map((n, i) => {
        const isLeave = n.source === 'leave';
        const canRemove = (currentUserRole === 'ADMIN' || currentUserRole === 'FACULTY');

        let facDisplay = '';
        if (isLeave) {
            facDisplay = `<span class="text-danger fw-bold">${n.originalFaculty}<br><span class="badge bg-danger mt-1">On Leave</span></span>`;
        } else if (n.source === 'manual') {
            facDisplay = `<strong>${n.staff || '-'}</strong>`;
        } else {
            facDisplay = `<span class="text-muted text-decoration-line-through">${n.originalFaculty || 'Unknown'}</span><br><i class="fa-solid fa-arrow-down text-warning my-1"></i><br><strong class="text-success">${n.staff}</strong>`;
        }

        const secStr = n.section || currentSection || '-';
        let year = '-', dept = '-', sec = '-';
        if (secStr !== '-' && secStr !== 'All') {
            const parts = secStr.split(' ');
            if (parts.length >= 3) {
                year = parts[0];
                sec = parts[parts.length - 1];
                dept = parts.slice(1, -1).join(' ');
            } else {
                dept = secStr;
            }
        }

        const btnHtml = canRemove ? `<button class="btn btn-sm btn-outline-danger" onclick="window.removePeriodNotification('${n._id || i}', ${n._id ? 'true' : 'false'})" title="Remove"><i class="fa-solid fa-trash"></i></button>` : '-';

        // Use alert-style backgrounds for rows
        const rowClass = isLeave ? 'table-danger' : (n.source === 'auto' ? 'table-warning' : 'table-info');

        return `
        <tr class="align-middle">
            <td class="fw-bold">${n.day}<br><small class="text-muted">${n.date}</small></td>
            <td><strong>${n.period}</strong></td>
            <td>${n.subject || n.reason || '-'}</td>
            <td>${facDisplay}</td>
            <td>${dept}</td>
            <td>${year}</td>
            <td>${sec}</td>
            <td>${n.venue || '-'}</td>
            <td>${btnHtml}</td>
        </tr>`;
    }).join('');

    el.innerHTML = `
    <div class="table-responsive">
        <table class="table table-dark table-sm table-bordered text-center align-middle mb-0">
            <thead class="table-secondary text-dark">
                <tr>
                    <th>Day</th>
                    <th>Period</th>
                    <th>Subject</th>
                    <th>Faculty</th>
                    <th>Dept</th>
                    <th>Year</th>
                    <th>Section</th>
                    <th>Venue</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
    </div>`;
}
window.handlePeriodNotification = async function (e) {
    e.preventDefault(); if (!(currentUserRole === 'ADMIN' || currentUserRole === 'FACULTY')) return;
    const day = document.getElementById('pnDay').value;
    const notif = {
        date: getDateForDayName(day),
        day,
        period: Number(document.getElementById('pnPeriod').value),
        subject: document.getElementById('pnSubject').value.trim(),
        department: document.getElementById('pnDepartment').value.trim(),
        section: document.getElementById('pnYearSection').value.trim(),
        venue: document.getElementById('pnVenue').value.trim(),
        staff: document.getElementById('pnStaff').value.trim(),
        source: 'manual'
    };
    await savePeriodNotificationToAPI(notif);
    e.target.reset();
    await renderPeriodNotifications();
    showToast('Notification Saved', 'The period notification has been saved and is visible to all users.');
}
window.removePeriodNotification = async function (id, isBackendId = false) {
    if (!(currentUserRole === 'ADMIN' || currentUserRole === 'FACULTY')) return;
    const a = purgeExpiredPeriodNotifications();
    let notifToDelete = null;

    if (isBackendId) {
        notifToDelete = a.find(n => String(n._id) === String(id));
    } else {
        notifToDelete = a[parseInt(id)];
    }

    if (notifToDelete) {
        await deletePeriodNotificationFromAPI(notifToDelete);
    }
    await renderPeriodNotifications();
}
document.addEventListener('shown.bs.modal', e => { if (e.target.id === 'studentDayNotificationModal') renderPeriodNotifications(); });

// Automatically create a student-only notification when Faculty/Admin changes
// the faculty assigned to a particular period. It is valid for that date only.
async function createFacultyChangeNotification(day, pIdx, originalSlot, updatedSlot, section) {
    if (!(currentUserRole === 'ADMIN' || currentUserRole === 'FACULTY')) return;
    const originalFaculty = (originalSlot && originalSlot.faculty || '').trim();
    const newFaculty = (updatedSlot && updatedSlot.faculty || '').trim();
    if (!originalFaculty || !newFaculty || originalFaculty === newFaculty) return;
    const date = getDateForDayName(day);
    const notif = {
        date, day, period: pIdx + 1, section, originalFaculty, staff: newFaculty,
        subject: 'Faculty/Admin changed the period assignment.', reason: 'Faculty/Admin changed the period assignment.', source: 'auto'
    };
    await savePeriodNotificationToAPI(notif);
}

// Toast Notification System
function showToast(title, message) {
    document.getElementById('toastTitle').innerText = title;
    document.getElementById('toastBody').innerText = message;
    document.getElementById('toastTime').innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const toastEl = document.getElementById('seceToast');
    const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
    toast.show();
}

// Expose all functions to window
window.normalizeNamePart = normalizeNamePart;
window.buildGeneratedUsername = buildGeneratedUsername;
window.buildClassAdvisorUsername = buildClassAdvisorUsername;
window.getClassAdvisorPassword = getClassAdvisorPassword;
window.buildGeneratedPassword = buildGeneratedPassword;
window.isLowercaseAlnum = isLowercaseAlnum;
window.getStoredPassword = getStoredPassword;
window.isValidUsername = isValidUsername;
window.usernameRuleText = usernameRuleText;
window.openLoginForm = openLoginForm;
window.backToRoleSelection = backToRoleSelection;
window.toggleLoginPassword = toggleLoginPassword;
window.handleRoleLogin = handleRoleLogin;
window.logoutUser = logoutUser;
window.openAccountSettingsModal = openAccountSettingsModal;
window.handleAccountSettingsSubmit = handleAccountSettingsSubmit;
window.updateForgotPasswordHint = updateForgotPasswordHint;
window.openForgotPasswordForLogin = openForgotPasswordForLogin;
window.restoreLoginSession = restoreLoginSession;
window.loadSavedStudents = loadSavedStudents;
window.saveStudents = saveStudents;
window.canManageStudents = canManageStudents;
window.ensureStudentManagementAccess = ensureStudentManagementAccess;
window.canManageSections = canManageSections;
window.ensureSectionManagementAccess = ensureSectionManagementAccess;

window.clearSavedStudents = clearSavedStudents;
window.loadSavedTimetable = loadSavedTimetable;
window.saveTimetableEdit = saveTimetableEdit;
window.loadSections = loadSections;
window.saveSections = saveSections;
window.loadStaffDirectory = loadStaffDirectory;
window.saveStaffDirectory = saveStaffDirectory;
window.loadSubstitutions = loadSubstitutions;
window.saveSubstitutions = saveSubstitutions;
window.todayDateStr = todayDateStr;
window.getTodayDayName = getTodayDayName;
window.substitutionKey = substitutionKey;
window.getSubstitutionFor = getSubstitutionFor;
window.canManageSubstitutions = canManageSubstitutions;
window.toggleSubstitutionUI = toggleSubstitutionUI;
window.renderStaffAvailability = renderStaffAvailability;
window.toggleStaffAvailability = toggleStaffAvailability;
window.populateSubPeriodOptions = populateSubPeriodOptions;
window.onSubPeriodChange = onSubPeriodChange;
window.populateSubstituteFacultyOptions = populateSubstituteFacultyOptions;
window.handleArrangeSubstitution = handleArrangeSubstitution;
window.renderTodaysSubstitutions = renderTodaysSubstitutions;
window.cancelSubstitution = cancelSubstitution;
window.loadCoverageRequests = loadCoverageRequests;
window.saveCoverageRequests = saveCoverageRequests;
window.findTodaysPeriodsForStaff = findTodaysPeriodsForStaff;
window.getMyStaffIdentity = getMyStaffIdentity;
window.setMyStaffIdentity = setMyStaffIdentity;
window.populateStaffIdentityDropdown = populateStaffIdentityDropdown;
window.onStaffIdentityChange = onStaffIdentityChange;
window.markMyselfOnLeave = markMyselfOnLeave;
window.cancelMyLeave = cancelMyLeave;
window.updateLeaveButtonState = updateLeaveButtonState;
window.requestToCover = requestToCover;
window.respondToCoverageRequest = respondToCoverageRequest;
window.renderCoverageRequests = renderCoverageRequests;
window.renderAdminLeaveNotifications = renderAdminLeaveNotifications;
window.initSubstitutionModal = initSubstitutionModal;
window.renderTimetableGrid = renderTimetableGrid;
window.createCell = createCell;
window.resetTimetableEdits = resetTimetableEdits;
window.renderCourseRefTable = renderCourseRefTable;
window.switchRole = switchRole;
window.openEditPeriodModal = openEditPeriodModal;
window.onSubjectSelectChange = onSubjectSelectChange;
window.setAsWednesdayALT = setAsWednesdayALT;
window.savePeriodChanges = savePeriodChanges;
window.quickAssignWednesdayALT = quickAssignWednesdayALT;
window.showTtPopup = function() {
    if (!currentSection || currentSection === '') {
        alert('Please select a Department and Section from the dropdowns first.');
        return;
    }
    const wrapper = document.getElementById('ttPopupOverlayWrapper');
    const closeBtn = document.getElementById('closeTtPopupBtn');
    if (wrapper && closeBtn) {
        wrapper.classList.remove('d-none');
        wrapper.classList.add('tt-fullscreen-modal');
        closeBtn.classList.remove('d-none');
    }
};
window.closeTtPopup = function() {
    const wrapper = document.getElementById('ttPopupOverlayWrapper');
    const closeBtn = document.getElementById('closeTtPopupBtn');
    if (wrapper && closeBtn) {
        wrapper.classList.remove('tt-fullscreen-modal');
        closeBtn.classList.add('d-none');
        const role = getEffectiveRole();
        if (role !== 'STUDENT') {
            wrapper.classList.add('d-none');
        }
    }
};

// --- Add Students Management ---
window.openManageStudentsModal = function () {
    loadRecentStudents();
};

window.parseStudentDisplayData = function(s) {
    let deptDisplay = s.dept || (s.department && (s.department.code || s.department.name)) || (typeof s.department === 'string' ? s.department : '-');
    let classDisplay = s.class || (typeof s.course === 'string' ? s.course : (s.course && (s.course.code || s.course.name))) || '-';
    let secDisplay = s.sec || (typeof s.section === 'string' ? s.section : (s.section && (s.section.sectionName || s.section.id))) || '-';
    let semDisplay = s.sem || s.semester || '-';

    if (secDisplay !== '-' && secDisplay.includes(' ')) {
        const parts = secDisplay.split(' ').filter(p => p.trim());
        if (parts.length >= 3) {
            if (classDisplay === '-') classDisplay = parts[0];
            if (deptDisplay === '-') deptDisplay = parts[1];
            secDisplay = parts.slice(2).join(' ');
        }
    }
    
    if (semDisplay === '-') {
        if (classDisplay === 'I') semDisplay = '1';
        else if (classDisplay === 'II') semDisplay = '3';
        else if (classDisplay === 'III') semDisplay = '5';
        else if (classDisplay === 'IV') semDisplay = '7';
    }

    return { deptDisplay, classDisplay, secDisplay, semDisplay };
};

async function loadRecentStudents() {
    try {
        const res = await apiFetch('/api/students');
        if (res.ok) {
            const data = await res.json();

            // Sync with main roster if API has data, otherwise keep local data
            if (data && data.length > 0) {
                studentsRoster = data.map(s => ({
                    id: s.id,
                    roll: s.registerNumber,
                    registerNumber: s.registerNumber,
                    name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
                    firstName: s.firstName,
                    lastName: s.lastName,
                    sec: s.section ? (s.section.sectionName || s.section.id) : '',
                    section: s.section,
                    email: s.email,
                    collegeEmail: s.collegeEmail,
                    phone: s.phone,
                    parentPhone1: s.parentPhone1,
                    parentPhone2: s.parentPhone2,
                    residentType: s.residentType,
                    hostelBlock: s.hostelBlock,
                    roomNumber: s.roomNumber,
                    username: s.user ? s.user.username : '',
                    semester: s.semester,
                    department: s.department,
                    course: s.course
                }));
                window.studentsRoster = studentsRoster;
            }

            renderStudentsRoster();

            const list = document.getElementById('manageStudentsList');
            if (list) {
                list.innerHTML = '';
                const displayData = data.length > 0 ? data : (window.studentsRoster || []);
                if (displayData.length === 0) {
                    list.innerHTML = '<tr><td colspan="14" class="text-center text-muted py-2">No students added yet.</td></tr>';
                    return;
                }
                displayData.reverse().forEach((s, idx) => {
                const tr = document.createElement('tr');
                const roll = s.registerNumber || s.roll || '-';
                const fName = s.firstName || s.name || '';
                const lName = s.lastName || '';
                const name = (fName + ' ' + lName).trim() || '-';
                
                // Extract dept, class, sec, sem from existing objects if available
                let deptDisplay = '-', classDisplay = '-', secDisplay = '-', semDisplay = '-';
                if (window.parseStudentDisplayData && s.registerNumber) {
                    const pd = window.parseStudentDisplayData(s);
                    deptDisplay = pd.deptDisplay; classDisplay = pd.classDisplay; secDisplay = pd.secDisplay; semDisplay = pd.semDisplay;
                } else {
                    secDisplay = s.section ? (s.section.sectionName || s.section.name) : (s.sec || '-');
                    if (secDisplay && secDisplay !== '-') {
                        const parts = secDisplay.split(' ');
                        if (parts.length >= 3) {
                            classDisplay = parts[0];
                            deptDisplay = parts[1];
                            secDisplay = parts.slice(2).join(' ');
                        }
                    }
                }

                tr.innerHTML = `
                    <td class="text-muted">${idx + 1}</td>
                    <td><code class="text-warning fw-bold">${roll}</code></td>
                    <td><strong>${name}</strong></td>
                    <td><small>${s.email || '-'}</small></td>
                    <td><small>${s.collegeEmail || '-'}</small></td>
                    <td>${s.phone || '-'}</td>
                    <td>${s.parentPhone1 || '-'}</td>
                    <td>${s.parentPhone2 || '-'}</td>
                    <td><span class="badge bg-primary">${deptDisplay}</span></td>
                    <td><small>${classDisplay}</small></td>
                    <td><span class="badge bg-secondary">${secDisplay}</span></td>
                    <td class="text-center">${s.semester || semDisplay}</td>
                    <td><small>${s.residentType || '-'}</small></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="window.editPersistentStudent(${s.id || `'${roll}'`})" title="Edit student"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="window.deletePersistentStudent(${s.id || `'${roll}'`})" title="Delete student"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                list.appendChild(tr);
            });
            }
        }
    } catch (err) {
        console.error(err);
        const list = document.getElementById('manageStudentsList');
        if (list) list.innerHTML = '<tr><td colspan="14" class="text-center text-danger py-2">Error loading students.</td></tr>';
    }
}

window._credDataCache = [];
window._credCurrentRole = 'STUDENT';

window.renderCredentialsList = async function() {
    const tbody = document.getElementById('credentialsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colSpan="6" class="text-center text-muted py-4"><span class="spinner-border spinner-border-sm me-2"></span>Loading credentials...</td></tr>';
    
    try {
        const token = localStorage.getItem('jwt_token') || '';
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        
        // Fetch all data in parallel
        const [credRes, studentRes, teacherRes] = await Promise.all([
            fetch('/api/admin/credentials', { headers }),
            fetch('/api/students', { headers }),
            fetch('/api/teachers', { headers })
        ]);
        
        let creds = [];
        let students = [];
        let teachers = [];
        
        if (credRes.ok) creds = await credRes.json();
        if (studentRes.ok) students = await studentRes.json();
        if (teacherRes.ok) teachers = await teacherRes.json();
        
        // Enhance credentials with extra info
        window._credDataCache = creds.map(c => {
            const extra = { name: '-', sectionDept: '-', isAdvisor: false };
            if (c.role === 'ROLE_STUDENT') {
                const s = students.find(x => (x.user && x.user.username === c.username) || x.username === c.username || x.registerNumber?.toLowerCase() === c.username);
                if (s) {
                    extra.name = s.name || s.studentName || s.firstName || '-';
                    extra.sectionDept = s.section ? s.section.sectionName : (s.department ? s.department.name : '-');
                }
            } else if (c.role === 'ROLE_FACULTY') {
                const t = teachers.find(x => (x.user && x.user.username === c.username) || x.username === c.username);
                if (t) {
                    extra.name = t.displayName || t.name || t.firstName || '-';
                    extra.sectionDept = t.department ? (t.department.name || t.department) : (t.dept || '-');
                    if (t.classAdvisorFor && t.classAdvisorFor.trim() !== '') {
                        extra.isAdvisor = true;
                    }
                }
            }
            return { ...c, ...extra };
        });
        
        // Switch to the default tab
        window.switchCredTab('STUDENT');
        
    } catch (e) {
        tbody.innerHTML = '<tr><td colSpan="6" class="text-center text-danger py-4">Error loading data.</td></tr>';
    }
};

window.switchCredTab = function(roleType) {
    window._credCurrentRole = roleType;
    document.getElementById('credTabStudents')?.classList.remove('active', 'text-white');
    document.getElementById('credTabFaculty')?.classList.remove('active', 'text-white');
    document.getElementById('credTabAdvisor')?.classList.remove('active', 'text-white');
    
    if (roleType === 'STUDENT') {
        document.getElementById('credTabStudents')?.classList.add('active', 'text-white');
    } else if (roleType === 'FACULTY') {
        document.getElementById('credTabFaculty')?.classList.add('active', 'text-white');
    } else if (roleType === 'CLASS_ADVISOR') {
        document.getElementById('credTabAdvisor')?.classList.add('active', 'text-white');
    }
    
    window.filterCredentials();
};

window.filterCredentials = function() {
    const tbody = document.getElementById('credentialsTableBody');
    if (!tbody || !window._credDataCache) return;
    
    const input = document.getElementById('credSearchInput');
    const query = input ? input.value.toLowerCase().trim() : '';
    
    // Filter by role
    let filtered = window._credDataCache.filter(c => {
        if (window._credCurrentRole === 'STUDENT') return c.role === 'ROLE_STUDENT';
        if (window._credCurrentRole === 'FACULTY') return c.role === 'ROLE_FACULTY';
        if (window._credCurrentRole === 'CLASS_ADVISOR') return c.role === 'ROLE_FACULTY' && c.isAdvisor;
        return false;
    });
    
    // Filter by query
    if (query) {
        filtered = filtered.filter(c => 
            (c.username && c.username.toLowerCase().includes(query)) ||
            (c.name && c.name.toLowerCase().includes(query)) ||
            (c.sectionDept && c.sectionDept.toLowerCase().includes(query))
        );
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colSpan="6" class="text-center text-muted py-4">No records found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map((c, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td class="fw-bold text-info">${c.username}</td>
            <td>${c.name}</td>
            <td>${c.sectionDept}</td>
            <td class="font-monospace text-warning">${c.rawPassword}</td>
            <td>${c.active === 'true' ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-danger">Inactive</span>'}</td>
        </tr>
    `).join('');
};

window.renderAdminFacultyDetails = async function() {
    const tbody = document.getElementById('adminFacultyDetailsBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colSpan="8" class="text-center text-muted py-4"><span class="spinner-border spinner-border-sm me-2"></span>Loading faculty data...</td></tr>';
    
    try {
        const token = localStorage.getItem('jwt_token') || '';
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        const res = await fetch('/api/teachers', { headers });
        if (res.ok) {
            window._allAdminFacultyCache = await res.json();
            window.lastLoadedFaculty = window._allAdminFacultyCache;
            window._renderAdminFacultyTable(window._allAdminFacultyCache);
        } else {
            tbody.innerHTML = '<tr><td colSpan="8" class="text-center text-danger py-4">Failed to load faculty details.</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colSpan="8" class="text-center text-danger py-4">Error connecting to server.</td></tr>';
    }
};

window.searchAdminFacultyDetails = function() {
    const input = document.getElementById('adminFacultySearchInput');
    if (!input || !window._allAdminFacultyCache) return;
    const query = input.value.toLowerCase().trim();
    if (!query) {
        window._renderAdminFacultyTable(window._allAdminFacultyCache);
        return;
    }
    const filtered = window._allAdminFacultyCache.filter(f => {
        return (f.name && f.name.toLowerCase().includes(query)) ||
               (f.collegeEmail && f.collegeEmail.toLowerCase().includes(query)) ||
               (f.user && f.user.username && f.user.username.toLowerCase().includes(query)) ||
               (f.displayName && f.displayName.toLowerCase().includes(query)) ||
               (f.department && f.department.name && f.department.name.toLowerCase().includes(query));
    });
    window._renderAdminFacultyTable(filtered);
};

window._renderAdminFacultyTable = function(facultyList) {
    const tbody = document.getElementById('adminFacultyDetailsBody');
    if (!tbody) return;
    if (!facultyList || facultyList.length === 0) {
        tbody.innerHTML = '<tr><td colSpan="5" class="text-center text-muted py-4"><i class="fa-solid fa-folder-open mb-2 fs-3 d-block text-secondary"></i>No faculty found.</td></tr>';
        return;
    }
    tbody.innerHTML = facultyList.map(t => {
        const dept = t.department ? (t.department.name || t.department) : (t.dept || '-');
        const name = ((t.firstName || '') + ' ' + (t.lastName || '')).trim() || t.name || '-';
        return `
            <tr>
                <td class="align-middle">
                    <div class="d-flex flex-column align-items-center justify-content-center h-100">
                        <span class="fw-bold text-info" style="font-size: 1.05rem;">${name}</span>
                        <span class="badge bg-secondary mt-1">${t.employeeId || 'No ID'}</span>
                    </div>
                </td>
                <td class="align-middle">
                    <div class="d-flex flex-column justify-content-center h-100">
                        <span class="fw-bold text-light">${dept}</span>
                        <span class="text-muted small mt-1"><i class="fa-solid fa-book text-warning me-1"></i>${t.subjectHandling || 'N/A'}</span>
                    </div>
                </td>
                <td>
                    <div class="d-flex flex-column gap-1 text-start align-items-start justify-content-center h-100 ps-3">
                        <span class="small" title="College Email"><i class="fa-solid fa-envelope text-primary me-2"></i>${t.collegeEmail || '-'}</span>
                        <span class="small text-muted" title="Personal Email"><i class="fa-regular fa-envelope me-2"></i>${t.personalEmail || t.email || '-'}</span>
                    </div>
                </td>
                <td>
                    <div class="d-flex flex-column gap-1 text-start align-items-start justify-content-center h-100 ps-3">
                        <span class="small" title="Primary Mobile"><i class="fa-solid fa-phone text-success me-2"></i>${t.phone1 || t.phone || '-'}</span>
                        ${t.phone2 ? `<span class="small text-muted" title="Secondary Mobile"><i class="fa-solid fa-mobile-screen me-2"></i>${t.phone2}</span>` : ''}
                    </div>
                </td>
                <td class="align-middle">
                    <div class="d-flex gap-2 justify-content-center">
                        <button class="btn btn-sm btn-outline-warning py-1 px-2" onclick="editPersistentFaculty(${t.id || `'${t.name}'`})" title="Edit Faculty">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger py-1 px-2" onclick="deletePersistentFaculty(${t.id || `'${t.name}'`})" title="Delete Faculty">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

window.loadAdminFullFaculty = async function () {
    const adminBody = document.getElementById('adminViewFacultyBody');

    try {
        const res = await apiFetch('/api/teachers');
        if (res.ok) {
            const data = await res.json();

            const renderRows = () => {
                const displayData = data.length > 0 ? data : (window.staffDirectory || []);
                window.lastLoadedFaculty = displayData; // Save for editing
                if (displayData.length === 0) return '<tr><td colspan="9" class="text-center text-muted">No faculty records found.</td></tr>';
                return displayData.map(t => `
                    <tr>
                        <td>${t.employeeId || '-'}</td>
                        <td>${((t.firstName || '') + ' ' + (t.lastName || '')).trim() || t.name || '-'}</td>
                        <td>${t.department ? (t.department.name || t.department) : (t.dept || '-')}</td>
                        <td>${t.subjectHandling || '-'}</td>
                        <td>${t.personalEmail || t.email || '-'}</td>
                        <td>${t.collegeEmail || '-'}</td>
                        <td>${t.phone1 || t.phone || '-'}</td>
                        <td>${t.phone2 || '-'}</td>
                        <td>
                            <div class="d-flex gap-1 justify-content-center">
                                <button class="btn btn-sm btn-outline-warning py-0 px-1" onclick="editPersistentFaculty(${t.id || `'${t.name}'`})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                                <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="deletePersistentFaculty(${t.id || `'${t.name}'`})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            };

            if (adminBody) adminBody.innerHTML = renderRows();
        }
    } catch (err) {
        if (adminBody) adminBody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error loading faculty details.</td></tr>';
    }
};

window.editPersistentFaculty = function(id) {
    if (!window.lastLoadedFaculty) return;
    const t = window.lastLoadedFaculty.find(f => f.id === id || f.name === id);
    if (!t) return;
    
    try {
        const m1 = bootstrap.Modal.getInstance(document.getElementById('adminFacultyDetailsModal'));
        if (m1) m1.hide();
        const m2 = bootstrap.Modal.getInstance(document.getElementById('adminViewFacultyModal'));
        if (m2) m2.hide();
        const m3 = bootstrap.Modal.getInstance(document.getElementById('manageFacultyModal'));
        if (m3) m3.hide();
    } catch(e) {}
    
    window.currentEditFacultyDepartment = t.department;
    
    document.getElementById('editFacultyId').value = t.id || '';
    document.getElementById('editFacultyEmpId').value = t.employeeId || '';
    document.getElementById('editFacultyFirstName').value = t.firstName || (t.name ? t.name.split(' ')[0] : '');
    document.getElementById('editFacultyLastName').value = t.lastName || (t.name ? t.name.substring(t.name.indexOf(' ')+1) : '');
    document.getElementById('editFacultyDept').value = t.department ? (t.department.name || t.department) : (t.dept || '');
    document.getElementById('editFacultySubject').value = t.subjectHandling || '';
    document.getElementById('editFacultyPersonalEmail').value = t.personalEmail || t.email || '';
    document.getElementById('editFacultyCollegeEmail').value = t.collegeEmail || '';
    document.getElementById('editFacultyPhone1').value = t.phone1 || t.phone || '';
    document.getElementById('editFacultyPhone2').value = t.phone2 || '';
    
    const modal = new bootstrap.Modal(document.getElementById('editFacultyModal'));
    modal.show();
};

window.saveEditFaculty = async function() {
    const id = document.getElementById('editFacultyId').value;
    if (!id) {
        alert("Cannot update faculty without an ID.");
        return;
    }
    
    const deptInput = document.getElementById('editFacultyDept').value.trim();
    let deptObj = window.currentEditFacultyDepartment;
    if (typeof deptObj === 'string' || !deptObj) {
        deptObj = { name: deptInput };
    } else {
        deptObj = { ...deptObj, name: deptInput };
    }
    
    const payload = {
        employeeId: document.getElementById('editFacultyEmpId').value.trim(),
        firstName: document.getElementById('editFacultyFirstName').value.trim(),
        lastName: document.getElementById('editFacultyLastName').value.trim(),
        department: deptObj, 
        subjectHandling: document.getElementById('editFacultySubject').value.trim(),
        personalEmail: document.getElementById('editFacultyPersonalEmail').value.trim(),
        collegeEmail: document.getElementById('editFacultyCollegeEmail').value.trim(),
        phone1: document.getElementById('editFacultyPhone1').value.trim(),
        phone2: document.getElementById('editFacultyPhone2').value.trim()
    };
    
    try {
        const res = await apiFetch(`/api/teachers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            showToast('Success', 'Faculty details updated successfully.', 'success');
            const m = bootstrap.Modal.getInstance(document.getElementById('editFacultyModal'));
            if(m) m.hide();
            
            // Refresh data from backend
            if (window.loadAdminFullFaculty) await window.loadAdminFullFaculty();
            
            // Re-open search modal and trigger search to show updated changes
            try {
                const adminFacModal = new bootstrap.Modal(document.getElementById('adminFacultyDetailsModal'));
                adminFacModal.show();
                if (window.searchAdminFacultyDetails) window.searchAdminFacultyDetails();
            } catch(e){}
        } else {
            alert('Failed to update faculty details. ' + await res.text());
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred while updating.');
    }
};


window.deletePersistentFaculty = async function (id) {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;
    try {
        const res = await apiFetch(`/api/teachers/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert('Faculty deleted.');
            if (window.loadAdminFullFaculty) loadAdminFullFaculty();
            if (window.renderAdminFacultyDetails) renderAdminFacultyDetails();
        } else {
            alert('Failed to delete faculty.');
        }
    } catch (err) {
        console.error(err);
    }
};

document.getElementById('adminViewFacultyModal')?.addEventListener('show.bs.modal', () => {
    loadAdminFullFaculty();
});

document.getElementById('manageFacultyModal')?.addEventListener('show.bs.modal', () => {
    loadAdminFullFaculty();
});

document.getElementById('manageStudentsModal')?.addEventListener('show.bs.modal', () => {
    loadRecentStudents();
    populateStudentFormDataLists();
});

document.getElementById('manageRosterModal')?.addEventListener('show.bs.modal', () => {
    loadRecentStudents();
});

// Populate Department, Course & Section datalists from the API
async function populateStudentFormDataLists() {
    // --- Departments ---
    try {
        const deptDatalist = document.getElementById('deptDatalist');
        if (deptDatalist && deptDatalist.options.length === 0) {
            const res = await apiFetch('/api/departments');
            if (res.ok) {
                const depts = await res.json();
                deptDatalist.innerHTML = depts
                    .map(d => `<option value="${d.code || d.name}">${d.name}</option>`)
                    .join('');
            }
        }
    } catch (e) { console.error('Failed to load departments', e); }

    // --- Sections ---
    try {
        const secDatalist = document.getElementById('sectionDatalist');
        if (secDatalist && secDatalist.options.length === 0) {
            const res = await apiFetch('/api/sections');
            if (res.ok) {
                const sections = await res.json();
                secDatalist.innerHTML = sections
                    .map(s => `<option value="${s.sectionName}">${s.sectionName}</option>`)
                    .join('');

                // Also populate courses from sections (unique course names)
                const courseDatalist = document.getElementById('courseDatalist');
                if (courseDatalist) {
                    const uniqueCourses = [...new Map(
                        sections
                            .filter(s => s.course)
                            .map(s => [s.course.code || s.course.name, s.course])
                    ).values()];
                    courseDatalist.innerHTML = uniqueCourses
                        .map(c => `<option value="${c.code || c.name}">${c.name}</option>`)
                        .join('');
                }
            }
        }
    } catch (e) { console.error('Failed to load sections', e); }
}

window.submitManageStudentForm = async function (e) {
    const fName = document.getElementById('msFirstName').value;
    const lName = document.getElementById('msLastName').value;
    const regNo = document.getElementById('msRegNo').value;
    const email = document.getElementById('msEmail').value;
    const collegeEmail = document.getElementById('msCollegeEmail').value;
    const phone = document.getElementById('msPhone').value;
    const parentPhone1 = document.getElementById('msParentPhone1').value;
    const parentPhone2 = document.getElementById('msParentPhone2').value;
    const deptId = document.getElementById('msDept').value;
    const courseId = document.getElementById('msCourse').value;
    const secId = document.getElementById('msSection').value;
    const semester = document.getElementById('msSemester').value;
    const residentType = document.getElementById('msResidentType').value;

    const alertBox = document.getElementById('manageStudentsAlert');
    alertBox.classList.remove('d-none', 'alert-success', 'alert-danger');

    const nameParts = fName.trim().split(/\s+/);
    const firstName = nameParts[0] || fName;
    const lastName = lName.trim() || nameParts.slice(1).join(' ') || firstName;

    const deptCourseMap = {
        'CSE': 'BTECH-CSE',
        'IT': 'BTECH-IT',
        'AI&DS': 'BTECH-AIDS',
        'AI&ML': 'BTECH-AIML',
        'ECE': 'BTECH-ECE'
    };
    const actualCourseId = deptCourseMap[deptId] || 'BTECH-' + deptId;
    const fullSectionName = courseId + ' ' + deptId + ' ' + secId;

    const payload = {
        firstName: firstName,
        lastName: lastName,
        registerNumber: regNo,
        email: email || collegeEmail,
        collegeEmail: collegeEmail,
        phone: phone,
        parentPhone1: parentPhone1,
        parentPhone2: parentPhone2 || null,
        residentType: residentType,
        semester: parseInt(semester),
        department: { name: deptId },
        course: { name: actualCourseId },
        section: { sectionName: fullSectionName }
    };

    try {
        const res = await apiFetch('/api/students', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alertBox.classList.add('alert-success');
            alertBox.innerText = 'Student added successfully!';
            document.getElementById('manageStudentsForm').reset();
            loadRecentStudents();
        } else {
            const errText = await res.text();
            alertBox.classList.add('alert-danger');
            alertBox.innerText = errText || 'Failed to add student. Please check the details and try again.';
        }
    } catch (err) {
        alertBox.classList.add('alert-danger');
        alertBox.innerText = 'Error connecting to server.';
    }
};

window.submitAddFacultyForm = async function (e) {
    e.preventDefault();
    const fName = document.getElementById('mfFirstName').value;
    const lName = document.getElementById('mfLastName').value;
    const personalEmail = document.getElementById('mfPersonalEmail').value;
    const collegeEmail = document.getElementById('mfCollegeEmail').value;
    const phone1 = document.getElementById('mfPhone1').value;
    const phone2 = document.getElementById('mfPhone2').value;
    const dept = document.getElementById('mfDept').value;
    const subject = document.getElementById('mfSubjectHandling').value;
    const alertBox = document.getElementById('manageFacultyAlert');

    const payload = {
        employeeId: tempEmpId,
        firstName: fName,
        lastName: lName,
        personalEmail: personalEmail,
        collegeEmail: collegeEmail,
        phone1: phone1,
        phone2: phone2,
        subjectHandling: subject,
        department: { code: dept }
    };

    try {
        const res = await apiFetch('/api/teachers', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alertBox.classList.add('alert-success');
            alertBox.innerText = 'Faculty member added successfully! User account provisioned.';
            document.getElementById('manageFacultyForm').reset();
        } else {
            alertBox.classList.add('alert-danger');
            alertBox.innerText = 'Failed to add faculty member.';
        }
    } catch (err) {
        alertBox.classList.add('alert-danger');
        alertBox.innerText = 'Error connecting to server.';
    }
};

window.deletePersistentStudent = async function (id) {
    if (!confirm('Are you sure you want to delete this student permanently?')) return;
    try {
        const res = await apiFetch(`/api/students/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert('Student deleted.');
            loadRecentStudents();
            const idx = studentsRoster.findIndex(st => st.id === id);
            if (idx !== -1) {
                studentsRoster.splice(idx, 1);
                saveStudents();
            }
            renderStudentsRoster();
            // Refresh Class Advisor Modal if open
            if (document.getElementById('studentDetailsOnlyBody')) {
                const sec = document.getElementById('classAdvisorClassSelect')?.value;
                if (sec) openClassAdvisorModal(sec);
            }
        } else {
            alert('Failed to delete student.');
        }
    } catch (err) {
        console.error(err);
    }
}

window.showAdminLeaveNotif = function () {
    showToast('Notifications', 'This notification will alert concerned staff about the faculty substitution or leave.');
};
window.onFilterChange = onFilterChange;
window.currentStudentRecord = currentStudentRecord;
window.maskStudentPhone = maskStudentPhone;
window.renderStudentsRoster = renderStudentsRoster;
window.saveFacultyEmail = saveFacultyEmail;
window.toggleAddStudentForm = toggleAddStudentForm;
window.handleAddStudent = handleAddStudent;
window.removeStudent = removeStudent;
window.populateSectionSelects = populateSectionSelects;
window.renderSectionsList = renderSectionsList;
window.handleAddSection = handleAddSection;
window.removeSection = removeSection;
window.handleClassAdvisorLogin = handleClassAdvisorLogin;
window.renderClassAdvisorStudents = renderClassAdvisorStudents;
window.openStudentDetailsModal = openStudentDetailsModal;
window.openAddStudentFromDetails = openAddStudentFromDetails;
window.removeStudentDetails = removeStudentDetails;
window.renderFacultyDetailsView = renderFacultyDetailsView;
window.saveFacultyDetailsView = saveFacultyDetailsView;
window.openStudentProfileModal = openStudentProfileModal;
window.adminOnly = adminOnly;
window.loadAdminResources = loadAdminResources;
window.saveAdminResources = saveAdminResources;
window.mergeCustomSubjectsIntoCourseList = mergeCustomSubjectsIntoCourseList;
window.renderAdminResourcesUI = renderAdminResourcesUI;
window.handleAddSubject = handleAddSubject;
window.importAdminSubjectExcel = importAdminSubjectExcel;
window.removeAdminSubject = removeAdminSubject;
window.editAdminSubject = window.editAdminSubject;
window.saveEditSubject = window.saveEditSubject;
window.deleteAdminSubject = window.deleteAdminSubject;
window.handleAdminAddClass = handleAdminAddClass;
window.handleAddVenue = handleAddVenue;
window.importAdminVenueExcel = importAdminVenueExcel;
window.removeAdminVenue = removeAdminVenue;
window.populateEditSubjectSelect = populateEditSubjectSelect;
window.populateEditVenueSelect = populateEditVenueSelect;
window.currentNotifKey = currentNotifKey;
window.loadNotificationRecord = loadNotificationRecord;
window.saveNotificationRecord = saveNotificationRecord;
window.openNotificationModal = openNotificationModal;
window.handleNotificationRegister = handleNotificationRegister;
window.renderNotificationStatus = renderNotificationStatus;
window.handleForgotPasswordSubmit = handleForgotPasswordSubmit;
window.safetyNormalizePhone = safetyNormalizePhone;
window.downloadTimetablePNG = downloadTimetablePNG;
window.exportTimetableCSV = exportTimetableCSV;
window.loadPeriodNotifications = loadPeriodNotifications;
window.savePeriodNotifications = savePeriodNotifications;
window.getDateForDayName = getDateForDayName;
window.purgeExpiredPeriodNotifications = purgeExpiredPeriodNotifications;
window.renderPeriodNotifications = renderPeriodNotifications;
window.createFacultyChangeNotification = createFacultyChangeNotification;
window.showToast = showToast;

window.updateBannerHeaders = function(targetSec) {
    let metaBatch = null;
    let metaSemStr = null;
    let metaAyStr = null;
    
    if (targetSec) {
        try {
            const ttStr = localStorage.getItem('sece_tt_built_' + targetSec);
            if (ttStr) {
                const ttData = JSON.parse(ttStr);
                if (ttData && ttData.metadata) {
                    const b = parseInt(ttData.metadata.batch);
                    if (!isNaN(b)) {
                        metaBatch = `${b} - ${b + 4}`;
                        
                        const y = parseInt(ttData.metadata.year);
                        const s = parseInt(ttData.metadata.semester);
                        
                        if (!isNaN(y) && !isNaN(s)) {
                            const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
                            metaSemStr = `${roman[y] || y} Year / ${roman[s] || s} Semester`;
                            
                            const ayStart = b + y - 1;
                            metaAyStr = `${ayStart} - ${ayStart + 1}`;
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error reading timetable metadata", e);
        }
    }

    const batchTextHeader = document.getElementById('batchTextHeader');
    const batchTextHeaderStudents = document.getElementById('batchTextHeaderStudents');
    const semTextHeader = document.getElementById('semTextHeader');
    const semTextHeaderStudents = document.getElementById('semTextHeaderStudents');
    const ayTextHeader = document.getElementById('ayTextHeader');
    const ayTextHeaderStudents = document.getElementById('ayTextHeaderStudents');

    function setHeader(el, metaValue, globalKey, defaultVal) {
        if (!el) return;
        el.contentEditable = false;
        if (metaValue) {
            if (el.tagName === 'INPUT') el.value = metaValue;
            else el.innerText = metaValue;
        } else {
            const customVal = localStorage.getItem(globalKey);
            if (customVal) {
                if (el.tagName === 'INPUT') el.value = customVal;
                else el.innerText = customVal;
            } else if (defaultVal) {
                if (el.tagName === 'INPUT') el.value = defaultVal;
                else el.innerText = defaultVal;
            }
        }
    }

    setHeader(batchTextHeader, metaBatch, 'sece_global_custom_batch', '2024 - 2028');
    setHeader(batchTextHeaderStudents, metaBatch, 'sece_global_custom_batch', '2024 - 2028');
    setHeader(semTextHeader, metaSemStr, 'sece_global_custom_sem', 'II Year / III Semester');
    setHeader(semTextHeaderStudents, metaSemStr, 'sece_global_custom_sem', 'II Year / III Semester');
    setHeader(ayTextHeader, metaAyStr, 'sece_global_custom_ay', '2026 - 2027');
    setHeader(ayTextHeaderStudents, metaAyStr, 'sece_global_custom_ay', '2026 - 2027');
};

window.saveBatchSemEdit = function () {
    const batchInput = document.getElementById('modalBatchInputStandalone') || document.getElementById('modalBatchInput');
    const yearSelect = document.getElementById('modalYearSelectStandalone') || document.getElementById('modalYearSelect');
    const semSelect = document.getElementById('modalSemSelectStandalone') || document.getElementById('modalSemSelect');
    const ayInput = document.getElementById('modalAcademicYearStandalone') || document.getElementById('modalAcademicYear');
    
    const batchStart = batchInput ? parseInt(batchInput.value) || 2024 : 2024;
    const year = yearSelect ? yearSelect.value : "III Year";
    const sem = semSelect ? semSelect.value : "III Semester";

    // Allow overriding academic year if they typed something manually
    let ay = ayInput ? ayInput.value.trim() : "";
    if (!ay) {
        const ayStart = batchStart + 2;
        ay = `${ayStart} - ${ayStart + 1}`;
    }

    const batchText = `${batchStart} - ${batchStart + 4}`;
    const semText = sem; // E.g. "III Semester"

    const batchSpan = document.getElementById('batchTextHeader');
    if (batchSpan) batchSpan.innerText = batchText;
    const batchSpanStudents = document.getElementById('batchTextHeaderStudents');
    if (batchSpanStudents) batchSpanStudents.innerText = batchText;

    const semSpan = document.getElementById('semTextHeader');
    if (semSpan) semSpan.innerText = semText;
    const semSpanStudents = document.getElementById('semTextHeaderStudents');
    if (semSpanStudents) semSpanStudents.innerText = semText;

    const aySpan = document.getElementById('ayTextHeader');
    if (aySpan) {
        if (aySpan.tagName === 'INPUT') aySpan.value = ay;
        else aySpan.innerText = ay;
    }
    const aySpanStudents = document.getElementById('ayTextHeaderStudents');
    if (aySpanStudents) aySpanStudents.innerText = ay;

    localStorage.setItem('sece_global_custom_batch', batchText);
    localStorage.setItem('sece_global_custom_sem', semText);
    localStorage.setItem('sece_global_custom_ay', ay);

    showToast('Success', 'Global timetable details updated.');
};

// Fix for Bootstrap modal aria-hidden focus warning
document.addEventListener('hide.bs.modal', function (event) {
    if (document.activeElement) {
        document.activeElement.blur();
    }
});

window.onRosterFilterChange = function () {
    renderEnrolledStudentsRoster();
};

function renderEnrolledStudentsRoster() {
    const tbody = document.getElementById('enrolledStudentsRosterBody');
    if (!tbody) return;

    const filterDept = document.getElementById('rosterFilterDept')?.value || '';
    const filterYear = document.getElementById('rosterFilterYear')?.value || '';
    const filterSection = document.getElementById('rosterFilterSection')?.value || '';

    let visibleStudents = typeof studentsRoster !== 'undefined' ? studentsRoster : [];

    if (filterDept) {
        visibleStudents = visibleStudents.filter(s => {
            const dept = s.department ? (s.department.code || s.department.name) : (s.dept || '');
            return dept.toLowerCase() === filterDept.toLowerCase();
        });
    }

    if (filterYear) {
        visibleStudents = visibleStudents.filter(s => {
            const sem = String(s.semester || s.sem || '');
            if (filterYear === 'I') return sem === '1' || sem === '2';
            if (filterYear === 'II') return sem === '3' || sem === '4';
            if (filterYear === 'III') return sem === '5' || sem === '6';
            if (filterYear === 'IV') return sem === '7' || sem === '8';
            return true;
        });
    }

    if (filterSection) {
        visibleStudents = visibleStudents.filter(s => {
            const sn = (s.section && (s.section.sectionName || s.section.name)) || s.sec || '';
            return sn.toLowerCase() === filterSection.toLowerCase();
        });
    }

    const countEl = document.getElementById('rosterCount');
    if (countEl) countEl.innerText = visibleStudents.length;

    tbody.innerHTML = '';

    if (visibleStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">No students found matching the selected filters.</td></tr>';
        return;
    }

    visibleStudents.forEach((s, idx) => {
        const tr = document.createElement('tr');
        const roll = s.registerNumber || s.roll || '-';
        const name = s.firstName ? s.firstName + ' ' + (s.lastName || '') : (s.name || '-');
        const sec = s.section ? (s.section.sectionName || s.section.name) : (s.sec || '-');
        const email = s.collegeEmail || s.email || '-';
        const phone = s.phone || '-';

        // Pass the correct ID for deletion
        const deleteArg = s.id ? s.id : `'${roll}'`;

        tr.innerHTML = `
            <td><strong class="text-info">${roll}</strong></td>
            <td>${name}</td>
            <td><span class="badge bg-secondary">${sec}</span></td>
            <td><small>${email}</small></td>
            <td>${phone}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-danger py-0" onclick="window.deletePersistentStudent(${deleteArg})" title="Delete student"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
window.renderEnrolledStudentsRoster = renderEnrolledStudentsRoster;

// Helper: get the localStorage key for the logged-in faculty's personal TT
function _getFacultyTTKey() {
    const uname = String(localStorage.getItem('sece_logged_in_user') || 'faculty').toLowerCase();
    return 'faculty_personal_tt_' + uname;
}

/* replaced */

// Render the saved faculty personal TT as a read-only panel in the faculty dashboard
/* replaced */

window.searchUserCredentials = async function() {
    const input = document.getElementById('credentialSearchInput');
    const query = input ? input.value.trim().toLowerCase() : '';
    
    const fetchFn = (typeof apiFetch === 'function') ? apiFetch : fetch;
    
    // Students
    const studentsTbody = document.getElementById('credStudentsList');
    if (studentsTbody) {
        studentsTbody.innerHTML = '<tr><td colSpan="4" class="text-center text-muted py-4">Loading students...</td></tr>';
        let students = [];
        try {
            const res = await fetchFn('/api/students');
            if (res.ok) students = await res.json();
        } catch (e) { console.warn("Failed to load students for credentials view", e); }
        
        const filtered = query ? students.filter(s => 
            (s.roll && String(s.roll).toLowerCase().includes(query)) ||
            (s.registerNumber && String(s.registerNumber).toLowerCase().includes(query)) ||
            (getStudentFullName(s).toLowerCase().includes(query))
        ) : students;
        
        if (filtered.length === 0) {
            studentsTbody.innerHTML = '<tr><td colSpan="4" class="text-center text-muted py-4">No students found.</td></tr>';
        } else {
            studentsTbody.innerHTML = filtered.map(s => {
                const fullName = getStudentFullName(s);
                const roll = s.registerNumber || s.roll;
                let username = roll ? String(roll).toLowerCase() : '-';
                if (s.user && s.user.username) username = s.user.username;
                let password = 'student123';
                if (s.user && s.user.rawPassword) {
                    password = s.user.rawPassword;
                } else if (s.phone && String(s.phone).length >= 4 && s.firstName) {
                    const phone = String(s.phone).replace(/\D/g, '');
                    const last4 = phone.length >= 4 ? phone.slice(-4) : '0000';
                    password = s.firstName.split(' ')[0].toUpperCase() + last4;
                }
                const secDisplay = s.section ? (s.section.sectionName || s.section.name || s.section.id || s.section) : (s.sec || '-');
                return `<tr>
                    <td><code class="text-warning">${username}</code></td>
                    <td>${fullName}</td>
                    <td><span class="badge bg-secondary">${secDisplay}</span></td>
                    <td><code class="text-info">${password}</code></td>
                </tr>`;
            }).join('');
        }
    }
    
    // Faculty
    const facultyTbody = document.getElementById('credFacultyList');
    if (facultyTbody) {
        facultyTbody.innerHTML = '<tr><td colSpan="4" class="text-center text-muted py-4">Loading faculty...</td></tr>';
        let facultyList = [];
        try {
            const res = await fetchFn('/api/teachers');
            if (res.ok) facultyList = await res.json();
        } catch (e) { console.warn("Failed to load faculty for credentials view", e); }
        
        const filtered = query ? facultyList.filter(f => 
            (getFacultyFullName(f).toLowerCase().includes(query)) ||
            (f.department && f.department.code && String(f.department.code).toLowerCase().includes(query))
        ) : facultyList;
        
        if (filtered.length === 0) {
            facultyTbody.innerHTML = '<tr><td colSpan="4" class="text-center text-muted py-4">No faculty found.</td></tr>';
        } else {
            facultyTbody.innerHTML = filtered.map(f => {
                const fullName = getFacultyFullName(f);
                let username = f.username || '-';
                if (f.user && f.user.username) username = f.user.username;
                let password = 'faculty123';
                if (f.user && f.user.rawPassword) password = f.user.rawPassword;
                const deptDisplay = f.department ? (f.department.code || f.department.name) : '-';
                return `<tr>
                    <td>${fullName}</td>
                    <td><span class="badge bg-primary">${deptDisplay}</span></td>
                    <td><code class="text-warning">${username}</code></td>
                    <td><code class="text-info">${password}</code></td>
                </tr>`;
            }).join('');
        }
    }

    // Advisor
    const advisorTbody = document.getElementById('credAdvisorList');
    if (advisorTbody) {
        let advisors = (window.staffDirectory || []).filter(s => s.classAdvisorFor);
        if (query) {
            advisors = advisors.filter(a => 
                (a.displayName || a.name || '').toLowerCase().includes(query) ||
                (a.classAdvisorFor || '').toLowerCase().includes(query)
            );
        }
        
        if (advisors.length === 0) {
            advisorTbody.innerHTML = '<tr><td colSpan="4" class="text-center text-muted py-4">No Class Advisors found.</td></tr>';
        } else {
            advisorTbody.innerHTML = advisors.map(a => {
                const username = buildClassAdvisorUsername(a.name);
                const password = getClassAdvisorPassword(username);
                return `<tr>
                    <td>${a.displayName || a.name}</td>
                    <td><span class="badge bg-success">${a.classAdvisorFor}</span></td>
                    <td><code class="text-warning">${username}</code></td>
                    <td><code class="text-info">${password}</code></td>
                </tr>`;
            }).join('');
        }
    }
};

window.searchAdminFacultyDetails = async function() {
    const tbody = document.getElementById('adminFacultyDetailsBody');
    const searchInput = document.getElementById('adminFacultySearchInput');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colSpan="8" class="text-center text-muted py-4">Loading faculty details...</td></tr>';
    
    let facultyList = window.lastLoadedFaculty;
    if (!facultyList || facultyList.length === 0) {
        try {
            const res = await apiFetch('/api/teachers');
            if (res.ok) {
                facultyList = await res.json();
                window.lastLoadedFaculty = facultyList;
            } else {
                facultyList = window.staffDirectory || [];
            }
        } catch (e) {
            facultyList = window.staffDirectory || [];
        }
    }
    
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    const filtered = query ? facultyList.filter(f => 
        (f.employeeId && f.employeeId.toLowerCase().includes(query)) ||
        (f.firstName && f.firstName.toLowerCase().includes(query)) ||
        (f.lastName && f.lastName.toLowerCase().includes(query)) ||
        (f.name && f.name.toLowerCase().includes(query)) ||
        (f.department && (f.department.name || f.department).toLowerCase().includes(query))
    ) : facultyList;

    if (!filtered || filtered.length === 0) {
        tbody.innerHTML = '<tr><td colSpan="8" class="text-center text-muted py-4">No faculty found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(f => {
        const name = ((f.firstName || '') + ' ' + (f.lastName || '')).trim() || f.name || '-';
        const dept = f.department ? (f.department.name || f.department) : (f.dept || '-');
        
        return `
        <tr>
            <td><strong>${name}</strong><br><small class="text-warning">${f.employeeId || ''}</small></td>
            <td><span class="badge bg-primary">${dept}</span></td>
            <td>${f.subjectHandling || '-'}</td>
            <td><small>${f.personalEmail || f.email || '-'}</small></td>
            <td><small>${f.collegeEmail || '-'}</small></td>
            <td>${f.phone1 || f.phone || '-'}</td>
            <td>${f.phone2 || f.altPhone || '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-warning me-1" onclick="window.editPersistentFaculty(${f.id || `'${f.name}'`})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="window.deletePersistentFaculty(${f.id || `'${f.name}'`})" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
};

// Updates the scrolling announcement ticker bar at the top of the page
function updateAnnouncementTicker() {
    const container = document.getElementById('announcementTickerContainer');
    const marquee = document.getElementById('announcementMarquee');
    if (!container || !marquee) return;

    const announcements = JSON.parse(localStorage.getItem('sece_announcements') || '[]');

    if (announcements.length === 0) {
        container.style.display = 'none';
        return;
    }

    // Build scrolling ticker text
    const tickerHtml = announcements.map(a =>
        `<i class="fa-solid fa-star text-warning me-2" style="font-size:0.8rem"></i><span class="me-5 fw-bold">${a.text}</span>`
    ).join('<span class="mx-3 text-warning opacity-75">&#9733;</span>');

    marquee.innerHTML = tickerHtml;
    container.style.display = 'block';
}
window.updateAnnouncementTicker = updateAnnouncementTicker;

// Persistent polling: every 1.5s keep the ticker in sync with localStorage
// This survives React re-renders since it runs independently
setInterval(updateAnnouncementTicker, 1500);


window.renderAnnouncements = function() {
    const tbody = document.getElementById('manageAnnouncementsBody');
    const announcements = JSON.parse(localStorage.getItem('sece_announcements') || '[]');

    if (tbody) {
        if (announcements.length === 0) {
            tbody.innerHTML = '<tr><td colSpan="2" class="text-center text-muted py-4">No announcements yet. Use the field above to post one.</td></tr>';
        } else {
            tbody.innerHTML = announcements.map((a, idx) => `
                <tr>
                    <td class="text-start">${a.text} <br><small class="text-muted">${a.date}</small></td>
                    <td class="text-center"><button class="btn btn-sm btn-outline-danger" onclick="window.deleteAnnouncement(${idx})"><i class="fa-solid fa-trash"></i></button></td>
                </tr>
            `).join('');
        }
    }

    // Always update the ticker bar too
    updateAnnouncementTicker();
};

window.renderManageAnnouncementsList = window.renderAnnouncements;

window.addAnnouncement = function() {
    const input = document.getElementById('newAnnouncementInput');
    if (!input || !input.value.trim()) { alert('Please enter an announcement text.'); return; }
    const announcements = JSON.parse(localStorage.getItem('sece_announcements') || '[]');
    announcements.unshift({ text: input.value.trim(), date: new Date().toLocaleString() });
    localStorage.setItem('sece_announcements', JSON.stringify(announcements));
    input.value = '';
    window.renderAnnouncements();
};

window.deleteAnnouncement = function(idx) {
    if (!confirm('Delete this announcement?')) return;
    const announcements = JSON.parse(localStorage.getItem('sece_announcements') || '[]');
    announcements.splice(idx, 1);
    localStorage.setItem('sece_announcements', JSON.stringify(announcements));
    window.renderAnnouncements();
};

window.renderAssignTaskList = async function() {
    const secSel = document.getElementById('newTaskSectionInput');
    if (secSel && secSel.options.length <= 1) {
        secSel.innerHTML = '<option value="">Loading sections...</option>';
        try {
            const token = localStorage.getItem('jwt_token') || '';
            const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            const secRes = await fetch('/api/sections', { headers });
            if (secRes.ok) {
                const sections = await secRes.json();
                secSel.innerHTML = '<option value="">-- Select Section --</option>' +
                    sections.map(s => {
                        const label = s.sectionName || ('Section ' + s.id);
                        return `<option value="${s.id}" data-name="${label}">${label}</option>`;
                    }).join('');
            } else {
                secSel.innerHTML = '<option value="">Error loading sections</option>';
            }
        } catch (e) {
            secSel.innerHTML = '<option value="">Error loading sections</option>';
        }
    }

    const tbody = document.getElementById('assignTasksBody');
    const tasks = JSON.parse(localStorage.getItem('sece_class_tasks') || '[]');
    if (tbody) {
        if (tasks.length === 0) {
            tbody.innerHTML = '<tr><td colSpan="3" class="text-center text-muted py-4">No tasks assigned yet.</td></tr>';
        } else {
            tbody.innerHTML = tasks.map((t, idx) => `
                <tr>
                    <td class="text-center fw-bold text-info">${t.sectionName}</td>
                    <td class="text-start">${t.text} <br><small class="text-muted">${t.date}</small></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-warning me-2" onclick="window.editAssignTask(${idx})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="window.deleteAssignTask(${idx})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }
    }
};

window.addAssignTask = function() {
    const input = document.getElementById('newTaskInput');
    const secSel = document.getElementById('newTaskSectionInput');
    
    if (!secSel || !secSel.value) {
        alert('Please select a section.');
        return;
    }
    if (!input || !input.value.trim()) {
        alert('Please enter a task message.');
        return;
    }
    
    const sectionName = secSel.options[secSel.selectedIndex].getAttribute('data-name') || secSel.options[secSel.selectedIndex].text;
    
    const tasks = JSON.parse(localStorage.getItem('sece_class_tasks') || '[]');
    tasks.unshift({
        sectionId: secSel.value,
        sectionName: sectionName,
        text: input.value.trim(),
        date: new Date().toLocaleString()
    });
    
    localStorage.setItem('sece_class_tasks', JSON.stringify(tasks));
    input.value = '';
    window.renderAssignTaskList();
};

window.deleteAssignTask = function(idx) {
    if (!confirm('Delete this task?')) return;
    const tasks = JSON.parse(localStorage.getItem('sece_class_tasks') || '[]');
    tasks.splice(idx, 1);
    localStorage.setItem('sece_class_tasks', JSON.stringify(tasks));
    window.renderAssignTaskList();
};

window.editAssignTask = function(idx) {
    const tasks = JSON.parse(localStorage.getItem('sece_class_tasks') || '[]');
    const t = tasks[idx];
    if (!t) return;
    
    const newText = prompt('Edit Task Message:', t.text);
    if (newText !== null && newText.trim() !== '') {
        t.text = newText.trim();
        t.date = new Date().toLocaleString() + ' (Edited)';
        localStorage.setItem('sece_class_tasks', JSON.stringify(tasks));
        window.renderAssignTaskList();
    }
};

window.renderStudentTasks = async function() {
    const listDiv = document.getElementById('studentTasksList');
    if (!listDiv) return;
    
    listDiv.innerHTML = '<div class="text-center text-muted py-4"><span class="spinner-border spinner-border-sm me-2"></span>Loading tasks...</div>';
    
    // Get student section
    const username = localStorage.getItem('sece_logged_in_user');
    if (!username) {
        listDiv.innerHTML = '<div class="alert alert-danger">Error: Not logged in.</div>';
        return;
    }
    
    let sectionId = null;
    try {
        const token = localStorage.getItem('jwt_token') || '';
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        const res = await fetch('/api/students', { headers });
        if (res.ok) {
            const students = await res.json();
            const me = students.find(s =>
                (s.user && s.user.username === username) ||
                s.username === username ||
                String(s.registerNumber || '').toLowerCase() === username
            );
            if (me && me.section) sectionId = me.section.id;
        }
    } catch (e) {
        console.error(e);
    }
    
    if (!sectionId) {
        listDiv.innerHTML = '<div class="alert alert-warning">Could not determine your class section. Make sure you are assigned to a section.</div>';
        return;
    }
    
    // Fetch tasks from local storage
    const tasks = JSON.parse(localStorage.getItem('sece_class_tasks') || '[]');
    const myTasks = tasks.filter(t => parseInt(t.sectionId) === sectionId);
    
    if (myTasks.length === 0) {
        listDiv.innerHTML = '<div class="text-center text-muted py-4"><i class="fa-solid fa-mug-hot text-secondary mb-2" style="font-size:2rem;"></i><br/>No active tasks for your class right now!</div>';
        return;
    }
    
    listDiv.innerHTML = myTasks.map(t => `
        <div class="card bg-dark border-warning shadow-sm">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="text-warning fw-bold mb-0"><i class="fa-solid fa-thumbtack me-2"></i>Task Assigned</h6>
                    <small class="text-muted">${t.date}</small>
                </div>
                <p class="card-text text-white mb-0" style="white-space:pre-wrap;">${t.text}</p>
            </div>
        </div>
    `).join('');
};

window.shareViaWhatsApp = function() {
    const link = document.getElementById('shareAppLinkInput')?.value || window.location.href;
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent('Check out the SECE Timetable App: ' + link), '_blank');
};

window.shareViaMessage = function() {
    const link = document.getElementById('shareAppLinkInput')?.value || window.location.href;
    window.open('sms:?body=' + encodeURIComponent('Check out the SECE Timetable App: ' + link), '_blank');
};

window.shareViaWebAPI = function() {
    const link = document.getElementById('shareAppLinkInput')?.value || window.location.href;
    if (navigator.share) {
        navigator.share({
            title: 'SECE Timetable App',
            text: 'Check out the SECE Timetable App',
            url: link
        }).catch(console.error);
    } else {
        alert('Web Share API not supported on this browser. Link copied to clipboard.');
        navigator.clipboard.writeText(link);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the ticker bar immediately if there are saved announcements
    setTimeout(() => { if (typeof updateAnnouncementTicker === 'function') updateAnnouncementTicker(); }, 800);

    // Poll for modals occasionally since React might render them after DOMContentLoaded
    setInterval(() => {
        const credModalEl = document.getElementById('viewCredentialsModal');
        if (credModalEl && !credModalEl.dataset.initialized) {
            credModalEl.dataset.initialized = 'true';
            credModalEl.addEventListener('show.bs.modal', () => { if (window.searchUserCredentials) window.searchUserCredentials(); });
        }
        
        const adminFacModalEl = document.getElementById('adminFacultyDetailsModal');
        if (adminFacModalEl && !adminFacModalEl.dataset.initialized) {
            adminFacModalEl.dataset.initialized = 'true';
            adminFacModalEl.addEventListener('show.bs.modal', () => { if (window.searchAdminFacultyDetails) window.searchAdminFacultyDetails(); });
        }
        
        const annModalEl = document.getElementById('manageAnnouncementsModal');
        if (annModalEl && !annModalEl.dataset.initialized) {
            annModalEl.dataset.initialized = 'true';
            annModalEl.addEventListener('show.bs.modal', () => { if (window.renderAnnouncements) window.renderAnnouncements(); });
        }
        
        const shareModalEl = document.getElementById('shareAppModal');
        if (shareModalEl && !shareModalEl.dataset.initialized) {
            shareModalEl.dataset.initialized = 'true';
            shareModalEl.addEventListener('show.bs.modal', () => { 
                const input = document.getElementById('shareAppLinkInput');
                if (input) input.value = window.location.origin;
            });
        }
        const avtModalEl = document.getElementById('adminViewEditTimetableModal');
        if (avtModalEl && !avtModalEl.dataset.initialized) {
            avtModalEl.dataset.initialized = 'true';
            avtModalEl.addEventListener('show.bs.modal', () => { if (window.initAdminViewEditTimetableModal) window.initAdminViewEditTimetableModal(); });
        }

        // Ensure ticker is visible whenever the ticker container appears
        const ticker = document.getElementById('announcementTickerContainer');
        if (ticker && !ticker.dataset.initialized) {
            ticker.dataset.initialized = 'true';
            if (typeof updateAnnouncementTicker === 'function') updateAnnouncementTicker();
        }
    }, 1000);
});

window.editPersistentStudent = async function(id) {
    let student = studentsRoster.find(s => s.id === id || s.roll === id || s.registerNumber === id);
    if (!student) {
        try {
            const res = await apiFetch(`/api/students/${id}`);
            if (res.ok) {
                student = await res.json();
            } else {
                alert("Student not found on server!");
                return;
            }
        } catch (e) {
            alert("Error fetching student details!");
            return;
        }
    }
    document.getElementById('esId').value = student.id || student.roll;
    
    const fName = student.firstName || student.name || '';
    const nameParts = (student.firstName ? fName : fName.split(' '));
    document.getElementById('esFirstName').value = student.firstName || nameParts[0] || '';
    document.getElementById('esLastName').value = student.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
    
    document.getElementById('esRegNo').value = student.registerNumber || student.roll || '';
    document.getElementById('esEmail').value = student.email || '';
    document.getElementById('esCollegeEmail').value = student.collegeEmail || '';
    document.getElementById('esPhone').value = student.phone || '';
    document.getElementById('esParentPhone1').value = student.parentPhone1 || '';
    document.getElementById('esParentPhone2').value = student.parentPhone2 || '';
    
    let dept = '-', course = '-', sec = '-';
    if (student.department && student.department.name) dept = student.department.name;
    else if (student.dept) dept = student.dept;
    
    if (student.course && student.course.name) course = student.course.name;
    
    let secDisplay = student.section ? (student.section.sectionName || student.section.name) : (student.sec || '-');
    if (secDisplay && secDisplay !== '-') {
        const parts = secDisplay.split(' ');
        if (parts.length >= 3) {
            course = parts[0];
            dept = parts[1];
            sec = parts.slice(2).join(' ');
        } else {
            sec = secDisplay;
        }
    }
    
    document.getElementById('esDept').value = dept;
    document.getElementById('esCourse').value = course;
    document.getElementById('esSection').value = sec;
    document.getElementById('esSemester').value = student.semester || student.sem || '';
    document.getElementById('esResidentType').value = student.residentType || '';
    document.getElementById('esHostelBlock').value = student.hostelBlock || '';
    document.getElementById('esRoomNumber').value = student.roomNumber || '';
    
    try {
        const m1 = bootstrap.Modal.getInstance(document.getElementById('manageStudentsModal'));
        if (m1) m1.hide();
        const m2 = bootstrap.Modal.getInstance(document.getElementById('studentDetailsOnlyModal'));
        if (m2) m2.hide();
    } catch(e) {}
    
    const esHostelFields = document.getElementById('esHostelFields');
    if (esHostelFields) {
        if (student.residentType === 'Hosteller') esHostelFields.classList.remove('d-none');
        else esHostelFields.classList.add('d-none');
    }
    
    const alertBox = document.getElementById('editStudentAlert');
    if (alertBox) alertBox.classList.add('d-none');
    
    const modalEl = document.getElementById('editStudentModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
};

window.submitEditStudentForm = async function(e) {
    const id = document.getElementById('esId').value;
    const fName = document.getElementById('esFirstName').value;
    const lName = document.getElementById('esLastName').value;
    const regNo = document.getElementById('esRegNo').value;
    const email = document.getElementById('esEmail').value;
    const collegeEmail = document.getElementById('esCollegeEmail').value;
    const phone = document.getElementById('esPhone').value;
    const parentPhone1 = document.getElementById('esParentPhone1').value;
    const parentPhone2 = document.getElementById('esParentPhone2').value;
    const residentType = document.getElementById('esResidentType').value;
    const hostelBlock = residentType === 'Hosteller' ? document.getElementById('esHostelBlock').value.trim() : null;
    const roomNumber = residentType === 'Hosteller' ? document.getElementById('esRoomNumber').value.trim() : null;
    const deptId = document.getElementById('esDept').value;
    const courseId = document.getElementById('esCourse').value;
    const secId = document.getElementById('esSection').value;
    const semester = document.getElementById('esSemester').value;

    const alertBox = document.getElementById('editStudentAlert');
    alertBox.classList.remove('d-none', 'alert-success', 'alert-danger');

    if (residentType === 'Hosteller' && (!hostelBlock || !roomNumber)) {
        alertBox.classList.add('alert-danger');
        alertBox.innerText = 'Hostel Block and Room Number are required for Hostellers.';
        return;
    }

    const nameParts = fName.trim().split(/\s+/);
    const firstName = nameParts[0] || fName;
    const lastName = lName.trim() || nameParts.slice(1).join(' ') || firstName;

    const deptCourseMap = { 'CSE': 'BTECH-CSE', 'IT': 'BTECH-IT', 'AI&DS': 'BTECH-AIDS', 'AI&ML': 'BTECH-AIML', 'ECE': 'BTECH-ECE' };
    const actualCourseId = deptCourseMap[deptId] || 'BTECH-' + deptId;
    const fullSectionName = courseId + ' ' + deptId + ' ' + secId;

    const payload = {
        firstName: firstName, lastName: lastName, registerNumber: regNo,
        email: email || collegeEmail, collegeEmail: collegeEmail, phone: phone,
        parentPhone1: parentPhone1, parentPhone2: parentPhone2 || null, residentType: residentType, 
        hostelBlock: hostelBlock, roomNumber: roomNumber, semester: parseInt(semester),
        department: { name: deptId }, course: { name: actualCourseId }, section: { sectionName: fullSectionName }
    };

    try {
        const res = await apiFetch('/api/students/' + id, { method: 'PUT', body: JSON.stringify(payload) });
        if (res.ok) {
            alertBox.classList.add('alert-success');
            alertBox.innerText = 'Student updated successfully!';
            if (typeof loadRecentStudents === 'function') loadRecentStudents();
            setTimeout(() => {
                const modalEl = document.getElementById('editStudentModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }, 1000);
        } else {
            const errText = await res.text().catch(() => res.status);
            alertBox.classList.add('alert-danger');
            alertBox.innerText = errText || 'Failed to update student.';
        }
    } catch (err) {
        console.error(err);
        alertBox.classList.add('alert-danger');
        alertBox.innerText = 'Error connecting to backend.';
    }
};

window.initAdminViewEditTimetableModal = function() {
    const deptSelect = document.getElementById('avtDeptSelect');
    if (!deptSelect) return;
    
    // Extract unique departments from activeSections, filtering out junk values
    const depts = [...new Set(activeSections.map(s => s.dept))]
        .filter(d => d && d !== 'Select Department...' && d.trim() !== '')
        .sort();
        
    deptSelect.innerHTML = '<option value="">Select Department...</option>' + 
        depts.map(d => `<option value="${d}">${d}</option>`).join('');
    
    document.getElementById('avtSectionSelect').innerHTML = '<option value="">Select Department First...</option>';
};

window.avtDeptChanged = function(deptName) {
    const sectionSelect = document.getElementById('avtSectionSelect');
    if (!sectionSelect) return;
    
    if (!deptName || deptName === 'Select Department...') {
        sectionSelect.innerHTML = '<option value="">Select Department First...</option>';
        return;
    }
    
    const sections = activeSections.filter(s => s.dept === deptName).sort((a, b) => a.name.localeCompare(b.name));
    sectionSelect.innerHTML = '<option value="">Select Section...</option>' + 
        sections.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
};

window.renderTimetableBuilderGrid = function(section) {
    const tbody = document.getElementById('ttBuilderGrid');
    if (!tbody) return;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const savedDataStr = localStorage.getItem(`sece_tt_built_${section}`);
    let savedData = null;
    if (savedDataStr) {
        try { savedData = JSON.parse(savedDataStr); } catch (e) {}
    }
    
    document.getElementById('ttBuildAdvisor').value = (savedData && savedData.advisor) ? savedData.advisor : '';
    document.getElementById('ttBuildTutors').value = (savedData && savedData.tutors) ? savedData.tutors : '';

    let html = '';
    days.forEach(day => {
        html += `<tr><td class="align-middle text-white fw-bold">${day}</td>`;
        for (let p = 1; p <= 7; p++) {
            if (p === 4) html += `<td class="align-middle text-muted small text-center">TEA</td>`;
            if (p === 6) {
                html += `<td class="align-middle text-muted small text-center">LUNCH</td>`;
                const actVal = (savedData && savedData.grid && savedData.grid[day] && savedData.grid[day].act) ? savedData.grid[day].act : '';
                html += `<td><input type="text" id="ttb_${day}_act" class="form-control form-control-sm bg-dark text-white border-secondary text-center" value="${actVal.replace(/"/g, '&quot;')}" /></td>`;
            }
            
            const val = (savedData && savedData.grid && savedData.grid[day] && savedData.grid[day][`P${p}`]) ? savedData.grid[day][`P${p}`] : '';
            html += `<td><input type="text" id="ttb_${day}_P${p}" class="form-control form-control-sm bg-dark text-white border-secondary text-center" value="${val.replace(/"/g, '&quot;')}" /></td>`;
        }
        html += `</tr>`;
    });
    tbody.innerHTML = html;
};

window.saveTimetableBuilder = function() {
    const section = window.currentTimetableSection;
    if (!section) return;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const data = {
        advisor: document.getElementById('ttBuildAdvisor').value.trim(),
        tutors: document.getElementById('ttBuildTutors').value.trim(),
        metadata: {
            batch: window.currentTimetableBatch || '2024',
            year: window.currentTimetableYear || '2',
            semester: window.currentTimetableSemester || '3'
        },
        grid: {}
    };
    days.forEach(day => {
        data.grid[day] = {};
        for (let p = 1; p <= 7; p++) {
            const val = document.getElementById(`ttb_${day}_P${p}`).value.trim();
            data.grid[day][`P${p}`] = val;
        }
        const actVal = document.getElementById(`ttb_${day}_act`).value.trim();
        data.grid[day].act = actVal;
    });
    
    localStorage.setItem(`sece_tt_built_${section}`, JSON.stringify(data));
    
    // Attempt to save to backend MySQL database as requested
    fetch('/api/timetable/save-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: section, grid: data.grid })
    }).then(r => r.ok ? r.json() : Promise.reject())
      .then(() => console.log('Saved to MySQL Database successfully'))
      .catch(() => console.warn('Failed to save to MySQL Database'));

    showToast('Success', `Timetable for ${section} saved!`);
    
    const modalEl = bootstrap.Modal.getInstance(document.getElementById('timetableBuilderModal'));
    if (modalEl) modalEl.hide();
    
    timetableData = loadSavedTimetable();
    if (currentSection === section) {
        renderTimetableGrid();
    }
};

window.submitAdminViewEditTimetable = function() {
    const batch = document.getElementById('avtBatchInput').value;
    const dept = document.getElementById('avtDeptSelect').value;
    const section = document.getElementById('avtSectionSelect').value;
    const year = document.getElementById('avtYearSelect').value;
    const semester = document.getElementById('avtSemesterSelect').value;

    if (!batch || !dept || !section || !year || !semester) {
        alert("Please fill all fields."); return;
    }
    window.currentTimetableBatch = batch;
    window.currentTimetableDept = dept;
    window.currentTimetableSection = section;
    window.currentTimetableYear = year;
    window.currentTimetableSemester = semester;
    
    window.renderTimetableBuilderGrid(section);
    const selectionModalEl = bootstrap.Modal.getInstance(document.getElementById('adminViewEditTimetableModal'));
    if (selectionModalEl) selectionModalEl.hide();
    const builderModalEl = new bootstrap.Modal(document.getElementById('timetableBuilderModal'));
    builderModalEl.show();
};

window.openShareAppModal = function() {
    const url = window.location.origin + '/';
    const linkInput = document.getElementById('shareAppLinkInput');
    if (linkInput) linkInput.value = url;
    const qrImg = document.getElementById('loginQrCodeImage');
    if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}&color=000000&bgcolor=ffffff`;
    const modalEl = document.getElementById('shareAppModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
};
window.shareViaWhatsApp = function() {
    const text = `Check out this Smart Timetable platform: ${window.location.origin + '/'}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
};
window.shareViaMessage = function() {
    const text = `Check out this Smart Timetable platform: ${window.location.origin + '/'}`;
    const separator = (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) ? '&' : '?';
    window.open(`sms:${separator}body=${encodeURIComponent(text)}`, '_self');
};
window.shareViaWebAPI = function() {
    if (navigator.share) {
        navigator.share({ title: 'Smart Timetable Platform', text: 'Check out this platform!', url: window.location.origin + '/' }).catch(e => console.warn(e));
    } else {
        const linkInput = document.getElementById('shareAppLinkInput');
        if (linkInput) { linkInput.select(); document.execCommand('copy'); alert('Link copied!'); }
    }
};


/* replaced */

window.deptChanged = function(dept) {
    currentDept = dept;
    localStorage.setItem('sece_last_viewed_dept', dept);
    populateSectionSelects();
    currentSection = '';
    localStorage.removeItem('sece_last_viewed_section');
    renderTimetableGrid();
};

window.sectionChanged = function(sec) {
    currentSection = sec;
    localStorage.setItem('sece_last_viewed_section', sec);
    renderTimetableGrid();
};

window.importTimetableImage = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    showToast('Scanning timetable...', 'Sending image to AI for processing. Please wait...', 'info');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/timetable/upload-image', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            let errText = await response.text();
            try {
                const errJson = JSON.parse(errText);
                if (errJson && errJson.error) {
                    errText = errJson.error;
                }
            } catch (e) {}
            throw new Error(errText);
        }

        const jsonText = await response.text();
        let data;
        try {
            data = JSON.parse(jsonText);
        } catch (e) {
            throw new Error("Invalid JSON response from AI");
        }

        if (data && data.data) {
            const ttData = data.data;
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            let totalEntries = 0;
            days.forEach(day => {
                if (ttData[day]) {
                    const periods = ttData[day];
                    for (let p = 1; p <= 7; p++) {
                        const inputId = `ttb_${day}_P${p}`;
                        const input = document.getElementById(inputId);
                        if (input) {
                            const per = periods[p-1];
                            if (per && per.sub && per.sub.toUpperCase() !== 'FREE' && per.sub.toUpperCase() !== 'BREAK') {
                                let val = per.sub;
                                if (per.faculty) val += `, ${per.faculty}`;
                                if (per.venue) val += `, ${per.venue}`;
                                input.value = val;
                                totalEntries++;
                            } else {
                                input.value = '';
                            }
                        }
                    }
                }
            });
            showToast('Image Scan Completed', `Timetable detected. Please verify the imported data. Total: ${totalEntries} timetable entries`, 'success');
        } else {
            throw new Error("Could not detect a timetable table in this image. Please upload a clear timetable screenshot.");
        }

    } catch (err) {
        console.error("AI Upload Error:", err);
        let errorMsg = err.message;
        if (errorMsg && errorMsg.includes('AI scanning service is not configured')) {
            showToast('Error', errorMsg, 'danger');
            alert(errorMsg);
        } else {
            showToast('Scan Failed', 'Could not detect a timetable table in this image. Please upload a clear timetable screenshot.', 'danger');
            alert('Could not detect a timetable table in this image. Please upload a clear timetable screenshot.');
        }
    }
    
    // Reset the input so it can be used again
    event.target.value = '';
};

window.importTimetableExcel = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const section = window.currentTimetableSection;
    if (!section) {
        alert("Please open a specific timetable section before importing.");
        event.target.value = '';
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('section', section);
    
    showToast('Uploading Excel', 'Sending to backend for parsing...', 'info');

    try {
        const response = await fetch('/api/timetable/import-excel', {
            method: 'POST',
            body: formData
        });
        
        const json = await response.json();
        
        if (!response.ok) {
            throw new Error(json.error || 'Backend failed to process Excel file');
        }

        const gridData = json.grid;
        if (!gridData) throw new Error("No grid data returned from server.");

        const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        daysList.forEach(day => {
            if (gridData[day]) {
                const rowData = gridData[day];
                for (let p = 1; p <= 7; p++) {
                    const inputId = `ttb_${day}_P${p}`;
                    const input = document.getElementById(inputId);
                    if (input && rowData[`P${p}`] !== undefined) {
                        input.value = rowData[`P${p}`];
                    }
                }
            }
        });
        
        // Save the builder automatically so the main timetable view updates!
        window.saveTimetableBuilder();
        
        showToast('Excel Imported Successfully', json.message || 'Timetable updated in database and UI refreshed.', 'success');
        
    } catch (error) {
        console.error('Error importing Excel via API:', error);
        alert('Error parsing the Excel file: ' + error.message);
    }
    
    event.target.value = '';
};

window.fetchStudentDynamicDashboard = async function() {
    try {
        const token = localStorage.getItem("jwt_token");
        if (!token) return;
        
        const response = await fetch("/api/student/dashboard/current", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        const dynContainer = document.getElementById("studentDynamicDashboard");
        const alertLegacy = document.getElementById("studentUpcomingClassAlert");
        
        if (dynContainer) dynContainer.classList.remove("d-none");
        if (alertLegacy) alertLegacy.classList.add("d-none");
        
        if (data.status === "NO_PROFILE") {
            if(document.getElementById("dynCurrentName")) document.getElementById("dynCurrentName").innerText = "Profile Incomplete";
            if(document.getElementById("dynCurrentSubject")) {
                document.getElementById("dynCurrentSubject").innerText = data.message;
                document.getElementById("dynCurrentSubject").classList.replace("text-warning", "text-danger");
            }
            if(document.getElementById("dynCurrentFaculty")) document.getElementById("dynCurrentFaculty").parentElement.style.display = "none";
            if(document.getElementById("dynCurrentRoom")) document.getElementById("dynCurrentRoom").parentElement.style.display = "none";
            return;
        }

        // Populate Profile Info
        if (data.student && document.getElementById("dynStudentProfile")) {
            document.getElementById("dynStudentProfile").innerHTML = `<i class="fa-solid fa-graduation-cap me-1"></i>${data.student.year} Yr ${data.student.department} - Sec ${data.student.section}`;
        }
        
        // Handle HOLIDAY or AFTER/BEFORE college
        const statusBox = document.getElementById("dynCurrentStatusMessage");
        const statusText = document.getElementById("dynStatusText");
        const detailsBox = document.getElementById("dynCurrentDetails");
        const nameBox = document.getElementById("dynCurrentName");
        const timeBox = document.getElementById("dynCurrentTime");
        const nextBadge = document.getElementById("dynNextPeriodBadge");
        const nextText = document.getElementById("dynNextPeriodText");
        
        if(detailsBox) detailsBox.classList.add("d-none");
        if(statusBox) statusBox.classList.add("d-none");
        if(nextBadge) nextBadge.classList.add("d-none");
        if(nameBox) nameBox.innerText = data.status.replace(/_/g, " ");
        if(timeBox) timeBox.innerText = "--:--";

        if (data.status === "HOLIDAY" || data.status === "BEFORE_COLLEGE" || data.status === "AFTER_COLLEGE") {
            if(statusBox) statusBox.classList.remove("d-none");
            if(statusText) {
                 statusText.innerText = data.status === "HOLIDAY" ? "Holiday! No Classes" : (data.status === "BEFORE_COLLEGE" ? "Classes haven't started yet" : "Classes are over for today");
                 statusText.className = "fw-bold mb-0 text-success";
            }
        } else if (data.status === "CURRENT_PERIOD") {
            if(detailsBox) detailsBox.classList.remove("d-none");
            if(nameBox) nameBox.innerText = data.currentPeriod.name;
            if(timeBox) timeBox.innerText = `${data.currentPeriod.startTime} - ${data.currentPeriod.endTime}`;
            if(document.getElementById("dynCurrentSubject")) {
                document.getElementById("dynCurrentSubject").innerText = data.currentPeriod.subject;
                document.getElementById("dynCurrentSubject").className = "fw-bold mb-3 text-warning";
            }
            if(document.getElementById("dynCurrentFaculty")) document.getElementById("dynCurrentFaculty").innerText = data.currentPeriod.faculty || "TBA";
            if(document.getElementById("dynCurrentRoom")) document.getElementById("dynCurrentRoom").innerText = data.currentPeriod.room || "TBA";
        } else if (data.status === "NO_CLASS") {
             if(statusBox) statusBox.classList.remove("d-none");
             if(statusText) {
                 statusText.innerText = "FREE HOUR";
                 statusText.className = "fw-bold mb-0 text-info";
             }
             if(nameBox) nameBox.innerText = data.currentPeriod.name;
             if(timeBox) timeBox.innerText = `${data.currentPeriod.startTime} - ${data.currentPeriod.endTime}`;
        } else {
             // Breaks (TEA_BREAK, LUNCH_BREAK, ACTIVITY)
             if(statusBox) statusBox.classList.remove("d-none");
             if(statusText) {
                 statusText.innerText = data.status.replace(/_/g, " ");
                 statusText.className = "fw-bold mb-0 text-warning";
             }
             if(nameBox) nameBox.innerText = "Break Time";
             if (data.currentPeriod && timeBox) {
                timeBox.innerText = `${data.currentPeriod.startTime} - ${data.currentPeriod.endTime}`;
             }
        }
        
        if (data.nextPeriod) {
            if(nextBadge) nextBadge.classList.remove("d-none");
            if(nextText) nextText.innerText = `${data.nextPeriod.name}: ${data.nextPeriod.subject}`;
        }
        
        // Populate Today's Timetable List
        const ttList = document.getElementById("dynTodayTimetableList");
        if(ttList) {
            ttList.innerHTML = "";
            if (data.todayTimetable && data.todayTimetable.length > 0) {
                data.todayTimetable.forEach(p => {
                    const li = document.createElement("li");
                    li.className = "list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center";
                    
                    let isCurrent = false;
                    if (data.currentPeriod && data.currentPeriod.name === p.name) isCurrent = true;
                    
                    if (isCurrent) {
                        li.classList.replace("bg-dark", "bg-primary");
                        li.classList.add("bg-gradient");
                    }
                    
                    const timeSpan = `<span class="badge ${isCurrent ? "bg-light text-dark" : "bg-secondary"} me-2">${p.startTime}</span>`;
                    const subjectName = p.subject === "FREE" ? `<span class="text-muted">FREE</span>` : p.subject;
                    
                    li.innerHTML = `<div>${timeSpan} <span class="fw-bold">${subjectName}</span></div>
                                    <div class="small ${isCurrent ? "text-light" : "text-info"}">${p.room || ""}</div>`;
                    ttList.appendChild(li);
                });
            } else {
                ttList.innerHTML = "<li class='list-group-item bg-dark text-muted text-center py-3 border-secondary small'>No schedule available for today.</li>";
            }
        }
        
    } catch (e) {
        console.error("Failed to fetch student dynamic dashboard", e);
    }
};

// Force start polling in case switchRole missed it
if (window.dynamicDashboardInterval) clearInterval(window.dynamicDashboardInterval);
window.dynamicDashboardInterval = setInterval(() => {
    if (localStorage.getItem("sece_logged_in_role") === "STUDENT") {
        if (typeof window.fetchStudentDynamicDashboard === 'function') {
            window.fetchStudentDynamicDashboard();
        }
    }
}, 3000);



let facultyTtColumns = [];

function loadFacultyTtColumns() {
    const saved = localStorage.getItem('faculty_tt_cols_' + _getFacultyTTKey());
    if (saved) {
        facultyTtColumns = JSON.parse(saved);
    } else {
        facultyTtColumns = [
            { key: 'P1', label: 'Period 1', isBreak: false, defTime: '08.40 - 09.40' },
            { key: 'P2', label: 'Period 2', isBreak: false, defTime: '09.40 - 10.40' },
            { key: 'P3', label: 'Period 3', isBreak: false, defTime: '11.00 - 12.00' },
            { key: 'TEA', label: 'Tea Break', isBreak: true, defTime: '12.00 - 12.15' },
            { key: 'P4', label: 'Period 4', isBreak: false, defTime: '12.15 - 01.15' },
            { key: 'P5', label: 'Period 5', isBreak: false, defTime: '01.15 - 02.00' },
            { key: 'LUNCH', label: 'Lunch Break', isBreak: true, defTime: '02.00 - 02.40' },
            { key: 'ACT', label: 'Activity', isBreak: false, defTime: '02.40 - 03.30' },
            { key: 'P6', label: 'Period 6', isBreak: false, defTime: '03.30 - 04.20' },
            { key: 'P7', label: 'Period 7', isBreak: false, defTime: '04.20 - 05.10' }
        ];
    }
}

function saveFacultyTtColumns() {
    localStorage.setItem('faculty_tt_cols_' + _getFacultyTTKey(), JSON.stringify(facultyTtColumns));
}

window.addFacultyPeriodCol = function() {
    const newIdx = facultyTtColumns.length + 1;
    const newKey = 'P' + newIdx + '_' + Date.now().toString().slice(-4);
    facultyTtColumns.push({
        key: newKey,
        label: 'Period ' + newIdx,
        isBreak: false,
        defTime: '00.00 - 00.00'
    });
    saveFacultyTtColumns();
    if (window.renderMyTimetable) window.renderMyTimetable();
};

window.swapFacultyCol = function(idx, dir) {
    if (idx + dir < 0 || idx + dir >= facultyTtColumns.length) return;
    const temp = facultyTtColumns[idx];
    facultyTtColumns[idx] = facultyTtColumns[idx + dir];
    facultyTtColumns[idx + dir] = temp;
    saveFacultyTtColumns();
    if (window.renderMyTimetable) window.renderMyTimetable();
};

window.removeFacultyCol = function(idx) {
    if (confirm('Are you sure you want to remove this period?')) {
        facultyTtColumns.splice(idx, 1);
        saveFacultyTtColumns();
        if (window.renderMyTimetable) window.renderMyTimetable();
    }
};

window.updateFacultyColLabel = function(idx, val) {
    facultyTtColumns[idx].label = val;
    saveFacultyTtColumns();
};

window.renderMyTimetable = function() {
    const tbody = document.getElementById('myTimetableBody');
    if (!tbody) return;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(_getFacultyTTKey()) || '{}'); } catch(e) {}
    
    loadFacultyTtColumns();
    const thead = document.getElementById('myTimetableHead');
    
    let thHtml = '<tr><th style="width: 90px">Day</th>';
    const headers = saved._headers || {};
    
    facultyTtColumns.forEach((col, i) => {
        const timeVal = headers[col.key] || col.defTime;
        if (col.isBreak && col.key !== 'ACT') {
            thHtml += `<th class="text-warning position-relative">
                <div class="d-flex justify-content-between px-1 mb-1">
                   ${i > 0 ? `<i class="fa-solid fa-caret-left" style="cursor:pointer" onclick="swapFacultyCol(${i}, -1)"></i>` : `<span></span>`}
                   ${i < facultyTtColumns.length - 1 ? `<i class="fa-solid fa-caret-right" style="cursor:pointer" onclick="swapFacultyCol(${i}, 1)"></i>` : `<span></span>`}
                </div>
                ${col.label}<input type="text" id="myTt${col.key}" class="form-control form-control-sm bg-dark text-white border-secondary text-center text-warning mt-1" style="font-size: 0.75rem; padding: 0.2rem" value="${timeVal}" />
            </th>`;
        } else {
            thHtml += `<th class="position-relative">
                <div class="d-flex justify-content-between px-1 text-muted mb-1">
                   ${i > 0 ? `<i class="fa-solid fa-caret-left" style="cursor:pointer" onclick="swapFacultyCol(${i}, -1)"></i>` : `<span></span>`}
                   <i class="fa-solid fa-trash text-danger" style="cursor:pointer" onclick="removeFacultyCol(${i})"></i>
                   ${i < facultyTtColumns.length - 1 ? `<i class="fa-solid fa-caret-right" style="cursor:pointer" onclick="swapFacultyCol(${i}, 1)"></i>` : `<span></span>`}
                </div>
                <input type="text" value="${col.label}" class="form-control form-control-sm bg-transparent border-0 text-white text-center p-0 mb-1" onchange="updateFacultyColLabel(${i}, this.value)" style="font-size: 0.8rem; font-weight: bold;" />
                <input type="text" id="myTt${col.key}" class="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style="font-size: 0.75rem; padding: 0.2rem" value="${timeVal}" />
            </th>`;
        }
    });
    thHtml += '</tr>';
    
    if (thead) thead.innerHTML = thHtml;

    let html = '';
    days.forEach(day => {
        const d = saved[day] || {};
        const esc = v => String(v || '').replace(/"/g, '&quot;');
        html += `<tr><td class="align-middle text-white fw-bold">${day}</td>`;
        
        facultyTtColumns.forEach(col => {
            if (col.isBreak && col.key !== 'ACT') {
                html += `<td class="align-middle text-muted small text-center">${col.label.toUpperCase()}</td>`;
            } else {
                html += `<td><input type="text" id="myTt_${day}_${col.key}" class="form-control form-control-sm bg-dark text-white border-secondary text-center" value="${esc(d[col.key])}" /></td>`;
            }
        });
        html += `</tr>`;
    });
    tbody.innerHTML = html;
};

window.renderFacultyPersonalTT = function() {
    const container = document.getElementById('facultyPersonalTTPanel');
    if (!container) return;

    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(_getFacultyTTKey()) || '{}'); } catch(e) {}
    
    loadFacultyTtColumns();

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const headers = saved._headers || {};

    const hasData = days.some(d => {
        const day = saved[d];
        return day && Object.values(day).some(v => v && v.trim());
    });

    if (!hasData) {
        container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fa-solid fa-calendar-xmark fs-2 mb-2 d-block opacity-50"></i>
                <p class="mb-1">No personal timetable saved yet.</p>
                <small>Click <strong class="text-info">YOUR TIMETABLE</strong> in the top bar to feed your schedule.</small>
            </div>`;
        return;
    }

    let html = `<div class="table-responsive"><table class="table table-dark table-bordered table-sm text-center align-middle mb-0" style="table-layout: fixed;"><thead><tr><th style="width: 90px;">Day</th>`;
    
    facultyTtColumns.forEach(col => {
        const timeStr = headers[col.key] || col.defTime;
        if (col.isBreak && col.key !== 'ACT') {
            html += `<th class="text-warning">${col.label}<br/><small class="text-muted" style="font-size: 0.75rem;">${timeStr}</small></th>`;
        } else {
            html += `<th>${col.label}<br/><small class="text-muted" style="font-size: 0.75rem;">${timeStr}</small></th>`;
        }
    });
    html += `</tr></thead><tbody>`;

    days.forEach(day => {
        const d = saved[day] || {};
        let rowHtml = `<tr><td class="text-white fw-bold">${day}</td>`;
        
        facultyTtColumns.forEach(col => {
            if (col.isBreak && col.key !== 'ACT') {
                rowHtml += `<td class="text-muted small">${col.label.toUpperCase()}</td>`;
            } else {
                const val = d[col.key] || '';
                if (!val.trim()) {
                    rowHtml += `<td class="text-muted" style="font-size: 0.85rem;">FREE</td>`;
                } else {
                    const parts = val.split(',').map(s => s.trim());
                    if (parts.length >= 3) {
                        rowHtml += `<td class="text-info fw-bold" style="font-size: 0.85rem;">${parts[1]}<br/><small class="text-white fw-normal">${parts[0]}</small><br/><small class="text-muted">${parts[2]}</small></td>`;
                    } else if (parts.length === 2) {
                        rowHtml += `<td class="text-info fw-bold" style="font-size: 0.85rem;">${parts[1]}<br/><small class="text-white fw-normal">${parts[0]}</small></td>`;
                    } else {
                        rowHtml += `<td class="text-info fw-bold" style="font-size: 0.85rem;">${parts[0]}</td>`;
                    }
                }
            }
        });
        rowHtml += `</tr>`;
        html += rowHtml;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
};

window.saveMyTimetable = function() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const data = {};
    
    loadFacultyTtColumns();

    data._headers = {};
    facultyTtColumns.forEach(col => {
        data._headers[col.key] = (document.getElementById('myTt' + col.key) || {}).value || col.defTime;
    });

    days.forEach(day => {
        data[day] = {};
        facultyTtColumns.forEach(col => {
            if (!col.isBreak || col.key === 'ACT') {
                const el = document.getElementById(`myTt_${day}_${col.key}`);
                data[day][col.key] = el ? el.value.trim() : '';
            }
        });
    });

    localStorage.setItem(_getFacultyTTKey(), JSON.stringify(data));

    if (typeof bootstrap !== 'undefined') {
        const modalEl = document.getElementById('myTimetableModal');
        if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
    }
    showToast('Success', 'Your timetable has been saved.');
    if (window.renderFacultyPersonalTT) window.renderFacultyPersonalTT();
};


function exportTimetableCSV() {
    if (currentUserRole === 'FACULTY') {
        const uname = String(localStorage.getItem('sece_logged_in_user') || 'faculty').toUpperCase();
        const ttKey = 'faculty_personal_tt_' + uname.toLowerCase();
        let saved = {};
        try { saved = JSON.parse(localStorage.getItem(ttKey) || '{}'); } catch(e) {}
        
        loadFacultyTtColumns();
        
        let csv = 'Day';
        facultyTtColumns.forEach(col => {
            csv += ',' + col.label.replace(/,/g, '');
        });
        csv += '\n';
        
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        days.forEach(day => {
            const d = saved[day] || {};
            let row = [day];
            facultyTtColumns.forEach(col => {
                if (col.isBreak && col.key !== 'ACT') {
                    row.push('""');
                } else {
                    row.push(`"${(d[col.key] || '').replace(/"/g, '""')}"`);
                }
            });
            csv += row.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `FACULTY_TIMETABLE_${uname}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast('CSV Downloaded!', `Saved FACULTY_TIMETABLE_${uname}.csv spreadsheet.`);
        return;
    }

    let csv = 'Day,Period 1,Period 2,Period 3,Period 4,Period 5,Period 6,Period 7\n';
    const data = timetableData[currentSection] || timetableData['II CSE C'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    days.forEach(day => {
        const periods = data[day] || [];
        const row = [day, ...periods.map(p => `"${p.sub} (${p.faculty} - ${p.venue})"` )];
        csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `SECE_Timetable_${currentSection}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToast('CSV Downloaded!', `Saved SECE_Timetable_${currentSection}.csv spreadsheet.`);
}
