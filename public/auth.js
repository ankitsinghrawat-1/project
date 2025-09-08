document.addEventListener('DOMContentLoaded', () => {
    const userEmail = localStorage.getItem('userEmail');
    const navLinks = document.querySelector('.nav-links');

    if (userEmail) {
        // User is logged in
        navLinks.innerHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="dashboard.html">Dashboard</a></li>
            <li><a href="profile.html">Profile</a></li>
            <li><a href="directory.html">Directory</a></li>
            <li><a href="#" class="btn btn-logout">Logout</a></li>
        `;

        // Add event listener for the logout button
        document.querySelector('.btn-logout').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('userEmail');
            window.location.href = 'login.html';
        });

    } else {
        // User is not logged in
        navLinks.innerHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="directory.html">Directory</a></li>
            <li><a href="login.html" class="btn btn-primary">Login</a></li>
        `;
    }
});