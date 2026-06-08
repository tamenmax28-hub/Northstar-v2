// Authentication System
// Note: This is a client-side implementation. For production, integrate with a backend service.

// User Database (in-memory, no localStorage)
let users = [];
let currentUser = null;
let verificationState = null;
let resendCountdown = 0;

// Security: Rate limiting for verification attempts
const RateLimiter = {
    signupAttempts: {},
    verificationAttempts: {},

    checkSignupLimit(email) {
        const now = Date.now();
        if (!this.signupAttempts[email]) this.signupAttempts[email] = [];
        this.signupAttempts[email] = this.signupAttempts[email].filter(t => now - t < 3600000);
        return this.signupAttempts[email].length < 5;
    },

    recordSignupAttempt(email) {
        if (!this.signupAttempts[email]) this.signupAttempts[email] = [];
        this.signupAttempts[email].push(Date.now());
    },

    checkVerificationLimit(email) {
        const now = Date.now();
        if (!this.verificationAttempts[email]) this.verificationAttempts[email] = [];
        this.verificationAttempts[email] = this.verificationAttempts[email].filter(t => now - t < 3600000);
        return this.verificationAttempts[email].length < 10;
    },

    recordVerificationAttempt(email) {
        if (!this.verificationAttempts[email]) this.verificationAttempts[email] = [];
        this.verificationAttempts[email].push(Date.now());
    }
};

// Validation
const Validators = {
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    isValidPhoneNumber(phone, countryCode) {
        const fullPhone = countryCode + phone.replace(/\D/g, '');
        return /^\+?[1-9]\d{1,14}$/.test(fullPhone);
    },

    isValidPassword(password) {
        return password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[^a-zA-Z0-9]/.test(password);
    },

    isDisposableEmail(email) {
        const disposableDomains = ['tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email', 'yopmail.com'];
        const domain = email.split('@')[1]?.toLowerCase();
        return disposableDomains.includes(domain);
    }
};

// Password Hashing
async function hashPassword(password) {
    const salt = await bcryptjs.genSalt(10);
    return await bcryptjs.hash(password, salt);
}

async function comparePasswords(password, hash) {
    return await bcryptjs.compare(password, hash);
}

// Verification Code Generation
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupGoogleSignIn();
});

// Tab Switching
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

// Auth Method Switching
function switchAuthMethod(method) {
    document.querySelectorAll('.auth-method').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.method-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(method + 'Method').classList.add('active');
    event.target.closest('.method-btn').classList.add('active');
}

// Toggle Password Visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    field.type = field.type === 'password' ? 'text' : 'password';
    event.target.textContent = field.type === 'password' ? '👁' : '👁‍🗨';
}

// Password Strength Indicator
document.addEventListener('input', (e) => {
    if (e.target.id === 'signupPassword') updatePasswordStrength(e.target.value, 'passwordStrength');
    if (e.target.id === 'signupPhonePassword') updatePasswordStrength(e.target.value, 'phonePasswordStrength');
});

function updatePasswordStrength(password, elementId) {
    const element = document.getElementById(elementId);
    if (password.length < 8) { element.textContent = ''; return; }
    let strength = 0;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    if (strength <= 1) element.className = 'password-strength weak';
    else if (strength <= 2) element.className = 'password-strength medium';
    else element.className = 'password-strength strong';
    element.textContent = '';
}

// Handle Signup
async function handleSignup(e) {
    e.preventDefault();

    const isEmailMethod = document.getElementById('emailMethod').classList.contains('active');
    let name, email, password, passwordConfirm, phone, countryCode;

    if (isEmailMethod) {
        name = document.getElementById('signupName').value;
        email = document.getElementById('signupEmail').value;
        password = document.getElementById('signupPassword').value;
        passwordConfirm = document.getElementById('signupPasswordConfirm').value;
    } else {
        name = document.getElementById('signupPhoneName').value;
        phone = document.getElementById('signupPhone').value;
        countryCode = document.getElementById('countryCode').value;
        password = document.getElementById('signupPhonePassword').value;
        passwordConfirm = password;
    }

    if (!name || name.length < 2) { showError('Please enter a valid name'); return; }

    if (isEmailMethod) {
        if (!Validators.isValidEmail(email)) { showError('Please enter a valid email address'); return; }
        if (Validators.isDisposableEmail(email)) { showError('Please use a permanent email address'); return; }
        if (users.some(u => u.email === email)) { showError('Email already registered'); return; }
        if (!RateLimiter.checkSignupLimit(email)) { showError('Too many signup attempts. Please try again later.'); return; }
    } else {
        const fullPhone = countryCode + phone.replace(/\D/g, '');
        if (!Validators.isValidPhoneNumber(phone, countryCode)) { showError('Please enter a valid phone number'); return; }
        if (users.some(u => u.phoneNumber === fullPhone)) { showError('Phone number already registered'); return; }
        if (!RateLimiter.checkSignupLimit(fullPhone)) { showError('Too many signup attempts. Please try again later.'); return; }
        email = null;
        phone = fullPhone;
    }

    if (password.length < 8) { showError('Password must be at least 8 characters'); return; }
    if (!Validators.isValidPassword(password)) { showError('Password must contain uppercase, number, and special character'); return; }
    if (password !== passwordConfirm) { showError('Passwords do not match'); return; }

    const hashedPassword = await hashPassword(password);
    const newUser = {
        id: Date.now().toString(),
        name,
        email: email || null,
        emailVerified: false,
        phoneNumber: phone || null,
        phoneVerified: false,
        password: hashedPassword,
        authProvider: 'email',
        createdAt: new Date().toISOString(),
        verificationCode: generateVerificationCode(),
        verificationCodeExpiry: new Date(Date.now() + 10 * 60000).toISOString()
    };

    verificationState = newUser;
    RateLimiter.recordSignupAttempt(email || phone);
    showVerificationModal(email ? 'Email' : 'Phone', email || phone);
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();

    const loginEmail = document.getElementById('loginEmail').value;
    const loginPassword = document.getElementById('loginPassword').value;

    const user = users.find(u => u.email === loginEmail || u.phoneNumber === loginEmail);
    if (!user) { showError('Invalid email or phone number'); return; }

    const passwordMatch = await comparePasswords(loginPassword, user.password);
    if (!passwordMatch) { showError('Invalid password'); return; }

    if (!user.emailVerified && !user.phoneVerified) {
        showError('Please verify your email or phone first');
        verificationState = user;
        showVerificationModal(user.email ? 'Email' : 'Phone', user.email || user.phoneNumber);
        return;
    }

    currentUser = user;
    showSuccessModal('Welcome back!');
}

