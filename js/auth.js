// Authentication JavaScript

// DOM Elements
let loginForm, registerForm, forgotPasswordForm;
let loginBtn, registerBtn, googleLoginBtn, googleRegisterBtn;
let loginSpinner, registerSpinner;
let passwordToggle, confirmPasswordToggle;
let alertMessage, alertText;

// Form Validation Rules
const validationRules = {
    email: {
        required: true,
        email: true
    },
    password: {
        required: true,
        minLength: 6
    },
    fullName: {
        required: true,
        minLength: 3,
        maxLength: 50
    },
    confirmPassword: {
        required: true,
        match: 'password'
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    setupAuthEventListeners();
    
    // Check if user is already logged in
    checkExistingAuth();
});

// Initialize Authentication
function initializeAuth() {
    // Get DOM elements
    loginForm = document.getElementById('loginForm');
    registerForm = document.getElementById('registerForm');
    forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    loginBtn = document.getElementById('loginBtn');
    registerBtn = document.getElementById('registerBtn');
    googleLoginBtn = document.getElementById('googleLoginBtn');
    googleRegisterBtn = document.getElementById('googleRegisterBtn');
    
    loginSpinner = document.getElementById('loginSpinner');
    registerSpinner = document.getElementById('registerSpinner');
    
    passwordToggle = document.getElementById('passwordToggle');
    confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    
    alertMessage = document.getElementById('alertMessage');
    alertText = document.getElementById('alertText');
    
    // Setup password strength indicator
    setupPasswordStrengthIndicator();
}

// Setup Event Listeners
function setupAuthEventListeners() {
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Forgot password form submission
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
    
    // Google authentication
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }
    
    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener('click', handleGoogleRegister);
    }
    
    // Password toggle buttons
    if (passwordToggle) {
        passwordToggle.addEventListener('click', togglePasswordVisibility);
    }
    
    if (confirmPasswordToggle) {
        confirmPasswordToggle.addEventListener('click', toggleConfirmPasswordVisibility);
    }
    
    // Real-time form validation
    setupRealTimeValidation();
    
    // Terms modal
    const termsLinks = document.querySelectorAll('.terms-link');
    termsLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showTermsModal();
        });
    });
    
    // Forgot password link
    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForgotPasswordModal();
        });
    }
}

// Check Existing Authentication
function checkExistingAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is already logged in
            if (window.location.pathname.includes('login.html') || 
                window.location.pathname.includes('register.html')) {
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        }
    });
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    // Get form data
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    // Validate form
    const errors = window.utils.validateForm(
        { email, password },
        { email: validationRules.email, password: validationRules.password }
    );
    
    if (Object.keys(errors).length > 0) {
        showFormErrors(errors);
        return;
    }
    
    // Clear previous errors
    clearFormErrors();
    
    // Show loading state
    setLoadingState(loginBtn, loginSpinner, true);
    
    try {
        // Set persistence based on "Remember Me"
        const persistence = rememberMe ? 
            firebase.auth.Auth.Persistence.LOCAL : 
            firebase.auth.Auth.Persistence.SESSION;
        
        await auth.setPersistence(persistence);
        
        // Sign in with email and password
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Check if user is admin
        await checkAndRedirectAdmin(user.uid);
        
        // Show success message
        showAlert('Login successful! Redirecting...', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        // Handle errors
        handleAuthError(error);
    } finally {
        // Reset loading state
        setLoadingState(loginBtn, loginSpinner, false);
    }
}

// Handle Registration
async function handleRegister(e) {
    e.preventDefault();
    
    // Get form data
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsAccepted = document.getElementById('terms')?.checked || false;
    
    // Validate form
    const errors = window.utils.validateForm(
        { fullName, email, password, confirmPassword },
        validationRules
    );
    
    // Check terms acceptance
    if (!termsAccepted) {
        errors.terms = 'You must accept the terms and conditions';
    }
    
    if (Object.keys(errors).length > 0) {
        showFormErrors(errors);
        return;
    }
    
    // Clear previous errors
    clearFormErrors();
    
    // Show loading state
    setLoadingState(registerBtn, registerSpinner, true);
    
    try {
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update user profile
        await user.updateProfile({
            displayName: fullName
        });
        
        // Save user data to database
        await saveUserToDatabase(user.uid, {
            name: fullName,
            email: email,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            role: 'user'
        });
        
        // Send email verification
        await user.sendEmailVerification();
        
        // Show success message
        showAlert('Registration successful! Please check your email for verification.', 'success');
        
        // Auto login after registration
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        // Handle errors
        handleAuthError(error);
    } finally {
        // Reset loading state
        setLoadingState(registerBtn, registerSpinner, false);
    }
}

