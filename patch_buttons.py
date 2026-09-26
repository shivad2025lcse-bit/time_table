import re

file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(179, 312):
    if 'className=' in lines[i]:
        lines[i] = re.sub(r'btn btn-sm btn-[a-zA-Z0-9-]+\s*', 'nav-action-btn ', lines[i])
        
        if 'Logout' in lines[i] or 'Quiz' in lines[i]:
             lines[i] = lines[i].replace('nav-action-btn', 'nav-action-btn danger')

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Patched buttons!')
