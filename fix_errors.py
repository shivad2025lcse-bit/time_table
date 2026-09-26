file_path = r'd:\Java_project\frontend\public\js\frontend_app.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix 1: Replace the undefined targetSec with currentSection in switchRole
old1 = '    window.updateBannerHeaders(targetSec);\n\n    // Standard dashboard updates'
new1 = '    const targetSec = currentSection || "";\n    window.updateBannerHeaders(targetSec);\n\n    // Standard dashboard updates'
if old1 in text:
    text = text.replace(old1, new1)
    print("Fix 1 applied: targetSec defined before use.")
else:
    print("Fix 1 NOT FOUND.")

# Fix 2: Guard renderCourseRefTable against null tbody
old2 = '''function renderCourseRefTable() {
    const tbody = document.getElementById('courseRefBody');
    tbody.innerHTML = '';'''
new2 = '''function renderCourseRefTable() {
    const tbody = document.getElementById('courseRefBody');
    if (!tbody) return;
    tbody.innerHTML = '';'''
if old2 in text:
    text = text.replace(old2, new2)
    print("Fix 2 applied: guarded renderCourseRefTable.")
else:
    print("Fix 2 NOT FOUND.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Done.")
