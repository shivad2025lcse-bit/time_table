import re

file_path = r'd:\Java_project\frontend\public\js\frontend_app.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace DEFAULT_TIMETABLE_DATA with an empty object
pattern = r"const DEFAULT_TIMETABLE_DATA = \{.*?\n\};"
text = re.sub(pattern, "const DEFAULT_TIMETABLE_DATA = {};", text, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("DEFAULT_TIMETABLE_DATA cleared.")
