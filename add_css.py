import re

css_content = """
/* --- Sidebar Styles --- */
.app-layout {
    display: flex;
    min-height: calc(100vh - 60px);
    position: relative;
    overflow-x: hidden;
}

.app-sidebar {
    width: 260px;
    background: var(--sece-bg, #0b0f17);
    border-right: 1px solid var(--sece-card-border, #333);
    transition: transform 0.3s ease;
    flex-shrink: 0;
    z-index: 1040;
}

.app-main {
    flex-grow: 1;
    min-width: 0;
    transition: margin-left 0.3s ease;
}

.sidebar-nav-link {
    color: #e2e8f0;
    padding: 10px 15px;
    border-radius: 6px;
    transition: background 0.2s, color 0.2s;
    text-decoration: none;
    display: flex;
    align-items: center;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
}

.sidebar-nav-link:hover {
    background: rgba(255,255,255,0.05);
    color: #fff;
}

.sidebar-overlay {
    display: none;
}

/* Mobile behavior */
@media (max-width: 992px) {
    .app-sidebar {
        position: fixed;
        top: 60px; /* Below header */
        bottom: 0;
        left: 0;
        transform: translateX(-100%);
    }
    
    .app-sidebar.open {
        transform: translateX(0);
    }
    
    .sidebar-overlay.open {
        display: block;
        position: fixed;
        top: 60px;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 1030;
    }
    
    .app-main {
        margin-left: 0 !important;
    }
}
"""

with open(r'd:\Java_project\frontend\src\index.css', 'a') as f:
    f.write(css_content)
print("Added CSS to index.css")
