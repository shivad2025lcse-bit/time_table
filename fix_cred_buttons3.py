import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement1 = """
window.deletePersistentStudent = async function (id) {
    if (!confirm('Are you sure you want to delete this student permanently?')) return;
    try {
        const url = typeof id === 'string' ? `/api/auth/user/${id}` : `/api/students/${id}`;
        const res = await apiFetch(url, { method: 'DELETE' });
        if (res.ok) {
            alert('Student deleted.');
            if (typeof id !== 'string') {
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
            }
            if (window.renderCredentialsList && document.getElementById('viewCredentialsModal')?.classList.contains('show')) {
                window.renderCredentialsList();
            }
        } else {
            alert('Failed to delete student.');
        }
    } catch (err) {
        alert('Error connecting to server.');
    }
};
"""

pattern1 = re.compile(r'window\.deletePersistentStudent = async function \(id\) \{.*?(?=\};)\};', re.DOTALL)
if pattern1.search(content):
    content = pattern1.sub(replacement1.strip(), content)
    print("Updated deletePersistentStudent")
else:
    print("Pattern 1 not found")

replacement2 = """
window.deletePersistentFaculty = async function (id) {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;
    try {
        const url = typeof id === 'string' ? `/api/auth/user/${id}` : `/api/teachers/${id}`;
        const res = await apiFetch(url, { method: 'DELETE' });
        if (res.ok) {
            alert('Faculty deleted.');
            if (window.loadAdminFullFaculty) loadAdminFullFaculty();
            if (window.renderAdminFacultyDetails) renderAdminFacultyDetails();
            if (window.renderCredentialsList && document.getElementById('viewCredentialsModal')?.classList.contains('show')) {
                window.renderCredentialsList();
            }
        } else {
            alert('Failed to delete faculty.');
        }
    } catch (err) {
        console.error(err);
    }
};
"""

pattern2 = re.compile(r'window\.deletePersistentFaculty = async function \(id\) \{.*?(?=\};)\};', re.DOTALL)
if pattern2.search(content):
    content = pattern2.sub(replacement2.strip(), content)
    print("Updated deletePersistentFaculty")
else:
    print("Pattern 2 not found")


with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
    f.write(content)
