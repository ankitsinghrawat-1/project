document.addEventListener('DOMContentLoaded', async () => {
    const navLinks = document.getElementById('nav-links');

    if (!navLinks) {
        console.error("Error: Navigation element with ID 'nav-links' was not found.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/check-login', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const data = await response.json();
        const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');
        const userRole = sessionStorage.getItem('userRole');
        const navItems = document.createElement('ul');
        navItems.className = 'nav-links';

        if (data.isLoggedIn && loggedInUserEmail) {
            navItems.innerHTML = `
                <li><a href="about.html">About</a></li>
                <li class="nav-dropdown">
                    <a href="#" class="dropdown-toggle">Connect <i class="fas fa-chevron-down"></i></a>
                    <ul class="dropdown-menu">
                        <li><a href="directory.html">Directory</a></li>
                        <li><a href="mentors.html">Mentors</a></li>
                        <li><a href="events.html">Events</a></li>
                    </ul>
                </li>
                <li class="nav-dropdown">
                    <a href="#" class="dropdown-toggle">Resources <i class="fas fa-chevron-down"></i></a>
                    <ul class="dropdown-menu">
                        <li><a href="blogs.html">Blog</a></li>
                        <li><a href="jobs.html">Job Board</a></li>
                        <li><a href="campaigns.html">Campaigns</a></li>
                    </ul>
                </li>
                ${userRole === 'admin' ? `<li><a href="admin.html" class="btn btn-secondary">Admin Dashboard</a></li>` : `<li><a href="dashboard.html" class="btn btn-secondary">Dashboard</a></li>`}
                <li class="profile-dropdown nav-dropdown">
                    <a href="#" class="dropdown-toggle btn btn-primary">Profile</a>
                    <ul class="dropdown-menu">
                        <li><a href="profile.html#edit-profile"><i class="fas fa-user-edit"></i> Edit Profile</a></li>
                        <li><a href="profile.html#change-password"><i class="fas fa-key"></i> Change Password</a></li>
                        <li><a href="profile.html#privacy-settings"><i class="fas fa-user-shield"></i> Privacy Settings</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><button id="logout-btn" class="logout-button"><i class="fas fa-sign-out-alt"></i> Logout</button></li>
                    </ul>
                </li>
            `;
        } else {
            navItems.innerHTML = `
                <li><a href="about.html">About</a></li>
                <li><a href="blogs.html">Blog</a></li>
                <li><a href="login.html" class="btn btn-secondary">Log In</a></li>
                <li><a href="signup.html" class="btn btn-primary">Sign Up</a></li>
            `;
        }

        navLinks.innerHTML = '';
        navLinks.appendChild(navItems);

        // --- CLICK-TO-OPEN DROPDOWN LOGIC ---
        document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                const parentDropdown = e.currentTarget.parentElement;
                
                document.querySelectorAll('.nav-dropdown').forEach(dd => {
                    if (dd !== parentDropdown) {
                        dd.classList.remove('dropdown-active');
                    }
                });

                parentDropdown.classList.toggle('dropdown-active');
            });
        });
        
        window.addEventListener('click', () => {
            document.querySelectorAll('.nav-dropdown').forEach(dd => {
                dd.classList.remove('dropdown-active');
            });
        });

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                sessionStorage.removeItem('loggedInUserEmail');
                sessionStorage.removeItem('userRole');
                await fetch('http://localhost:3000/api/logout', { method: 'POST', credentials: 'include' });
                window.location.href = 'index.html';
            });
        }

        const path = window.location.pathname;
        const isIndexPage = path === '/' || path.endsWith('/index.html') || path.endsWith('/');
        if (isIndexPage) {
            const loggedInHeader = document.getElementById('loggedIn-header');
            const loggedOutHeader = document.getElementById('loggedOut-header');
            if (loggedInHeader && loggedOutHeader) {
                loggedInHeader.style.display = data.isLoggedIn ? 'block' : 'none';
                loggedOutHeader.style.display = data.isLoggedIn ? 'none' : 'block';
            }
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
});