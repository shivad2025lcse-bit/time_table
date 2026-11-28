// quiz.js - AI-Evaluated Class Quizzes (Fixed & Enhanced)

// ── Initialisation ───────────────────────────────────────────────────────────
function initQuizSystem() {
    if (document.getElementById('facultyQuizModal')) return; // already injected
    injectQuizModals();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuizSystem);
} else {
    initQuizSystem();
}

// ── Modal HTML ───────────────────────────────────────────────────────────────
function injectQuizModals() {
    const html = `
    <!-- ============================================================ -->
    <!--  FACULTY: Manage Quizzes (Capacity Connect)                  -->
    <!-- ============================================================ -->
    <style>
        .cc-modal-content {
            background-color: #120326 !important;
            color: #ffffff;
            border: 1px solid #3b0764 !important;
            border-radius: 12px;
            overflow: hidden;
        }
        .cc-modal-header {
            background: linear-gradient(90deg, #1a0536, #14052e) !important;
            border-bottom: 1px solid #3b0764 !important;
            padding: 1rem 1.5rem;
        }
        .cc-title-brain {
            color: #fbbf24;
            font-size: 1.5rem;
            margin-right: 10px;
        }
        .cc-nav-tabs {
            border-bottom: 1px solid #3b0764;
            background-color: #1a0536;
            padding: 0 1rem;
        }
        .cc-nav-link {
            color: #e2e8f0;
            background: transparent;
            border: none;
            padding: 0.75rem 1.5rem;
            font-weight: 600;
            font-size: 0.95rem;
            opacity: 0.7;
        }
        .cc-nav-link:hover {
            opacity: 1;
        }
        .cc-nav-link.active {
            background-color: #ffffff !important;
            color: #000000 !important;
            border-radius: 6px 6px 0 0;
            opacity: 1;
        }
        .cc-form-label {
            font-size: 0.85rem;
            font-weight: 600;
            color: #e2e8f0;
            margin-bottom: 0.4rem;
        }
        .cc-form-control {
            background-color: #0a041f !important;
            border: 1px solid #4c1d95 !important;
            color: #ffffff !important;
            border-radius: 6px;
        }
        .cc-form-control:focus {
            border-color: #8b5cf6 !important;
            box-shadow: 0 0 0 0.25rem rgba(139, 92, 246, 0.25) !important;
        }
        .cc-btn-purple {
            background-color: #4c1d95 !important;
            color: #ffffff !important;
            border: none;
            border-radius: 6px;
        }
        .cc-btn-purple:hover {
            background-color: #5b21b6 !important;
        }
        .cc-btn-gray {
            background-color: #334155 !important;
            color: #ffffff !important;
            border: none;
            border-radius: 6px;
        }
        .cc-btn-gray:hover {
            background-color: #475569 !important;
        }
        .cc-q-card {
            background-color: #0a041f !important;
            border: 1px solid #4c1d95 !important;
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 1rem;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cc-q-card:hover {
            border-color: #8b5cf6 !important;
        }
        .cc-voice-bar {
            background: linear-gradient(90deg, rgba(16, 185, 129, 0.12), rgba(139, 92, 246, 0.16));
            border: 1px solid rgba(139, 92, 246, 0.45);
            border-radius: 10px;
            padding: 0.75rem 1rem;
            margin-bottom: 1rem;
        }
        .cc-mic-pulse {
            animation: ccMicPulse 1.2s infinite;
        }
        @keyframes ccMicPulse {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .sq-challenge-card {
            background: linear-gradient(135deg, #2b1055, #43178a);
            border: 2px solid #7c3aed;
            border-bottom: 6px solid #4c1d95;
            border-radius: 16px;
            padding: 1.1rem 1.35rem;
            margin-bottom: 0.95rem;
            transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
        }
        .sq-challenge-card:hover {
            transform: translateY(-3px);
            border-color: #fbbf24;
            box-shadow: 0 10px 24px rgba(124, 58, 237, 0.35);
        }
        .sq-blooket-stage {
            background: radial-gradient(circle at top right, #4f1d96 0%, #2a0a5e 55%, #19063c 100%);
            border: 2px solid #6d28d9;
            border-radius: 18px;
            padding: 1.25rem;
        }
        .sq-blooket-hud {
            background: rgba(15, 5, 38, 0.85);
            border: 2px solid #5b21b6;
            border-radius: 14px;
            padding: 0.75rem 1rem;
        }
        .sq-blooket-qbox {
            background: #ffffff;
            color: #1e1b4b;
            border-radius: 16px;
            border-bottom: 6px solid #cbd5e1;
            padding: 1.5rem 1.75rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.28);
        }
        .sq-blooket-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-top: 16px;
        }
        @media (max-width: 640px) {
            .sq-blooket-grid { grid-template-columns: 1fr; }
        }
        .sq-opt-tile {
            position: relative;
            border-radius: 14px;
            padding: 18px 20px;
            cursor: pointer;
            transition: transform 0.1s ease, box-shadow 0.15s ease, filter 0.15s ease;
            display: flex;
            align-items: center;
            gap: 14px;
            min-height: 78px;
            color: #ffffff;
            font-weight: 700;
            font-size: 1.04rem;
            border: 3px solid rgba(255, 255, 255, 0.22);
            user-select: none;
        }
        .sq-opt-tile:hover {
            transform: translateY(-2px);
            filter: brightness(1.06);
        }
        .sq-opt-tile:active {
            transform: translateY(3px);
        }
        .sq-blooket-tile-0 { background: #e11d48; border-bottom: 7px solid #9f1239; }
        .sq-blooket-tile-1 { background: #2563eb; border-bottom: 7px solid #1e40af; }
        .sq-blooket-tile-2 { background: #d97706; border-bottom: 7px solid #92400e; }
        .sq-blooket-tile-3 { background: #059669; border-bottom: 7px solid #065f46; }
        .sq-opt-shape {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: rgba(0, 0, 0, 0.22);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 1.15rem;
            flex-shrink: 0;
        }
        .sq-opt-tile.selected {
            border: 3px solid #fde047 !important;
            box-shadow: 0 0 0 4px rgba(253, 224, 71, 0.45), 0 10px 24px rgba(0, 0, 0, 0.35);
            transform: translateY(-2px);
        }
        .sq-opt-selected-badge {
            margin-left: auto;
            background: #fde047;
            color: #1e1b4b;
            font-size: 0.72rem;
            font-weight: 800;
            padding: 3px 9px;
            border-radius: 999px;
            display: none;
        }
        .sq-opt-tile.selected .sq-opt-selected-badge {
            display: inline-block;
        }
        .sq-play-3d-btn {
            background: linear-gradient(180deg, #10b981, #059669);
            color: #ffffff;
            border: none;
            border-bottom: 5px solid #065f46;
            border-radius: 12px;
            font-weight: 800;
            padding: 10px 22px;
            transition: transform 0.1s ease;
        }
        .sq-play-3d-btn:hover { color: #ffffff; filter: brightness(1.07); }
        .sq-play-3d-btn:active { transform: translateY(3px); border-bottom-width: 2px; }
        .sq-q-pill {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            border: 2px solid #6d28d9;
            background: #1a0536;
            color: #e2e8f0;
            font-weight: 800;
            font-size: 0.82rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }
        .sq-q-pill.active {
            border-color: #fde047;
            background: #f59e0b;
            color: #1e1b4b;
        }
        .sq-q-pill.answered {
            border-color: #34d399;
            background: #059669;
            color: #ffffff;
        }
        .sq-confetti-piece {
            position: fixed;
            top: -10px;
            width: 9px;
            height: 14px;
            z-index: 10060;
            pointer-events: none;
            animation: sqConfettiFall 2.4s linear forwards;
        }
        @keyframes sqConfettiFall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(540deg); opacity: 0; }
        }
        /* Shared semantic defaults + Light Theme support for ALL Quiz Modals */
        .cc-level-badge {
            white-space: normal !important;
            word-break: break-word;
            line-height: 1.2 !important;
            font-size: 0.72rem !important;
            padding: 5px 8px !important;
            max-width: 100%;
            display: inline-block;
            text-align: center;
        }
        .cc-dash-card {
            background: #0a041f;
            border: 1px solid #6d28d9;
            color: #e2e8f0;
        }
        .cc-metric-green { background: #0d1f12; border: 1px solid #10b981; min-width: 0; overflow: hidden; }
        .cc-metric-blue { background: #0d1a3a; border: 1px solid #3b82f6; min-width: 0; overflow: hidden; }
        .cc-metric-amber { background: #1a1200; border: 1px solid #eab308; min-width: 0; overflow: hidden; }
        .cc-metric-purple { background: #120326; border: 1px solid #8b5cf6; min-width: 0; overflow: hidden; }
        .cc-metric-red { background: #1a0000; border: 1px solid #ef4444; min-width: 0; overflow: hidden; }
        .cc-sub-strip { background: #0a041f; border: 1px solid #3b0764; }
        .cc-analytics-table { color: #e0e0ff; background: #0d0d2e; }
        .cc-analytics-table thead { background: #1a003a; }
        .cc-weak-card { background: #1a0000; border: 1px solid #dc2626; }
        .cc-weak-card .card-header { background: #2d0000; }
        .cc-detail-answer-card { background: #1e1e1e; }
        body[data-theme="light"] .cc-modal-content,
        html[data-theme="light"] .cc-modal-content {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
        }
        body[data-theme="light"] .cc-modal-header,
        html[data-theme="light"] .cc-modal-header {
            background: linear-gradient(90deg, #f8fafc, #eef2ff) !important;
            border-bottom: 1px solid #e2e8f0 !important;
            color: #0f172a !important;
        }
        body[data-theme="light"] .cc-modal-header small,
        html[data-theme="light"] .cc-modal-header small {
            color: #475569 !important;
        }
        body[data-theme="light"] .cc-modal-content .btn-close-white,
        html[data-theme="light"] .cc-modal-content .btn-close-white {
            filter: none !important;
        }
        body[data-theme="light"] .cc-modal-body,
        html[data-theme="light"] .cc-modal-body {
            background-color: #f8fafc !important;
            color: #0f172a !important;
        }
        body[data-theme="light"] .cc-nav-tabs,
        html[data-theme="light"] .cc-nav-tabs {
            background-color: #e2e8f0 !important;
            border-bottom-color: #cbd5e1 !important;
        }
        body[data-theme="light"] .cc-nav-link,
        html[data-theme="light"] .cc-nav-link {
            color: #334155 !important;
            opacity: 0.85;
        }
        body[data-theme="light"] .cc-nav-link.active,
        html[data-theme="light"] .cc-nav-link.active {
            background-color: #ffffff !important;
            color: #4f46e5 !important;
            border-bottom: 2px solid #4f46e5 !important;
        }
        body[data-theme="light"] .cc-form-label,
        html[data-theme="light"] .cc-form-label {
            color: #1e293b !important;
        }
        body[data-theme="light"] .cc-form-control,
        html[data-theme="light"] .cc-form-control {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
        }
        body[data-theme="light"] .cc-btn-purple,
        html[data-theme="light"] .cc-btn-purple {
            background-color: #6d28d9 !important;
            color: #ffffff !important;
        }
        body[data-theme="light"] .cc-btn-gray,
        html[data-theme="light"] .cc-btn-gray {
            background-color: #e2e8f0 !important;
            color: #1e293b !important;
            border: 1px solid #cbd5e1 !important;
        }
        body[data-theme="light"] .cc-q-card,
        html[data-theme="light"] .cc-q-card {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
            color: #0f172a !important;
        }
        body[data-theme="light"] .cc-q-card .input-group-text,
        html[data-theme="light"] .cc-q-card .input-group-text {
            background-color: #eef2ff !important;
            color: #4f46e5 !important;
            border-color: #cbd5e1 !important;
        }
        body[data-theme="light"] .cc-voice-bar,
        html[data-theme="light"] .cc-voice-bar {
            background: linear-gradient(90deg, #ecfdf5, #eef2ff) !important;
            border-color: #a5b4fc !important;
            color: #0f172a !important;
        }
        body[data-theme="light"] #fqVoiceHelpBox,
        html[data-theme="light"] #fqVoiceHelpBox {
            color: #334155 !important;
            border-color: #cbd5e1 !important;
        }
        body[data-theme="light"] .cc-vis-panel,
        html[data-theme="light"] .cc-vis-panel {
            background: #f0f9ff !important;
            border-color: #38bdf8 !important;
            color: #0f172a !important;
        }
        body[data-theme="light"] .cc-sub-strip,
        html[data-theme="light"] .cc-sub-strip {
            background: #ffffff !important;
            border-color: #cbd5e1 !important;
            color: #0f172a !important;
        }
        body[data-theme="light"] .sq-lobby-banner,
        html[data-theme="light"] .sq-lobby-banner {
            background: linear-gradient(90deg, #eef2ff, #e0f2fe) !important;
            border-color: #818cf8 !important;
            color: #1e1b4b !important;
        }
        body[data-theme="light"] .sq-challenge-card,
        html[data-theme="light"] .sq-challenge-card {
            background: linear-gradient(135deg, #ffffff, #f5f3ff) !important;
            border-color: #8b5cf6 !important;
            border-bottom-color: #6d28d9 !important;
            color: #1e1b4b !important;
        }
        body[data-theme="light"] .sq-challenge-card h5,
        body[data-theme="light"] .sq-challenge-card .small,
        html[data-theme="light"] .sq-challenge-card h5,
        html[data-theme="light"] .sq-challenge-card .small {
            color: #1e1b4b !important;
        }
        body[data-theme="light"] .sq-blooket-stage,
        html[data-theme="light"] .sq-blooket-stage {
            background: radial-gradient(circle at top right, #ede9fe 0%, #e0e7ff 60%, #f8fafc 100%) !important;
            border-color: #a78bfa !important;
        }
        body[data-theme="light"] .sq-blooket-hud,
        html[data-theme="light"] .sq-blooket-hud {
            background: #ffffff !important;
            border-color: #c4b5fd !important;
            color: #0f172a !important;
        }
        body[data-theme="light"] .sq-blooket-hud .badge.bg-dark,
        html[data-theme="light"] .sq-blooket-hud .badge.bg-dark {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
        }
        body[data-theme="light"] .sq-progress-strip,
        html[data-theme="light"] .sq-progress-strip {
            background: #ffffff !important;
            border-color: #c4b5fd !important;
            color: #0f172a !important;
        }
        body[data-theme="light"] .sq-desc-wrap,
        html[data-theme="light"] .sq-desc-wrap {
            background: #ffffff !important;
            border-color: #a78bfa !important;
        }
        .sq-opt-tile,
        .sq-opt-tile span {
            color: #ffffff !important;
        }
        .sq-opt-tile .sq-opt-selected-badge {
            color: #1e1b4b !important;
        }
        body[data-theme="light"] .sq-q-pill,
        html[data-theme="light"] .sq-q-pill {
            background: #e2e8f0 !important;
            border-color: #cbd5e1 !important;
            color: #1e293b !important;
        }
        body[data-theme="light"] .sq-q-pill.active,
        html[data-theme="light"] .sq-q-pill.active {
            background: #f59e0b !important;
            border-color: #d97706 !important;
            color: #1e1b4b !important;
        }
        body[data-theme="light"] .sq-q-pill.answered,
        html[data-theme="light"] .sq-q-pill.answered {
            background: #10b981 !important;
            border-color: #059669 !important;
            color: #ffffff !important;
        }
        body[data-theme="light"] .cc-dash-card,
        html[data-theme="light"] .cc-dash-card {
            background: #ffffff !important;
            border-color: #cbd5e1 !important;
            color: #0f172a !important;
        }
        body[data-theme="light"] .cc-metric-green,
        html[data-theme="light"] .cc-metric-green {
            background: #ecfdf5 !important;
            border-color: #10b981 !important;
            color: #065f46 !important;
        }
        body[data-theme="light"] .cc-metric-blue,
        html[data-theme="light"] .cc-metric-blue {
            background: #eff6ff !important;
            border-color: #3b82f6 !important;
            color: #1e40af !important;
        }
        body[data-theme="light"] .cc-metric-amber,
        html[data-theme="light"] .cc-metric-amber {
            background: #fffbeb !important;
            border-color: #f59e0b !important;
            color: #92400e !important;
        }
        body[data-theme="light"] .cc-metric-purple,
        html[data-theme="light"] .cc-metric-purple {
            background: #f5f3ff !important;
            border-color: #8b5cf6 !important;
            color: #4c1d95 !important;
        }
        body[data-theme="light"] .cc-metric-red,
        html[data-theme="light"] .cc-metric-red {
            background: #fef2f2 !important;
            border-color: #ef4444 !important;
            color: #991b1b !important;
        }
        body[data-theme="light"] .cc-analytics-table,
        html[data-theme="light"] .cc-analytics-table {
            background: #ffffff !important;
            color: #0f172a !important;
        }
        body[data-theme="light"] .cc-analytics-table thead,
        html[data-theme="light"] .cc-analytics-table thead {
            background: #eef2ff !important;
            color: #1e1b4b !important;
        }
        body[data-theme="light"] .cc-weak-card,
        html[data-theme="light"] .cc-weak-card {
            background: #fef2f2 !important;
            border-color: #ef4444 !important;
            color: #7f1d1d !important;
        }
        body[data-theme="light"] .cc-weak-card .card-header,
        html[data-theme="light"] .cc-weak-card .card-header {
            background: #fee2e2 !important;
        }
        body[data-theme="light"] .cc-weak-card p,
        html[data-theme="light"] .cc-weak-card p {
            color: #7f1d1d !important;
        }
        body[data-theme="light"] .cc-detail-answer-card,
        html[data-theme="light"] .cc-detail-answer-card {
            background: #ffffff !important;
            border-color: #cbd5e1 !important;
            color: #0f172a !important;
        }
        body[data-theme="light"] .cc-modal-content .badge.bg-success,
        body[data-theme="light"] .cc-modal-content .badge.bg-danger,
        body[data-theme="light"] .cc-modal-content .badge.bg-primary,
        body[data-theme="light"] .cc-modal-content .sq-play-3d-btn,
        html[data-theme="light"] .cc-modal-content .badge.bg-success,
        html[data-theme="light"] .cc-modal-content .badge.bg-danger,
        html[data-theme="light"] .cc-modal-content .badge.bg-primary,
        html[data-theme="light"] .cc-modal-content .sq-play-3d-btn {
            color: #ffffff !important;
        }
        body[data-theme="light"] .cc-modal-content .badge.bg-dark,
        html[data-theme="light"] .cc-modal-content .badge.bg-dark {
            background-color: #e2e8f0 !important;
            color: #0f172a !important;
            border-color: #94a3b8 !important;
        }
        body[data-theme="light"] .cc-modal-content .badge.bg-secondary,
        body[data-theme="light"] .cc-modal-content .badge.bg-info,
        body[data-theme="light"] .cc-modal-content .badge.bg-warning,
        html[data-theme="light"] .cc-modal-content .badge.bg-secondary,
        html[data-theme="light"] .cc-modal-content .badge.bg-info,
        html[data-theme="light"] .cc-modal-content .badge.bg-warning {
            color: #0f172a !important;
        }
        body[data-theme="light"] #sqHistoryList .list-group-item,
        html[data-theme="light"] #sqHistoryList .list-group-item {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
        }
        body[data-theme="light"] #sqHistoryList .list-group-item .small,
        html[data-theme="light"] #sqHistoryList .list-group-item .small {
            color: #334155 !important;
        }
    </style>
    <div class="modal fade" id="facultyQuizModal" tabindex="-1"
         data-bs-backdrop="static" data-bs-keyboard="false" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content cc-modal-content">
                <div class="modal-header cc-modal-header border-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <div>
                        <h4 class="modal-title fw-bold mb-1 d-flex align-items-center">
                            <i class="fa-solid fa-brain cc-title-brain"></i>
                            Interactive Quiz Studio – Faculty Hub
                        </h4>
                        <small style="color: #94a3b8; font-size: 0.85rem; margin-left: 36px;">Create, AI-Generate, Use Voice Commands (Tamil / English / Tanglish) &amp; Publish to Class</small>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <div class="form-check form-switch m-0 px-3 py-1 rounded d-flex align-items-center gap-2" style="background: rgba(139,92,246,0.18); border: 1px solid #6d28d9;">
                            <input class="form-check-input m-0" type="checkbox" role="switch" id="fqVoiceEnableSwitch" onchange="quizToggleVoiceFeature(this.checked)">
                            <label class="form-check-label small fw-bold text-info m-0" for="fqVoiceEnableSwitch" style="cursor:pointer;">
                                <i class="fa-solid fa-microphone-lines me-1"></i> Voice Commands
                            </label>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                </div>
                
                <ul class="nav cc-nav-tabs mt-0" role="tablist">
                    <li class="nav-item">
                        <button class="cc-nav-link active" data-bs-toggle="tab" data-bs-target="#fqCreateTab" role="tab">
                            ✏️ Create Quiz
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="cc-nav-link" data-bs-toggle="tab" data-bs-target="#fqAiTab" role="tab" onclick="quizShowAiPrompt()">
                            🤖 AI Generator
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="cc-nav-link" data-bs-toggle="tab" data-bs-target="#fqResultsTab" role="tab" onclick="quizLoadFacultyList()">
                            📊 Class Analytics
                        </button>
                    </li>
                </ul>

                <div class="modal-body cc-modal-body p-4" style="background-color: #120326;">
                    <!-- VOICE ASSISTANT BAR (Toggled by Enable/Disable switch) -->
                    <div id="fqVoiceBar" class="cc-voice-bar" style="display:none;">
                        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                            <div class="d-flex flex-wrap align-items-center gap-2">
                                <span class="badge bg-info text-dark fw-bold"><i class="fa-solid fa-ear-listen me-1"></i>Voice Studio</span>
                                <select id="fqVoiceLang" class="form-select form-select-sm cc-form-control" style="width:auto;" onchange="quizChangeVoiceLanguage(this.value)">
                                    <option value="en-US">English</option>
                                    <option value="ta-IN">தமிழ் (Tamil)</option>
                                    <option value="tanglish">Tanglish (Tamil + English)</option>
                                </select>
                                <button type="button" id="fqVoiceMicBtn" class="btn btn-sm btn-danger fw-bold px-3" onclick="quizToggleVoiceListening()">
                                    <i class="fa-solid fa-microphone me-1"></i> Start Listening
                                </button>
                                <button type="button" id="fqVoiceExplainBtn" class="btn btn-sm btn-outline-warning fw-semibold" onclick="quizSpeakSystemGuide()">
                                    <i class="fa-solid fa-volume-high me-1"></i> Explain Quiz System
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-light" onclick="document.getElementById('fqVoiceHelpBox').classList.toggle('d-none')">
                                    <i class="fa-solid fa-circle-question me-1"></i> Commands
                                </button>
                            </div>
                            <div id="fqVoiceStatusText" class="small text-warning fw-semibold">
                                Ready — choose English, Tamil, or Tanglish and click Start Listening.
                            </div>
                        </div>
                        <div id="fqVoiceHelpBox" class="d-none mt-2 pt-2 border-top small" style="border-color: rgba(139,92,246,0.35) !important; color:#e2e8f0;">
                            <div class="row g-2">
                                <div class="col-md-4">
                                    <strong class="text-info">English Commands:</strong><br/>
                                    <code>"Explain"</code> &bull; <code>"Title Java Quiz"</code> &bull; <code>"Section II CSE A"</code> &bull; <code>"Subject Java"</code> &bull; <code>"Add question"</code> &bull; <code>"Question What is JVM"</code> &bull; <code>"Option A Virtual Machine"</code> &bull; <code>"Answer Virtual Machine"</code> &bull; <code>"Publish quiz"</code>
                                </div>
                                <div class="col-md-4">
                                    <strong class="text-warning">Tamil Commands (தமிழ்):</strong><br/>
                                    <code>"விளக்கு" / "உதவி"</code> &bull; <code>"தலைப்பு ஜாவா தேர்வு"</code> &bull; <code>"வகுப்பு 2 CSE A"</code> &bull; <code>"பாடம் ஜாவா"</code> &bull; <code>"புதிய கேள்வி"</code> &bull; <code>"கேள்வி ..."</code> &bull; <code>"விடை அ/ஆ/இ/ஈ ..."</code> &bull; <code>"சரியான விடை ..."</code> &bull; <code>"வெளியிடு"</code>
                                </div>
                                <div class="col-md-4">
                                    <strong class="text-success">Tanglish Commands:</strong><br/>
                                    <code>"Explain pannu"</code> &bull; <code>"Title podu Java Test"</code> &bull; <code>"Class II CSE A"</code> &bull; <code>"Question sollunga ..."</code> &bull; <code>"Option A podu ..."</code> &bull; <code>"Badhil ..."</code> &bull; <code>"Pudhu question"</code> &bull; <code>"Publish pannu"</code>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="fqVoiceDisabledHint" class="small text-muted mb-2">
                        <i class="fa-solid fa-microphone-slash me-1"></i> Voice recognition is disabled. Toggle <strong>Voice Commands</strong> in the header to enable Tamil / English / Tanglish speech control.
                    </div>

                    <!-- STUDENT QUIZ VISIBILITY CONTROL (FACULTY: ENABLE / HIDE PER CLASS) -->
                    <div class="p-3 rounded mb-3 cc-vis-panel" style="background: rgba(15, 23, 42, 0.9); border: 1px solid #38bdf8;">
                        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                            <div>
                                <h6 class="fw-bold text-info mb-0">
                                    <i class="fa-solid fa-eye me-2"></i>Class Quiz Visibility (Hide / Show for Selected Class)
                                </h6>
                                <small class="text-muted">Select Department, Year, Class &amp; Section to enable or disable the Quiz option for those students.</small>
                            </div>
                            <span id="fqVisStatusBadge" class="badge bg-secondary">Loading...</span>
                        </div>
                        <div class="row g-2 align-items-end">
                            <div class="col-md-2">
                                <label class="form-label small text-muted mb-1">Dept</label>
                                <select id="fqVisDept" class="form-select form-select-sm cc-form-control" onchange="onFacultyQuizVisFilterChange()"></select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label small text-muted mb-1">Year</label>
                                <select id="fqVisYear" class="form-select form-select-sm cc-form-control" onchange="onFacultyQuizVisFilterChange()">
                                    <option value="I">I Year</option>
                                    <option value="II">II Year</option>
                                    <option value="III">III Year</option>
                                    <option value="IV">IV Year</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small text-muted mb-1">Class</label>
                                <select id="fqVisClass" class="form-select form-select-sm cc-form-control" onchange="onFacultyQuizVisFilterChange()"></select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label small text-muted mb-1">Section</label>
                                <select id="fqVisSection" class="form-select form-select-sm cc-form-control" onchange="onFacultyQuizVisSectionChange()"></select>
                            </div>
                            <div class="col-md-3 d-flex gap-2">
                                <button type="button" id="fqVisEnableBtn" class="btn btn-sm btn-success flex-fill fw-semibold" onclick="quizSetFacultyClassVisibility(true)">
                                    <i class="fa-solid fa-eye me-1"></i> Enable Quiz
                                </button>
                                <button type="button" id="fqVisDisableBtn" class="btn btn-sm btn-danger flex-fill fw-semibold" onclick="quizSetFacultyClassVisibility(false)">
                                    <i class="fa-solid fa-eye-slash me-1"></i> Disable Quiz
                                </button>
                            </div>
                        </div>
                        <div id="fqVisGlobalNote" class="small text-warning mt-2 d-none"></div>
                    </div>

                    <div class="tab-content">
                        <!-- CREATE TAB -->
                        <div class="tab-pane fade show active" id="fqCreateTab" role="tabpanel">
                            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 p-2 px-3 rounded mb-3 cc-sub-strip" style="background:#0a041f; border:1px solid #3b0764;">
                                <div class="small">
                                    <i class="fa-solid fa-bullhorn text-info me-1"></i>
                                    Target Class: <strong id="fqTargetSectionPreview" class="text-warning">Not selected</strong>
                                </div>
                                <div class="d-flex gap-2 align-items-center small">
                                    <span class="badge bg-primary" id="fqSummaryQCount">1 Question</span>
                                    <span class="badge bg-success" id="fqSummaryMarks">10 Marks</span>
                                </div>
                            </div>
                            <form id="quizCreateForm" onsubmit="quizHandleCreate(event)">
                                <div class="row g-3 mb-3">
                                    <div class="col-md-5">
                                        <label class="cc-form-label">Quiz Title *</label>
                                        <input type="text" id="fqTitle" class="form-control cc-form-control" placeholder="e.g. Data Structures – Linked List Quiz" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="cc-form-label">Section *</label>
                                        <select id="fqSectionId" class="form-select cc-form-control" required>
                                            <option value="">Loading sections...</option>
                                        </select>
                                    </div>
                                    <div class="col-md-3">
                                        <label class="cc-form-label">Teacher *</label>
                                        <input type="text" id="fqTeacherDisplay" class="form-control cc-form-control" placeholder="Loading..." readonly>
                                        <input type="hidden" id="fqTeacherId">
                                    </div>
                                </div>
                                <div class="row g-3 mb-4">
                                    <div class="col-md-4">
                                        <label class="cc-form-label">Subject</label>
                                        <input type="text" id="fqSubject" class="form-control cc-form-control" placeholder="e.g. Data Structures">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="cc-form-label">Topic / Chapter</label>
                                        <input type="text" id="fqTopic" class="form-control cc-form-control" placeholder="e.g. Linked List">
                                    </div>
                                    <div class="col-md-2">
                                        <label class="cc-form-label">Difficulty</label>
                                        <select id="fqDifficulty" class="form-select cc-form-control" onchange="quizOnCreateDifficultyChange(this.value)">
                                            <option value="Easy">Easy</option>
                                            <option value="Medium" selected>Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                    <div class="col-md-2">
                                        <label class="cc-form-label">Duration (min)</label>
                                        <input type="number" id="fqDuration" class="form-control cc-form-control" value="15">
                                    </div>
                                </div>
                                <div class="row g-3 mb-4">
                                    <div class="col-md-2">
                                        <label class="cc-form-label">Pass %</label>
                                        <input type="number" id="fqPassPercent" class="form-control cc-form-control" value="50">
                                    </div>
                                </div>

                                <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2 flex-wrap gap-2" style="border-color: #3b0764 !important;">
                                    <h5 class="fw-bold mb-0" style="color: #eab308;"><i class="fa-solid fa-list-ul me-2"></i>Questions</h5>
                                    <div class="d-flex flex-wrap gap-2">
                                        <button type="button" class="btn btn-outline-danger btn-sm px-3 fw-semibold" onclick="quizClearDraftQuestions()">
                                            <i class="fa-solid fa-trash-can me-1"></i> Clear All
                                        </button>
                                        <button type="button" class="btn cc-btn-gray btn-sm px-3 fw-semibold" onclick="quizShowAiPrompt()">
                                            <i class="fa-solid fa-wand-magic-sparkles me-1"></i> Generate with AI
                                        </button>
                                        <button type="button" class="btn cc-btn-purple btn-sm px-3 fw-semibold" onclick="quizAddQuestion()">
                                            + Add Question
                                        </button>
                                    </div>
                                </div>

                                <div id="fqQuestionsWrap">
                                    <!-- Dynamic question cards -->
                                </div>

                                <div class="mt-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
                                    <button type="button" class="btn btn-sm btn-outline-info" onclick="quizLoadSampleTemplate()">
                                        <i class="fa-solid fa-wand-magic-sparkles me-1"></i> Load Sample Questions
                                    </button>
                                    <div class="d-flex gap-2">
                                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                                        <button type="submit" class="btn btn-success fw-bold px-4" style="background:#10b981; border:none;">
                                            <i class="fa-solid fa-paper-plane me-1"></i> Save &amp; Publish Quiz to Students
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <!-- RESULTS TAB -->
                        <div class="tab-pane fade" id="fqResultsTab" role="tabpanel">
                            <div class="mb-3 d-flex gap-2 align-items-end">
                                <div class="flex-grow-1">
                                    <label class="cc-form-label">Select Quiz</label>
                                    <select id="fqQuizSelect" class="form-select cc-form-control" onchange="quizLoadResults(this.value)">
                                        <option value="">-- Choose a Quiz --</option>
                                    </select>
                                </div>
                                <button type="button" class="btn btn-outline-danger fw-bold" id="fqDeleteQuizBtn" style="height: 38px; display: none;" onclick="quizDeleteSelected()">
                                    <i class="fa-solid fa-trash"></i> Delete
                                </button>
                            </div>
                            <div id="fqResultsBody" class="mt-3"></div>
                        </div>
                        
                        <!-- AI TAB PLACEHOLDER -->
                        <div class="tab-pane fade" id="fqAiTab" role="tabpanel">
                            <form id="aiGenForm" onsubmit="quizGenerateAI(event)">
                                <div class="row g-3 mb-3">
                                    <div class="col-md-5">
                                        <label class="cc-form-label">Topic *</label>
                                        <input type="text" id="aiTopic" class="form-control cc-form-control" placeholder="e.g. Linked Lists, Deadlocks, Normalization" required>
                                    </div>
                                    <div class="col-md-3">
                                        <label class="cc-form-label">AI Model / Provider</label>
                                        <select id="aiProvider" class="form-select cc-form-control" onchange="quizOnAiProviderChange()">
                                            <option value="AUTO" selected>Auto (Best Available AI)</option>
                                            <option value="OPENAI">ChatGPT (OpenAI GPT-4o)</option>
                                            <option value="PERPLEXITY">Perplexity (Sonar Pro)</option>
                                            <option value="GEMINI">Google Gemini (2.5 Flash)</option>
                                            <option value="GROQ">Groq (Llama 3.3 70B)</option>
                                            <option value="BUILT_IN">Built-In Academic Engine</option>
                                        </select>
                                    </div>
                                    <div class="col-md-2">
                                        <label class="cc-form-label">Difficulty *</label>
                                        <select id="aiDifficulty" class="form-select cc-form-control">
                                            <option value="Easy">Easy (5m)</option>
                                            <option value="Medium" selected>Medium (10m)</option>
                                            <option value="Hard">Hard (15m)</option>
                                        </select>
                                    </div>
                                    <div class="col-md-1">
                                        <label class="cc-form-label">Count</label>
                                        <input type="number" id="aiNumQ" class="form-control cc-form-control" value="5" min="1" max="20" required>
                                    </div>
                                    <div class="col-md-1">
                                        <label class="cc-form-label">Type</label>
                                        <select id="aiType" class="form-select cc-form-control">
                                            <option value="MCQ" selected>MCQ</option>
                                            <option value="DESCRIPTIVE">Desc</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="row g-3 mb-3">
                                    <div class="col-md-8">
                                        <label class="cc-form-label">Learning Objectives / Reference Notes</label>
                                        <textarea id="aiNotes" class="form-control cc-form-control" rows="4" placeholder="Paste lesson notes, syllabus points, or code concepts here. Questions stay strictly unique and adapt directly to Easy / Medium / Hard difficulty..."></textarea>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="cc-form-label d-flex justify-content-between align-items-center">
                                            <span>API Key (Optional Override)</span>
                                            <span class="badge bg-secondary" id="aiKeyHintBadge">Server / Local</span>
                                        </label>
                                        <input type="password" id="aiApiKeyInput" class="form-control cc-form-control mb-2" placeholder="sk-... / pplx-... / AIza... / gsk_..." autocomplete="off" oninput="quizSaveLocalAiKey()">
                                        <select id="aiInsertMode" class="form-select form-select-sm cc-form-control">
                                            <option value="REPLACE" selected>Replace current draft questions</option>
                                            <option value="APPEND">Append unique questions (no repeats)</option>
                                        </select>
                                        <small class="text-muted d-block mt-1" style="font-size:0.74rem;">
                                            Leave API key empty to use the server key or Built-In Difficulty-Stratified Academic Engine.
                                        </small>
                                    </div>
                                </div>
                                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                                    <button id="aiGenBtn" type="submit" class="btn cc-btn-purple fw-bold px-4 py-2">
                                        <i class="fa-solid fa-wand-magic-sparkles me-2"></i> Generate Unique Questions with AI
                                    </button>
                                    <div id="fqAiStatusBadge" class="small text-info"></div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ============================================================ -->
    <!--  STUDENT: Take Quiz (play.blooket.com Arcade Selection UI)   -->
    <!-- ============================================================ -->
    <div class="modal fade" id="studentQuizModal" tabindex="-1"
         data-bs-backdrop="static" data-bs-keyboard="false" aria-hidden="true">
        <div id="sqModalDialog" class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content cc-modal-content">
                <div class="modal-header cc-modal-header border-0">
                    <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <span class="badge" style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;font-size:0.85rem;"><i class="fa-solid fa-gamepad me-1"></i> PLAY</span>
                        <span>Class Quiz Arena</span>
                    </h5>
                    <!-- No close button during active quiz - controlled by firewall -->
                    <button id="sqCloseBtn" type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body cc-modal-body p-4" style="background-color: #120326;">
                    <!-- List of quizzes -->
                    <div id="sqListContainer">
                        <div class="p-3 rounded mb-3 d-flex flex-wrap justify-content-between align-items-center gap-2 sq-lobby-banner" style="background:linear-gradient(90deg,#3b0764,#1e1b4b);border:1px solid #7c3aed;">
                            <div>
                                <h6 class="fw-bold text-warning mb-0"><i class="fa-solid fa-trophy me-2"></i>Available Quiz Challenges</h6>
                                <small class="text-light opacity-75">Pick a challenge and answer on colored arcade tiles — your level graph updates on completion!</small>
                            </div>
                        </div>
                        <div id="sqQuizList" class="list-group mb-3"></div>
                        <div id="sqNoQuiz" class="text-muted" style="display:none;">No quizzes assigned for your section yet.</div>
                    </div>

                    <!-- Active quiz view (Blooket style) -->
                    <div id="sqActiveContainer" class="sq-blooket-stage" style="display:none;">
                        <div class="sq-blooket-hud d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                            <div>
                                <h5 id="sqQuizTitle" class="fw-bold text-warning mb-0"></h5>
                                <small id="sqQuizMetaLine" class="text-light opacity-75"></small>
                            </div>
                            <div class="d-flex flex-wrap align-items-center gap-2">
                                <span id="sqStreakBadge" class="badge bg-dark border border-warning text-warning fs-6 px-3 py-2">
                                    <i class="fa-solid fa-fire text-danger me-1"></i><span id="sqAnsweredScoreText">0 Answered</span>
                                </span>
                                <span id="sqPointsBadge" class="badge bg-dark border border-success text-success fs-6 px-3 py-2">
                                    <i class="fa-solid fa-coins text-warning me-1"></i><span id="sqPotentialPtsText">0 Pts</span>
                                </span>
                                <span id="sqTimerBadge" class="badge bg-info text-dark fs-6 px-3 py-2">
                                    <i class="fa-solid fa-stopwatch me-1"></i><span id="sqTimerText">15:00</span>
                                </span>
                            </div>
                        </div>

                        <!-- Progress & Navigation Strip -->
                        <div class="p-3 rounded mb-3 sq-progress-strip" style="background:rgba(10,4,31,0.85);border:1px solid #6d28d9;">
                            <div class="d-flex justify-content-between align-items-center small mb-2">
                                <span id="sqProgressLabel" class="fw-bold text-warning">Question 1 of 1 &bull; 0 Answered</span>
                                <div class="d-flex align-items-center gap-2">
                                    <span class="text-muted d-none d-sm-inline" style="font-size:0.74rem;">Keys 1-4 / A-D supported</span>
                                    <button type="button" id="sqViewModeBtn" class="btn btn-xs btn-outline-light py-0 px-2" onclick="quizToggleStudentViewMode()">
                                        <i class="fa-solid fa-list me-1"></i> Show All
                                    </button>
                                </div>
                            </div>
                            <div class="progress mb-2" style="height:10px; background:#1e1b4b; border-radius:999px;">
                                <div id="sqProgressBar" class="progress-bar bg-warning" role="progressbar" style="width:0%;"></div>
                            </div>
                            <div id="sqQuestionPills" class="d-flex flex-wrap gap-2 mt-2"></div>
                        </div>

                        <form id="sqForm" onsubmit="quizStudentSubmit(event)">
                            <div id="sqQuestionsBody"></div>
                            <div class="mt-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
                                <div class="d-flex gap-2" id="sqStepNavBtns">
                                    <button type="button" id="sqPrevQBtn" class="btn btn-outline-light fw-bold px-3" onclick="quizStudentGoStep(-1)">
                                        <i class="fa-solid fa-arrow-left me-1"></i> Previous
                                    </button>
                                    <button type="button" id="sqNextQBtn" class="btn btn-warning text-dark fw-bold px-4" onclick="quizStudentGoStep(1)">
                                        Next <i class="fa-solid fa-arrow-right ms-1"></i>
                                    </button>
                                </div>
                                <button type="submit" class="sq-play-3d-btn px-5 ms-auto">
                                    <i class="fa-solid fa-flag-checkered me-1"></i> Finish &amp; View Level Graph
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Result view after submission -->
                    <div id="sqResultContainer" style="display:none;"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- ============================================================ -->
    <!--  STUDENT: Quiz History Modal                                 -->
    <!-- ============================================================ -->
    <div class="modal fade" id="studentQuizHistoryModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content cc-modal-content">
                <div class="modal-header cc-modal-header border-0">
                    <h5 class="modal-title fw-bold">
                        <i class="fa-solid fa-clock-rotate-left text-info me-2"></i>
                        My Quiz History
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body cc-modal-body p-4" style="background-color: #120326;">
                    <div id="sqHistoryListContainer">
                        <div id="sqHistoryList" class="list-group mb-3">
                            <div class="text-center py-4 text-muted">Loading history...</div>
                        </div>
                    </div>
                    
                    <div id="sqHistoryDetailContainer" style="display:none;">
                        <button class="btn btn-sm btn-outline-secondary mb-3" onclick="document.getElementById('sqHistoryDetailContainer').style.display='none'; document.getElementById('sqHistoryListContainer').style.display='block';">
                            <i class="fa-solid fa-arrow-left"></i> Back to History
                        </button>
                        <div id="sqHistoryDetailContent"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
}

// ── State ────────────────────────────────────────────────────────────────────
let _quizActive = false;           // firewall flag
let _currentQuizData = null;       // full quiz object for student
let _questionCount = 0;            // unique question card IDs
let _resolvedStudentId = null;     // resolved DB id of logged-in student
let _resolvedSectionId = null;     // resolved DB id of student's section

// ── Helpers ──────────────────────────────────────────────────────────────────
function _loggedInUsername() {
    return (localStorage.getItem('sece_logged_in_user') || '').toLowerCase();
}
function _authHeaders(extra = {}) {
    const token = localStorage.getItem('jwt_token') || '';
    const headers = { ...extra };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
}
function _teacherId() {
    // Try to get from session storage set by faculty login flow
    return localStorage.getItem('sece_teacher_id') ||
           sessionStorage.getItem('sece_teacher_id') || '1';
}

/**
 * Fetches the logged-in student's DB record and caches their ID + sectionId.
 * Returns { studentId, sectionId } or null on failure.
 */
async function _resolveStudentInfo() {
    if (_resolvedStudentId && _resolvedSectionId) {
        return { studentId: _resolvedStudentId, sectionId: _resolvedSectionId };
    }
    const username = _loggedInUsername();
    if (!username) return null;

    try {
        const token = localStorage.getItem('jwt_token') || '';
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        const res = await fetch('/api/students', { headers });
        if (!res.ok) return null;
        const students = await res.json();
        const me = students.find(s =>
            (s.user && String(s.user.username || '').toLowerCase() === username) ||
            String(s.username || '').toLowerCase() === username ||
            String(s.registerNumber || '').toLowerCase() === username
        );
        if (!me) return null;
        _resolvedStudentId = me.id;
        _resolvedSectionId = me.section ? me.section.id : null;
        return { studentId: me.id, sectionId: me.section ? me.section.id : null };
    } catch (err) {
        console.error('Could not resolve student info', err);
        return null;
    }
}
function _apiErr(res) {
    return res.text().then(t => { throw new Error(t || 'API error ' + res.status); });
}

/**
 * Fetches the logged-in faculty's DB record and returns their teacher ID.
 * Returns teacherId (number) or null on failure.
 */
async function _resolveTeacherInfo() {
    const username = _loggedInUsername();
    if (!username) return null;
    try {
        const token = localStorage.getItem('jwt_token') || '';
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        const res = await fetch('/api/teachers', { headers });
        if (!res.ok) return null;
        const teachers = await res.json();
        const me = teachers.find(t =>
            (t.user && String(t.user.username || '').toLowerCase() === username) ||
            String(t.username || '').toLowerCase() === username ||
            String(t.collegeEmail || '').toLowerCase().startsWith(username)
        );
        if (!me) return null;
        // Return both id and display name
        const displayName = me.displayName || me.name || (me.firstName + ' ' + (me.lastName || ''));
        return { id: me.id, name: displayName };
    } catch (err) {
        console.error('Could not resolve teacher info', err);
        return null;
    }
}

// ── Faculty: Open Modal ──────────────────────────────────────────────────────
window.openFacultyQuizModal = async () => {
    const modalEl = document.getElementById('facultyQuizModal');
    if (modalEl && !modalEl.dataset.voiceCleanupBound) {
        modalEl.dataset.voiceCleanupBound = 'true';
        modalEl.addEventListener('hidden.bs.modal', () => { quizStopVoiceListening(); });
    }
    new bootstrap.Modal(modalEl).show();

    // Sync Voice Assistant Enable/Disable preference
    const voiceEnabled = localStorage.getItem('sece_quiz_voice_enabled') !== 'false';
    const voiceSwitch = document.getElementById('fqVoiceEnableSwitch');
    if (voiceSwitch) voiceSwitch.checked = voiceEnabled;
    quizToggleVoiceFeature(voiceEnabled, true);

    // Reset form state
    document.getElementById('quizCreateForm').reset();
    document.getElementById('fqQuestionsWrap').innerHTML = '';
    _questionCount = 0;
    quizAddQuestion();

    // Load sections dropdown
    const secSel = document.getElementById('fqSectionId');
    secSel.innerHTML = '<option value="">Loading sections...</option>';
    secSel.onchange = () => {
        const preview = document.getElementById('fqTargetSectionPreview');
        if (preview) preview.innerText = secSel.selectedIndex > 0 ? secSel.options[secSel.selectedIndex].text : 'Not selected';
    };
    try {
        const token = localStorage.getItem('jwt_token') || '';
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        const secRes = await fetch('/api/sections', { headers });
        if (secRes.ok) {
            const sections = await secRes.json();
            const cleanSections = sections.filter(s => s.sectionName && !/^\d+\s+CSE\s+II\s+CSE/i.test(s.sectionName));
            secSel.innerHTML = '<option value="">-- Select Section --</option>' +
                cleanSections.map(s => {
                    const label = s.sectionName || ('Section ' + s.id);
                    return `<option value="${s.id}">${label}</option>`;
                }).join('');
        } else {
            secSel.innerHTML = '<option value="">Error loading sections</option>';
        }
    } catch (e) {
        secSel.innerHTML = '<option value="">Error loading sections</option>';
    }

    // Resolve teacher ID + name from API
    const tchInfo = await _resolveTeacherInfo();
    const tchId   = tchInfo ? tchInfo.id : 1;
    const tchName = tchInfo ? tchInfo.name : ('ID ' + tchId);

    document.getElementById('fqTeacherId').value = tchId;
    document.getElementById('fqTeacherDisplay').value = tchName;
    quizRefreshSummaryBadge();
    if (typeof window.quizLoadVisibilityControls === 'function') {
        window.quizLoadVisibilityControls();
    }
};

window.quizOnAiProviderChange = () => {
    const prov = document.getElementById('aiProvider')?.value || 'AUTO';
    const keyInput = document.getElementById('aiApiKeyInput');
    const badge = document.getElementById('aiKeyHintBadge');
    if (keyInput) {
        keyInput.value = localStorage.getItem('quiz_ai_key_' + prov) || '';
    }
    if (badge) {
        const labels = {
            AUTO: 'Server / Local',
            OPENAI: 'ChatGPT Key',
            PERPLEXITY: 'Perplexity Key',
            GEMINI: 'Gemini Key',
            GROQ: 'Groq Key',
            BUILT_IN: 'No Key Needed'
        };
        badge.innerText = labels[prov] || 'Server / Local';
    }
};

window.quizSaveLocalAiKey = () => {
    const prov = document.getElementById('aiProvider')?.value || 'AUTO';
    const val = document.getElementById('aiApiKeyInput')?.value || '';
    if (val.trim()) {
        localStorage.setItem('quiz_ai_key_' + prov, val.trim());
    } else {
        localStorage.removeItem('quiz_ai_key_' + prov);
    }
};

window.quizShowAiPrompt = () => {
    const aiTab = new bootstrap.Tab(document.querySelector('button[data-bs-target="#fqAiTab"]'));
    aiTab.show();
    window.quizOnAiProviderChange();
};

window.quizGenerateAI = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('aiGenBtn');
    const statusEl = document.getElementById('fqAiStatusBadge');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Generating Unique Questions...';

    const topic = document.getElementById('aiTopic').value.trim();
    const diff = document.getElementById('aiDifficulty').value;
    const num = parseInt(document.getElementById('aiNumQ').value, 10) || 5;
    const type = document.getElementById('aiType') ? document.getElementById('aiType').value : 'MCQ';
    const notes = document.getElementById('aiNotes') ? document.getElementById('aiNotes').value : '';
    const provider = document.getElementById('aiProvider') ? document.getElementById('aiProvider').value : 'AUTO';
    const apiKey = document.getElementById('aiApiKeyInput') ? document.getElementById('aiApiKeyInput').value.trim() : '';
    const insertMode = document.getElementById('aiInsertMode') ? document.getElementById('aiInsertMode').value : 'REPLACE';

    // Collect existing question texts so regenerations never repeat questions
    const excludeQuestions = Array.from(document.querySelectorAll('#fqQuestionsWrap .q-text'))
        .map(el => el.value.trim())
        .filter(Boolean);

    try {
        const token = localStorage.getItem('jwt_token') || '';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;

        const res = await fetch('/api/quizzes/generate', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                topic,
                notes,
                difficulty: diff,
                type,
                count: num,
                provider,
                apiKey,
                excludeQuestions
            })
        });

        if (res.ok) {
            const payload = await res.json();
            const list = Array.isArray(payload) ? payload : (payload.questions || []);
            const wrap = document.getElementById('fqQuestionsWrap');

            if (insertMode === 'REPLACE' && wrap) {
                wrap.innerHTML = '';
                _questionCount = 0;
            } else if (wrap) {
                // Remove untouched empty starter card when appending
                const cards = wrap.querySelectorAll('.cc-q-card');
                if (cards.length === 1 && !cards[0].querySelector('.q-text')?.value.trim()) {
                    wrap.innerHTML = '';
                    _questionCount = 0;
                }
            }

            // Sync Create Quiz metadata with AI Topic & Difficulty
            const fqTopic = document.getElementById('fqTopic');
            const fqDiff = document.getElementById('fqDifficulty');
            const fqTitle = document.getElementById('fqTitle');
            const fqSubject = document.getElementById('fqSubject');
            if (fqTopic && topic) fqTopic.value = topic;
            if (fqDiff && diff) fqDiff.value = diff;
            if (fqSubject && !fqSubject.value.trim() && topic) fqSubject.value = topic;
            if (fqTitle && !fqTitle.value.trim() && topic) fqTitle.value = `${topic} (${diff} Level Quiz)`;

            list.forEach(q => {
                quizAddQuestion();
                const cards = document.querySelectorAll('#fqQuestionsWrap .cc-q-card');
                const lastCard = cards[cards.length - 1];
                const qid = lastCard.querySelector('.q-text').dataset.qid;

                lastCard.querySelector('.q-text').value = q.questionText || '';
                lastCard.querySelector('.q-type').value = q.type || 'MCQ';
                quizToggleType(lastCard.querySelector('.q-type'), qid);
                lastCard.querySelector('.q-marks').value = q.marks || (diff === 'Hard' ? 15 : (diff === 'Easy' ? 5 : 10));

                if ((q.type || 'MCQ') === 'MCQ') {
                    if (q.options) {
                        const optsArr = q.options.split(',');
                        const optInputs = lastCard.querySelectorAll('.q-opt');
                        optInputs.forEach((input, idx) => {
                            input.value = optsArr[idx] ? optsArr[idx].trim() : '';
                        });
                    }
                    lastCard.querySelector('.q-answer').value = q.correctAnswer || '';
                } else {
                    const descInput = lastCard.querySelector('.q-answer-desc');
                    if (descInput) descInput.value = q.correctAnswer || q.explanation || '';
                }
            });

            quizRefreshSummaryBadge();
            const usedProv = payload.providerUsed || 'AI Generator';
            const usedModel = payload.modelUsed || diff;
            if (statusEl) {
                statusEl.innerHTML = `<span class="badge bg-success me-1">${usedProv}</span> ${usedModel} &bull; ${list.length} unique ${diff} question(s)${payload.warning ? ` <span class="text-warning">(${payload.warning})</span>` : ''}`;
            }

            const createTab = new bootstrap.Tab(document.querySelector('button[data-bs-target="#fqCreateTab"]'));
            createTab.show();
            _showSuccess(`Generated ${list.length} unique ${diff} question(s) using ${usedProv}!`);
        } else {
            const errText = await res.text();
            alert(`Failed to generate questions (Status: ${res.status}): ${errText}`);
        }
    } catch (err) {
        console.error('Quiz Generation Error:', err);
        alert('Network error while generating AI questions: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles me-2"></i> Generate Unique Questions with AI';
    }
};

// ── Faculty: Add Question Card & Live Summary ───────────────────────────────
window.quizRefreshSummaryBadge = () => {
    const cards = document.querySelectorAll('[id^="qcard_"]');
    let totalMarks = 0;
    cards.forEach(c => {
        totalMarks += parseInt(c.querySelector('.q-marks')?.value || '0', 10) || 0;
    });
    const qEl = document.getElementById('fqSummaryQCount');
    const mEl = document.getElementById('fqSummaryMarks');
    if (qEl) qEl.innerText = `${cards.length} Question${cards.length === 1 ? '' : 's'}`;
    if (mEl) mEl.innerText = `${totalMarks} Marks`;
};

window.quizPickOptionAsAnswer = (qid, optIdx) => {
    const card = document.getElementById('qcard_' + qid);
    if (!card) return;
    const optVal = card.querySelector(`.q-opt[data-opt="${optIdx}"]`)?.value.trim() || '';
    const ansInput = card.querySelector('.q-answer');
    if (ansInput) {
        ansInput.value = optVal;
        ansInput.focus();
    }
};

window.quizOnCreateDifficultyChange = (diff) => {
    const aiDiff = document.getElementById('aiDifficulty');
    if (aiDiff && diff) aiDiff.value = diff;
    const targetMarks = diff === 'Hard' ? 15 : (diff === 'Easy' ? 5 : 10);
    document.querySelectorAll('#fqQuestionsWrap .q-marks').forEach(inp => {
        inp.value = targetMarks;
    });
    quizRefreshSummaryBadge();
};

window.quizClearDraftQuestions = () => {
    const wrap = document.getElementById('fqQuestionsWrap');
    if (!wrap) return;
    wrap.innerHTML = '';
    _questionCount = 0;
    quizAddQuestion();
    quizRefreshSummaryBadge();
};

window.quizAddQuestion = () => {
    _questionCount++;
    const n = _questionCount;
    const wrap = document.getElementById('fqQuestionsWrap');
    const card = document.createElement('div');
    card.className = 'cc-q-card';
    card.id = 'qcard_' + n;
    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-bold" style="color: #eab308;">Q${n}</span>
            <button type="button" class="btn btn-sm" style="color: #ef4444; border: 1px solid #ef4444;" onclick="document.getElementById('qcard_${n}').remove(); quizRefreshSummaryBadge();"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="mb-2">
            <input type="text" class="form-control cc-form-control q-text" data-qid="${n}" placeholder="Type your question here (or dictate by Voice)..." required>
        </div>
        <div class="row g-2 mb-2">
            <div class="col-md-6">
                <select class="form-select cc-form-control q-type" data-qid="${n}" onchange="quizToggleType(this,${n})">
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="DESCRIPTIVE">Descriptive</option>
                </select>
            </div>
            <div class="col-md-6">
                <input type="number" class="form-control cc-form-control q-marks" data-qid="${n}" value="10" min="1" required placeholder="Marks" oninput="quizRefreshSummaryBadge()">
            </div>
        </div>

        <!-- MCQ Options Section -->
        <div class="mcq-section-${n}">
            <div class="row g-2 mb-2">
                <div class="col-md-6">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background:#1a0536;color:#a78bfa;border-color:#4c1d95;">A</span>
                        <input type="text" class="form-control cc-form-control q-opt" data-qid="${n}" data-opt="0" placeholder="Option A" required>
                        <button type="button" class="btn btn-outline-success" title="Set as Correct Answer" onclick="quizPickOptionAsAnswer(${n}, 0)"><i class="fa-solid fa-check"></i></button>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background:#1a0536;color:#a78bfa;border-color:#4c1d95;">B</span>
                        <input type="text" class="form-control cc-form-control q-opt" data-qid="${n}" data-opt="1" placeholder="Option B" required>
                        <button type="button" class="btn btn-outline-success" title="Set as Correct Answer" onclick="quizPickOptionAsAnswer(${n}, 1)"><i class="fa-solid fa-check"></i></button>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background:#1a0536;color:#a78bfa;border-color:#4c1d95;">C</span>
                        <input type="text" class="form-control cc-form-control q-opt" data-qid="${n}" data-opt="2" placeholder="Option C">
                        <button type="button" class="btn btn-outline-success" title="Set as Correct Answer" onclick="quizPickOptionAsAnswer(${n}, 2)"><i class="fa-solid fa-check"></i></button>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background:#1a0536;color:#a78bfa;border-color:#4c1d95;">D</span>
                        <input type="text" class="form-control cc-form-control q-opt" data-qid="${n}" data-opt="3" placeholder="Option D">
                        <button type="button" class="btn btn-outline-success" title="Set as Correct Answer" onclick="quizPickOptionAsAnswer(${n}, 3)"><i class="fa-solid fa-check"></i></button>
                    </div>
                </div>
            </div>
            <div class="mb-2">
                <input type="text" class="form-control cc-form-control q-answer" data-qid="${n}" style="border-color:#10b981 !important;" placeholder="Correct Answer (type exact text or click ✓ beside an option)" required>
            </div>
        </div>

        <!-- Descriptive Section -->
        <div class="desc-section-${n}" style="display:none;">
            <div class="mb-2">
                <textarea class="form-control cc-form-control q-answer-desc" data-qid="${n}" rows="3" style="border-color:#10b981 !important;" placeholder="Model Answer (for faculty reference)"></textarea>
            </div>
        </div>
    `;
    wrap.appendChild(card);
    quizRefreshSummaryBadge();
};

