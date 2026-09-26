import re

with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'r', encoding='utf-8') as f:
    content = f.read()

builder_logic = """
let builderTtColumns = [];

function loadBuilderTtColumns() {
    const parsed = JSON.parse(localStorage.getItem('builder_tt_cols') || 'null');
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        builderTtColumns = parsed;
    } else {
        builderTtColumns = [
            { key: 'P1', label: 'Period 1', isBreak: false, defTime: '08.40 - 09.40' },
            { key: 'P2', label: 'Period 2', isBreak: false, defTime: '09.40 - 10.40' },
            { key: 'P3', label: 'Period 3', isBreak: false, defTime: '11.00 - 12.00' },
            { key: 'TEA', label: 'Tea Break', isBreak: true, defTime: '12.00 - 12.15' },
            { key: 'P4', label: 'Period 4', isBreak: false, defTime: '12.15 - 01.15' },
            { key: 'P5', label: 'Period 5', isBreak: false, defTime: '01.15 - 02.00' },
            { key: 'LUNCH', label: 'Lunch Break', isBreak: true, defTime: '02.00 - 02.40' },
            { key: 'ACT', label: 'Activity', isBreak: false, defTime: '02.40 - 03.30' },
            { key: 'P6', label: 'Period 6', isBreak: false, defTime: '03.30 - 04.20' },
            { key: 'P7', label: 'Period 7', isBreak: false, defTime: '04.20 - 05.10' }
        ];
    }
}

function saveBuilderTtColumns() {
    localStorage.setItem('builder_tt_cols', JSON.stringify(builderTtColumns));
}

window.addBuilderPeriodCol = function() {
    const newIdx = builderTtColumns.length + 1;
    const newKey = 'P' + newIdx + '_' + Date.now().toString().slice(-4);
    builderTtColumns.push({
        key: newKey,
        label: 'Period ' + newIdx,
        isBreak: false,
        defTime: '00.00 - 00.00'
    });
    saveBuilderTtColumns();
    if (window.currentTimetableSection) window.renderTimetableBuilderGrid(window.currentTimetableSection);
};

window.swapBuilderCol = function(idx, dir) {
    if (idx + dir < 0 || idx + dir >= builderTtColumns.length) return;
    const temp = builderTtColumns[idx];
    builderTtColumns[idx] = builderTtColumns[idx + dir];
    builderTtColumns[idx + dir] = temp;
    saveBuilderTtColumns();
    if (window.currentTimetableSection) window.renderTimetableBuilderGrid(window.currentTimetableSection);
};

window.removeBuilderCol = function(idx) {
    if (confirm('Are you sure you want to remove this period column?')) {
        builderTtColumns.splice(idx, 1);
        saveBuilderTtColumns();
        if (window.currentTimetableSection) window.renderTimetableBuilderGrid(window.currentTimetableSection);
    }
};

window.renderTimetableBuilderGrid = function(section) {
    const thead = document.getElementById('ttBuilderHead');
    const tbody = document.getElementById('ttBuilderGrid');
    if (!tbody || !thead) return;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const savedDataStr = localStorage.getItem(`sece_tt_built_${section}`);
    let savedData = null;
    if (savedDataStr) {
        try { savedData = JSON.parse(savedDataStr); } catch (e) {}
    }
    
    document.getElementById('ttBuildAdvisor').value = (savedData && savedData.advisor) ? savedData.advisor : '';
    document.getElementById('ttBuildTutors').value = (savedData && savedData.tutors) ? savedData.tutors : '';

    loadBuilderTtColumns();
    const headers = (savedData && savedData.headers) ? savedData.headers : {};

    let headHtml = `<tr><th style="width: 90px;">Day</th>`;
    builderTtColumns.forEach((col, i) => {
        const val = headers[col.key] || col.defTime;
        const colorClass = (col.isBreak && col.key !== 'ACT') ? 'text-warning' : '';
        
        headHtml += `<th class="${colorClass}">${col.label}
            <div class="d-flex justify-content-between px-1 mb-1 mt-1 text-muted" style="font-size: 0.75rem;">
                ${i > 0 ? `<i class="fa-solid fa-caret-left" style="cursor:pointer" onclick="swapBuilderCol(${i}, -1)"></i>` : `<span></span>`}
                <i class="fa-solid fa-trash text-danger" style="cursor:pointer" onclick="removeBuilderCol(${i})"></i>
                ${i < builderTtColumns.length - 1 ? `<i class="fa-solid fa-caret-right" style="cursor:pointer" onclick="swapBuilderCol(${i}, 1)"></i>` : `<span></span>`}
            </div>
            <input type="text" id="ttBuildHdr_${col.key}" class="form-control form-control-sm bg-dark text-white border-secondary text-center ${colorClass}" style="font-size: 0.75rem; padding: 0.2rem" value="${val.replace(/"/g, '&quot;')}" />
        </th>`;
    });
    headHtml += `</tr>`;
    thead.innerHTML = headHtml;

    let html = '';
    days.forEach(day => {
        html += `<tr><td class="align-middle text-white fw-bold">${day}</td>`;
        builderTtColumns.forEach(col => {
            if (col.isBreak && col.key !== 'ACT') {
                html += `<td class="align-middle text-muted small text-center">${col.label.toUpperCase()}</td>`;
            } else {
                const val = (savedData && savedData.grid && savedData.grid[day] && savedData.grid[day][col.key]) ? savedData.grid[day][col.key] : '';
                html += `<td><input type="text" id="ttb_${day}_${col.key}" class="form-control form-control-sm bg-dark text-white border-secondary text-center" value="${val.replace(/"/g, '&quot;')}" /></td>`;
            }
        });
        html += `</tr>`;
    });
    tbody.innerHTML = html;
};

window.saveTimetableBuilder = function() {
    const section = window.currentTimetableSection;
    if (!section) return;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const data = {
        advisor: document.getElementById('ttBuildAdvisor').value.trim(),
        tutors: document.getElementById('ttBuildTutors').value.trim(),
        metadata: {
            batch: window.currentTimetableBatch || '2024',
            year: window.currentTimetableYear || '2',
            semester: window.currentTimetableSemester || '3'
        },
        headers: {},
        grid: {}
    };
    
    loadBuilderTtColumns();
    builderTtColumns.forEach(col => {
        const hEl = document.getElementById(`ttBuildHdr_${col.key}`);
        if (hEl) data.headers[col.key] = hEl.value.trim();
    });

    days.forEach(day => {
        data.grid[day] = {};
        builderTtColumns.forEach(col => {
            if (!col.isBreak || col.key === 'ACT') {
                const el = document.getElementById(`ttb_${day}_${col.key}`);
                if (el) data.grid[day][col.key] = el.value.trim();
            }
        });
    });
    
    localStorage.setItem(`sece_tt_built_${section}`, JSON.stringify(data));
    
    fetch('/api/timetable/save-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: section, grid: data.grid })
    }).then(r => r.ok ? r.json() : Promise.reject())
      .then(() => console.log('Saved to MySQL Database successfully'))
      .catch(() => console.warn('Failed to save to MySQL Database'));

    showToast('Success', `Timetable for ${section} saved!`);
    
    const modalEl = bootstrap.Modal.getInstance(document.getElementById('timetableBuilderModal'));
    if (modalEl) modalEl.hide();
    
    timetableData = loadSavedTimetable();
    if (currentSection === section) {
        renderTimetableGrid();
    }
};
"""

# We need to replace the old renderTimetableBuilderGrid and saveTimetableBuilder
import re
pattern = re.compile(r'window\.renderTimetableBuilderGrid\s*=\s*function\(section\)\s*\{.*?\nwindow\.saveTimetableBuilder\s*=\s*function\(\)\s*\{.*?\n\};', re.DOTALL)

if pattern.search(content):
    content = pattern.sub(builder_logic.strip(), content)
    with open(r'd:\Java_project\frontend\public\js\frontend_app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Could not find functions")
