document.addEventListener('DOMContentLoaded', () => {

    const userListContainer = document.getElementById('user-list');
    const eventListContainer = document.getElementById('event-list');
    const jobListContainer = document.getElementById('job-list');
    const applicationListContainer = document.getElementById('application-list');

    const fetchAdminStats = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/admin/stats');
            const stats = await response.json();

            document.getElementById('total-users').textContent = stats.totalUsers;
            document.getElementById('total-events').textContent = stats.totalEvents;
            document.getElementById('total-jobs').textContent = stats.totalJobs;
            document.getElementById('total-mentors').textContent = stats.totalMentors;
            document.getElementById('total-applications').textContent = stats.totalApplications;
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        }
    };

    const fetchAndRenderList = async (endpoint, container, renderFunction) => {
        try {
            const response = await fetch(`http://localhost:3000/api/${endpoint}`);
            const items = await response.json();
            
            container.innerHTML = '';
            if (items.length > 0) {
                items.forEach(item => {
                    container.appendChild(renderFunction(item));
                });
            } else {
                container.innerHTML = '<p class="info-message">No items to display.</p>';
            }
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            container.innerHTML = `<p class="info-message error">Failed to load ${endpoint}.</p>`;
        }
    };

    const handleDelete = async (type, id) => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/admin/${type}s/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
                loadAdminData(); // Refresh all data
            } else {
                const result = await response.json();
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            alert(`Failed to delete ${type}. Please try again.`);
        }
    };

    const renderUser = (user) => {
        const item = document.createElement('div');
        item.className = 'admin-list-item';
        item.innerHTML = `
            <div>
                <strong>${user.full_name}</strong> (${user.email})
                <span class="role-badge">${user.role}</span>
            </div>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${user.user_id}" data-type="user">Delete</button>
        `;
        return item;
    };

    const renderEvent = (event) => {
        const item = document.createElement('div');
        item.className = 'admin-list-item';
        const eventDate = new Date(event.date).toLocaleDateString();
        item.innerHTML = `
            <div>
                <strong>${event.title}</strong> - ${event.location}
                <br><small>${eventDate}</small>
            </div>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${event.event_id}" data-type="event">Delete</button>
        `;
        return item;
    };

    const renderJob = (job) => {
        const item = document.createElement('div');
        item.className = 'admin-list-item';
        item.innerHTML = `
            <div>
                <strong>${job.title}</strong> at ${job.company}
                <br><small>${job.location}</small>
            </div>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${job.job_id}" data-type="job">Delete</button>
        `;
        return item;
    };

    const renderApplication = (app) => {
        const item = document.createElement('div');
        item.className = 'admin-list-item';
        const applicationDate = new Date(app.application_date).toLocaleDateString();
        item.innerHTML = `
            <div>
                <strong>${app.full_name}</strong> (${app.user_email})
                <br>Applied for: <em>${app.job_title}</em> on ${applicationDate}
            </div>
            <a href="http://localhost:3000/${app.resume_path}" target="_blank" class="btn btn-secondary btn-sm">View Resume</a>
        `;
        return item;
    };

    const loadAdminData = () => {
        fetchAdminStats();
        fetchAndRenderList('admin/users', userListContainer, renderUser);
        fetchAndRenderList('events', eventListContainer, renderEvent);
        fetchAndRenderList('jobs', jobListContainer, renderJob);
        fetchAndRenderList('admin/applications', applicationListContainer, renderApplication);
    };

    loadAdminData();

    document.querySelector('.admin-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            handleDelete(type, id);
        }
    });
});