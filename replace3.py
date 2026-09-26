import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """function updateAnnouncementTicker() {
    const container = document.getElementById('announcementTickerContainer');
    const marquee = document.getElementById('announcementMarquee');
    if (!container || !marquee) return;

    let announcements = JSON.parse(localStorage.getItem('sece_announcements') || '[]');
    let badgeCount = 0;

    if (typeof loadPeriodNotifications === 'function') {
        const role = typeof getEffectiveRole === 'function' ? getEffectiveRole() : '';
        const today = typeof todayDateStr === 'function' ? todayDateStr() : new Date().toISOString().split('T')[0];
        const allNotifs = loadPeriodNotifications().filter(n => n.date === today);
        
        if (role === 'STUDENT') {
            let studentSec = window.currentSection;
            if (typeof currentStudentRecord === 'function') {
                const rec = currentStudentRecord();
                if (rec && rec.sec) studentSec = rec.sec;
            }
            
            // For the badge: match the modal logic which shows all relevant notifications
            const classNotifs = allNotifs.filter(n => !n.section || n.section === studentSec || n.section === 'All');
            badgeCount = classNotifs.length;
            
            // For the marquee: only show specific class substitutions
            const exactClassNotifs = allNotifs.filter(n => n.section === window.currentSection);
            exactClassNotifs.forEach(n => {
                let msg = '';
                if (n.originalFaculty) msg += `Faculty ${n.originalFaculty} is absent. `;
                msg += `Substitution Alert: Period ${n.period} will be handled by ${n.staff}.`;
                announcements.push({ text: msg });
            });
        } else if (role === 'ADMIN' || role === 'FACULTY') {
            allNotifs.forEach(n => {
                let msg = `Substitution (${n.section}): `;
                if (n.originalFaculty) msg += `Faculty ${n.originalFaculty} is absent, `;
                msg += `Period ${n.period} handled by ${n.staff}.`;
                announcements.push({ text: msg });
            });
            
            // For the badge: match the adminAbsentNotifModal logic (unique absent faculties)
            const todaysLeaves = {};
            if (typeof coverageRequests !== 'undefined') {
                Object.values(coverageRequests).forEach(req => {
                    if (req.date === today && req.absentStaff) todaysLeaves[req.absentStaff] = true;
                });
            }
            if (typeof substitutions !== 'undefined') {
                Object.values(substitutions).forEach(sub => {
                    if (sub.date === today && sub.originalFaculty) todaysLeaves[sub.originalFaculty] = true;
                });
            }
            allNotifs.forEach(n => {
                const fac = n.originalFaculty || 'Unknown/Vacant Faculty';
                todaysLeaves[fac] = true;
            });
            badgeCount = Object.keys(todaysLeaves).length;
        }
    }

    // Update the notification badge on the bell icon
    const badge = document.getElementById('headerNotifBadge');
    if (badge) {
        if (badgeCount > 0) {
            badge.innerText = badgeCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    if (announcements.length === 0) {
        container.style.display = 'none';
        return;
    }

    // Build scrolling ticker text
    const tickerHtml = announcements.map(a =>
        `<i class="fa-solid fa-star text-warning me-2" style="font-size:0.8rem"></i><span class="me-5 fw-bold">${a.text}</span>`
    ).join('<span class="mx-3 text-warning opacity-75">&#9733;</span>');

    marquee.innerHTML = tickerHtml;
    container.style.display = 'block';
}"""

pattern = r"function updateAnnouncementTicker\(\) \{.*?\n\}(?=\nwindow.updateAnnouncementTicker)"
new_content = re.sub(pattern, new_func, content, flags=re.DOTALL)

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
