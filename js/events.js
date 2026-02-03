// Events Page JavaScript

// DOM Elements
let eventsGrid, loadingContainer, noEvents, searchInput, clearSearch;
let filterButtons, addEventBtn, adminControls, addFirstEventBtn;
let eventModal, deleteModal, alertContainer;

// Global Variables
let events = [];
let filteredEvents = [];
let currentFilter = 'all';
let searchTerm = '';
let eventToDelete = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeEvents();
    setupEventListeners();
    loadEvents();
    
    // Check admin status
    checkAdminAccess();
});

// Initialize Events Page
function initializeEvents() {
    // Get DOM elements
    eventsGrid = document.getElementById('eventsGrid');
    loadingContainer = document.getElementById('loadingContainer');
    noEvents = document.getElementById('noEvents');
    searchInput = document.getElementById('searchInput');
    clearSearch = document.getElementById('clearSearch');
    filterButtons = document.querySelectorAll('.filter-btn');
    addEventBtn = document.getElementById('addEventBtn');
    adminControls = document.getElementById('adminControls');
    addFirstEventBtn = document.getElementById('addFirstEventBtn');
    eventModal = document.getElementById('eventModal');
    deleteModal = document.getElementById('deleteModal');
    alertContainer = document.getElementById('alertContainer');
}

// Setup Event Listeners
function setupEventListeners() {
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    if (clearSearch) {
        clearSearch.addEventListener('click', clearSearchHandler);
    }
    
    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
    
    // Admin controls
    if (addEventBtn) {
        addEventBtn.addEventListener('click', showAddEventModal);
    }
    
    if (addFirstEventBtn) {
        addFirstEventBtn.addEventListener('click', showAddEventModal);
    }
    
    // Modal controls
    setupModalEventListeners();
    
    // Image preview
    const eventImageInput = document.getElementById('eventImage');
    if (eventImageInput) {
        eventImageInput.addEventListener('input', handleImagePreview);
    }
    
    // Character count for description
    const eventDescription = document.getElementById('eventDescription');
    if (eventDescription) {
        eventDescription.addEventListener('input', updateCharCount);
    }
}

// Load Events from Firebase
async function loadEvents() {
    try {
        showLoading(true);
        
        // Listen for events data changes
        database.ref('events').on('value', (snapshot) => {
            events = [];
            snapshot.forEach((childSnapshot) => {
                const event = {
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                };
                events.push(event);
            });
            
            // Sort events by date (newest first)
            events.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            
            // Apply filters and display
            applyFilters();
            displayEvents();
            showLoading(false);
            
            // Show/hide no events message
            toggleNoEventsMessage();
        });
        
    } catch (error) {
        console.error('Error loading events:', error);
        showAlert('Failed to load events. Please try again.', 'danger');
        showLoading(false);
    }
}

// Display Events in Grid
function displayEvents() {
    if (!eventsGrid) return;
    
    eventsGrid.innerHTML = '';
    
    if (filteredEvents.length === 0) {
        eventsGrid.appendChild(noEvents);
        noEvents.style.display = 'block';
        return;
    }
    
    noEvents.style.display = 'none';
    
    filteredEvents.forEach((event, index) => {
        const eventCard = createEventCard(event, index);
        eventsGrid.appendChild(eventCard);
    });
    
    // Add animation delay to cards
    const cards = eventsGrid.querySelectorAll('.event-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

// Create Event Card Element
function createEventCard(event, index) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    // Format date
    const eventDate = event.date ? new Date(event.date) : new Date();
    const day = eventDate.getDate();
    const month = eventDate.toLocaleString('default', { month: 'short' });
    const formattedDate = window.utils.formatDate(event.date);
    const formattedTime = window.utils.formatTime(event.time);
    
    // Check if user is admin
    const isAdmin = window.isAdmin || false;
    
    card.innerHTML = `
        ${isAdmin ? '<div class="admin-actions"></div>' : ''}
        
        <div class="event-image">
            <img src="${event.imageUrl || 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}" 
                 alt="${event.title}" 
                 onerror="this.src='https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'">
            <span class="event-category ${event.category || 'technical'}">
                ${(event.category || 'technical').charAt(0).toUpperCase() + (event.category || 'technical').slice(1)}
            </span>
        </div>
        
        <div class="event-content">
            <div class="event-header">
                <h3 class="event-title">${event.title}</h3>
                <div class="event-date">
                    <span class="event-day">${day}</span>
                    <span class="event-month">${month}</span>
                </div>
            </div>
            
            <div class="event-details">
                <div class="event-detail">
                    <i class="fas fa-clock"></i>
                    <span>${formattedTime}</span>
                </div>
                <div class="event-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${event.venue || 'Main Auditorium'}</span>
                </div>
                ${event.maxParticipants ? `
                <div class="event-detail">
                    <i class="fas fa-users"></i>
                    <span>${event.maxParticipants} slots</span>
                </div>
                ` : ''}
            </div>
            
            <p class="event-description">
                ${event.description || 'No description available.'}
            </p>
            
            <div class="event-footer">
                <div class="event-participants">
                    <i class="fas fa-user-friends"></i>
                    <span>${event.participants || 0} registered</span>
                </div>
                <div class="event-actions">
                    <button class="btn-primary btn-sm btn-register" data-link="${event.registrationLink}">
                        <i class="fas fa-user-plus"></i>
                        Register
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add admin actions if user is admin
    if (isAdmin) {
        const adminActions = card.querySelector('.admin-actions');
        adminActions.innerHTML = `
            <button class="btn-edit" data-id="${event.id}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-delete" data-id="${event.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        // Add edit/delete event listeners
        const editBtn = adminActions.querySelector('.btn-edit');
        const deleteBtn = adminActions.querySelector('.btn-delete');
        
        editBtn.addEventListener('click', () => editEvent(event.id));
        deleteBtn.addEventListener('click', () => confirmDeleteEvent(event));
    }
    
    // Add register button event listener
    const registerBtn = card.querySelector('.btn-register');
    if (registerBtn) {
        registerBtn.addEventListener('click', () => registerForEvent(event));
    }
    
    return card;
}

