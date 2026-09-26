import re

file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the aside class and style for proper animations
text = text.replace(
    'className={`app-sidebar d-flex flex-column p-3 ${isSidebarOpen ? \'open\' : \'\'}`} style={{ display: isSidebarOpen ? \'flex\' : \'none\' }}',
    'className={`app-sidebar d-flex flex-column p-3 ${isSidebarOpen ? \'open-mobile\' : \'closed-desktop\'}`}'
)

# Also fix the overlay class
text = text.replace(
    'className={`sidebar-overlay ${isSidebarOpen ? \'open\' : \'\'}`}',
    'className={`sidebar-overlay ${isSidebarOpen ? \'open-mobile\' : \'\'}`}'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("DashboardLayout.jsx classes updated.")
