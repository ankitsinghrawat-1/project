document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('onboarding-form');
    const userEmail = localStorage.getItem('userEmail');

    if (!userEmail) {
        window.location.href = 'login.html';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            email: userEmail,
            university: document.getElementById('university').value,
            universityEmail: document.getElementById('university-email').value,
            city: document.getElementById('city').value,
            company: document.getElementById('company').value,
            currentJob: document.getElementById('current-job').value,
            note: document.getElementById('note').value,
        };

        try {
            const response = await fetch('http://localhost:3000/api/onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                window.location.href = 'dashboard.html';
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    });
});