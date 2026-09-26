file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(' style={{ background: "var(--sece-indigo)" }}', '')
text = text.replace(' style-btn', '')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Cleaned up styles!')
