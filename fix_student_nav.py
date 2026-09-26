import re

with open(r'd:\Java_project\frontend\src\DashboardLayout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
                            {isStudent && (
                                <>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#studentTasksModal" onClick={() => { window.renderStudentTasks && window.renderStudentTasks(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-list-check fa-fw me-3 text-warning"></i> My Class Tasks
                                    </button>
                                    <button className="sidebar-nav-link" data-bs-toggle="modal" data-bs-target="#studentDayNotificationModal" onClick={() => window.innerWidth <= 992 && setIsSidebarOpen(false)}>
                                        <i className="fa-solid fa-bell fa-fw me-3 text-warning"></i> Period Notifications
                                    </button>
                                    <button className="sidebar-nav-link" onClick={() => { window.openStudentQuizHistoryModal && window.openStudentQuizHistoryModal(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-clock-rotate-left fa-fw me-3 text-info"></i> Quiz History
                                    </button>
                                    <button className="sidebar-nav-link" onClick={() => { window.openStudentQuizModal && window.openStudentQuizModal(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-solid fa-pen-to-square fa-fw me-3 text-danger"></i> Take Quiz
                                    </button>
                                    <button className="sidebar-nav-link" onClick={() => { window.showTtPopup && window.showTtPopup(); window.innerWidth <= 992 && setIsSidebarOpen(false); }}>
                                        <i className="fa-regular fa-calendar fa-fw me-3 text-primary"></i> Timetable
                                    </button>
                                </>
                            )}
"""

pattern = re.compile(r'\{isStudent && \(\s*<>\s*<button className="sidebar-nav-link".*?Timetable\s*</button>\s*<button className="sidebar-nav-link".*?Take Quiz\s*</button>\s*<button className="sidebar-nav-link".*?Quiz History\s*</button>\s*<button className="sidebar-nav-link".*?My Class Tasks\s*</button>\s*<button className="sidebar-nav-link".*?Period Notifications\s*</button>\s*</>\s*\)}', re.DOTALL)
if pattern.search(content):
    content = pattern.sub(replacement.strip(), content)
    with open(r'd:\Java_project\frontend\src\DashboardLayout.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced Student navigation")
else:
    print("Could not find Student navigation block")
