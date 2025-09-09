document.addEventListener('DOMContentLoaded', async () => {
    const jobsList = document.getElementById('jobs-list');

    try {
        const response = await fetch('http://localhost:3000/api/jobs');
        const jobs = await response.json();

        jobsList.innerHTML = ''; // Clear the loading message

        if (jobs.length > 0) {
            jobs.forEach(job => {
                const jobCard = document.createElement('div');
                jobCard.classList.add('job-card');
                jobCard.innerHTML = `
                    <h3>${job.title}</h3>
                    <p><i class="fas fa-building"></i> ${job.company}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${job.location}</p>
                    <p>${job.description}</p>
                `;
                jobsList.appendChild(jobCard);
            });
        } else {
            jobsList.innerHTML = '<p class="info-message">No jobs posted at this time.</p>';
        }
    } catch (error) {
        console.error('Error fetching jobs:', error);
        jobsList.innerHTML = '<p class="info-message error">Failed to load jobs. Please try again later.</p>';
    }
});