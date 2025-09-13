document.addEventListener('DOMContentLoaded', () => {
    const addEventForm = document.getElementById('add-event-form');

    if (addEventForm) {
        addEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const eventData = {
                title: document.getElementById('title').value,
                date: document.getElementById('date').value,
                location: document.getElementById('location').value,
                organizer: document.getElementById('organizer').value,
                description: document.getElementById('description').value
            };

            try {
                const response = await fetch(`${API_BASE_URL}/api/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
                });
                const result = await response.json();

                if (response.ok) {
                    showToast('Event added successfully!', 'success');
                    addEventForm.reset();
                } else {
                    showToast(`Error: ${result.message}`, 'error');
                }
            } catch (error) {
                console.error('Error adding event:', error);
                showToast('Failed to add event. Please try again.', 'error');
            }
        });
    }
});