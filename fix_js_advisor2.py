import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
window.renderManageClassAdvisors = async function() {
    const selFac = document.getElementById('advisorSelectFaculty');
    const selClass = document.getElementById('advisorSelectClass');
    const tbody = document.getElementById('classAdvisorsTbody');

    // Fetch faculties from API
    let faculties = [];
    try {
        const fetchFn = (typeof apiFetch === 'function') ? apiFetch : fetch;
        const res = await fetchFn('/api/teachers');
        if (res.ok) {
            faculties = await res.json();
        }
    } catch (e) {}

    if (faculties.length === 0) {
        faculties = window.staffDirectory || [];
    }

    if (selFac) {
        const facOptions = faculties.map(f => {
            const val = f.name || f.displayName;
            const disp = f.displayName || f.name;
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
            sections = data.map(s => s.sectionName || s.name || String(s.id));
        }
    } catch (e) {}

    if (sections.length === 0) {
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
        const advisors = (window.staffDirectory || []).filter(s => s.classAdvisorFor);
        if (advisors.length === 0) {
            tbody.innerHTML = '<tr><td colSpan="3" class="text-center text-muted">No class advisors assigned yet.</td></tr>';
        } else {
            tbody.innerHTML = advisors.map(a => `
                <tr>
                    <td>${a.displayName || a.name}</td>
                    <td><span class="badge bg-success">${a.classAdvisorFor}</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-danger" onclick="window.removeClassAdvisor('${a.name}')" title="Remove Advisor">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
};

window.assignClassAdvisor = function() {
    const facName = document.getElementById('advisorSelectFaculty').value;
    const className = document.getElementById('advisorSelectClass').value;
    
    if (!facName || !className) {
        alert('Please select both faculty and class.');
        return;
    }

    const existing = window.staffDirectory.find(s => s.classAdvisorFor === className);
    if (existing && existing.name !== facName) {
        if (!confirm(`Class ${className} is already assigned to ${existing.displayName || existing.name}. Reassign?`)) {
            return;
        }
        existing.classAdvisorFor = '';
    }

    let fac = window.staffDirectory.find(s => s.name === facName);
    if (!fac) {
        const selFac = document.getElementById('advisorSelectFaculty');
        const text = selFac.options[selFac.selectedIndex].text;
        let dept = 'Unknown';
        if (text.includes('(') && text.includes(')')) {
            dept = text.split('(')[1].split(')')[0];
        }
        fac = { name: facName, displayName: facName, dept: dept, status: 'Available' };
        window.staffDirectory.push(fac);
    }
    
    fac.classAdvisorFor = className;
    window.saveStaffDirectory();
    window.renderManageClassAdvisors();
    showToast('Assigned', `${fac.displayName || fac.name} is now the Class Advisor for ${className}.`);
    
    if (window.renderCredentialsList && document.getElementById('viewCredentialsModal').classList.contains('show')) {
        window.renderCredentialsList();
    }
};

window.removeClassAdvisor = function(facName) {
"""

pattern = re.compile(r'window\.renderManageClassAdvisors = function\(\) \{.*?(?=window\.removeClassAdvisor = function\(facName\) \{)', re.DOTALL)
if pattern.search(content):
    content = pattern.sub(replacement, content)
    with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced JS functions")
else:
    print("Pattern not found")
