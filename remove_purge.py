import re

file_path = r'd:\Java_project\frontend\public\js\frontend_app.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'// --- ONE-TIME PURGE.*?// -----------------------------------------------------\n\n', '', text, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Purge script removed.")
