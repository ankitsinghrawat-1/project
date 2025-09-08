document.addEventListener('DOMContentLoaded', async () => {
    const campaignsGrid = document.getElementById('campaigns-grid');

    const fetchCampaigns = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/campaigns');
            const campaigns = await response.json();

            if (campaigns.length > 0) {
                campaigns.forEach(campaign => {
                    const campaignCard = document.createElement('div');
                    campaignCard.classList.add('campaign-card');
                    campaignCard.innerHTML = `
                        <img src="${campaign.image_url}" alt="${campaign.title}" class="campaign-image">
                        <div class="campaign-content">
                            <h3>${campaign.title}</h3>
                            <p>${campaign.description}</p>
                            <div class="campaign-progress">
                                <progress value="${campaign.current_amount}" max="${campaign.goal}"></progress>
                                <p>$${campaign.current_amount.toLocaleString()} raised of $${campaign.goal.toLocaleString()}</p>
                            </div>
                            <a href="#" class="btn btn-secondary">Learn More</a>
                        </div>
                    `;
                    campaignsGrid.appendChild(campaignCard);
                });
            } else {
                campaignsGrid.innerHTML = '<p>No active campaigns to display.</p>';
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            campaignsGrid.innerHTML = '<p>Failed to load campaigns. Please try again later.</p>';
        }
    };

    fetchCampaigns();
});