// Admin Panel JavaScript

// DOM Elements
let sidebarToggle, navItems, contentSections;
let adminLogoutBtn, refreshBtn, notificationBtn, quickActionBtn;
let notificationPanel, clearNotificationsBtn;
let addEventBtn, eventFilter, eventSearch, eventsTableBody;
let usersGrid, registrationsContainer;
let themeOptions, backupBtn, exportBtn, clearDataBtn;

// Global Variables
let currentSection = 'dashboard';
let notifications = [];
let adminStats = {
    totalEvents: 0,
    totalUsers: 0,
    totalRegistrations: 0,
    upcomingEvents: 0
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
    setupAdminEventListeners();
    
    // Check admin access
    checkAdminAccess();
    
    // Load initial data
    loadDashboardData();
    loadEventsForTable();
    loadUsers();
    loadRegistrations();
    
    // Setup real-time listeners
    setupRealtimeListeners();
});

// Initialize Admin Panel
function initializeAdmin() {
    // Get DOM elements
    sidebarToggle = document.getElementById('sidebarToggle');
    navItems = document.querySelectorAll('.nav-item');
    contentSections = document.querySelectorAll('.content-section');
    
    adminLogoutBtn = document.getElementById('adminLogoutBtn');
    refreshBtn = document.getElementById('refreshBtn');
    notificationBtn = document.getElementById('notificationBtn');
    quickActionBtn = document.getElementById('quickActionBtn');
    
    notificationPanel = document.getElementById('notificationPanel');
    clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
    
    addEventBtn = document.getElementById('addEventBtn');
    eventFilter = document.getElementById('eventFilter');
    eventSearch = document.getElementById('eventSearch');
    eventsTableBody = document.getElementById('eventsTableBody');
    
    usersGrid = document.getElementById('usersGrid');
    registrationsContainer = document.getElementById('registrationsContainer');
    
    themeOptions = document.querySelectorAll('.theme-option');
    backupBtn = document.getElementById('backupBtn');
    exportBtn = document.getElementById('exportBtn');
    clearDataBtn = document.getElementById('clearDataBtn');
    
    // Set current admin info
    updateAdminInfo();
}

// Setup Event Listeners
function setupAdminEventListeners() {
    // Sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Logout
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', handleAdminLogout);
    }
    
    // Refresh
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefresh);
    }
    
    // Notifications
    if (notificationBtn) {
        notificationBtn.addEventListener('click', toggleNotificationPanel);
    }
    
    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener('click', clearNotifications);
    }
    
    // Quick action
    if (quickActionBtn) {
        quickActionBtn.addEventListener('click', showAddEventModal);
    }
    
    // Events management
    if (addEventBtn) {
        addEventBtn.addEventListener('click', showAddEventModal);
    }
    
    if (eventFilter) {
        eventFilter.addEventListener('change', handleEventFilter);
    }
    
    if (eventSearch) {
        eventSearch.addEventListener('input', debounce(handleEventSearch, 300));
    }
    
    // Settings
    themeOptions.forEach(option => {
        option.addEventListener('click', handleThemeChange);
    });
    
    if (backupBtn) {
        backupBtn.addEventListener('click', handleBackup);
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }
    
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', handleClearData);
    }
    
    // Close notification panel on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.notification-panel') && 
            !e.target.closest('#notificationBtn') &&
            notificationPanel.classList.contains('active')) {
            notificationPanel.classList.remove('active');
        }
    });
}

// Check Admin Access
function checkAdminAccess() {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            // Not logged in, redirect to login
            window.location.href = 'login.html';
            return;
        }
        
        // Check if user is admin
        try {
            const snapshot = await database.ref('admins/' + user.uid).once('value');
            if (!snapshot.exists()) {
                // Not an admin, redirect to home
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            window.location.href = 'index.html';
        }
    });
}

