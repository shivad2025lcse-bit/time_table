import re

file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Precise substring replacements for each button in the top navbar.
# We map them to logical, visually appealing colors based on their function.

replacements = {
    # Logout: Destructive -> Danger
    'btn btn-sm btn-outline-danger d-flex align-items-center gap-1"\\n                                    type="button" onClick={() => window.logoutUser': 'btn btn-sm btn-outline-danger d-flex align-items-center gap-1"\\n                                    type="button" onClick={() => window.logoutUser',
    
    # Forgot Password: Auth/Security -> Warning
    'id="forgotPasswordModal"': 'btn-outline-warning',
    
    # Theme: Neutral -> Secondary
    'id="themeToggleBtn" className="btn btn-sm btn-outline-secondary': 'id="themeToggleBtn" className="btn btn-sm btn-outline-secondary',
    
    # Add Faculty: Admin creation -> Success
    'id="manageFacultyBtn" className="btn btn-sm btn-outline-warning': 'id="manageFacultyBtn" className="btn btn-sm btn-outline-success',
    
    # Add Students: Admin creation -> Success
    'id="manageStudentsBtn" className="btn btn-sm btn-outline-info': 'id="manageStudentsBtn" className="btn btn-sm btn-outline-success',
    
    # Assign Task: Management -> Primary
    'id="assignTaskBtn" className={tn btn-sm btn-outline-primary': 'id="assignTaskBtn" className={tn btn-sm btn-outline-primary',
    
    # Class Advisor View: Details/View -> Info
    'id="classAdvisorBtn" className={tn btn-sm btn-outline-warning': 'id="classAdvisorBtn" className={tn btn-sm btn-outline-info',
    
    # Faculty Details: Details/View -> Info
    'id="facultyDetailsBtn" className={tn btn-sm btn-outline-primary': 'id="facultyDetailsBtn" className={tn btn-sm btn-outline-info',
    
    # Manage Announcements: Management -> Primary
    'id="manageAnnouncementsBtn" className={tn btn-sm btn-outline-success': 'id="manageAnnouncementsBtn" className={tn btn-sm btn-outline-primary',
    
    # Manage Quizzes: Moderation -> Warning
    'id="facultyQuizBtn" className={tn btn-sm btn-outline-danger': 'id="facultyQuizBtn" className={tn btn-sm btn-outline-warning',
    
    # Manage Sections: Management -> Primary
    'id="manageSectionsBtn" className={tn btn-sm btn-outline-warning': 'id="manageSectionsBtn" className={tn btn-sm btn-outline-primary',
    
    # My Class Tasks: Task -> Warning
    'id="studentTasksBtn" className={tn btn-sm btn-outline-warning': 'id="studentTasksBtn" className={tn btn-sm btn-outline-warning',
    
    # My Student Details: Details/View -> Info
    'id="studentProfileBtn" className={tn btn-sm btn-outline-success': 'id="studentProfileBtn" className={tn btn-sm btn-outline-info',
    
    # Period Notifications: Alerts -> Warning
    'id="studentDayNotificationBtn" className="btn btn-sm btn-outline-info': 'id="studentDayNotificationBtn" className="btn btn-sm btn-outline-warning',
    
    # Quiz History: Details/View -> Info
    'id="studentQuizHistoryBtn" className={tn btn-sm btn-outline-info': 'id="studentQuizHistoryBtn" className={tn btn-sm btn-outline-info',
    
    # Register SMS: Alerts -> Warning
    'id="notifBellBtn" className="btn btn-sm btn-outline-info': 'id="notifBellBtn" className="btn btn-sm btn-outline-warning',
    
    # Staff Availability: View -> Info
    'id="substitutionBtn" className="btn btn-sm btn-outline-warning': 'id="substitutionBtn" className="btn btn-sm btn-outline-info',
    
    # Take Quiz: Action -> Success
    'id="studentQuizBtn" className={tn btn-sm btn-outline-danger': 'id="studentQuizBtn" className={tn btn-sm btn-outline-success',
    
    # Admin View Faculty: View -> Info
    'id="adminViewFacultyBtn" className={tn btn-sm btn-outline-info': 'id="adminViewFacultyBtn" className={tn btn-sm btn-outline-info',
    
    # Your Timetable: Management -> Primary
    'id="myTimetableBtn" className="btn btn-sm btn-outline-info': 'id="myTimetableBtn" className="btn btn-sm btn-outline-primary',
}

for old, new in replacements.items():
    if old.startswith('id='):
        text = text.replace(old, new)
    elif 'logoutUser' in old:
        pass # Not changing logout for now, it's fine as is

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Semantic button colors applied correctly!')
