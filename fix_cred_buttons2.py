import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add entityId to extra for ROLE_FACULTY
replacement1 = """
            } else if (c.role === 'ROLE_FACULTY') {
                const t = teachers.find(x => (x.user && x.user.username === c.username) || x.username === c.username);
                if (t) {
                    extra.name = t.displayName || t.name || t.firstName || '-';
                    extra.sectionDept = t.department ? (t.department.name || t.department) : (t.dept || '-');
                    extra.entityId = t.id || t.employeeId || `'${t.employeeId}'`;
"""
pattern1 = re.compile(r'\} else if \(c\.role === \'ROLE_FACULTY\'\) \{\s*const t = teachers\.find\(.*?\);\s*if \(t\) \{\s*extra\.name = [^\n]*;\s*extra\.sectionDept = [^\n]*;', re.DOTALL)
if pattern1.search(content):
    content = pattern1.sub(replacement1.strip(), content)
    print("Updated ROLE_FACULTY entityId")

# 2. Update filterCredentials buttons
replacement2 = """
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-warning py-0 px-2" onclick="window.adminResetPassword('${c.username}')" title="Reset Password">
                        <i class="fa-solid fa-key"></i> Reset
                    </button>
                    ${c.role === 'ROLE_STUDENT' ? `
                    <button class="btn btn-sm btn-outline-info py-0 px-2" onclick="window.editPersistentStudent(${typeof c.entityId === 'string' ? `'${c.entityId}'` : (c.entityId || `'${c.username}'`)})" title="Edit Student">
                        <i class="fa-solid fa-pen"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="window.deletePersistentStudent(${typeof c.entityId === 'string' ? `'${c.entityId}'` : (c.entityId || `'${c.username}'`)})" title="Delete Student">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                    ` : ''}
                    ${c.role === 'ROLE_FACULTY' ? `
                    <button class="btn btn-sm btn-outline-info py-0 px-2" onclick="window.editPersistentFaculty(${typeof c.entityId === 'string' ? `'${c.entityId}'` : (c.entityId || `'${c.username}'`)})" title="Edit Faculty">
                        <i class="fa-solid fa-pen"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="window.deletePersistentFaculty(${typeof c.entityId === 'string' ? `'${c.entityId}'` : (c.entityId || `'${c.username}'`)})" title="Delete Faculty">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                    ` : ''}
                </div>
            </td>
"""
pattern2 = re.compile(r'<td>\s*<div class="btn-group">\s*<button class="btn btn-sm btn-outline-warning py-0 px-2" onclick="window\.adminResetPassword.*?</button>\s*\$\{\s*c\.role === \'ROLE_STUDENT\'.*?</div>\s*</td>', re.DOTALL)
if pattern2.search(content):
    content = pattern2.sub(replacement2.strip(), content)
    print("Updated filterCredentials buttons")

# 3. Update deletePersistentFaculty
replacement3 = """
window.deletePersistentFaculty = async function (id) {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;
    try {
        const res = await apiFetch(`/api/teachers/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert('Faculty deleted.');
            if (window.loadAdminFullFaculty) loadAdminFullFaculty();
            if (window.renderAdminFacultyDetails) renderAdminFacultyDetails();
            if (window.renderCredentialsList && document.getElementById('viewCredentialsModal').classList.contains('show')) {
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
pattern3 = re.compile(r'window\.deletePersistentFaculty = async function \(id\) \{.*?^\};', re.DOTALL | re.MULTILINE)
if pattern3.search(content):
    content = pattern3.sub(replacement3.strip(), content)
    print("Updated deletePersistentFaculty")


with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
    f.write(content)
