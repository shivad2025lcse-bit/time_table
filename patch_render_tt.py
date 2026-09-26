file_path = r'd:\Java_project\frontend\public\js\frontend_app.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# We replace the beginning of renderTimetableGrid
old_start = '''function renderTimetableGrid() {
    const tbody = document.getElementById('ttGridBody');
    tbody.innerHTML = '';

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let data = {};'''

new_start = '''function renderTimetableGrid() {
    const tbody = document.getElementById('ttGridBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // --- Custom Manual Override for Student Timetable ---
    let secString = typeof currentSection !== 'undefined' ? currentSection.replace(/_/g, ' ') : '';
    if (!secString) {
        let thText = document.getElementById('ttTitleHeader')?.innerText || '';
        let match = thText.match(/\(([^)]+)\)/);
        if (match) secString = match[1].split('-')[0].trim();
    }
    
    if (secString) {
        try {
            const manualData = JSON.parse(localStorage.getItem('class_tt_' + secString));
            const manualCols = JSON.parse(localStorage.getItem('mc_tt_cols_' + secString));
            if (manualData && manualCols) {
                // We have a manual override grid! Let's render it directly and return.
                
                // Update headers if any
                const thead = tbody.parentElement.querySelector('thead tr');
                if (thead && manualCols.length > 0) {
                    let thHtml = '<th style="width: 100px">Day Order</th>';
                    manualCols.forEach(col => {
                        const val = manualData._headers ? manualData._headers[col.key] || col.defTime : col.defTime;
                        if (col.isBreak && col.key !== 'ACT') {
                            thHtml += `<th class="text-warning text-center" style="width: 35px; line-height: 1.2; padding: 0.25rem">${val.replace(' - ', '<br/>-<br/>')}</th>`;
                        } else {
                            thHtml += `<th>${col.label}<br /><small class="text-dim">${val}</small></th>`;
                        }
                    });
                    thead.innerHTML = thHtml;
                }
                
                let html = '';
                days.forEach(day => {
                    html += `<tr><td class="fw-bold">${day}</td>`;
                    const dayData = manualData[day] || {};
                    manualCols.forEach(col => {
                        if (col.isBreak && col.key !== 'ACT') {
                            html += `<td class="text-warning small align-middle vertical-text" style="writing-mode: vertical-rl; transform: rotate(180deg); letter-spacing: 2px;">${col.label.toUpperCase()}</td>`;
                        } else {
                            const val = dayData[col.key] || 'FREE';
                            let cssClass = 'text-dim';
                            if (val !== 'FREE') {
                                if (val.includes('Lab') || val.includes('LAB')) cssClass = 'text-info';
                                else cssClass = 'text-success';
                            }
                            html += `<td>
                                <div class="fw-bold ${cssClass}">${val}</div>
                            </td>`;
                        }
                    });
                    html += `</tr>`;
                });
                tbody.innerHTML = html;
                return; // SKIP the rest of the function!
            }
        } catch(e) {
            console.error(e);
        }
    }
    // --- End Custom Manual Override ---

    let data = {};'''

text = text.replace(old_start, new_start)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched renderTimetableGrid!')
