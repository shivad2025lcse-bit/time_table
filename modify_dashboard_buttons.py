import re

file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace Admin Sidebar section
admin_start_marker = "{isAdmin && ("
admin_end_marker = """)}

                            {isFaculty && ("""

admin_new = """{isAdmin && (
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
                                </>
                            )}

                            {isFaculty && ("""

# Replace Faculty Sidebar section
faculty_start_marker = "{isFaculty && ("
faculty_end_marker = """)}

                            {isStudent && ("""

faculty_new = """{isFaculty && (
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
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageClassTtModal" onClick={() => { window.initManageClassTt && window.initManageClassTt(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-users-rectangle fa-fw me-3 text-primary"></i> Manage Class TT
                                    </button>
                                    <button className="sidebar-nav-link" onClick={() => { window.openFacultyQuizModal && window.openFacultyQuizModal(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-clipboard-question fa-fw me-3 text-danger"></i> Manage Quizzes
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#assignTaskModal" onClick={() => { window.renderAssignTaskList && window.renderAssignTaskList(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-list-check fa-fw me-3 text-primary"></i> Assign Task
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#substitutionModal" onClick={() => { window.initSubstitutionModal && window.initSubstitutionModal(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-people-arrows fa-fw me-3 text-info"></i> Availability / Sub
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageRosterModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-solid fa-users-gear fa-fw me-3" style={{color: 'var(--sece-indigo)'}}></i> Manage Roster
                                    </button>
                                    <button className="sidebar-nav-link" onClick={() => { window.openAddStudentDirectly(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-user-plus fa-fw me-3 text-success"></i> Add New Student
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageAnnouncementsModal" onClick={() => { window.renderManageAnnouncementsList && window.renderManageAnnouncementsList(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-bullhorn fa-fw me-3 text-success"></i> Announcements
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

                            {isStudent && ("""

student_start_marker = "{isStudent && ("
student_end_marker = """)}
                        </nav>
                        <div className="mt-auto pt-3 border-top border-secondary">"""

student_new = """{isStudent && (
                                <>
                                    <button className="sidebar-nav-link" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-regular fa-calendar fa-fw me-3 text-primary"></i> Timetable
                                    </button>
                                    <button className="sidebar-nav-link" onClick={() => { window.openStudentQuizModal && window.openStudentQuizModal(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-pen-to-square fa-fw me-3 text-danger"></i> Take Quiz
                                    </button>
                                    <button className="sidebar-nav-link" onClick={() => { window.openStudentQuizHistoryModal && window.openStudentQuizHistoryModal(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-clock-rotate-left fa-fw me-3 text-info"></i> Quiz History
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#studentTasksModal" onClick={() => { window.renderStudentTasks && window.renderStudentTasks(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-list-check fa-fw me-3 text-warning"></i> My Class Tasks
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#studentDayNotificationModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-solid fa-bell fa-fw me-3 text-warning"></i> Period Notifications
                                    </button>
                                </>
                            )}
                        </nav>
                        
                        {/* Download TT - Shared */}
                        <div className="px-2 mb-3 dropdown">
                            <button className="btn btn-sm btn-success dropdown-toggle fw-bold d-flex align-items-center justify-content-center gap-2 w-100" type="button" data-bs-toggle="dropdown">
                                <i className="fa-solid fa-download"></i> Download TT
                            </button>
                            <ul className="dropdown-menu dropdown-menu-dark shadow w-100">
                                <li><a className="dropdown-item" href="#" onClick={() => { window.downloadTimetablePNG(); window.innerWidth <= 992 && setIsSidebarOpen(false); }} ><i className="fa-solid fa-file-image me-2 text-info"></i> PNG Image</a></li>
                                <li><a className="dropdown-item" href="#" onClick={() => { window.exportTimetableCSV(); window.innerWidth <= 992 && setIsSidebarOpen(false); }} ><i className="fa-solid fa-file-csv me-2 text-success"></i> CSV Spreadsheet</a></li>
                                <li><a className="dropdown-item" href="#" onClick={() => { window.print(); window.innerWidth <= 992 && setIsSidebarOpen(false); }} ><i className="fa-solid fa-file-pdf me-2 text-danger"></i> Print / PDF</a></li>
                            </ul>
                        </div>
                        
                        <div className="mt-auto pt-3 border-top border-secondary">"""

text = re.sub(re.escape(admin_start_marker) + r".*?" + re.escape(admin_end_marker), admin_new, text, flags=re.DOTALL)
text = re.sub(re.escape(faculty_start_marker) + r".*?" + re.escape(faculty_end_marker), faculty_new, text, flags=re.DOTALL)
text = re.sub(re.escape(student_start_marker) + r".*?" + re.escape(student_end_marker), student_new, text, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("DashboardLayout.jsx updated with missing buttons.")
