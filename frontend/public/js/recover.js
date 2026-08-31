window.editPersistentStudent = function(id) {
    let student = studentsRoster.find(s => s.id === id || s.roll === id || s.registerNumber === id);
    if (!student) {
        alert("Student not found!");
        return;
    }
    
    document.getElementById('esId').value = student.id || student.roll;
    
    const fName = student.firstName || student.name || '';
    const nameParts = (student.firstName ? fName : fName.split(' '));
    document.getElementById('esFirstName').value = student.firstName || nameParts[0] || '';
    document.getElementById('esLastName').value = student.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
    
    document.getElementById('esRegNo').value = student.registerNumber || student.roll || '';
    document.getElementById('esEmail').value = student.email || '';
    document.getElementById('esCollegeEmail').value = student.collegeEmail || '';
    document.getElementById('esPhone').value = student.phone || '';
    document.getElementById('esParentPhone1').value = student.parentPhone1 || '';
    document.getElementById('esParentPhone2').value = student.parentPhone2 || '';
    
    let dept = '-', course = '-', sec = '-';
    if (student.department && student.department.name) dept = student.department.name;
    else if (student.dept) dept = student.dept;
    
    if (student.course && student.course.name) course = student.course.name;
    
    let secDisplay = student.section ? (student.section.sectionName || student.section.name) : (student.sec || '-');
    if (secDisplay && secDisplay !== '-') {
        const parts = secDisplay.split(' ');
        if (parts.length >= 3) {
            course = parts[0];
            dept = parts[1];
            sec = parts.slice(2).join(' ');
        } else {
            sec = secDisplay;
        }
    }
    
    document.getElementById('esDept').value = dept;
    document.getElementById('esCourse').value = course;
    document.getElementById('esSection').value = sec;
    document.getElementById('esSemester').value = student.semester || student.sem || '';
    
    const alertBox = document.getElementById('editStudentAlert');
    if (alertBox) alertBox.classList.add('d-none');
    
    const modalEl = document.getElementById('editStudentModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
};

window.submitEditStudentForm = async function(e) {
    const id = document.getElementById('esId').value;
    const fName = document.getElementById('esFirstName').value;
    const lName = document.getElementById('esLastName').value;
    const regNo = document.getElementById('esRegNo').value;
    const email = document.getElementById('esEmail').value;
    const collegeEmail = document.getElementById('esCollegeEmail').value;
    const phone = document.getElementById('esPhone').value;
    const parentPhone1 = document.getElementById('esParentPhone1').value;
    const parentPhone2 = document.getElementById('esParentPhone2').value;
    const deptId = document.getElementById('esDept').value;
    const courseId = document.getElementById('esCourse').value;
    const secId = document.getElementById('esSection').value;
    const semester = document.getElementById('esSemester').value;

    const alertBox = document.getElementById('editStudentAlert');
    alertBox.classList.remove('d-none', 'alert-success', 'alert-danger');

    const nameParts = fName.trim().split(/\s+/);
    const firstName = nameParts[0] || fName;
    const lastName = lName.trim() || nameParts.slice(1).join(' ') || firstName;

    const deptCourseMap = { 'CSE': 'BTECH-CSE', 'IT': 'BTECH-IT', 'AI&DS': 'BTECH-AIDS', 'AI&ML': 'BTECH-AIML', 'ECE': 'BTECH-ECE' };
    const actualCourseId = deptCourseMap[deptId] || 'BTECH-' + deptId;
    const fullSectionName = courseId + ' ' + deptId + ' ' + secId;

    const payload = {
        firstName: firstName, lastName: lastName, registerNumber: regNo,
        email: email || collegeEmail, collegeEmail: collegeEmail, phone: phone,
        parentPhone1: parentPhone1, parentPhone2: parentPhone2 || null, semester: parseInt(semester),
        department: { name: deptId }, course: { name: actualCourseId }, section: { sectionName: fullSectionName }
    };

    try {
        const res = await apiFetch('/api/students/' + id, { method: 'PUT', body: JSON.stringify(payload) });
        if (res.ok) {
            alertBox.classList.add('alert-success');
            alertBox.innerText = 'Student updated successfully!';
            if (typeof loadRecentStudents === 'function') loadRecentStudents();
            setTimeout(() => {
                const modalEl = document.getElementById('editStudentModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }, 1000);
        } else {
            const errText = await res.text().catch(() => res.status);
            alertBox.classList.add('alert-danger');
            alertBox.innerText = errText || 'Failed to update student.';
        }
    } catch (err) {
        console.error(err);
        alertBox.classList.add('alert-danger');
        alertBox.innerText = 'Error connecting to backend.';
    }
};

window.initAdminViewEditTimetableModal = async function() {
    const deptSelect = document.getElementById('avtDeptSelect');
    if (!deptSelect) return;
    deptSelect.innerHTML = '<option value="">Select Department...</option>';
    document.getElementById('avtSectionSelect').innerHTML = '<option value="">Select Department First...</option>';
    try {
        const res = await apiFetch('/api/departments');
        if (res.ok) {
            const depts = await res.json();
            depts.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.name; opt.innerText = d.name;
                deptSelect.appendChild(opt);
            });
        }
    } catch (err) { console.error('Failed to load departments', err); }
};

window.avtDeptChanged = async function(deptName) {
    const sectionSelect = document.getElementById('avtSectionSelect');
    if (!sectionSelect) return;
    sectionSelect.innerHTML = '<option value="">Select Section...</option>';
    if (!deptName) {
        sectionSelect.innerHTML = '<option value="">Select Department First...</option>';
        return;
    }
    try {
        const res = await apiFetch('/api/sections');
        if (res.ok) {
            const sections = await res.json();
            const filteredSections = sections.filter(s => {
                if (s.course && s.course.department && s.course.department.name === deptName) return true;
                if (s.sectionName && s.sectionName.includes(deptName)) return true;
                return false;
            });
            filteredSections.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.sectionName; opt.innerText = s.sectionName;
                sectionSelect.appendChild(opt);
            });
        }
    } catch (err) { console.error('Failed to load sections', err); }
};

window.submitAdminViewEditTimetable = function() {
    const batch = document.getElementById('avtBatchInput').value;
    const dept = document.getElementById('avtDeptSelect').value;
    const section = document.getElementById('avtSectionSelect').value;
    const year = document.getElementById('avtYearSelect').value;
    const semester = document.getElementById('avtSemesterSelect').value;

    if (!batch || !dept || !section || !year || !semester) {
        alert("Please fill all fields."); return;
    }
    window.currentTimetableBatch = batch;
    window.currentTimetableDept = dept;
    window.currentTimetableSection = section;
    window.currentTimetableYear = year;
    window.currentTimetableSemester = semester;
    
    if (window.renderTimetableBuilderGrid) window.renderTimetableBuilderGrid(section);
    const selectionModalEl = bootstrap.Modal.getInstance(document.getElementById('adminViewEditTimetableModal'));
    if (selectionModalEl) selectionModalEl.hide();
    const builderModalEl = new bootstrap.Modal(document.getElementById('timetableBuilderModal'));
    builderModalEl.show();
};