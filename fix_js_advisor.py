import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

js_code = """
window.renderManageClassAdvisors = function() {
    const selFac = document.getElementById('advisorSelectFaculty');
    const selClass = document.getElementById('advisorSelectClass');
    const tbody = document.getElementById('classAdvisorsTbody');

    if (selFac) {
        selFac.innerHTML = '<option value="">-- Choose Faculty --</option>' + window.staffDirectory.map(f => 
            `<option value="${f.name}">${f.displayName || f.name} (${f.dept})</option>`
        ).join('');
    }

    if (selClass) {
        // Find all unique sections from students
        let sections = [];
        if (window.studentsData && window.studentsData.length > 0) {
            sections = [...new Set(window.studentsData.map(s => s.sec).filter(s => s && s.trim() !== ''))];
        } else {
            // fallback to sections in timetable
            const ttSections = Object.keys(window.timetableData || {}).filter(k => k !== 'null' && k !== '');
            sections = [...new Set([...ttSections, 'II CSE C', 'II CSE D', 'II IT A', 'II AI&DS A'])];
        }
        sections.sort();

        selClass.innerHTML = '<option value="">-- Choose Class --</option>' + sections.map(s => 
            `<option value="${s}">${s}</option>`
        ).join('');
    }

    if (tbody) {
        const advisors = window.staffDirectory.filter(s => s.classAdvisorFor);
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

    // Check if class already has an advisor
    const existing = window.staffDirectory.find(s => s.classAdvisorFor === className);
    if (existing && existing.name !== facName) {
        if (!confirm(`Class ${className} is already assigned to ${existing.displayName || existing.name}. Reassign?`)) {
            return;
        }
        existing.classAdvisorFor = '';
    }

    const fac = window.staffDirectory.find(s => s.name === facName);
    if (fac) {
        fac.classAdvisorFor = className;
        window.saveStaffDirectory();
        window.renderManageClassAdvisors();
        showToast('Assigned', `${fac.displayName || fac.name} is now the Class Advisor for ${className}.`);
        
        // Refresh credentials list if it's open
        if (window.renderCredentialsList && document.getElementById('viewCredentialsModal').classList.contains('show')) {
            window.renderCredentialsList();
        }
    }
};

window.removeClassAdvisor = function(facName) {
    if (!confirm('Are you sure you want to remove this Class Advisor?')) return;
    const fac = window.staffDirectory.find(s => s.name === facName);
    if (fac) {
        fac.classAdvisorFor = '';
        window.saveStaffDirectory();
        window.renderManageClassAdvisors();
        showToast('Removed', `Class Advisor role removed for ${fac.displayName || fac.name}.`);
        
        // Refresh credentials list if it's open
        if (window.renderCredentialsList && document.getElementById('viewCredentialsModal').classList.contains('show')) {
            window.renderCredentialsList();
        }
    }
};
"""

if 'window.renderManageClassAdvisors =' not in content:
    content += '\n\n' + js_code
    with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added Class Advisor JS logic")
else:
    print("Already exists")
