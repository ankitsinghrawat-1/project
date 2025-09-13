document.addEventListener('DOMContentLoaded', async () => {
    const jobsGrid = document.getElementById('jobs-grid');
    const messageDiv = document.getElementById('message');

    try {
        const response = await fetch('http://localhost:3000/api/jobs');
        const jobs = await response.json();

        jobsGrid.innerHTML = ''; 

        if (jobs.length > 0) {
            jobs.forEach(job => {
                const jobCard = document.createElement('div');
                jobCard.classList.add('job-card');

                const applyUrl = `apply.html?job_id=${job.job_id}&title=${encodeURIComponent(job.title)}`;

                // Sanitize the description
                const cleanDescription = DOMPurify.sanitize(job.description);

                jobCard.innerHTML = `
                    <h3>${job.title}</h3>
                    <p class="job-company"><i class="fas fa-building"></i> ${job.company}</p>
                    <p class="job-location"><i class="fas fa-map-marker-alt"></i> ${job.location}</p>
                    <p class="job-description">${cleanDescription}</p>
                    <a href="${applyUrl}" class="btn btn-primary apply-btn">Apply Now</a>
                `;
                jobsGrid.appendChild(jobCard);
            });
        } else {
            if (messageDiv) {
                messageDiv.innerHTML = '<p class="info-message">No jobs posted at this time.</p>';
            }
        }
    } catch (error) {
        console.error('Error fetching jobs:', error);
        if (messageDiv) {
            messageDiv.innerHTML = '<p class="info-message error">Failed to load jobs. Please try again later.</p>';
        }
    }
});