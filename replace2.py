import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """function renderAdminLeaveNotifications() {
    const list = document.getElementById('adminAbsentNotifList');
    if (!list) return;

    const dateStr = todayDateStr();
    const todaysLeaves = {};

    // 1. Load from coverageRequests
    if (typeof coverageRequests !== 'undefined') {
        Object.values(coverageRequests).forEach(req => {
            if (req.date === dateStr && req.absentStaff) {
                if (!todaysLeaves[req.absentStaff]) todaysLeaves[req.absentStaff] = [];
                todaysLeaves[req.absentStaff].push({
                    pIdx: req.pIdx,
                    section: req.section,
                    status: req.status,
                    requestedBy: req.requestedBy
                });
            }
        });
    }

    // 2. Load from substitutions (direct admin edits)
    if (typeof substitutions !== 'undefined') {
        Object.values(substitutions).forEach(sub => {
            if (sub.date === dateStr && sub.originalFaculty) {
                if (!todaysLeaves[sub.originalFaculty]) todaysLeaves[sub.originalFaculty] = [];
                const exists = todaysLeaves[sub.originalFaculty].find(r => parseInt(r.pIdx) === parseInt(sub.pIdx) && r.section === sub.section);
                if (!exists) {
                    todaysLeaves[sub.originalFaculty].push({
                        pIdx: sub.pIdx,
                        section: sub.section,
                        status: 'ACCEPTED',
                        requestedBy: sub.substituteFaculty
                    });
                } else {
                    exists.status = 'ACCEPTED';
                    exists.requestedBy = sub.substituteFaculty;
                }
            }
        });
    }

    // 3. Load from periodNotifications (API fallback)
    if (typeof loadPeriodNotifications === 'function') {
        const notifs = loadPeriodNotifications().filter(n => n.date === dateStr);
        notifs.forEach(n => {
            if (n.originalFaculty) {
                if (!todaysLeaves[n.originalFaculty]) todaysLeaves[n.originalFaculty] = [];
                const pIdxVal = parseInt(n.period) - 1;
                const exists = todaysLeaves[n.originalFaculty].find(r => parseInt(r.pIdx) === pIdxVal && (r.section === n.section || !n.section));
                if (!exists) {
                    todaysLeaves[n.originalFaculty].push({
                        pIdx: pIdxVal,
                        section: n.section || 'All',
                        status: n.staff ? 'ACCEPTED' : 'OPEN',
                        requestedBy: n.staff
                    });
                } else if (n.staff) {
                    exists.status = 'ACCEPTED';
                    exists.requestedBy = n.staff;
                }
            }
        });
    }

    const staffNames = Object.keys(todaysLeaves);
    if (staffNames.length === 0) {
        list.innerHTML = '<div class="alert alert-success small py-2 mb-0"><i class="fa-solid fa-check-circle me-1"></i> No faculty members are reported absent today.</div>';
        return;
    }

    let html = '<ul class="list-group list-group-flush">';
    staffNames.forEach(staff => {
        // deduplicate identical periods for the same staff
        const uniquePeriods = [];
        todaysLeaves[staff].forEach(r => {
            if (!uniquePeriods.find(x => x.pIdx === r.pIdx && x.section === r.section)) {
                uniquePeriods.push(r);
            }
        });

        const periodsDetails = uniquePeriods.sort((a,b) => parseInt(a.pIdx) - parseInt(b.pIdx)).map(r => {
            let detail = `Period ${parseInt(r.pIdx) + 1} (${r.section})`;
            if (r.status === 'ACCEPTED' && r.requestedBy) {
                detail += ` - <span class="text-success fw-bold">Substituted by ${r.requestedBy}</span>`;
            } else if (r.status === 'REQUESTED' && r.requestedBy) {
                detail += ` - <span class="text-warning">Requested by ${r.requestedBy}</span>`;
            } else {
                detail += ` - <span class="text-danger">Pending Substitution</span>`;
            }
            return detail;
        }).join('<br>');

        html += `<li class="list-group-item bg-dark text-white border-secondary">
            <strong class="text-danger"><i class="fa-solid fa-user-xmark me-2"></i> ${staff}</strong><br>
            <div class="mt-2 small">${periodsDetails}</div>
        </li>`;
    });
    html += '</ul>';
    list.innerHTML = html;
}"""

pattern = r"function renderAdminLeaveNotifications\(\) \{.*?\n\}"
# use regex substitution
new_content = re.sub(pattern, new_func, content, flags=re.DOTALL)

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
