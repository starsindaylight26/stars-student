// ============================================
// STARS — Auth JS
// Handles login + session checking
// ============================================

// ---- LOGIN PAGE ----
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  // Redirect if already logged in
  if (localStorage.getItem('stars_token')) {
    window.location.href = 'dashboard.html';
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('loginBtn');
    const errorEl = document.getElementById('loginError');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    errorEl.innerHTML = '';

    // ✅ VALIDATION — @gordoncollege.edu.ph only
    if (false) {
      errorEl.textContent = 'Use your Gordon College email (@gordoncollege.edu.ph) only.';
      btn.disabled = false;
      btn.textContent = 'Sign In →';
      return;
    }

    try {
      const data = await api.login(email, password);

    if (data.requiresVerification) {
  errorEl.textContent = data.message;
  btn.disabled = false;
  btn.textContent = 'Sign In →';
  return;
}
if (data.success) {
  localStorage.setItem('stars_token', data.token);
  localStorage.setItem('stars_user', JSON.stringify({
    full_name: data.fullName,
    student_id: data.studentId,
    email: data.email,
    program: data.program,
    block: data.block,
    year_level: data.yearLevel
  }));
  window.location.href = 'dashboard.html';
} else {
  errorEl.textContent = data.message || 'Invalid credentials.';
  btn.disabled = false;
  btn.textContent = 'Sign In →';
}
    } catch (err) {
      errorEl.textContent = 'Connection error. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Sign In →';
    }
  });
}
// ---- APP PAGES: Protect + Load User Info ----
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  const token = localStorage.getItem('stars_token');
  const userJson = localStorage.getItem('stars_user');

  if (!token || !userJson) {
    window.location.href = 'index.html';
  } else {
    const user = JSON.parse(userJson);

    const nameEl   = document.getElementById('userName');
    const idEl     = document.getElementById('userStudentId');
    const avatarEl = document.getElementById('userAvatar');

    if (nameEl)   nameEl.textContent   = user.full_name || '—';
    if (idEl)     idEl.textContent     = user.student_id || '—';
    if (avatarEl) avatarEl.textContent = (user.full_name || 'S')[0].toUpperCase();
  }

  logoutBtn.addEventListener('click', () => api.logout());
}
