import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("opt.text = `Period ${idx + 1} -  ${p.sub} (${p.faculty})`;", "opt.text = p.sub;")

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
    f.write(content)
