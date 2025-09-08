document.addEventListener('DOMContentLoaded', async () => {
    const userNameEl = document.getElementById('user-name');
    const userEmail = localStorage.getItem('userEmail');
    const dashboardProfilePic = document.getElementById('profile-pic-dash');

    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    const fetchUserProfile = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/profile/${userEmail}`);
            const data = await response.json();
            if (response.ok) {
                userNameEl.textContent = data.full_name || 'Alumnus';
                if (data.profile_pic_url) {
                    dashboardProfilePic.src = `http://localhost:3000/${data.profile_pic_url}`;
                } else {
                    dashboardProfilePic.src = 'default_pfp.jpg';
                }
            } else {
                console.error('Error fetching user profile:', data.message);
                userNameEl.textContent = 'Alumnus';
            }
        } catch (error) {
            console.error('Network error:', error);
            userNameEl.textContent = 'Alumnus';
        }
    };

    const fetchRecentEvents = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/events/recent');
            const events = await response.json();
            const eventsList = document.getElementById('events-list');
            eventsList.innerHTML = '';
            if (events.length > 0) {
                events.forEach(event => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${event.title}</strong><br>${event.date}<br><a href="#">${event.location}</a>`;
                    eventsList.appendChild(li);
                });
            } else {
                eventsList.innerHTML = '<li>No recent events to display.</li>';
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            document.getElementById('events-list').innerHTML = '<li>Failed to load events.</li>';
        }
    };

    const fetchRecentJobs = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/jobs/recent');
            const jobs = await response.json();
            const jobsList = document.getElementById('jobs-list');
            jobsList.innerHTML = '';
            if (jobs.length > 0) {
                jobs.forEach(job => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${job.title}</strong> at ${job.company}<br>${job.location}`;
                    jobsList.appendChild(li);
                });
            } else {
                jobsList.innerHTML = '<li>No recent jobs to display.</li>';
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
            document.getElementById('jobs-list').innerHTML = '<li>Failed to load jobs.</li>';
        }
    };

    const fetchAlumniSpotlight = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/spotlight');
            const spotlight = await response.json();
            if (response.ok && spotlight) {
                document.getElementById('spotlight-name').textContent = spotlight.full_name;
                document.getElementById('spotlight-bio').textContent = spotlight.bio;
                if (spotlight.profile_pic_url) {
                    document.getElementById('spotlight-pfp').src = `http://localhost:3000/${spotlight.profile_pic_url}`;
                } else {
                    document.getElementById('spotlight-pfp').src = 'default_pfp.jpg';
                }
            } else {
                console.error('Error fetching spotlight:', spotlight.message);
                document.getElementById('alumni-card').style.display = 'none';
            }
        } catch (error) {
            console.error('Network error:', error);
            document.getElementById('alumni-card').style.display = 'none';
        }
    };

    await fetchUserProfile();
    await fetchRecentEvents();
    await fetchRecentJobs();
    await fetchAlumniSpotlight();
});

document.querySelector('.btn-logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('userEmail');
    window.location.href = 'login.html';
});