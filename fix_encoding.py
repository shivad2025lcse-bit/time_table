import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace different variations of encoding glitches with a standard dash
content = re.sub(r'Ã¢â‚¬â€', '-', content)
content = content.replace('A,??', '-')
content = content.replace('A,?o', '-')
content = content.replace('Ã¢â‚¬â€', '-')
content = content.replace('â€', '-')

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
    f.write(content)
