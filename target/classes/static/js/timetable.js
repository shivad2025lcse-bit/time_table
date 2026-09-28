let currentTimetableEntries = [];
let allTimeSlotsCache = [];
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

async function loadTimetableData() {
    try {
        const slotsRes = await apiFetch('/api/timeslots');
        if (slotsRes.ok) {
            allTimeSlotsCache = await slotsRes.json();
            allTimeSlotsCache.sort((a, b) => a.slotNumber - b.slotNumber);
        }

        const entriesRes = await apiFetch('/api/timetable');
        if (entriesRes.ok) {
            currentTimetableEntries = await entriesRes.json();
            window.currentTimetableEntries = currentTimetableEntries; // Expose for frontend_app.js
            renderTimetableGrid(currentTimetableEntries);
            populateGridFilters();
        }
    } catch (e) {
        console.error("Failed to load timetable data", e);
    }
}

function renderTimetableGrid(entries) {
    const tableHead = document.getElementById('gridHead');
    const tableBody = document.getElementById('gridBody');
    if (!tableHead || !tableBody) return;

    // Header
    let headHtml = '<tr><th style="width: 140px; background: #1a365d; color: #fff;">Day / Period</th>';
    DAYS_OF_WEEK.forEach(day => {
        headHtml += `<th style="background: #1a365d; color: #fff;">${day}</th>`;
    });
    headHtml += '</tr>';
    tableHead.innerHTML = headHtml;

    if (allTimeSlotsCache.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No time slots found.</td></tr>';
        return;
    }

    let bodyHtml = '';
    allTimeSlotsCache.forEach(slot => {
        bodyHtml += `<tr><td class="align-middle text-center fw-bold bg-light" style="font-size: 0.85rem;">Slot ${slot.slotNumber}<br><span class="text-primary">${slot.slotLabel}</span></td>`;

        DAYS_OF_WEEK.forEach(day => {
            const matches = entries.filter(e => e.day === day && e.timeSlotId === slot.id);

            bodyHtml += '<td>';
            if (matches.length > 0) {
                matches.forEach(m => {
                    const isLab = m.subjectType === 'LAB' || m.subjectType === 'PRACTICAL';
                    const isProj = m.subjectType === 'PROJECT';
                    const roomStr = m.roomNumber ? `Venue: ${m.roomNumber}` : (m.labName ? `Lab: ${m.labName}` : 'SF 04');
                    
                    const canEdit = currentUser && (currentUser.role === 'ROLE_ADMIN' || currentUser.role === 'ROLE_FACULTY');

                    bodyHtml += `
                        <div class="slot-card ${isLab ? 'lab' : (isProj ? 'lab' : 'theory')} mb-1 position-relative">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="subject-name">${m.subjectCode}</div>
                                ${canEdit ? `
                                    <button class="btn btn-xs p-0 text-primary border-0 bg-transparent ms-1" title="Edit Period" onclick="openEditPeriodModal(${m.id}, '${m.subjectCode}', '${m.teacherName}', '${day}', '${m.timeSlotLabel}')">
                                        <i class="bi bi-pencil-square fs-6"></i>
                                    </button>
                                ` : ''}
                            </div>
                            <div class="small fw-semibold text-dark text-truncate">${m.subjectName}</div>
                            <div class="teacher-name small"><i class="bi bi-person"></i> ${m.teacherName}</div>
                            <div class="d-flex justify-content-between align-items-center mt-1">
                                <span class="room-badge">${roomStr}</span>
                                <span class="badge bg-secondary" style="font-size: 0.7rem;">${m.sectionName}</span>
                            </div>
                            
                            ${canEdit ? `
                                <div class="mt-1 pt-1 border-top d-flex justify-content-end gap-1">
                                    <button class="btn btn-xs btn-outline-success py-0 px-1" style="font-size: 0.68rem;" onclick="sendPeriodSmsAlert(${m.sectionId}, '${m.subjectName}', '${day}', '${m.timeSlotLabel}')">
                                        <i class="bi bi-phone"></i> SMS Alert
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
            }
            bodyHtml += '</td>';
        });

        bodyHtml += '</tr>';
    });

    tableBody.innerHTML = bodyHtml;
}

function populateGridFilters() {
    const selSec = document.getElementById('filterSection');
    const selTeacher = document.getElementById('filterTeacher');
    const selRoom = document.getElementById('filterRoom');

    if (selSec && selSec.options.length <= 1) {
        apiFetch('/api/sections').then(r => r.json()).then(secs => {
            secs.forEach(s => selSec.add(new Option(s.sectionName, s.id)));
        });
    }
    if (selTeacher && selTeacher.options.length <= 1) {
        apiFetch('/api/teachers').then(r => r.json()).then(ts => {
            ts.forEach(t => selTeacher.add(new Option(t.name, t.id)));
        });
    }
    if (selRoom && selRoom.options.length <= 1) {
        apiFetch('/api/classrooms').then(r => r.json()).then(rms => {
            rms.forEach(r => selRoom.add(new Option('Classroom: ' + r.roomNumber, 'room_' + r.id)));
        });
        apiFetch('/api/laboratories').then(r => r.json()).then(lbs => {
            lbs.forEach(l => selRoom.add(new Option('Lab: ' + l.labName, 'lab_' + l.id)));
        });
    }
}

function applyGridFilter() {
    const secId = document.getElementById('filterSection')?.value;
    const teacherId = document.getElementById('filterTeacher')?.value;
    const roomVal = document.getElementById('filterRoom')?.value;

    let filtered = currentTimetableEntries;

    if (secId) {
        filtered = filtered.filter(e => e.sectionId == secId);
    }
    if (teacherId) {
        filtered = filtered.filter(e => e.teacherId == teacherId);
    }
    if (roomVal) {
        if (roomVal.startsWith('room_')) {
            const rid = roomVal.replace('room_', '');
            filtered = filtered.filter(e => e.classroomId == rid);
        } else if (roomVal.startsWith('lab_')) {
            const lid = roomVal.replace('lab_', '');
            filtered = filtered.filter(e => e.laboratoryId == lid);
        }
    }

    renderTimetableGrid(filtered);
}

function clearGridFilter() {
    if (document.getElementById('filterSection')) document.getElementById('filterSection').value = '';
    if (document.getElementById('filterTeacher')) document.getElementById('filterTeacher').value = '';
    if (document.getElementById('filterRoom')) document.getElementById('filterRoom').value = '';
    renderTimetableGrid(currentTimetableEntries);
}

// Faculty & Admin Period Edit Modal Handler
let activeEditingEntryId = null;

async function openEditPeriodModal(entryId, subjectCode, currentTeacher, day, slotLabel) {
    activeEditingEntryId = entryId;
    document.getElementById('editModalSubjectCode').innerText = subjectCode;
    document.getElementById('editModalPeriodLabel').innerText = day + ' (' + slotLabel + ')';

    const teacherSelect = document.getElementById('editModalTeacherSelect');
    teacherSelect.innerHTML = '<option value="">Keep Existing Teacher</option>';
    const teachersRes = await apiFetch('/api/teachers');
    if (teachersRes.ok) {
        const teachers = await teachersRes.json();
        teachers.forEach(t => {
            teacherSelect.add(new Option(t.name, t.id));
        });
    }

    const roomSelect = document.getElementById('editModalRoomSelect');
    roomSelect.innerHTML = '<option value="">Keep Existing Venue</option>';
    const rmsRes = await apiFetch('/api/classrooms');
    if (rmsRes.ok) {
        const rms = await rmsRes.json();
        rms.forEach(r => roomSelect.add(new Option('Classroom: ' + r.roomNumber, 'room_' + r.id)));
    }
    const labsRes = await apiFetch('/api/laboratories');
    if (labsRes.ok) {
        const lbs = await labsRes.json();
        lbs.forEach(l => roomSelect.add(new Option('Lab: ' + l.labName, 'lab_' + l.id)));
    }

    const editModal = new bootstrap.Modal(document.getElementById('editPeriodModal'));
    editModal.show();
}

async function savePeriodEdit() {
    if (!activeEditingEntryId) return;

    const teacherId = document.getElementById('editModalTeacherSelect').value;
    const roomVal = document.getElementById('editModalRoomSelect').value;
    const dayVal = document.getElementById('editModalDaySelect').value;

    let queryParams = [];
    if (teacherId) queryParams.push(`teacherId=${teacherId}`);
    if (dayVal) queryParams.push(`day=${dayVal}`);
    if (roomVal) {
        if (roomVal.startsWith('room_')) {
            queryParams.push(`classroomId=${roomVal.replace('room_', '')}`);
        } else if (roomVal.startsWith('lab_')) {
            queryParams.push(`laboratoryId=${roomVal.replace('lab_', '')}`);
        }
    }

    const url = `/api/timetable/entry/${activeEditingEntryId}?` + queryParams.join('&');

    try {
        const res = await apiFetch(url, { method: 'PUT' });
        if (res.ok) {
            const modalEl = document.getElementById('editPeriodModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            loadTimetableData();
            loadDashboardStats();
            alert("Period schedule updated successfully!");
        } else {
            alert("Failed to update period schedule.");
        }
    } catch (e) {
        alert("Error saving period edit: " + e.message);
    }
}

// Student & Faculty SMS Notification Sender
async function sendPeriodSmsAlert(sectionId, subjectName, day, timeSlotLabel) {
    if (confirm(`Broadcast SMS notification to registered phone numbers of students and faculty for ${subjectName} on ${day} (${timeSlotLabel})?`)) {
        try {
            const res = await apiFetch(`/api/notifications/send-sms-alert?sectionId=${sectionId}&subjectName=${encodeURIComponent(subjectName)}&day=${encodeURIComponent(day)}&timeSlotLabel=${encodeURIComponent(timeSlotLabel)}`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                alert(`📱 SMS notification broadcast successfully to ${data.totalSmsRecipients} registered phone numbers!`);
            }
        } catch (e) {
            alert("Failed to send SMS notification: " + e.message);
        }
    }
}

// Timetable Generator API call
async function triggerGenerateTimetable() {
    const logBox = document.getElementById('genLogBox');
    const resultAlert = document.getElementById('genResultAlert');
    if (logBox) logBox.innerHTML = '';
    if (resultAlert) resultAlert.classList.add('d-none');

    function appendLog(msg) {
        if (logBox) {
            logBox.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ${msg}</div>`;
            logBox.scrollTop = logBox.scrollHeight;
        }
    }

    appendLog("Initiating SRI ESHWAR COLLEGE OF ENGINEERING TIME TABLE GENERATOR...");
    await new Promise(r => setTimeout(r, 300));
    appendLog("Step 1: Loading subjects (DM, DAA, DBMS, SE, JAVA, AIML, ALT Wednesday 4-5)...");
    await new Promise(r => setTimeout(r, 300));
    appendLog("Step 2: Loading faculty members and 6-day availability matrix...");
    await new Promise(r => setTimeout(r, 300));
    appendLog("Step 3: Loading venue classrooms (SF 04, SF 05) and specialized labs...");
    await new Promise(r => setTimeout(r, 300));
    appendLog("Step 4: Executing Backtracking Constraint Satisfaction Algorithm...");

    try {
        const res = await apiFetch('/api/timetable/generate', {
            method: 'POST',
            body: JSON.stringify({ academicYear: '2026-2027' })
        });

        if (res.ok) {
            const data = await res.json();
            appendLog(`Step 5: Completed in ${data.executionTimeMs}ms! Total classes scheduled: ${data.totalClasses}`);

            if (resultAlert) {
                resultAlert.classList.remove('d-none', 'alert-danger');
                resultAlert.classList.add('alert-success');
                resultAlert.innerHTML = `
                    <h4><i class="bi bi-check-circle-fill"></i> TIMETABLE GENERATED SUCCESSFULLY!</h4>
                    <p class="mb-0">
                        <strong>Total Classes:</strong> ${data.totalClasses} |
                        <strong>Conflicts:</strong> ${data.conflictsCount} |
                        <strong>Classrooms Used:</strong> ${data.roomsUsed} |
                        <strong>Labs Used:</strong> ${data.labsUsed}
                    </p>
                `;
            }
            loadTimetableData();
        } else {
            const err = await res.json();
            appendLog(`ERROR: ${err.message || 'Generation failed'}`);
        }
    } catch (e) {
        appendLog(`CRITICAL ERROR: ${e.message}`);
    }
}
