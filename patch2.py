import re

with open('d:/Java_project/frontend/public/js/frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

helpers = """
function getStudentFullName(student) {
    if (!student) return '-';
    if (student.firstName || student.lastName) {
        return `${student.firstName || ''} ${student.lastName || ''}`.trim() || '-';
    }
    return String(student.name || '-').trim() || '-';
}

function getFacultyFullName(staff) {
    if (!staff) return '-';
    if (staff.firstName || staff.lastName) {
        return `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || '-';
    }
    return String(staff.displayName || staff.name || '-').trim() || '-';
}
"""

content = re.sub(r'function getStudentFullName\(student\) \{.*?\}(?=\s*function buildGeneratedUsername)', helpers, content, flags=re.DOTALL)

with open('d:/Java_project/frontend/public/js/frontend_app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied")
