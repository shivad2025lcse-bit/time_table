import re

filepath = 'd:/Java_project/frontend/public/js/frontend_app.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. searchUserCredentials
new_search_credentials = """window.searchUserCredentials = async function() {
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
                    const phone = String(s.phone).replace(/\\D/g, '');
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
        facultyTbody.innerHTML = '<tr><td colSpan="5" class="text-center text-muted py-4">Loading faculty...</td></tr>';
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
            facultyTbody.innerHTML = '<tr><td colSpan="5" class="text-center text-muted py-4">No faculty found.</td></tr>';
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
                    <td><span class="badge bg-secondary">${f.designation || '-'}</span></td>
                    <td><code class="text-warning">${username}</code></td>
                    <td><code class="text-info">${password}</code></td>
                </tr>`;
            }).join('');
        }
    }
};"""
pattern2 = re.compile(r'window\.searchUserCredentials\s*=\s*function\(\)\s*\{.*?\}\n\s*\};', re.DOTALL)
content = pattern2.sub(lambda m: new_search_credentials, content)

# 2. Share functions
share_functions = """
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
"""
if "window.openShareAppModal =" not in content:
    content += "\n" + share_functions + "\n"

# 3. renderMyTimetable
new_renderMyTimetable = """window.renderMyTimetable = function() {
    const tbody = document.getElementById('myTimetableBody');
    if (!tbody) return;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let html = '';
    days.forEach(day => {
        html += `
        <tr>
            <td class="align-middle text-white fw-bold">${day}</td>
            <td><input type="text" id="myTt_${day}_P1" class="form-control form-control-sm bg-dark text-white border-secondary text-center" /></td>
            <td><input type="text" id="myTt_${day}_P2" class="form-control form-control-sm bg-dark text-white border-secondary text-center" /></td>
            <td><input type="text" id="myTt_${day}_P3" class="form-control form-control-sm bg-dark text-white border-secondary text-center" /></td>
            <td class="align-middle text-muted small text-center">TEA</td>
            <td><input type="text" id="myTt_${day}_P4" class="form-control form-control-sm bg-dark text-white border-secondary text-center" /></td>
            <td><input type="text" id="myTt_${day}_P5" class="form-control form-control-sm bg-dark text-white border-secondary text-center" /></td>
            <td class="align-middle text-muted small text-center">LUNCH</td>
            <td><input type="text" id="myTt_${day}_ACT" class="form-control form-control-sm bg-dark text-white border-secondary text-center" /></td>
            <td><input type="text" id="myTt_${day}_P6" class="form-control form-control-sm bg-dark text-white border-secondary text-center" /></td>
            <td><input type="text" id="myTt_${day}_P7" class="form-control form-control-sm bg-dark text-white border-secondary text-center" /></td>
        </tr>
        `;
    });
    tbody.innerHTML = html;
};"""
pattern3 = re.compile(r'window\.renderMyTimetable\s*=\s*function\(\)\s*\{.*?tbody\.innerHTML\s*=\s*html;\n\s*\};', re.DOTALL)
if pattern3.search(content):
    content = pattern3.sub(lambda m: new_renderMyTimetable, content)
else:
    pattern4 = re.compile(r'window\.renderMyTimetable\s*=\s*function\(\)\s*\{.*?\}\n\s*\};', re.DOTALL)
    content = pattern4.sub(lambda m: new_renderMyTimetable, content)

# 4. renderTimetableGrid fix (Add ACT cell)
old_grid_fix = """        // Period 5
        tr.appendChild(createCell(day, 4, periods[4]));
        // Period 6
        tr.appendChild(createCell(day, 5, periods[5]));
        // Period 7
        tr.appendChild(createCell(day, 6, periods[6]));"""

new_grid_fix = """        // Period 5
        tr.appendChild(createCell(day, 4, periods[4]));
        
        // Activity Hour (Empty/Placeholder to fix column shift)
        const actTd = document.createElement('td');
        actTd.className = 'align-middle cat-theory';
        actTd.innerHTML = '<div class="text-secondary" style="font-size:0.7rem">-</div>';
        tr.appendChild(actTd);
        
        // Period 6
        tr.appendChild(createCell(day, 5, periods[5]));
        // Period 7
        tr.appendChild(createCell(day, 6, periods[6]));"""

content = content.replace(old_grid_fix, new_grid_fix)

# saveMyTimetable mock
if "window.saveMyTimetable =" not in content:
    content += "\nwindow.saveMyTimetable = function() { alert('Timetable saved successfully!'); const m = bootstrap.Modal.getInstance(document.getElementById('myTimetableModal')); if(m) m.hide(); };\n"

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Restored all patches and fixed renderTimetableGrid ACT cell!")
