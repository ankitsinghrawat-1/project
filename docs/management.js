document.addEventListener('DOMContentLoaded', () => {
    const pageType = document.body.dataset.page;
    const listContainer = document.getElementById('management-list');

    if (!pageType || !listContainer) {
        console.error('Page type or list container not found.');
        return;
    }

    const apiEndpoints = {
        users: { url: 'admin/users', type: 'user', idField: 'user_id' },
        events: { url: 'events', type: 'event', idField: 'event_id' },
        jobs: { url: 'jobs', type: 'job', idField: 'job_id' },
        applications: { url: 'admin/applications', type: 'application', idField: null } // No delete for applications
    };

    const renderers = {
        users: (item) => `
            <tr>
                <td>${item.full_name}</td>
                <td>${item.email}</td>
                <td><span class="role-badge">${item.role}</span></td>
                <td><button class="btn btn-danger btn-sm delete-btn" data-id="${item.user_id}" data-type="user">Delete</button></td>
            </tr>`,
        events: (item) => `
            <tr>
                <td>${item.title}</td>
                <td>${item.location}</td>
                <td>${new Date(item.date).toLocaleDateString()}</td>
                <td><button class="btn btn-danger btn-sm delete-btn" data-id="${item.event_id}" data-type="event">Delete</button></td>
            </tr>`,
        jobs: (item) => `
            <tr>
                <td>${item.title}</td>
                <td>${item.company}</td>
                <td>${item.location}</td>
                <td><button class="btn btn-danger btn-sm delete-btn" data-id="${item.job_id}" data-type="job">Delete</button></td>
            </tr>`,
        applications: (item) => `
            <tr>
                <td>${item.full_name}</td>
                <td>${item.user_email}</td>
                <td>${item.job_title}</td>
                <td>${new Date(item.application_date).toLocaleDateString()}</td>
                <td><a href="http://localhost:3000/${item.resume_path}" target="_blank" class="btn btn-secondary btn-sm">View Resume</a></td>
            </tr>`
    };

    const loadData = async () => {
        const endpoint = apiEndpoints[pageType];
        if (!endpoint) return;

        try {
            const response = await fetch(`http://localhost:3000/api/${endpoint.url}`);
            const items = await response.json();
            
            listContainer.innerHTML = '';
            if (items.length > 0) {
                listContainer.innerHTML = items.map(renderers[pageType]).join('');
            } else {
                listContainer.innerHTML = '<tr><td colspan="5" class="info-message">No items to display.</td></tr>';
            }
        } catch (error) {
            console.error(`Error fetching ${pageType}:`, error);
            listContainer.innerHTML = `<tr><td colspan="5" class="info-message error">Failed to load items.</td></tr>`;
        }
    };

    listContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const type = e.target.dataset.type;
            const id = e.target.dataset.id;

            if (confirm(`Are you sure you want to delete this ${type}?`)) {
                try {
                    const response = await fetch(`http://localhost:3000/api/admin/${type}s/${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        alert(`${type} deleted successfully.`);
                        loadData(); // Reload the list
                    } else {
                        const result = await response.json();
                        alert(`Error: ${result.message}`);
                    }
                } catch (error) {
                    console.error(`Error deleting ${type}:`, error);
                    alert(`An error occurred while deleting the ${type}.`);
                }
            }
        }
    });

    loadData();
});