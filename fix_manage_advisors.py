import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
window.renderManageClassAdvisors = async function() {
    const selFac = document.getElementById('advisorSelectFaculty');
    const selClass = document.getElementById('advisorSelectClass');
    const tbody = document.getElementById('classAdvisorsTbody');

    if (selFac) selFac.innerHTML = '<option value="">-- Loading Faculty --</option>';
    if (selClass) selClass.innerHTML = '<option value="">-- Loading Classes --</option>';
    if (tbody) tbody.innerHTML = '<tr><td colSpan="3" class="text-center text-muted">Loading...</td></tr>';

    // Fetch faculties from API
    let faculties = [];
    try {
        const fetchFn = (typeof apiFetch === 'function') ? apiFetch : fetch;
        const res = await fetchFn('/api/teachers');
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) faculties = data;
        }
    } catch (e) {
        console.error("Error fetching teachers:", e);
    }

    if (!faculties || faculties.length === 0) {
        faculties = window.staffDirectory || [];
    }

    if (selFac) {
        const facOptions = faculties.map(f => {
            const val = f.employeeId || f.name || f.displayName || f.username || f.firstName;
            const disp = f.displayName || f.name || (f.firstName ? f.firstName + ' ' + (f.lastName || '') : val);
            const dept = f.department ? (f.department.name || f.department) : (f.dept || '-');
            return `<option value="${val}">${disp} (${dept})</option>`;
        }).join('');
        selFac.innerHTML = '<option value="">-- Choose Faculty --</option>' + facOptions;
    }

    // Fetch classes from API
    let sections = [];
    try {
        const fetchFn = (typeof apiFetch === 'function') ? apiFetch : fetch;
        const res = await fetchFn('/api/sections');
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                sections = data.map(s => s.sectionName || s.name || String(s.id));
            }
        }
    } catch (e) {
        console.error("Error fetching sections:", e);
    }

    if (!sections || sections.length === 0) {
        if (window.studentsData && window.studentsData.length > 0) {
            sections = [...new Set(window.studentsData.map(s => s.sec).filter(s => s && s.trim() !== ''))];
        } else {
            const ttSections = Object.keys(window.timetableData || {}).filter(k => k !== 'null' && k !== '');
            sections = [...new Set([...ttSections, 'II CSE C', 'II CSE D', 'II IT A', 'II AI&DS A'])];
        }
    }
    
    sections = [...new Set(sections)].sort();

    if (selClass) {
        selClass.innerHTML = '<option value="">-- Choose Class --</option>' + sections.map(s => 
            `<option value="${s}">${s}</option>`
        ).join('');
    }

    if (tbody) {
        // Find advisors based on our updated faculties list or staffDirectory
        const allFaculties = [...(window.staffDirectory || []), ...faculties];
        // filter unique by name/val
        const uniqueFacs = [];
        const seen = new Set();
        for (let f of allFaculties) {
            const val = f.employeeId || f.name || f.displayName || f.username || f.firstName;
            if (val && !seen.has(val)) {
                seen.add(val);
                uniqueFacs.push(f);
            }
        }
        
        const advisors = uniqueFacs.filter(s => s.classAdvisorFor && s.classAdvisorFor.trim() !== '');
        
        if (advisors.length === 0) {
            tbody.innerHTML = '<tr><td colSpan="3" class="text-center text-muted">No class advisors assigned yet.</td></tr>';
        } else {
            tbody.innerHTML = advisors.map(a => {
                const val = a.employeeId || a.name || a.displayName || a.username || a.firstName;
                const disp = a.displayName || a.name || (a.firstName ? a.firstName + ' ' + (a.lastName || '') : val);
                return `
                <tr>
                    <td>${disp}</td>
                    <td><span class="badge bg-success">${a.classAdvisorFor}</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-danger" onclick="window.removeClassAdvisor('${val}')" title="Remove Advisor">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `}).join('');
        }
    }
};

window.assignClassAdvisor = function() {
"""

pattern = re.compile(r'window\.renderManageClassAdvisors = async function\(\) \{.*?(?=window\.assignClassAdvisor = function\(\) \{)', re.DOTALL)
if pattern.search(content):
    content = pattern.sub(replacement, content)
    with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated renderManageClassAdvisors")
else:
    print("Pattern not found")
