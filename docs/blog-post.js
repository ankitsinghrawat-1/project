document.addEventListener('DOMContentLoaded', async () => {
    const postContainer = document.getElementById('blog-post-content');
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        postContainer.innerHTML = '<h1>Post not found</h1>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/blogs/${postId}`);
        const post = await response.json();

        document.title = post.title; // Update page title

        const postDate = new Date(post.created_at).toLocaleDateString();
        
        // Sanitize the content before rendering
        const cleanContent = DOMPurify.sanitize(post.content);

        postContainer.innerHTML = `
            <article class="blog-post-full card">
                <h1>${post.title}</h1>
                <p class="post-meta">By ${post.author} on ${postDate}</p>
                <div class="post-content">${cleanContent}</div>
            </article>
        `;
    } catch (error) {
        console.error('Error fetching post:', error);
        postContainer.innerHTML = '<h1>Error loading post</h1>';
    }
});