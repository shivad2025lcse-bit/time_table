import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
            let fac = n.originalFaculty;
            if (!fac || fac.trim() === '') {
                const pIdx = parseInt(n.period) - 1;
                const sec = n.section || (typeof currentSection !== 'undefined' ? currentSection : 'II CSE C');
                if (sec && n.day && timetableData[sec] && timetableData[sec][n.day] && timetableData[sec][n.day][pIdx]) {
                    fac = timetableData[sec][n.day][pIdx].faculty;
                }
                if (!fac || fac.trim() === '' || fac === '-') {
                    fac = 'Unknown/Vacant Faculty';
                }
            }
"""

# I need to replace the block that was previously inserted. Let's use a regex that matches the previous block.
pattern = re.compile(
    r'let fac = n\.originalFaculty;\s*if \(\!fac \|\| fac\.trim\(\) === \'\'\) \{\s*const pIdx = parseInt\(n\.period\) \- 1;\s*if \(n\.section && n\.day && timetableData\[n\.section\] && timetableData\[n\.section\]\[n\.day\] && timetableData\[n\.section\]\[n\.day\]\[pIdx\]\) \{\s*fac = timetableData\[n\.section\]\[n\.day\]\[pIdx\]\.faculty;\s*\}\s*if \(\!fac \|\| fac\.trim\(\) === \'\' \|\| fac === \'\-\'\) \{\s*fac = \'Unknown/Vacant Faculty\';\s*\}\s*\}',
    re.MULTILINE
)

if pattern.search(content):
    content = pattern.sub(replacement.strip(), content)
    with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success replacing block.")
else:
    print("Could not find the block to replace.")

