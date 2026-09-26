import re

file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Remove the broken injected script block
start_idx = text.find('// Force override of Manage Class TT functions')
if start_idx != -1:
    end_idx = text.find('const isFaculty = ')
    if end_idx != -1:
        text = text[:start_idx] + text[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Removed broken injection')
