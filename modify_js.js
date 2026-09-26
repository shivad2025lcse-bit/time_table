const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Java_project', 'frontend', 'public', 'js', 'frontend_app.js');
let content = fs.readFileSync(filePath, 'utf8');

const handlerStr = `
window.handleChangePasswordSubmit = async function(e) {
    e.preventDefault();
    const cpCurrent = document.getElementById('cpCurrentPassword').value;
    const cpNew = document.getElementById('cpNewPassword').value;
    const cpConfirm = document.getElementById('cpConfirmPassword').value;

    if (cpNew !== cpConfirm) {
        alert("New passwords do not match.");
        return;
    }

    try {
        const formData = new URLSearchParams();
        formData.append('currentPassword', cpCurrent);
        formData.append('newPassword', cpNew);

        const res = await apiFetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        if (res.ok) {
            alert("Password updated successfully!");
            document.getElementById('changePasswordForm').reset();
            const modalEl = document.getElementById('changePasswordModal');
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
        } else {
            const err = await res.text();
            alert("Failed to change password: " + err);
        }
    } catch (e) {
        console.error(e);
        alert("An error occurred while changing password.");
    }
};
`;

if (!content.includes('window.handleChangePasswordSubmit')) {
    content += '\n' + handlerStr;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Added handleChangePasswordSubmit to frontend_app.js");
}
