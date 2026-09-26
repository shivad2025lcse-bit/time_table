file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Just simple string replacements to fix the remaining ones
text = text.replace('id="facultyDetailsBtn" className={tn btn-sm btn-outline-primary', 'id="facultyDetailsBtn" className={tn btn-sm btn-outline-info')
text = text.replace('id="manageAnnouncementsBtn" className={tn btn-sm btn-outline-success', 'id="manageAnnouncementsBtn" className={tn btn-sm btn-outline-primary')
text = text.replace('id="facultyQuizBtn" className={tn btn-sm btn-outline-danger', 'id="facultyQuizBtn" className={tn btn-sm btn-outline-warning')
text = text.replace('id="manageSectionsBtn" className={tn btn-sm btn-outline-warning', 'id="manageSectionsBtn" className={tn btn-sm btn-outline-primary')
text = text.replace('id="studentProfileBtn" className={tn btn-sm btn-outline-success', 'id="studentProfileBtn" className={tn btn-sm btn-outline-info')
text = text.replace('id="studentQuizBtn" className={tn btn-sm btn-outline-danger', 'id="studentQuizBtn" className={tn btn-sm btn-outline-success')

text = text.replace('id="manageRosterBtn" className={tn btn-sm btn-indigo', 'id="manageRosterBtn" className={tn btn-sm btn-outline-primary')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Semantic button colors fixed completely!')
