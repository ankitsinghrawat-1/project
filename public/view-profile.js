document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');

    if (!userEmail) {
        document.querySelector('.profile-container-view').innerHTML = '<div class="info-message">User not found.</div>';
        return;
    }

    const fetchUserProfile = async (email) => {
        try {
            const response = await fetch(`http://localhost:3000/api/profile/${email}`);
            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }
            const user = await response.json();
            
            document.getElementById('profile-name-view').textContent = user.full_name || 'N/A';
            document.getElementById('profile-subheader').textContent = `${user.job_title || 'N/A'} at ${user.current_company || 'N/A'}`;
            document.getElementById('bio-view').textContent = user.bio || 'No bio available.';
            document.getElementById('university-view').textContent = user.university || 'N/A';
            document.getElementById('graduation-year-view').textContent = user.graduation_year || 'N/A';
            document.getElementById('degree-view').textContent = user.degree || 'N/A';
            document.getElementById('major-view').textContent = user.major || 'N/A';
            document.getElementById('current-company-view').textContent = user.current_company || 'N/A';
            document.getElementById('job-title-view').textContent = user.job_title || 'N/A';
            document.getElementById('city-view').textContent = user.city || 'N/A';
            
            const linkedinLink = document.getElementById('linkedin-view');
            if (user.linkedin) {
                linkedinLink.href = user.linkedin;
                linkedinLink.textContent = user.linkedin;
            } else {
                linkedinLink.textContent = 'N/A';
            }
            
            document.getElementById('email-view').textContent = user.university_email || 'N/A';

            const profilePic = document.getElementById('profile-pic-view');
            if (user.profile_pic_url) {
                profilePic.src = `http://localhost:3000/${user.profile_pic_url}`;
            } else {
                profilePic.src = 'https://via.placeholder.com/150';
            }

        } catch (error) {
            console.error('Error fetching user profile:', error);
            document.querySelector('.profile-container-view').innerHTML = `<div class="info-message">Could not load profile.</div>`;
        }
    };

    fetchUserProfile(userEmail);
});