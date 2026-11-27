// =========================================================================
// TEMPORARY TIMETABLE CHANGES + DATE-BASED OVERRIDES + EMAIL OTP ALERTS
// =========================================================================
(function () {
    if (window._tempTimetableModuleLoaded) return;
    window._tempTimetableModuleLoaded = true;

    const BADGE_CLASSES = {
        'PERMANENT': 'bg-secondary text-light',
        'TEMPORARY CHANGE': 'bg-warning text-dark',
        'CANCELLED': 'bg-danger text-white',
        'EXTRA CLASS': 'bg-info text-dark',
        'FACULTY SUBSTITUTION': 'bg-primary text-white',
        'ROOM CHANGE': 'bg-success text-white',
        'FREE PERIOD': 'bg-secondary text-info'
    };

    const STATUS_CLASSES = {
        'PUBLISHED': 'bg-success',
        'DRAFT': 'bg-secondary',
        'PENDING_APPROVAL': 'bg-warning text-dark',
        'CANCELLED': 'bg-danger',
        'EXPIRED': 'bg-dark border border-secondary text-muted',
        'REJECTED': 'bg-danger bg-opacity-75'
    };

    const esc = (v) => String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    function todayIsoLocal() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function _apiCall(url, opts) {
        if (typeof apiFetch === 'function') return apiFetch(url, opts);
        const token = localStorage.getItem('jwt_token');
        const headers = { ...(opts && opts.headers ? opts.headers : {}) };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (opts && opts.body && typeof opts.body === 'string' && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        return fetch(url, { ...opts, headers });
    }

    window._cachedEffectiveTimetable = null;
    window._cachedSectionsList = [];
    window._cachedAdminTtcList = [];

    window.getSelectedEffectiveDate = function () {
        const el = document.getElementById('ttEffectiveDatePicker');
        if (el && !el.value) el.value = todayIsoLocal();
        return (el && el.value) ? el.value : todayIsoLocal();
    };

    window.resetEffectiveDateToToday = function () {
        const el = document.getElementById('ttEffectiveDatePicker');
        if (el) el.value = todayIsoLocal();
        window.onEffectiveDateChange();
    };

    window.onEffectiveDateChange = async function () {
        await window.refreshStudentEffectiveTempUpdates();
        if (typeof renderTimetableGrid === 'function') renderTimetableGrid();
    };

    window.refreshStudentEffectiveTempUpdates = async function () {
        const roleNow = typeof getEffectiveRole === 'function' ? getEffectiveRole() : (window.currentUserRole || '');
        if (!localStorage.getItem('jwt_token')) return;

        const dateStr = window.getSelectedEffectiveDate();
        const badgeEl = document.getElementById('ttEffectiveDateBadge');
        const updatesBody = document.getElementById('studentTempUpdatesBody');

        try {
            let url = `/api/temp-timetable/effective?date=${encodeURIComponent(dateStr)}`;
            if (roleNow !== 'STUDENT') {
                // Admin/Faculty optional preview when currentSection matches a section id
                if (!window._cachedSectionsList.length) {
                    const secRes = await _apiCall('/api/sections');
                    if (secRes && secRes.ok) window._cachedSectionsList = await secRes.json();
                }
                const curSec = typeof currentSection !== 'undefined' ? currentSection : '';
                const matched = window._cachedSectionsList.find(s => String(s.sectionName || '').toUpperCase() === String(curSec || '').toUpperCase());
                if (!matched) return;
                url += `&sectionId=${matched.id}`;
            }

            const res = await _apiCall(url);
            if (!res || !res.ok) return;
            const data = await res.json();
            window._cachedEffectiveTimetable = data;

            if (badgeEl) {
                const count = Number(data.overrideCount || 0);
                badgeEl.classList.remove('d-none');
                badgeEl.className = count > 0 ? 'badge bg-warning text-dark' : 'badge bg-success';
                badgeEl.innerText = `${data.dayOfWeek || ''} (${data.date})${count > 0 ? ` • ${count} Temporary Override${count > 1 ? 's' : ''}` : ' • Permanent'}`;
            }

            if (updatesBody) {
                const upcoming = Array.isArray(data.upcomingChanges) ? data.upcomingChanges : [];
                const activeOnDate = (data.slots || []).filter(s => s.isTemporaryOverride && s.temporaryChange).map(s => s.temporaryChange);
                const mergedMap = new Map();
                activeOnDate.forEach(c => mergedMap.set(c.id, c));
                upcoming.forEach(c => mergedMap.set(c.id, c));
                const list = Array.from(mergedMap.values());

                if (!list.length) {
                    updatesBody.innerHTML = `<div class="text-muted small"><i class="fa-solid fa-circle-check text-success me-1"></i>No temporary timetable changes active or upcoming for <strong>${esc(data.sectionName)}</strong>. Permanent schedule applies cleanly.</div>`;
                } else {
                    updatesBody.innerHTML = list.map(c => {
                        const dateTxt = (c.startDate === c.endDate) ? c.startDate : `${c.startDate} to ${c.endDate}`;
                        const badgeCls = STATUS_CLASSES[c.status] || 'bg-warning text-dark';
                        return `<div class="p-2 mb-2 rounded border border-warning bg-dark bg-opacity-75 d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <span class="badge ${badgeCls} me-1">${esc(String(c.changeType || '').replace(/_/g, ' '))}</span>
                                <strong class="text-white">${esc(dateTxt)} • Period ${esc(c.periodNumber)}</strong>
                                <div class="small text-light mt-1">
                                    <span class="text-muted">Original:</span> ${esc(c.originalSubjectName || 'FREE')} (${esc(c.originalFacultyName || '-')}, ${esc(c.originalVenueName || '-')})
                                    <i class="fa-solid fa-arrow-right mx-2 text-warning"></i>
                                    <span class="text-warning fw-semibold">Updated:</span> ${esc(c.changeType === 'PERIOD_CANCELLATION' ? 'CANCELLED' : (c.updatedSubjectName || c.originalSubjectName || '-'))}
                                    (${esc(c.replacementFacultyName || c.originalFacultyName || '-')}, ${esc(c.updatedVenueName || c.originalVenueName || '-')})
                                </div>
                                ${c.reason ? `<div class="small text-info mt-1"><i class="fa-solid fa-comment-dots me-1"></i>Reason: ${esc(c.reason)}${c.description ? ` &mdash; ${esc(c.description)}` : ''}</div>` : ''}
                            </div>
                            <button type="button" class="btn btn-sm btn-outline-info py-1 px-2" onclick="window.showTempChangeDetails(${c.id})">
                                <i class="fa-solid fa-circle-info me-1"></i>View Change Details
                            </button>
                        </div>`;
                    }).join('');
                }
            }
            window._tempUpdatesLookup = window._tempUpdatesLookup || {};
            (data.upcomingChanges || []).forEach(c => { window._tempUpdatesLookup[c.id] = c; });
            (data.slots || []).forEach(s => { if (s.temporaryChange) window._tempUpdatesLookup[s.temporaryChange.id] = s.temporaryChange; });
        } catch (err) {
            console.warn('Could not load effective temporary timetable:', err);
        }
    };

    window.showTempChangeDetails = function (changeOrId) {
        const c = (typeof changeOrId === 'object' && changeOrId)
            ? changeOrId
            : (window._tempUpdatesLookup && window._tempUpdatesLookup[changeOrId])
              || (window._cachedAdminTtcList || []).find(x => x.id === changeOrId);
        const body = document.getElementById('tempChangeDetailBody');
        const modalEl = document.getElementById('tempChangeDetailModal');
        if (!c || !body || !modalEl) return;

        const dateTxt = (c.startDate === c.endDate) ? c.startDate : `${c.startDate} to ${c.endDate}`;
        body.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="badge bg-warning text-dark">${esc(String(c.changeType || '').replace(/_/g, ' '))}</span>
                <span class="badge ${STATUS_CLASSES[c.status] || 'bg-secondary'}">${esc(c.status)}</span>
            </div>
            <div class="small text-muted mb-2">
                <strong>Section:</strong> <span class="text-white">${esc(c.sectionName)}</span> &bull;
                <strong>Date:</strong> <span class="text-info">${esc(dateTxt)} (${esc(c.dayOfWeek)})</span> &bull;
                <strong>Period:</strong> <span class="text-white">Period ${esc(c.periodNumber)}</span>
            </div>
            <table class="table table-dark table-bordered border-secondary table-sm small mb-2">
                <thead><tr><th>Field</th><th>Permanent (Original)</th><th>Temporary (Updated)</th></tr></thead>
                <tbody>
                    <tr><td>Subject</td><td>${esc(c.originalSubjectName || '-')}</td><td class="text-warning fw-bold">${esc(c.changeType === 'PERIOD_CANCELLATION' ? 'CANCELLED' : (c.updatedSubjectName || c.originalSubjectName || '-'))}</td></tr>
                    <tr><td>Faculty</td><td>${esc(c.originalFacultyName || '-')}</td><td class="text-info fw-bold">${esc(c.replacementFacultyName || c.originalFacultyName || '-')}</td></tr>
                    <tr><td>Classroom / Venue</td><td>${esc(c.originalVenueName || '-')}</td><td class="text-success fw-bold">${esc(c.updatedVenueName || c.originalVenueName || '-')}</td></tr>
                    <tr><td>Timing</td><td>${esc([c.originalStartTime, c.originalEndTime].filter(Boolean).join(' - ') || '-')}</td><td>${esc([c.updatedStartTime || c.originalStartTime, c.updatedEndTime || c.originalEndTime].filter(Boolean).join(' - ') || '-')}</td></tr>
                </tbody>
            </table>
            <div class="small"><strong>Reason:</strong> ${esc(c.reason || '-')}</div>
            ${c.description ? `<div class="small mt-1 text-info"><strong>Announcement:</strong> ${esc(c.description)}</div>` : ''}
            <div class="small text-muted mt-2">Approved By: ${esc(c.approvedBy || '-')} &bull; Permanent timetable remains unchanged.</div>
        `;
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    };

    // Helper called by renderTimetableGrid inside frontend_app.js to overlay date-specific temp slots cleanly
    window.applyEffectiveOverridesToGridDay = function (day, periodsArray) {
        const eff = window._cachedEffectiveTimetable;
        if (!eff || !eff.dayOfWeek || eff.dayOfWeek.toLowerCase() !== String(day || '').toLowerCase()) {
            return periodsArray;
        }
        const clone = periodsArray.slice();
        (eff.slots || []).forEach(slot => {
            const pIdx = Number(slot.periodNumber || 0) - 1;
            if (pIdx >= 0 && pIdx < 7 && slot.isTemporaryOverride) {
                clone[pIdx] = {
                    sub: slot.effectiveSubject || 'FREE',
                    code: slot.effectiveSubjectCode || '',
                    faculty: slot.effectiveFaculty || '-',
                    venue: slot.effectiveVenue || '-',
                    cat: slot.category || 'cat-theory',
                    badgeType: slot.badgeType || 'TEMPORARY CHANGE',
                    tempChange: slot.temporaryChange || null,
                    isTemporaryOverride: true,
                    startTime: slot.startTime,
                    endTime: slot.endTime
                };
            }
        });
        return clone;
    };

    window.renderTempBadgeForCell = function (pData) {
        if (!pData || !pData.isTemporaryOverride || !pData.badgeType) return '';
        const cls = BADGE_CLASSES[pData.badgeType] || 'bg-warning text-dark';
        const cid = pData.tempChange && pData.tempChange.id ? pData.tempChange.id : 0;
        return `<div class="mt-1 d-flex flex-column align-items-center gap-1">
            <span class="badge ${cls}" style="font-size:0.6rem;letter-spacing:0.3px;">${esc(pData.badgeType)}</span>
            ${cid ? `<button type="button" class="btn btn-xs btn-outline-info py-0 px-1" style="font-size:0.58rem;" onclick="event.stopPropagation(); window.showTempChangeDetails(${cid})">View Details</button>` : ''}
        </div>`;
    };

    // =========================================================================
    // EMAIL REGISTRATION & 6-DIGIT OTP VERIFICATION
    // =========================================================================
    window.openEmailVerificationModal = async function (keepAlert = false) {
        const statusBox = document.getElementById('evStatusBox');
        const alertBox = document.getElementById('evAlert');
        const emailInput = document.getElementById('evEmailInput');
        const toggleEl = document.getElementById('evNotifToggle');
        if (alertBox && !keepAlert) alertBox.classList.add('d-none');
        if (statusBox) statusBox.innerHTML = 'Loading subscription status...';

        try {
            const res = await _apiCall('/api/email-subscriptions/me');
            if (!res || !res.ok) throw new Error('Unable to load subscription status.');
            const data = await res.json();
            if (emailInput && data.email) emailInput.value = data.email;
            if (toggleEl) {
                toggleEl.checked = Boolean(data.notificationsEnabled);
                toggleEl.disabled = !data.verified;
            }
            const simNote = data.provider === 'SIMULATED'
                ? `<div class="mt-1 text-info" style="font-size:0.75rem;"><i class="fa-solid fa-circle-info me-1"></i>Real inbox email delivery is not configured on this server (Provider: <strong>SIMULATED</strong>). Admin can enable real inbox emails below in <em>Email Provider Settings (Brevo / SMTP)</em>.</div>`
                : '';
            if (statusBox) {
                if (data.verified) {
                    statusBox.className = 'alert alert-success small py-2 mb-3';
                    statusBox.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i>Verified: <strong>${esc(data.email)}</strong> (${esc(data.notificationsEnabled ? 'Alerts Active' : 'Alerts Paused')}) &bull; Provider: ${esc(data.provider)}${simNote}`;
                } else if (data.registered) {
                    statusBox.className = 'alert alert-warning small py-2 mb-3';
                    statusBox.innerHTML = `<i class="fa-solid fa-hourglass-half me-1"></i>Pending verification for <strong>${esc(data.email)}</strong> (${data.attemptsRemaining} OTP attempts left).${simNote}`;
                } else {
                    statusBox.className = 'alert alert-secondary small py-2 mb-3';
                    statusBox.innerHTML = `<i class="fa-solid fa-envelope me-1"></i>No email verified yet. Register and verify your email with a 6-digit OTP to receive automatic timetable change alerts.${simNote}`;
                }
            }
        } catch (err) {
            if (statusBox) {
                statusBox.className = 'alert alert-danger small py-2 mb-3';
                statusBox.innerText = err.message;
            }
        }
    };

    window.sendEmailOtpRequest = async function () {
        const email = (document.getElementById('evEmailInput')?.value || '').trim();
        const alertBox = document.getElementById('evAlert');
        const btn = document.getElementById('evSendOtpBtn');
        if (!email) return;
        if (btn) btn.disabled = true;
        try {
            const res = await _apiCall('/api/email-subscriptions/send-otp', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send OTP.');
            if (alertBox) {
                alertBox.className = data.simulatedOtp ? 'alert alert-warning small py-2 mb-3' : 'alert alert-info small py-2 mb-3';
                alertBox.innerHTML = `<i class="fa-solid fa-paper-plane me-1"></i>${esc(data.message)}` +
                    (data.simulatedOtp ? ` <span class="badge bg-dark text-warning ms-1 fs-6">${esc(data.simulatedOtp)}</span>` : '');
            }
            window.openEmailVerificationModal(true);
        } catch (err) {
            if (alertBox) {
                alertBox.className = 'alert alert-danger small py-2 mb-3';
                alertBox.innerText = err.message;
            }
        } finally {
            if (btn) btn.disabled = false;
        }
    };

    window.verifyEmailOtpCode = async function () {
        const otp = (document.getElementById('evOtpInput')?.value || '').trim();
        const alertBox = document.getElementById('evAlert');
        try {
            const res = await _apiCall('/api/email-subscriptions/verify-otp', {
                method: 'POST',
                body: JSON.stringify({ otp })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'OTP verification failed.');
            if (alertBox) {
                alertBox.className = 'alert alert-success small py-2 mb-3';
                alertBox.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i>${esc(data.message)}`;
            }
            const otpEl = document.getElementById('evOtpInput');
            if (otpEl) otpEl.value = '';
            window.openEmailVerificationModal(true);
        } catch (err) {
            if (alertBox) {
                alertBox.className = 'alert alert-danger small py-2 mb-3';
                alertBox.innerText = err.message;
            }
        }
    };

    window.toggleEmailSubscriptionAlerts = async function (enabled) {
        const alertBox = document.getElementById('evAlert');
        try {
            const res = await _apiCall('/api/email-subscriptions/toggle', {
                method: 'PUT',
                body: JSON.stringify({ enabled: Boolean(enabled) })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not update toggle.');
            if (alertBox) {
                alertBox.className = 'alert alert-success small py-2 mb-3';
                alertBox.innerText = data.message || 'Updated notification setting.';
            }
            window.openEmailVerificationModal(true);
        } catch (err) {
            if (alertBox) {
                alertBox.className = 'alert alert-danger small py-2 mb-3';
                alertBox.innerText = err.message;
            }
        }
    };

    window.loadAdminEmailProviderConfig = async function (keepAlert = false) {
        const statusEl = document.getElementById('ttcEmailCfgStatus');
        const alertEl = document.getElementById('ttcEmailCfgAlert');
        if (alertEl && !keepAlert) alertEl.classList.add('d-none');
        try {
            const res = await _apiCall('/api/email-subscriptions/admin/config');
            if (!res || !res.ok) return;
            const cfg = await res.json();
            if (document.getElementById('cfgMailProvider')) document.getElementById('cfgMailProvider').value = cfg.configuredMode || 'AUTO';
            if (document.getElementById('cfgMailFromAddr')) document.getElementById('cfgMailFromAddr').value = cfg.fromAddress || '';
            if (document.getElementById('cfgMailFromName')) document.getElementById('cfgMailFromName').value = cfg.fromName || '';
            if (document.getElementById('cfgSmtpHost')) document.getElementById('cfgSmtpHost').value = cfg.smtpHost || '';
            if (document.getElementById('cfgSmtpPort')) document.getElementById('cfgSmtpPort').value = cfg.smtpPort || 587;
            if (document.getElementById('cfgSmtpUser')) document.getElementById('cfgSmtpUser').value = cfg.smtpUsername || '';
            if (statusEl) {
                statusEl.className = cfg.activeProvider === 'SIMULATED' ? 'alert alert-warning small py-2 mb-3' : 'alert alert-success small py-2 mb-3';
                statusEl.innerHTML = `Active Email Provider: <strong>${esc(cfg.activeProvider)}</strong> &bull; Brevo Key: <strong>${cfg.brevoConfigured ? 'Configured' : 'Not Set'}</strong> &bull; SMTP Password: <strong>${cfg.smtpPasswordConfigured ? 'Configured' : 'Not Set'}</strong>`;
            }
        } catch (err) {
            if (statusEl) statusEl.innerText = err.message;
        }
    };

    window.saveAdminEmailProviderConfig = async function () {
        const alertEl = document.getElementById('ttcEmailCfgAlert');
        const payload = {
            provider: document.getElementById('cfgMailProvider')?.value || 'AUTO',
            fromAddress: document.getElementById('cfgMailFromAddr')?.value || '',
            fromName: document.getElementById('cfgMailFromName')?.value || '',
            brevoApiKey: document.getElementById('cfgBrevoKey')?.value || '',
            smtpHost: document.getElementById('cfgSmtpHost')?.value || '',
            smtpPort: document.getElementById('cfgSmtpPort')?.value || 587,
            smtpUsername: document.getElementById('cfgSmtpUser')?.value || '',
            smtpPassword: document.getElementById('cfgSmtpPass')?.value || ''
        };
        try {
            const res = await _apiCall('/api/email-subscriptions/admin/config', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not save email settings.');
            if (document.getElementById('cfgBrevoKey')) document.getElementById('cfgBrevoKey').value = '';
            if (document.getElementById('cfgSmtpPass')) document.getElementById('cfgSmtpPass').value = '';
            if (alertEl) {
                alertEl.className = 'alert alert-success small py-2 mb-3';
                alertEl.innerText = `Saved! Active provider is now: ${data.activeProvider}.`;
            }
            window.loadAdminEmailProviderConfig(true);
        } catch (err) {
            if (alertEl) {
                alertEl.className = 'alert alert-danger small py-2 mb-3';
                alertEl.innerText = err.message;
            }
        }
    };

    window.sendAdminTestEmail = async function () {
        const toEmail = (document.getElementById('cfgTestRecipient')?.value || '').trim();
        const alertEl = document.getElementById('ttcEmailCfgAlert');
        if (!toEmail) { alert('Enter a recipient email to test.'); return; }
        try {
            const res = await _apiCall('/api/email-subscriptions/admin/test-email', {
                method: 'POST',
                body: JSON.stringify({ toEmail })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Test email failed.');
            if (alertEl) {
                const ok = data.status === 'SENT';
                alertEl.className = ok ? 'alert alert-success small py-2 mb-3' : (data.status === 'SIMULATED' ? 'alert alert-warning small py-2 mb-3' : 'alert alert-danger small py-2 mb-3');
                alertEl.innerText = `Result: ${data.status} via ${data.provider}${data.errorMessage ? ' — ' + data.errorMessage : ''}`;
            }
        } catch (err) {
            if (alertEl) {
                alertEl.className = 'alert alert-danger small py-2 mb-3';
                alertEl.innerText = err.message;
            }
        }
    };

    // =========================================================================
    // ADMIN: TEMPORARY TIMETABLE MANAGEMENT MODAL
    // =========================================================================
    async function _loadAdminCatalogDropdowns() {
        try {
            const [deptRes, secRes] = await Promise.all([
                _apiCall('/api/departments'),
                _apiCall('/api/sections')
            ]);
            const depts = deptRes && deptRes.ok ? await deptRes.json() : [];
            const secs = secRes && secRes.ok ? await secRes.json() : [];
            window._ttcDepartments = Array.isArray(depts) ? depts : [];
            window._cachedSectionsList = (Array.isArray(secs) ? secs : []).filter(s => s.sectionName && !/^\d+\s+CSE\s+II\s+CSE/i.test(s.sectionName));

            const deptSel = document.getElementById('ttcDeptSelect');
            if (deptSel) {
                deptSel.innerHTML = '<option value="">All Departments</option>' +
                    window._cachedSectionsList.reduce((acc, s) => {
                        const d = s.course && s.course.department ? s.course.department : null;
                        if (d && !acc.some(x => x.id === d.id)) acc.push(d);
                        return acc;
                    }, [...window._ttcDepartments])
                    .map(d => `<option value="${d.id}">${esc(d.code || d.name)}</option>`).join('');
            }
            window.onTtcDeptChange();

            const filterSec = document.getElementById('ttcFilterSection');
            if (filterSec) {
                filterSec.innerHTML = '<option value="">All Sections</option>' +
                    window._cachedSectionsList.map(s => `<option value="${s.id}">${esc(s.sectionName)}</option>`).join('');
            }
        } catch (e) {
            console.warn('Could not load dept/section dropdowns:', e);
        }
    }

    window.onTtcDeptChange = function () {
        const deptId = document.getElementById('ttcDeptSelect')?.value || '';
        const secSel = document.getElementById('ttcSectionSelect');
        if (!secSel) return;
        const filtered = window._cachedSectionsList.filter(s =>
            !deptId || (s.course && s.course.department && String(s.course.department.id) === String(deptId))
        );
        secSel.innerHTML = filtered.map(s => `<option value="${s.id}">${esc(s.sectionName)}</option>`).join('');
    };

    window.openAdminTempTimetableModal = async function () {
        const sd = document.getElementById('ttcStartDate');
        if (sd && !sd.value) sd.value = todayIsoLocal();
        const ed = document.getElementById('ttcEndDate');
        if (ed && !ed.value) ed.value = todayIsoLocal();
        if (typeof window.refreshTtSuggestionCatalog === 'function') window.refreshTtSuggestionCatalog(false);
        await _loadAdminCatalogDropdowns();
        await window.loadAdminTempTimetableOverview(false);
    };

    window.previewAdminTempSlot = async function () {
        const secSel = document.getElementById('ttcSectionSelect');
        const sectionId = secSel ? secSel.value : '';
        const dateStr = document.getElementById('ttcStartDate')?.value || todayIsoLocal();
        const periodNumber = document.getElementById('ttcPeriodSelect')?.value || '1';
        const box = document.getElementById('ttcSlotPreviewBox');
        if (!sectionId) {
            alert('Select at least one Section to preview its permanent timetable slot.');
            return;
        }
        try {
            const res = await _apiCall(`/api/temp-timetable/admin/preview-slot?sectionId=${encodeURIComponent(sectionId)}&date=${encodeURIComponent(dateStr)}&periodNumber=${encodeURIComponent(periodNumber)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Preview failed');

            const origSub = document.getElementById('ttcOrigSubject');
            const origFac = document.getElementById('ttcOrigFaculty');
            const origVen = document.getElementById('ttcOrigVenue');
            if (origSub && data.originalSubjectName !== 'FREE') origSub.value = data.originalSubjectName || '';
            if (origFac && data.originalFacultyName) origFac.value = data.originalFacultyName || '';
            if (origVen && data.originalVenueName) origVen.value = data.originalVenueName || '';

            if (box) {
                const conflicts = Array.isArray(data.conflictingChanges) ? data.conflictingChanges : [];
                box.classList.remove('d-none');
                box.className = conflicts.length ? 'alert alert-danger small py-2 mb-2' : 'alert alert-info small py-2 mb-2';
                box.innerHTML = `<strong>${esc(data.sectionName)} • ${esc(data.date)} (${esc(data.dayOfWeek)}) • Period ${esc(data.periodNumber)}</strong><br/>
                    Permanent Slot: <strong>${esc(data.originalSubjectName)}</strong> | Staff: ${esc(data.originalFacultyName || '-')} | Venue: ${esc(data.originalVenueName || '-')} (${esc(data.originalStartTime)} - ${esc(data.originalEndTime)})
                    ${conflicts.length ? `<div class="mt-1 fw-bold">Conflict warning: ${conflicts.length} active/pending temporary change(s) already exist for this date &amp; period!</div>` : ''}`;
            }
        } catch (err) {
            if (box) {
                box.className = 'alert alert-danger small py-2 mb-2';
                box.classList.remove('d-none');
                box.innerText = err.message;
            }
        }
    };

    window.resetAdminTempChangeForm = function () {
        const form = document.getElementById('ttcCreateForm');
        if (form) form.reset();
        const editId = document.getElementById('ttcEditId');
        if (editId) editId.value = '';
        const sd = document.getElementById('ttcStartDate');
        if (sd) sd.value = todayIsoLocal();
        const ed = document.getElementById('ttcEndDate');
        if (ed) ed.value = todayIsoLocal();
        const box = document.getElementById('ttcSlotPreviewBox');
        if (box) box.classList.add('d-none');
    };

    window.saveAdminTempChange = async function (publishNow) {
        const alertEl = document.getElementById('ttcGlobalAlert');
        const editId = (document.getElementById('ttcEditId')?.value || '').trim();
        const secSel = document.getElementById('ttcSectionSelect');
        const selectedSecIds = secSel ? Array.from(secSel.selectedOptions).map(o => Number(o.value)).filter(Boolean) : [];
        if (!editId && !selectedSecIds.length) {
            alert('Please select at least one Section.');
            return;
        }
        const reason = (document.getElementById('ttcReason')?.value || '').trim();
        if (!reason) {
            alert('Please enter a reason for this temporary change.');
            return;
        }
        if (publishNow && !confirm('Publish this temporary timetable change and send email notifications to verified students and affected faculty?')) {
            return;
        }

        const multiRaw = (document.getElementById('ttcMultiDates')?.value || '').trim();
        const dates = multiRaw ? multiRaw.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean) : [];

        const payload = {
            changeType: document.getElementById('ttcChangeType')?.value || 'SUBJECT_CHANGE',
            departmentId: document.getElementById('ttcDeptSelect')?.value || null,
            academicYear: document.getElementById('ttcAcademicYear')?.value || '',
            batch: document.getElementById('ttcBatch')?.value || '',
            sectionIds: selectedSecIds,
            startDate: document.getElementById('ttcStartDate')?.value || todayIsoLocal(),
            endDate: document.getElementById('ttcEndDate')?.value || document.getElementById('ttcStartDate')?.value || todayIsoLocal(),
            dates: dates,
            periodNumber: Number(document.getElementById('ttcPeriodSelect')?.value || 1),
            originalSubjectName: document.getElementById('ttcOrigSubject')?.value || '',
            updatedSubjectName: document.getElementById('ttcUpdSubject')?.value || '',
            originalFacultyName: document.getElementById('ttcOrigFaculty')?.value || '',
            replacementFacultyName: document.getElementById('ttcReplFaculty')?.value || '',
            originalVenueName: document.getElementById('ttcOrigVenue')?.value || '',
            updatedVenueName: document.getElementById('ttcUpdVenue')?.value || '',
            updatedStartTime: document.getElementById('ttcUpdStartTime')?.value || '',
            updatedEndTime: document.getElementById('ttcUpdEndTime')?.value || '',
            reason: reason,
            description: document.getElementById('ttcDescription')?.value || '',
            publishNow: Boolean(publishNow)
        };

        try {
            const url = editId ? `/api/temp-timetable/${editId}` : '/api/temp-timetable';
            const method = editId ? 'PUT' : 'POST';
            const res = await _apiCall(url, { method, body: JSON.stringify(payload) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not save temporary timetable change.');

            if (alertEl) {
                alertEl.className = 'alert alert-success small py-2 mb-2';
                alertEl.innerText = editId
                    ? 'Temporary timetable change updated cleanly.'
                    : `Created ${data.createdCount || 1} temporary change(s)${publishNow ? ' & dispatched notifications!' : ' as Draft.'}`;
            }
            window.resetAdminTempChangeForm();
            await window.loadAdminTempTimetableOverview(false);
        } catch (err) {
            if (alertEl) {
                alertEl.className = 'alert alert-danger small py-2 mb-2';
                alertEl.innerText = err.message;
            }
        }
    };

    window.editAdminTempChangeRow = function (id) {
        const c = (window._cachedAdminTtcList || []).find(x => x.id === id);
        if (!c) return;
        document.getElementById('ttcEditId').value = c.id;
        document.getElementById('ttcChangeType').value = c.changeType || 'SUBJECT_CHANGE';
        document.getElementById('ttcAcademicYear').value = c.academicYear || '';
        document.getElementById('ttcBatch').value = c.batch || '';
        document.getElementById('ttcStartDate').value = c.startDate || '';
        document.getElementById('ttcEndDate').value = c.endDate || '';
        document.getElementById('ttcPeriodSelect').value = String(c.periodNumber || 1);
        document.getElementById('ttcOrigSubject').value = c.originalSubjectName || '';
        document.getElementById('ttcUpdSubject').value = c.updatedSubjectName || '';
        document.getElementById('ttcOrigFaculty').value = c.originalFacultyName || '';
        document.getElementById('ttcReplFaculty').value = c.replacementFacultyName || '';
        document.getElementById('ttcOrigVenue').value = c.originalVenueName || '';
        document.getElementById('ttcUpdVenue').value = c.updatedVenueName || '';
        document.getElementById('ttcUpdStartTime').value = c.updatedStartTime || '';
        document.getElementById('ttcUpdEndTime').value = c.updatedEndTime || '';
        document.getElementById('ttcReason').value = c.reason || '';
        document.getElementById('ttcDescription').value = c.description || '';
        const secSel = document.getElementById('ttcSectionSelect');
        if (secSel && c.sectionId) {
            Array.from(secSel.options).forEach(opt => { opt.selected = String(opt.value) === String(c.sectionId); });
        }
        document.getElementById('ttcCreateTabBtn')?.click();
    };

    window.publishAdminTempChangeRow = async function (id) {
        if (!confirm('Publish this temporary change and automatically notify affected verified students & faculty by email?')) return;
        const alertEl = document.getElementById('ttcGlobalAlert');
        try {
            const res = await _apiCall(`/api/temp-timetable/${id}/publish`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Publish failed.');
            if (alertEl) {
                alertEl.className = 'alert alert-success small py-2 mb-2';
                alertEl.innerText = `Published temporary change #${id} & triggered email notifications.`;
            }
            await window.loadAdminTempTimetableOverview(false);
        } catch (err) {
            if (alertEl) {
                alertEl.className = 'alert alert-danger small py-2 mb-2';
                alertEl.innerText = err.message;
            }
        }
    };

    window.cancelAdminTempChangeRow = async function (id) {
        const note = prompt('Confirm cancellation of temporary change #' + id + '. Optional cancellation reason:', 'Schedule restored');
        if (note === null) return;
        const alertEl = document.getElementById('ttcGlobalAlert');
        try {
            const res = await _apiCall(`/api/temp-timetable/${id}/cancel`, {
                method: 'POST',
                body: JSON.stringify({ reason: note })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Cancel failed.');
            if (alertEl) {
                alertEl.className = 'alert alert-warning small py-2 mb-2';
                alertEl.innerText = `Cancelled change #${id}. Permanent timetable restored.`;
            }
            await window.loadAdminTempTimetableOverview(false);
        } catch (err) {
            if (alertEl) {
                alertEl.className = 'alert alert-danger small py-2 mb-2';
                alertEl.innerText = err.message;
            }
        }
    };

    window.rejectAdminTempChangeRow = async function (id) {
        const note = prompt('Optional reason for rejecting request #' + id + ':', 'Conflict / not approved');
        if (note === null) return;
        await _apiCall(`/api/temp-timetable/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason: note }) });
        await window.loadAdminTempTimetableOverview(false);
    };

    window.deleteAdminTempChangeRow = async function (id) {
        if (!confirm(`Permanently delete temporary change #${id}?`)) return;
        const alertEl = document.getElementById('ttcGlobalAlert');
        try {
            const res = await _apiCall(`/api/temp-timetable/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed.');
            if (alertEl) {
                alertEl.className = 'alert alert-success small py-2 mb-2';
                alertEl.innerText = `Deleted change #${id}.`;
            }
            await window.loadAdminTempTimetableOverview(false);
        } catch (err) {
            if (alertEl) {
                alertEl.className = 'alert alert-danger small py-2 mb-2';
                alertEl.innerText = err.message;
            }
        }
    };

    window.loadAdminTempTimetableOverview = async function (resetFilters) {
        if (resetFilters) {
            const b = document.getElementById('ttcFilterBucket'); if (b) b.value = 'ALL';
            const s = document.getElementById('ttcFilterSection'); if (s) s.value = '';
            const d = document.getElementById('ttcFilterDate'); if (d) d.value = '';
            const t = document.getElementById('ttcFilterType'); if (t) t.value = '';
            const f = document.getElementById('ttcFilterFaculty'); if (f) f.value = '';
        }

        const params = new URLSearchParams();
        const secId = document.getElementById('ttcFilterSection')?.value || '';
        const dateVal = document.getElementById('ttcFilterDate')?.value || '';
        const typeVal = document.getElementById('ttcFilterType')?.value || '';
        const facVal = document.getElementById('ttcFilterFaculty')?.value || '';
        const bucket = document.getElementById('ttcFilterBucket')?.value || 'ALL';
        if (secId) params.set('sectionId', secId);
        if (dateVal) params.set('date', dateVal);
        if (typeVal) params.set('changeType', typeVal);
        if (facVal) params.set('faculty', facVal);
        if (['DRAFT', 'PENDING_APPROVAL', 'CANCELLED', 'EXPIRED'].includes(bucket)) params.set('status', bucket);

        try {
            const res = await _apiCall(`/api/temp-timetable/admin/overview?${params.toString()}`);
            if (!res || !res.ok) return;
            const data = await res.json();
            const st = data.stats || {};
            const todayStr = st.collegeDate || todayIsoLocal();

            const statsRow = document.getElementById('ttcStatsRow');
            if (statsRow) {
                const card = (lbl, val, cls) => `<div class="col-6 col-md-3 col-lg">
                    <div class="p-2 rounded border border-secondary bg-black bg-opacity-50 text-center">
                        <div class="small text-muted" style="font-size:0.68rem;">${lbl}</div>
                        <div class="fw-bold fs-6 ${cls}">${val ?? 0}</div>
                    </div></div>`;
                statsRow.innerHTML =
                    card('Total', st.total, 'text-white') +
                    card('Today', st.today, 'text-warning') +
                    card('Upcoming', st.upcoming, 'text-info') +
                    card('Published', st.published, 'text-success') +
                    card('Pending Req', st.pendingApproval, 'text-warning') +
                    card('Cancelled', st.cancelled, 'text-danger') +
                    card('Emails Sent', st.emailsSent, 'text-success') +
                    card('Failed', st.emailsFailed, 'text-danger');
            }

            let list = Array.isArray(data.changes) ? data.changes : [];
            window._cachedAdminTtcList = list;
            if (bucket === 'ACTIVE') {
                list = list.filter(c => c.status === 'PUBLISHED' && c.startDate <= todayStr && c.endDate >= todayStr);
            } else if (bucket === 'UPCOMING') {
                list = list.filter(c => c.status === 'PUBLISHED' && c.endDate > todayStr);
            }

            const tbody = document.getElementById('ttcManageTableBody');
            if (tbody) {
                tbody.innerHTML = list.length ? list.map(c => {
                    const dates = (c.startDate === c.endDate) ? c.startDate : `${c.startDate} .. ${c.endDate}`;
                    const stCls = STATUS_CLASSES[c.status] || 'bg-secondary';
                    const canPublish = c.status === 'DRAFT' || c.status === 'PENDING_APPROVAL';
                    const canEdit = c.status === 'DRAFT' || c.status === 'PENDING_APPROVAL' || c.status === 'PUBLISHED';
                    const canCancel = c.status === 'PUBLISHED' || c.status === 'DRAFT' || c.status === 'PENDING_APPROVAL';
                    return `<tr>
                        <td><strong>${esc(dates)}</strong><br/><small class="text-muted">${esc(c.dayOfWeek)}</small></td>
                        <td>${esc(c.sectionName)}</td>
                        <td class="text-center fw-bold">P${esc(c.periodNumber)}</td>
                        <td><span class="badge bg-info text-dark">${esc(String(c.changeType || '').replace(/_/g, ' '))}</span></td>
                        <td>
                            <span class="text-muted">${esc(c.originalSubjectName || '-')} (${esc(c.originalFacultyName || '-')})</span><br/>
                            <span class="text-warning">${esc(c.changeType === 'PERIOD_CANCELLATION' ? 'CANCELLED' : (c.updatedSubjectName || c.originalSubjectName || '-'))} (${esc(c.replacementFacultyName || c.originalFacultyName || '-')}, ${esc(c.updatedVenueName || c.originalVenueName || '-')})</span>
                        </td>
                        <td><span class="badge ${stCls}">${esc(c.status)}</span></td>
                        <td>
                            <div class="d-flex flex-wrap gap-1">
                                <button type="button" class="btn btn-xs btn-outline-info py-0 px-1" onclick="window.showTempChangeDetails(${c.id})" title="Details"><i class="fa-solid fa-eye"></i></button>
                                ${canEdit ? `<button type="button" class="btn btn-xs btn-outline-light py-0 px-1" onclick="window.editAdminTempChangeRow(${c.id})" title="Edit"><i class="fa-solid fa-pen"></i></button>` : ''}
                                ${canPublish ? `<button type="button" class="btn btn-xs btn-outline-success py-0 px-1" onclick="window.publishAdminTempChangeRow(${c.id})" title="Publish"><i class="fa-solid fa-check"></i></button>` : ''}
                                ${c.status === 'PENDING_APPROVAL' ? `<button type="button" class="btn btn-xs btn-outline-danger py-0 px-1" onclick="window.rejectAdminTempChangeRow(${c.id})" title="Reject"><i class="fa-solid fa-ban"></i></button>` : ''}
                                ${canCancel ? `<button type="button" class="btn btn-xs btn-outline-warning py-0 px-1" onclick="window.cancelAdminTempChangeRow(${c.id})" title="Cancel"><i class="fa-solid fa-xmark"></i></button>` : ''}
                                ${c.status !== 'PUBLISHED' ? `<button type="button" class="btn btn-xs btn-outline-danger py-0 px-1" onclick="window.deleteAdminTempChangeRow(${c.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>` : ''}
                            </div>
                        </td>
                    </tr>`;
                }).join('') : '<tr><td colspan="7" class="text-center text-muted py-3">No matching temporary timetable changes.</td></tr>';
            }

            const emailBody = document.getElementById('ttcEmailLogsBody');
            if (emailBody) {
                const logs = Array.isArray(data.emailLogs) ? data.emailLogs : [];
                emailBody.innerHTML = logs.length ? logs.map(l => `<tr>
                    <td>${esc(l.recipientName)}</td>
                    <td><span class="badge bg-secondary">${esc(l.recipientRole)}</span></td>
                    <td>${esc(l.email)}</td>
                    <td>${esc(l.eventType)}</td>
                    <td><span class="badge ${l.notificationStatus === 'FAILED' ? 'bg-danger' : (l.notificationStatus === 'SENT' ? 'bg-success' : 'bg-info text-dark')}">${esc(l.notificationStatus)}</span></td>
                    <td>${esc(l.provider)}</td>
                    <td><small class="text-muted">${esc(l.sentAt)}</small>${l.errorMessage ? `<br/><small class="text-danger">${esc(l.errorMessage)}</small>` : ''}</td>
                </tr>`).join('') : '<tr><td colspan="7" class="text-center text-muted py-2">No email notifications recorded yet.</td></tr>';
            }

            const auditBody = document.getElementById('ttcAuditLogsBody');
            if (auditBody) {
                const audits = Array.isArray(data.auditLogs) ? data.auditLogs : [];
                auditBody.innerHTML = audits.length ? audits.map(a => `<tr>
                    <td><span class="badge bg-info text-dark">${esc(a.actionType)}</span></td>
                    <td>${esc(a.sectionName)}</td>
                    <td>${esc(a.actorUsername)}</td>
                    <td>${esc(a.details)}</td>
                    <td><small class="text-muted">${esc(a.createdAt)}</small></td>
                </tr>`).join('') : '<tr><td colspan="5" class="text-center text-muted py-2">No audit activity yet.</td></tr>';
            }
        } catch (err) {
            console.warn('Error loading admin temp TT overview:', err);
        }
    };

    // =========================================================================
    // FACULTY DASHBOARD: EFFECTIVE DATE TIMETABLE + SUBSTITUTION REQUESTS
    // =========================================================================
    window.resetFacultyEffectiveDate = function () {
        const el = document.getElementById('facEffDatePicker');
        if (el) el.value = todayIsoLocal();
        window.loadFacultyEffectiveTempView();
    };

    window.openFacultyTempChangesModal = async function () {
        const dp = document.getElementById('facEffDatePicker');
        if (dp && !dp.value) dp.value = todayIsoLocal();
        const rp = document.getElementById('facReqDate');
        if (rp && !rp.value) rp.value = todayIsoLocal();

        try {
            const secRes = await _apiCall('/api/sections');
            if (secRes && secRes.ok) {
                const secs = (await secRes.json()).filter(s => s.sectionName && !/^\d+\s+CSE\s+II\s+CSE/i.test(s.sectionName));
                const sel = document.getElementById('facReqSectionSelect');
                if (sel) sel.innerHTML = secs.map(s => `<option value="${s.id}">${esc(s.sectionName)}</option>`).join('');
            }
        } catch (_) {}
        await window.loadFacultyEffectiveTempView();
    };

    window.loadFacultyEffectiveTempView = async function () {
        const dateStr = document.getElementById('facEffDatePicker')?.value || todayIsoLocal();
        const slotsBody = document.getElementById('facEffSlotsBody');
        const histBody = document.getElementById('facTempHistoryBody');
        const metaEl = document.getElementById('facEffDateMeta');
        try {
            const res = await _apiCall(`/api/temp-timetable/faculty/effective?date=${encodeURIComponent(dateStr)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not load faculty schedule.');

            if (metaEl) metaEl.innerText = `${data.facultyName || 'Faculty'} • ${data.dayOfWeek || ''} (${data.date})`;
            window._tempUpdatesLookup = window._tempUpdatesLookup || {};
            const slots = Array.isArray(data.slots) ? data.slots : [];
            slots.forEach(s => { if (s.temporaryChange) window._tempUpdatesLookup[s.temporaryChange.id] = s.temporaryChange; });

            if (slotsBody) {
                slotsBody.innerHTML = slots.length ? slots.map(s => {
                    const cls = BADGE_CLASSES[s.badgeType] || 'bg-secondary';
                    const cid = s.temporaryChange && s.temporaryChange.id ? s.temporaryChange.id : 0;
                    return `<tr>
                        <td class="fw-bold">P${esc(s.periodNumber)}</td>
                        <td>${esc(s.startTime)} - ${esc(s.endTime)}</td>
                        <td>${esc(s.sectionName)}</td>
                        <td>${esc(s.effectiveSubject)}</td>
                        <td>${esc(s.effectiveVenue)}</td>
                        <td><span class="badge ${cls}">${esc(s.badgeType)}</span> <small class="text-muted">${esc(s.facultyInvolvement || '')}</small></td>
                        <td>${cid ? `<button type="button" class="btn btn-xs btn-outline-info py-0 px-2" onclick="window.showTempChangeDetails(${cid})">Details</button>` : '-'}</td>
                    </tr>`;
                }).join('') : '<tr><td colspan="7" class="text-center text-muted py-3">No scheduled classes or temporary assignments on this date.</td></tr>';
            }

            if (histBody) {
                const changes = Array.isArray(data.changes) ? data.changes : [];
                histBody.innerHTML = changes.length ? changes.map(c => `<tr>
                    <td>${esc(c.startDate === c.endDate ? c.startDate : `${c.startDate}..${c.endDate}`)}</td>
                    <td>${esc(c.sectionName)}</td>
                    <td>P${esc(c.periodNumber)}</td>
                    <td><span class="badge bg-info text-dark">${esc(String(c.changeType || '').replace(/_/g, ' '))}</span></td>
                    <td>${esc(c.originalFacultyName || '-')} &rarr; ${esc(c.replacementFacultyName || '-')} (${esc(c.reason)})</td>
                    <td><span class="badge ${STATUS_CLASSES[c.status] || 'bg-secondary'}">${esc(c.status)}</span></td>
                </tr>`).join('') : '<tr><td colspan="6" class="text-center text-muted py-2">No temporary change records involving you yet.</td></tr>';
            }
        } catch (err) {
            if (slotsBody) slotsBody.innerHTML = `<tr><td colspan="7" class="text-danger text-center py-2">${esc(err.message)}</td></tr>`;
        }
    };

    window.submitFacultyTempChangeRequest = async function () {
        const alertEl = document.getElementById('facReqAlert');
        const payload = {
            changeType: document.getElementById('facReqType')?.value || 'FACULTY_SUBSTITUTION',
            sectionId: document.getElementById('facReqSectionSelect')?.value,
            startDate: document.getElementById('facReqDate')?.value || todayIsoLocal(),
            endDate: document.getElementById('facReqDate')?.value || todayIsoLocal(),
            periodNumber: Number(document.getElementById('facReqPeriod')?.value || 1),
            replacementFacultyName: document.getElementById('facReqReplFaculty')?.value || '',
            updatedVenueName: document.getElementById('facReqVenue')?.value || '',
            reason: document.getElementById('facReqReason')?.value || ''
        };
        try {
            const res = await _apiCall('/api/temp-timetable/faculty-request', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed.');
            if (alertEl) {
                alertEl.className = 'alert alert-success small py-2 mb-2';
                alertEl.innerText = data.message || 'Submitted request for Admin approval.';
            }
            document.getElementById('facTempRequestForm')?.reset();
            await window.loadFacultyEffectiveTempView();
        } catch (err) {
            if (alertEl) {
                alertEl.className = 'alert alert-danger small py-2 mb-2';
                alertEl.innerText = err.message;
            }
        }
    };
})();
