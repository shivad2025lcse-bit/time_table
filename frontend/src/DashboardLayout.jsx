import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./index.css";

export default function DashboardLayout() {
    const location = useLocation();
    const isLoginPage = location.pathname === "/login" || location.pathname === "/";
    const isAdmin = location.pathname === "/admin";
    const isStudent = location.pathname === "/student";
    const isFaculty = location.pathname === "/faculty";
    useEffect(() => {
        // Guard against double-injection: React 19 StrictMode double-fires
        // effects in dev, and every route ("/login", "/admin", "/faculty",
        // "/student") mounts this same component, so without this flag these
        // legacy scripts (which declare top-level let/const globals) get
        // re-executed and throw "Identifier has already been declared",
        // which silently breaks every window.* handler used below.
        if (window.__seceLegacyScriptsLoaded) {
            return;
        }
        window.__seceLegacyScriptsLoaded = true;

        const scripts = ["/js/theme.js", "/js/app.js", "/js/timetable.js", "/js/frontend_app.js", "/js/charts.js", "/js/reports.js"];
        scripts.forEach(src => {
            const script = document.createElement("script");
            script.src = src + '?v=' + new Date().getTime();
            script.async = false;
            document.body.appendChild(script);
        });
    }, []);

    useEffect(() => {
        // When the React route changes, wait for DOM update and then trigger legacy rendering scripts
        const timer = setTimeout(() => {
            if (window.renderStaffAvailability) window.renderStaffAvailability();
            if (window.renderEnrolledStudentsRoster) window.renderEnrolledStudentsRoster();

            // For student route: re-apply login session so timetable loads for the correct section
            if (location.pathname === '/student') {
                if (typeof window.restoreLoginSession === 'function') {
                    window.restoreLoginSession();
                } else if (typeof window.switchRole === 'function') {
                    const role = localStorage.getItem('sece_logged_in_role') || 'STUDENT';
                    window.switchRole(role, true);
                }
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <>



            <section id="loginScreen" style={{ display: isLoginPage ? "flex" : "none" }}>
                <div className="login-shell">
                    <div className="login-brand">
                        <img src="/images/sece-logo.png" alt="SECE Logo" style={{ width: "45px", height: "45px", objectFit: "contain" }} />
                        <h1 className="h3 fw-bold text-white mb-2">SRI ESHWAR COLLEGE OF ENGINEERING</h1>
                        <p className="text-muted mb-0">Smart Class & Timetable Scheduler</p>
                    </div>


                    <div id="roleSelection">
                        <div className="text-center mb-3">
                            <h2 className="h5 text-white fw-bold">Select Login Type</h2>
                            <p className="small text-muted">Choose your account before entering your credentials.</p>
                        </div>
                        <div className="login-role-grid">
                            <div className="login-role-card student" onClick={() => window.openLoginForm('STUDENT')} >
                                <div className="login-role-icon"><i className="fa-solid fa-user-graduate"></i></div>
                                <h3 className="h5 text-white">Student Login</h3>
                                <p className="small text-muted">View timetable and student notifications</p>
                                <button className="btn btn-success w-100">Continue as Student</button>
                            </div>
                            <div className="login-role-card faculty" onClick={() => window.openLoginForm('FACULTY')} >
                                <div className="login-role-icon"><i className="fa-solid fa-chalkboard-user"></i></div>
                                <h3 className="h5 text-white">Faculty Login</h3>
                                <p className="small text-muted">Manage periods for assigned classes</p>
                                <button className="btn btn-warning w-100">Continue as Faculty</button>
                            </div>
                            <div className="login-role-card admin" onClick={() => window.openLoginForm('ADMIN')} >
                                <div className="login-role-icon"><i className="fa-solid fa-user-shield"></i></div>
                                <h3 className="h5 text-white">Admin Login</h3>
                                <p className="small text-muted">Full timetable, student and section control</p>
                                <button className="btn btn-danger w-100">Continue as Admin</button>
                            </div>
                        </div>
                        <div className="text-center mt-4">
                            <button type="button" className="btn btn-outline-info rounded-pill px-4" onClick={() => window.openShareAppModal && window.openShareAppModal()}>
                                <i className="fa-solid fa-share-nodes me-2"></i> Share App
                            </button>
                        </div>
                    </div>


                    <div id="loginFormPanel" className="login-form-card login-hidden">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <button type="button" className="btn btn-sm btn-outline-light login-back" onClick={() => window.backToRoleSelection()} >
                                <i className="fa-solid fa-arrow-left me-1"></i> Back
                            </button>
                            <span id="loginRoleBadge" className="badge bg-primary">STUDENT</span>
                        </div>

                        <div className="text-center mb-4">
                            <div id="loginIcon" className="login-role-icon">
                                <i className="fa-solid fa-user-graduate"></i>
                            </div>
                            <h2 id="loginTitle" className="h4 fw-bold text-white">Student Login</h2>
                            <p id="loginHint" className="small text-muted mb-0">Username = role letter + first 4 letters of first name + last-name initial + 012345</p>
                        </div>

                        <form id="roleLoginForm" onSubmit={(event) => window.handleRoleLogin && window.handleRoleLogin(event)} >
                            <input type="hidden" id="selectedLoginRole" defaultValue="STUDENT" />

                            <div className="mb-3">
                                <label className="form-label small text-white fw-semibold">Username</label>
                                <input type="text" id="loginUsername"
                                    className="form-control bg-dark text-white border-secondary"
                                    autoComplete="username" pattern="[a-zA-Z0-9]+"
                                    onInput={(e) => e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '')} required />
                                <div id="usernameRule" className="form-text text-muted">
                                    Example: sarjuk23 — letters and numbers only
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small text-white fw-semibold">Password</label>
                                <div className="password-wrap">
                                    <input type="password" id="loginPassword"
                                        className="form-control bg-dark text-white border-secondary pe-5"
                                        autoComplete="current-password" pattern="[a-zA-Z0-9]+"
                                        onInput={(e) => e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '')} required />
                                    <button type="button" className="toggle-password" onClick={() => window.toggleLoginPassword()} >
                                        <i className="fa-solid fa-eye" id="loginPasswordEye"></i>
                                    </button>
                                </div>
                                <div className="form-text text-muted">Enter your password. For new accounts use your Register Number as username and <code>student123</code> as password.</div>
                            </div>

                            <button type="submit" id="roleLoginBtn" className="btn btn-primary w-100 fw-bold">
                                <i className="fa-solid fa-right-to-bracket me-1"></i> Login
                            </button>

                            <button type="button" className="btn btn-link text-warning w-100 mt-2"
                                onClick={() => window.openForgotPasswordForLogin()} >
                                <i className="fa-solid fa-key me-1"></i> Forgot Password?
                            </button>
                        </form>
                    </div>
                </div>
            </section>



            <div id="applicationShell" style={{ display: isLoginPage ? "none" : "block" }}>
                <header className="inst-header no-print">
                    <div className="container-fluid px-4">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-3">
                                <img src="/images/sece-logo.png" alt="SECE Logo" style={{ width: "45px", height: "45px", objectFit: "contain" }} />
                                <div>
                                    <h1 className="h5 mb-0 fw-bold text-white tracking-tight">SRI ESHWAR COLLEGE OF ENGINEERING</h1>
                                    <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">

                                    </div>
                                </div>
                            </div>


                            <div className="d-flex align-items-center gap-2 flex-wrap">

                                <div className="d-flex align-items-center gap-2 border border-secondary rounded px-2 py-1 bg-dark">
                                    <i className="fa-solid fa-user-shield text-info"></i>
                                    <span id="currentRoleLabel" className="text-white small">Role: ADMIN</span>
                                    <small id="loggedInUsernameLabel" className="text-muted ms-1"></small>
                                </div>

                                <button className="btn btn-sm btn-info d-flex align-items-center gap-1" type="button" data-bs-toggle="modal" data-bs-target="#adminAbsentNotifModal" onClick={() => window.renderAdminLeaveNotifications?.()}>
                                    <i className="fa-solid fa-bell"></i> Notifications
                                </button>

                                <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                                    type="button" onClick={() => window.logoutUser()} >
                                    <i className="fa-solid fa-right-from-bracket"></i> Logout
                                </button>


                                <button className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1" data-bs-toggle="modal" data-bs-target="#forgotPasswordModal">
                                    <i className="fa-solid fa-key"></i> Forgot Password
                                </button>


                                <button id="themeToggleBtn" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => window.toggleTheme()} >
                                    <i className="fa-solid fa-moon" id="themeIcon"></i> Theme
                                </button>

                                {!isAdmin && (
                                    <button id="notifBellBtn" className="btn btn-sm btn-outline-info d-flex align-items-center gap-1" style={{ display: "none" }} onClick={() => window.openNotificationModal()} >
                                        <i className="fa-solid fa-bell text-warning"></i> <span id="notifBellLabel">Register SMS / Email Alerts</span>
                                    </button>
                                )}




                                <button id="manageStudentsBtn" className="btn btn-sm btn-outline-info d-flex align-items-center gap-1"
                                    type="button" data-bs-toggle="modal" data-bs-target="#manageStudentsModal" style={{ display: "none" }}>
                                    <i className="fa-solid fa-users"></i> <span id="manageStudentsBtnText">Add Students</span>
                                </button>

                                <button id="manageFacultyBtn" className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
                                    type="button" data-bs-toggle="modal" data-bs-target="#manageFacultyModal" style={{ display: "none" }}>
                                    <i className="fa-solid fa-chalkboard-user"></i> Add Faculty
                                </button>

                                <button id="manageAnnouncementsBtn" className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 d-none"
                                    type="button" data-bs-toggle="modal" data-bs-target="#manageAnnouncementsModal" onClick={() => window.renderManageAnnouncementsList && window.renderManageAnnouncementsList()}>
                                    <i className="fa-solid fa-bullhorn"></i> Manage Announcements
                                </button>

                                <button id="adminViewFacultyBtn" className="btn btn-sm btn-outline-info align-items-center gap-1 d-none" type="button" data-bs-toggle="modal" data-bs-target="#adminViewFacultyModal">
                                    <i className="fa-solid fa-address-card"></i> View Full Faculty Details
                                </button>


                                <button id="studentProfileBtn" className="btn btn-sm btn-outline-success align-items-center gap-1 d-none" type="button" onClick={() => window.openStudentProfileModal()} >
                                    <i className="fa-solid fa-id-card"></i> My Student Details
                                </button>

                                <button id="manageSectionsBtn" className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1 style-btn" data-bs-toggle="modal" data-bs-target="#manageSectionsModal" onClick={() => window.renderSectionsList && window.renderSectionsList()}>
                                    <i className="fa-solid fa-folder-tree"></i> <span id="manageSectionsBtnText">Manage Sections</span>
                                </button>
                                <button id="manageRosterBtn" className="btn btn-sm btn-indigo d-flex align-items-center gap-1  style-btn" style={{ background: "var(--sece-indigo)" }} data-bs-toggle="modal" data-bs-target="#manageRosterModal">
                                    <i className="fa-solid fa-users-gear"></i> <span id="manageRosterBtnText">Manage Students Roster</span>
                                </button>
                                {!isAdmin && (
                                    <button id="addStudentDirectBtn" className="btn btn-sm btn-success d-none align-items-center gap-1 style-btn" type="button" onClick={() => window.openAddStudentDirectly()} >
                                        <i className="fa-solid fa-user-plus"></i> <span id="addStudentDirectBtnText">Add New Student</span>
                                    </button>
                                )}

                                <button id="classAdvisorBtn" className="btn btn-sm btn-outline-warning d-none align-items-center gap-1" type="button" data-bs-toggle="modal" data-bs-target="#classAdvisorLoginModal">
                                    <i className="fa-solid fa-user-tie"></i> Class Advisor View
                                </button>

                                <button id="facultyDetailsBtn" className="btn btn-sm btn-outline-primary d-none align-items-center gap-1" type="button" data-bs-toggle="modal" data-bs-target="#facultyDetailsModal">
                                    <i className="fa-solid fa-chalkboard-user"></i> Faculty Details
                                </button>

                                <button id="studentDayNotificationBtn" className="btn btn-sm btn-outline-info align-items-center gap-1 d-none" type="button" data-bs-toggle="modal" data-bs-target="#studentDayNotificationModal"><i className="fa-solid fa-bell"></i> Period Notifications</button>


                                {(!isAdmin && !isStudent) && (
                                    <button id="substitutionBtn" className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1" data-bs-toggle="modal" data-bs-target="#substitutionModal">
                                        <i className="fa-solid fa-people-arrows"></i> Staff Availability / Substitution
                                    </button>
                                )}

                                {(!isAdmin && !isStudent) && (
                                    <button id="myTimetableBtn" className="btn btn-sm btn-outline-info d-flex align-items-center gap-1 style-btn" data-bs-toggle="modal" data-bs-target="#myTimetableModal" onClick={() => window.renderMyTimetable && window.renderMyTimetable()}>
                                        <i className="fa-solid fa-calendar-user"></i> YOUR TIMETABLE
                                    </button>
                                )}

                                <div className="dropdown">
                                    <button className="btn btn-sm btn-success dropdown-toggle fw-bold d-flex align-items-center gap-1" type="button" id="downloadDropdown" data-bs-toggle="dropdown">
                                        <i className="fa-solid fa-download"></i> DOWNLOAD TT
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
                                        <li><h6 className="dropdown-header"><i className="fa-solid fa-file-arrow-down me-1"></i> Export Options</h6></li>
                                        <li><a className="dropdown-item" href="#" onClick={() => window.downloadTimetablePNG()} ><i className="fa-solid fa-file-image me-2 text-info"></i> Download PNG Image</a></li>
                                        <li><a className="dropdown-item" href="#" onClick={() => window.exportTimetableCSV()} ><i className="fa-solid fa-file-csv me-2 text-success"></i> Download CSV Spreadsheet</a></li>
                                        <li><a className="dropdown-item" href="#" onClick={() => window.print()} ><i className="fa-solid fa-file-pdf me-2 text-danger"></i> Print / Save as PDF</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div id="announcementTickerContainer" className="w-100 bg-success text-white py-1 marquee-l2r-container" style={{ borderBottom: "2px solid #198754" }}>
                    <div id="announcementMarquee" className="marquee-l2r-content mb-0 fw-bold fs-6" style={{ letterSpacing: "0.5px" }}></div>
                </div>


                <main className="container-fluid px-4 py-3">


                    {!isAdmin && (
                        <div className="glass-panel p-3 mb-3">
                            <div className="row g-3 align-items-center">

                                {location.pathname === "/faculty" && (
                                    <>
                                        <div className="col-md-3 col-sm-6" id="deptFilterWrapper">
                                            <label className="form-label text-muted fw-semibold small mb-1"><i className="fa-solid fa-building-columns text-primary me-1"></i> Department</label>
                                            <select id="deptSelect" defaultValue="" className="form-select form-select-sm bg-dark text-white border-secondary" onChange={() => { window.populateSectionSelects?.(); window.onFilterChange?.(); }} >
                                                <option value="">-- Select Department --</option>
                                                <option value="CSE">CSE - Computer Science & Engg</option>
                                                <option value="IT">IT - Information Technology</option>
                                                <option value="AIDS">AI&DS - Artificial Intelligence & Data Science</option>
                                                <option value="ECE">ECE - Electronics & Comm Engg</option>
                                                <option value="EEE">EEE - Electrical & Electronics Engg</option>
                                                <option value="MECH">MECH - Mechanical Engineering</option>
                                                <option value="CIVIL">CIVIL - Civil Engineering</option>
                                                <option value="CSD">CSD - Computer Science & Design</option>
                                            </select>
                                        </div>


                                        <div className="col-md-2 col-sm-6" id="secFilterWrapper">
                                            <label className="form-label text-muted fw-semibold small mb-1"><i className="fa-solid fa-layer-group text-info me-1"></i> Section</label>
                                            <select id="sectionSelect" defaultValue="" className="form-select form-select-sm bg-dark text-white border-secondary" onChange={() => { window.onFilterChange?.(); }} >
                                                <option value="CSE_C">II CSE C [SF 04]</option>
                                                <option value="CSE_A">II CSE A [SF 02]</option>
                                                <option value="CSE_B">II CSE B [SF 03]</option>
                                                <option value="IT_A">II IT A [IT 101]</option>
                                                <option value="AIDS_A">II AI&DS A [AI 201]</option>
                                                <option value="ECE_A">II ECE A [EC 301]</option>
                                            </select>
                                        </div>
                                        
                                        <div className="col-md-2 col-sm-6 d-flex align-items-end" id="adminSubmitFilterWrapper">
                                            <button className="btn btn-sm btn-success w-100 fw-bold" onClick={() => { window.onFilterChange?.(); window.showTtPopup?.(); }}><i className="fa-solid fa-check-circle me-1"></i> Submit</button>
                                        </div>
                                    </>
                                )}

                                <div className="col-md-7 d-flex justify-content-md-end justify-content-start flex-wrap align-items-center gap-4 text-light" style={{ fontSize: "1rem" }}>
                                    <div id="bannerBatchRow" className="d-flex align-items-center gap-2">
                                        <strong className="text-muted"><i className="fa-solid fa-calendar-check text-info me-1"></i> Batch:</strong>
                                        <span id="batchTextHeader" className="badge bg-primary">2024 - 2028</span>
                                        <i id="batchEditIcon" className="fa-solid fa-pencil text-muted ms-2 d-none" style={{ cursor: "pointer", fontSize: "0.8rem" }} title="Edit Batch"></i>
                                    </div>
                                    <div id="bannerSemRow" className="d-flex align-items-center gap-2">
                                        <strong className="text-muted"><i className="fa-solid fa-book-open text-warning me-1"></i> Semester:</strong>
                                        <span id="semTextHeader" className="badge bg-secondary">II Year / III Semester</span>
                                        <i id="semEditIcon" className="fa-solid fa-pencil text-muted ms-2 d-none" style={{ cursor: "pointer", fontSize: "0.8rem" }} title="Edit Semester"></i>
                                    </div>
                                    <div className="d-flex align-items-center gap-2" id="bannerAyRow">
                                        <strong className="text-muted"><i className="fa-solid fa-calendar-days text-success me-1"></i> Academic Year:</strong>
                                        <span id="ayTextHeader" className="fw-bold">2026 - 2027</span>
                                        <i id="ayEditIcon" className="fa-solid fa-pencil text-muted ms-2 d-none" style={{ cursor: "pointer", fontSize: "0.8rem" }} title="Edit Academic Year"></i>
                                    </div>
                                    <div id="studentAdvisorBannerRow" className="d-none align-items-center gap-2">
                                        <strong className="text-muted"><i className="fa-solid fa-user-tie text-danger me-1"></i> Advisor:</strong>
                                        <span id="studentAdvisorNameBanner" className="fw-bold text-warning"></span>
                                        <span id="studentAdvisorPhoneBanner" className="badge bg-dark border border-secondary text-light"></span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <strong className="text-muted"><i className="fa-solid fa-users text-primary me-1"></i> Class Strength:</strong>
                                        <span className="badge bg-success" id="classStrengthBadge">61 Students</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <strong className="text-muted"><i className="fa-solid fa-user-tie text-danger me-1"></i> Class Advisor:</strong>
                                        <span className="text-warning fw-bold" id="classAdvisorLabel">Ms.J.Keerthika, AP/CSE</span>
                                    </div>
                                    <div id="classTutorsRow" className="d-none align-items-center gap-2">
                                        <strong className="text-muted"><i className="fa-solid fa-chalkboard-user text-info me-1"></i> Class Tutors:</strong>
                                        <span className="text-light" id="classTutorsLabel"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                            <div id="roleBanner" className="alert alert-info py-2 px-3 border-0 rounded-3 d-flex align-items-center justify-content-between mb-3 shadow-sm">
                                <div id="roleBannerTextContainer">
                                    <i className="fa-solid fa-shield-halved me-2"></i>
                                    <span id="roleBannerText">Logged in as <strong>ADMIN</strong>. Click on any period cell in the grid to edit schedule, swap slots, or assign Placement ALT.</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <button id="quickAssignBtn" className="btn btn-sm btn-outline-dark py-0 border-0 d-none" onClick={() => window.quickAssignWednesdayALT()}><i className="fa-solid fa-bolt text-warning me-1"></i> Quick Preset: Wed 4,5 ALT</button>
                                    <button id="resetTimetableBtn" className="btn btn-sm btn-outline-danger py-0 d-none" onClick={() => window.resetTimetableEdits()}><i className="fa-solid fa-rotate-left me-1"></i> Reset Edits to Default</button>
                                    <button className="btn btn-sm btn-success py-0" onClick={() => window.downloadTimetablePNG()}><i className="fa-solid fa-download me-1"></i> Download PNG</button>
                                </div>
                            </div>

                            <div id="notifStatusPanel" className="alert alert-secondary py-2 px-3 border-0 rounded-3 mb-3 shadow-sm small">
                            </div>

                            <div id="adminTTPlaceholder" className="alert alert-warning py-3 px-4 border-0 rounded-3 mb-4 shadow-sm text-center d-none">
                                <i className="fa-solid fa-circle-info me-2 fs-5 mb-2 d-block"></i>
                                <strong>Please select a Department and Section from the dropdowns above to view and edit its timetable.</strong>
                            </div>

                            <div id="ttPopupOverlayWrapper" className="tt-popup-wrapper">
                                <button id="closeTtPopupBtn" className="btn btn-danger btn-sm d-none" style={{ position: 'fixed', top: '20px', right: '30px', zIndex: 10001, borderRadius: '50%', width: '40px', height: '40px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} onClick={() => window.closeTtPopup?.()}><i className="fa-solid fa-xmark"></i></button>

                                <div className="glass-panel" id="timetableCaptureArea">
                                    <div className="panel-header">
                                    <h2 className="panel-title d-flex align-items-center gap-2">
                                        <i className="fa-solid fa-calendar-days text-info"></i>
                                        <span id="ttTitleHeader" style={{ outline: "none", padding: "2px 5px", borderRadius: "4px", border: "1px dashed transparent" }}>Class Timetable - Academic Schedule (II CSE C - Classroom SF 04)</span>
                                        <i id="ttTitleEditIcon" className="fa-solid fa-pencil text-muted d-none" style={{ fontSize: "0.8rem", cursor: "pointer" }} title="Edit Title"></i>
                                    </h2>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge bg-dark border border-secondary text-muted">Version 3.0 (19.01.2026)</span>
                                    </div>
                                </div>
                                <div className="p-3 tt-table-wrapper">
                                    <table className="tt-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: "100px" }}>Day Order</th>
                                                <th>1<br /><small className="text-dim" id="ttHeaderP1">08.40 - 09.40</small></th>
                                                <th>2<br /><small className="text-dim" id="ttHeaderP2">09.40 - 10.40</small></th>
                                                <th>3<br /><small className="text-dim" id="ttHeaderP3">11.00 - 12.00</small></th>
                                                <th className="text-warning" style={{ width: "35px", writingMode: "vertical-rl", transform: "rotate(180deg)" }} id="ttHeaderTea">12.00-12.15</th>
                                                <th>4<br /><small className="text-dim" id="ttHeaderP4">12.00 - 01.00</small></th>
                                                <th>5<br /><small className="text-dim" id="ttHeaderP5">01.40 - 02.30</small></th>
                                                <th className="text-warning" style={{ width: "35px", writingMode: "vertical-rl", transform: "rotate(180deg)" }} id="ttHeaderLunch">02.30-03.15</th>
                                                <th>ACT<br /><small className="text-dim" id="ttHeaderAct">Activity</small></th>
                                                <th>6<br /><small className="text-dim" id="ttHeaderP6">02.30 - 03.20</small></th>
                                                <th>7<br /><small className="text-dim" id="ttHeaderP7">03.20 - 04.10</small></th>
                                            </tr>
                                        </thead>
                                        <tbody id="ttGridBody">

                                        </tbody>
                                    </table>
                                </div>
                            </div>


                            <div className="glass-panel" id="referenceTableArea">
                                <div className="panel-header">
                                    <h3 className="panel-title"><i className="fa-solid fa-book-bookmark text-warning"></i> Course & Faculty Incharge Reference Table</h3>
                                    <span className="badge bg-secondary">Total Credits: 23</span>
                                </div>
                                <div className="table-responsive p-2">
                                    <table className="ref-table">
                                        <thead>
                                            <tr>
                                                <th>Short Name</th>
                                                <th>Course Code & Title</th>
                                                <th>Faculty Incharge</th>
                                                <th>Venue</th>
                                                <th>Category</th>
                                                <th>Credits</th>
                                                <th>No. of Hrs</th>
                                            </tr>
                                        </thead>
                                        <tbody id="courseRefBody">
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="glass-panel mt-3" id="studentFacultyAvailabilityArea">
                                    <div className="panel-header">
                                        <h3 className="panel-title"><i className="fa-solid fa-people-arrows text-warning"></i> Faculty Availability (Today)</h3>
                                    </div>
                                    <div className="table-responsive p-2">
                                        <table className="ref-table">
                                            <thead>
                                                <tr>
                                                    <th>Staff Name</th>
                                                    <th>Department</th>
                                                    <th>Status (Today)</th>
                                                </tr>
                                            </thead>
                                            <tbody id="studentFacultyAvailabilityBody">
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                        </div>

                        <div className="mt-4 px-2" id="adminControlPanelContainer">
                            <h4 className="text-info fw-bold mb-4"><i className="fa-solid fa-shield-halved me-2"></i> Admin Control Panel</h4>
                            <div className="row g-4">
                                <div className="col-md-4 col-sm-6">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#adminResourcesModal" onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,188,255,0.15)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-database text-info mb-3" style={{ fontSize: "2.5rem" }}></i>
                                            <h5 className="text-light fw-bold mb-2">Manage Subjects</h5>
                                            <p className="text-muted small mb-0">Add, edit, or remove subjects and timetable defaults.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#adminVenuesModal" onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(25,200,100,0.15)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-map-location-dot text-success mb-3" style={{ fontSize: "2.5rem" }}></i>
                                            <h5 className="text-light fw-bold mb-2">Manage Venues</h5>
                                            <p className="text-muted small mb-0">Configure classrooms, laboratories, and lecture halls.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#manageRosterModal" onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(130,100,255,0.15)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-users-gear mb-3" style={{ fontSize: "2.5rem", color: "var(--sece-indigo, #7c6fe0)" }}></i>
                                            <h5 className="text-light fw-bold mb-2">Sections &amp; Students</h5>
                                            <p className="text-muted small mb-0">Manage section rosters and student data.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-6 col-sm-12">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#adminFacultyDetailsModal" onClick={() => window.renderAdminFacultyDetails && window.renderAdminFacultyDetails()} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,193,7,0.15)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-address-card text-warning mb-3" style={{ fontSize: "2.5rem" }}></i>
                                            <h5 className="text-light fw-bold mb-2">Faculty Details</h5>
                                            <p className="text-muted small mb-0">View complete details of enrolled faculty members.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-6 col-sm-12">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#adminViewEditTimetableModal" onClick={() => window.initAdminViewEditTimetableModal && window.initAdminViewEditTimetableModal()} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,100,200,0.15)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-table-list text-pink mb-3" style={{ fontSize: "2.5rem", color: "var(--bs-pink, #d63384)" }}></i>
                                            <h5 className="text-light fw-bold mb-2">View / Edit Timetable</h5>
                                            <p className="text-muted small mb-0">Select batch, dept, year, and section to edit timetable.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-6 col-sm-12">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#manageStudentsModal" onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,110,253,0.15)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-users text-primary mb-3" style={{ fontSize: "2.5rem" }}></i>
                                            <h5 className="text-light fw-bold mb-2">Student Directory</h5>
                                            <p className="text-muted small mb-0">View comprehensive list of all enrolled students.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-4 col-md-6 col-sm-12">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#viewSectionsModal" onClick={() => window.renderSectionsList && window.renderSectionsList()} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(230,100,50,0.2)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-folder-tree text-danger mb-3" style={{ fontSize: "2.5rem" }}></i>
                                            <h5 className="text-light fw-bold mb-2">View Sections</h5>
                                            <p className="text-muted small mb-0">View and manage all academic sections created.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-6 col-sm-12">
                                    <div className="card bg-dark border-secondary h-100 shadow" style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", minHeight: "140px" }} data-bs-toggle="modal" data-bs-target="#viewCredentialsModal" onClick={() => window.renderCredentialsList && window.renderCredentialsList()} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,255,150,0.2)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                                        <div className="card-body p-4 text-center d-flex flex-column align-items-center justify-content-center">
                                            <i className="fa-solid fa-key text-success mb-3" style={{ fontSize: "2.5rem" }}></i>
                                            <h5 className="text-light fw-bold mb-2">View Usernames / Passwords</h5>
                                            <p className="text-muted small mb-0">View all Enrolled Student and Faculty Credentials.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                </main>
            </div>



            <div className="modal fade" id="editPeriodModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title fw-bold text-info"><i className="fa-solid fa-pen-to-square me-2"></i> Edit Period Schedule</h5>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <form id="editPeriodForm">
                                <input type="hidden" id="editDay" />
                                <input type="hidden" id="editPeriod" />

                                <div className="mb-3">
                                    <label className="form-label small text-muted">Selected Slot</label>
                                    <input type="text" id="editSlotLabel" className="form-readonly form-control form-control-sm bg-secondary  border-0" readOnly />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small text-muted">Subject / Course Code</label>
                                    <input type="text" id="editSubjectSelect" className="form-control form-control-sm bg-dark text-white border-secondary" list="subjectOptions" onChange={() => window.onSubjectSelectChange()} placeholder="Select or type new subject" />
                                    <datalist id="subjectOptions">
                                        <option value="ALT">ALT - U23EM753 Advanced Logical Thinking (Placement Team)</option>
                                        <option value="SE">SE - U23IT481 Software Engineering</option>
                                        <option value="JAVA">JAVA - U23CS491 Java Programming</option>
                                        <option value="AIML">AIML - U23AM495 Artificial Intelligence & ML</option>
                                        <option value="DM">DM - U23MA204 Discrete Mathematics</option>
                                        <option value="DAA">DAA - U23CS403 Design & Analysis of Algorithms</option>
                                        <option value="DBMS">DBMS - U23CS404 Database Management Systems</option>
                                        <option value="JAVA LAB">JAVA LAB - Full Stack Lab</option>
                                        <option value="SE LAB">SE LAB - Intel AI Lab</option>
                                        <option value="DAA LAB">DAA LAB - Full Stack Lab</option>
                                        <option value="DBMS LAB">DBMS LAB - Cloud & DevOps Lab</option>
                                        <option value="COE">COE - Center of Excellence</option>
                                        <option value="UHV">UHV - Universal Human Values</option>
                                        <option value="SS">SS - Soft Skills</option>
                                        <option value="LIB">LIB - Library</option>
                                        <option value="TWM">TWM - Total Wellness Management</option>
                                        <option value="AIML Project">AIML Project - Project Lab</option>
                                        <option value="JAVA PROJECT">JAVA PROJECT - Full Stack Lab</option>
                                    </datalist>
                                </div>

                                <div className="row g-2 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label small text-muted">Faculty Incharge</label>
                                        <input type="text" id="editFaculty" className="form-control form-control-sm bg-dark text-white border-secondary" defaultValue="Dr.S.K.Harikarthick, ASP/CSE" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small text-muted">Venue / Classroom / Lab</label>
                                        <input type="text" id="editVenue" list="savedVenueOptions" className="form-control form-control-sm bg-dark text-white border-secondary" defaultValue="SF 04" />
                                    </div>
                                </div>

                                <div className="row g-2 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label small text-muted">Category</label>
                                        <select id="editCategory" className="form-select form-select-sm bg-dark text-white border-secondary">
                                            <option value="cat-theory">Theory Course</option>
                                            <option value="cat-lab">Practical / Lab</option>
                                            <option value="cat-alt">Professional / Placement (ALT)</option>
                                            <option value="cat-project">Project / COE</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6 d-flex align-items-end">
                                        <button type="button" className="btn btn-sm btn-outline-warning w-100" onClick={() => window.setAsWednesdayALT()} >
                                            <i className="fa-solid fa-star me-1"></i> Set Placement ALT
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small text-muted">Change Type</label>
                                    <div className="form-check">
                                        <input className="form-check-input bg-dark border-secondary" type="radio" name="editPeriodType" id="editTypeTemporary" value="temporary" defaultChecked />
                                        <label className="form-check-label small text-info" htmlFor="editTypeTemporary">Only for today (Temporary substitution)</label>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input bg-dark border-secondary" type="radio" name="editPeriodType" id="editTypePermanent" value="permanent" />
                                        <label className="form-check-label small text-warning" htmlFor="editTypePermanent">Make permanent (Change base timetable)</label>
                                    </div>
                                </div>

                                <div className="alert alert-warning py-2 small mb-0">
                                    <i className="fa-solid fa-triangle-exclamation me-1"></i> Saving changes will automatically send SMS & Email notifications to all enrolled students in this section.
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer border-secondary">
                            <button type="button" className="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-sm btn-primary" onClick={() => window.savePeriodChanges()} ><i className="fa-solid fa-check me-1"></i> Save Period Changes</button>
                        </div>
                    </div>
                </div>
            </div>


            {!isAdmin && (
                <div className="modal fade" id="notificationModal" tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content bg-dark text-white border-secondary">
                            <div className="modal-header border-secondary">
                                <h5 className="modal-title text-warning fw-bold"><i className="fa-solid fa-bell me-2"></i> Register Phone & Email Notifications</h5>
                                <div>
                                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                                </div>
                            </div>
                            <div className="modal-body">
                                <p className="small text-muted">Students and Faculty can register their email address and mobile phone number to receive instant SMS & Email schedule reminders, period changes, and attendance alerts.</p>

                                <form id="notifRegisterForm" onSubmit={(event) => window.handleNotificationRegister(event)} >
                                    <div className="mb-3">
                                        <label className="form-label small text-white">Full Name</label>
                                        <input type="text" id="notifName" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="e.g. Mithil Pranav" required />
                                    </div>

                                    <div className="row g-2 mb-3">
                                        <div className="col-md-6">
                                            <label id="studentEmailLabel" className="form-label small text-white"><i className="fa-solid fa-envelope text-info me-1"></i> Student Email ID</label>
                                            <input type="email" id="notifEmail" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="student@sece.ac.in" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small text-white"><i className="fa-solid fa-mobile-screen-button text-success me-1"></i> Mobile Phone (SMS)</label>
                                            <input type="tel" id="notifPhone" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="+91 9876543210" required />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small text-white">Select Notification Preferences</label>
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" id="prefClassAlert" defaultChecked />
                                            <label className="form-check-label small" htmlFor="prefClassAlert">15 Minutes Before Class Reminder</label>
                                        </div>
                                        <div className="form-check" id="prefTimetableContainer">
                                            <input className="form-check-input" type="checkbox" id="prefChangeAlert" defaultChecked />
                                            <label className="form-check-label small" htmlFor="prefChangeAlert">Timetable / Period Substitution SMS Alert</label>
                                        </div>
                                        <div className="form-check" id="prefWedContainer">
                                            <input className="form-check-input" type="checkbox" id="prefWednesdayALT" defaultChecked />
                                            <label className="form-check-label small" htmlFor="prefWednesdayALT">Wednesday Placement ALT Class Reminder</label>
                                        </div>
                                    </div>

                                    <button type="submit" className="btn btn-sm btn-info w-100 font-semibold"><i className="fa-solid fa-paper-plane me-1"></i> Register & Send Test Notification</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            <div className="modal fade" id="forgotPasswordModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-warning fw-bold"><i className="fa-solid fa-key me-2"></i> Forgot Password? Reset It Here</h5>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <p className="small text-muted mb-3">Admin can reset the fixed Admin account password. Students/Faculty must verify their registered mobile number before resetting.</p>
                            <form id="forgotPasswordForm" onSubmit={(event) => window.handleForgotPasswordSubmit(event)} >
                                <div className="mb-3">
                                    <label className="form-label small text-white fw-semibold">Account Type</label>
                                    <select id="fpUserType" className="form-select form-select-sm bg-dark text-white border-secondary" onChange={() => window.updateForgotPasswordHint()} >
                                        <option value="STUDENT">Student</option>
                                        <option value="FACULTY">Faculty Member</option>
                                        <option value="CLASS_ADVISOR">Class Advisor</option>
                                        <option value="ADMIN">Administrator</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-white fw-semibold">Username</label>
                                    <input type="text" id="fpIdentifier" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="e.g. sarjuk23" pattern="[a-z0-9]+"
                                        onInput={(e) => e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')} required />
                                    <div id="fpUsernameHint" className="form-text text-muted">Student username = "s" + first 4 letters of first name + last name initial + a number. Example: sarjuk23. Lowercase only.</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-white fw-semibold"><i className="fa-solid fa-mobile-screen-button text-success me-1"></i> Registered Mobile Number</label>
                                    <input type="tel" id="fpMobile" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="+91 9876543210" required />
                                    <div id="fpMobileHint" className="form-text text-muted">Required for Student/Faculty recovery. Admin recovery does not use a mobile number.</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-white fw-semibold">Enter New Password</label>
                                    <input type="password" id="fpNewPassword" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Enter new password" pattern="[a-z0-9]+"
                                        onInput={(e) => e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')} required minLength="4" />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-white fw-semibold">Re-enter New Password</label>
                                    <input type="password" id="fpConfirmPassword" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Re-enter new password" pattern="[a-z0-9]+"
                                        onInput={(e) => e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')} required minLength="4" />
                                </div>
                                <button type="submit" className="btn btn-sm btn-warning w-100 fw-bold"><i className="fa-solid fa-rotate me-1"></i> Submit</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>




            <div className="modal fade" id="manageRosterModal" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-info fw-bold"><i className="fa-solid fa-users-gear me-2"></i> <span id="manageRosterModalTitle">Manage Students Roster</span></h5>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <p id="sectionsAdminOnlyNote" className="small text-muted d-none mb-2"><i className="fa-solid fa-lock me-1"></i> Section management is restricted to Admin accounts.</p>

                            <div>
                            <div className="row g-2 mb-3 align-items-end">
                                <div className="col-md-12 d-flex gap-2 justify-content-end align-items-end">
                                    <div className="input-group input-group-sm" style={{ maxWidth: '200px' }}>
                                        <input type="text" id="rosterSearchRegNo" className="form-control bg-dark text-white border-secondary" placeholder="Reg No..." />
                                        <button type="button" className="btn btn-outline-info" onClick={() => window.searchStudentInRoster()} title="Search Details"><i className="fa-solid fa-search"></i></button>
                                    </div>
                                    {!isAdmin && (
                                        <button id="addStudentBtn" className="btn btn-sm btn-success" style={{ whiteSpace: 'nowrap' }} onClick={() => window.toggleAddStudentForm()} ><i className="fa-solid fa-user-plus me-1"></i> Add Student</button>
                                    )}
                                    <input type="file" id="importStudentExcelInput" accept=".xlsx, .xls, .csv" style={{ display: "none" }} onChange={(e) => window.importStudentExcel && window.importStudentExcel(e)} />
                                    <button type="button" className="btn btn-sm btn-outline-success" onClick={() => document.getElementById('importStudentExcelInput').click()} style={{ whiteSpace: 'nowrap' }}>
                                        <i className="fa-solid fa-file-excel me-1"></i> Import Excel
                                    </button>
                                </div>
                            </div>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <h6 className="mb-0 text-light fw-bold">Section Roster (Class Strength: <span id="rosterCount">0</span>)</h6>
                            </div>
                                    <p id="studentManagementNote" className="small text-muted mb-2"></p>


                                    <div id="addStudentCard" className="card card-body bg-secondary  border-0 mb-3 d-none">
                                        <h6 className="fw-bold text-warning mb-2">Register New Student</h6>
                                        <form id="addStudentForm" onSubmit={(event) => window.handleAddStudent(event)} >
                                            <div className="row g-2 mb-2">
                                                <div className="col-md-4">
                                                    <label className="form-label small">First Name <span className="text-danger">*</span></label>
                                                    <input type="text" id="rsFirstName" className="form-control form-control-sm bg-dark text-white" required />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label small">Last Name <span className="text-danger">*</span></label>
                                                    <input type="text" id="rsLastName" className="form-control form-control-sm bg-dark text-white" required />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label small">Register Number <span className="text-danger">*</span></label>
                                                    <input type="text" id="rsRegNo" className="form-control form-control-sm bg-dark text-white" required placeholder="e.g. 71812423001" />
                                                </div>
                                            </div>
                                            <div className="row g-2 mb-2">
                                                <div className="col-md-4">
                                                    <label className="form-label small">Personal Email <span className="text-danger">*</span></label>
                                                    <input type="email" id="rsEmail" className="form-control form-control-sm bg-dark text-white" required />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label small">College Email <span className="text-danger">*</span></label>
                                                    <input type="email" id="rsCollegeEmail" className="form-control form-control-sm bg-dark text-white" required />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label small">Mobile Number <span className="text-danger">*</span></label>
                                                    <input type="tel" id="rsPhone" className="form-control form-control-sm bg-dark text-white" required />
                                                </div>
                                            </div>
                                            <div className="row g-2 mb-2">
                                                <div className="col-md-4">
                                                    <label className="form-label small">Parent 1 Mobile <span className="text-danger">*</span></label>
                                                    <input type="tel" id="rsParentPhone1" className="form-control form-control-sm bg-dark text-white" required />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label small">Parent 2 Mobile <span className="text-muted">(Optional)</span></label>
                                                    <input type="tel" id="rsParentPhone2" className="form-control form-control-sm bg-dark text-white" />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label small">Resident Type <span className="text-danger">*</span></label>
                                                    <select id="rsResidentType" className="form-select form-select-sm bg-dark text-white border-secondary" required onChange={(e) => {
                                                        const el = document.getElementById('rsHostelFields');
                                                        if (el) el.classList.toggle('d-none', e.target.value !== 'Hosteller');
                                                    }}>
                                                        <option value="">Select...</option>
                                                        <option value="Hosteller">Hosteller</option>
                                                        <option value="Day Scholar">Day Scholar</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div id="rsHostelFields" className="row g-2 mb-2 d-none">
                                                <div className="col-md-6">
                                                    <label className="form-label small">Hostel Block</label>
                                                    <input type="text" id="rsHostelBlock" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="e.g. A Block" />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small">Room Number</label>
                                                    <input type="text" id="rsRoomNumber" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="e.g. 204" />
                                                </div>
                                            </div>
                                            <div className="row g-2 mb-3">
                                                <div className="col-md-3">
                                                    <label className="form-label small">Department <span className="text-danger">*</span> <small className="text-muted">(pick or type new)</small></label>
                                                    <input type="text" id="rsDept" list="deptDatalist" className="form-control form-control-sm bg-dark text-white border-secondary" required placeholder="e.g. CSE" autoComplete="off" />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label small">Class <span className="text-danger">*</span> <small className="text-muted">(pick or type new)</small></label>
                                                    <input type="text" id="rsCourse" list="courseDatalist" className="form-control form-control-sm bg-dark text-white border-secondary" required placeholder="e.g. BTECH-CSE" autoComplete="off" />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label small">Section <span className="text-danger">*</span> <small className="text-muted">(pick or type new)</small></label>
                                                    <input type="text" id="rsSection" list="sectionDatalist" className="form-control form-control-sm bg-dark text-white border-secondary" required placeholder="e.g. II CSE C" autoComplete="off" />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label small">Semester <span className="text-danger">*</span></label>
                                                    <input type="number" id="rsSemester" className="form-control form-control-sm bg-dark text-white" required min="1" max="8" defaultValue="3" />
                                                </div>
                                            </div>
                                            <button type="submit" className="btn btn-sm btn-warning font-semibold"><i className="fa-solid fa-check me-1"></i> Save Student</button>
                                        </form>
                                    </div>

                                    <div className="table-responsive" style={{ maxHeight: "350px", overflowY: "auto" }}>
                                        <table className="table table-dark table-striped table-hover align-middle text-sm mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Roll No</th>
                                                    <th>Name</th>
                                                    <th>Department & Sec</th>
                                                    <th>Email</th>
                                                    <th>Phone (SMS)</th>
                                                    <th className="text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody id="enrolledStudentsRosterBody">
                                                <tr><td colSpan="6" className="text-center text-muted">Select filters to view students</td></tr>
                                            </tbody>
                                        </table>
                                    </div>

                                </div>


                                
            </div>
        </div>
    </div>
</div>

<div className="modal fade" id="manageSectionsModal" tabIndex="-1">
    <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content bg-dark text-white border-secondary">
            <div className="modal-header border-secondary">
                <h5 className="modal-title text-info fw-bold"><i className="fa-solid fa-folder-tree me-2"></i> Manage Sections</h5>
                <div>
                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
            </div>
            <div className="modal-body">
                <div className="row g-3">
                    <div className="col-md-6">
                        <div className="card card-body bg-secondary border-0">
                            <h6 className="fw-bold text-info"><i className="fa-solid fa-folder-plus me-1"></i> Add New Section</h6>
                            <form id="addSectionForm" onSubmit={(event) => window.handleAddSection(event)} >
                                <div className="mb-2">
                                    <label className="form-label small">Department <span className="text-danger">*</span> <small className="text-muted">(pick or type new)</small></label>
                                    <input type="text" id="secDept" list="secDeptList" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="e.g. CSE" required autoComplete="off" />
                                    <datalist id="secDeptList">
                                        <option value="CSE">CSE - Computer Science & Engg</option>
                                        <option value="IT">IT - Information Technology</option>
                                        <option value="AIDS">AI&DS - Artificial Intelligence & DS</option>
                                        <option value="ECE">ECE - Electronics & Comm</option>
                                        <option value="EEE">EEE - Electrical & Electronics</option>
                                        <option value="MECH">MECH - Mechanical Engg</option>
                                    </datalist>
                                </div>
                                <div className="mb-2">
                                    <label className="form-label small">Section Name</label>
                                    <input type="text" id="secName" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="e.g. II CSE D" required />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label small">Assigned Classroom</label>
                                    <input type="text" id="secClassroom" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="e.g. SF 05" required />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label small">Max Capacity</label>
                                    <input type="number" id="secCapacity" min="0" max="80" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Max 80" defaultValue="60" required />
                                </div>
                                <button type="submit" className="btn btn-sm btn-info w-100 font-semibold"><i className="fa-solid fa-plus me-1"></i> Create Section</button>
                            </form>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card card-body bg-secondary border-0">
                            <ul className="list-group list-group-flush rounded bg-dark" id="sectionsList">
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div className="modal fade" id="viewSectionsModal" tabIndex="-1">
    <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content bg-dark text-white border-secondary">
            <div className="modal-header border-secondary">
                <h5 className="modal-title text-info fw-bold"><i className="fa-solid fa-folder-tree me-2"></i> View Sections</h5>
                <div>
                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
            </div>
            <div className="modal-body">
                <div className="row g-3">
                    <div className="col-12">
                        <div className="card card-body bg-secondary border-0">
                            <ul className="list-group list-group-flush rounded bg-dark" id="sectionsListOnly">
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div className="modal fade" id="viewCredentialsModal" tabIndex="-1">
    <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content bg-dark text-white border-secondary">
            <div className="modal-header border-secondary">
                <h5 className="modal-title text-success fw-bold"><i className="fa-solid fa-key me-2"></i> User Credentials</h5>
                <div>
                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
            </div>
            <div className="modal-body p-0">
                <div className="card card-body bg-dark border-0">
                    <div className="d-flex mb-3 gap-2">
                        <div className="input-group">
                            <span className="input-group-text bg-dark text-secondary border-secondary"><i className="fa-solid fa-magnifying-glass"></i></span>
                            <input type="text" className="form-control bg-dark text-white border-secondary" id="credentialSearchInput" placeholder="Enter exact username (e.g., 25cs316) to search..." onKeyDown={(e) => { if (e.key === 'Enter') window.searchUserCredentials?.(); }} />
                            <button className="btn btn-primary" type="button" onClick={() => window.searchUserCredentials?.()}>Search</button>
                        </div>
                    </div>
                    <ul className="nav nav-tabs nav-tabs-dark mb-3" role="tablist">
                        <li className="nav-item" role="presentation">
                            <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#credStudentsTab" type="button" role="tab">Students</button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button className="nav-link" data-bs-toggle="tab" data-bs-target="#credFacultyTab" type="button" role="tab">Faculty</button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button className="nav-link" data-bs-toggle="tab" data-bs-target="#credAdvisorTab" type="button" role="tab">Advisor</button>
                        </li>
                    </ul>
                    <div className="tab-content">
                        <div className="tab-pane fade show active" id="credStudentsTab" role="tabpanel">
                            <div className="table-responsive">
                                <table className="table table-dark table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th>Register No / Username</th>
                                            <th>Name</th>
                                            <th>Section</th>
                                            <th>Password</th>
                                        </tr>
                                    </thead>
                                    <tbody id="credStudentsList"></tbody>
                                </table>
                            </div>
                        </div>
                        <div className="tab-pane fade" id="credFacultyTab" role="tabpanel">
                            <div className="table-responsive">
                                <table className="table table-dark table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th>Faculty Name</th>
                                            <th>Department</th>
                                            <th>Username</th>
                                            <th>Password</th>
                                        </tr>
                                    </thead>
                                    <tbody id="credFacultyList"></tbody>
                                </table>
                            </div>
                        </div>
                        <div className="tab-pane fade" id="credAdvisorTab" role="tabpanel">
                            <div className="table-responsive">
                                <table className="table table-dark table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th>Advisor Name</th>
                                            <th>Assigned Section</th>
                                            <th>Username</th>
                                            <th>Password</th>
                                        </tr>
                                    </thead>
                                    <tbody id="credAdvisorList"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>




            <div className="modal fade" id="facultyDetailsModal" tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-primary fw-bold"><i className="fa-solid fa-chalkboard-user me-2"></i>Faculty Details</h5>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="alert alert-info py-2 small">Faculty can view all faculty email details here. You can edit only your own email details. Both Personal Email and College Mail ID are compulsory.</div>
                            <div className="table-responsive">
                                <table className="table table-dark table-striped table-hover align-middle small">
                                    <thead><tr><th>Faculty</th><th>Department</th><th>Username</th><th>Personal Email</th><th>College Mail ID</th><th>Action</th></tr></thead>
                                    <tbody id="facultyDetailsBody"></tbody>
                                </table>
                            </div>

                            <hr className="border-secondary my-4" />
                            <h5 className="text-warning fw-bold mb-3">Enrolled Student Contact Details</h5>
                            <div id="studentContactDetailsPanel" className="table-responsive mb-4" style={{ maxHeight: "300px", overflowY: "auto" }}>
                                <table className="table table-dark table-striped table-hover text-sm mb-0">
                                    <thead>
                                        <tr>
                                            <th>Roll No</th>
                                            <th>Name</th>
                                            <th>Department & Sec</th>
                                            <th>Email</th>
                                            <th>Phone (SMS)</th>
                                            <th>Resident Type</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="studentRosterBody">

                                    </tbody>
                                </table>
                            </div>

                            <div id="adminCredentialsPanel" className="mb-4 d-none">
                                <h6 className="text-danger fw-bold border-bottom border-secondary pb-2">Admin Only — Faculty Usernames & Passwords</h6>
                                <div className="table-responsive" style={{ maxHeight: "220px", overflowY: "auto" }}><table className="table table-dark table-striped table-hover text-sm mb-0"><thead><tr><th>Faculty</th><th>Department</th><th>Username</th><th>Password</th></tr></thead><tbody id="facultyCredentialsBody"></tbody></table></div>
                            </div>
                            <div id="facultyEmailDirectoryPanel" className="mb-4 d-none">
                                <h6 id="facultyEmailDirectory" className="text-info fw-bold border-bottom border-secondary pb-2">Faculty Email Directory — Faculty & Admin Only</h6>
                                <p className="small text-muted mb-2">Both Personal Email and College Mail ID are compulsory for every faculty member. Students cannot access this directory.</p>
                                <div className="table-responsive" style={{ maxHeight: "240px", overflowY: "auto" }}>
                                    <table className="table table-dark table-striped table-hover text-sm mb-0">
                                        <thead><tr><th>Faculty</th><th>Department</th><th>Username</th><th>Personal Email</th><th>College Mail ID</th><th>Action</th></tr></thead>
                                        <tbody id="facultyEmailDirectoryBody"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <div className="modal fade" id="classAdvisorLoginModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-warning fw-bold"><i className="fa-solid fa-user-tie me-2"></i>Class Advisor Login</h5>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="alert alert-info py-2 small">Use the separate Class Advisor credentials. Username = <code>a</code> + first 4 letters of name; password = <code>12345</code>. Example for Keerthika: Username: <code>akeer</code> / Password: <code>12345</code>. Only the assigned class is shown.</div>
                            <form id="classAdvisorLoginForm" onSubmit={(event) => window.handleClassAdvisorLogin(event)} >
                                <div className="mb-3">
                                    <label className="form-label small">Class Advisor Username</label>
                                    <input id="advisorLoginUsername" className="form-control bg-dark text-white border-secondary" autoComplete="username" required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small">Class Advisor Password</label>
                                    <input id="advisorLoginPassword" type="password" className="form-control bg-dark text-white border-secondary" autoComplete="current-password" required />
                                </div>
                                <button className="btn btn-warning w-100 fw-bold" type="submit"><i className="fa-solid fa-right-to-bracket me-1"></i> Verify & Open Class Advisor View</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>


            <div className="modal fade" id="classAdvisorViewModal" tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <div>
                                <h5 className="modal-title text-warning fw-bold"><i className="fa-solid fa-user-tie me-2"></i>Class Advisor Student Details</h5>
                                <div id="classAdvisorViewSubtitle" className="small text-muted"></div>
                            </div>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div id="classAdvisorStudentsBody"></div>
                        </div>
                    </div>
                </div>
            </div>




            <div className="modal fade" id="studentProfileModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-success fw-bold"><i className="fa-solid fa-id-card me-2"></i> My Student Details</h5>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body" id="studentProfileBody"></div>
                    </div>
                </div>
            </div>


            <div className="modal fade" id="adminResourcesModal" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-info fw-bold"><i className="fa-solid fa-database me-2"></i> Admin Resource Management</h5>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="alert alert-warning py-2 small">
                                <i className="fa-solid fa-lock me-1"></i>
                                Only the Admin account can add or remove subjects, classes and venues. Changes are saved in this browser.
                            </div>
                            <ul className="nav nav-tabs border-secondary mb-3">
                                <li className="nav-item"><button className="nav-link active text-info" data-bs-toggle="tab" data-bs-target="#resourceSubjects">Subjects</button></li>
                            </ul>
                            <div className="tab-content">
                                <div className="tab-pane fade show active" id="resourceSubjects">

                                    <form id="addSubjectForm" onSubmit={(event) => window.handleAddSubject(event)} className="row g-2 mb-3">
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Subject Code</label>
                                            <input id="newSubjectCode" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Course code" required />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Subject Name</label>
                                            <input id="newSubjectTitle" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Subject title" required />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Faculty incharge</label>
                                            <input id="newSubjectFaculty" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Faculty incharge" required />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Venue</label>
                                            <input id="newSubjectVenue" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Venue" />
                                        </div>
                                        <div className="col-md-12 mt-2 d-flex justify-content-end gap-2">
                                            <input type="file" id="importAdminSubjectExcelInput" accept=".xlsx, .xls, .csv" style={{ display: "none" }} onChange={(e) => window.importAdminSubjectExcel && window.importAdminSubjectExcel(e)} />
                                            <button type="button" className="btn btn-sm btn-outline-success" onClick={() => document.getElementById('importAdminSubjectExcelInput').click()} style={{ whiteSpace: 'nowrap' }}>
                                                <i className="fa-solid fa-file-excel me-1"></i> Import Excel
                                            </button>
                                            <button className="btn btn-sm btn-info" type="submit"><i className="fa-solid fa-plus me-1"></i>Add Subject</button>
                                        </div>
                                    </form>
                                    <div className="table-responsive"><table className="table table-dark table-striped table-sm"><thead><tr><th>Subject Code</th><th>Subject Name</th><th>Faculty incharge</th><th>Venue</th><th>Action</th></tr></thead><tbody id="adminSubjectsList"></tbody></table></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timetable Defaults Standalone Modal */}
            <div className="modal fade" id="timetableDefaultsModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-warning fw-bold"><i className="fa-solid fa-calendar-days me-2"></i> Timetable Defaults</h5>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <h6 className="text-warning fw-bold border-bottom border-secondary pb-2">Global Timetable Information</h6>
                            <form id="editBatchSemFormStandalone" onSubmit={(e) => { e.preventDefault(); window.saveBatchSemEdit(); }} className="row g-2 mb-3">
                                <div className="col-md-4">
                                    <label className="form-label small mb-1">Batch Start Year</label>
                                    <input type="number" id="modalBatchInputStandalone" className="form-control form-control-sm bg-dark text-white border-secondary" min="2020" max="3000" defaultValue="2024" />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small mb-1">Year</label>
                                    <select id="modalYearSelectStandalone" className="form-select form-select-sm bg-dark text-white border-secondary">
                                        <option value="I Year">I Year</option>
                                        <option value="II Year">II Year</option>
                                        <option value="III Year" selected>III Year</option>
                                        <option value="IV Year">IV Year</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small mb-1">Semester</label>
                                    <select id="modalSemSelectStandalone" className="form-select form-select-sm bg-dark text-white border-secondary">
                                        <option value="I Semester">I Semester</option>
                                        <option value="II Semester">II Semester</option>
                                        <option value="III Semester" selected>III Semester</option>
                                        <option value="IV Semester">IV Semester</option>
                                        <option value="V Semester">V Semester</option>
                                        <option value="VI Semester">VI Semester</option>
                                        <option value="VII Semester">VII Semester</option>
                                        <option value="VIII Semester">VIII Semester</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small mb-1">Academic Year</label>
                                    <input type="text" id="modalAcademicYearStandalone" className="form-control form-control-sm bg-dark text-white border-secondary" defaultValue="2026 - 2027" placeholder="e.g. 2026 - 2027" />
                                </div>
                                <div className="col-12 mt-2">
                                    <button type="submit" className="btn btn-sm btn-warning w-100 fw-bold"><i className="fa-solid fa-floppy-disk me-1"></i> Save Default Details</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="adminVenuesModal" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-success fw-bold"><i className="fa-solid fa-map-location-dot me-2"></i> Admin Resource Management (Venues)</h5>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <form id="adminVenueForm" onSubmit={(event) => window.handleAddVenue(event)} className="row g-2 mb-3">
                                <div className="col-md-4">
                                    <label className="form-label small mb-1">Venue Name</label>
                                    <input id="newVenueName" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Venue name" required />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small mb-1">Type</label>
                                    <input id="newVenueType" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Type (Class/Lab)" />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small mb-1">Block</label>
                                    <input id="newVenueBlock" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Block" />
                                </div>
                                <div className="col-md-1">
                                    <label className="form-label small mb-1">Capacity</label>
                                    <input id="newVenueCapacity" type="number" min="1" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Cap." />
                                </div>
                                <div className="col-md-12 mt-2 d-flex justify-content-end gap-2">
                                    <input type="file" id="importAdminVenueExcelInput" accept=".xlsx, .xls, .csv" style={{ display: "none" }} onChange={(e) => window.importAdminVenueExcel && window.importAdminVenueExcel(e)} />
                                    <button type="button" className="btn btn-sm btn-outline-success" onClick={() => document.getElementById('importAdminVenueExcelInput').click()} style={{ whiteSpace: 'nowrap' }}>
                                        <i className="fa-solid fa-file-excel me-1"></i> Import Excel
                                    </button>
                                    <button className="btn btn-sm btn-success" type="submit"><i className="fa-solid fa-plus me-1"></i>Add Venue</button>
                                </div>
                            </form>
                            <div className="list-group" id="adminVenuesList"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="studentDayNotificationModal" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-info fw-bold"><i className="fa-solid fa-bell me-2"></i> Day / Period Notifications</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            <div id="periodNotificationsList"></div>
                            <div id="periodNotificationAdminForm" className="d-none border-top border-secondary pt-3 mt-3">
                                <h6 className="text-warning">Add Notification</h6>
                                <form onSubmit={(event) => window.handlePeriodNotification(event)}>
                                    <div className="row g-2">
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Day</label>
                                            <select id="pnDay" className="form-select form-select-sm bg-dark text-white border-secondary">
                                                <option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option>
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Period</label>
                                            <input id="pnPeriod" type="number" min="1" max="7" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Period" required />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Subject</label>
                                            <input id="pnSubject" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Subject" required />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label small mb-1">Faculty</label>
                                            <input id="pnStaff" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Faculty" required />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small mb-1">Department</label>
                                            <input id="pnDepartment" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Department" required />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small mb-1">Year and Section</label>
                                            <input id="pnYearSection" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Year and Section" required />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small mb-1">Venue</label>
                                            <input id="pnVenue" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Venue" required />
                                        </div>
                                        <div className="col-12 mt-3 text-end">
                                            <button className="btn btn-sm btn-info">Save Notification</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            <div className="modal fade" id="substitutionModal" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-warning fw-bold"><i className="fa-solid fa-people-arrows me-2"></i> Staff Availability &amp; Period Substitution</h5>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <p className="small text-muted mb-3">If a teacher is absent or on other duty, mark them unavailable, then assign an available staff member to cover a specific period — <strong>for today only</strong>. It automatically reverts to the original timetable from tomorrow onward.</p>

                            <ul className="nav nav-tabs border-secondary mb-3" id="substTabs">
                                <li className="nav-item">
                                    <button className="nav-link active text-info" data-bs-toggle="tab" data-bs-target="#tabStaffAvailability">Staff Availability</button>
                                </li>
                                <li className="nav-item">
                                    <button className="nav-link text-warning" data-bs-toggle="tab" data-bs-target="#tabArrangeSub">Arrange Substitution (Today)</button>
                                </li>
                                {!isAdmin && (
                                    <li className="nav-item" id="myLeaveTabLi">
                                        <button id="myLeaveTabBtn" className="nav-link text-success" data-bs-toggle="tab" data-bs-target="#tabMyLeave">My Leave &amp; Coverage Requests</button>
                                    </li>
                                )}
                            </ul>

                            <div className="tab-content">

                                <div className="tab-pane fade show active" id="tabStaffAvailability">
                                    <div className="table-responsive" style={{ maxHeight: "320px", overflowY: "auto" }}>
                                        <table className="table table-dark table-striped table-hover text-sm mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Staff Name</th>
                                                    <th>Department</th>
                                                    <th>Status</th>
                                                    <th className="text-center">Toggle</th>
                                                </tr>
                                            </thead>
                                            <tbody id="staffAvailabilityBody">

                                            </tbody>
                                        </table>
                                    </div>
                                </div>


                                <div className="tab-pane fade" id="tabArrangeSub">
                                    <div className="alert alert-secondary py-2 px-3 small mb-3">
                                        <i className="fa-solid fa-calendar-day me-1"></i> Applying to: <strong id="substTodayLabel">Today</strong>, section <strong id="substSectionLabel"></strong> — change the filter at the top of the page first if you need a different section.
                                    </div>
                                    <form id="arrangeSubForm" onSubmit={(event) => window.handleArrangeSubstitution(event)} >
                                        <div className="mb-2">
                                            <label className="form-label small">Period to Cover</label>
                                            <select id="subPeriodSelect" className="form-select form-select-sm bg-dark text-white border-secondary" onChange={() => window.onSubPeriodChange()} required>

                                            </select>
                                        </div>
                                        <div className="mb-2">
                                            <label className="form-label small">Original Faculty</label>
                                            <input type="text" id="subOriginalFaculty" className="form-control form-control-sm bg-dark text-white border-secondary" readOnly />
                                        </div>
                                        <div className="mb-2">
                                            <label className="form-label small">Substitute Faculty (only staff marked Available are listed)</label>
                                            <select id="subSubstituteFaculty" className="form-select form-select-sm bg-dark text-white border-secondary" required>

                                            </select>
                                        </div>
                                        <div className="row g-2 mb-2">
                                            <div className="col-md-3">
                                                <label className="form-label small">Department</label>
                                                <input type="text" id="subDepartment" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Department" />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label small">Year</label>
                                                <input type="text" id="subYear" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Year" />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label small">Section</label>
                                                <input type="text" id="subSection" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Section" />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label small">Venue</label>
                                                <input type="text" id="subVenue" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Venue" />
                                            </div>
                                        </div>
                                        <div className="mb-2">
                                            <label className="form-label small">Reason (optional)</label>
                                            <input type="text" id="subReason" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="e.g. On leave, Placement duty" />
                                        </div>
                                        <button type="submit" className="btn btn-sm btn-warning fw-bold"><i className="fa-solid fa-right-left me-1"></i> Assign Substitute for Today</button>
                                    </form>

                                    <hr className="border-secondary" />
                                    <h6 className="fw-bold text-info mb-2">Today's Active Substitutions (this section)</h6>
                                    <ul className="list-group list-group-flush rounded bg-dark" id="todaysSubstitutionsList">

                                    </ul>
                                </div>


                                <div className="tab-pane fade" id="tabMyLeave">
                                    <div className="mb-2">
                                        <label className="form-label small">Who are you in the staff directory?</label>
                                        <select id="myStaffIdentitySelect" className="form-select form-select-sm bg-dark text-white border-secondary" onChange={() => window.onStaffIdentityChange()} >
                                            <option value="">-- Select your name --</option>

                                        </select>
                                        <div className="form-text text-muted">Remembered for next time you log in.</div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small">Reason (optional)</label>
                                        <input type="text" id="leaveReasonInput" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="e.g. Medical leave, personal work" />
                                        <div id="leaveActionBtnGroup" className="mt-2 d-flex gap-2 flex-wrap align-items-center"></div>
                                    </div>

                                    <hr className="border-secondary" />
                                    <h6 className="fw-bold text-success mb-2"><i className="fa-solid fa-bell me-1"></i> Today's Leave &amp; Coverage Activity</h6>
                                    <p className="small text-muted mb-2">Everyone logged in (in another browser tab) sees these updates instantly — request to cover an open period, or accept/decline requests for your own periods.</p>
                                    <ul className="list-group list-group-flush rounded bg-dark" id="coverageRequestsList">

                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="adminAbsentNotifModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-info fw-bold"><i className="fa-solid fa-bell me-2"></i> Absent Faculty Today</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            <div id="adminAbsentNotifList"></div>
                        </div>
                        <div className="modal-footer border-secondary">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="toast-container">
                <div id="seceToast" className="toast sece-toast" role="alert">
                    <div className="toast-header bg-transparent  border-0">
                        <i className="fa-solid fa-circle-check text-success me-2"></i>
                        <strong className="me-auto" id="toastTitle">Notification Sent</strong>
                        <small className="text-muted" id="toastTime">Just now</small>
                        <button type="button" className="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                    </div>
                    <div className="toast-body small" id="toastBody">
                        Message delivered successfully to registered Email & Phone numbers.
                    </div>
                </div>
            </div>


            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>


            <script src="/js/frontend_app.js?v=4"></script>
            <script src="/js/theme.js"></script>

            <div className="modal fade" id="studentDetailsOnlyModal" tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-info fw-bold"><i className="fa-solid fa-clipboard-list me-2"></i>View Students Details</h5>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="alert alert-info py-2 small">This view is access to Admin and Class Advisor only. It contains sensitive student login details.</div>

                            <div className="d-flex justify-content-end mb-3">
                                <div className="input-group" style={{ maxWidth: '300px' }}>
                                    <input type="text" id="studentSearchInput" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="Enter Register No" />
                                    <button className="btn btn-sm btn-outline-info" type="button" onClick={() => {
                                        const q = document.getElementById('studentSearchInput').value;
                                        window.openStudentDetailsModal(q);
                                    }}><i className="fa-solid fa-search"></i> Search</button>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-dark table-striped table-hover align-middle small">
                                    <thead><tr><th>Roll No</th><th>Name</th><th>Class / Section</th><th>Personal Email</th><th>College Mail ID</th><th>Mobile</th><th>Parent Mobile 1</th><th>Parent Mobile 2</th><th>Username</th><th>Password</th><th>Action</th></tr></thead>
                                    <tbody id="studentDetailsOnlyBody"></tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer border-secondary">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>

                        {/* Edit Student Modal */}
            <div className="modal fade" id="editStudentModal" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary d-flex justify-content-between align-items-center">
                            <h5 className="modal-title text-warning fw-bold mb-0"><i className="fa-solid fa-user-pen me-2"></i> Edit Student</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            <div id="editStudentAlert" className="alert d-none small py-2"></div>
                            <form id="editStudentForm" onSubmit={(e) => { e.preventDefault(); try { window.submitEditStudentForm(e); } catch(err) { alert("Error submitting form: " + err.message); } }}>
                                <input type="hidden" id="esId" />
                                <div className="row g-2 mb-2">
                                    <div className="col-md-4">
                                        <label className="form-label small">First Name <span className="text-danger">*</span></label>
                                        <input type="text" id="esFirstName" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small">Last Name <span className="text-danger">*</span></label>
                                        <input type="text" id="esLastName" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small">Register No <span className="text-danger">*</span></label>
                                        <input type="text" id="esRegNo" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                </div>
                                <div className="row g-2 mb-2">
                                    <div className="col-md-6">
                                        <label className="form-label small">Personal Email</label>
                                        <input type="email" id="esEmail" className="form-control form-control-sm bg-dark text-white" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small">College Email <span className="text-danger">*</span></label>
                                        <input type="email" id="esCollegeEmail" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                </div>
                                <div className="row g-2 mb-2">
                                    <div className="col-md-3">
                                        <label className="form-label small">Student Phone</label>
                                        <input type="tel" id="esPhone" className="form-control form-control-sm bg-dark text-white" />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small">Parent Phone 1 <span className="text-danger">*</span></label>
                                        <input type="tel" id="esParentPhone1" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small">Parent Phone 2</label>
                                        <input type="tel" id="esParentPhone2" className="form-control form-control-sm bg-dark text-white" />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small">Resident Type <span className="text-danger">*</span></label>
                                        <select id="esResidentType" className="form-select form-select-sm bg-dark text-white border-secondary" required onChange={(e) => {
                                            const el = document.getElementById('esHostelFields');
                                            if (el) el.classList.toggle('d-none', e.target.value !== 'Hosteller');
                                        }}>
                                            <option value="">Select...</option>
                                            <option value="Hosteller">Hosteller</option>
                                            <option value="Day Scholar">Day Scholar</option>
                                        </select>
                                    </div>
                                </div>
                                <div id="esHostelFields" className="row g-2 mb-2 d-none">
                                    <div className="col-md-6">
                                        <label className="form-label small">Hostel Block</label>
                                        <input type="text" id="esHostelBlock" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="e.g. A Block" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small">Room Number</label>
                                        <input type="text" id="esRoomNumber" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="e.g. 204" />
                                    </div>
                                </div>
                                <div className="row g-2 mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label small">Department <span className="text-danger">*</span></label>
                                        <input type="text" id="esDept" list="deptDatalist" className="form-control form-control-sm bg-dark text-white border-secondary" required autoComplete="off" />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small">Course <span className="text-danger">*</span></label>
                                        <input type="text" id="esCourse" list="courseDatalist" className="form-control form-control-sm bg-dark text-white border-secondary" required autoComplete="off" />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small">Section <span className="text-danger">*</span></label>
                                        <input type="text" id="esSection" list="sectionDatalist" className="form-control form-control-sm bg-dark text-white border-secondary" required autoComplete="off" />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small">Semester <span className="text-danger">*</span></label>
                                        <input type="number" id="esSemester" className="form-control form-control-sm bg-dark text-white" required min="1" max="8" />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-warning w-100 fw-bold"><i className="fa-solid fa-save me-1"></i> Update Student</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            {/* Manage Students Modal */}
            <div className="modal fade" id="manageStudentsModal" tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary d-flex justify-content-between align-items-center">
                            <h5 className="modal-title text-info fw-bold mb-0"><i className="fa-solid fa-users me-2"></i> Manage Students</h5>
                            <div className="d-flex align-items-center gap-2">
                                <input type="file" id="importAdminStudentExcelInput" accept=".xlsx, .xls, .csv" style={{ display: "none" }} onChange={(e) => window.importStudentExcel && window.importStudentExcel(e, true)} />
                                <button type="button" className="btn btn-sm btn-outline-success" onClick={() => document.getElementById('importAdminStudentExcelInput').click()} style={{ whiteSpace: 'nowrap' }}>
                                    <i className="fa-solid fa-file-excel me-1"></i> Import Excel
                                </button>
                                <button type="button" className="btn-close btn-close-white ms-2" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div id="manageStudentsAlert" className="alert d-none small py-2"></div>
                            <form id="manageStudentsForm" onSubmit={(e) => { e.preventDefault(); try { window.submitManageStudentForm(e); } catch(err) { alert("Error submitting form: " + err.message); } }}>
                                <div className="row g-2 mb-2">
                                    <div className="col-md-4">
                                        <label className="form-label small">First Name <span className="text-danger">*</span></label>
                                        <input type="text" id="msFirstName" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small">Last Name <span className="text-danger">*</span></label>
                                        <input type="text" id="msLastName" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small">Register Number <span className="text-danger">*</span></label>
                                        <input type="text" id="msRegNo" className="form-control form-control-sm bg-dark text-white" required placeholder="e.g. 71812423001" />
                                    </div>
                                </div>
                                <div className="row g-2 mb-2">
                                    <div className="col-md-4">
                                        <label className="form-label small">Personal Email <span className="text-danger">*</span></label>
                                        <input type="email" id="msEmail" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small">College Email <span className="text-danger">*</span></label>
                                        <input type="email" id="msCollegeEmail" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small">Mobile Number <span className="text-danger">*</span></label>
                                        <input type="tel" id="msPhone" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                </div>
                                <div className="row g-2 mb-2">
                                    <div className="col-md-4">
                                        <label className="form-label small">Parent 1 Mobile <span className="text-danger">*</span></label>
                                        <input type="tel" id="msParentPhone1" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small">Parent 2 Mobile <span className="text-muted">(Optional)</span></label>
                                        <input type="tel" id="msParentPhone2" className="form-control form-control-sm bg-dark text-white" />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small">Resident Type <span className="text-danger">*</span></label>
                                        <select id="msResidentType" className="form-select form-select-sm bg-dark text-white border-secondary" required>
                                            <option value="">Select...</option>
                                            <option value="Hosteller">Hosteller</option>
                                            <option value="Day Scholar">Day Scholar</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="row g-2 mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label small">Department <span className="text-danger">*</span> <small className="text-muted">(pick or type new)</small></label>
                                        <input type="text" id="msDept" list="deptDatalist" className="form-control form-control-sm bg-dark text-white border-secondary" required placeholder="e.g. CSE" autoComplete="off" />
                                        <datalist id="deptDatalist"></datalist>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small">Class <span className="text-danger">*</span> <small className="text-muted">(pick or type new)</small></label>
                                        <input type="text" id="msCourse" list="courseDatalist" className="form-control form-control-sm bg-dark text-white border-secondary" required placeholder="e.g. BTECH-CSE" autoComplete="off" />
                                        <datalist id="courseDatalist"></datalist>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small">Section <span className="text-danger">*</span> <small className="text-muted">(pick or type new)</small></label>
                                        <input type="text" id="msSection" list="sectionDatalist" className="form-control form-control-sm bg-dark text-white border-secondary" required placeholder="e.g. II CSE C" autoComplete="off" />
                                        <datalist id="sectionDatalist"></datalist>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small">Semester <span className="text-danger">*</span></label>
                                        <input type="number" id="msSemester" className="form-control form-control-sm bg-dark text-white" required min="1" max="8" defaultValue="3" />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-sm btn-primary w-100"><i className="fa-solid fa-plus me-1"></i> Add Student</button>
                            </form>
                            <hr className="border-secondary" />
                            <p className="small text-info fw-bold mb-2"><i className="fa-solid fa-list me-1"></i> Recently Added Students</p>
                            <div className="table-responsive" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                                <table className="table table-dark table-sm table-hover align-middle small text-nowrap mb-0">
                                    <thead className="table-secondary sticky-top">
                                        <tr>
                                            <th>#</th>
                                            <th>Register Number</th>
                                            <th>Name</th>
                                            <th>Personal Email</th>
                                            <th>College Email</th>
                                            <th>Mobile</th>
                                            <th>Parent 1</th>
                                            <th>Parent 2</th>
                                            <th>Department</th>
                                            <th>Class</th>
                                            <th>Section</th>
                                            <th>Sem</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="manageStudentsList">
                                        <tr><td colSpan="13" className="text-center text-muted">No students added yet.</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer border-secondary">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin View Full Faculty Details Modal */}
            <div className="modal fade" id="adminViewFacultyModal" tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-info fw-bold"><i className="fa-solid fa-address-card me-2"></i> Full Faculty Details</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            <div className="table-responsive">
                                <table className="table table-dark table-striped table-hover align-middle small text-nowrap">
                                    <thead>
                                        <tr>
                                            <th>Emp ID</th>
                                            <th>Name</th>
                                            <th>Department</th>
                                            <th>Subject Handling</th>
                                            <th>Personal Email</th>
                                            <th>College Email</th>
                                            <th>Mobile 1</th>
                                            <th>Mobile 2</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="adminViewFacultyBody">
                                        <tr><td colSpan="9" className="text-center text-muted">Loading faculty details...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Manage Faculty Modal */}
            <div className="modal fade" id="manageFacultyModal" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary d-flex justify-content-between align-items-center">
                            <h5 className="modal-title text-warning fw-bold mb-0"><i className="fa-solid fa-chalkboard-user me-2"></i> Add Faculty</h5>
                            <div className="d-flex align-items-center gap-2">
                                <input type="file" id="importFacultyExcelInput" accept=".xlsx, .xls, .csv" style={{ display: "none" }} onChange={(e) => window.importFacultyExcel && window.importFacultyExcel(e)} />
                                <button type="button" className="btn btn-sm btn-outline-success" onClick={() => document.getElementById('importFacultyExcelInput').click()} style={{ whiteSpace: 'nowrap' }}>
                                    <i className="fa-solid fa-file-excel me-1"></i> Import Excel
                                </button>
                                <button type="button" className="btn-close btn-close-white ms-2" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <p className="small text-muted mb-3">Add new faculty members. A backend User account will be automatically provisioned for them.</p>
                            <div id="manageFacultyAlert" className="alert d-none small py-2"></div>
                            <form id="manageFacultyForm" onSubmit={(e) => { e.preventDefault(); window.submitAddFacultyForm(e); }}>
                                <div className="row g-2 mb-2">
                                    <div className="col-md-6">
                                        <label className="form-label small">First Name <span className="text-danger">*</span></label>
                                        <input type="text" id="mfFirstName" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small">Last Name <span className="text-danger">*</span></label>
                                        <input type="text" id="mfLastName" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                </div>
                                <div className="row g-2 mb-2">
                                    <div className="col-md-6">
                                        <label className="form-label small">Personal Email <span className="text-danger">*</span></label>
                                        <input type="email" id="mfPersonalEmail" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small">College Email <span className="text-danger">*</span></label>
                                        <input type="email" id="mfCollegeEmail" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                </div>
                                <div className="row g-2 mb-2">
                                    <div className="col-md-6">
                                        <label className="form-label small">Mobile Number 1 <span className="text-danger">*</span></label>
                                        <input type="tel" id="mfPhone1" className="form-control form-control-sm bg-dark text-white" required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small">Mobile Number 2 <span className="text-muted">(Optional)</span></label>
                                        <input type="tel" id="mfPhone2" className="form-control form-control-sm bg-dark text-white" />
                                    </div>
                                </div>
                                <div className="row g-2 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label small">Department <span className="text-danger">*</span></label>
                                        <input type="text" id="mfDept" className="form-control form-control-sm bg-dark text-white" required placeholder="e.g. CSE" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small">Subject Handling <span className="text-danger">*</span></label>
                                        <input type="text" id="mfSubjectHandling" className="form-control form-control-sm bg-dark text-white" required placeholder="e.g. Software Engineering" />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-sm btn-warning w-100"><i className="fa-solid fa-plus me-1"></i> Add Faculty</button>
                            </form>
                            <hr className="border-secondary my-4" />
                            <p className="small text-muted text-center mb-0">Use the <strong>"View Full Faculty Details"</strong> option in the navigation bar to manage existing faculty.</p>
                        </div>
                        <div className="modal-footer border-secondary">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="timetableBuilderModal" tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary d-flex align-items-center justify-content-between">
                            <h5 className="modal-title text-primary fw-bold"><i className="fa-solid fa-table me-2"></i> Timetable Builder</h5>
                            <div>
                                <input type="file" id="importExcelInput" accept=".xlsx, .xls, .csv" style={{ display: "none" }} onChange={(e) => window.importTimetableExcel && window.importTimetableExcel(e)} />
                                <button type="button" className="btn btn-sm btn-outline-success me-3" onClick={() => document.getElementById('importExcelInput').click()}>
                                    <i className="fa-solid fa-file-excel me-1"></i> Import Excel
                                </button>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <form id="timetableBuilderForm" onSubmit={(e) => { e.preventDefault(); if (window.saveTimetableBuilder) window.saveTimetableBuilder(); }}>
                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label small text-muted">Class Advisor</label>
                                        <input type="text" id="ttBuildAdvisor" className="form-control bg-dark text-white border-secondary" placeholder="e.g. Ms.J.Keerthika, AP/CSE" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small text-muted">Class Tutors</label>
                                        <input type="text" id="ttBuildTutors" className="form-control bg-dark text-white border-secondary" placeholder="e.g. Ms.B.Gomathi, Mr.K.Sabarigirivason" />
                                    </div>
                                </div>
                                <p className="small text-muted mb-2">Enter Subject / Staff / Venue. Format: <code>Subject, Staff, Venue</code> or just type it in. Leave blank for FREE.</p>
                                <div className="table-responsive">
                                    <table className="table table-dark table-bordered border-secondary table-sm text-center align-middle" style={{ tableLayout: "fixed" }}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: "90px" }}>Day</th>
                                                <th>Period 1<input type="text" id="ttBuildP1" className="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="08.40 - 09.40" /></th>
                                                <th>Period 2<input type="text" id="ttBuildP2" className="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="09.40 - 10.40" /></th>
                                                <th>Period 3<input type="text" id="ttBuildP3" className="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="11.00 - 12.00" /></th>
                                                <th className="text-warning">Tea Break<input type="text" id="ttBuildTea" className="form-control form-control-sm bg-dark text-white border-secondary text-center text-warning mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="12.00 - 12.15" /></th>
                                                <th>Period 4<input type="text" id="ttBuildP4" className="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="12.15 - 01.15" /></th>
                                                <th>Period 5<input type="text" id="ttBuildP5" className="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="01.15 - 02.00" /></th>
                                                <th className="text-warning">Lunch Break<input type="text" id="ttBuildLunch" className="form-control form-control-sm bg-dark text-white border-secondary text-center text-warning mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="02.00 - 02.40" /></th>
                                                <th className="text-warning">Activity<input type="text" id="ttBuildAct" className="form-control form-control-sm bg-dark text-white border-secondary text-center text-warning mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="02.40 - 03.30" /></th>
                                                <th>Period 6<input type="text" id="ttBuildP6" className="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="03.30 - 04.20" /></th>
                                                <th>Period 7<input type="text" id="ttBuildP7" className="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="04.20 - 05.10" /></th>
                                            </tr>
                                        </thead>
                                        <tbody id="ttBuilderGrid">
                                            {/* Generated by JS */}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="d-flex justify-content-end gap-2 mt-3">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" className="btn btn-success"><i className="fa-solid fa-floppy-disk me-1"></i> Save Built Timetable</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="adminViewEditTimetableModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-pink fw-bold"><i className="fa-solid fa-table-list me-2"></i> View / Edit Timetable</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            <form id="adminViewEditTimetableForm" onSubmit={(e) => { e.preventDefault(); if (window.submitAdminViewEditTimetable) window.submitAdminViewEditTimetable(); }}>
                                <div className="mb-3">
                                    <label className="form-label small text-muted">Batch Start Year <span className="text-danger">*</span></label>
                                    <input type="number" id="avtBatchInput" className="form-control bg-dark text-white border-secondary" min="2020" max="3000" defaultValue="2023" required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-muted">Department <span className="text-danger">*</span></label>
                                    <select id="avtDeptSelect" className="form-select bg-dark text-white border-secondary" required onChange={(e) => window.avtDeptChanged && window.avtDeptChanged(e.target.value)}>
                                        <option value="">Select Department...</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-muted">Section <span className="text-danger">*</span></label>
                                    <select id="avtSectionSelect" className="form-select bg-dark text-white border-secondary" required>
                                        <option value="">Select Department First...</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-muted">Year <span className="text-danger">*</span></label>
                                    <select id="avtYearSelect" className="form-select bg-dark text-white border-secondary" required onChange={(e) => {
                                        const y = parseInt(e.target.value);
                                        const semSelect = document.getElementById('avtSemesterSelect');
                                        if (semSelect && !isNaN(y)) {
                                            semSelect.value = (y * 2 - 1).toString(); // e.g. Year 1 -> Sem 1
                                        }
                                    }}>
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-muted">Semester <span className="text-danger">*</span></label>
                                    <select id="avtSemesterSelect" className="form-select bg-dark text-white border-secondary" required>
                                        <option value="1">I Semester</option>
                                        <option value="2">II Semester</option>
                                        <option value="3">III Semester</option>
                                        <option value="4">IV Semester</option>
                                        <option value="5">V Semester</option>
                                        <option value="6">VI Semester</option>
                                        <option value="7">VII Semester</option>
                                        <option value="8">VIII Semester</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-pink w-100 mt-2 text-white" style={{ backgroundColor: 'var(--bs-pink, #d63384)' }}>View Timetable</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="editAyModal" tabIndex="-1">
                <div className="modal-dialog modal-sm modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h6 className="modal-title text-info fw-bold"><i className="fa-solid fa-calendar-days me-2"></i> Edit Academic Year</h6>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            <label className="form-label small text-muted">Start Year</label>
                            <input type="number" id="ayStartYearInput" className="form-control bg-dark text-white border-secondary" min="2020" max="3000" defaultValue="2026" />
                            <small className="text-muted mt-2 d-block">End year will be calculated automatically.</small>
                        </div>
                        <div className="modal-footer border-secondary">
                            <button type="button" className="btn btn-sm btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-sm btn-success" onClick={() => window.saveAcademicYear && window.saveAcademicYear()}>Save changes</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="myTimetableModal" tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary d-flex align-items-center justify-content-between">
                            <h5 className="modal-title text-info fw-bold"><i className="fa-solid fa-calendar-user me-2"></i> Feed Your Timetable</h5>
                            <div>
                                <input type="file" id="importExcelInputFaculty" accept=".xlsx, .xls, .csv" style={{ display: "none" }} onChange={(e) => window.importFacultyTimetableExcel && window.importFacultyTimetableExcel(e)} />
                                <button type="button" className="btn btn-sm btn-outline-success me-3" onClick={() => document.getElementById('importExcelInputFaculty').click()}>
                                    <i className="fa-solid fa-file-excel me-1"></i> Import Excel
                                </button>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body p-3">
                            <form id="myTimetableForm" onSubmit={(e) => { e.preventDefault(); if (window.saveMyTimetable) window.saveMyTimetable(); }}>
                                <p className="small text-muted mb-2">Enter Subject / Class / Venue. Format: <code>Subject, Class, Venue</code> or just type it in. Leave blank for FREE.</p>
                                <div className="table-responsive">
                                    <table className="table table-dark table-bordered border-secondary table-sm text-center align-middle" style={{ tableLayout: "fixed" }}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: "90px" }}>Day</th>
                                                <th>Period 1<input type="text" id="myTtP1" className="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="08.40 - 09.40" /></th>
                                                <th>Period 2<input type="text" id="myTtP2" className="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="09.40 - 10.40" /></th>
                                                <th>Period 3<input type="text" id="myTtP3" className="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="11.00 - 12.00" /></th>
                                                <th className="text-warning">Tea Break<input type="text" id="myTtTea" className="form-control form-control-sm bg-dark text-white border-secondary text-center text-warning mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="12.00 - 12.15" /></th>
                                                <th>Period 4<input type="text" id="myTtP4" className="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="12.15 - 01.15" /></th>
                                                <th>Period 5<input type="text" id="myTtP5" className="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="01.15 - 02.00" /></th>
                                                <th className="text-warning">Lunch Break<input type="text" id="myTtLunch" className="form-control form-control-sm bg-dark text-white border-secondary text-center text-warning mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="02.00 - 02.40" /></th>
                                                <th className="text-warning">Activity<input type="text" id="myTtAct" className="form-control form-control-sm bg-dark text-white border-secondary text-center text-warning mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="02.40 - 03.30" /></th>
                                                <th>Period 6<input type="text" id="myTtP6" className="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="03.30 - 04.20" /></th>
                                                <th>Period 7<input type="text" id="myTtP7" className="form-control form-control-sm bg-dark text-white border-secondary text-center mt-1" style={{ fontSize: "0.75rem", padding: "0.2rem" }} defaultValue="04.20 - 05.10" /></th>
                                            </tr>
                                        </thead>
                                        <tbody id="myTimetableBody">
                                            {/* Generated by JS */}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="d-flex justify-content-end gap-2 mt-3">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" className="btn btn-success"><i className="fa-solid fa-floppy-disk me-1"></i> Save Timetable</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal fade" id="adminFacultyDetailsModal" tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-warning fw-bold"><i className="fa-solid fa-address-card me-2"></i> Enrolled Faculty Details</h5>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body p-0">
                            <div className="d-flex mb-3 gap-2 px-3 pt-3">
                                <div className="input-group">
                                    <span className="input-group-text bg-dark text-secondary border-secondary"><i className="fa-solid fa-magnifying-glass"></i></span>
                                    <input type="text" className="form-control bg-dark text-white border-secondary" id="adminFacultySearchInput" placeholder="Enter faculty username (e.g., fkeerj012345) to search..." onKeyDown={(e) => { if (e.key === 'Enter') window.searchAdminFacultyDetails?.(); }} />
                                    <button className="btn btn-primary" type="button" onClick={() => window.searchAdminFacultyDetails?.()}>Search</button>
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-dark table-striped table-hover align-middle mb-0 text-center">
                                    <thead className="sticky-top" style={{ backgroundColor: "#1e1e1e" }}>
                                        <tr>
                                            <th>Name</th>
                                            <th>Department</th>
                                            <th>Subject Handling</th>
                                            <th>Personal Email</th>
                                            <th>College Email</th>
                                            <th>Mobile 1</th>
                                            <th>Mobile 2</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="adminFacultyDetailsBody">
                                        <tr><td colSpan="7" className="text-center text-muted py-4">No faculty enrolled yet.</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="manageAnnouncementsModal" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-success fw-bold"><i className="fa-solid fa-bullhorn me-2"></i> Manage Announcements</h5>
                            <div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="mb-4">
                                <label className="form-label text-warning small">Post New Announcement</label>
                                <div className="input-group">
                                    <input type="text" id="newAnnouncementInput" className="form-control bg-dark text-white border-secondary" placeholder="e.g., Tomorrow is a holiday due to the festival..." />
                                    <button className="btn btn-success" type="button" onClick={() => window.addAnnouncement && window.addAnnouncement()}>Post</button>
                                </div>
                            </div>
                            <h6 className="text-light fw-bold border-bottom border-secondary pb-2 mb-3">Active Announcements</h6>
                            <div className="table-responsive">
                                <table className="table table-dark table-striped table-hover align-middle mb-0 text-center">
                                    <thead className="sticky-top" style={{ backgroundColor: "#1e1e1e" }}>
                                        <tr>
                                            <th style={{ width: "80%" }}>Announcement Text</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="manageAnnouncementsBody">
                                        <tr><td colSpan="2" className="text-center text-muted py-4">Loading announcements...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="shareAppModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title fw-bold text-info"><i className="fa-solid fa-share-nodes me-2"></i> Share App</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body text-center">
                            <p className="text-muted small mb-3">Scan this QR Code to directly open the login page on your mobile device:</p>
                            <div className="bg-white p-2 d-inline-block rounded mb-3 shadow" id="qrCodeContainer">
                                <img src="" id="loginQrCodeImage" alt="Login QR Code" style={{ width: "160px", height: "160px", objectFit: "contain" }} />
                            </div>
                            
                            <div className="input-group input-group-sm mb-4 mx-auto" style={{maxWidth: "300px"}}>
                                <input type="text" id="shareAppLinkInput" className="form-control bg-dark text-white border-secondary" readOnly />
                                <button className="btn btn-outline-secondary" type="button" onClick={() => {
                                    const link = document.getElementById('shareAppLinkInput').value;
                                    navigator.clipboard.writeText(link);
                                    alert('Link copied!');
                                }}>
                                    <i className="fa-solid fa-copy"></i>
                                </button>
                            </div>

                            <p className="text-muted small mb-3">Or share via link:</p>
                            <div className="d-flex justify-content-center gap-3">
                                <button className="btn btn-outline-success rounded-circle" style={{width: "50px", height: "50px"}} onClick={() => window.shareViaWhatsApp && window.shareViaWhatsApp()} title="WhatsApp">
                                    <i className="fa-brands fa-whatsapp fs-4"></i>
                                </button>
                                <button className="btn btn-outline-primary rounded-circle" style={{width: "50px", height: "50px"}} onClick={() => window.shareViaMessage && window.shareViaMessage()} title="Message (SMS)">
                                    <i className="fa-solid fa-comment-sms fs-4"></i>
                                </button>
                                <button className="btn btn-outline-light rounded-circle" style={{width: "50px", height: "50px"}} onClick={() => window.shareViaWebAPI && window.shareViaWebAPI()} title="More Options / Copy Link">
                                    <i className="fa-solid fa-share fs-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
}


