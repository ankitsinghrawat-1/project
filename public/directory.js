document.addEventListener('DOMContentLoaded', async () => {
    const alumniListContainer = document.getElementById('alumni-list');
    const searchInput = document.getElementById('directory-search');
    const searchButton = document.getElementById('search-btn');
    const noResultsMessage = document.getElementById('no-results-message');
    const loadingMessage = document.getElementById('loading-message');

    const fetchAndRenderAlumni = async (query = '') => {
        loadingMessage.style.display = 'block';
        alumniListContainer.innerHTML = '';
        noResultsMessage.style.display = 'none';

        try {
            const response = await fetch(`http://localhost:3000/api/alumni?query=${encodeURIComponent(query)}`);
            const alumni = await response.json();
            
            loadingMessage.style.display = 'none';

            if (alumni.length > 0) {
                alumni.forEach(alumnus => {
                    const alumnusCard = document.createElement('div');
                    alumnusCard.classList.add('alumnus-card');
                    
                    const profilePicUrl = alumnus.profile_pic_url ? `http://localhost:3000/${alumnus.profile_pic_url}` : 'default_pfp.jpg';

                    alumnusCard.innerHTML = `
                        <div class="alumnus-card-header">
                            <img src="${profilePicUrl}" alt="${alumnus.full_name}" class="alumnus-pfp">
                        </div>
                        <div class="alumnus-card-body">
                            <h3>${alumnus.full_name}</h3>
                            <p>${alumnus.job_title ? alumnus.job_title + ' at ' : ''}${alumnus.current_company || 'N/A'}</p>
                            <p>${alumnus.major || 'N/A'} | Class of ${alumnus.graduation_year || 'N/A'}</p>
                            <a href="view-profile.html?email=${alumnus.email}" class="btn btn-secondary">View Profile</a>
                        </div>
                    `;
                    alumniListContainer.appendChild(alumnusCard);
                });
            } else {
                noResultsMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error fetching alumni:', error);
            loadingMessage.style.display = 'none';
            alumniListContainer.innerHTML = '<p class="error-message">Failed to load alumni. Please try again later.</p>';
        }
    };

    fetchAndRenderAlumni();

    searchButton.addEventListener('click', () => {
        const query = searchInput.value;
        fetchAndRenderAlumni(query);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value;
            fetchAndRenderAlumni(query);
        }
    });
});