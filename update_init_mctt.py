file_path = r'd:\Java_project\frontend\public\js\frontend_app.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace initManageClassTt
old_init = '''window.initManageClassTt = function() {
    document.getElementById('mcTtGridContainer').classList.add('d-none');
};'''

new_init = '''window.initManageClassTt = function() {
    // Automatically load the default selected class timetable when the modal opens
    document.getElementById('mcTtGridContainer').classList.remove('d-none');
    if (window.loadManageClassTt) {
        window.loadManageClassTt();
    }
};'''

text = text.replace(old_init, new_init)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Updated initManageClassTt to auto-load grid!')