window.quizLoadSampleTemplate = () => {
    const titleEl = document.getElementById('fqTitle');
    const subEl = document.getElementById('fqSubject');
    const topEl = document.getElementById('fqTopic');
    if (titleEl && !titleEl.value.trim()) titleEl.value = 'Quick Concept Challenge';
    if (subEl && !subEl.value.trim()) subEl.value = 'Computer Science';
    if (topEl && !topEl.value.trim()) topEl.value = 'Core Fundamentals';

    const wrap = document.getElementById('fqQuestionsWrap');
    const existingEmpty = wrap.querySelectorAll('.cc-q-card').length === 1 && !wrap.querySelector('.q-text')?.value.trim();
    if (existingEmpty) { wrap.innerHTML = ''; _questionCount = 0; }

    const samples = [
        { text: 'Which data structure follows LIFO (Last In First Out) order?', opts: ['Queue', 'Stack', 'Linked List', 'Graph'], ans: 'Stack' },
        { text: 'What is the worst-case time complexity of Binary Search on a sorted array?', opts: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], ans: 'O(log n)' }
    ];
    samples.forEach(s => {
        quizAddQuestion();
        const cards = document.querySelectorAll('#fqQuestionsWrap .cc-q-card');
        const card = cards[cards.length - 1];
        card.querySelector('.q-text').value = s.text;
        card.querySelectorAll('.q-opt').forEach((inp, idx) => { inp.value = s.opts[idx] || ''; });
        card.querySelector('.q-answer').value = s.ans;
    });
    quizRefreshSummaryBadge();
    _showSuccess('Loaded sample interactive quiz questions!');
};

