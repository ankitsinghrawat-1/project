document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');

    if (!email) {
        document.getElementById('profile-details-container').innerHTML = '<p class="error-message">User profile not found.</p>';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/public-profile/${email}`);
        const data = await response.json();

        if (response.ok) {
            document.getElementById('profile-pic-view').src = data.profile_pic_url ? `http://localhost:3000/${data.profile_pic_url}` : 'default_pfp.jpg';
            document.getElementById('profile-name').textContent = data.full_name || 'N/A';
            document.getElementById('profile-job-company').textContent = data.job_title && data.current_company ? `${data.job_title} at ${data.current_company}` : 'N/A';
            document.getElementById('profile-university').textContent = data.university || 'N/A';
            document.getElementById('profile-major').textContent = data.major || 'N/A';
            document.getElementById('profile-grad-year').textContent = data.graduation_year || 'N/A';
            document.getElementById('profile-bio').textContent = data.bio || 'No bio available.';
            document.getElementById('profile-city').textContent = data.city || 'N/A';
            
            const linkedinLink = document.getElementById('profile-linkedin');
            if (data.linkedin) {
                linkedinLink.href = data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`;
                linkedinLink.textContent = data.linkedin;
            } else {
                linkedinLink.textContent = 'N/A';
                linkedinLink.href = '#';
            }

        } else {
            document.getElementById('profile-details-container').innerHTML = `<p class="error-message">${data.message}</p>`;
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        document.getElementById('profile-details-container').innerHTML = '<p class="error-message">Failed to load profile. Please try again later.</p>';
    }
});