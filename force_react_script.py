import re

file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add a useEffect to forcibly overwrite the functions
force_script = '''
    // Force override of Manage Class TT functions to bypass browser caching
    useEffect(() => {
        window.initManageClassTt = function() {
            document.getElementById('mcTtGridContainer').classList.remove('d-none');
            if (window.loadManageClassTt) {
                window.loadManageClassTt();
            }
        };

        window.renderManageClassTt = async function(sectionKey) {
            const tbody = document.getElementById('mcTtBody');
            if (!tbody) return;
            
            if (window.loadMcTtColumns) window.loadMcTtColumns(sectionKey);
            
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
                                    window.mcTtColumns.forEach(col => { if (!col.isBreak || col.key === 'ACT') saved[day][col.key] = 'FREE'; });
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
                } catch(e) { console.error(e); }
            }
            
            let html = '';
            days.forEach(day => {
                let dayData = saved[day] || {};
                html += <tr><td class="fw-bold"></td>;
                if (window.mcTtColumns) {
                    window.mcTtColumns.forEach(col => {
                        if (col.isBreak && col.key !== 'ACT') {
                            html += <td class="text-warning small align-middle"></td>;
                        } else {
                            const cellData = dayData[col.key] || 'FREE';
                            let val = typeof cellData === 'object' ? cellData.value : cellData;
                            let type = typeof cellData === 'object' ? cellData.type : 'Permanent';
                            
                            html += <td style="min-width: 120px;">
                                <input type="text" id="mcTtCell__" class="form-control form-control-sm bg-dark text-white border-secondary text-center fw-bold mb-1 " value="" />
                                <select id="mcTtType__" class="form-select form-select-sm bg-dark border-secondary " style="font-size: 0.7rem; padding: 0.1rem; height: auto;">
                                    <option value="Permanent" >Permanent</option>
                                    <option value="Temporary" >Temporary</option>
                                </select>
                            </td>;
                        }
                    });
                }
                html += '</tr>';
            });
            tbody.innerHTML = html;
        };

        window.saveManageClassTt = function() {
            if (!window._getMcSectionKey) return;
            const sectionKey = window._getMcSectionKey();
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            let data = { _headers: {} };
            
            if (window.mcTtColumns) {
                window.mcTtColumns.forEach(col => {
                    const hInput = document.getElementById(mcTtHeader);
                    if (hInput) data._headers[col.key] = hInput.value;
                });
                
                days.forEach(day => {
                    data[day] = {};
                    window.mcTtColumns.forEach(col => {
                        if (col.isBreak && col.key !== 'ACT') return;
                        const input = document.getElementById(mcTtCell__);
                        const typeSel = document.getElementById(mcTtType__);
                        if (input) {
                            let v = input.value || 'FREE';
                            let t = typeSel ? typeSel.value : 'Permanent';
                            data[day][col.key] = { value: v, type: t };
                        }
                    });
                });
            }
            
            localStorage.setItem('class_tt_' + sectionKey, JSON.stringify(data));
            if (window.showToast) window.showToast('Success', 'Class timetable saved successfully!', 'success');
            if (window.bootstrap) window.bootstrap.Modal.getInstance(document.getElementById('manageClassTtModal')).hide();
            
            if (typeof window.renderTimetableGrid === 'function') {
                window.renderTimetableGrid();
            }
        };
    }, []);
'''

idx = text.find('const isFaculty = ')
if idx != -1:
    text = text[:idx] + force_script + text[idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Forced script overwrite via DashboardLayout.jsx React useEffect')