window.quizToggleType = (sel, n) => {
    const mcqSec = document.querySelector('.mcq-section-' + n);
    const descSec = document.querySelector('.desc-section-' + n);
    const card = document.getElementById('qcard_' + n);
    const isMcq = sel.value === 'MCQ';
    if (mcqSec) mcqSec.style.display = isMcq ? 'block' : 'none';
    if (descSec) descSec.style.display = isMcq ? 'none' : 'block';
    if (card) {
        card.querySelectorAll('.q-opt[data-opt="0"], .q-opt[data-opt="1"], .q-answer').forEach(el => {
            el.required = isMcq;
        });
    }
};

// ── Faculty: Create & Publish Quiz ───────────────────────────────────────────
window.quizHandleCreate = async (e) => {
    e.preventDefault();

    const title = document.getElementById('fqTitle').value.trim();
    const secSel = document.getElementById('fqSectionId');
    const sectionId = parseInt(secSel?.value) || 0;
    const sectionLabel = (secSel && secSel.selectedIndex > 0) ? secSel.options[secSel.selectedIndex].text : 'selected section';
    if (!sectionId) {
        alert('Please select a target class section before publishing.');
        return;
    }
    const teacherId = parseInt(document.getElementById('fqTeacherId').value) || 1;
    const subjectName = document.getElementById('fqSubject')?.value.trim() || '';
    const topic = document.getElementById('fqTopic')?.value.trim() || '';
    const difficulty = document.getElementById('fqDifficulty')?.value || 'Medium';
    const durationMinutes = parseInt(document.getElementById('fqDuration')?.value) || 15;
    const passingPercentage = parseFloat(document.getElementById('fqPassPercent')?.value) || 50;

    const questions = [];
    document.querySelectorAll('[id^="qcard_"]').forEach(card => {
        const type = card.querySelector('.q-type').value;
        const text = card.querySelector('.q-text').value.trim();
        const marks = parseInt(card.querySelector('.q-marks').value) || 10;

        let options = '';
        let correct = '';

        if (type === 'MCQ') {
            const opts = [...card.querySelectorAll('.q-opt')].map(i => i.value.trim()).filter(v => v);
            options = opts.join(',');
            correct = card.querySelector('.q-answer').value.trim();
        } else {
            options = '';
            correct = card.querySelector('.q-answer-desc') ? card.querySelector('.q-answer-desc').value.trim() : '';
        }

        if (text) {
            questions.push({ questionText: text, type, options, correctAnswer: correct, marks, topicConcept: topic, difficulty });
        }
    });

    if (questions.length === 0) {
        alert('Please add at least one question.');
        return;
    }

    const payload = { sectionId, teacherId, title, subjectName, topic, difficulty, durationMinutes, passingPercentage, questions };

    try {
        const res = await fetch('/api/quizzes', {
            method: 'POST',
            headers: _authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const msg = `Quiz "${title}" published to ${sectionLabel} students!`;
            _showSuccess(msg);
            if (_voiceEnabled) quizSpeakFeedback(msg);
            document.getElementById('quizCreateForm').reset();
            document.getElementById('fqQuestionsWrap').innerHTML = '';
            _questionCount = 0;
            quizAddQuestion();
            const preview = document.getElementById('fqTargetSectionPreview');
            if (preview) preview.innerText = 'Not selected';
        } else {
            const errText = await res.text();
            alert('Failed to create quiz:\n' + errText);
        }
    } catch (err) {
        console.error(err);
        alert('Network error. Is the backend running?');
    }
};

// ── Faculty: Load Quiz List for Results Tab ──────────────────────────────────
window.quizLoadFacultyList = async () => {
    const tchId = document.getElementById('fqTeacherId').value || _teacherId();
    try {
        const res = await fetch('/api/quizzes/teacher/' + tchId, { headers: _authHeaders() });
        const list = await res.json();
        const sel = document.getElementById('fqQuizSelect');
        sel.innerHTML = '<option value="">-- Choose a Quiz --</option>' +
            list.map(q => {
                const secLabel = q.section ? (q.section.sectionName || ('Section ' + q.section.id)) : '';
                const label = q.title + (secLabel ? ' — ' + secLabel : '');
                return `<option value="${q.id}">${label}</option>`;
            }).join('');
        document.getElementById('fqResultsBody').innerHTML = '';
    } catch (err) { console.error(err); }
};

// ── Faculty: Load Results for Selected Quiz ──────────────────────────────────
window.quizLoadResults = async (quizId) => {
    const body = document.getElementById('fqResultsBody');
    const deleteBtn = document.getElementById('fqDeleteQuizBtn');
    
    if (!quizId) { 
        body.innerHTML = ''; 
        if (deleteBtn) deleteBtn.style.display = 'none';
        return; 
    }
    
    if (deleteBtn) deleteBtn.style.display = 'block';
    
    body.innerHTML = '<div class="text-muted">Loading...</div>';

    const [allRes, weakRes] = await Promise.all([
        fetch('/api/quizzes/' + quizId + '/results', { headers: _authHeaders() }),
        fetch('/api/quizzes/' + quizId + '/results/weak', { headers: _authHeaders() })
    ]);
    const all  = await allRes.json();
    const weak = await weakRes.json();

    // ── Compute aggregate stats ───────────────────────────────────────────────
    const total = all.length;
    const passCount = all.filter(r => (r.percentage || 0) >= 50).length;
    const failCount = total - passCount;
    const avgPct = total > 0 ? (all.reduce((s, r) => s + (r.percentage || 0), 0) / total) : 0;
    const classAccuracy = avgPct.toFixed(1);
    const passRate = total > 0 ? ((passCount / total) * 100).toFixed(1) : '0.0';

    // ── Per-student row with precision/accuracy ───────────────────────────────
    const tableRows = all.map(r => {
        const pct = r.percentage != null ? r.percentage.toFixed(1) : '0.0';
        const reg = r.student ? (r.student.registerNumber || r.student.id) : '?';
        const n = r.student ? (r.student.name || r.student.studentName || r.student.firstName || 'Unknown') : 'Unknown';
        const name = `${reg} - ${n}`;
        // Compute per-student answer accuracy
        let correct = 0, totalQ = 0;
        if (r.answers && r.answers.length > 0) {
            totalQ = r.answers.length;
            correct = r.answers.filter(a => a.isCorrect).length;
        }
        const accuracy = totalQ > 0 ? ((correct / totalQ) * 100).toFixed(1) : '?';
        const level = parseFloat(pct) >= 75 ? {label:'Excellent',cls:'success'} :
                      parseFloat(pct) >= 50 ? {label:'Proficient',cls:'info'} :
                      parseFloat(pct) >= 35 ? {label:'Developing',cls:'warning'} :
                      {label:'Needs Help',cls:'danger'};
        const badgePct = `<span class="badge bg-${level.cls}">${pct}%</span>`;
        // --- Timing fields ---
        let submittedDisplay = '<span class="text-muted small">—</span>';
        let timeTakenDisplay = '<span class="text-muted small">—</span>';
        if (r.submittedAt) {
            const subDate = new Date(r.submittedAt);
            submittedDisplay = `<span class="text-info small" title="${subDate.toLocaleString()}">
                <i class="fa-solid fa-clock me-1"></i>${subDate.toLocaleDateString()} ${subDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </span>`;
            if (r.startedAt) {
                const startDate = new Date(r.startedAt);
                const diffMs = subDate - startDate;
                if (diffMs >= 0) {
                    const totalSec = Math.floor(diffMs / 1000);
                    const mins = Math.floor(totalSec / 60);
                    const secs = totalSec % 60;
                    timeTakenDisplay = `<span class="badge" style="background:#1e3a5f;color:#7dd3fc;">
                        <i class="fa-solid fa-stopwatch me-1"></i>${mins}m ${secs}s
                    </span>`;
                }
            }
        }
        return `<tr>
            <td class="fw-bold">${name}</td>
            <td>${r.totalScore ?? 0}</td>
            <td>${badgePct}</td>
            <td>${correct}/${totalQ} <span class="text-muted small">(${accuracy}%)</span></td>
            <td>${submittedDisplay}</td>
            <td>${timeTakenDisplay}</td>
            <td><span class="badge bg-${level.cls}">${level.label}</span></td>
        </tr>`;
    }).join('');

    // ── Class performance chart data ──────────────────────────────────────────
    const chartId = 'fqClassChart_' + quizId;
    const studentNames = all.map(r => {
        const reg = r.student ? (r.student.registerNumber || r.student.id) : '?';
        const n = r.student ? (r.student.name || r.student.studentName || r.student.firstName || 'Unknown') : 'Unknown';
        return `${reg} - ${n}`;
    });
    const studentPcts  = all.map(r => +(r.percentage || 0).toFixed(1));

    const weakCards = weak.length === 0
        ? '<p class="text-success fw-bold"><i class="fa-solid fa-trophy me-1"></i> All students scored 50% or above!</p>'
        : weak.map(r => {
            const reg = r.student ? (r.student.registerNumber || r.student.id) : '?';
            const n = r.student ? (r.student.name || r.student.studentName || r.student.firstName || 'Unknown') : 'Unknown';
            const name = `${reg} - ${n}`;
            const pct = r.percentage != null ? r.percentage.toFixed(1) : '0.0';
            let correct = 0, totalQ = 0;
            if (r.answers && r.answers.length > 0) {
                totalQ = r.answers.length;
                correct = r.answers.filter(a => a.isCorrect).length;
            }
            const accuracy = totalQ > 0 ? ((correct / totalQ) * 100).toFixed(1) : '?';
            return `
            <div class="card mb-3 cc-weak-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <strong class="text-danger"><i class="fa-solid fa-user-xmark me-1"></i>${name}</strong>
                    <div class="d-flex gap-2 align-items-center">
                        <span class="badge bg-danger">${pct}%</span>
                        <span class="badge bg-secondary">Accuracy: ${accuracy}%</span>
                    </div>
                </div>
                <div class="card-body">
                    <h6 class="text-warning"><i class="fa-solid fa-robot me-1"></i>AI Weakness Analysis</h6>
                    <p style="color:#fde68a;white-space:pre-wrap;">${r.aiWeaknessAnalysis || 'No analysis available.'}</p>
                </div>
            </div>`;
        }).join('');

    body.innerHTML = `
        <!-- Summary Stats Cards -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="p-3 rounded text-center cc-metric-green">
                    <div class="fs-4 fw-bold text-success">${total}</div>
                    <div class="small text-muted">Students Attempted</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="p-3 rounded text-center cc-metric-blue">
                    <div class="fs-4 fw-bold text-info">${classAccuracy}%</div>
                    <div class="small text-muted">Class Avg Score</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="p-3 rounded text-center cc-metric-amber">
                    <div class="fs-4 fw-bold text-warning">${passRate}%</div>
                    <div class="small text-muted">Pass Rate</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="p-3 rounded text-center cc-metric-red">
                    <div class="fs-4 fw-bold text-danger">${failCount}</div>
                    <div class="small text-muted">Need Attention</div>
                </div>
            </div>
        </div>

        <!-- Class Performance Bar Chart -->
        ${total > 0 ? `
        <div class="mb-4 p-3 rounded cc-dash-card">
            <h6 class="fw-bold mb-3" style="color:${_quizIsLight() ? '#4f46e5' : '#a78bfa'};"><i class="fa-solid fa-chart-bar me-2"></i>Student Performance Overview</h6>
            <canvas id="${chartId}" height="120"></canvas>
        </div>` : ''}

        <!-- Detailed Table -->
        <h6 class="fw-bold mb-2">All Submissions (${all.length})</h6>
        <div class="table-responsive mb-4">
            <table class="table table-sm cc-analytics-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Accuracy (Q)</th>
                        <th><i class="fa-solid fa-calendar-check me-1 text-info"></i>Submitted At</th>
                        <th><i class="fa-solid fa-stopwatch me-1 text-warning"></i>Time Taken</th>
                        <th>Level</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
        <h6 class="fw-bold text-danger mb-2"><i class="fa-solid fa-triangle-exclamation me-1"></i>Needs Attention (below 50%)</h6>
        ${weakCards}
    `;

    // ── Render chart after DOM update ────────────────────────────────────────
    if (total > 0) {
        setTimeout(() => {
            _ensureChartJs(() => {
                const ctx = document.getElementById(chartId);
                if (!ctx) return;
                const colors = studentPcts.map(p =>
                    p >= 75 ? 'rgba(16,185,129,0.8)' :
                    p >= 50 ? 'rgba(59,130,246,0.8)' :
                    p >= 35 ? 'rgba(234,179,8,0.8)' :
                    'rgba(239,68,68,0.8)'
                );
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: studentNames,
                        datasets: [{
                            label: 'Score (%)',
                            data: studentPcts,
                            backgroundColor: colors,
                            borderColor: colors.map(c => c.replace('0.8','1')),
                            borderWidth: 1,
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: ctx => `Score: ${ctx.raw}%`
                                }
                            }
                        },
                        scales: {
                            y: {
                                min: 0, max: 100,
                                grid: { color: _quizChartColors().grid },
                                ticks: { color: _quizChartColors().text, callback: v => v + '%' }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: _quizChartColors().text, maxRotation: 45 }
                            }
                        }
                    }
                });
            });
        }, 100);
    }
};

