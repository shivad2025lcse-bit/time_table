file_path = r'd:\Java_project\frontend\public\js\frontend_app.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the data loading part in renderManageClassTt
old_code = '''    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('class_tt_' + sectionKey) || '{}'); } catch(e) {}
    
    const thead = document.getElementById('mcTtHead');'''

new_code = '''    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let saved = {};
    let hasSavedData = false;
    try { 
        let raw = localStorage.getItem('class_tt_' + sectionKey);
        if (raw) {
            saved = JSON.parse(raw);
            hasSavedData = true;
        }
    } catch(e) {}
    
    // If no saved data in localStorage, PRE-LOAD from backend!
    if (!hasSavedData && window.currentTimetableEntries && window.currentTimetableEntries.length > 0) {
        let q1 = sectionKey.toUpperCase();
        let q2 = sectionKey.replace(/ /g, '_').toUpperCase();
        
        // Filter entries for this section
        let sectionEntries = window.currentTimetableEntries.filter(e => {
            if (!e.sectionName) return false;
            let sName = e.sectionName.toUpperCase();
            return sName.includes(q1) || sName.includes(q2) || sName === q1 || sName === q2;
        });
        
        days.forEach(day => {
            saved[day] = {};
            mcTtColumns.forEach((col, idx) => {
                if (col.isBreak && col.key !== 'ACT') return;
                saved[day][col.key] = 'FREE'; // Default
            });
        });
        
        sectionEntries.forEach(entry => {
            let day = entry.day;
            if (saved[day]) {
                // Map slotNumber (1 to 7) to our columns (P1, P2, P3, P4, P5, P6, P7)
                let slotToKeyMap = { 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4', 5: 'P5', 6: 'P6', 7: 'P7' };
                let colKey = slotToKeyMap[entry.slotNumber];
                if (colKey) {
                    saved[day][colKey] = entry.subjectName || entry.subjectCode || 'FREE';
                }
            }
        });
    }
    
    const thead = document.getElementById('mcTtHead');'''

text = text.replace(old_code, new_code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated renderManageClassTt to pre-load from backend!")
