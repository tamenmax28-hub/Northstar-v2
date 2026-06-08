let users = [];
let currentUser = null;
let verificationState = null;
let resendCountdown = 0;

const RateLimiter = {
    signupAttempts: {}, verificationAttempts: {},
    checkSignupLimit(e) { if(!this.signupAttempts[e]) this.signupAttempts[e]=[]; this.signupAttempts[e]=this.signupAttempts[e].filter(t=>Date.now()-t<3600000); return this.signupAttempts[e].length<5; },
    recordSignupAttempt(e) { if(!this.signupAttempts[e]) this.signupAttempts[e]=[]; this.signupAttempts[e].push(Date.now()); },
    checkVerificationLimit(e) { if(!this.verificationAttempts[e]) this.verificationAttempts[e]=[]; this.verificationAttempts[e]=this.verificationAttempts[e].filter(t=>Date.now()-t<3600000); return this.verificationAttempts[e].length<10; },
    recordVerificationAttempt(e) { if(!this.verificationAttempts[e]) this.verificationAttempts[e]=[]; this.verificationAttempts[e].push(Date.now()); }
};

const Validators = {
    isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); },
    isValidPassword(p) { return p.length>=8 && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^a-zA-Z0-9]/.test(p); },
    isDisposableEmail(e) { return ['tempmail.com','guerrillamail.com','10minutemail.com'].includes(e.split('@')[1]?.toLowerCase()); }
};

async function hashPassword(p) { return p; }
async function comparePasswords(p, h) { return p === h; }

function generateVerificationCode() { return Math.floor(100000+Math.random()*900000).toString(); }

document.addEventListener('DOMContentLoaded', () => { setupGoogleSignIn(); });

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el=>el.classList.remove('active'));
    document.getElementById(tab+'Tab').classList.add('active');
    event.target.classList.add('active');
}

function switchAuthMethod(method) {
    document.querySelectorAll('.auth-method').forEach(el=>el.classList.remove('active'));
    document.querySelectorAll('.method-btn').forEach(el=>el.classList.remove('active'));
    document.getElementById(method+'Method').classList.add('active');
    event.target.closest('.method-btn').classList.add('active');
}

function togglePassword(fieldId) {
    const field=document.getElementById(fieldId);
    field.type=field.type==='password'?'text':'password';
    event.target.textContent=field.type==='password'?'👁':'👁‍🗨';
}

document.addEventListener('input',(e)=>{
    if(e.target.id==='signupPassword') updatePasswordStrength(e.target.value,'passwordStrength');
    if(e.target.id==='signupPhonePassword') updatePasswordStrength(e.target.value,'phonePasswordStrength');
});

function updatePasswordStrength(password,elementId) {
    const el=document.getElementById(elementId);
    if(password.length<8){el.textContent='';return;}
    let s=0;
    if(/[a-z]/.test(password))s++;if(/[A-Z]/.test(password))s++;if(/[0-9]/.test(password))s++;if(/[^a-zA-Z0-9]/.test(password))s++;
    el.className=s<=1?'password-strength weak':s<=2?'password-strength medium':'password-strength strong';
    el.textContent='';
}

async function handleSignup(e) {
    e.preventDefault();
    const isEmail=document.getElementById('emailMethod').classList.contains('active');
    let name,email,password,passwordConfirm,phone,countryCode;
    if(isEmail){
        name=document.getElementById('signupName').value;
        email=document.getElementById('signupEmail').value;
        password=document.getElementById('signupPassword').value;
        passwordConfirm=document.getElementById('signupPasswordConfirm').value;
    } else {
        name=document.getElementById('signupPhoneName').value;
        phone=document.getElementById('signupPhone').value;
        countryCode=document.getElementById('countryCode').value;
        password=document.getElementById('signupPhonePassword').value;
        passwordConfirm=password;
    }
    if(!name||name.length<2){showError('Please enter a valid name');return;}
    if(isEmail){
        if(!Validators.isValidEmail(email)){showError('Please enter a valid email');return;}
        if(Validators.isDisposableEmail(email)){showError('Please use a permanent email');return;}
        if(users.some(u=>u.email===email)){showError('Email already registered');return;}
        if(!RateLimiter.checkSignupLimit(email)){showError('Too many attempts');return;}
    } else {
        const fullPhone=countryCode+phone.replace(/\D/g,'');
        if(users.some(u=>u.phoneNumber===fullPhone)){showError('Phone already registered');return;}
        email=null; phone=fullPhone;
    }
    if(password.length<8){showError('Password must be at least 8 characters');return;}
    if(!Validators.isValidPassword(password)){showError('Password must contain uppercase, number, and special character');return;}
    if(password!==passwordConfirm){showError('Passwords do not match');return;}
    const hashedPassword=await hashPassword(password);
    const newUser={id:Date.now().toString(),name,email:email||null,emailVerified:false,phoneNumber:phone||null,phoneVerified:false,password:hashedPassword,verificationCode:generateVerificationCode(),verificationCodeExpiry:new Date(Date.now()+10*60000).toISOString()};
    verificationState=newUser;
    RateLimiter.recordSignupAttempt(email||phone);
    showVerificationModal(email?'Email':'Phone',email||phone);
}

