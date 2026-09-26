file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if 'id="manageClassTtBtn"' in lines[i]:
        # Fix the line completely
        lines[i] = '                                <button id="manageClassTtBtn" className={tn btn-sm btn-outline-primary align-items-center gap-1 } type="button" data-bs-toggle="modal" data-bs-target="#manageClassTtModal" onClick={() => window.initManageClassTt && window.initManageClassTt()}>\n'
        break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Fixed syntax error!')