// Handle Google Authentication
async function handleGoogleLogin() {
    try {
        // Sign in with Google
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        // Check if user exists in database
        const userRef = database.ref('users/' + user.uid);
        const snapshot = await userRef.once('value');
        
        if (!snapshot.exists()) {
            // Save new user to database
            await saveUserToDatabase(user.uid, {
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                role: 'user'
            });
        }
        
        // Check if user is admin
        await checkAndRedirectAdmin(user.uid);
        
        // Show success message
        showAlert('Google login successful!', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        handleAuthError(error);
    }
}

// Handle Google Registration (same as login)
async function handleGoogleRegister() {
    await handleGoogleLogin();
}

// Handle Forgot Password
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    
    // Validate email
    if (!window.utils.isValidEmail(email)) {
        showAlert('Please enter a valid email address', 'danger');
        return;
    }
    
    try {
        // Send password reset email
        await auth.sendPasswordResetEmail(email);
        
        // Show success message
        showAlert('Password reset email sent! Check your inbox.', 'success');
        
        // Close modal
        closeForgotPasswordModal();
        
    } catch (error) {
        handleAuthError(error);
    }
}

// Save User to Database
async function saveUserToDatabase(uid, userData) {
    try {
        await database.ref('users/' + uid).set(userData);
        console.log('User saved to database:', uid);
    } catch (error) {
        console.error('Error saving user to database:', error);
        throw error;
    }
}

// Check and Redirect Admin
async function checkAndRedirectAdmin(uid) {
    try {
        const snapshot = await database.ref('admins/' + uid).once('value');
        if (snapshot.exists()) {
            // User is admin
            if (!window.location.pathname.includes('admin.html')) {
                // Redirect to admin page
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            }
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
}

// Setup Password Strength Indicator
function setupPasswordStrengthIndicator() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = window.utils.checkPasswordStrength(password);
        
        // Update strength bar
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        
        if (strengthFill && strengthText) {
            const width = (strength / 5) * 100;
            strengthFill.style.width = `${width}%`;
            
            // Update color and text based on strength
            if (strength <= 1) {
                strengthFill.style.background = '#E74C3C';
                strengthText.textContent = 'Very Weak';
                strengthText.className = 'strength-text text-danger';
            } else if (strength === 2) {
                strengthFill.style.background = '#E67E22';
                strengthText.textContent = 'Weak';
                strengthText.className = 'strength-text text-warning';
            } else if (strength === 3) {
                strengthFill.style.background = '#F7B801';
                strengthText.textContent = 'Fair';
                strengthText.className = 'strength-text text-accent';
            } else if (strength === 4) {
                strengthFill.style.background = '#3498DB';
                strengthText.textContent = 'Good';
                strengthText.className = 'strength-text text-info';
            } else {
                strengthFill.style.background = '#2ECC71';
                strengthText.textContent = 'Strong';
                strengthText.className = 'strength-text text-success';
            }
        }
        
        // Update requirement indicators
        updateRequirementIndicator('lengthReq', password.length >= 6);
        updateRequirementIndicator('upperReq', /[A-Z]/.test(password));
        updateRequirementIndicator('lowerReq', /[a-z]/.test(password));
        updateRequirementIndicator('numberReq', /[0-9]/.test(password));
    });
}

// Update Requirement Indicator
function updateRequirementIndicator(id, met) {
    const element = document.getElementById(id);
    if (element) {
        const icon = element.querySelector('i');
        if (icon) {
            icon.className = met ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger';
        }
        element.style.color = met ? 'var(--success)' : 'var(--danger)';
    }
}

// Setup Real-time Validation
function setupRealTimeValidation() {
    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            validateEmail(this);
        });
    }
    
    // Password validation
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('blur', function() {
            validatePassword(this);
        });
    }
    
    // Confirm password validation
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('blur', function() {
            validateConfirmPassword(this);
        });
    }
}

// Validate Email in Real-time
function validateEmail(input) {
    const errorElement = document.getElementById('emailError');
    if (!window.utils.isValidEmail(input.value.trim())) {
        showError(input, errorElement, 'Please enter a valid email address');
        return false;
    } else {
        clearError(input, errorElement);
        return true;
    }
}

// Validate Password in Real-time
function validatePassword(input) {
    const errorElement = document.getElementById('passwordError');
    if (input.value.length < 6) {
        showError(input, errorElement, 'Password must be at least 6 characters');
        return false;
    } else {
        clearError(input, errorElement);
        return true;
    }
}

