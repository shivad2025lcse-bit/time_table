file_path = r'd:\Java_project\frontend\public\js\frontend_app.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Append the new logic at the end of the file
new_logic = '''
// --- Manage Class Timetable Logic ---

let mcTtColumns = [];

function loadMcTtColumns(sectionKey) {
    const defaultCols = [
        { label: '1', key: 'P1', defTime: '08.40 - 09.40' },
        { label: '2', key: 'P2', defTime: '09.40 - 10.40' },
        { label: '3', key: 'P3', defTime: '11.00 - 12.00' },
        { label: 'Tea Break', key: 'Tea', isBreak: true, defTime: '12.00 - 12.15' },
        { label: '4', key: 'P4', defTime: '12.15 - 01.15' },
        { label: '5', key: 'P5', defTime: '01.15 - 02.00' },
        { label: 'Lunch Break', key: 'Lunch', isBreak: true, defTime: '02.00 - 02.40' },
        { label: 'Activity', key: 'ACT', isBreak: true, defTime: '02.40 - 03.30' },
        { label: '6', key: 'P6', defTime: '03.30 - 04.20' },
        { label: '7', key: 'P7', defTime: '04.20 - 05.10' }
    ];
    let savedCols = null;
    try {
        savedCols = JSON.parse(localStorage.getItem('mc_tt_cols_' + sectionKey));
    } catch(e){}
    
    if (savedCols && Array.isArray(savedCols) && savedCols.length > 0) {
        mcTtColumns = savedCols;
    } else {
        mcTtColumns = defaultCols;
    }
}

function saveMcTtColumns(sectionKey) {
    localStorage.setItem('mc_tt_cols_' + sectionKey, JSON.stringify(mcTtColumns));
}

window.initManageClassTt = function() {
    document.getElementById('mcTtGridContainer').classList.add('d-none');
};

window.mcSwapCol = function(idx, dir) {
    if (idx + dir < 0 || idx + dir >= mcTtColumns.length) return;
    const temp = mcTtColumns[idx];
    mcTtColumns[idx] = mcTtColumns[idx + dir];
    mcTtColumns[idx + dir] = temp;
    const sectionKey = _getMcSectionKey();
    saveMcTtColumns(sectionKey);
    window.renderManageClassTt(sectionKey);
};

window.mcRemoveCol = function(idx) {
    if (confirm('Are you sure you want to remove this period?')) {
        mcTtColumns.splice(idx, 1);
        const sectionKey = _getMcSectionKey();
        saveMcTtColumns(sectionKey);
        window.renderManageClassTt(sectionKey);
    }
};

window.mcUpdateColLabel = function(idx, val) {
    mcTtColumns[idx].label = val;
    const sectionKey = _getMcSectionKey();
    saveMcTtColumns(sectionKey);
};

window.mcAddPeriodCol = function() {
    const keyStr = "P" + (new Date().getTime().toString().substring(8));
    mcTtColumns.push({ label: 'New', key: keyStr, defTime: '00.00 - 00.00' });
    const sectionKey = _getMcSectionKey();
    saveMcTtColumns(sectionKey);
    window.renderManageClassTt(sectionKey);
};

function _getMcSectionKey() {
    const yr = document.getElementById('mcYearSelect').value;
    const dept = document.getElementById('mcDeptSelect').value;
    const sec = document.getElementById('mcSecSelect').value;
    return `${yr} ${dept} ${sec}`;
}

window.loadManageClassTt = function() {
    const sectionKey = _getMcSectionKey();
    document.getElementById('mcTtTitle').innerText = 'Editing: ' + sectionKey;
    document.getElementById('mcTtGridContainer').classList.remove('d-none');
    window.renderManageClassTt(sectionKey);
};

window.renderManageClassTt = function(sectionKey) {
    const tbody = document.getElementById('mcTtBody');
    if (!tbody) return;
    
    loadMcTtColumns(sectionKey);
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('class_tt_' + sectionKey) || '{}'); } catch(e) {}
    
    const thead = document.getElementById('mcTtHead');
    let thHtml = '<tr><th style="width: 90px">Day</th>';
    const headers = saved._headers || {};
    
    mcTtColumns.forEach((col, i) => {
        const timeVal = headers[col.key] || col.defTime;
        if (col.isBreak && col.key !== 'ACT') {
            thHtml += `<th class="text-warning position-relative">
                <div class="d-flex justify-content-between px-1 mb-1">
                   ${i > 0 ? `<i class="fa-solid fa-caret-left" style="cursor:pointer" onclick="mcSwapCol(${i}, -1)"></i>` : `<span></span>`}
                   ${i < mcTtColumns.length - 1 ? `<i class="fa-solid fa-caret-right" style="cursor:pointer" onclick="mcSwapCol(${i}, 1)"></i>` : `<span></span>`}
                </div>
                ${col.label}<input type="text" id="mcTtHeader${col.key}" class="form-control form-control-sm bg-dark text-white border-secondary text-center text-warning mt-1" style="font-size: 0.75rem; padding: 0.2rem" value="${timeVal}" />
            </th>`;
        } else {
            thHtml += `<th class="position-relative">
                <div class="d-flex justify-content-between px-1 text-muted mb-1">
                   ${i > 0 ? `<i class="fa-solid fa-caret-left" style="cursor:pointer" onclick="mcSwapCol(${i}, -1)"></i>` : `<span></span>`}
                   <i class="fa-solid fa-trash text-danger" style="cursor:pointer" onclick="mcRemoveCol(${i})"></i>
                   ${i < mcTtColumns.length - 1 ? `<i class="fa-solid fa-caret-right" style="cursor:pointer" onclick="mcSwapCol(${i}, 1)"></i>` : `<span></span>`}
                </div>
                <input type="text" id="mcTtLabel${col.key}" class="form-control form-control-sm bg-dark text-white border-secondary text-center fw-bold mb-1" style="font-size: 0.8rem; padding: 0.2rem" value="${col.label}" onchange="mcUpdateColLabel(${i}, this.value)" />
                <input type="text" id="mcTtHeader${col.key}" class="form-control form-control-sm bg-dark text-white border-secondary text-center text-muted" style="font-size: 0.75rem; padding: 0.2rem" value="${timeVal}" />
            </th>`;
        }
    });
    thHtml += '</tr>';
    thead.innerHTML = thHtml;
    
    let html = '';
    days.forEach(day => {
        let dayData = saved[day] || {};
        html += `<tr><td class="fw-bold">${day}</td>`;
        mcTtColumns.forEach(col => {
            if (col.isBreak && col.key !== 'ACT') {
                html += `<td class="text-warning small align-middle">${col.label.toUpperCase()}</td>`;
            } else {
                const val = dayData[col.key] || 'FREE';
                html += `<td>
                    <input type="text" id="mcTtCell_${day}_${col.key}" class="form-control form-control-sm bg-dark text-white border-secondary text-center ${val !== 'FREE' ? 'text-info' : 'text-muted'}" value="${val}" />
                </td>`;
            }
        });
        html += '</tr>';
    });
    tbody.innerHTML = html;
};

window.saveManageClassTt = function() {
    const sectionKey = _getMcSectionKey();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let data = { _headers: {} };
    
    mcTtColumns.forEach(col => {
        const hInput = document.getElementById(`mcTtHeader${col.key}`);
        if (hInput) data._headers[col.key] = hInput.value;
    });
    
    days.forEach(day => {
        data[day] = {};
        mcTtColumns.forEach(col => {
            if (col.isBreak && col.key !== 'ACT') return;
            const input = document.getElementById(`mcTtCell_${day}_${col.key}`);
            if (input) {
                data[day][col.key] = input.value || 'FREE';
            }
        });
    });
    
    localStorage.setItem('class_tt_' + sectionKey, JSON.stringify(data));
    showToast('Success', 'Class timetable saved successfully!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('manageClassTtModal')).hide();
    
    if (typeof renderTimetableGrid === 'function') {
        renderTimetableGrid();
    }
};
'''
if "window.initManageClassTt = function" not in text:
    text += '\n' + new_logic

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Appended functions to frontend_app.js!')
