file_path = r'd:\Java_project\frontend\public\js\frontend_app.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the HTML generation in renderManageClassTt to exactly mimic tt-grid
old_th = '''    let thHtml = '<tr><th style="width: 90px">Day</th>';
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
    thHtml += '</tr>';'''

new_th = '''    let thHtml = '<tr><th>Day</th>';
    const headers = saved._headers || {};
    
    mcTtColumns.forEach((col, i) => {
        const timeVal = headers[col.key] || col.defTime;
        if (col.isBreak && col.key !== 'ACT') {
            thHtml += `<th class="text-warning" style="position: relative;">
                <div style="position:absolute; top:2px; left:2px; right:2px; display:flex; justify-content:space-between; font-size: 0.7rem; opacity: 0.7">
                   ${i > 0 ? `<i class="fa-solid fa-caret-left" style="cursor:pointer" onclick="mcSwapCol(${i}, -1)"></i>` : `<span></span>`}
                   ${i < mcTtColumns.length - 1 ? `<i class="fa-solid fa-caret-right" style="cursor:pointer" onclick="mcSwapCol(${i}, 1)"></i>` : `<span></span>`}
                </div>
                <br/>
                ${col.label.toUpperCase()}
                <br/><input type="text" id="mcTtHeader${col.key}" style="background:transparent; border:none; color:inherit; text-align:center; font-size:0.7rem; width:100%" value="${timeVal}" />
            </th>`;
        } else {
            thHtml += `<th style="position: relative;">
                <div style="position:absolute; top:2px; left:2px; right:2px; display:flex; justify-content:space-between; font-size: 0.7rem; opacity: 0.5">
                   ${i > 0 ? `<i class="fa-solid fa-caret-left" style="cursor:pointer" onclick="mcSwapCol(${i}, -1)"></i>` : `<span></span>`}
                   <i class="fa-solid fa-trash text-danger" style="cursor:pointer" onclick="mcRemoveCol(${i})"></i>
                   ${i < mcTtColumns.length - 1 ? `<i class="fa-solid fa-caret-right" style="cursor:pointer" onclick="mcSwapCol(${i}, 1)"></i>` : `<span></span>`}
                </div>
                <input type="text" id="mcTtLabel${col.key}" style="background:transparent; border:none; color:inherit; text-align:center; font-weight:bold; width:100%; margin-top:8px" value="${col.label}" onchange="mcUpdateColLabel(${i}, this.value)" />
                <br/><input type="text" id="mcTtHeader${col.key}" style="background:transparent; border:none; color:var(--bs-gray-500); text-align:center; font-size:0.75rem; width:100%" value="${timeVal}" />
            </th>`;
        }
    });
    thHtml += '</tr>';'''

text = text.replace(old_th, new_th)

old_cell = '''                const cellData = dayData[col.key] || 'FREE';
                let val = typeof cellData === 'object' ? cellData.value : cellData;
                let type = typeof cellData === 'object' ? cellData.type : 'Permanent';
                
                html += `<td style="min-width: 120px;">
                    <input type="text" id="mcTtCell_${day}_${col.key}" class="form-control form-control-sm bg-dark text-white border-secondary text-center fw-bold mb-1 ${val !== 'FREE' ? 'text-info' : 'text-muted'}" value="${val}" />
                    <select id="mcTtType_${day}_${col.key}" class="form-select form-select-sm bg-dark border-secondary ${type==='Temporary'?'text-warning':'text-muted'}" style="font-size: 0.7rem; padding: 0.1rem; height: auto;">
                        <option value="Permanent" ${type==='Permanent'?'selected':''}>Permanent</option>
                        <option value="Temporary" ${type==='Temporary'?'selected':''}>Temporary</option>
                    </select>
                </td>`;'''

new_cell = '''                const cellData = dayData[col.key] || 'FREE';
                let val = typeof cellData === 'object' ? cellData.value : cellData;
                let type = typeof cellData === 'object' ? cellData.type : 'Permanent';
                
                html += `<td style="min-width: 120px; vertical-align: middle;">
                    <input type="text" id="mcTtCell_${day}_${col.key}" style="background:transparent; border:none; outline:none; text-align:center; width:100%; font-weight:700;" class="${val !== 'FREE' ? 'text-info' : 'text-secondary'}" value="${val}" />
                    <div class="mt-1 d-flex justify-content-center">
                        <select id="mcTtType_${day}_${col.key}" style="background:transparent; border:1px solid rgba(255,255,255,0.1); border-radius:3px; outline:none; text-align:center; font-size: 0.65rem;" class="${type==='Temporary'?'text-warning':'text-muted'}">
                            <option style="background:#212529" value="Permanent" ${type==='Permanent'?'selected':''}>Perm</option>
                            <option style="background:#212529" value="Temporary" ${type==='Temporary'?'selected':''}>Temp</option>
                        </select>
                    </div>
                </td>`;'''

text = text.replace(old_cell, new_cell)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated frontend_app.js to use glass-morphism tt-grid styling for Manage Class TT")