// Validate Confirm Password in Real-time
function validateConfirmPassword(input) {
    const errorElement = document.getElementById('confirmPasswordError');
    const password = document.getElementById('password').value;
    
    if (input.value !== password) {
        showError(input, errorElement, 'Passwords do not match');
        return false;
    } else {
        clearError(input, errorElement);
        return true;
    }
}

// Show Form Errors
function showFormErrors(errors) {
    // Clear previous errors
    clearFormErrors();
    
    // Show new errors
    for (const field in errors) {
        const input = document.getElementById(field);
        const errorElement = document.getElementById(field + 'Error');
        
        if (input && errorElement) {
            showError(input, errorElement, errors[field]);
        } else {
            // Show in alert for fields without specific error elements
            showAlert(errors[field], 'danger');
        }
    }
}

// Clear Form Errors
function clearFormErrors() {
    // Clear all error states
    document.querySelectorAll('.form-control.error').forEach(input => {
        input.classList.remove('error');
    });
    
    document.querySelectorAll('.form-text.error').forEach(errorElement => {
        errorElement.textContent = '';
    });
    
    // Hide alert message
    if (alertMessage) {
        alertMessage.style.display = 'none';
    }
}

// Show Error on Input
function showError(input, errorElement, message) {
    input.classList.add('error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('error');
    }
}

// Clear Error from Input
function clearError(input, errorElement) {
    input.classList.remove('error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('error');
    }
}

// Toggle Password Visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const icon = passwordToggle.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Toggle Confirm Password Visibility
function toggleConfirmPasswordVisibility() {
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const icon = confirmPasswordToggle.querySelector('i');
    
    if (confirmPasswordInput.type === 'password') {
        confirmPasswordInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        confirmPasswordInput.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Set Loading State
function setLoadingState(button, spinner, isLoading) {
    if (isLoading) {
        button.disabled = true;
        if (spinner) {
            spinner.style.display = 'inline-block';
        }
        button.querySelector('span').style.opacity = '0.7';
    } else {
        button.disabled = false;
        if (spinner) {
            spinner.style.display = 'none';
        }
        button.querySelector('span').style.opacity = '1';
    }
}

// Show Alert
function showAlert(message, type = 'info') {
    if (alertMessage && alertText) {
        alertText.textContent = message;
        alertMessage.className = `alert alert-${type}`;
        alertMessage.style.display = 'flex';
        
        // Hide after 5 seconds
        setTimeout(() => {
            alertMessage.style.display = 'none';
        }, 5000);
    } else {
        // Fallback to global alert
        window.utils.showAlert(message, type);
    }
}

// Handle Authentication Errors
function handleAuthError(error) {
    console.error('Authentication error:', error);
    
    let errorMessage = 'An error occurred. Please try again.';
    
    switch (error.code) {
        case 'auth/invalid-email':
            errorMessage = 'Invalid email address.';
            break;
        case 'auth/user-disabled':
            errorMessage = 'This account has been disabled.';
            break;
        case 'auth/user-not-found':
            errorMessage = 'No account found with this email.';
            break;
        case 'auth/wrong-password':
            errorMessage = 'Incorrect password.';
            break;
        case 'auth/email-already-in-use':
            errorMessage = 'Email already in use.';
            break;
        case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please use at least 6 characters.';
            break;
        case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled.';
            break;
        case 'auth/too-many-requests':
            errorMessage = 'Too many attempts. Please try again later.';
            break;
        case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection.';
            break;
        case 'auth/popup-closed-by-user':
            errorMessage = 'Google sign-in was cancelled.';
            break;
        case 'auth/cancelled-popup-request':
            errorMessage = 'Google sign-in was cancelled.';
            break;
    }
    
    showAlert(errorMessage, 'danger');
}

// Show Forgot Password Modal
function showForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.add('active');
        
        // Focus on email input
        const emailInput = document.getElementById('resetEmail');
        if (emailInput) {
            setTimeout(() => emailInput.focus(), 300);
        }
        
        // Setup modal close
        const closeBtn = document.getElementById('forgotPasswordClose');
        const cancelBtn = document.getElementById('cancelResetBtn');
        
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('active');
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => modal.classList.remove('active');
        }
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

// Close Forgot Password Modal
function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Show Terms Modal
function showTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.classList.add('active');
        
        // Setup modal close
        const closeBtn = document.getElementById('termsModalClose');
        const acceptBtn = document.getElementById('acceptTermsBtn');
        
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('active');
        }
        
        if (acceptBtn) {
            acceptBtn.onclick = () => {
                modal.classList.remove('active');
                const termsCheckbox = document.getElementById('terms');
                if (termsCheckbox) {
                    termsCheckbox.checked = true;
                }
            };
        }
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}