// Handle Search
function handleSearch(e) {
    searchTerm = e.target.value.toLowerCase().trim();
    applyFilters();
    displayEvents();
    
    // Show/hide clear search button
    if (clearSearch) {
        clearSearch.style.visibility = searchTerm ? 'visible' : 'hidden';
    }
}

// Clear Search
function clearSearchHandler() {
    if (searchInput) {
        searchInput.value = '';
        searchTerm = '';
        applyFilters();
        displayEvents();
        clearSearch.style.visibility = 'hidden';
    }
}

// Handle Filter Click
function handleFilterClick(e) {
    // Update active filter button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Set current filter
    currentFilter = e.target.dataset.filter;
    
    // Apply filters and display
    applyFilters();
    displayEvents();
}

// Apply Filters
function applyFilters() {
    filteredEvents = events.filter(event => {
        // Apply search filter
        const matchesSearch = !searchTerm || 
            event.title.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm) ||
            event.category.toLowerCase().includes(searchTerm);
        
        // Apply category filter
        const matchesCategory = currentFilter === 'all' || 
            event.category === currentFilter;
        
        return matchesSearch && matchesCategory;
    });
}

// Show Loading State
function showLoading(show) {
    if (loadingContainer) {
        loadingContainer.style.display = show ? 'block' : 'none';
    }
    
    if (eventsGrid) {
        eventsGrid.style.opacity = show ? '0.5' : '1';
    }
}

// Toggle No Events Message
function toggleNoEventsMessage() {
    if (!noEvents) return;
    
    const hasEvents = events.length > 0;
    const hasFilteredEvents = filteredEvents.length > 0;
    
    if (!hasEvents) {
        noEvents.style.display = 'block';
        if (addFirstEventBtn) {
            addFirstEventBtn.style.display = window.isAdmin ? 'block' : 'none';
        }
    } else if (!hasFilteredEvents) {
        noEvents.style.display = 'block';
        noEvents.querySelector('h3').textContent = 'No Events Match Your Search';
        noEvents.querySelector('p').textContent = 'Try adjusting your search or filter criteria.';
        if (addFirstEventBtn) {
            addFirstEventBtn.style.display = 'none';
        }
    } else {
        noEvents.style.display = 'none';
    }
}

// Check Admin Access
function checkAdminAccess() {
    // Check if user is admin (from main.js)
    if (window.isAdmin && adminControls) {
        adminControls.style.display = 'block';
    }
}

// Show Add Event Modal
function showAddEventModal() {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    const modalTitle = document.getElementById('modalTitle');
    const submitText = document.getElementById('submitText');
    
    if (modal && form && modalTitle && submitText) {
        // Reset form
        form.reset();
        document.getElementById('eventId').value = '';
        
        // Set modal title and button text
        modalTitle.textContent = 'Add New Event';
        submitText.textContent = 'Add Event';
        
        // Set default date (tomorrow)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('eventDate').value = tomorrow.toISOString().split('T')[0];
        
        // Set default time (10:00 AM)
        document.getElementById('eventTime').value = '10:00';
        
        // Clear image preview
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.style.display = 'none';
        }
        
        // Reset character count
        updateCharCount();
        
        // Show modal
        modal.classList.add('active');
    }
}

