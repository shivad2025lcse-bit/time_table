import re

file_path = r'd:\Java_project\frontend\src\index.css'
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Remove the bad appended text from echo
text = re.sub(r'/\*\s*Custom Nav Action Button Styling\s*\*/.*', '', text, flags=re.DOTALL)
text = text.replace('\x00', '')

# Append new CSS
new_css = '''
/* Top Navbar Button Enhancements */
#applicationShell .inst-header .btn {
    border-radius: 20px;
    backdrop-filter: blur(4px);
    transition: all 0.3s ease;
    border-width: 1px;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    white-space: nowrap;
}
#applicationShell .inst-header .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
#applicationShell .inst-header .btn-outline-primary {
    background: rgba(13, 110, 253, 0.1);
}
#applicationShell .inst-header .btn-outline-primary:hover {
    background: rgba(13, 110, 253, 0.2);
}
#applicationShell .inst-header .btn-outline-success {
    background: rgba(25, 135, 84, 0.1);
}
#applicationShell .inst-header .btn-outline-success:hover {
    background: rgba(25, 135, 84, 0.2);
}
#applicationShell .inst-header .btn-outline-danger {
    background: rgba(220, 53, 69, 0.1);
}
#applicationShell .inst-header .btn-outline-danger:hover {
    background: rgba(220, 53, 69, 0.2);
}
#applicationShell .inst-header .btn-outline-warning {
    background: rgba(255, 193, 7, 0.1);
}
#applicationShell .inst-header .btn-outline-warning:hover {
    background: rgba(255, 193, 7, 0.2);
}
#applicationShell .inst-header .btn-outline-info {
    background: rgba(13, 202, 240, 0.1);
}
#applicationShell .inst-header .btn-outline-info:hover {
    background: rgba(13, 202, 240, 0.2);
}
#applicationShell .inst-header .btn-outline-secondary {
    background: rgba(108, 117, 125, 0.1);
}
#applicationShell .inst-header .btn-outline-secondary:hover {
    background: rgba(108, 117, 125, 0.2);
}
'''
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text.strip() + '\n' + new_css)
print('Fixed CSS!')
