import re

with open('d:/Java_project/frontend/public/js/frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 2. Fix searchUserCredentials (Students)
content = content.replace(
'''        const filtered = query ? students.filter(s => 
            (s.registerNumber && String(s.registerNumber).toLowerCase().includes(query)) ||
            (s.name && String(s.name).toLowerCase().includes(query))
        ) : students;''',
'''        const filtered = query ? students.filter(s => 
            (s.roll && String(s.roll).toLowerCase().includes(query)) ||
            (s.registerNumber && String(s.registerNumber).toLowerCase().includes(query)) ||
            (getStudentFullName(s).toLowerCase().includes(query))
        ) : students;'''
)

content = content.replace(
'''                const username = (s.user && s.user.username) ? s.user.username : (s.registerNumber || '-');
                const password = (s.name && s.registerNumber && s.registerNumber.length >= 4) ? 
                    (s.name.trim().split(' ')[0] + String(s.registerNumber).slice(-4)) : 'student123';
                return `<tr>
                    <td><code class="text-warning">${username}</code></td>
                    <td>${s.name || '-'}</td>
                    <td><span class="badge bg-secondary">${s.section || '-'}</span></td>
                    <td><code class="text-info">${password}</code></td>
                </tr>`;''',
'''                const fullName = getStudentFullName(s);
                const roll = s.registerNumber || s.roll;
                const username = (s.user && s.user.username) ? s.user.username : (roll || '-');
                const password = (fullName !== '-' && roll && String(roll).length >= 4) ? 
                    (fullName.split(' ')[0].toLowerCase() + String(roll).slice(-4)) : 'student123';
                const secDisplay = s.section ? (s.section.sectionName || s.section.name || s.section.id || s.section) : (s.sec || '-');
                return `<tr>
                    <td><code class="text-warning">${username}</code></td>
                    <td>${fullName}</td>
                    <td><span class="badge bg-secondary">${secDisplay}</span></td>
                    <td><code class="text-info">${password}</code></td>
                </tr>`;'''
)

# 3. Fix searchUserCredentials (Faculty)
content = content.replace(
'''        const filtered = query ? facultyList.filter(f => 
            (f.name && String(f.name).toLowerCase().includes(query)) ||
            (f.department && String(f.department).toLowerCase().includes(query))
        ) : facultyList;''',
'''        const filtered = query ? facultyList.filter(f => 
            (getFacultyFullName(f).toLowerCase().includes(query)) ||
            (f.department && String(f.department).toLowerCase().includes(query))
        ) : facultyList;'''
)

content = content.replace(
'''                const username = f.username || (typeof buildGeneratedUsername === 'function' ? buildGeneratedUsername('FACULTY', f.name) : '-');
                const password = f.name ? (f.name.replace(/[^a-zA-Z]/g, '').toLowerCase() + '123') : 'faculty123';
                return `<tr>
                    <td>${f.name || '-'}</td>
                    <td><span class="badge bg-primary">${f.department || '-'}</span></td>
                    <td><code class="text-warning">${username}</code></td>
                    <td><code class="text-info">${password}</code></td>
                </tr>`;''',
'''                const fullName = getFacultyFullName(f);
                const username = f.username || (typeof buildGeneratedUsername === 'function' ? buildGeneratedUsername('FACULTY', fullName) : '-');
                const password = fullName !== '-' ? (fullName.replace(/[^a-zA-Z]/g, '').toLowerCase() + '123') : 'faculty123';
                return `<tr>
                    <td>${fullName}</td>
                    <td><span class="badge bg-primary">${f.department || '-'}</span></td>
                    <td><code class="text-warning">${username}</code></td>
                    <td><code class="text-info">${password}</code></td>
                </tr>`;'''
)

# 4. Fix searchUserCredentials (Advisors)
content = content.replace(
'''        const filtered = query ? displayAdvisors.filter(a => String(a.name).toLowerCase().includes(query)) : displayAdvisors;''',
'''        const filtered = query ? displayAdvisors.filter(a => getFacultyFullName(a).toLowerCase().includes(query)) : displayAdvisors;'''
)

content = content.replace(
'''                const username = a.username || (typeof buildGeneratedUsername === 'function' ? buildGeneratedUsername('FACULTY', a.name) : '-');
                const password = a.name ? (a.name.replace(/[^a-zA-Z]/g, '').toLowerCase() + '123') : 'advisor123';
                return `
                <tr>
                    <td>${a.name || '-'}</td>
                    <td><span class="badge bg-primary">${a.department || '-'}</span></td>
                    <td><code class="text-warning">${username}</code></td>
                    <td><code class="text-info">${password}</code></td>
                </tr>
                `;''',
'''                const fullName = getFacultyFullName(a);
                const username = a.username || (typeof buildGeneratedUsername === 'function' ? buildGeneratedUsername('FACULTY', fullName) : '-');
                const password = fullName !== '-' ? (fullName.replace(/[^a-zA-Z]/g, '').toLowerCase() + '123') : 'advisor123';
                return `
                <tr>
                    <td>${fullName}</td>
                    <td><span class="badge bg-primary">${a.department || '-'}</span></td>
                    <td><code class="text-warning">${username}</code></td>
                    <td><code class="text-info">${password}</code></td>
                </tr>
                `;'''
)

# 5. Fix renderEnrolledStudentsRoster
content = content.replace(
'''    visibleStudents.forEach((s, idx) => {
        const tr = document.createElement('tr');
        const roll = s.registerNumber || s.roll || '-';
        const name = s.firstName ? s.firstName + ' ' + (s.lastName || '') : (s.name || '-');
        const sec = s.section ? (s.section.sectionName || s.section.name) : (s.sec || '-');
        const email = s.collegeEmail || s.email || '-';
        const phone = s.phone || '-';

        // Pass the correct ID for deletion
        const deleteArg = s.id ? s.id : `'${roll}'`;''',
'''    visibleStudents.forEach((s, idx) => {
        const tr = document.createElement('tr');
        const roll = s.registerNumber || s.roll || '-';
        const name = getStudentFullName(s);
        const sec = s.section ? (s.section.sectionName || s.section.name || s.section.id || s.section) : (s.sec || '-');
        const email = s.collegeEmail || s.email || '-';
        const phone = s.phone || '-';

        // Pass the correct ID for deletion
        const deleteArg = s.id ? s.id : `'${roll}'`;'''
)

# 6. Fix renderMyTimetable
content = content.replace(
'''    const faculty = staffDirectory.find(s => buildGeneratedUsername('FACULTY', s.name) === myUsername);''',
'''    const faculty = staffDirectory.find(s => buildGeneratedUsername('FACULTY', getFacultyFullName(s)) === myUsername);'''
)

content = content.replace(
'''        entries = window.currentTimetableEntries.filter(e => {
            const fac = String(e.teacherName || e.facultyName || e.faculty || '').toLowerCase();
            return fac === String(faculty.name).toLowerCase() || fac === String(faculty.displayName).toLowerCase();
        });''',
'''        entries = window.currentTimetableEntries.filter(e => {
            const fac = String(e.teacherName || e.facultyName || e.faculty || '').toLowerCase().trim();
            const facFullName = getFacultyFullName(faculty).toLowerCase();
            return fac === facFullName || fac === String(faculty.displayName).toLowerCase().trim() || fac === String(faculty.name).toLowerCase().trim();
        });'''
)

content = content.replace(
'''                    periods.forEach((p, idx) => {
                        const fac = String(p.faculty || '').toLowerCase();
                        if (fac === String(faculty.name).toLowerCase() || fac === String(faculty.displayName).toLowerCase()) {''',
'''                    periods.forEach((p, idx) => {
                        const fac = String(p.faculty || '').toLowerCase().trim();
                        const facFullName = getFacultyFullName(faculty).toLowerCase();
                        if (fac === facFullName || fac === String(faculty.displayName).toLowerCase().trim() || fac === String(faculty.name).toLowerCase().trim()) {'''
)


with open('d:/Java_project/frontend/public/js/frontend_app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Full patch applied")
