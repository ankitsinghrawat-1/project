document.addEventListener('DOMContentLoaded', async () => {
    const alumniListContainer = document.getElementById('directory-list');
    const searchInput = document.getElementById('directory-search-input');
    const searchButton = document.getElementById('directory-search-button');
    const noResultsMessage = document.getElementById('no-results-message');
    const loadingMessage = document.getElementById('loading-message');

    const fetchAndRenderAlumni = async (query = '') => {
        if (!alumniListContainer || !loadingMessage || !noResultsMessage) {
            console.error('Core directory elements not found!');
            return;
        }

        loadingMessage.style.display = 'block';
        alumniListContainer.innerHTML = '';
        noResultsMessage.style.display = 'none';

        try {
            const response = await fetch(`http://localhost:3000/api/alumni?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const alumni = await response.json();
            
            loadingMessage.style.display = 'none';

            if (alumni.length > 0) {
                alumni.forEach(alumnus => {
                    const alumnusItem = document.createElement('div');
                    alumnusItem.classList.add('alumnus-list-item');
                    
                    const profilePicUrl = alumnus.profile_pic_url 
                        ? `http://localhost:3000/${alumnus.profile_pic_url}` 
                        : 'https://via.placeholder.com/150';

                    alumnusItem.innerHTML = `
                        <img src="${profilePicUrl}" alt="${alumnus.full_name}" class="alumnus-pfp-round">
                        <div class="alumnus-details">
                            <h3>${alumnus.full_name}</h3>
                            <p><i class="fas fa-briefcase"></i> ${alumnus.job_title ? alumnus.job_title + ' at ' : ''}${alumnus.current_company || 'N/A'}</p>
                            <p><i class="fas fa-graduation-cap"></i> ${alumnus.major || 'N/A'} | Class of ${alumnus.graduation_year || 'N/A'}</p>
                            <a href="view-profile.html?email=${alumnus.email}" class="btn btn-secondary">View Profile</a>
                        </div>
                    `;
                    alumniListContainer.appendChild(alumnusItem);
                });
            } else {
                noResultsMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error fetching alumni:', error);
            loadingMessage.style.display = 'none';
            alumniListContainer.innerHTML = '<p class="error-message">Failed to load alumni. Please check the console and try again later.</p>';
        }
    };

    // Initial load of all alumni
    fetchAndRenderAlumni();

    // Setup search functionality
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', () => {
            fetchAndRenderAlumni(searchInput.value);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fetchAndRenderAlumni(searchInput.value);
            }
        });
    } else {
        console.error('Search input or button not found!');
    }
});