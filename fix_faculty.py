import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
            let fac = n.originalFaculty;
            if (!fac || fac.trim() === '') {
                const pIdx = parseInt(n.period) - 1;
                if (n.section && n.day && timetableData[n.section] && timetableData[n.section][n.day] && timetableData[n.section][n.day][pIdx]) {
                    fac = timetableData[n.section][n.day][pIdx].faculty;
                }
                if (!fac || fac.trim() === '' || fac === '-') {
                    fac = 'Unknown/Vacant Faculty';
                }
            }
"""

content = content.replace("const fac = n.originalFaculty || 'Unknown/Vacant Faculty';", replacement.strip())

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
    f.write(content)
