document.addEventListener('DOMContentLoaded', () => {
    const addBlogForm = document.getElementById('add-blog-form');
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');

    if (!loggedInUserEmail) {
        window.location.href = 'login.html';
        return;
    }

    if (addBlogForm) {
        addBlogForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const blogData = {
                title: document.getElementById('title').value,
                content: document.getElementById('content').value,
                author_email: loggedInUserEmail
            };

            try {
                const response = await fetch('http://localhost:3000/api/blogs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(blogData)
                });
                const result = await response.json();

                if (response.ok) {
                    showToast('Blog post added successfully!', 'success');
                    addBlogForm.reset();
                } else {
                    showToast(`Error: ${result.message}`, 'error');
                }
            } catch (error) {
                console.error('Error adding blog post:', error);
                showToast('Failed to add blog post. Please try again.', 'error');
            }
        });
    }
});