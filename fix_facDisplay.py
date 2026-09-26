import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
        if (!actualFaculty || actualFaculty === '-') actualFaculty = 'Unknown/Vacant Faculty';

        let facDisplay = '';
        const staffLogin = n.staff && typeof buildGeneratedUsername === 'function' ? buildGeneratedUsername(n.staff) : '';
        const staffDisp = n.staff ? `${n.staff} <br><small class="text-muted" style="font-size:0.7rem;">(ID: ${staffLogin})</small>` : '-';

        if (actualFaculty === 'Unknown/Vacant Faculty') {
            facDisplay = `<span class="text-success fw-bold">Period Handled By:<br>${staffDisp}</span>`;
        } else if (isLeave) {
            facDisplay = `<span class="text-danger fw-bold">${actualFaculty}<br><span class="badge bg-danger mt-1">On Leave / Absent</span></span>`;
        } else if (n.source === 'manual') {
            facDisplay = `<strong>${staffDisp}</strong>`;
        } else {
            facDisplay = `<span class="text-danger fw-bold">${actualFaculty}<br><span class="badge bg-danger mt-1">Absent</span></span><br><i class="fa-solid fa-arrow-down text-warning my-1"></i><br><span class="text-success fw-bold">Substituted By:<br>${staffDisp}</span>`;
        }
"""

pattern = re.compile(
    r'if \(\!actualFaculty \|\| actualFaculty === \'\-\'\) actualFaculty = \'Unknown/Vacant Faculty\';\s*let facDisplay = \'\';\s*if \(isLeave\) \{\s*facDisplay = `<span class="text-danger fw-bold">\$\{actualFaculty\}<br><span class="badge bg-danger mt-1">On Leave / Absent</span></span>`;\s*\} else if \(n\.source === \'manual\'\) \{\s*facDisplay = `<strong>\$\{n\.staff \|\| \'\-\'\}</strong>`;\s*\} else \{\s*facDisplay = `<span class="text-danger fw-bold">\$\{actualFaculty\}<br><span class="badge bg-danger mt-1">Absent</span></span><br><i class="fa-solid fa-arrow-down text-warning my-1"></i><br><span class="text-success fw-bold">Substituted By: \$\{n\.staff\}</span>`;\s*\}',
    re.MULTILINE
)

if pattern.search(content):
    content = pattern.sub(replacement.strip(), content)
    with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success replacing block.")
else:
    print("Could not find the block to replace.")
