// ============================================================
// SIGN IN / SIGN UP — page-specific behaviour for signin.html
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Tab switching ----------
  const authTabs = document.querySelectorAll('.auth-tab');
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(tab.dataset.panel).classList.add('active');
      clearError();
    });
  });

  // ---------- Shared error banner ----------
  function clearError() {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = ''; el.classList.remove('visible'); }
  }

  function showError(message) {
    const el = document.getElementById('auth-error');
    if (el) {
      el.textContent = message;
      el.classList.add('visible');
    }
  }

  function setLoading(button, loading) {
    if (!button) return;
    button.disabled = loading;
    button.textContent = loading ? 'Please wait…' : button.dataset.label;
  }

  // ---------- Sign in ----------
  const signInForm = document.getElementById('signin-form');
  if (signInForm) {
    const submitBtn = signInForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.dataset.label = submitBtn.textContent;

    signInForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();
      setLoading(submitBtn, true);

      const email = document.getElementById('si-email').value.trim();
      const password = document.getElementById('si-pass').value;

      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          showError((data.error && data.error.message) || 'Could not sign in.');
          return;
        }

        window.location.href = 'profile.html';

      } catch (err) {
        showError('Could not reach the server. Is the backend running?');
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }

  // ---------- Create account ----------
  const signUpForm = document.getElementById('signup-form');
  if (signUpForm) {
    const submitBtn = signUpForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.dataset.label = submitBtn.textContent;

    signUpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();
      setLoading(submitBtn, true);

      const name = document.getElementById('su-name').value.trim();
      const email = document.getElementById('su-email').value.trim();
      const password = document.getElementById('su-pass').value;

      try {
        const res = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          showError((data.error && data.error.message) || 'Could not create your account.');
          return;
        }

        window.location.href = 'profile.html';

      } catch (err) {
        showError('Could not reach the server. Is the backend running?');
      } finally {
        setLoading(submitBtn, false);
      }
    });
  }

  // ---------- Already signed in? Skip straight to the profile ----------
  fetch('/api/v1/users/me', { credentials: 'same-origin' })
    .then(res => (res.ok ? res.json() : null))
    .then(body => {
      if (body && body.data && body.data.user) {
        window.location.href = 'profile.html';
      }
    })
    .catch(() => { /* backend not running — stay on this page */ });

});
