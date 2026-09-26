import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Using a flexible regex for the inner text
pattern = r"<span>Period \$\{s\.pIdx \+ 1\}: <strong>\$\{s\.substituteFaculty\}</strong> covering for \$\{s\.originalFaculty\}.*?</span>"
replacement = r"<span>Period ${s.pIdx + 1}: <strong class='text-danger'>${s.originalFaculty} is Absent</strong>. <strong class='text-success'>${s.substituteFaculty}</strong> is substituted.${s.reason ? ' - ' + s.reason : ''}</span>"

new_content = re.sub(pattern, replacement, content)

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
