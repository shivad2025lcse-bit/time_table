
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('sece_theme', newTheme);
    document.getElementById('themeIcon').className = newTheme === 'light' ? 'fa-solid fa-sun text-warning' : 'fa-solid fa-moon';
}

// Apply theme on load
setTimeout(() => {
    const savedTheme = localStorage.getItem('sece_theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = savedTheme === 'light' ? 'fa-solid fa-sun text-warning' : 'fa-solid fa-moon';
    }
}, 200);