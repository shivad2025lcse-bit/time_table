import re

with open(r'd:\Java_project\frontend\src\DashboardLayout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add the Nav link in the sidebar
nav_link = """
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageClassAdvisorsModal" onClick={() => { window.renderManageClassAdvisors && window.renderManageClassAdvisors(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-user-tie fa-fw me-3 text-warning"></i> Manage Class Advisors
                                    </button>
"""

content = content.replace(
    '<button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageRosterModal"',
    nav_link.strip() + '\n                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageRosterModal"'
)

# 2. Add the Modal html right before the adminViewFacultyModal
modal_html = """
            {/* Manage Class Advisors Modal */}
            <div className="modal fade" id="manageClassAdvisorsModal" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-warning fw-bold"><i className="fa-solid fa-user-tie me-2"></i> Manage Class Advisors</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            <form id="assignClassAdvisorForm" onSubmit={(e) => { e.preventDefault(); window.assignClassAdvisor(); }} className="row g-3 mb-4">
                                <div className="col-md-5">
                                    <label className="form-label small">Select Faculty</label>
                                    <select id="advisorSelectFaculty" className="form-select form-select-sm bg-dark text-white border-secondary" required></select>
                                </div>
                                <div className="col-md-5">
                                    <label className="form-label small">Select Class / Section</label>
                                    <select id="advisorSelectClass" className="form-select form-select-sm bg-dark text-white border-secondary" required></select>
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <button type="submit" className="btn btn-sm btn-success w-100">Assign</button>
                                </div>
                            </form>
                            <hr className="border-secondary" />
                            <h6 className="text-info mb-3">Current Class Advisors</h6>
                            <div className="table-responsive">
                                <table className="table table-dark table-striped table-hover text-sm">
                                    <thead>
                                        <tr>
                                            <th>Faculty Name</th>
                                            <th>Assigned Class</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="classAdvisorsTbody"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
"""

content = content.replace(
    '{/* Admin View Full Faculty Details Modal */}',
    modal_html.strip() + '\n\n            {/* Admin View Full Faculty Details Modal */}'
)

with open(r'd:\Java_project\frontend\src\DashboardLayout.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated DashboardLayout.jsx")
