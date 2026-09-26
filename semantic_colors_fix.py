import re

file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Define mapping for specific button IDs to their semantic bootstrap classes
mapping = {
    'btn-outline-danger d-flex align-items-center gap-1"\\n\\s+type="button" onClick={() => window.logoutUser': 'btn-outline-danger',
    'id="forgotPasswordModal"': 'btn-outline-warning',
    'id="studentDayNotificationBtn"': 'btn-outline-warning',
    'id="notifBellBtn"': 'btn-outline-warning',
    'id="facultyQuizBtn"': 'btn-outline-warning',
    'id="studentTasksBtn"': 'btn-outline-warning',
    'id="themeToggleBtn"': 'btn-outline-secondary',
    'id="assignTaskBtn"': 'btn-outline-primary',
    'id="manageAnnouncementsBtn"': 'btn-outline-primary',
    'id="manageSectionsBtn"': 'btn-outline-primary',
    'id="manageRosterBtn"': 'btn-outline-primary',
    'id="myTimetableBtn"': 'btn-outline-primary',
    'id="classAdvisorBtn"': 'btn-outline-info',
    'id="facultyDetailsBtn"': 'btn-outline-info',
    'id="studentProfileBtn"': 'btn-outline-info',
    'id="studentQuizHistoryBtn"': 'btn-outline-info',
    'id="adminViewFacultyBtn"': 'btn-outline-info',
    'id="substitutionBtn"': 'btn-outline-info',
    'id="manageFacultyBtn"': 'btn-outline-success',
    'id="addStudentDirectBtn"': 'btn-outline-success',
    'id="manageStudentsBtn"': 'btn-outline-success',
    'id="studentQuizBtn"': 'btn-outline-success',
}

start_idx = text.find('<div className="d-flex align-items-center gap-2 flex-wrap">')
end_idx = text.find('<main className="container-fluid px-4 py-4 flex-grow-1">')

if start_idx != -1 and end_idx != -1:
    header_block = text[start_idx:end_idx]
    
    for key, new_color in mapping.items():
        if 'logoutUser' in key:
            header_block = re.sub(r'btn-outline-\w+(?=\s+d-flex align-items-center gap-1"\s*type="button" onClick=\{\(\) => window.logoutUser)', new_color, header_block)
        else:
            # More robust regex that matches either regular string or template literal
            pattern = r'(<button[^>]*' + re.escape(key) + r'[^>]*className=(?:"|\{)[^"]*?)(btn-(?:outline-)?(?:primary|secondary|success|danger|warning|info|indigo|dark|light))'
            # Actually, let's just do a simpler string replace since we know the exact IDs!
            # Find the button block
            btn_idx = header_block.find(key)
            if btn_idx != -1:
                # Find className=" or className={ nearby
                class_idx = header_block.rfind('className=', 0, btn_idx)
                if class_idx == -1 or (btn_idx - class_idx) > 150:
                    class_idx = header_block.find('className=', btn_idx)
                
                if class_idx != -1 and abs(class_idx - btn_idx) < 150:
                    # Find the btn-outline-* or btn-* inside this className
                    # Limit search to next 100 chars
                    search_area = header_block[class_idx:class_idx+100]
                    # Replace
                    new_search_area = re.sub(r'btn-(?:outline-)?(?:primary|secondary|success|danger|warning|info|indigo|dark|light)', new_color, search_area)
                    header_block = header_block[:class_idx] + new_search_area + header_block[class_idx+100:]

    text = text[:start_idx] + header_block + text[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Semantic button colors applied correctly!')