// ── Student Quiz Interactive State ───────────────────────────────────────────
let _sqTimerInterval = null;
let _sqSecondsLeft = 0;
let _sqCurrentStep = 0;
let _sqShowAllMode = false;

function _clearStudentQuizTimer() {
    if (_sqTimerInterval) {
        clearInterval(_sqTimerInterval);
        _sqTimerInterval = null;
    }
}

function _launchStudentConfetti() {
    const colors = ['#10b981', '#38bdf8', '#fbbf24', '#a78bfa', '#f43f5e'];
    for (let i = 0; i < 42; i++) {
        const p = document.createElement('div');
        p.className = 'sq-confetti-piece';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.background = colors[i % colors.length];
        p.style.animationDelay = (Math.random() * 0.7) + 's';
        p.style.borderRadius = i % 2 === 0 ? '50%' : '2px';
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 3200);
    }
}

function _updateStudentQuizProgress() {
    if (!_currentQuizData || !Array.isArray(_currentQuizData.questions)) return;
    const qs = _currentQuizData.questions;
    let answered = 0;
    let totalSelectedMarks = 0;
    const pillsWrap = document.getElementById('sqQuestionPills');
    let pillsHtml = '';

    qs.forEach((q, idx) => {
        let isAns = false;
        if (q.type === 'MCQ') {
            isAns = !!document.querySelector(`[name="sq_q_${q.id}"]:checked`);
        } else {
            isAns = !!document.getElementById(`sq_desc_${q.id}`)?.value.trim();
        }
        if (isAns) {
            answered++;
            totalSelectedMarks += Number(q.marks || 10);
        }
        const cls = (!_sqShowAllMode && idx === _sqCurrentStep) ? 'active' : (isAns ? 'answered' : '');
        pillsHtml += `<button type="button" class="sq-q-pill ${cls}" onclick="quizStudentJumpTo(${idx})">${idx + 1}</button>`;
    });

    if (pillsWrap) pillsWrap.innerHTML = pillsHtml;
    const labelEl = document.getElementById('sqProgressLabel');
    if (labelEl) labelEl.innerText = _sqShowAllMode
        ? `Showing all ${qs.length} questions • ${answered}/${qs.length} Answered`
        : `Question ${_sqCurrentStep + 1} of ${qs.length} • ${answered}/${qs.length} Answered`;
    const ansScoreEl = document.getElementById('sqAnsweredScoreText');
    if (ansScoreEl) ansScoreEl.innerText = `${answered}/${qs.length} Answered`;
    const ptsEl = document.getElementById('sqPotentialPtsText');
    if (ptsEl) ptsEl.innerText = `${totalSelectedMarks} Pts`;
    const barEl = document.getElementById('sqProgressBar');
    if (barEl) barEl.style.width = `${qs.length ? Math.round((answered / qs.length) * 100) : 0}%`;

    qs.forEach((_, idx) => {
        const card = document.getElementById(`sq_qcard_${idx}`);
        if (card) card.style.display = (_sqShowAllMode || idx === _sqCurrentStep) ? 'block' : 'none';
    });

    const stepBtns = document.getElementById('sqStepNavBtns');
    if (stepBtns) stepBtns.style.display = _sqShowAllMode ? 'none' : 'flex';
    const prevBtn = document.getElementById('sqPrevQBtn');
    const nextBtn = document.getElementById('sqNextQBtn');
    if (prevBtn) prevBtn.disabled = _sqCurrentStep <= 0;
    if (nextBtn) nextBtn.disabled = _sqCurrentStep >= qs.length - 1;
}

