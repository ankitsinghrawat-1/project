document.addEventListener('DOMContentLoaded', () => {
    const addJobForm = document.getElementById('add-job-form');

    if (addJobForm) {
        addJobForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const jobData = {
                title: document.getElementById('title').value,
                company: document.getElementById('company').value,
                location: document.getElementById('location').value,
                description: document.getElementById('description').value,
                contact_email: document.getElementById('contact-email').value
            };

            try {
                const response = await fetch(`${API_BASE_URL}/api/jobs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jobData)
                });
                const result = await response.json();

                if (response.ok) {
                    showToast('Job added successfully!', 'success');
                    addJobForm.reset();
                } else {
                    showToast(`Error: ${result.message}`, 'error');
                }
            } catch (error) {
                console.error('Error adding job:', error);
                showToast('Failed to add job. Please try again.', 'error');
            }
        });
    }
});