document.addEventListener('DOMContentLoaded', async () => {
    const navLinks = document.getElementById('nav-links');

    if (!navLinks) {
        console.error("Error: Navigation element with ID 'nav-links' was not found.");
        return;
    }
    
    // Check login status via a new API endpoint
    try {
        const response = await fetch('http://localhost:3000/api/check-login', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();

        // Get user info from sessionStorage for logged-in navigation
        const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');
        const userRole = sessionStorage.getItem('userRole');

        // Dynamically build the navigation bar based on login status
        const navItems = document.createElement('ul');
        navItems.className = 'nav-links';
        
        if (data.isLoggedIn && loggedInUserEmail) {
            // Logged-in state
            navItems.innerHTML = `
                <li><a href="index.html">Home</a></li>
                <li><a href="directory.html">Directory</a></li>
                <li><a href="events.html">Events</a></li>
                <li><a href="jobs.html">Jobs</a></li>
                <li><a href="campaigns.html">Campaigns</a></li>
            `;
            if (userRole === 'admin') {
                navItems.innerHTML += `
                    <li><a href="admin.html" class="btn btn-secondary">Admin Dashboard</a></li>
                `;
            } else {
                navItems.innerHTML += `
                    <li><a href="dashboard.html" class="btn btn-secondary">Dashboard</a></li>
                    <li><a href="profile.html" class="btn btn-secondary">Profile</a></li>
                `;
            }
            navItems.innerHTML += `
                <li><button id="logout-btn" class="btn btn-logout">Logout</button></li>
            `;
        } else {
            // Logged-out state
            navItems.innerHTML = `
                <li><a href="index.html">Home</a></li>
                <li><a href="login.html">Directory</a></li>
                <li><a href="login.html">Events</a></li>
                <li><a href="login.html">Jobs</a></li>
                <li><a href="login.html">Campaigns</a></li>
                <li><a href="login.html" class="btn btn-secondary">Log In</a></li>
                <li><a href="signup.html" class="btn btn-primary">Sign Up</a></li>
            `;
        }

        navLinks.appendChild(navItems);

        // Add event listener for the logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                sessionStorage.removeItem('loggedInUserEmail');
                sessionStorage.removeItem('userRole');
                
                await fetch('http://localhost:3000/api/logout', { method: 'POST' });
                
                window.location.href = 'index.html';
            });
        }

        // --- Home Page Visibility Logic ---
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') {
            const loggedInHeader = document.getElementById('loggedIn-header');
            const loggedOutHeader = document.getElementById('loggedOut-header');
            
            if (data.isLoggedIn) {
                if (loggedInHeader && loggedOutHeader) {
                    loggedInHeader.style.display = 'block';
                    loggedOutHeader.style.display = 'none';
                }
            } else {
                if (loggedInHeader && loggedOutHeader) {
                    loggedInHeader.style.display = 'none';
                    loggedOutHeader.style.display = 'block';
                }
            }
        }

    } catch (error) {
        console.error('Error checking login status:', error);
        // Fallback to logged-out view on error
        const navItems = document.createElement('ul');
        navItems.className = 'nav-links';
        navItems.innerHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="login.html">Directory</a></li>
            <li><a href="login.html">Events</a></li>
            <li><a href="login.html">Jobs</a></li>
            <li><a href="login.html">Campaigns</a></li>
            <li><a href="login.html" class="btn btn-secondary">Log In</a></li>
            <li><a href="signup.html" class="btn btn-primary">Sign Up</a></li>
        `;
        navLinks.appendChild(navItems);
    }
});