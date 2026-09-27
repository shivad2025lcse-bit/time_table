import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
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
                </div>
            </td>
"""

pattern = re.compile(r'<td>\s*<div class="btn-group">\s*<button class="btn btn-sm btn-outline-warning py-0 px-2" onclick="window\.adminResetPassword.*?</button>\s*\$\{\s*c\.role === \'ROLE_STUDENT\'.*?</div>\s*</td>', re.DOTALL)
if pattern.search(content):
    content = pattern.sub(replacement.strip(), content)
    with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated button conditions")
else:
    print("Pattern not found")
