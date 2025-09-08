document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('profile-form');
    const userEmail = localStorage.getItem('userEmail');
    const navLinks = document.querySelectorAll('.profile-nav a');
    const pages = document.querySelectorAll('.profile-page');
    const profilePicPreview = document.getElementById('profile-pic-preview');
    const uploadBtn = document.getElementById('upload-btn');
    const pfpUpload = document.getElementById('pfp-upload');

    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(nav => nav.classList.remove('active'));
            e.target.classList.add('active');
            
            const targetPage = e.target.getAttribute('data-page');
            pages.forEach(page => {
                if (page.id === targetPage) {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });
        });
    });

    uploadBtn.addEventListener('click', () => {
        pfpUpload.click();
    });

    pfpUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                profilePicPreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    const fetchUserProfile = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/profile/${userEmail}`);
            const data = await response.json();
            if (response.ok) {
                document.getElementById('full-name').value = data.full_name || '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('bio').value = data.bio || '';
                document.getElementById('current-company').value = data.current_company || '';
                document.getElementById('job-title').value = data.job_title || '';
                document.getElementById('city').value = data.city || '';
                document.getElementById('linkedin').value = data.linkedin || '';
                document.getElementById('university').value = data.university || '';
                document.getElementById('major').value = data.major || '';
                document.getElementById('graduation-year').value = data.graduation_year || '';
                document.getElementById('degree').value = data.degree || '';
                if (data.profile_pic_url) {
                    profilePicPreview.src = `http://localhost:3000/${data.profile_pic_url}`;
                } else {
                    profilePicPreview.src = 'default_pfp.jpg';
                }
            } else {
                console.error('Error fetching profile data:', data.message);
                alert('Failed to load profile data.');
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('An error occurred while fetching profile data.');
        }
    };

    await fetchUserProfile();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        // Exclude the disabled email field from the FormData
        formData.delete('email');

        const file = pfpUpload.files[0];
        if (file) {
            formData.append('profile_picture', file);
        }

        try {
            const response = await fetch(`http://localhost:3000/api/profile/${userEmail}`, {
                method: 'PUT',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while saving your profile.');
        }
    });
});