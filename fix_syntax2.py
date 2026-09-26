import re

file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Replace using regex to avoid invisible characters
text = re.sub(r'<button id="manageClassTtBtn" className=[^>]*?type="button"', '<button id="manageClassTtBtn" className={tn btn-sm btn-outline-primary align-items-center gap-1 } type="button"', text)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed syntax via Python Regex!')