// Handle Verification
async function handleVerification(e) {
    e.preventDefault();

    const code = document.getElementById('verificationCode').value;

    if (!verificationState) { showError('Verification state not found'); return; }

    if (!RateLimiter.checkVerificationLimit(verificationState.email || verificationState.phoneNumber)) {
        showError('Too many verification attempts. Please try again later.');
        return;
    }

    if (code !== verificationState.verificationCode) {
        showError('Invalid verification code');
        RateLimiter.recordVerificationAttempt(verificationState.email || verificationState.phoneNumber);
        return;
    }

    if (verificationState.email) verificationState.emailVerified = true;
    else verificationState.phoneVerified = true;

    users.push(verificationState);
    currentUser = verificationState;

    showSuccessModal('Account verified successfully!');
}

// Resend Verification
function resendVerification() {
    if (resendCountdown > 0) return;
    if (!verificationState) { showError('Verification state not found'); return; }

    verificationState.verificationCode = generateVerificationCode();
    verificationState.verificationCodeExpiry = new Date(Date.now() + 10 * 60000).toISOString();

    resendCountdown = 60;
    const resendBtn = document.getElementById('resendBtn');
    resendBtn.disabled = true;

    const interval = setInterval(() => {
        resendCountdown--;
        document.getElementById('resendTimer').textContent = `Resend in ${resendCountdown}s`;
        if (resendCountdown <= 0) {
            clearInterval(interval);
            resendBtn.disabled = false;
            document.getElementById('resendTimer').textContent = '';
        }
    }, 1000);

    showSuccess('Verification code sent again');
}

// Show Verification Modal
function showVerificationModal(type, destination) {
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('verificationModal').classList.remove('hidden');
    document.getElementById('verifyType').textContent = type;
    document.getElementById('verifyMessage').textContent = `We sent a verification code to ${destination}`;
    document.getElementById('verificationLabel').textContent = 'Enter the 6-digit code we sent to your ' + type.toLowerCase();
    document.getElementById('verificationInfo').textContent = `Enter the 6-digit code sent to ${destination}`;
    console.log('Verification Code:', verificationState.verificationCode);
    showSuccess(`Demo Mode: Your verification code is ${verificationState.verificationCode}`);
}

// Show Success Modal
function showSuccessModal(message) {
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('verificationModal').classList.add('hidden');
    document.getElementById('successModal').classList.remove('hidden');
    document.getElementById('successMessage').textContent = message;
    setTimeout(() => {
        enterApp();
    }, 2000);
}

// Enter App / Redirect
function enterApp() {
    window.location.href = '../app/index.html';
}

// Show Errors
function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    errorAlert.textContent = message;
    errorAlert.style.background = '#ef4444';
    errorAlert.classList.add('show');
    setTimeout(() => errorAlert.classList.remove('show'), 4000);
}

function showSuccess(message) {
    const errorAlert = document.getElementById('errorAlert');
    errorAlert.textContent = message;
    errorAlert.style.background = '#10b981';
    errorAlert.classList.add('show');
    setTimeout(() => {
        errorAlert.classList.remove('show');
        errorAlert.style.background = '#ef4444';
    }, 4000);
}

// Coming Soon
function showComingSoon(provider) {
    showError(`${provider} Sign-In Coming Soon - Use Email or Phone for now`);
}

// Google Sign-In
function setupGoogleSignIn() {
    const googleSignupBtn = document.getElementById('googleSignupBtn');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleSignupBtn) googleSignupBtn.addEventListener('click', () => showError('Google Sign-In requires server-side integration'));
    if (googleLoginBtn) googleLoginBtn.addEventListener('click', () => showError('Google Sign-In requires server-side integration'));
}

function handleGoogleSignIn(response) {
    showError('Server integration required for Google Sign-In');
}

// Logout
function logout() {
    currentUser = null;
    window.location.href = '../auth/index.html';
}
