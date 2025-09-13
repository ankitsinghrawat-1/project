document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('edit-mentor-form');
    const expertiseAreasInput = document.getElementById('expertise_areas');
    const messageDiv = document.getElementById('message');
    const unlistBtn = document.getElementById('unlist-mentor-btn');
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');

    if (!loggedInUserEmail) {
        window.location.href = 'login.html';
        return;
    }

    // Fetch current mentor profile to pre-fill the form
    const fetchMentorProfile = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/mentors/profile?email=${encodeURIComponent(loggedInUserEmail)}`);
            if (response.ok) {
                const profile = await response.json();
                expertiseAreasInput.value = profile.expertise_areas;
            } else {
                messageDiv.className = 'form-message error';
                messageDiv.textContent = 'Could not load your mentor profile.';
            }
        } catch (error) {
            console.error('Error fetching mentor profile:', error);
            messageDiv.className = 'form-message error';
            messageDiv.textContent = 'An error occurred while loading your profile.';
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const expertise_areas = expertiseAreasInput.value;

        try {
            const response = await fetch('http://localhost:3000/api/mentors/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loggedInUserEmail, expertise_areas })
            });

            const result = await response.json();
            messageDiv.textContent = result.message;

            if (response.ok) {
                messageDiv.className = 'form-message success';
                setTimeout(() => window.location.href = 'mentors.html', 2000);
            } else {
                messageDiv.className = 'form-message error';
            }
        } catch (error) {
            messageDiv.className = 'form-message error';
            messageDiv.textContent = 'An error occurred. Please try again.';
            console.error('Error updating mentor profile:', error);
        }
    });

    unlistBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to unlist yourself as a mentor? This action cannot be undone.')) {
            try {
                const response = await fetch('http://localhost:3000/api/mentors/profile', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: loggedInUserEmail })
                });

                const result = await response.json();
                
                if (response.ok) {
                    alert('You have been successfully unlisted as a mentor.');
                    window.location.href = 'mentors.html';
                } else {
                    messageDiv.className = 'form-message error';
                    messageDiv.textContent = result.message;
                }
            } catch (error) {
                messageDiv.className = 'form-message error';
                messageDiv.textContent = 'An error occurred. Please try again.';
                console.error('Error unlisting mentor:', error);
            }
        }
    });

    fetchMentorProfile();
});