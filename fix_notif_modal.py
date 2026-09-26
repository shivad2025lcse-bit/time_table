import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
        const secStr = n.section || (typeof currentSection !== 'undefined' ? currentSection : 'II CSE C') || '-';
        let dayName = n.day;
        if (!dayName) {
            const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dObj = new Date(n.date);
            if (!isNaN(dObj.getTime())) dayName = daysArr[dObj.getDay()];
        }
        const pIdx = parseInt(n.period) - 1;
        let actualSubject = n.subject || n.reason || '-';
        let actualFaculty = n.originalFaculty;

        if (secStr !== '-' && dayName && timetableData[secStr] && timetableData[secStr][dayName] && timetableData[secStr][dayName][pIdx]) {
            const slot = timetableData[secStr][dayName][pIdx];
            if (!actualFaculty || actualFaculty === 'Unknown') actualFaculty = slot.faculty;
            if (actualSubject === 'Substitution' || actualSubject === '-' || actualSubject.includes('Faculty/Admin changed')) {
                actualSubject = slot.sub;
            }
        }

        if (!actualFaculty || actualFaculty === '-') actualFaculty = 'Unknown/Vacant Faculty';

        let facDisplay = '';
        if (isLeave) {
            facDisplay = `<span class="text-danger fw-bold">${actualFaculty}<br><span class="badge bg-danger mt-1">On Leave / Absent</span></span>`;
        } else if (n.source === 'manual') {
            facDisplay = `<strong>${n.staff || '-'}</strong>`;
        } else {
            facDisplay = `<span class="text-danger fw-bold">${actualFaculty}<br><span class="badge bg-danger mt-1">Absent</span></span><br><i class="fa-solid fa-arrow-down text-warning my-1"></i><br><span class="text-success fw-bold">Substituted By: ${n.staff}</span>`;
        }

        let year = '-', dept = '-', sec = '-';
"""

pattern = re.compile(
    r'let facDisplay = \'\';\s*if \(isLeave\) \{\s*facDisplay = `<span class="text-danger fw-bold">\$\{n\.originalFaculty\}<br><span class="badge bg-danger mt-1">On Leave / Absent</span></span>`;\s*\} else if \(n\.source === \'manual\'\) \{\s*facDisplay = `<strong>\$\{n\.staff \|\| \'\-\'\}</strong>`;\s*\} else \{\s*facDisplay = `<span class="text-danger fw-bold">\$\{n\.originalFaculty \|\| \'Unknown\'\}<br><span class="badge bg-danger mt-1">Absent</span></span><br><i class="fa-solid fa-arrow-down text-warning my-1"></i><br><span class="text-success fw-bold">Substituted By: \$\{n\.staff\}</span>`;\s*\}\s*const secStr = n\.section \|\| currentSection \|\| \'\-\';\s*let year = \'\-\', dept = \'\-\', sec = \'\-\';',
    re.MULTILINE
)

if pattern.search(content):
    content = pattern.sub(replacement.strip(), content)
    
    # Also replace <td>${n.subject || n.reason || '-'}</td>
    content = content.replace("<td>${n.subject || n.reason || '-'}</td>", "<td>${actualSubject}</td>")
    
    with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success replacing block.")
else:
    print("Could not find the block to replace.")