window.quizSelectOptionTile = (qId, optIdx) => {
    const radio = document.getElementById(`sq_${qId}_${optIdx}`);
    if (!radio) return;
    radio.checked = true;
    document.querySelectorAll(`[data-q-tile="${qId}"]`).forEach(el => el.classList.remove('selected'));
    document.getElementById(`sq_tile_${qId}_${optIdx}`)?.classList.add('selected');
    _updateStudentQuizProgress();
};

// Keyboard shortcuts 1-4 / A-D on active single-question Blooket stage
document.addEventListener('keydown', (ev) => {
    if (!_quizActive || !_currentQuizData || _sqShowAllMode) return;
    const tag = (ev.target && ev.target.tagName) ? ev.target.tagName.toUpperCase() : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const q = _currentQuizData.questions?.[_sqCurrentStep];
    if (!q || q.type !== 'MCQ') return;
    const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
    const idx = keyMap[String(ev.key || '').toLowerCase()];
    if (idx !== undefined) {
        window.quizSelectOptionTile(q.id, idx);
    }
});

window.quizStudentJumpTo = (idx) => {
    if (!_currentQuizData || !_currentQuizData.questions.length) return;
    _sqShowAllMode = false;
    const btn = document.getElementById('sqViewModeBtn');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-list me-1"></i> Show All';
    _sqCurrentStep = Math.max(0, Math.min(_currentQuizData.questions.length - 1, idx));
    _updateStudentQuizProgress();
};

window.quizStudentGoStep = (delta) => {
    quizStudentJumpTo(_sqCurrentStep + delta);
};

window.quizToggleStudentViewMode = () => {
    _sqShowAllMode = !_sqShowAllMode;
    const btn = document.getElementById('sqViewModeBtn');
    if (btn) btn.innerHTML = _sqShowAllMode
        ? '<i class="fa-solid fa-bullseye me-1"></i> Focus Mode'
        : '<i class="fa-solid fa-list me-1"></i> Show All';
    _updateStudentQuizProgress();
};

// ── Student: Open Modal ──────────────────────────────────────────────────────
window.openStudentQuizModal = async () => {
    if (typeof window.refreshStudentQuizVisibility === 'function') {
        const vis = await window.refreshStudentQuizVisibility();
        if (vis && vis.visible === false) {
            if (typeof showToast === 'function') {
                showToast('Quiz Hidden', 'Quiz access is currently disabled for your class.', 'error');
            } else {
                alert('Quiz access is currently disabled for your class.');
            }
            return;
        }
    }
    const dlg = document.getElementById('sqModalDialog');
    if (dlg) dlg.className = 'modal-dialog modal-lg modal-dialog-scrollable';
    _clearStudentQuizTimer();
    document.getElementById('sqListContainer').style.display = 'block';
    document.getElementById('sqActiveContainer').style.display = 'none';
    document.getElementById('sqResultContainer').style.display = 'none';
    document.getElementById('sqCloseBtn').style.display = 'block';

    const listEl = document.getElementById('sqQuizList');
    const noEl   = document.getElementById('sqNoQuiz');
    listEl.innerHTML = '<p class="text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Loading quiz challenges...</p>';

    try {
        const info = await _resolveStudentInfo();
        const secId = (info && info.sectionId) ? info.sectionId : 1;

        const res  = await fetch('/api/quizzes/section/' + secId, { headers: _authHeaders() });
        if (res.status === 403) {
            listEl.innerHTML = '';
            noEl.style.display = 'block';
            noEl.innerHTML = '<div class="alert alert-warning mb-0"><i class="fa-solid fa-eye-slash me-2"></i>Quiz access is currently disabled for your class by Faculty or Admin.</div>';
            if (typeof window.refreshStudentQuizVisibility === 'function') window.refreshStudentQuizVisibility();
            return;
        }
        const list = await res.json();

        if (!list || list.length === 0) {
            listEl.innerHTML = '';
            noEl.style.display = 'block';
        } else {
            noEl.style.display = 'none';
            listEl.innerHTML = list.map(q => {
                const qCount = Array.isArray(q.questions) ? q.questions.length : 0;
                const totalM = Array.isArray(q.questions) ? q.questions.reduce((s, item) => s + (item.marks || 10), 0) : 0;
                const diff = q.difficulty || 'Medium';
                const diffCls = diff === 'Easy' ? 'bg-success' : (diff === 'Hard' ? 'bg-danger' : 'bg-warning text-dark');
                const dur = q.durationMinutes || 15;
                const passPct = q.passingPercentage || 50;
                return `
                <div class="sq-challenge-card d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                        <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                            <span class="badge ${diffCls}">${diff}</span>
                            ${q.subjectName ? `<span class="badge bg-info text-dark">${q.subjectName}</span>` : ''}
                            ${q.topic ? `<span class="badge bg-secondary">${q.topic}</span>` : ''}
                        </div>
                        <h5 class="fw-bold text-white mb-1"><i class="fa-solid fa-bolt text-warning me-2"></i>${q.title}</h5>
                        <div class="small text-light opacity-75">
                            <span><i class="fa-solid fa-list-check me-1 text-info"></i>${qCount} Questions</span> &bull;
                            <span><i class="fa-solid fa-trophy me-1 text-warning"></i>${totalM} Marks</span> &bull;
                            <span><i class="fa-solid fa-stopwatch me-1 text-success"></i>${dur} mins</span> &bull;
                            <span>Pass: ${passPct}%</span>
                        </div>
                    </div>
                    <button type="button" class="sq-play-3d-btn" onclick="quizStudentStart(${q.id})">
                        <i class="fa-solid fa-play me-1"></i> Play Quiz
                    </button>
                </div>`;
            }).join('');
        }
    } catch (err) {
        console.error(err);
        listEl.innerHTML = '<p class="text-danger">Failed to load quizzes. Please try again.</p>';
    }

    new bootstrap.Modal(document.getElementById('studentQuizModal')).show();
};

// ── Student: Start Quiz (Interactive Runner + Timer + Firewall) ───────────────
window.quizStudentStart = async (quizId) => {
    try {
        const info  = await _resolveStudentInfo();
        const secId = (info && info.sectionId) ? info.sectionId : 1;
        const res   = await fetch('/api/quizzes/section/' + secId, { headers: _authHeaders() });
        const list  = await res.json();
        const quiz  = list.find(q => q.id === quizId);
        if (!quiz) { alert('Quiz not found.'); return; }

        _currentQuizData = quiz;
        _quizActive = true;
        _sqCurrentStep = 0;
        _sqShowAllMode = false;

        const dlg = document.getElementById('sqModalDialog');
        if (dlg) dlg.className = 'modal-dialog modal-xl modal-dialog-scrollable';
        document.getElementById('sqCloseBtn').style.display = 'none';
        document.getElementById('sqListContainer').style.display = 'none';
        document.getElementById('sqResultContainer').style.display = 'none';
        document.getElementById('sqActiveContainer').style.display = 'block';
        document.getElementById('sqQuizTitle').innerText = quiz.title;
        const metaEl = document.getElementById('sqQuizMetaLine');
        if (metaEl) {
            metaEl.innerText = [quiz.subjectName, quiz.topic, quiz.difficulty || 'Medium'].filter(Boolean).join(' • ');
        }
        const viewBtn = document.getElementById('sqViewModeBtn');
        if (viewBtn) viewBtn.innerHTML = '<i class="fa-solid fa-list me-1"></i> Show All';

        // Start Countdown Timer
        _clearStudentQuizTimer();
        _sqSecondsLeft = Math.max(1, Number(quiz.durationMinutes || 15)) * 60;
        const renderTimer = () => {
            const m = Math.floor(_sqSecondsLeft / 60);
            const s = _sqSecondsLeft % 60;
            const tEl = document.getElementById('sqTimerText');
            const bEl = document.getElementById('sqTimerBadge');
            if (tEl) tEl.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            if (bEl && _sqSecondsLeft <= 60) {
                bEl.className = 'badge bg-danger text-white fs-6 px-3 py-2';
            }
        };
        renderTimer();
        _sqTimerInterval = setInterval(() => {
            if (_sqSecondsLeft > 0) {
                _sqSecondsLeft--;
                renderTimer();
            } else {
                _clearStudentQuizTimer();
            }
        }, 1000);

        // Render play.blooket.com style Question Stage + 2x2 Colored 3D Answer Grid
        const qBody = document.getElementById('sqQuestionsBody');
        const blooketShapes = ['▲', '◆', '●', '■'];
        const escHtml = v => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        qBody.innerHTML = quiz.questions.map((q, idx) => {
            const opts = q.type === 'MCQ'
                ? (q.options || '').split(',').map(o => o.trim()).filter(o => o)
                : [];
            const diffBadge = q.difficulty || quiz.difficulty || 'Medium';

            const inputHtml = q.type === 'MCQ'
                ? `<div class="sq-blooket-grid">` + opts.map((opt, i) => `
                    <div class="sq-opt-tile sq-blooket-tile-${i % 4}" id="sq_tile_${q.id}_${i}" data-q-tile="${q.id}" onclick="quizSelectOptionTile(${q.id}, ${i})">
                        <input class="form-check-input m-0 d-none" type="radio" name="sq_q_${q.id}" id="sq_${q.id}_${i}" value="${escHtml(opt)}">
                        <span class="sq-opt-shape">${blooketShapes[i % 4]}</span>
                        <span class="flex-grow-1" style="line-height:1.3;">${escHtml(opt)}</span>
                        <span class="sq-opt-selected-badge"><i class="fa-solid fa-check me-1"></i>SELECTED</span>
                    </div>`).join('') + `</div>`
                : `<div class="mt-3 p-3 rounded sq-desc-wrap" style="background:rgba(10,4,31,0.9);border:2px solid #7c3aed;">
                        <textarea name="sq_q_${q.id}" id="sq_desc_${q.id}" rows="5"
                            class="form-control"
                            style="background:#0a1628;color:#e0f0ff;border-color:#3b82f6;font-size:0.98rem;"
                            oninput="_updateStudentQuizProgress()"
                            placeholder="Write your clear answer here..."></textarea>
                   </div>`;

            return `
            <div id="sq_qcard_${idx}" class="mb-3">
                <div class="sq-blooket-qbox">
                    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                        <span class="badge" style="background:#5b21b6;color:#fff;font-size:0.85rem;padding:6px 12px;">
                            Question ${idx + 1} of ${quiz.questions.length}
                        </span>
                        <div class="d-flex gap-2 align-items-center">
                            <span class="badge bg-secondary">${escHtml(diffBadge)}</span>
                            <span class="badge bg-warning text-dark fw-bold">+${q.marks} Pts</span>
                        </div>
                    </div>
                    <h4 class="fw-bold mb-0 text-center py-2" style="color:#1e1b4b; line-height:1.4;">
                        ${escHtml(q.questionText)}
                    </h4>
                </div>
                ${inputHtml}
            </div>`;
        }).join('');

        document.getElementById('sqForm').dataset.quizId = quizId;
        _updateStudentQuizProgress();

    } catch (err) {
        console.error(err);
        alert('Error loading quiz: ' + err.message);
    }
};

// ── Student: Submit Quiz ─────────────────────────────────────────────────────
window.quizStudentSubmit = async (e) => {
    e.preventDefault();
    if (!_currentQuizData) return;

    const unanswered = _currentQuizData.questions.filter(q => {
        if (q.type === 'MCQ') return !document.querySelector(`[name="sq_q_${q.id}"]:checked`);
        return !document.getElementById(`sq_desc_${q.id}`)?.value.trim();
    });
    if (unanswered.length > 0 && !confirm(`You still have ${unanswered.length} unanswered question(s). Submit anyway?`)) {
        return;
    }

    const quizId = document.getElementById('sqForm').dataset.quizId;
    const info = await _resolveStudentInfo();
    if (!info || !info.studentId) {
        alert('Could not identify your student account. Make sure you are logged in as a student.');
        return;
    }
    const studentId = info.studentId;

    const answers = _currentQuizData.questions.map(q => {
        let text = '';
        if (q.type === 'MCQ') {
            const checked = document.querySelector(`[name="sq_q_${q.id}"]:checked`);
            text = checked ? checked.value : '';
        } else {
            const area = document.getElementById('sq_desc_' + q.id);
            text = area ? area.value : '';
        }
        return { questionId: q.id, answerText: text };
    });

    try {
        const res = await fetch('/api/quizzes/' + quizId + '/submit', {
            method: 'POST',
            headers: _authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ studentId, answers })
        });

        if (res.ok) {
            const sub = await res.json();
            _quizActive = false;
            _clearStudentQuizTimer();

            const dlg = document.getElementById('sqModalDialog');
            if (dlg) dlg.className = 'modal-dialog modal-lg modal-dialog-scrollable';
            document.getElementById('sqActiveContainer').style.display = 'none';
            document.getElementById('sqCloseBtn').style.display = 'block';

            const pct = sub.percentage != null ? sub.percentage.toFixed(1) : '0.0';
            const passPct = Number(_currentQuizData.passingPercentage || 50);
            const isPassed = parseFloat(pct) >= passPct;
            if (isPassed) _launchStudentConfetti();

            let correct = 0, totalQ = 0;
            if (sub.answers && sub.answers.length > 0) {
                totalQ = sub.answers.length;
                correct = sub.answers.filter(a => a.isCorrect).length;
            }
            const accuracy = totalQ > 0 ? ((correct / totalQ) * 100).toFixed(1) : '0.0';
            const level = parseFloat(pct) >= 75 ? { label: 'Quiz Champion 🏆', color: '#10b981' } :
                          parseFloat(pct) >= 50 ? { label: 'Sharp Mind ⚡', color: '#3b82f6' } :
                          parseFloat(pct) >= 35 ? { label: 'Rising Scholar 📈', color: '#eab308' } :
                          { label: 'Keep Practicing 📚', color: '#ef4444' };
            const donutId = 'sq_donut_' + sub.id;

            const reviewHtml = (sub.answers || []).map((a, idx) => {
                const q = a.question || {};
                return `<div class="p-2 px-3 rounded mb-2 small cc-sub-strip" style="border:1px solid ${a.isCorrect ? '#10b981' : '#ef4444'};">
                    <div class="fw-bold text-white">Q${idx + 1}. ${q.questionText || ''}</div>
                    <div class="mt-1">Your answer: <span class="${a.isCorrect ? 'text-success' : 'text-danger'} fw-bold">${a.answerText || '(Blank)'}</span>
                    ${!a.isCorrect && q.correctAnswer ? ` &bull; Correct: <span class="text-success fw-bold">${q.correctAnswer}</span>` : ''}</div>
                </div>`;
            }).join('');

            document.getElementById('sqResultContainer').style.display = 'block';
            document.getElementById('sqResultContainer').innerHTML = `
                <div class="text-center mb-4">
                    <div style="font-size:3rem;">${isPassed ? '🎉' : '📚'}</div>
                    <h4 class="fw-bold mt-2" style="color:${level.color}">${level.label}</h4>
                    <span class="badge bg-primary border border-info px-3 py-1">+${sub.totalScore ?? 0} XP Earned</span>
                </div>
                <div class="row g-3 mb-4">
                    <div class="col-6 col-md-3">
                        <div class="p-3 rounded text-center cc-metric-green">
                            <div class="fs-3 fw-bold" style="color:${level.color}">${pct}%</div>
                            <div class="small text-muted mt-1">Score</div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="p-3 rounded text-center cc-metric-blue">
                            <div class="fs-3 fw-bold text-info">${accuracy}%</div>
                            <div class="small text-muted mt-1">Accuracy</div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="p-3 rounded text-center cc-metric-amber">
                            <div class="fs-3 fw-bold text-warning">${correct}/${totalQ}</div>
                            <div class="small text-muted mt-1">Correct</div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="p-3 rounded text-center cc-metric-purple">
                            <div class="fs-3 fw-bold text-info">${sub.totalScore ?? 0}</div>
                            <div class="small text-muted mt-1">Marks</div>
                        </div>
                    </div>
                </div>
                <div class="d-flex justify-content-center mb-3">
                    <div style="width:180px;height:180px;"><canvas id="${donutId}"></canvas></div>
                </div>
                ${reviewHtml ? `<div class="mb-3"><h6 class="fw-bold text-info mb-2"><i class="fa-solid fa-magnifying-glass-chart me-1"></i>Answer Review</h6>${reviewHtml}</div>` : ''}
                ${!isPassed && sub.aiWeaknessAnalysis ? `
                <div class="p-3 rounded mb-3 cc-weak-card">
                    <h6 class="text-warning fw-bold"><i class="fa-solid fa-robot me-1"></i>AI Study Recommendations</h6>
                    <p style="color:#fde68a;white-space:pre-wrap;">${sub.aiWeaknessAnalysis}</p>
                </div>` : ''}
                <div class="text-center mt-4">
                    <button class="btn btn-outline-info" data-bs-dismiss="modal">Close</button>
                </div>
            `;
            _ensureChartJs(() => {
                const ctx = document.getElementById(donutId);
                if (!ctx) return;
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Correct', 'Incorrect'],
                        datasets: [{
                            data: [correct, Math.max(0, totalQ - correct)],
                            backgroundColor: ['rgba(16,185,129,0.85)', 'rgba(239,68,68,0.7)'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        cutout: '70%',
                        plugins: {
                            legend: { labels: { color: _quizChartColors().text } },
                            tooltip: { callbacks: { label: c => c.label + ': ' + c.raw + ' Q' } }
                        }
                    }
                });
            });
        } else {
            const errText = await res.text();
            alert('Submission failed: ' + errText);
        }
    } catch (err) {
        console.error(err);
        alert('Network error during submission.');
    }
};

