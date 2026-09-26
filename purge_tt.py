import re

file_path = r'd:\Java_project\frontend\public\js\frontend_app.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add a one-time clear of built timetables
injection = """
// --- ONE-TIME PURGE OF LEGACY/TESTING UPLOADED TTs ---
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sece_tt_built_')) {
        localStorage.removeItem(key);
    }
});
// -----------------------------------------------------

// System State
"""
text = text.replace('// System State\n', injection)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Added JS purge for testing TTs.")
