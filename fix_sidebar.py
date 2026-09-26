import re

file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the aside class and style
text = text.replace(
    'className={`app-sidebar d-flex flex-column p-3 ${isSidebarOpen ? \'open\' : \'d-none d-lg-flex\'}`} style={{ display: isSidebarOpen ? \'flex\' : \'none\' }}',
    'className={`app-sidebar d-flex flex-column p-3 ${isSidebarOpen ? \'open\' : \'\'}`} style={{ display: isSidebarOpen ? \'flex\' : \'none\' }}'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("DashboardLayout.jsx updated.")
