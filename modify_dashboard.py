import re

file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update imports
if 'useState' not in text[:200]:
    text = text.replace('import React, { useEffect } from "react";', 'import React, { useEffect, useState } from "react";')

# 2. Add state
state_injection = "    const [isSidebarOpen, setIsSidebarOpen] = useState(true);\n"
if "const [isSidebarOpen" not in text:
    text = text.replace('    const isFaculty = location.pathname === "/faculty";', '    const isFaculty = location.pathname === "/faculty";\n' + state_injection)

# 3. Replace the entire <header> and the start of <main>
# We'll regex replace from `<header className="inst-header` down to `<main className=`
pattern = re.compile(r'<header className="inst-header.*?</header>\s*<div id="announcementTickerContainer".*?</div>\s*</div>\s*<main className="container-fluid px-4 py-3">', re.DOTALL)

replacement = """<header className="inst-header no-print sticky-top" style={{ zIndex: 1050, backgroundColor: 'var(--sece-bg, #0b0f17)', borderBottom: '1px solid rgba(255,255,255,0.1)', height: '60px' }}>
                    <div className="container-fluid px-3 h-100">
                        <div className="d-flex align-items-center justify-content-between h-100">
                            <div className="d-flex align-items-center gap-3">
                                <button className="btn btn-sm text-white fs-5 border-0 px-2 shadow-none" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                                    <i className="fa-solid fa-bars"></i>
                                </button>
                                <div className="d-flex align-items-center gap-2">
                                    <img src="/images/sece-logo.png" alt="SECE Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} className="d-none d-sm-block" />
                                    <h1 className="h6 mb-0 fw-bold text-white tracking-tight d-none d-sm-block">Smart Class and Timetable Scheduler</h1>
                                    <h1 className="h6 mb-0 fw-bold text-white tracking-tight d-block d-sm-none">Timetable Scheduler</h1>
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-2 gap-md-3">
                                <button className="btn btn-sm text-warning fs-5 border-0 px-2 shadow-none position-relative" type="button" data-bs-toggle="modal" data-bs-target="#adminAbsentNotifModal" onClick={() => window.renderAdminLeaveNotifications?.()}>
                                    <i className="fa-solid fa-bell"></i>
                                </button>

                                <div className="dropdown">
                                    <button className="btn btn-sm border-0 dropdown-toggle d-flex align-items-center gap-2 shadow-none px-2" type="button" data-bs-toggle="dropdown" aria-expanded="false" style={{ background: 'transparent' }}>
                                        <i className="fa-solid fa-circle-user fs-4 text-info"></i>
                                        <span id="loggedInUsernameLabel" className="d-none d-md-block text-white small fw-bold"></span>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow border-secondary" style={{ minWidth: '220px' }}>
                                        <li className="px-3 py-2">
                                            <div className="small text-muted mb-1">Role</div>
                                            <div className="fw-bold text-white">{isAdmin ? 'ADMIN' : isFaculty ? 'FACULTY' : 'STUDENT'}</div>
                                        </li>
                                        <li><hr className="dropdown-divider border-secondary" /></li>
                                        <li>
                                            <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={() => {
                                                if (isAdmin) {
                                                    // Add admin profile if needed
                                                } else if (isFaculty) {
                                                    const btn = document.getElementById('facultyDetailsBtn');
                                                    if (btn) btn.click();
                                                    else if (window.renderFacultyDetailsView) window.renderFacultyDetailsView();
                                                } else if (isStudent) {
                                                    window.openStudentProfileModal && window.openStudentProfileModal();
                                                }
                                            }}>
                                                <i className="fa-solid fa-user text-info"></i> My Profile
                                            </button>
                                        </li>
                                        <li>
                                            <button className="dropdown-item py-2 d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#forgotPasswordModal">
                                                <i className="fa-solid fa-lock text-warning"></i> Change Password
                                            </button>
                                        </li>
                                        <li>
                                            <button className="dropdown-item py-2 d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#adminAbsentNotifModal" onClick={() => window.renderAdminLeaveNotifications?.()}>
                                                <i className="fa-solid fa-bell text-success"></i> Notifications
                                            </button>
                                        </li>
                                        <li><hr className="dropdown-divider border-secondary" /></li>
                                        <li>
                                            <button className="dropdown-item py-2 text-danger d-flex align-items-center gap-2" onClick={() => window.logoutUser()}>
                                                <i className="fa-solid fa-right-from-bracket"></i> Logout
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div id="announcementTickerContainer" className="w-100 bg-success text-white py-1 marquee-l2r-container" style={{ borderBottom: "2px solid #198754", zIndex: 1040, position: 'relative' }}>
                    <div id="announcementMarquee" className="marquee-l2r-content mb-0 fw-bold fs-6" style={{ letterSpacing: "0.5px" }}></div>
                </div>

                <div className="app-layout">
                    {/* Sidebar Drawer / Menu */}
                    <aside className={`app-sidebar d-flex flex-column p-3 ${isSidebarOpen ? 'open' : 'd-none d-lg-flex'}`} style={{ display: isSidebarOpen ? 'flex' : 'none' }}>
                        <div className="text-muted text-uppercase small fw-bold mb-3 px-2" style={{ letterSpacing: '1px' }}>Navigation</div>
                        <nav className="d-flex flex-column gap-2 flex-grow-1">
                            <button className="sidebar-nav-link" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                <i className="fa-solid fa-house fa-fw me-3 text-secondary"></i> Dashboard
                            </button>

                            {isAdmin && (
                                <>
                                    <button className="sidebar-nav-link" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-regular fa-calendar fa-fw me-3 text-primary"></i> Timetable
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#adminResourcesModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-solid fa-book fa-fw me-3 text-warning"></i> Manage Subjects
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageSectionsModal" onClick={() => { window.renderSectionsList && window.renderSectionsList(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-school fa-fw me-3 text-success"></i> Manage Classes
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#adminVenuesModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-solid fa-door-open fa-fw me-3 text-info"></i> Manage Venues
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageFacultyModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-solid fa-chalkboard-user fa-fw me-3 text-danger"></i> Faculty
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageStudentsModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-solid fa-users fa-fw me-3" style={{color: '#a855f7'}}></i> Students
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#adminAbsentNotifModal" onClick={() => { window.renderAdminLeaveNotifications?.(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-bell fa-fw me-3 text-warning"></i> Notifications
                                    </button>
                                </>
                            )}

                            {isFaculty && (
                                <>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#myTimetableModal" onClick={() => { window.renderMyTimetable && window.renderMyTimetable(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-regular fa-calendar fa-fw me-3 text-primary"></i> Timetable
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#adminResourcesModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-solid fa-book fa-fw me-3 text-warning"></i> Subjects
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageSectionsModal" onClick={() => { window.renderSectionsList && window.renderSectionsList(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-school fa-fw me-3 text-success"></i> Classes
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#adminAbsentNotifModal" onClick={() => { window.renderAdminLeaveNotifications?.(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-bell fa-fw me-3 text-warning"></i> Notifications
                                    </button>
                                    
                                    <div className="mt-2 pt-2 border-top border-secondary">
                                        <button className="sidebar-nav-link text-warning" data-bs-toggle="modal" data-bs-target="#classAdvisorLoginModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                            <i className="fa-solid fa-user-tie fa-fw me-3 text-warning"></i> Class Advisor View
                                        </button>
                                    </div>
                                </>
                            )}

                            {isStudent && (
                                <>
                                    <button className="sidebar-nav-link" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-regular fa-calendar fa-fw me-3 text-primary"></i> Timetable
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#adminAbsentNotifModal" onClick={() => { window.renderAdminLeaveNotifications?.(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-bell fa-fw me-3 text-warning"></i> Notifications
                                    </button>
                                </>
                            )}
                        </nav>
                        <div className="mt-auto pt-3 border-top border-secondary">
                            <button className="sidebar-nav-link text-danger" onClick={() => window.logoutUser()}>
                                <i className="fa-solid fa-right-from-bracket fa-fw me-3"></i> Logout
                            </button>
                        </div>
                    </aside>

                    {/* Mobile Overlay */}
                    <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

                    {/* Main Workspace */}
                    <main className="app-main container-fluid px-4 py-3">"""

text = pattern.sub(replacement, text)

# Close the newly opened `<div className="app-layout">` at the bottom of the component
closing_pattern = re.compile(r'</main>\s*</div>\s*</div>\s*\)\s*;\s*}\s*$', re.DOTALL)
if '</div>\n        </div>\n    );\n}' in text:
    text = closing_pattern.sub('</main>\n                </div>\n            </div>\n        </div>\n    );\n}', text)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("DashboardLayout.jsx modified.")
