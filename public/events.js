document.addEventListener('DOMContentLoaded', async () => {
    const eventsList = document.getElementById('events-list');

    try {
        const response = await fetch('http://localhost:3000/api/events');
        const events = await response.json();

        eventsList.innerHTML = ''; // Clear the loading message

        if (events.length > 0) {
            events.forEach(event => {
                const eventCard = document.createElement('div');
                eventCard.classList.add('event-card');
                eventCard.innerHTML = `
                    <h3>${event.title}</h3>
                    <p><i class="fas fa-calendar-alt"></i> ${event.date}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                    <p>${event.description}</p>
                `;
                eventsList.appendChild(eventCard);
            });
        } else {
            eventsList.innerHTML = '<p class="info-message">No upcoming events at this time.</p>';
        }
    } catch (error) {
        console.error('Error fetching events:', error);
        eventsList.innerHTML = '<p class="info-message error">Failed to load events. Please try again later.</p>';
    }
});