async function handleLogin(e) {
    e.preventDefault();
    const loginEmail=document.getElementById('loginEmail').value;
    const loginPassword=document.getElementById('loginPassword').value;
    const user=users.find(u=>u.email===loginEmail||u.phoneNumber===loginEmail);
    if(!user){showError('Invalid email or phone number');return;}
    const match=await comparePasswords(loginPassword,user.password);
    if(!match){showError('Invalid password');return;}
    if(!user.emailVerified&&!user.phoneVerified){showError('Please verify first');verificationState=user;showVerificationModal(user.email?'Email':'Phone',user.email||user.phoneNumber);return;}
    currentUser=user;
    showSuccessModal('Welcome back!');
}

async function handleVerification(e) {
    e.preventDefault();
    const code=document.getElementById('verificationCode').value;
    if(!verificationState){showError('Verification state not found');return;}
    if(!RateLimiter.checkVerificationLimit(verificationState.email||verificationState.phoneNumber)){showError('Too many attempts');return;}
    if(code!==verificationState.verificationCode){showError('Invalid verification code');RateLimiter.recordVerificationAttempt(verificationState.email||verificationState.phoneNumber);return;}
    if(verificationState.email) verificationState.emailVerified=true;
    else verificationState.phoneVerified=true;
    users.push(verificationState);
    currentUser=verificationState;
    showSuccessModal('Account verified successfully!');
}

function resendVerification() {
    if(resendCountdown>0)return;
    if(!verificationState){showError('Verification state not found');return;}
    verificationState.verificationCode=generateVerificationCode();
    resendCountdown=60;
    const btn=document.getElementById('resendBtn');
    btn.disabled=true;
    const interval=setInterval(()=>{resendCountdown--;document.getElementById('resendTimer').textContent=`Resend in ${resendCountdown}s`;if(resendCountdown<=0){clearInterval(interval);btn.disabled=false;document.getElementById('resendTimer').textContent='';}},1000);
    showSuccess('Verification code sent again');
}

function showVerificationModal(type,destination) {
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('verificationModal').classList.remove('hidden');
    document.getElementById('verifyType').textContent=type;
    document.getElementById('verifyMessage').textContent=`We sent a verification code to ${destination}`;
    document.getElementById('verificationLabel').textContent='Enter the 6-digit code we sent to your '+type.toLowerCase();
    document.getElementById('verificationInfo').textContent=`Enter the 6-digit code sent to ${destination}`;
    console.log('Verification Code:',verificationState.verificationCode);
    showSuccess(`Demo Mode: Your verification code is ${verificationState.verificationCode}`);
}

function showSuccessModal(message) {
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('verificationModal').classList.add('hidden');
    document.getElementById('successModal').classList.remove('hidden');
    document.getElementById('successMessage').textContent=message;
    setTimeout(()=>{ enterApp(); },2000);
}

function enterApp() { window.location.href='../app/index.html'; }

function showError(message) {
    const el=document.getElementById('errorAlert');
    el.textContent=message;el.style.background='#ef4444';el.classList.add('show');
    setTimeout(()=>el.classList.remove('show'),4000);
}

function showSuccess(message) {
    const el=document.getElementById('errorAlert');
    el.textContent=message;el.style.background='#10b981';el.classList.add('show');
    setTimeout(()=>{el.classList.remove('show');el.style.background='#ef4444';},4000);
}

function showComingSoon(provider) { showError(`${provider} Sign-In Coming Soon`); }

function setupGoogleSignIn() {
    const g=document.getElementById('googleSignupBtn');
    const l=document.getElementById('googleLoginBtn');
    if(g) g.addEventListener('click',()=>showError('Google Sign-In requires server-side integration'));
    if(l) l.addEventListener('click',()=>showError('Google Sign-In requires server-side integration'));
}

function logout() { currentUser=null; window.location.href='../auth/index.html'; }