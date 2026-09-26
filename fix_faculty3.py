import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
            let fac = n.originalFaculty;
            if (!fac || fac.trim() === '') {
                const pIdx = parseInt(n.period) - 1;
                const sec = n.section || (typeof currentSection !== 'undefined' ? currentSection : 'II CSE C');
                let dayName = n.day;
                if (!dayName) {
                    const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const dObj = new Date(n.date);
                    if (!isNaN(dObj.getTime())) dayName = daysArr[dObj.getDay()];
                }
                
                if (sec && dayName && timetableData[sec] && timetableData[sec][dayName] && timetableData[sec][dayName][pIdx]) {
                    fac = timetableData[sec][dayName][pIdx].faculty;
                }
                if (!fac || fac.trim() === '' || fac === '-') {
                    fac = 'Unknown/Vacant Faculty';
                }
            }
"""

pattern = re.compile(
    r'let fac = n\.originalFaculty;\s*if \(\!fac \|\| fac\.trim\(\) === \'\'\) \{\s*const pIdx = parseInt\(n\.period\) \- 1;\s*const sec = n\.section \|\| \(typeof currentSection !== \'undefined\' \? currentSection : \'II CSE C\'\);\s*if \(sec && n\.day && timetableData\[sec\] && timetableData\[sec\]\[n\.day\] && timetableData\[sec\]\[n\.day\]\[pIdx\]\) \{\s*fac = timetableData\[sec\]\[n\.day\]\[pIdx\]\.faculty;\s*\}\s*if \(\!fac \|\| fac\.trim\(\) === \'\' \|\| fac === \'\-\'\) \{\s*fac = \'Unknown/Vacant Faculty\';\s*\}\s*\}',
    re.MULTILINE
)

if pattern.search(content):
    content = pattern.sub(replacement.strip(), content)
    with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success replacing block.")
else:
    print("Could not find the block to replace.")

