import re

with open(r'd:\Java_project\frontend\src\DashboardLayout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
                            {isFaculty && (
                                <>
                                    <button className="sidebar-nav-link" onClick={() => { window.openAddStudentDirectly(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-user-plus fa-fw me-3 text-success"></i> Add New Student
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageAnnouncementsModal" onClick={() => { window.renderManageAnnouncementsList && window.renderManageAnnouncementsList(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-bullhorn fa-fw me-3 text-success"></i> Announcements
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#assignTaskModal" onClick={() => { window.renderAssignTaskList && window.renderAssignTaskList(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-list-check fa-fw me-3 text-primary"></i> Assign Task
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#substitutionModal" onClick={() => { window.initSubstitutionModal && window.initSubstitutionModal(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-people-arrows fa-fw me-3 text-info"></i> Availability / Sub
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#manageSectionsModal" onClick={() => { window.renderSectionsList && window.renderSectionsList(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-school fa-fw me-3 text-success"></i> Classes
                                    </button>
                                    <button className="sidebar-nav-link" onClick={() => { window.openFacultyQuizModal && window.openFacultyQuizModal(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-clipboard-question fa-fw me-3 text-danger"></i> Manage Quizzes
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#adminAbsentNotifModal" onClick={() => { window.renderAdminLeaveNotifications?.(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-bell fa-fw me-3 text-warning"></i> Notifications
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#myTimetableModal" onClick={() => { window.renderMyTimetable && window.renderMyTimetable(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-regular fa-calendar fa-fw me-3 text-primary"></i> Timetable
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#adminViewEditTimetableModal" onClick={() => { window.initAdminViewEditTimetableModal && window.initAdminViewEditTimetableModal(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-users-rectangle fa-fw me-3 text-primary"></i> View Timetable
                                    </button>

                                    <div className="mt-2 pt-2 border-top border-secondary">
                                        <button className="sidebar-nav-link text-warning" data-bs-toggle="modal" data-bs-target="#classAdvisorLoginModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                            <i className="fa-solid fa-user-tie fa-fw me-3 text-warning"></i> Class Advisor View
                                        </button>
                                    </div>
                                </>
                            )}
"""

pattern = re.compile(r'\{isFaculty && \(\s*<>\s*<button className="sidebar-nav-link".*?classAdvisorLoginModal.*?</>\s*\)}', re.DOTALL)
if pattern.search(content):
    content = pattern.sub(replacement.strip(), content)
    with open(r'd:\Java_project\frontend\src\DashboardLayout.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced Faculty navigation")
else:
    print("Could not find Faculty navigation block")
