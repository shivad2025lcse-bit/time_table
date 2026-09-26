file_path = r'd:\Java_project\frontend\src\DashboardLayout.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Step 1: Add the button in the top navbar for Faculty
btn_html = '''
                                <button id="manageClassTtBtn" className={tn btn-sm btn-outline-primary align-items-center gap-1 } type="button" data-bs-toggle="modal" data-bs-target="#manageClassTtModal" onClick={() => window.initManageClassTt && window.initManageClassTt()}>
                                    <i className="fa-solid fa-users-rectangle"></i> Manage Class TT
                                </button>
'''
# Insert after facultyDetailsBtn
idx = text.find('<button id="facultyDetailsBtn"')
if idx != -1:
    end_idx = text.find('</button>', idx) + 9
    text = text[:end_idx] + '\n' + btn_html + text[end_idx:]

# Step 2: Add the Modal markup at the end of the file before </div></div></>
modal_html = '''
            <div className="modal fade" id="manageClassTtModal" tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content bg-dark text-white border-secondary">
                        <div className="modal-header border-secondary d-flex align-items-center justify-content-between">
                            <h5 className="modal-title text-info fw-bold"><i className="fa-solid fa-users-rectangle me-2"></i> Manage Student Class Timetable</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body p-4">
                            <div className="row mb-4 align-items-end">
                                <div className="col-md-3">
                                    <label className="form-label text-muted small">Year</label>
                                    <select id="mcYearSelect" className="form-select bg-dark text-white border-secondary">
                                        <option value="I">I</option>
                                        <option value="II" selected>II</option>
                                        <option value="III">III</option>
                                        <option value="IV">IV</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label text-muted small">Department</label>
                                    <select id="mcDeptSelect" className="form-select bg-dark text-white border-secondary">
                                        <option value="CSE" selected>CSE</option>
                                        <option value="IT">IT</option>
                                        <option value="ECE">ECE</option>
                                        <option value="EEE">EEE</option>
                                        <option value="MECH">MECH</option>
                                        <option value="AIML">AIML</option>
                                        <option value="AIDS">AIDS</option>
                                        <option value="CSBS">CSBS</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label text-muted small">Section</label>
                                    <select id="mcSecSelect" className="form-select bg-dark text-white border-secondary">
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C" selected>C</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <button className="btn btn-outline-info w-100" onClick={() => window.loadManageClassTt && window.loadManageClassTt()}>
                                        <i className="fa-solid fa-magnifying-glass me-1"></i> Load Timetable
                                    </button>
                                </div>
                            </div>
                            
                            <div id="mcTtGridContainer" className="d-none">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="text-warning mb-0" id="mcTtTitle">Editing: II CSE C</h6>
                                    <div>
                                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => window.mcAddPeriodCol && window.mcAddPeriodCol()}>
                                            <i className="fa-solid fa-plus me-1"></i> Add Period
                                        </button>
                                    </div>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-dark table-bordered border-secondary text-center align-middle" id="mcTtTable">
                                        <thead id="mcTtHead">
                                        </thead>
                                        <tbody id="mcTtBody">
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer border-secondary">
                            <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-warning fw-bold" onClick={() => window.saveManageClassTt && window.saveManageClassTt()}>
                                <i className="fa-solid fa-floppy-disk me-1"></i> Save Class Timetable
                            </button>
                        </div>
                    </div>
                </div>
            </div>
'''
# Insert before the last </div>
last_div = text.rfind('</div>')
if last_div != -1:
    text = text[:last_div] + modal_html + text[last_div:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('DashboardLayout updated for Manage Class TT modal!')