// Show Edit Event Modal
async function editEvent(eventId) {
    try {
        const eventRef = database.ref('events/' + eventId);
        const snapshot = await eventRef.once('value');
        
        if (snapshot.exists()) {
            const event = snapshot.val();
            const modal = document.getElementById('eventModal');
            const form = document.getElementById('eventForm');
            const modalTitle = document.getElementById('modalTitle');
            const submitText = document.getElementById('submitText');
            
            if (modal && form && modalTitle && submitText) {
                // Fill form with event data
                document.getElementById('eventId').value = eventId;
                document.getElementById('eventImage').value = event.imageUrl || '';
                document.getElementById('eventTitle').value = event.title || '';
                document.getElementById('eventCategory').value = event.category || 'technical';
                document.getElementById('eventDescription').value = event.description || '';
                document.getElementById('eventDate').value = event.date || '';
                document.getElementById('eventTime').value = event.time || '';
                document.getElementById('eventVenue').value = event.venue || '';
                document.getElementById('eventLink').value = event.registrationLink || '';
                document.getElementById('eventMaxParticipants').value = event.maxParticipants || '';
                
                // Set modal title and button text
                modalTitle.textContent = 'Edit Event';
                submitText.textContent = 'Update Event';
                
                // Show image preview if exists
                if (event.imageUrl) {
                    const imagePreview = document.getElementById('imagePreview');
                    const previewImage = document.getElementById('previewImage');
                    if (imagePreview && previewImage) {
                        previewImage.src = event.imageUrl;
                        imagePreview.style.display = 'block';
                    }
                }
                
                // Update character count
                updateCharCount();
                
                // Show modal
                modal.classList.add('active');
            }
        }
    } catch (error) {
        console.error('Error loading event for edit:', error);
        showAlert('Failed to load event for editing.', 'danger');
    }
}

// Setup Modal Event Listeners
function setupModalEventListeners() {
    // Event form submission
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', handleEventSubmit);
    }
    
    // Modal close buttons
    const modalClose = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            eventModal.classList.remove('active');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            eventModal.classList.remove('active');
        });
    }
    
    // Delete modal buttons
    const deleteModalClose = document.getElementById('deleteModalClose');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    if (deleteModalClose) {
        deleteModalClose.addEventListener('click', () => {
            deleteModal.classList.remove('active');
            eventToDelete = null;
        });
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.classList.remove('active');
            eventToDelete = null;
        });
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteEvent);
    }
    
    // Close modals on outside click
    [eventModal, deleteModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    if (modal === deleteModal) {
                        eventToDelete = null;
                    }
                }
            });
        }
    });
}

// Handle Event Form Submission
async function handleEventSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const eventId = document.getElementById('eventId').value;
    const eventData = {
        title: document.getElementById('eventTitle').value.trim(),
        description: document.getElementById('eventDescription').value.trim(),
        category: document.getElementById('eventCategory').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        venue: document.getElementById('eventVenue').value.trim(),
        registrationLink: document.getElementById('eventLink').value.trim(),
        imageUrl: document.getElementById('eventImage').value.trim(),
        maxParticipants: document.getElementById('eventMaxParticipants').value || null,
        createdAt: eventId ? undefined : firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        createdBy: window.currentUser ? window.currentUser.uid : 'admin'
    };
    
    // Validate form
    const errors = validateEventData(eventData);
    if (Object.keys(errors).length > 0) {
        showFormErrors(errors);
        return;
    }
    
    // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    const submitSpinner = document.getElementById('submitSpinner');
    const submitText = document.getElementById('submitText');
    
    submitBtn.disabled = true;
    submitSpinner.style.display = 'inline-block';
    submitText.textContent = 'Saving...';
    
    try {
        if (eventId) {
            // Update existing event
            await database.ref('events/' + eventId).update(eventData);
            showAlert('Event updated successfully!', 'success');
        } else {
            // Add new event
            const newEventRef = database.ref('events').push();
            await newEventRef.set(eventData);
            showAlert('Event added successfully!', 'success');
        }
        
        // Close modal
        eventModal.classList.remove('active');
        
    } catch (error) {
        console.error('Error saving event:', error);
        showAlert('Failed to save event. Please try again.', 'danger');
    } finally {
        // Reset loading state
        submitBtn.disabled = false;
        submitSpinner.style.display = 'none';
        submitText.textContent = eventId ? 'Update Event' : 'Add Event';
    }
}

