import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add window.updateBuilderColLabel = function ...
update_func = """
window.updateBuilderColLabel = function(idx, val) {
    builderTtColumns[idx].label = val;
    saveBuilderTtColumns();
};

window.renderTimetableBuilderGrid = function(section) {
"""

content = content.replace("window.renderTimetableBuilderGrid = function(section) {", update_func.strip())

# Replace the static label with an input
old_head = """headHtml += `<th class="${colorClass}">${col.label}"""
new_head = """headHtml += `<th class="${colorClass}">
            <input type="text" class="form-control form-control-sm bg-transparent border-0 text-center fw-bold ${colorClass}" style="box-shadow:none; padding:0" value="${col.label.replace(/"/g, '&quot;')}" onchange="updateBuilderColLabel(${i}, this.value)" />"""

content = content.replace(old_head, new_head)

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
    f.write(content)