// Update Admin Info
function updateAdminInfo() {
    const user = auth.currentUser;
    if (!user) return;
    
    const adminAvatar = document.getElementById('adminAvatar');
    const adminName = document.getElementById('adminName');
    const adminEmail = document.getElementById('adminEmail');
    
    if (adminAvatar) {
        adminAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=FF6B35&color=fff`;
    }
    
    if (adminName) {
        adminName.textContent = user.displayName || 'Admin User';
    }
    
    if (adminEmail) {
        adminEmail.textContent = user.email;
    }
}

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    sidebar.classList.toggle('active');
}

// Handle Navigation
function handleNavigation(e) {
    e.preventDefault();
    
    const target = e.currentTarget;
    const section = target.dataset.section;
    
    // Update active navigation item
    navItems.forEach(item => item.classList.remove('active'));
    target.classList.add('active');
    
    // Update active content section
    contentSections.forEach(section => section.classList.remove('active'));
    document.getElementById(section).classList.add('active');
    
    // Update page title
    updatePageTitle(section);
    
    // Load section data
    loadSectionData(section);
    
    // Close sidebar on mobile
    if (window.innerWidth <= 992) {
        toggleSidebar();
    }
}

// Update Page Title
function updatePageTitle(section) {
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    
    if (!pageTitle || !pageSubtitle) return;
    
    const titles = {
        dashboard: { title: 'Dashboard', subtitle: 'Welcome back, Administrator' },
        events: { title: 'Manage Events', subtitle: 'Create, edit, and manage events' },
        users: { title: 'User Management', subtitle: 'View and manage registered users' },
        registrations: { title: 'Registrations', subtitle: 'Manage event registrations' },
        settings: { title: 'Settings', subtitle: 'Configure system settings' }
    };
    
    if (titles[section]) {
        pageTitle.textContent = titles[section].title;
        pageSubtitle.textContent = titles[section].subtitle;
    }
}

// Load Section Data
function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'events':
            loadEventsForTable();
            break;
        case 'users':
            loadUsers();
            break;
        case 'registrations':
            loadRegistrations();
            break;
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        // Load events count
        const eventsSnapshot = await database.ref('events').once('value');
        adminStats.totalEvents = eventsSnapshot.numChildren();
        
        // Load users count
        const usersSnapshot = await database.ref('users').once('value');
        adminStats.totalUsers = usersSnapshot.numChildren();
        
        // Load registrations count
        const registrationsSnapshot = await database.ref('registrations').once('value');
        adminStats.totalRegistrations = registrationsSnapshot.numChildren();
        
        // Count upcoming events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let upcomingCount = 0;
        eventsSnapshot.forEach(child => {
            const event = child.val();
            if (event.date) {
                const eventDate = new Date(event.date);
                if (eventDate >= today) {
                    upcomingCount++;
                }
            }
        });
        adminStats.upcomingEvents = upcomingCount;
        
        // Update UI
        updateDashboardStats();
        loadRecentActivities();
        loadPopularEvents();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Failed to load dashboard data.', 'danger');
    }
}

// Update Dashboard Stats
function updateDashboardStats() {
    document.getElementById('totalEvents').textContent = adminStats.totalEvents;
    document.getElementById('totalUsers').textContent = adminStats.totalUsers;
    document.getElementById('totalRegistrations').textContent = adminStats.totalRegistrations;
    document.getElementById('upcomingEvents').textContent = adminStats.upcomingEvents;
    
    // Update nav badges
    const usersCount = document.getElementById('usersCount');
    const registrationsCount = document.getElementById('registrationsCount');
    
    if (usersCount) usersCount.textContent = adminStats.totalUsers;
    if (registrationsCount) registrationsCount.textContent = adminStats.totalRegistrations;
}

// Load Recent Activities
async function loadRecentActivities() {
    try {
        const activities = [];
        const activityList = document.getElementById('activityList');
        
        // Load recent events
        const eventsSnapshot = await database.ref('events')
            .orderByChild('createdAt')
            .limitToLast(5)
            .once('value');
        
        eventsSnapshot.forEach(child => {
            const event = child.val();
            activities.push({
                type: 'event',
                title: `New Event Created - ${event.title}`,
                time: event.createdAt,
                icon: 'fa-calendar-plus'
            });
        });
        
        // Load recent registrations
        const registrationsSnapshot = await database.ref('registrations')
            .orderByChild('registeredAt')
            .limitToLast(5)
            .once('value');
        
        registrationsSnapshot.forEach(child => {
            const registration = child.val();
            activities.push({
                type: 'registration',
                title: 'New Registration',
                time: registration.registeredAt,
                icon: 'fa-clipboard-check'
            });
        });
        
        // Sort by time (newest first)
        activities.sort((a, b) => b.time - a.time);
        
        // Update UI
        if (activityList) {
            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>${activity.title}</strong></p>
                        <span class="activity-time">${formatTimeAgo(activity.time)}</span>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

// Load Popular Events
async function loadPopularEvents() {
    try {
        const eventsSnapshot = await database.ref('events').once('value');
        const events = [];
        
        eventsSnapshot.forEach(child => {
            const event = child.val();
            events.push({
                id: child.key,
                ...event,
                participants: event.participants || 0
            });
        });
        
        // Sort by participants (descending)
        events.sort((a, b) => b.participants - a.participants);
        
        // Take top 5
        const popularEvents = events.slice(0, 5);
        const popularEventsContainer = document.getElementById('popularEvents');
        
        if (popularEventsContainer) {
            popularEventsContainer.innerHTML = popularEvents.map((event, index) => `
                <div class="popular-event">
                    <div class="event-rank">${index + 1}</div>
                    <div class="event-info">
                        <h4>${event.title}</h4>
                        <p>${event.participants} registrations</p>
                    </div>
                    <div class="event-trend">
                        <i class="fas fa-arrow-up text-success"></i>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Error loading popular events:', error);
    }
}