// ── Quiz Firewall: Block Navigation ──────────────────────────────────────────
window.addEventListener('beforeunload', (e) => {
    if (_quizActive) {
        e.preventDefault();
        e.returnValue = 'Quiz is in progress! You must submit before leaving.';
        return e.returnValue;
    }
});

// Block logout button while quiz is active
document.addEventListener('click', (e) => {
    if (!_quizActive) return;
    const target = e.target.closest('button, a');
    if (!target) return;
    // Allow only the quiz submit
    const isSubmit = target.closest('#sqForm');
    if (isSubmit) return;
    // Block close button
    if (target.id === 'sqCloseBtn' || target.closest('[data-bs-dismiss="modal"]')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        alert('⚠️ You cannot leave the quiz! Please submit your answers first.');
        return false;
    }
    // Block logout
    if (target.onclick && target.onclick.toString().includes('logout')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        alert('⚠️ Quiz is active! Submit the quiz before logging out.');
        return false;
    }
}, true);

// ── Utility ──────────────────────────────────────────────────────────────────
function _showSuccess(msg) {
    const el = document.createElement('div');
    el.className = 'alert alert-success position-fixed bottom-0 end-0 m-3 shadow-lg';
    el.style.cssText = 'z-index:9999;max-width:360px;';
    el.innerHTML = `<i class="fa-solid fa-check-circle me-2"></i>${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

/**
 * Dynamically loads Chart.js if not already loaded, then calls `cb`.
 */
function _quizIsLight() {
    return document.body.getAttribute('data-theme') === 'light' ||
        document.documentElement.getAttribute('data-theme') === 'light';
}

function _quizChartColors() {
    const isLight = _quizIsLight();
    return {
        text: isLight ? '#1e293b' : '#94a3b8',
        grid: isLight ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.05)'
    };
}

function _ensureChartJs(cb) {
    if (window.Chart) { cb(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js';
    s.onload = cb;
    document.head.appendChild(s);
}


// ── Student Quiz History ──────────────────────────────────────────────────────
window.openStudentQuizHistoryModal = async () => {
    if (typeof window.refreshStudentQuizVisibility === 'function') {
        const vis = await window.refreshStudentQuizVisibility();
        if (vis && vis.visible === false) {
            if (typeof showToast === 'function') {
                showToast('Quiz Hidden', 'Quiz access is currently disabled for your class.', 'error');
            } else {
                alert('Quiz access is currently disabled for your class.');
            }
            return;
        }
    }
    document.getElementById('sqHistoryDetailContainer').style.display = 'none';
    document.getElementById('sqHistoryListContainer').style.display = 'block';
    const listEl = document.getElementById('sqHistoryList');
    listEl.innerHTML = '<div class="text-center py-4 text-muted">Loading history...</div>';
    
    new bootstrap.Modal(document.getElementById('studentQuizHistoryModal')).show();

    const info = await _resolveStudentInfo();
    if (!info) {
        listEl.innerHTML = '<div class="alert alert-danger">Could not resolve student ID.</div>';
        return;
    }

    try {
        const fetchFn = (typeof apiFetch === 'function') ? apiFetch : fetch;
        const res = await fetchFn(`/api/quizzes/student/${info.studentId}/history`);
        if (!res.ok) throw new Error('Failed to fetch history');
        const history = await res.json();
        
        if (!history || history.length === 0) {
            listEl.innerHTML = '<div class="text-center py-4 text-muted">No quiz history found.</div>';
            return;
        }

        listEl.innerHTML = '';
        history.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        window._quizHistoryData = history;
        
        // ── Performance Summary Chart ─────────────────────────────────────────
        const perfChartId = 'sqHistoryPerfChart';
        const histLabels = [...history].reverse().map(s => s.quiz ? s.quiz.title.substring(0,15) : 'Quiz');
        const histPcts   = [...history].reverse().map(s => +(s.percentage||0).toFixed(1));
        const histAcc    = [...history].reverse().map(s => {
            if (!s.answers || !s.answers.length) return 0;
            const c = s.answers.filter(a => a.isCorrect).length;
            return +((c / s.answers.length) * 100).toFixed(1);
        });

        // Overall stats
        const totalAttempted = history.length;
        const avgScore = (history.reduce((s, r) => s + (r.percentage||0), 0) / totalAttempted).toFixed(1);
        const bestScore = Math.max(...history.map(r => r.percentage||0)).toFixed(1);
        const passedCount = history.filter(r => (r.percentage||0) >= 50).length;
        const overallLevel = parseFloat(avgScore) >= 75 ? {label:'Excellent 🌟',cls:'success'} :
                             parseFloat(avgScore) >= 50 ? {label:'Proficient ✅',cls:'info'} :
                             parseFloat(avgScore) >= 35 ? {label:'Developing 📈',cls:'warning'} :
                             {label:'Needs Improvement 📚',cls:'danger'};

        const summaryHtml = `
            <div class="mb-4 p-3 rounded cc-dash-card">
                <h6 class="fw-bold mb-3" style="color:${_quizIsLight() ? '#4f46e5' : '#a78bfa'};"><i class="fa-solid fa-chart-line me-2"></i>My Performance Dashboard</h6>
                <div class="row g-2 mb-3">
                    <div class="col-6 col-md-3"><div class="p-2 rounded text-center h-100 cc-metric-green d-flex flex-column justify-content-center">
                        <div class="fs-5 fw-bold text-success">${avgScore}%</div><div class="tiny text-muted" style="font-size:0.72rem;">Avg Score</div></div></div>
                    <div class="col-6 col-md-3"><div class="p-2 rounded text-center h-100 cc-metric-blue d-flex flex-column justify-content-center">
                        <div class="fs-5 fw-bold text-info">${bestScore}%</div><div class="tiny text-muted" style="font-size:0.72rem;">Best Score</div></div></div>
                    <div class="col-6 col-md-3"><div class="p-2 rounded text-center h-100 cc-metric-amber d-flex flex-column justify-content-center">
                        <div class="fs-5 fw-bold text-warning">${passedCount}/${totalAttempted}</div><div class="tiny text-muted" style="font-size:0.72rem;">Passed</div></div></div>
                    <div class="col-6 col-md-3"><div class="p-2 rounded text-center h-100 cc-metric-purple d-flex flex-column justify-content-center align-items-center">
                        <span class="badge bg-${overallLevel.cls} cc-level-badge">${overallLevel.label}</span><div class="tiny text-muted mt-1" style="font-size:0.72rem;">Level</div></div></div>
                </div>
                <canvas id="${perfChartId}" height="100"></canvas>
            </div>
        `;

        document.getElementById('sqHistoryPerfSummary')?.remove();
        const summaryEl = document.createElement('div');
        summaryEl.id = 'sqHistoryPerfSummary';
        summaryEl.innerHTML = summaryHtml;
        listEl.parentNode.insertBefore(summaryEl, listEl);

        history.forEach(sub => {
            const quizTitle = sub.quiz ? sub.quiz.title : 'Unknown Quiz';
            const subject = (sub.quiz && sub.quiz.subjectName) ? sub.quiz.subjectName : '';
            const dt = new Date(sub.submittedAt).toLocaleString();
            
            let calculatedMaxMarks = 0;
            if (sub.answers && sub.answers.length > 0) {
                calculatedMaxMarks = sub.answers.reduce((sum, ans) => sum + (ans.question ? ans.question.marks : 0), 0);
            }
            const displayMaxMarks = calculatedMaxMarks > 0 ? calculatedMaxMarks : '?';

            // Per-quiz accuracy
            let correct = 0, totalQ = 0;
            if (sub.answers && sub.answers.length > 0) {
                totalQ = sub.answers.length;
                correct = sub.answers.filter(a => a.isCorrect).length;
            }
            const qAccuracy = totalQ > 0 ? ((correct / totalQ)*100).toFixed(0) : '?';

            let badgeColor = 'bg-danger';
            let levelLabel = 'Needs Help';
            const p = sub.percentage || 0;
            if (p >= 75) { badgeColor = 'bg-success'; levelLabel = 'Excellent'; }
            else if (p >= 50) { badgeColor = 'bg-info'; levelLabel = 'Proficient'; }
            else if (p >= 35) { badgeColor = 'bg-warning text-dark'; levelLabel = 'Developing'; }

            const item = document.createElement('div');
            item.className = 'list-group-item list-group-item-action bg-dark text-white border-secondary mb-2 rounded d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <div class="d-flex w-100 align-items-center" style="cursor:pointer;" onclick="showQuizHistoryDetailsById(${sub.id})">
                    <div class="flex-grow-1">
                        <h6 class="mb-1 text-info fw-bold">${quizTitle} ${subject && subject !== 'null' ? `<small class="text-muted ms-2">${subject}</small>` : ''}</h6>
                        <small class="text-muted"><i class="fa-solid fa-calendar me-1"></i> ${dt}</small>
                        <div class="mt-1">
                            <span class="badge ${badgeColor} me-1">${levelLabel}</span>
                            <span class="badge bg-secondary me-1">Accuracy: ${qAccuracy}%</span>
                            <span class="badge bg-dark border border-secondary">${correct}/${totalQ} Correct</span>
                        </div>
                    </div>
                    <div class="text-end me-3">
                        <span class="badge ${badgeColor} fs-6">${sub.totalScore} / ${displayMaxMarks}</span>
                        <div class="small mt-1">${sub.percentage ? sub.percentage.toFixed(1) : '0'}%</div>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-danger" title="Delete History" onclick="deleteQuizHistory(${sub.id}, event)">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;
            listEl.appendChild(item);
        });

        // Render performance trend chart
        if (histPcts.length > 0) {
            setTimeout(() => {
                _ensureChartJs(() => {
                    const ctx = document.getElementById(perfChartId);
                    if (!ctx) return;
                    const existingChart = Chart.getChart(ctx);
                    if (existingChart) existingChart.destroy();
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: histLabels,
                            datasets: [
                                {
                                    label: 'Score %',
                                    data: histPcts,
                                    borderColor: '#8b5cf6',
                                    backgroundColor: 'rgba(139,92,246,0.1)',
                                    tension: 0.4,
                                    fill: true,
                                    pointBackgroundColor: '#a78bfa',
                                    pointRadius: 5
                                },
                                {
                                    label: 'Accuracy %',
                                    data: histAcc,
                                    borderColor: '#10b981',
                                    backgroundColor: 'rgba(16,185,129,0.08)',
                                    tension: 0.4,
                                    fill: true,
                                    pointBackgroundColor: '#10b981',
                                    pointRadius: 5
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: { labels: { color: _quizChartColors().text } },
                                tooltip: { callbacks: { label: c => c.dataset.label + ': ' + c.raw + '%' } }
                            },
                            scales: {
                                y: { min: 0, max: 100, grid: { color: _quizChartColors().grid }, ticks: { color: _quizChartColors().text, callback: v => v + '%' } },
                                x: { grid: { display: false }, ticks: { color: _quizChartColors().text, maxRotation: 30 } }
                            }
                        }
                    });
                });
            }, 200);
        }

    } catch (e) {
        console.error(e);
        listEl.innerHTML = '<div class="alert alert-danger">Error loading quiz history.</div>';
    }
};

window.showQuizHistoryDetailsById = (subId) => {
    if (!window._quizHistoryData) return;
    const sub = window._quizHistoryData.find(s => s.id === subId);
    if (!sub) return;
    showQuizHistoryDetails(sub);
};

window.deleteQuizHistory = async (subId, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this quiz history?")) return;
    
    try {
        const fetchFn = (typeof apiFetch === 'function') ? apiFetch : fetch;
        const res = await fetchFn(`/api/quizzes/submission/${subId}`, {
            method: 'DELETE'
        });
        
        if (!res.ok) throw new Error("Failed to delete history");
        
        // Refresh the list
        window.openStudentQuizHistoryModal();
    } catch (err) {
        console.error(err);
        alert("Error deleting quiz history.");
    }
};

window.showQuizHistoryDetails = (sub) => {
    document.getElementById('sqHistoryListContainer').style.display = 'none';
    const detailEl = document.getElementById('sqHistoryDetailContent');
    
    // Calculate max marks
    let calculatedMaxMarks = 0;
    if (sub.answers && sub.answers.length > 0) {
        calculatedMaxMarks = sub.answers.reduce((sum, ans) => sum + (ans.question ? ans.question.marks : 0), 0);
    }
    const displayMaxMarks = calculatedMaxMarks > 0 ? calculatedMaxMarks : '?';

    // Compute accuracy
    let correctCount = 0;
    if (sub.answers && sub.answers.length > 0) {
        correctCount = sub.answers.filter(a => a.isCorrect).length;
    }
    const totalQCount = sub.answers ? sub.answers.length : 0;
    const detailAccuracy = totalQCount > 0 ? ((correctCount / totalQCount)*100).toFixed(1) : '0.0';
    const detailLevel = parseFloat(sub.percentage||0) >= 75 ? {label:'Excellent 🌟',color:'#10b981'} :
                        parseFloat(sub.percentage||0) >= 50 ? {label:'Proficient ✅',color:'#3b82f6'} :
                        parseFloat(sub.percentage||0) >= 35 ? {label:'Developing 📈',color:'#eab308'} :
                        {label:'Needs Improvement 📚',color:'#ef4444'};
    const detailDonutId = 'detail_donut_' + sub.id;

    let html = `
        <h5 class="text-info fw-bold mb-1">${sub.quiz ? sub.quiz.title : 'Quiz'}</h5>
        <div class="mb-3 text-muted small">Submitted: ${new Date(sub.submittedAt).toLocaleString()}</div>
        <!-- Metrics Row -->
        <div class="row g-2 mb-4">
            <div class="col-6 col-md-3">
                <div class="p-2 rounded text-center h-100 cc-metric-green d-flex flex-column justify-content-center">
                    <div class="fs-5 fw-bold" style="color:${detailLevel.color}">${sub.percentage ? sub.percentage.toFixed(1) : '0'}%</div>
                    <div class="tiny text-muted" style="font-size:0.72rem;">Score</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="p-2 rounded text-center h-100 cc-metric-blue d-flex flex-column justify-content-center">
                    <div class="fs-5 fw-bold text-info">${detailAccuracy}%</div>
                    <div class="tiny text-muted" style="font-size:0.72rem;">Accuracy</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="p-2 rounded text-center h-100 cc-metric-amber d-flex flex-column justify-content-center">
                    <div class="fs-5 fw-bold text-warning">${correctCount}/${totalQCount}</div>
                    <div class="tiny text-muted" style="font-size:0.72rem;">Correct / Total</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="p-2 rounded text-center h-100 cc-metric-purple d-flex flex-column justify-content-center align-items-center">
                    <div class="cc-level-badge fw-bold" style="color:${detailLevel.color};">${detailLevel.label}</div>
                    <div class="tiny text-muted" style="font-size:0.72rem;">Level</div>
                </div>
            </div>
        </div>
        <!-- Accuracy Donut -->
        <div class="d-flex justify-content-center mb-4">
            <div style="width:160px;height:160px;"><canvas id="${detailDonutId}"></canvas></div>
        </div>
        ${sub.aiWeaknessAnalysis ? `<div class="p-3 rounded mb-3 cc-weak-card"><div class="text-warning small"><strong>AI Feedback:</strong><br/>${sub.aiWeaknessAnalysis.replace(/\\n/g, '<br/>')}</div></div>` : ''}
        <h6 class="fw-bold mb-3 border-bottom border-secondary pb-2">Questions & Answers</h6>
    `;

    if (!sub.answers || sub.answers.length === 0) {
        html += `<div class="text-muted small">No detailed answers available.</div>`;
    } else {
        sub.answers.forEach((ans, idx) => {
            const q = ans.question;
            const isCorrect = ans.isCorrect;
            
            let colorClass = isCorrect ? 'text-success' : 'text-danger';
            let icon = isCorrect ? '<i class="fa-solid fa-check text-success"></i>' : '<i class="fa-solid fa-xmark text-danger"></i>';

            html += `
                <div class="mb-4 p-3 border border-secondary rounded cc-detail-answer-card">
                    <div class="fw-bold mb-2">Q${idx + 1}. ${q ? q.questionText : 'Unknown Question'}</div>
                    <div class="small mb-1"><span class="text-muted">Your Answer:</span> <span class="${colorClass} fw-bold">${ans.answerText || '-'}</span> ${icon}</div>
                    ${!isCorrect && q && q.correctAnswer ? `<div class="small"><span class="text-muted">Correct Answer:</span> <span class="text-success fw-bold">${q.correctAnswer}</span></div>` : ''}
                    <div class="small text-muted mt-2 text-end">Marks: ${ans.marksAwarded || 0} / ${q ? q.marks : '-'}</div>
                </div>
            `;
        });
    }

    detailEl.innerHTML = html;
    document.getElementById('sqHistoryDetailContainer').style.display = 'block';

    // Render detail donut chart
    _ensureChartJs(() => {
        const ctx = document.getElementById(detailDonutId);
        if (!ctx) return;
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Incorrect'],
                datasets: [{
                    data: [correctCount, Math.max(0, totalQCount - correctCount)],
                    backgroundColor: ['rgba(16,185,129,0.85)', 'rgba(239,68,68,0.7)'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '65%',
                plugins: {
                    legend: { labels: { color: _quizChartColors().text, font: { size: 11 } } },
                    tooltip: { callbacks: { label: c => c.label + ': ' + c.raw } }
                }
            }
        });
    });
};

// ── Faculty: Delete Quiz ─────────────────────────────────────────────────────
window.quizDeleteSelected = async () => {
    const sel = document.getElementById('fqQuizSelect');
    if (!sel) return;
    const quizId = sel.value;
    if (!quizId) {
        showToast('Error', 'Please select a quiz to delete.');
        return;
    }
    
    const quizName = sel.options[sel.selectedIndex].text;
    
    if (!confirm('Are you sure you want to permanently delete the quiz "' + quizName + '" and ALL its results? This action cannot be undone.')) {
        return;
    }

    try {
        const res = await fetch('/api/quizzes/' + quizId, { method: 'DELETE', headers: _authHeaders() });
        if (res.ok) {
            showToast('Success', 'Quiz deleted successfully.');
            // Refresh the faculty list
            window.quizLoadFacultyList();
            document.getElementById('fqResultsBody').innerHTML = '';
            document.getElementById('fqDeleteQuizBtn').style.display = 'none';
        } else {
            showToast('Error', 'Failed to delete quiz.');
        }
    } catch (e) {
        console.error('Delete quiz error:', e);
        showToast('Error', 'Network error while deleting quiz.');
    }
};

// ============================================================================
// FACULTY QUIZ VOICE ASSISTANT (English, Tamil, Tanglish + Enable / Disable)
// ============================================================================
let _voiceEnabled = localStorage.getItem('sece_quiz_voice_enabled') !== 'false';
let _voiceMode = localStorage.getItem('sece_quiz_voice_lang') || 'en-US';
let _voiceRecognition = null;
let _voiceListening = false;

window.quizToggleVoiceFeature = (enabled, silent = false) => {
    _voiceEnabled = !!enabled;
    localStorage.setItem('sece_quiz_voice_enabled', String(_voiceEnabled));
    const bar = document.getElementById('fqVoiceBar');
    const hint = document.getElementById('fqVoiceDisabledHint');
    const langSel = document.getElementById('fqVoiceLang');

    if (bar) bar.style.display = _voiceEnabled ? 'block' : 'none';
    if (hint) hint.style.display = _voiceEnabled ? 'none' : 'block';
    if (langSel) langSel.value = _voiceMode;

    if (!_voiceEnabled) {
        quizStopVoiceListening();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    } else if (!silent) {
        quizSpeakFeedback(_getVoiceLangMsg(
            'Voice commands enabled. Say Explain for a walkthrough, or speak your quiz title and questions.',
            'குரல் கட்டளைகள் இயக்கப்பட்டது. விளக்கு என்று கூறினால் விவரம் கேட்கலாம், அல்லது வினாடி வினா தலைப்பைக் கூறவும்.',
            'Voice commands enable aagiduchu. Help venum na Explain pannu sollunga, illa na Title podu nu sollunga.'
        ));
    }
};

window.quizChangeVoiceLanguage = (mode) => {
    _voiceMode = mode || 'en-US';
    localStorage.setItem('sece_quiz_voice_lang', _voiceMode);
    if (_voiceListening) {
        quizStopVoiceListening();
        setTimeout(() => quizToggleVoiceListening(), 200);
    }
    const label = _voiceMode === 'ta-IN' ? 'தமிழ் (Tamil)' : (_voiceMode === 'tanglish' ? 'Tanglish (Tamil + English)' : 'English');
    _setVoiceStatus(`Speech recognition medium switched to ${label}.`);
};

function _getSpeechLocale() {
    if (_voiceMode === 'ta-IN') return 'ta-IN';
    if (_voiceMode === 'tanglish') return 'en-IN';
    return 'en-US';
}

function _getVoiceLangMsg(enText, taText, tanglishText) {
    if (_voiceMode === 'ta-IN') return taText;
    if (_voiceMode === 'tanglish') return tanglishText || enText;
    return enText;
}

function _setVoiceStatus(text) {
    const el = document.getElementById('fqVoiceStatusText');
    if (el) el.innerText = text;
}

window.quizSpeakFeedback = (text) => {
    if (!_voiceEnabled || !window.speechSynthesis || !text) return;
    try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = _voiceMode === 'ta-IN' ? 'ta-IN' : 'en-IN';
        utter.rate = 0.98;
        window.speechSynthesis.speak(utter);
    } catch (_) {}
};

window.quizSpeakSystemGuide = () => {
    const helpBox = document.getElementById('fqVoiceHelpBox');
    if (helpBox) helpBox.classList.remove('d-none');

    const guideText = _getVoiceLangMsg(
        'Welcome to Quiz Studio. Step 1: Say Title followed by your quiz name, then say Section followed by class name like II CSE A. Step 2: Say Add Question, Question text, Option A to D, and Correct Answer, or switch to the AI Generator tab. Step 3: Say Publish Quiz to send the quiz directly to students in that class.',
        'வணக்கம். படி 1: தலைப்பு என்று கூறி தேர்வு பெயரையும், வகுப்பு என்று கூறி வகுப்பையும் தேர்வு செய்யவும். படி 2: புதிய கேள்வி, கேள்வி, விடை அ முதல் ஈ வரை, மற்றும் சரியான விடை கூறவும், அல்லது ஏஐ தாவலைப் பயன்படுத்தவும். படி 3: வெளியிடு என்று கூறினால் மாணவர்களுக்கு தேர்வு உடனே வெளியிடப்படும்.',
        'Vanakkam! Step 1: Title podu nu quiz name sollunga, appuram Class II CSE A maadhiri section select pannunga. Step 2: Pudhu question, Kelvi, Option A B C D, Correct answer sollunga, illa AI Generator use pannunga. Step 3: Publish pannu nu sonna udane students ku quiz publish aagidum.'
    );
    _setVoiceStatus('Playing step-by-step Quiz System guide...');
    quizSpeakFeedback(guideText);
};

window.quizStopVoiceListening = () => {
    _voiceListening = false;
    if (_voiceRecognition) {
        try { _voiceRecognition.onend = null; _voiceRecognition.stop(); } catch (_) {}
        _voiceRecognition = null;
    }
    const btn = document.getElementById('fqVoiceMicBtn');
    if (btn) {
        btn.className = 'btn btn-sm btn-danger fw-bold px-3';
        btn.innerHTML = '<i class="fa-solid fa-microphone me-1"></i> Start Listening';
    }
};

window.quizToggleVoiceListening = () => {
    if (!_voiceEnabled) {
        alert('Please enable Voice Commands using the switch in the header first.');
        return;
    }
    if (_voiceListening) {
        quizStopVoiceListening();
        _setVoiceStatus('Microphone paused.');
        return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
        alert('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
        return;
    }

    const rec = new SpeechRec();
    rec.lang = _getSpeechLocale();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    _voiceRecognition = rec;
    _voiceListening = true;

    const btn = document.getElementById('fqVoiceMicBtn');
    if (btn) {
        btn.className = 'btn btn-sm btn-success fw-bold px-3 cc-mic-pulse';
        btn.innerHTML = '<i class="fa-solid fa-microphone-lines me-1"></i> Listening (Click to Stop)';
    }
    _setVoiceStatus(`Listening (${_voiceMode === 'ta-IN' ? 'Tamil' : (_voiceMode === 'tanglish' ? 'Tanglish' : 'English')})... Speak a command!`);

    rec.onresult = (event) => {
        const res = event.results[event.results.length - 1];
        const transcript = (res[0] && res[0].transcript ? res[0].transcript : '').trim();
        if (!transcript) return;
        if (!res.isFinal) {
            _setVoiceStatus(`Hearing: "${transcript}"...`);
        } else {
            _setVoiceStatus(`Heard: "${transcript}"`);
            _processFacultyVoiceCommand(transcript);
        }
    };

    rec.onerror = (ev) => {
        if (ev.error === 'not-allowed') {
            _setVoiceStatus('Microphone permission blocked. Allow mic access in browser settings.');
            quizStopVoiceListening();
        } else if (ev.error !== 'no-speech') {
            _setVoiceStatus(`Speech error (${ev.error}). Click Start Listening to retry.`);
        }
    };

    rec.onend = () => {
        if (_voiceListening && _voiceEnabled) {
            try { rec.start(); } catch (_) { quizStopVoiceListening(); }
        }
    };

    try {
        rec.start();
    } catch (err) {
        quizStopVoiceListening();
        _setVoiceStatus('Could not start microphone: ' + err.message);
    }
};

function _getLastQuestionCard() {
    const cards = document.querySelectorAll('#fqQuestionsWrap .cc-q-card');
    if (cards.length === 0) {
        quizAddQuestion();
        return document.querySelector('#fqQuestionsWrap .cc-q-card');
    }
    return cards[cards.length - 1];
}

function _matchVoiceSectionOption(spoken) {
    const sel = document.getElementById('fqSectionId');
    if (!sel) return false;
    const norm = String(spoken || '').toLowerCase()
        .replace(/\b(two|second|2nd)\b/g, 'ii')
        .replace(/\b(one|first|1st)\b/g, 'i')
        .replace(/\b(three|third|3rd)\b/g, 'iii')
        .replace(/\b(four|fourth|4th)\b/g, 'iv')
        .replace(/\b(see|sea)\b/g, 'c')
        .replace(/\b(bee|be)\b/g, 'b')
        .replace(/\b(eh|hey)\b/g, 'a')
        .replace(/[^a-z0-9]/g, '');

    let bestOpt = null;
    for (const opt of sel.options) {
        if (!opt.value) continue;
        const optNorm = opt.text.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (optNorm === norm || optNorm.includes(norm) || norm.includes(optNorm)) {
            bestOpt = opt;
            break;
        }
    }
    if (bestOpt) {
        sel.value = bestOpt.value;
        sel.dispatchEvent(new Event('change'));
        return bestOpt.text;
    }
    return null;
}

window._processFacultyVoiceCommand = (rawTranscript) => {
    const raw = String(rawTranscript || '').trim();
    const low = raw.toLowerCase();

    // 1. Stop microphone
    if (/(stop listening|mic off|stop mic|நிறுத்து|stop pannu|voice stop)/i.test(low)) {
        quizStopVoiceListening();
        _setVoiceStatus('Stopped listening.');
        return;
    }

    // 2. Help / Explain Quiz System
    if (/(explain|how to|understand|help|விளக்கு|உதவி|எப்படி|புரியவில்லை|epdi|sollunga|puriyala)/i.test(low)) {
        quizSpeakSystemGuide();
        return;
    }

    // 3. Switch Tabs
    if (/(open ai|ai tab|ai generator|ஏஐ|ai open)/i.test(low)) {
        quizShowAiPrompt();
        _setVoiceStatus('Switched to AI Generator tab.');
        quizSpeakFeedback(_getVoiceLangMsg('Switched to AI Generator.', 'ஏஐ பகுதி திறக்கப்பட்டது.', 'AI Generator tab open aachu.'));
        return;
    }
    if (/(analytics|results|class result|முடிவு|மதிப்பெண்|result kaatu)/i.test(low)) {
        const resTab = document.querySelector('button[data-bs-target="#fqResultsTab"]');
        if (resTab) new bootstrap.Tab(resTab).show();
        quizLoadFacultyList();
        _setVoiceStatus('Switched to Class Analytics tab.');
        quizSpeakFeedback(_getVoiceLangMsg('Opened Class Analytics.', 'வகுப்பு முடிவுகள் திறக்கப்பட்டது.', 'Class Analytics open aachu.'));
        return;
    }
    if (/(create tab|manual tab|உருவாக்கு|create quiz tab)/i.test(low)) {
        const cTab = document.querySelector('button[data-bs-target="#fqCreateTab"]');
        if (cTab) new bootstrap.Tab(cTab).show();
        _setVoiceStatus('Switched to Create Quiz tab.');
        return;
    }

    // 4. Generate AI Questions via voice
    const aiMatch = raw.match(/(?:generate|ai generate|create)\s*(?:(\d+)\s*)?(?:questions?\s*(?:on|about|for)?\s*)?(.+)/i);
    if (/(generate|create pannu)/i.test(low) && !/(question\b)/i.test(low) && aiMatch && aiMatch[2]) {
        const count = aiMatch[1] ? parseInt(aiMatch[1], 10) : 5;
        const topic = aiMatch[2].replace(/(questions?|pannu)$/i, '').trim();
        if (topic) {
            quizShowAiPrompt();
            document.getElementById('aiTopic').value = topic;
            document.getElementById('aiNumQ').value = Math.min(15, Math.max(1, count));
            _setVoiceStatus(`Generating ${count} AI questions on "${topic}"...`);
            quizSpeakFeedback(_getVoiceLangMsg(`Generating ${count} questions on ${topic}.`, `${topic} தலைப்பில் ${count} கேள்விகள் உருவாக்கப்படுகிறது.`, `${topic} topic la ${count} questions generate panren.`));
            document.getElementById('aiGenForm').dispatchEvent(new Event('submit', { cancelable: true }));
            return;
        }
    }

    // 5. Publish / Save Quiz
    if (/^(publish|publish quiz|save quiz|submit quiz|வெளியிடு|சேமி|publish pannu|save pannu|quiz publish)/i.test(low)) {
        const form = document.getElementById('quizCreateForm');
        if (form) {
            _setVoiceStatus('Publishing quiz to selected section...');
            form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
        return;
    }

    // 6. Add New Question Card
    if (/(add question|new question|next question|புதிய கேள்வி|கேள்வி சேர்|pudhu question|question add|next kelvi)/i.test(low)) {
        quizAddQuestion();
        _setVoiceStatus(`Added Question Q${_questionCount}. Speak the question text.`);
        quizSpeakFeedback(_getVoiceLangMsg(`Added question ${_questionCount}.`, `கேள்வி ${_questionCount} சேர்க்கப்பட்டது.`, `Question ${_questionCount} add aachu.`));
        return;
    }

    // 7. Quiz Title (English, Tamil, Tanglish)
    const titleM = raw.match(/(?:quiz title|title podu|title is|title set|title|தலைப்பு)\s*[:\-]?\s*(.+)/i);
    if (titleM && titleM[1]) {
        const val = titleM[1].trim();
        document.getElementById('fqTitle').value = val;
        _setVoiceStatus(`Quiz title set: "${val}"`);
        quizSpeakFeedback(_getVoiceLangMsg(`Title set to ${val}.`, `தலைப்பு ${val} என அமைக்கப்பட்டது.`, `Title ${val} nu set panniyachu.`));
        return;
    }

    // 8. Select Class Section
    const secM = raw.match(/(?:select section|section select pannu|section|class|வகுப்பு)\s*[:\-]?\s*(.+)/i);
    if (secM && secM[1]) {
        const matched = _matchVoiceSectionOption(secM[1]);
        if (matched) {
            _setVoiceStatus(`Selected section: ${matched}`);
            quizSpeakFeedback(_getVoiceLangMsg(`Selected ${matched}.`, `${matched} வகுப்பு தேர்வு செய்யப்பட்டது.`, `${matched} select panniyachu.`));
        } else {
            _setVoiceStatus(`Could not match section "${secM[1]}". Please pick from dropdown.`);
        }
        return;
    }

    // 9. Subject & Topic
    const subM = raw.match(/(?:subject podu|subject is|subject|பாடம்)\s*[:\-]?\s*(.+)/i);
    if (subM && subM[1]) {
        document.getElementById('fqSubject').value = subM[1].trim();
        _setVoiceStatus(`Subject set: "${subM[1].trim()}"`);
        return;
    }
    const topM = raw.match(/(?:topic podu|topic is|topic|பாடப்பொருள்)\s*[:\-]?\s*(.+)/i);
    if (topM && topM[1]) {
        document.getElementById('fqTopic').value = topM[1].trim();
        _setVoiceStatus(`Topic set: "${topM[1].trim()}"`);
        return;
    }

    // 10. Duration / Pass %
    const durM = raw.match(/(?:duration|time|minutes|நேரம்)\s*(\d+)/i);
    if (durM && durM[1]) {
        document.getElementById('fqDuration').value = durM[1];
        _setVoiceStatus(`Duration set to ${durM[1]} minutes.`);
        return;
    }
    const passM = raw.match(/(?:pass mark|pass percent|pass|தேர்ச்சி)\s*(\d+)/i);
    if (passM && passM[1]) {
        document.getElementById('fqPassPercent').value = passM[1];
        _setVoiceStatus(`Pass percentage set to ${passM[1]}%.`);
        return;
    }

    // 11. MCQ Options A / B / C / D (English, Tamil அ/ஆ/இ/ஈ, Tanglish)
    const optM = raw.match(/(?:option|choice|விடை)\s*(a|b|c|d|1|2|3|4|அ|ஆ|இ|ஈ)\s*(?:podu|is|:)?\s*(.+)/i);
    if (optM && optM[2]) {
        const keyMap = { 'a': 0, '1': 0, 'அ': 0, 'b': 1, '2': 1, 'ஆ': 1, 'c': 2, '3': 2, 'இ': 2, 'd': 3, '4': 3, 'ஈ': 3 };
        const idx = keyMap[optM[1].toLowerCase()];
        if (idx !== undefined) {
            const card = _getLastQuestionCard();
            const inp = card?.querySelector(`.q-opt[data-opt="${idx}"]`);
            if (inp) {
                inp.value = optM[2].trim();
                _setVoiceStatus(`Filled Option ${['A', 'B', 'C', 'D'][idx]}: "${optM[2].trim()}"`);
            }
            return;
        }
    }

    // 12. Correct Answer
    const ansM = raw.match(/(?:correct answer|answer podu|answer is|answer|சரியான விடை|பதில்|badhil)\s*[:\-]?\s*(.+)/i);
    if (ansM && ansM[1]) {
        const card = _getLastQuestionCard();
        let val = ansM[1].trim();
        const optRef = val.match(/^(?:option\s*)?(a|b|c|d|அ|ஆ|இ|ஈ)$/i);
        if (optRef) {
            const idx = { 'a': 0, 'அ': 0, 'b': 1, 'ஆ': 1, 'c': 2, 'இ': 2, 'd': 3, 'ஈ': 3 }[optRef[1].toLowerCase()];
            const optText = card?.querySelector(`.q-opt[data-opt="${idx}"]`)?.value.trim();
            if (optText) val = optText;
        }
        const ansInp = card?.querySelector('.q-answer');
        if (ansInp) {
            ansInp.value = val;
            _setVoiceStatus(`Correct answer set: "${val}"`);
        }
        return;
    }

    // 13. Question Text
    const qM = raw.match(/(?:question text|question podu|question sollunga|question|kelvi|கேள்வி)\s*[:\-]?\s*(.+)/i);
    if (qM && qM[1]) {
        const card = _getLastQuestionCard();
        const qInp = card?.querySelector('.q-text');
        if (qInp) {
            qInp.value = qM[1].trim();
            _setVoiceStatus(`Question filled: "${qM[1].trim()}"`);
        }
        return;
    }

    _setVoiceStatus(`Heard "${raw}" — try saying "Title ...", "Question ...", "Option A ...", or "Explain".`);
};

// ── Quiz Visibility Control (Faculty Per-Class & Admin Overall + Per-Class) ──
let _quizVisSnapshot = { globalQuizEnabled: true, sections: [] };

function _parseQuizVisMeta(secObj) {
    const name = String(secObj.sectionName || '').trim();
    const parts = name.split(/\s+/);
    const romanMap = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV' };
    let year = '';
    if (secObj.year && romanMap[String(secObj.year)]) year = romanMap[String(secObj.year)];
    else if (parts[0] && /^(I|II|III|IV)$/i.test(parts[0])) year = parts[0].toUpperCase();
    else if (secObj.semester) year = romanMap[String(Math.ceil(secObj.semester / 2))] || 'II';
    else year = 'II';

    const dept = (secObj.departmentCode || (parts.length >= 2 ? parts[1] : 'CSE')).toUpperCase();
    const classCode = secObj.classCode || ('BTECH-' + dept);
    const secCode = (secObj.sectionIdentifier || (parts.length >= 3 ? parts.slice(2).join(' ') : name)).toUpperCase();

    return {
        id: secObj.id,
        name,
        year,
        dept,
        classCode,
        secCode,
        quizEnabled: secObj.quizEnabled !== false,
        effectiveQuizVisible: secObj.effectiveQuizVisible !== false
    };
}

function _quizVisEls(prefix) {
    if (prefix === 'aqv') {
        return {
            dept: document.getElementById('aqvDeptSelect'),
            year: document.getElementById('aqvYearSelect'),
            cls: document.getElementById('aqvClassSelect'),
            sec: document.getElementById('aqvSectionSelect'),
            badge: document.getElementById('aqvStatusBadge')
        };
    }
    return {
        dept: document.getElementById('fqVisDept'),
        year: document.getElementById('fqVisYear'),
        cls: document.getElementById('fqVisClass'),
        sec: document.getElementById('fqVisSection'),
        badge: document.getElementById('fqVisStatusBadge')
    };
}

function _populateQuizCascadeSelects(prefix, items) {
    const els = _quizVisEls(prefix);
    if (!els.dept) return;
    const depts = new Set(items.map(s => s.dept).filter(Boolean));
    if (depts.size === 0) depts.add('CSE');
    const prevDept = els.dept.value;
    els.dept.innerHTML = Array.from(depts).sort().map(d => `<option value="${d}">${d}</option>`).join('');
    if (prevDept && depts.has(prevDept)) els.dept.value = prevDept;
    else if (depts.has('CSE')) els.dept.value = 'CSE';

    if (els.year && items.length > 0) {
        const curDept = (els.dept.value || '').toUpperCase();
        const curYear = (els.year.value || '').toUpperCase();
        const hasMatch = items.some(s => s.dept === curDept && s.year === curYear);
        if (!hasMatch) {
            const firstForDept = items.find(s => s.dept === curDept) || items[0];
            if (firstForDept) {
                if (firstForDept.dept && depts.has(firstForDept.dept)) els.dept.value = firstForDept.dept;
                if (firstForDept.year) els.year.value = firstForDept.year;
            }
        }
    }
    _updateQuizCascadeDependent(prefix, items);
}

function _updateQuizCascadeDependent(prefix, items) {
    const els = _quizVisEls(prefix);
    const dept = (els.dept?.value || 'CSE').toUpperCase();
    const year = (els.year?.value || 'II').toUpperCase();
    const classSel = els.cls;
    const secSel = els.sec;

    const byDeptYear = items.filter(s => s.dept === dept && s.year === year);
    if (classSel) {
        const prevClass = classSel.value;
        const classes = new Set(byDeptYear.map(s => s.classCode).filter(Boolean));
        if (classes.size === 0) classes.add('BTECH-' + dept);
        classSel.innerHTML = '<option value="">All Classes</option>' +
            Array.from(classes).sort().map(c => `<option value="${c}">${c}</option>`).join('');
        if (prevClass && classes.has(prevClass)) classSel.value = prevClass;
    }

    const selectedClass = classSel ? classSel.value : '';
    const matching = byDeptYear.filter(s => !selectedClass || s.classCode === selectedClass);

    if (secSel) {
        const prevSec = secSel.value;
        if (matching.length === 0) {
            secSel.innerHTML = '<option value="">-- No sections found --</option>';
        } else {
            secSel.innerHTML = matching
                .sort((a, b) => a.secCode.localeCompare(b.secCode))
                .map(s => `<option value="${s.id}">${s.secCode} (${s.name})</option>`)
                .join('');
            if (prevSec && matching.some(s => String(s.id) === String(prevSec))) secSel.value = prevSec;
        }
    }
    _syncQuizSelectionBadge(prefix, items);
}

function _syncQuizSelectionBadge(prefix, items) {
    const els = _quizVisEls(prefix);
    const secId = els.sec?.value;
    const badge = els.badge;
    const globalNote = document.getElementById('fqVisGlobalNote');
    const match = items.find(s => String(s.id) === String(secId));
    const globalOn = _quizVisSnapshot.globalQuizEnabled !== false;

    if (globalNote) {
        if (!globalOn) {
            globalNote.classList.remove('d-none');
            globalNote.innerHTML = '<i class="fa-solid fa-lock me-1"></i>Admin has disabled Overall Quiz Access for all classes right now.';
        } else {
            globalNote.classList.add('d-none');
            globalNote.innerHTML = '';
        }
    }
    if (!badge) return;
    if (!match) {
        badge.className = 'badge bg-secondary';
        badge.innerText = 'No Section Selected';
        return;
    }
    if (!globalOn) {
        badge.className = 'badge bg-danger';
        badge.innerText = `${match.name}: HIDDEN (Admin Global Lock)`;
    } else if (match.quizEnabled) {
        badge.className = 'badge bg-success';
        badge.innerText = `${match.name}: VISIBLE to Students`;
    } else {
        badge.className = 'badge bg-warning text-dark';
        badge.innerText = `${match.name}: HIDDEN from Students`;
    }
}

async function _fetchQuizVisibilitySnapshot() {
    const res = await fetch('/api/quizzes/visibility', { headers: _authHeaders() });
    if (!res.ok) throw new Error('Could not load quiz visibility settings (' + res.status + ')');
    const data = await res.json();
    const parsed = Array.isArray(data.sections)
        ? data.sections.map(_parseQuizVisMeta).filter(s => s.name && !/^\d+\s+CSE\s+II\s+CSE/i.test(s.name))
        : [];
    _quizVisSnapshot = {
        globalQuizEnabled: data.globalQuizEnabled !== false,
        sections: parsed
    };
    return _quizVisSnapshot;
}

window.quizLoadVisibilityControls = async () => {
    try {
        const snap = await _fetchQuizVisibilitySnapshot();
        _populateQuizCascadeSelects('fqVis', snap.sections);
    } catch (e) {
        console.warn('Could not load faculty quiz visibility controls:', e);
    }
};

window.onFacultyQuizVisFilterChange = () => {
    _updateQuizCascadeDependent('fqVis', _quizVisSnapshot.sections || []);
};

window.onFacultyQuizVisSectionChange = () => {
    _syncQuizSelectionBadge('fqVis', _quizVisSnapshot.sections || []);
};

window.quizSetFacultyClassVisibility = async (enabled) => {
    const secId = document.getElementById('fqVisSection')?.value;
    if (!secId) {
        alert('Please select a Department, Year, Class, and Section.');
        return;
    }
    try {
        const res = await fetch(`/api/quizzes/visibility/section/${encodeURIComponent(secId)}`, {
            method: 'PUT',
            headers: { ..._authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: !!enabled })
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || 'Failed to update quiz visibility.');
        }
        const updated = await res.json();
        await window.quizLoadVisibilityControls();
        if (typeof showToast === 'function') {
            showToast(
                enabled ? 'Quiz Enabled' : 'Quiz Hidden',
                `Quiz option is now ${enabled ? 'VISIBLE' : 'HIDDEN'} for ${updated.sectionName || 'the selected class'}.`
            );
        }
    } catch (e) {
        console.error('Error updating class quiz visibility:', e);
        if (typeof showToast === 'function') {
            showToast('Update Failed', e.message || 'Could not update quiz visibility.', 'error');
        } else {
            alert(e.message || 'Could not update quiz visibility.');
        }
    }
};

function _renderAdminQuizAccessUI() {
    const globalOn = _quizVisSnapshot.globalQuizEnabled !== false;
    const badge = document.getElementById('adminGlobalQuizBadge');
    const sw = document.getElementById('adminGlobalQuizSwitch');
    if (badge) {
        badge.className = globalOn ? 'badge bg-success px-3 py-2' : 'badge bg-danger px-3 py-2';
        badge.innerText = globalOn ? 'OVERALL QUIZ: ENABLED' : 'OVERALL QUIZ: DISABLED FOR ALL';
    }
    if (sw) sw.checked = globalOn;

    _populateQuizCascadeSelects('aqv', _quizVisSnapshot.sections || []);

    const tbody = document.getElementById('adminQuizAccessTableBody');
    if (!tbody) return;
    const rows = _quizVisSnapshot.sections || [];
    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">No sections configured.</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map(s => {
        const secBadge = s.quizEnabled
            ? '<span class="badge bg-success">Enabled</span>'
            : '<span class="badge bg-warning text-dark">Disabled</span>';
        const effBadge = (globalOn && s.quizEnabled)
            ? '<span class="badge bg-info text-dark">Visible to Students</span>'
            : '<span class="badge bg-danger">Hidden from Students</span>';
        const nextVal = !s.quizEnabled;
        return `
        <tr>
            <td>${s.dept}</td>
            <td>${s.year} Year</td>
            <td>${s.classCode}</td>
            <td><strong>${s.name}</strong></td>
            <td>${secBadge}</td>
            <td>${effBadge}</td>
            <td class="text-center">
                <button type="button" class="btn btn-sm ${nextVal ? 'btn-outline-success' : 'btn-outline-danger'}" onclick="window.toggleAdminSectionQuizAccess(${s.id}, ${nextVal})">
                    <i class="fa-solid ${nextVal ? 'fa-eye' : 'fa-eye-slash'} me-1"></i>${nextVal ? 'Enable' : 'Disable'}
                </button>
            </td>
        </tr>`;
    }).join('');
}

window.openAdminQuizAccessModal = async () => {
    try {
        await _fetchQuizVisibilitySnapshot();
        _renderAdminQuizAccessUI();
    } catch (e) {
        const alertEl = document.getElementById('adminQuizAccessAlert');
        if (alertEl) {
            alertEl.className = 'alert alert-danger small py-2 mb-3';
            alertEl.innerText = e.message || 'Could not load quiz access settings.';
        }
    }
};

window.onAdminQuizFilterChange = () => {
    _updateQuizCascadeDependent('aqv', _quizVisSnapshot.sections || []);
};

window.onAdminQuizSectionChange = () => {
    _syncQuizSelectionBadge('aqv', _quizVisSnapshot.sections || []);
};

window.toggleGlobalQuizAccess = async (enabled) => {
    try {
        const res = await fetch('/api/quizzes/visibility/global', {
            method: 'PUT',
            headers: { ..._authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: !!enabled })
        });
        if (!res.ok) throw new Error(await res.text());
        await _fetchQuizVisibilitySnapshot();
        _renderAdminQuizAccessUI();
        if (typeof showToast === 'function') {
            showToast('Overall Quiz Updated', `Overall student quiz access is now ${enabled ? 'ENABLED' : 'DISABLED across all classes'}.`);
        }
    } catch (e) {
        if (typeof showToast === 'function') showToast('Update Failed', e.message || 'Could not update overall quiz access.', 'error');
    }
};

window.setAllClassesQuizAccess = async (enabled) => {
    try {
        const res = await fetch('/api/quizzes/visibility/all', {
            method: 'PUT',
            headers: { ..._authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: !!enabled })
        });
        if (!res.ok) throw new Error(await res.text());
        await _fetchQuizVisibilitySnapshot();
        _renderAdminQuizAccessUI();
        if (typeof showToast === 'function') {
            showToast(
                enabled ? 'All Classes Enabled' : 'All Classes Disabled',
                `Quiz visibility is now ${enabled ? 'ENABLED' : 'DISABLED'} for all classes.`
            );
        }
    } catch (e) {
        if (typeof showToast === 'function') showToast('Update Failed', e.message || 'Could not update all classes.', 'error');
    }
};

window.toggleAdminSectionQuizAccess = async (sectionId, enabled) => {
    try {
        const res = await fetch(`/api/quizzes/visibility/section/${encodeURIComponent(sectionId)}`, {
            method: 'PUT',
            headers: { ..._authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: !!enabled })
        });
        if (!res.ok) throw new Error(await res.text());
        const updated = await res.json();
        await _fetchQuizVisibilitySnapshot();
        _renderAdminQuizAccessUI();
        if (typeof showToast === 'function') {
            showToast(
                enabled ? 'Class Quiz Enabled' : 'Class Quiz Disabled',
                `Quiz is now ${enabled ? 'enabled' : 'disabled'} for ${updated.sectionName || 'the selected class'}.`
            );
        }
    } catch (e) {
        if (typeof showToast === 'function') showToast('Update Failed', e.message || 'Could not update class quiz access.', 'error');
    }
};

window.setSelectedAdminClassQuizAccess = async (enabled) => {
    const secId = document.getElementById('aqvSectionSelect')?.value;
    if (!secId) {
        alert('Please select a Department, Year, Class, and Section.');
        return;
    }
    await window.toggleAdminSectionQuizAccess(secId, enabled);
};

window.refreshStudentQuizVisibility = async () => {
    const takeBtn = document.getElementById('studentTakeQuizNavBtn');
    const histBtn = document.getElementById('studentQuizHistoryNavBtn');
    try {
        const res = await fetch('/api/quizzes/visibility/student', { headers: _authHeaders() });
        if (!res.ok) return null;
        const vis = await res.json();
        const visible = vis.visible !== false;
        window._studentQuizVisible = visible;
        if (takeBtn) takeBtn.classList.toggle('d-none', !visible);
        if (histBtn) histBtn.classList.toggle('d-none', !visible);
        return vis;
    } catch (e) {
        console.warn('Could not refresh student quiz visibility:', e);
        return null;
    }
};

window.refreshClassAdvisorQuizBar = async (sectionName) => {
    const badge = document.getElementById('caQuizVisBadge');
    if (!badge || !sectionName) return;
    try {
        const snap = await _fetchQuizVisibilitySnapshot();
        const target = String(sectionName || '').trim().toLowerCase();
        const match = (snap.sections || []).find(s => String(s.name || '').trim().toLowerCase() === target);
        const globalOn = snap.globalQuizEnabled !== false;
        if (!match) {
            badge.className = 'badge bg-secondary ms-1';
            badge.innerText = 'Not found in DB';
            return;
        }
        if (!globalOn) {
            badge.className = 'badge bg-danger ms-1';
            badge.innerText = 'HIDDEN (Admin Global Lock)';
        } else if (match.quizEnabled) {
            badge.className = 'badge bg-success ms-1';
            badge.innerText = 'VISIBLE to Students';
        } else {
            badge.className = 'badge bg-warning text-dark ms-1';
            badge.innerText = 'HIDDEN from Students';
        }
    } catch (e) {
        badge.className = 'badge bg-secondary ms-1';
        badge.innerText = 'Unavailable';
    }
};

window.toggleClassAdvisorQuizVisibility = async (sectionName, enabled) => {
    try {
        const snap = await _fetchQuizVisibilitySnapshot();
        const target = String(sectionName || '').trim().toLowerCase();
        const match = (snap.sections || []).find(s => String(s.name || '').trim().toLowerCase() === target);
        if (!match) {
            throw new Error(`Section "${sectionName}" could not be resolved.`);
        }
        const res = await fetch(`/api/quizzes/visibility/section/${encodeURIComponent(match.id)}`, {
            method: 'PUT',
            headers: { ..._authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: !!enabled })
        });
        if (!res.ok) throw new Error(await res.text());
        await window.refreshClassAdvisorQuizBar(sectionName);
        if (typeof showToast === 'function') {
            showToast(
                enabled ? 'Quiz Enabled' : 'Quiz Hidden',
                `Quiz option is now ${enabled ? 'VISIBLE' : 'HIDDEN'} for ${match.name}.`
            );
        }
    } catch (e) {
        if (typeof showToast === 'function') {
            showToast('Update Failed', e.message || 'Could not update quiz visibility.', 'error');
        } else {
            alert(e.message || 'Could not update quiz visibility.');
        }
    }
};
