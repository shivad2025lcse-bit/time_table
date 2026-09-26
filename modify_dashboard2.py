import re

file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Change the Profile Dropdown "Change Password" target
text = text.replace('data-bs-target="#forgotPasswordModal"', 'data-bs-target="#changePasswordModal"')

# Add changePasswordModal at the end before closing tags
modal_html = """

            {/* ===== Change Password Modal (Authenticated Users) ===== */}
            <div className="modal fade" id="changePasswordModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title fw-bold text-warning"><i className="fa-solid fa-lock me-2"></i> Change Password</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body p-4">
                            <form id="changePasswordForm" onSubmit={(e) => { e.preventDefault(); window.handleChangePasswordSubmit && window.handleChangePasswordSubmit(e); }}>
                                <div className="mb-3">
                                    <label className="form-label text-muted small">Current Password</label>
                                    <input type="password" id="cpCurrentPassword" className="form-control bg-dark text-white border-secondary" required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small">New Password</label>
                                    <input type="password" id="cpNewPassword" className="form-control bg-dark text-white border-secondary" required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small">Confirm New Password</label>
                                    <input type="password" id="cpConfirmPassword" className="form-control bg-dark text-white border-secondary" required />
                                </div>
                                <div className="d-grid mt-4">
                                    <button type="submit" className="btn btn-warning fw-bold">Update Password</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

"""

if 'id="changePasswordModal"' not in text:
    text = text.replace('</>\n    );\n}', modal_html + '</>\n    );\n}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("DashboardLayout.jsx updated with Change Password modal.")
