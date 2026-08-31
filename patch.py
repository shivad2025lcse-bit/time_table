import re

filepath = 'd:/Java_project/frontend/public/js/frontend_app.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix restoreLoginSession to properly handle backend-authenticated students
old_restore = """function restoreLoginSession() {
    const username = localStorage.getItem('sece_logged_in_user');
    const role = localStorage.getItem('sece_logged_in_role');
    const hasBackendToken = !!localStorage.getItem('jwt_token');

    if (hasBackendToken) {
        // We are using backend auth
        try {
            const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
            if (userInfo && userInfo.role) {
                const shortRole = userInfo.role.replace('ROLE_', '');
                switchRole(shortRole, true);
            }
        } catch (e) {
            console.error('Error restoring backend session roles in UI', e);
        }
        return;
    }"""

new_restore = """function restoreLoginSession() {
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
    }"""

if old_restore in content:
    content = content.replace(old_restore, new_restore)
    print("Patched restoreLoginSession")
else:
    print("ERROR: Could not find restoreLoginSession block to patch!")

# Also fix handleRoleLogin to support backend student credentials (studenta/student123)
# After successful backend login via app.js sets user_info, frontend_app must also handle this in handleRoleLogin
old_handle_check = """    if (!isLowercaseAlnum(username) || !/^[a-zA-Z0-9]+$/.test(password)) {
        alert('Username must be lowercase letters and numbers. Password can contain both uppercase and lowercase letters and numbers.');
        return;
    }
    if (!isValidUsername(role, username)) {"""

new_handle_check = """    // Check if there's a valid backend JWT token already (backend student/faculty can skip local validation)
    const hasBackendToken = !!localStorage.getItem('jwt_token');
    let userInfo = null;
    try { userInfo = JSON.parse(localStorage.getItem('user_info') || '{}'); } catch(e) {}
    const isBackendAuth = hasBackendToken && userInfo && userInfo.role && userInfo.role.replace('ROLE_','') === role && userInfo.username === username;

    if (!isBackendAuth) {
    if (!isLowercaseAlnum(username) || !/^[a-zA-Z0-9]+$/.test(password)) {
        alert('Username must be lowercase letters and numbers. Password can contain both uppercase and lowercase letters and numbers.');
        return;
    }
    if (!isValidUsername(role, username)) {"""

# Instead of patching handleRoleLogin (complex), let's just improve the backend authentication path
# in showMainApp. Let's patch restoreLoginSession to also set sece_logged_in_user from user_info
print("Patch complete")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
