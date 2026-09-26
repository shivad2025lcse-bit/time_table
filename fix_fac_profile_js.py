import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

faculty_profile_fn = """
window.openFacultyProfileModal = async function() {
    if (currentUserRole !== 'FACULTY') { alert('This profile is available only to Faculty accounts.'); return; }

    const body = document.getElementById('facultyProfileBody');
    if (!body) return;
    
    let username = localStorage.getItem('sece_logged_in_user');
    try {
        const userInfo = JSON.parse(localStorage.getItem('user_info'));
        if (userInfo && userInfo.username) username = userInfo.username;
    } catch (e) {}

    try {
        body.innerHTML = '<div class="text-center py-2"><div class="spinner-border text-info" role="status"></div></div>';
        const fetchFn = (typeof apiFetch === 'function') ? apiFetch : fetch;
        const res = await fetchFn('/api/teachers');
        if (res.ok) {
            const facultyList = await res.json();
            const f = facultyList.find(st => st.user && String(st.user.username).toLowerCase() === String(username).toLowerCase());
            
            if (f) {
                const computedUsername = f.user ? f.user.username : username;
                const password = getStoredPassword(computedUsername) || 'faculty123';
                const deptName = f.department ? f.department.name : '-';
                const personalEmail = f.user ? (f.user.personalEmail || '-') : '-';
                const collegeEmail = f.user ? (f.user.email || '-') : '-';
                
                body.innerHTML = `
                    <div class="row g-3 small">
                        <div class="col-12 text-center mb-3">
                            <i class="fa-solid fa-user-tie fa-4x text-info mb-2"></i>
                            <h4 class="text-white fw-bold mb-0">${f.displayName || f.name || '-'}</h4>
                            <span class="badge bg-secondary mt-1">${deptName}</span>
                        </div>
                        <div class="col-12"><hr class="border-secondary my-1"></div>
                        <div class="col-12"><strong>Faculty Name:</strong><br>${f.name || '-'}</div>
                        <div class="col-6"><strong>Display Name:</strong><br>${f.displayName || '-'}</div>
                        <div class="col-6"><strong>Department:</strong><br>${deptName}</div>
                        <div class="col-6"><strong>Personal Email:</strong><br>${personalEmail}</div>
                        <div class="col-6"><strong>College Email:</strong><br>${collegeEmail}</div>
                        <div class="col-12"><hr class="border-secondary my-1"></div>
                        <div class="col-6"><strong>Username:</strong><br><code>${computedUsername}</code></div>
                        <div class="col-6"><strong>Password:</strong><br><code class="text-warning">${password}</code></div>
                    </div>`;
            } else {
                body.innerHTML = '<div class="alert alert-warning">Your faculty record could not be found.</div>';
            }
        } else {
            body.innerHTML = '<div class="alert alert-danger">Failed to fetch faculty details.</div>';
        }
    } catch (e) {
        console.error('Error fetching faculty profile from backend:', e);
        body.innerHTML = '<div class="alert alert-danger">Error connecting to server.</div>';
    }

    const modalEl = document.getElementById('facultyProfileModal');
    if (modalEl) {
        new bootstrap.Modal(modalEl).show();
    }
};
"""

# Append to the file (or insert near openStudentProfileModal)
if 'window.openFacultyProfileModal = ' not in content:
    content = content + "\n\n" + faculty_profile_fn

    with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added openFacultyProfileModal to frontend_app.js")
else:
    print("openFacultyProfileModal already exists.")
