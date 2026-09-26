import re

file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('<select id="mcYearSelect" className="form-select bg-dark text-white border-secondary">', '<select id="mcYearSelect" className="form-select bg-dark text-white border-secondary" onChange={() => window.loadManageClassTt && window.loadManageClassTt()}>')
text = text.replace('<select id="mcDeptSelect" className="form-select bg-dark text-white border-secondary">', '<select id="mcDeptSelect" className="form-select bg-dark text-white border-secondary" onChange={() => window.loadManageClassTt && window.loadManageClassTt()}>')
text = text.replace('<select id="mcSecSelect" className="form-select bg-dark text-white border-secondary">', '<select id="mcSecSelect" className="form-select bg-dark text-white border-secondary" onChange={() => window.loadManageClassTt && window.loadManageClassTt()}>')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Added onChange auto-load to selects')
