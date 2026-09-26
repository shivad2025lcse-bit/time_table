import re

with open(r'd:\Java_project\frontend\src\DashboardLayout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the "My Profile" click handler for isFaculty
content = content.replace(
    'else if (window.renderFacultyDetailsView) window.renderFacultyDetailsView();',
    'else if (window.openFacultyProfileModal) window.openFacultyProfileModal();'
)

# 2. Add the facultyProfileModal below studentProfileModal
faculty_modal = """
            <div className="modal fade" id="facultyProfileModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-info fw-bold"><i className="fa-solid fa-chalkboard-user me-2"></i> My Faculty Details</h5>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body" id="facultyProfileBody"></div>
                    </div>
                </div>
            </div>
"""

pattern = re.compile(r'(<div className="modal fade" id="studentProfileModal".*?</div>\s*</div>\s*</div>)', re.DOTALL)
if pattern.search(content):
    content = pattern.sub(r'\1\n' + faculty_modal, content)
    with open(r'd:\Java_project\frontend\src\DashboardLayout.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("DashboardLayout.jsx updated.")
else:
    print("Could not find studentProfileModal block.")
