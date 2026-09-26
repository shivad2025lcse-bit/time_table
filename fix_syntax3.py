file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'id="manageClassTtBtn"' in line:
        lines[i] = '                                <button id="manageClassTtBtn" className={tn btn-sm btn-outline-primary align-items-center gap-1 } type="button" data-bs-toggle="modal" data-bs-target="#manageClassTtModal" onClick={() => window.initManageClassTt && window.initManageClassTt()}>\n'
        break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Fixed syntax via Exact Line Index in Python!')
