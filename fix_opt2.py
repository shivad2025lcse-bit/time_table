import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace opt.text = `Period ...`; with opt.text = p.sub;
# We use regex to handle any weird characters in between
pattern = re.compile(r'opt\.text = `Period \$\{idx \+ 1\} -[^`]+`;')

if pattern.search(content):
    content = pattern.sub('opt.text = p.sub;', content)
    with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success replacing block.")
else:
    print("Could not find the block to replace.")
