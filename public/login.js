document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('userEmail', email);
                if (data.onboardingComplete) {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'onboarding.html';
                }
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    });
});