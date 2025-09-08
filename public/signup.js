document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form');
    const fullNameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = fullNameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch('http://localhost:3000/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Account created successfully. Please log in.');
                window.location.href = 'login.html';
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    });
});