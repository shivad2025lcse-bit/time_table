import re

file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Define mapping for specific button IDs to their semantic bootstrap classes
mapping = {
    # Logout / Destructive
    'btn-outline-danger d-flex align-items-center gap-1"\\n\\s+type="button" onClick={() => window.logoutUser': 'btn-outline-danger',
    
    # Settings & Alerts (Warning/Yellow)
    'id="forgotPasswordModal"': 'btn-outline-warning',
    'id="studentDayNotificationBtn"': 'btn-outline-warning',
    'id="notifBellBtn"': 'btn-outline-warning',
    'id="facultyQuizBtn"': 'btn-outline-warning', # Manage Quizzes
    'id="studentTasksBtn"': 'btn-outline-warning', # My Class Tasks
    
    # Neutral (Secondary/Gray)
    'id="themeToggleBtn"': 'btn-outline-secondary',
    
    # Core & Management (Primary/Blue)
    'id="assignTaskBtn"': 'btn-outline-primary',
    'id="manageAnnouncementsBtn"': 'btn-outline-primary',
    'id="manageSectionsBtn"': 'btn-outline-primary',
    'id="manageRosterBtn"': 'btn-outline-primary',
    'id="myTimetableBtn"': 'btn-outline-primary',
    
    # View & Details (Info/Cyan)
    'id="classAdvisorBtn"': 'btn-outline-info',
    'id="facultyDetailsBtn"': 'btn-outline-info',
    'id="studentProfileBtn"': 'btn-outline-info',
    'id="studentQuizHistoryBtn"': 'btn-outline-info',
    'id="adminViewFacultyBtn"': 'btn-outline-info',
    'id="substitutionBtn"': 'btn-outline-info', # Staff Availability
    
    # Creation & Positive (Success/Green)
    'id="manageFacultyBtn"': 'btn-outline-success',
    'id="addStudentDirectBtn"': 'btn-outline-success',
    'id="manageStudentsBtn"': 'btn-outline-success',
    'id="studentQuizBtn"': 'btn-outline-success', # Take Quiz
}

# First, extract the block of text for the header (roughly lines 170 to 320)
start_idx = text.find('<div className="d-flex align-items-center gap-2 flex-wrap">')
end_idx = text.find('<main className="container-fluid px-4 py-4 flex-grow-1">')

if start_idx != -1 and end_idx != -1:
    header_block = text[start_idx:end_idx]
    
    for key, new_color in mapping.items():
        if key.startswith('btn-outline-danger'):
            # Handle the logout button specifically as it doesn't have an ID
            header_block = re.sub(r'btn-outline-\w+(?=\s+d-flex align-items-center gap-1"\s*type="button" onClick=\{\(\) => window.logoutUser)', new_color, header_block)
        else:
            # Replace whatever btn-outline-* or btn-* is on the button with the given ID
            pattern = r'(<button[^>]*' + re.escape(key) + r'[^>]*className="[^"]*?)(?:btn-(?:outline-)?(?:primary|secondary|success|danger|warning|info|indigo|dark|light))([^"]*")'
            header_block = re.sub(pattern, r'\1' + new_color + r'\2', header_block)
            
            # Also handle if it's using backticks for className={...}
            pattern_bt = r'(<button[^>]*' + re.escape(key) + r'[^>]*className={[^]*?)(?:btn-(?:outline-)?(?:primary|secondary|success|danger|warning|info|indigo|dark|light))([^]*)'
            header_block = re.sub(pattern_bt, r'\1' + new_color + r'\2', header_block)

    text = text[:start_idx] + header_block + text[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Semantic button colors applied!')
