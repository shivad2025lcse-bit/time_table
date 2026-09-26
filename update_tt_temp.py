file_path = r'd:\Java_project\frontend\public\js\frontend_app.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the pre-load logic in renderManageClassTt with an async fetch and render
old_render = '''window.renderManageClassTt = function(sectionKey) {
    const tbody = document.getElementById('mcTtBody');
    if (!tbody) return;
    
    loadMcTtColumns(sectionKey);
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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

new_render = '''window.renderManageClassTt = async function(sectionKey) {
    const tbody = document.getElementById('mcTtBody');
    if (!tbody) return;
    
    loadMcTtColumns(sectionKey);
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let saved = {};
    let hasSavedData = false;
    try { 
        let raw = localStorage.getItem('class_tt_' + sectionKey);
        if (raw) {
            saved = JSON.parse(raw);
            hasSavedData = true;
        }
    } catch(e) {}
    
    // If no saved data in localStorage, fetch from backend API
    if (!hasSavedData) {
        try {
            const secRes = await fetch('/api/sections', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('sece_token') } });
            if (secRes.ok) {
                const sections = await secRes.json();
                let q1 = sectionKey.toUpperCase();
                let q2 = sectionKey.replace(/ /g, '_').toUpperCase();
                let matchSec = sections.find(s => {
                    let sn = (s.sectionName || '').toUpperCase();
                    return sn === q1 || sn === q2 || sn.includes(q1) || sn.includes(q2);
                });
                
                if (matchSec) {
                    const ttRes = await fetch('/api/timetable/section/' + matchSec.id, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('sece_token') } });
                    if (ttRes.ok) {
                        const sectionEntries = await ttRes.json();
                        days.forEach(day => {
                            saved[day] = {};
                            mcTtColumns.forEach(col => { if (!col.isBreak || col.key === 'ACT') saved[day][col.key] = 'FREE'; });
                        });
                        sectionEntries.forEach(entry => {
                            let day = entry.day;
                            if (saved[day]) {
                                let slotToKeyMap = { 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4', 5: 'P5', 6: 'P6', 7: 'P7' };
                                let colKey = slotToKeyMap[entry.slotNumber];
                                if (colKey) {
                                    saved[day][colKey] = entry.subjectName || entry.subjectCode || 'FREE';
                                }
                            }
                        });
                    }
                }
            }
        } catch(e) { console.error("Error fetching section timetable", e); }
    }
    
    const thead = document.getElementById('mcTtHead');'''

text = text.replace(old_render, new_render)


old_cell = '''                const val = dayData[col.key] || 'FREE';
                html += `<td>
                    <input type="text" id="mcTtCell_${day}_${col.key}" class="form-control form-control-sm bg-dark text-white border-secondary text-center ${val !== 'FREE' ? 'text-info' : 'text-muted'}" value="${val}" />
                </td>`;'''

new_cell = '''                const cellData = dayData[col.key] || 'FREE';
                let val = typeof cellData === 'object' ? cellData.value : cellData;
                let type = typeof cellData === 'object' ? cellData.type : 'Permanent';
                
                html += `<td style="min-width: 120px;">
                    <input type="text" id="mcTtCell_${day}_${col.key}" class="form-control form-control-sm bg-dark text-white border-secondary text-center fw-bold mb-1 ${val !== 'FREE' ? 'text-info' : 'text-muted'}" value="${val}" />
                    <select id="mcTtType_${day}_${col.key}" class="form-select form-select-sm bg-dark border-secondary ${type==='Temporary'?'text-warning':'text-muted'}" style="font-size: 0.7rem; padding: 0.1rem; height: auto;">
                        <option value="Permanent" ${type==='Permanent'?'selected':''}>Permanent</option>
                        <option value="Temporary" ${type==='Temporary'?'selected':''}>Temporary</option>
                    </select>
                </td>`;'''

text = text.replace(old_cell, new_cell)


old_save = '''        mcTtColumns.forEach(col => {
            if (col.isBreak && col.key !== 'ACT') return;
            const input = document.getElementById(`mcTtCell_${day}_${col.key}`);
            if (input) {
                data[day][col.key] = input.value || 'FREE';
            }
        });'''

new_save = '''        mcTtColumns.forEach(col => {
            if (col.isBreak && col.key !== 'ACT') return;
            const input = document.getElementById(`mcTtCell_${day}_${col.key}`);
            const typeSel = document.getElementById(`mcTtType_${day}_${col.key}`);
            if (input) {
                let v = input.value || 'FREE';
                let t = typeSel ? typeSel.value : 'Permanent';
                data[day][col.key] = { value: v, type: t };
            }
        });'''

text = text.replace(old_save, new_save)


old_student_render = '''                  const val = dayData[col.key] || 'FREE';
                  html += `<td class="fw-bold ${val !== 'FREE' ? 'text-info' : 'text-muted'}">${val}</td>`;'''

new_student_render = '''                  const cellData = dayData[col.key] || 'FREE';
                  let val = typeof cellData === 'object' ? cellData.value : cellData;
                  let type = typeof cellData === 'object' ? cellData.type : 'Permanent';
                  html += `<td class="fw-bold ${val !== 'FREE' ? 'text-info' : 'text-muted'}">
                      ${val}
                      ${type === 'Temporary' ? '<br><span class="badge bg-warning text-dark" style="font-size:0.6rem">Temp</span>' : ''}
                  </td>`;'''

text = text.replace(old_student_render, new_student_render)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated frontend_app.js to support Permanent/Temporary and Backend Fetch!")
