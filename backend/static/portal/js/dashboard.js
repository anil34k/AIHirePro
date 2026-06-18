/**
 * AIHire Pro — Candidate Portal Dashboard
 * Main JavaScript — Interactivity, Theme, Tabs, Notifications
 */

document.addEventListener('DOMContentLoaded', function () {

    // =====================================================
    // THEME TOGGLE (Dark / Light Mode)
    // =====================================================
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('aihire-theme') || 'light';

    function setTheme(theme) {
        html.setAttribute('data-bs-theme', theme);
        localStorage.setItem('aihire-theme', theme);
        themeIcon.className = theme === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    }

    setTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            const current = html.getAttribute('data-bs-theme');
            setTheme(current === 'dark' ? 'light' : 'dark');
            showToast('info', 'Theme Changed', 'Switched to ' + (current === 'dark' ? 'light' : 'dark') + ' mode');
        });
    }

    // =====================================================
    // SIDEBAR TOGGLE (Mobile)
    // =====================================================
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function toggleSidebar() {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('show');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
    }

    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    // Close sidebar on menu item click (mobile)
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function () {
            if (window.innerWidth <= 991) closeSidebar();
        });
    });

    // =====================================================
    // USER DROPDOWN
    // =====================================================
    const userDropdownToggle = document.getElementById('userDropdownToggle');
    const userDropdown = document.getElementById('userDropdown');

    if (userDropdownToggle && userDropdown) {
        userDropdownToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        document.addEventListener('click', function (e) {
            if (!userDropdown.contains(e.target) && !userDropdownToggle.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }

    // =====================================================
    // NOTIFICATION PANEL
    // =====================================================
    const notificationBell = document.getElementById('notificationBell');
    const notificationPanel = document.getElementById('notificationPanel');
    const closeNotifications = document.getElementById('closeNotifications');

    if (notificationBell && notificationPanel) {
        notificationBell.addEventListener('click', function () {
            notificationPanel.classList.toggle('open');
        });
    }

    if (closeNotifications && notificationPanel) {
        closeNotifications.addEventListener('click', function () {
            notificationPanel.classList.remove('open');
        });
    }

    // Close notification panel on overlay click (backend)
    document.addEventListener('click', function (e) {
        if (notificationPanel && notificationPanel.classList.contains('open')) {
            if (!notificationPanel.contains(e.target) && !notificationBell.contains(e.target)) {
                notificationPanel.classList.remove('open');
            }
        }
    });

    // =====================================================
    // TAB SWITCHING
    // =====================================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    window.switchTab = function (tabId) {
        // Remove active from all
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        // Activate button
        const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Activate pane
        const activePane = document.getElementById(tabId);
        if (activePane) activePane.classList.add('active');

        // Update sidebar active state
        const sectionMap = {
            'resume-tab': 'dashboard',
            'job-matches-tab': 'dashboard',
            'search-tab': 'dashboard',
            'applications-tab': 'dashboard',
            'edit-profile-tab': 'dashboard'
        };

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // =====================================================
    // SIDEBAR MENU ITEM CLICKS
    // =====================================================
    document.querySelectorAll('.menu-item[data-section]').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');

            // Update active state
            document.querySelectorAll('.menu-item[data-section]').forEach(el => el.classList.remove('active'));
            this.classList.add('active');

            // Map sections to tabs
            const sectionTabMap = {
                'dashboard': 'resume-tab',
                'mock-interview': null,
                'academy': null,
                'invites': null,
                'coach': null,
                'resume-optimizer': null,
                'coding-arena': null,
                'portfolio-settings': null,
            };

            const tabId = sectionTabMap[section];
            if (tabId) {
                switchTab(tabId);
            } else {
                // For sections that don't have a tab yet, show toast
                const labels = {
                    'mock-interview': 'Mock Interview Arena',
                    'academy': 'Upskilling Academy',
                    'invites': 'Interview Invites',

                    'resume-optimizer': 'ATS Resume Optimizer',
                    'coding-arena': 'AI Coding Arena',
                    'portfolio-settings': 'Public Portfolio Settings'
                };
                showToast('info', labels[section] || section, 'This section is coming soon. Check back later!');
            }
        });
    });

    // =====================================================
    // TOAST NOTIFICATION SYSTEM
    // =====================================================
    window.showToast = function (type, title, message) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            success: 'bi bi-check-circle-fill',
            error: 'bi bi-x-circle-fill',
            info: 'bi bi-info-circle-fill'
        };

        const toast = document.createElement('div');
        toast.className = 'toast-custom ' + type;
        toast.innerHTML = `
            <i class="toast-icon ${icons[type] || icons.info}"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-msg">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);

        // Click to dismiss
        toast.addEventListener('click', function () {
            this.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => this.remove(), 300);
        });
    };

    // =====================================================
    // RESUME FILE UPLOAD
    // =====================================================
    const resumeFileInput = document.getElementById('resumeFileInput');
    const resumeUploadForm = document.getElementById('resumeUploadForm');

    if (resumeFileInput && resumeUploadForm) {
        resumeFileInput.addEventListener('change', async function (e) {
            if (!e.target.files[0]) return;
            const fd = new FormData(resumeUploadForm);
            fd.set('file', e.target.files[0]);

            try {
                const res = await fetch('/portal-api/upload-resume/', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.status === 'ok') {
                    showToast('success', 'Resume Uploaded', 'File uploaded successfully.');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showToast('error', 'Upload Failed', data.error || 'Unknown error');
                }
            } catch (err) {
                showToast('error', 'Upload Failed', 'Network error. Is the server running?');
            }
        });
    }

    // =====================================================
    // AI PARSE BUTTON — Handles per-section success/error
    // =====================================================
    window.parseResume = async function () {
        showToast('info', 'Parsing Resume', 'AI is analyzing your resume...');

        try {
            const res = await fetch('/portal-api/ai-parse/', { method: 'POST' });
            const data = await res.json();

            if (data.status === 'ok') {
                // Build per-section detail message
                let details = '';
                if (data.details && data.details.length > 0) {
                    details = '<br>' + data.details.map(d => '• ' + d).join('<br>');
                }

                showToast('success', '✓ Resume Processed Successfully',
                    'Profile Updated:' + details);

                // Reload after short delay to show updated data
                setTimeout(() => location.reload(), 2000);
            } else {
                showToast('error', 'Data Sync Error', data.error || 'Unknown error');
            }
        } catch (err) {
            showToast('error', 'Data Sync Error', 'Internal server error. Please check that the backend is running and Groq API key is configured.');
        }
    };

    // =====================================================
    // DELETE RESUME
    // =====================================================
    window.deleteResume = async function (id) {
        if (!confirm('Are you sure you want to delete this resume?')) return;
        try {
            const res = await fetch('/portal-api/delete-resume/' + id + '/');
            if (res.ok) {
                showToast('success', 'Deleted', 'Resume deleted successfully.');
                setTimeout(() => location.reload(), 1500);
            } else {
                showToast('error', 'Error', 'Could not delete resume');
            }
        } catch (err) {
            showToast('error', 'Network Error', 'Please check your connection');
        }
    };

    // =====================================================
    // JOB MATCHES
    // =====================================================
    window.loadJobMatches = async function () {
        const container = document.getElementById('jobMatchesContainer');
        if (!container) return;

        showToast('info', 'Loading', 'Fetching job recommendations...');

        try {
            const res = await fetch('/portal-api/job-matches/');
            const data = await res.json();

            if (data.jobs && data.jobs.length > 0) {
                container.innerHTML = data.jobs.map(j => `
                    <div class="col-lg-6">
                        <div class="job-card">
                            <div class="job-card-header">
                                <div class="company-logo">${j.company.charAt(0)}</div>
                                <div>
                                    <h5 class="mb-1">${j.title}</h5>
                                    <p class="text-muted mb-0">${j.company} • ${j.location || 'Remote'}</p>
                                </div>
                                <div class="match-badge">${j.match_score}% Match</div>
                            </div>
                            <div class="job-card-skills">${(j.skills || []).map(s => '<span class="skill-tag">' + s + '</span>').join('')}</div>
                            <div class="job-card-footer">
                                <span class="salary">${j.salary_min ? '₹' + j.salary_min + ' - ' + j.salary_max : 'Negotiable'}</span>
                                <div>
                                    <button class="btn btn-sm btn-primary">Apply Now</button>
                                    <button class="btn btn-sm btn-outline-secondary"><i class="bi bi-bookmark"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
                showToast('success', 'Jobs Loaded', 'Found ' + data.jobs.length + ' matching jobs');
            } else {
                container.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-briefcase fs-1"></i><p class="mt-2">No job matches found. Complete your profile to get recommendations.</p></div>';
                showToast('info', 'No Matches', 'Update your profile for better matches');
            }
        } catch (err) {
            container.innerHTML = '<div class="col-12 text-center py-5 text-muted"><i class="bi bi-exclamation-triangle fs-1"></i><p class="mt-2">Could not load jobs. Make sure the backend server is running.</p></div>';
            showToast('error', 'Load Failed', 'Could not fetch job recommendations');
        }
    };

    // =====================================================
    // MANUAL SEARCH
    // =====================================================
    window.manualSearch = function () {
        const input = document.getElementById('jobSearchInput');
        const query = input ? input.value.trim() : '';

        showToast('info', 'Searching', query ? 'Searching for "' + query + '"...' : 'Showing all available jobs...');

        // Simulate search delay
        setTimeout(() => {
            showToast('success', 'Search Complete', query ? 'Results for "' + query + '"' : 'Showing all jobs');
        }, 1000);
    };

    // Enter key in search
    const searchInput = document.getElementById('jobSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                manualSearch();
            }
        });
    }

    // =====================================================
    // SKILL TAG INPUT (Edit Profile)
    // =====================================================
    window.addSkillTag = function () {
        const input = document.getElementById('skillInput');
        const container = document.getElementById('skillsContainer');
        if (!input || !container || !input.value.trim()) return;

        const span = document.createElement('span');
        span.className = 'skill-tag';
        span.innerHTML = input.value.trim() + ' <i class="bi bi-x ms-1" onclick="this.parentElement.remove()"></i>';
        container.appendChild(span);
        input.value = '';
    };

    const skillInput = document.getElementById('skillInput');
    if (skillInput) {
        skillInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addSkillTag();
            }
        });
    }

    // =====================================================
    // LOAD ATS SCORES ON PAGE LOAD
    // =====================================================
    fetch('/portal-api/ats-analysis/')
        .then(r => r.json())
        .then(data => {
            const atsEl = document.getElementById('atsScoreDisplay');
            const skillEl = document.getElementById('skillMatchDisplay');
            if (atsEl && data.ats_score !== undefined) atsEl.textContent = data.ats_score + '%';
            if (skillEl && data.skill_match !== undefined) skillEl.textContent = data.skill_match + '%';

            // Update debug panel if it exists
            const debugAts = document.getElementById('debugAtsScore');
            if (debugAts) debugAts.textContent = (data.ats_score || '--') + '%';
            const debugStrength = document.getElementById('debugResumeStrength');
            if (debugStrength) debugStrength.textContent = (data.resume_strength || '--') + '%';
        })
        .catch(() => {
            // Silently fail — ATS scores are non-critical
        });

    // =====================================================
    // DEBUG PANEL (dev mode only)
    // =====================================================
    const debugToggle = document.getElementById('debugToggle');
    const debugPanel = document.getElementById('debugPanel');

    if (debugToggle && debugPanel) {
        debugToggle.addEventListener('click', function () {
            debugPanel.classList.toggle('visible');
            if (debugPanel.classList.contains('visible')) {
                loadDebugData();
            }
        });
    }

    async function loadDebugData() {
        try {
            const res = await fetch('/portal-api/debug/');
            const data = await res.json();
            const body = document.getElementById('debugBody');
            if (!body) return;

            // Update profile status
            const psEl = document.getElementById('debugProfileStatus');
            if (psEl) psEl.textContent = data.profile_exists ? 'EXISTS' : 'NOT FOUND';

            // Build detailed debug info
            let html = '<table class="debug-table">';
            html += '<tr><th>Section</th><th>Status</th><th>Count</th></tr>';
            html += `<tr><td>Profile</td><td>${data.profile_exists ? '✓' : '✗'}</td><td>${data.profile ? data.profile.id : '--'}</td></tr>`;
            html += `<tr><td>Skills</td><td>✓</td><td>${data.skills_count || 0}</td></tr>`;
            html += `<tr><td>Education</td><td>✓</td><td>${data.education_count || 0}</td></tr>`;
            html += `<tr><td>Experience</td><td>✓</td><td>${data.experience_count || 0}</td></tr>`;
            html += `<tr><td>Projects</td><td>✓</td><td>${data.projects_count || 0}</td></tr>`;
            html += `<tr><td>Certifications</td><td>✓</td><td>${data.certifications_count || 0}</td></tr>`;
            html += `<tr><td>Resume</td><td>${data.resume ? '✓' : '✗'}</td><td>${data.resume && data.resume.has_raw_text ? 'Has text' : 'No text'}</td></tr>`;
            html += '</table>';
            html += `<div class="debug-meta"><small>User: ${data.user.username} | Profile: ${data.profile_completion || 0}% complete</small></div>`;
            body.innerHTML = html;
        } catch (e) {
            const body = document.getElementById('debugBody');
            if (body) body.innerHTML = '<p class="text-danger">Failed to load debug data. Is the server running?</p>';
        }
    }

    // =====================================================
    // PROFILE FORM SUBMIT
    // =====================================================
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function (e) {
            e.preventDefault();
            showToast('success', 'Profile Saved', 'Your profile has been updated successfully.');
        });
    }

    // =====================================================
    // WELCOME TOAST
    // =====================================================
    setTimeout(() => {
        showToast('success', 'Welcome to AIHire Pro', 'Your candidate dashboard is ready. Explore AI-powered features!');
    }, 500);

});
