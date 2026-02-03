// Main JavaScript - Global Functions

// DOM Elements
const loadingScreen = document.querySelector('.loading-screen');
const navbar = document.querySelector('.navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.querySelector('.nav-menu');
const backToTop = document.getElementById('backToTop');
const navUser = document.getElementById('navUser');
const userProfile = document.getElementById('userProfile');
const userDropdown = document.getElementById('userDropdown');
const logoutBtn = document.getElementById('logoutBtn');
const adminIndicator = document.getElementById('adminIndicator');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userRole = document.getElementById('userRole');

// Global Variables
let isAdmin = false;
let currentUser = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupAnimations();
    checkAuthState();
});

// Initialize Application
function initializeApp() {
    // Hide loading screen after 1 second
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, 1000);

    // Set current year in footer
    document.querySelectorAll('.current-year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Navbar scroll effect
    window.addEventListener('scroll', handleScroll);
    
    // Mobile menu toggle
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-menu') && !e.target.closest('.hamburger')) {
            closeMobileMenu();
        }
    });
    
    // Back to top button
    if (backToTop) {
        backToTop.addEventListener('click', scrollToTop);
    }
    
    // User profile dropdown
    if (userProfile) {
        userProfile.addEventListener('click', toggleUserDropdown);
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-profile')) {
            userDropdown.style.display = 'none';
        }
    });
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Setup Animations
function setupAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // Counter animations for stats
    animateCounters();
    
    // Floating particles for hero section
    createParticles();
}

// Handle Scroll Events
function handleScroll() {
    // Navbar scroll effect
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    // Back to top button visibility
    if (backToTop) {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }
    
    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        hero.style.transform = `translate3d(0px, ${rate}px, 0px)`;
    }
}

// Toggle Mobile Menu
function toggleMobileMenu() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}

// Close Mobile Menu
function closeMobileMenu() {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}

// Scroll to Top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Toggle User Dropdown
function toggleUserDropdown(e) {
    e.stopPropagation();
    const isVisible = userDropdown.style.display === 'block';
    userDropdown.style.display = isVisible ? 'none' : 'block';
}

// Check Authentication State
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            currentUser = user;
            updateUIForUser(user);
            checkAdminStatus(user.uid);
        } else {
            // User is signed out
            currentUser = null;
            updateUIForGuest();
        }
    });
}

// Update UI for Logged-in User
function updateUIForUser(user) {
    // Show user profile in navbar
    if (navUser) {
        navUser.style.display = 'flex';
    }
    
    // Hide login/register buttons
    const loginBtn = document.querySelector('.login-btn');
    const registerBtn = document.querySelector('.register-btn');
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    
    // Update user info
    if (userAvatar) {
        userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=FF6B35&color=fff`;
    }
    if (userName) {
        userName.textContent = user.displayName || user.email.split('@')[0];
    }
    if (userEmail) {
        userEmail.textContent = user.email;
    }
    
    // Update links in navbar
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        if (link.textContent === 'Login' || link.textContent === 'Register') {
            link.style.display = 'none';
        }
    });
}

// Update UI for Guest
function updateUIForGuest() {
    // Hide user profile
    if (navUser) {
        navUser.style.display = 'none';
    }
    
    // Show login/register buttons
    const loginBtn = document.querySelector('.login-btn');
    const registerBtn = document.querySelector('.register-btn');
    if (loginBtn) loginBtn.style.display = 'block';
    if (registerBtn) registerBtn.style.display = 'block';
    
    // Hide admin indicator
    if (adminIndicator) {
        adminIndicator.style.display = 'none';
    }
    
    // Reset links in navbar
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        if (link.textContent === 'Login' || link.textContent === 'Register') {
            link.style.display = 'block';
        }
    });
}

// Check Admin Status
function checkAdminStatus(uid) {
    database.ref('admins/' + uid).once('value')
        .then((snapshot) => {
            isAdmin = snapshot.exists();
            if (isAdmin) {
                showAdminIndicator();
                userRole.textContent = 'Admin';
                userRole.style.background = 'var(--gradient-accent)';
                
                // Redirect to admin page if on admin.html
                if (window.location.pathname.includes('admin.html')) {
                    // Already on admin page
                } else if (window.location.pathname.includes('login.html')) {
                    // Redirect to admin page after login
                    setTimeout(() => {
                        window.location.href = 'admin.html';
                    }, 1000);
                }
            } else {
                userRole.textContent = 'User';
                userRole.style.background = 'var(--gradient-primary)';
            }
        })
        .catch((error) => {
            console.error('Error checking admin status:', error);
        });
}

// Show Admin Indicator
function showAdminIndicator() {
    if (adminIndicator) {
        adminIndicator.style.display = 'flex';
    }
    
    // Add admin controls to events page
    if (window.location.pathname.includes('events.html')) {
        const adminControls = document.getElementById('adminControls');
        if (adminControls) {
            adminControls.style.display = 'block';
        }
    }
}

// Handle Logout
async function handleLogout(e) {
    e.preventDefault();
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showAlert('Error signing out. Please try again.', 'danger');
    }
}

// Show Alert Message
function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add to page
    const alertContainer = document.getElementById('alertContainer') || document.body;
    alertContainer.appendChild(alert);
    
    // Remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Animate Counters
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-count');
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.ceil(current);
                setTimeout(updateCounter, 20);
            } else {
                counter.textContent = target;
            }
        };
        
        // Start animation when element is in viewport
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                updateCounter();
                observer.unobserve(counter);
            }
        });
        
        observer.observe(counter);
    });
}

// Create Floating Particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random properties
        const size = Math.random() * 4 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 20;
        const duration = Math.random() * 10 + 10;
        const color = Math.random() > 0.5 ? '#FF6B35' : '#F7B801';
        
        // Apply styles
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.background = color;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Smooth Scroll to Section
function smoothScrollTo(target) {
    const element = document.querySelector(target);
    if (element) {
        const offset = 80; // Account for navbar height
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// Form Validation
function validateForm(formData, rules) {
    const errors = {};
    
    for (const field in rules) {
        const value = formData[field];
        const fieldRules = rules[field];
        
        if (fieldRules.required && !value.trim()) {
            errors[field] = 'This field is required';
            continue;
        }
        
        if (fieldRules.email && !isValidEmail(value)) {
            errors[field] = 'Please enter a valid email address';
            continue;
        }
        
        if (fieldRules.minLength && value.length < fieldRules.minLength) {
            errors[field] = `Must be at least ${fieldRules.minLength} characters`;
            continue;
        }
        
        if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
            errors[field] = `Must be at most ${fieldRules.maxLength} characters`;
            continue;
        }
        
        if (fieldRules.match && value !== formData[fieldRules.match]) {
            errors[field] = 'Passwords do not match';
        }
    }
    
    return errors;
}

// Email Validation
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Password Strength Check
function checkPasswordStrength(password) {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength++;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength++;
    
    // Contains numbers
    if (/[0-9]/.test(password)) strength++;
    
    // Contains special characters
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format Time
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Debounce Function
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

// Throttle Function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export functions for use in other modules
window.utils = {
    showAlert,
    smoothScrollTo,
    validateForm,
    isValidEmail,
    checkPasswordStrength,
    formatDate,
    formatTime,
    debounce,
    throttle
};