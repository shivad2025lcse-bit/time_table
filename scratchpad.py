import sys, re

with open(r'd:\Java_project\frontend\src\DashboardLayout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Sidebar replacement
old_sidebar = '''                                <>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#adminViewFacultyModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-solid fa-address-card fa-fw me-3 text-info"></i> View Faculty Details
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageStudentsModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-solid fa-users fa-fw me-3" style={{color: '#a855f7'}}></i> Add Students
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageRosterModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-solid fa-users-gear fa-fw me-3" style={{color: 'var(--sece-indigo)'}}></i> Manage Roster
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageAnnouncementsModal" onClick={() => { window.renderManageAnnouncementsList && window.renderManageAnnouncementsList(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-bullhorn fa-fw me-3 text-success"></i> Announcements
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#adminAbsentNotifModal" onClick={() => { window.renderAdminLeaveNotifications?.(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-bell fa-fw me-3 text-warning"></i> Notifications
                                    </button>
                                </>'''

new_sidebar = '''                                <>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageStudentsModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-solid fa-users fa-fw me-3" style={{color: '#a855f7'}}></i> Add Students
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageAnnouncementsModal" onClick={() => { window.renderManageAnnouncementsList && window.renderManageAnnouncementsList(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-bullhorn fa-fw me-3 text-success"></i> Announcements
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageRosterModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-solid fa-users-gear fa-fw me-3" style={{color: 'var(--sece-indigo)'}}></i> Manage Roster
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#adminAbsentNotifModal" onClick={() => { window.renderAdminLeaveNotifications?.(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-bell fa-fw me-3 text-warning"></i> Notifications
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#adminViewFacultyModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-solid fa-address-card fa-fw me-3 text-info"></i> View Faculty Details
                                    </button>
                                </>'''

if old_sidebar in content:
    content = content.replace(old_sidebar, new_sidebar)
    print('Sidebar replaced!')
else:
    print('Sidebar not found!')


start_idx = content.find('<div className="row g-4">')
end_idx = content.find('</div>\n                        </div>\n                        )}\n\n                </main>')

if start_idx != -1 and end_idx != -1:
    cards_content = content[start_idx:end_idx]
    
    # We will just replace it with the new alphabetized block
    new_cards_content = '''<div className="row g-4">
                                {isAdmin && (
                                <div className="col-lg-4 col-md-6 col-sm-12">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#adminFacultyDetailsModal" onClick={() => window.renderAdminFacultyDetails && window.renderAdminFacultyDetails()} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,193,7,0.15)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-address-card text-warning mb-3" style={{ fontSize: "2.5rem" }}></i>
                                            <h5 className="text-light fw-bold mb-2">Faculty Details</h5>
                                            <p className="text-muted small mb-0">View complete details of enrolled faculty members.</p>
                                        </div>
                                    </div>
                                </div>
                                )}
                                {isAdmin && (
                                <div className="col-lg-4 col-md-6 col-sm-12">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#manageSectionsModal" onClick={() => { window.renderSectionsList && window.renderSectionsList(); }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(40,167,69,0.15)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-school text-success mb-3" style={{ fontSize: "2.5rem" }}></i>
                                            <h5 className="text-light fw-bold mb-2">Manage Classes</h5>
                                            <p className="text-muted small mb-0">Create and manage departments, years, and sections.</p>
                                        </div>
                                    </div>
                                </div>
                                )}
                                {isAdmin && (
                                <div className="col-lg-4 col-md-6 col-sm-12">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#manageFacultyModal" onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(220,53,69,0.15)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-chalkboard-user text-danger mb-3" style={{ fontSize: "2.5rem" }}></i>
                                            <h5 className="text-light fw-bold mb-2">Manage Faculty</h5>
                                            <p className="text-muted small mb-0">Register and manage faculty members.</p>
                                        </div>
                                    </div>
                                </div>
                                )}
                                {isAdmin && (
                                <div className="col-lg-4 col-md-6 col-sm-12">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#adminResourcesModal" onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,188,255,0.15)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-database text-info mb-3" style={{ fontSize: "2.5rem" }}></i>
                                            <h5 className="text-light fw-bold mb-2">Manage Subjects</h5>
                                            <p className="text-muted small mb-0">Add, edit, or remove subjects and timetable defaults.</p>
                                        </div>
                                    </div>
                                </div>
                                )}
                                {isAdmin && (
                                <div className="col-lg-4 col-md-6 col-sm-12">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#adminVenuesModal" onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(25,200,100,0.15)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-map-location-dot text-success mb-3" style={{ fontSize: "2.5rem" }}></i>
                                            <h5 className="text-light fw-bold mb-2">Manage Venues</h5>
                                            <p className="text-muted small mb-0">Configure classrooms, laboratories, and lecture halls.</p>
                                        </div>
                                    </div>
                                </div>
                                )}
                                <div className="col-lg-4 col-md-6 col-sm-12">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#manageRosterModal" onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(130,100,255,0.15)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-users-gear mb-3" style={{ fontSize: "2.5rem", color: "var(--sece-indigo, #7c6fe0)" }}></i>
                                            <h5 className="text-light fw-bold mb-2">Sections &amp; Students</h5>
                                            <p className="text-muted small mb-0">Manage section rosters and student data.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-6 col-sm-12">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#adminViewEditTimetableModal" onClick={() => window.initAdminViewEditTimetableModal && window.initAdminViewEditTimetableModal()} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,100,200,0.15)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-table-list text-pink mb-3" style={{ fontSize: "2.5rem", color: "var(--bs-pink, #d63384)" }}></i>
                                            <h5 className="text-light fw-bold mb-2">View / Edit Timetable</h5>
                                            <p className="text-muted small mb-0">Select batch, dept, year, and section to edit timetable.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="col-lg-4 col-md-6 col-sm-12">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#viewSectionsModal" onClick={() => window.renderSectionsList && window.renderSectionsList()} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(230,100,50,0.2)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-folder-tree text-danger mb-3" style={{ fontSize: "2.5rem" }}></i>
                                            <h5 className="text-light fw-bold mb-2">View Sections</h5>
                                            <p className="text-muted small mb-0">View and manage all academic sections created.</p>
                                        </div>
                                    </div>
                                </div>
                                {isAdmin && (
                                <div className="col-lg-4 col-md-6 col-sm-12">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#viewCredentialsModal" onClick={() => window.renderCredentialsList && window.renderCredentialsList()} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,255,150,0.2)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-key text-success mb-3" style={{ fontSize: "2.5rem" }}></i>
                                            <h5 className="text-light fw-bold mb-2">View Usernames / Passwords</h5>
                                            <p className="text-muted small mb-0">View all Enrolled Student and Faculty Credentials.</p>
                                        </div>
                                    </div>
                                </div>
                                )}
                            </div>\n'''
    
    content = content[:start_idx] + new_cards_content + content[end_idx:]
    print('Cards replaced!')
else:
    print('Cards not found!')

with open(r'd:\Java_project\frontend\src\DashboardLayout.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