// Load Events for Table
async function loadEventsForTable() {
    try {
        const eventsSnapshot = await database.ref('events').once('value');
        const events = [];
        
        eventsSnapshot.forEach(child => {
            events.push({
                id: child.key,
                ...child.val()
            });
        });
        
        // Sort by date (newest first)
        events.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        
        // Update table
        updateEventsTable(events);
        
    } catch (error) {
        console.error('Error loading events for table:', error);
        showAlert('Failed to load events.', 'danger');
    }
}

// Update Events Table
function updateEventsTable(events) {
    if (!eventsTableBody) return;
    
    eventsTableBody.innerHTML = events.map(event => {
        const eventDate = event.date ? new Date(event.date) : new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let status = 'upcoming';
        if (eventDate < today) {
            status = 'completed';
        } else if (eventDate.getTime() === today.getTime()) {
            status = 'ongoing';
        }
        
        return `
            <tr>
                <td>
                    <div class="event-cell">
                        <img src="${event.imageUrl || 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}" 
                             alt="${event.title}">
                        <div class="event-cell-info">
                            <h4>${event.title}</h4>
                            <p>${event.venue || 'Main Auditorium'}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="category-badge ${event.category || 'technical'}">
                        ${(event.category || 'technical').charAt(0).toUpperCase() + (event.category || 'technical').slice(1)}
                    </span>
                </td>
                <td>
                    <div>${window.utils.formatDate(event.date)}</div>
                    <small>${window.utils.formatTime(event.time)}</small>
                </td>
                <td>${event.participants || 0}</td>
                <td>
                    <span class="status-badge ${status}">
                        ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </td>
                <td>
                    <div class="table-actions-cell">
                        <button class="btn-table-action edit" data-id="${event.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-table-action delete" data-id="${event.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-table-action view" data-id="${event.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Add event listeners to action buttons
    eventsTableBody.querySelectorAll('.btn-table-action.edit').forEach(btn => {
        btn.addEventListener('click', () => editEvent(btn.dataset.id));
    });
    
    eventsTableBody.querySelectorAll('.btn-table-action.delete').forEach(btn => {
        btn.addEventListener('click', () => {
            // Get event data and confirm delete
            const event = events.find(e => e.id === btn.dataset.id);
            if (event) confirmDeleteEvent(event);
        });
    });
    
    eventsTableBody.querySelectorAll('.btn-table-action.view').forEach(btn => {
        btn.addEventListener('click', () => viewEvent(btn.dataset.id));
    });
}

// Handle Event Filter
function handleEventFilter() {
    loadEventsForTable(); // In production, implement actual filtering
}

// Handle Event Search
function handleEventSearch() {
    loadEventsForTable(); // In production, implement actual search
}

// Load Users
async function loadUsers() {
    try {
        const usersSnapshot = await database.ref('users').once('value');
        const users = [];
        
        usersSnapshot.forEach(child => {
            users.push({
                id: child.key,
                ...child.val()
            });
        });
        
        // Update UI
        updateUsersGrid(users);
        
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Failed to load users.', 'danger');
    }
}

// Update Users Grid
function updateUsersGrid(users) {
    if (!usersGrid) return;
    
    usersGrid.innerHTML = users.map(user => `
        <div class="user-card">
            <div class="user-header">
                <img src="${user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=FF6B35&color=fff`}" 
                     alt="${user.name}" class="user-avatar">
                <div class="user-info">
                    <h4>${user.name || 'User'}</h4>
                    <p>${user.email}</p>
                </div>
            </div>
            
            <div class="user-details">
                <div class="user-detail">
                    <i class="fas fa-user-tag"></i>
                    <span>Role: ${user.role || 'User'}</span>
                </div>
                <div class="user-detail">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Joined: ${formatDate(user.createdAt)}</span>
                </div>
                <div class="user-detail">
                    <i class="fas fa-shield-alt"></i>
                    <span>Status: ${user.emailVerified ? 'Verified' : 'Unverified'}</span>
                </div>
            </div>
            
            <div class="user-actions">
                <button class="btn-outline btn-sm" onclick="viewUser('${user.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn-primary btn-sm" onclick="messageUser('${user.id}')">
                    <i class="fas fa-envelope"></i> Message
                </button>
            </div>
        </div>
    `).join('');
}

// Load Registrations
async function loadRegistrations() {
    try {
        const registrationsSnapshot = await database.ref('registrations').once('value');
        const registrations = [];
        
        registrationsSnapshot.forEach(child => {
            registrations.push({
                id: child.key,
                ...child.val()
            });
        });
        
        // Update UI
        updateRegistrationsTable(registrations);
        
    } catch (error) {
        console.error('Error loading registrations:', error);
        showAlert('Failed to load registrations.', 'danger');
    }
}

// Update Registrations Table
function updateRegistrationsTable(registrations) {
    if (!registrationsContainer) return;
    
    if (registrations.length === 0) {
        registrationsContainer.innerHTML = `
            <div class="no-data">
                <i class="fas fa-clipboard-list"></i>
                <h3>No Registrations Yet</h3>
                <p>User registrations will appear here.</p>
            </div>
        `;
        return;
    }
    
    registrationsContainer.innerHTML = `
        <div class="table-responsive">
            <table class="events-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Event</th>
                        <th>Registered At</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${registrations.map(reg => `
                        <tr>
                            <td>${reg.userId}</td>
                            <td>${reg.eventId}</td>
                            <td>${formatDate(reg.registeredAt)}</td>
                            <td>
                                <span class="status-badge ${reg.status}">
                                    ${reg.status}
                                </span>
                            </td>
                            <td>
                                <button class="btn-table-action" onclick="viewRegistration('${reg.id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Setup Realtime Listeners
function setupRealtimeListeners() {
    // Listen for new events
    database.ref('events').on('child_added', (snapshot) => {
        addNotification('New event added: ' + snapshot.val().title, 'event');
        updateDashboardStats();
    });
    
    // Listen for new users
    database.ref('users').on('child_added', (snapshot) => {
        addNotification('New user registered: ' + snapshot.val().email, 'user');
        updateDashboardStats();
    });
    
    // Listen for new registrations
    database.ref('registrations').on('child_added', (snapshot) => {
        addNotification('New event registration', 'registration');
        updateDashboardStats();
    });
}

// Add Notification
function addNotification(message, type = 'info') {
    const notification = {
        id: Date.now(),
        message: message,
        type: type,
        time: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    updateNotificationBadge();
    updateNotificationList();
    
    // Store in localStorage for persistence
    saveNotifications();
}

// Update Notification Badge
function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const notificationBadge = document.getElementById('notificationCount');
    
    if (notificationBadge) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

// Update Notification List
function updateNotificationList() {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    notificationList.innerHTML = notifications.map(notification => `
        <div class="notification-item ${notification.read ? '' : 'unread'}" data-id="${notification.id}">
            <p>${notification.message}</p>
            <span class="notification-time">${formatTimeAgo(notification.time)}</span>
        </div>
    `).join('');
    
    // Add click event to mark as read
    notificationList.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            markNotificationAsRead(id);
        });
    });
}

// Mark Notification as Read
function markNotificationAsRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
        notification.read = true;
        updateNotificationBadge();
        updateNotificationList();
        saveNotifications();
    }
}

// Clear Notifications
function clearNotifications() {
    notifications = [];
    updateNotificationBadge();
    updateNotificationList();
    saveNotifications();
}

// Save Notifications to localStorage
function saveNotifications() {
    try {
        localStorage.setItem('admin_notifications', JSON.stringify(notifications));
    } catch (error) {
        console.error('Error saving notifications:', error);
    }
}

// Load Notifications from localStorage
function loadNotifications() {
    try {
        const saved = localStorage.getItem('admin_notifications');
        if (saved) {
            notifications = JSON.parse(saved);
            updateNotificationBadge();
            updateNotificationList();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Toggle Notification Panel
function toggleNotificationPanel() {
    notificationPanel.classList.toggle('active');
    
    // Mark all as read when opening
    if (notificationPanel.classList.contains('active')) {
        notifications.forEach(n => n.read = true);
        updateNotificationBadge();
        updateNotificationList();
        saveNotifications();
    }
}

// Show Add Event Modal (reused from events.js)
function showAddEventModal() {
    // Reuse the function from events.js
    if (window.showAddEventModal) {
        window.showAddEventModal();
    }
}

// Edit Event (reused from events.js)
function editEvent(eventId) {
    // Reuse the function from events.js
    if (window.editEvent) {
        window.editEvent(eventId);
    }
}

// View Event
function viewEvent(eventId) {
    // Navigate to events page with view parameter
    window.location.href = `events.html?view=${eventId}`;
}

// View User
function viewUser(userId) {
    // Show user details modal
    showAlert('User details feature coming soon!', 'info');
}

// View Registration
function viewRegistration(registrationId) {
    // Show registration details
    showAlert('Registration details feature coming soon!', 'info');
}

// Message User
function messageUser(userId) {
    // Open email client
    window.location.href = `mailto:${userId}`;
}

// Handle Admin Logout
async function handleAdminLogout() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showAlert('Error signing out. Please try again.', 'danger');
    }
}

// Handle Refresh
function handleRefresh() {
    const icon = refreshBtn.querySelector('i');
    icon.classList.add('fa-spin');
    
    // Refresh current section
    loadSectionData(currentSection);
    
    setTimeout(() => {
        icon.classList.remove('fa-spin');
        showAlert('Data refreshed successfully!', 'success');
    }, 1000);
}

// Handle Theme Change
function handleThemeChange(e) {
    const theme = e.currentTarget.dataset.theme;
    
    // Update active theme button
    themeOptions.forEach(option => option.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    // Apply theme
    document.body.setAttribute('data-theme', theme);
    
    // Save preference
    localStorage.setItem('admin_theme', theme);
    
    showAlert(`Theme changed to ${theme} mode`, 'success');
}

// Handle Backup
async function handleBackup() {
    try {
        // Export all data
        const eventsSnapshot = await database.ref('events').once('value');
        const usersSnapshot = await database.ref('users').once('value');
        const registrationsSnapshot = await database.ref('registrations').once('value');
        
        const backupData = {
            events: eventsSnapshot.val(),
            users: usersSnapshot.val(),
            registrations: registrationsSnapshot.val(),
            backedUpAt: new Date().toISOString()
        };
        
        // Create downloadable file
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `technofest-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showAlert('Backup created successfully!', 'success');
        
    } catch (error) {
        console.error('Error creating backup:', error);
        showAlert('Failed to create backup.', 'danger');
    }
}

// Handle Export
function handleExport() {
    // Export reports as CSV
    showAlert('Export feature coming soon!', 'info');
}

// Handle Clear Data
function handleClearData() {
    if (confirm('Are you sure you want to clear all test data? This action cannot be undone.')) {
        showAlert('Test data cleared (simulated)', 'success');
        // In production, implement actual data clearing with proper authorization
    }
}

// Utility Functions
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
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
    
    const alertContainer = document.getElementById('alertContainer');
    if (alertContainer) {
        alertContainer.appendChild(alert);
    }
    
    // Remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Initialize notifications
loadNotifications();