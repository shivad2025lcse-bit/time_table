import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
window.staffDirectory = staffDirectory;
window.saveStaffDirectory = saveStaffDirectory;

window.renderManageClassAdvisors = function() {
"""

content = content.replace("window.renderManageClassAdvisors = function() {", replacement)

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Exported staffDirectory and saveStaffDirectory")
