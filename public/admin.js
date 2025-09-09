document.addEventListener('DOMContentLoaded', () => {
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('adminLoggedIn');
            window.location.href = 'admin-login.html';
        });
    }

    const addJobForm = document.getElementById('add-job-form');
    const addEventForm = document.getElementById('add-event-form');


    // Function to handle form submission for adding a job
    addJobForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const jobData = {
            title: document.getElementById('job-title').value,
            company: document.getElementById('job-company').value,
            location: document.getElementById('job-location').value,
            description: document.getElementById('job-description').value,
            contact_email: document.getElementById('job-contact').value
        };

        try {
            const response = await fetch('http://localhost:3000/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData)
            });
            const result = await response.json();
            
            if (response.ok) {
                alert('Job added successfully!');
                addJobForm.reset();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error adding job:', error);
            alert('Failed to add job. Please try again.');
        }
    });

    // Function to handle form submission for adding an event
    addEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const eventData = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            location: document.getElementById('event-location').value,
            organizer: document.getElementById('event-organizer').value,
            description: document.getElementById('event-description').value
        };

        try {
            const response = await fetch('http://localhost:3000/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
            const result = await response.json();
            
            if (response.ok) {
                alert('Event added successfully!');
                addEventForm.reset();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error adding event:', error);
            alert('Failed to add event. Please try again.');
        }
    });
});