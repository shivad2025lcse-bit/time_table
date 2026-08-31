import re

with open('d:/Java_project/frontend/public/js/frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add updateAnnouncementTicker
ticker_func = """
window.updateAnnouncementTicker = function() {
    const container = document.getElementById('announcementTickerContainer');
    const marquee = document.getElementById('announcementMarquee');
    if (!container || !marquee) return;

    const announcements = JSON.parse(localStorage.getItem('sece_announcements') || '[]');
    if (announcements.length > 0) {
        container.classList.remove('d-none');
        // Join all announcements with spacing and stars
        const tickerText = announcements.map(a => `<i class="fa-solid fa-star text-warning mx-2"></i> ${a.text}`).join(' ');
        marquee.innerHTML = tickerText;
    } else {
        container.classList.add('d-none');
        marquee.innerHTML = '';
    }
};
"""
if 'updateAnnouncementTicker' not in content:
    content = re.sub(r'(window\.deleteAnnouncement = function\(idx\) \{.*?\};)', r'\1\n\n' + ticker_func, content, flags=re.DOTALL)

# 2. Update addAnnouncement and deleteAnnouncement to call the ticker update
content = content.replace(
'''    window.renderAnnouncements();
};

window.deleteAnnouncement = function(idx) {''',
'''    window.renderAnnouncements();
    if (typeof window.updateAnnouncementTicker === 'function') window.updateAnnouncementTicker();
};

window.deleteAnnouncement = function(idx) {'''
)

content = content.replace(
'''    localStorage.setItem('sece_announcements', JSON.stringify(announcements));
    window.renderAnnouncements();
};''',
'''    localStorage.setItem('sece_announcements', JSON.stringify(announcements));
    window.renderAnnouncements();
    if (typeof window.updateAnnouncementTicker === 'function') window.updateAnnouncementTicker();
};'''
)

# 3. Add to switchRole
role_logic = """
    const manageAnnBtn = document.getElementById('manageAnnouncementsBtn');
    if (manageAnnBtn) {
        if (role === 'ADMIN' || role === 'FACULTY') {
            manageAnnBtn.style.setProperty('display', 'flex', 'important');
        } else {
            manageAnnBtn.style.setProperty('display', 'none', 'important');
        }
    }
    
    if (typeof window.updateAnnouncementTicker === 'function') window.updateAnnouncementTicker();
"""

if 'manageAnnBtn.style.setProperty' not in content:
    content = re.sub(r'(const manageStudentsBtn = document\.getElementById\(\'manageStudentsBtn\'\);)', role_logic + r'\n    \1', content)

with open('d:/Java_project/frontend/public/js/frontend_app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Ticker patch applied")