// Validate Event Data
function validateEventData(data) {
    const errors = {};
    
    if (!data.title) errors.title = 'Event title is required';
    if (!data.description) errors.description = 'Event description is required';
    if (!data.category) errors.category = 'Category is required';
    if (!data.date) errors.date = 'Event date is required';
    if (!data.time) errors.time = 'Event time is required';
    if (!data.venue) errors.venue = 'Venue is required';
    if (!data.registrationLink) errors.registrationLink = 'Registration link is required';
    if (!data.imageUrl) errors.imageUrl = 'Event image URL is required';
    
    // Validate URL
    if (data.imageUrl && !isValidUrl(data.imageUrl)) {
        errors.imageUrl = 'Please enter a valid image URL';
    }
    
    if (data.registrationLink && !isValidUrl(data.registrationLink)) {
        errors.registrationLink = 'Please enter a valid registration link';
    }
    
    // Validate date is not in the past
    if (data.date) {
        const eventDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (eventDate < today) {
            errors.date = 'Event date cannot be in the past';
        }
    }
    
    return errors;
}

// Show Form Errors
function showFormErrors(errors) {
    // Clear previous errors
    clearFormErrors();
    
    // Show new errors
    for (const field in errors) {
        const input = document.getElementById('event' + field.charAt(0).toUpperCase() + field.slice(1));
        if (input) {
            input.classList.add('error');
            const errorElement = input.nextElementSibling;
            if (errorElement && errorElement.classList.contains('form-text')) {
                errorElement.textContent = errors[field];
                errorElement.classList.add('error');
            }
        }
    }
    
    // Scroll to first error
    const firstError = document.querySelector('.form-control.error');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
    }
}

// Clear Form Errors
function clearFormErrors() {
    document.querySelectorAll('.form-control.error').forEach(input => {
        input.classList.remove('error');
    });
    
    document.querySelectorAll('.form-text.error').forEach(errorElement => {
        errorElement.textContent = '';
        errorElement.classList.remove('error');
    });
}

// Handle Image Preview
function handleImagePreview() {
    const imageUrl = this.value.trim();
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    
    if (imageUrl && isValidUrl(imageUrl)) {
        previewImage.src = imageUrl;
        imagePreview.style.display = 'block';
    } else {
        imagePreview.style.display = 'none';
    }
}

// Update Character Count
function updateCharCount() {
    const textarea = document.getElementById('eventDescription');
    const charCount = document.getElementById('charCount');
    
    if (textarea && charCount) {
        const length = textarea.value.length;
        charCount.textContent = length;
        
        // Update color based on length
        if (length > 450) {
            charCount.className = 'error';
        } else if (length > 400) {
            charCount.className = 'warning';
        } else {
            charCount.className = '';
        }
    }
}

// Confirm Delete Event
function confirmDeleteEvent(event) {
    eventToDelete = event;
    
    const deleteTitle = document.getElementById('deleteTitle');
    const deleteDate = document.getElementById('deleteDate');
    const deleteImage = document.getElementById('deleteImage');
    
    if (deleteTitle && deleteDate && deleteImage) {
        deleteTitle.textContent = event.title;
        deleteDate.textContent = `Date: ${window.utils.formatDate(event.date)}`;
        deleteImage.src = event.imageUrl || 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
    }
    
    deleteModal.classList.add('active');
}

// Delete Event
async function deleteEvent() {
    if (!eventToDelete) return;
    
    try {
        await database.ref('events/' + eventToDelete.id).remove();
        showAlert('Event deleted successfully!', 'success');
        deleteModal.classList.remove('active');
        eventToDelete = null;
    } catch (error) {
        console.error('Error deleting event:', error);
        showAlert('Failed to delete event. Please try again.', 'danger');
    }
}

// Register for Event
function registerForEvent(event) {
    if (!window.currentUser) {
        showAlert('Please login to register for events.', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    // Open registration link in new tab
    if (event.registrationLink) {
        window.open(event.registrationLink, '_blank');
        
        // Record registration in database (optional)
        recordRegistration(event.id, window.currentUser.uid);
        
        showAlert('Redirecting to registration form...', 'info');
    } else {
        showAlert('Registration link not available.', 'warning');
    }
}

// Record Registration (Optional)
async function recordRegistration(eventId, userId) {
    try {
        const registrationRef = database.ref('registrations').push();
        await registrationRef.set({
            eventId: eventId,
            userId: userId,
            registeredAt: firebase.database.ServerValue.TIMESTAMP,
            status: 'registered'
        });
        
        // Increment participant count
        const eventRef = database.ref('events/' + eventId + '/participants');
        const snapshot = await eventRef.once('value');
        const currentCount = snapshot.val() || 0;
        await eventRef.set(currentCount + 1);
        
    } catch (error) {
        console.error('Error recording registration:', error);
        // Don't show error to user - this is just for analytics
    }
}

// Utility Functions
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    if (alertContainer) {
        alertContainer.appendChild(alert);
    } else {
        document.body.appendChild(alert);
    }
    
    // Remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}