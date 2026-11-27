function applyTheme(theme) {
    const target = theme === 'light' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', target);
    document.documentElement.setAttribute('data-theme', target);
    document.body.style.backgroundColor = target === 'light' ? '#f8fafc' : '';
    document.body.style.color = target === 'light' ? '#0f172a' : '';

    const icon = document.getElementById('themeIcon');
    const label = document.getElementById('themeToggleLabel');
    const btn = document.getElementById('themeToggleBtn');

    if (icon) {
        icon.className = target === 'light' ? 'fa-solid fa-moon text-dark' : 'fa-solid fa-sun text-warning';
    }
    if (label) {
        label.textContent = target === 'light' ? 'Dark' : 'Light';
    }
    if (btn) {
        btn.classList.toggle('btn-outline-secondary', target === 'light');
        btn.classList.toggle('btn-outline-warning', target !== 'light');
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || localStorage.getItem('sece_theme') || 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('sece_theme', newTheme);
    applyTheme(newTheme);
}

window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;

// Apply saved theme immediately and again after React DOM hydration
applyTheme(localStorage.getItem('sece_theme') || 'dark');
setTimeout(() => {
    applyTheme(localStorage.getItem('sece_theme') || 'dark');
}, 200);
