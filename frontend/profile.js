// ============================================================
// PROFILE — page-specific behaviour for profile.html
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  const loadingEl = document.getElementById('profile-loading');
  const contentEl = document.getElementById('profile-content');

  function showBanner(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.classList.add('visible');
  }

  function hideBanners(...ids) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('visible');
    });
  }

  function renderUser(user) {
    document.getElementById('profile-avatar').textContent = (user.name || user.email || '?').trim().charAt(0).toUpperCase();
    document.getElementById('profile-display-name').textContent = user.name;
    document.getElementById('profile-display-email').textContent = user.email;
    document.getElementById('pd-name').value = user.name;
    document.getElementById('pd-email').value = user.email;

    const navName = document.getElementById('nav-user-name');
    if (navName) navName.textContent = user.name.split(' ')[0] || 'Account';
  }

  // ---------- Load current profile ----------
  fetch('/api/profile', { credentials: 'same-origin' })
    .then(res => {
      if (res.status === 401) {
        window.location.href = 'signin.html';
        return null;
      }
      return res.json();
    })
    .then(data => {
      if (!data) return;
      renderUser(data.user);
      loadingEl.style.display = 'none';
      contentEl.style.display = 'block';
    })
    .catch(() => {
      loadingEl.textContent = 'Could not reach the server. Is the backend running?';
    });

  // ---------- Update name / email ----------
  const detailsForm = document.getElementById('details-form');
  detailsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideBanners('details-error', 'details-success');

    const name = document.getElementById('pd-name').value.trim();
    const email = document.getElementById('pd-email').value.trim();

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, email })
      });
      const data = await res.json();

      if (!res.ok) {
        showBanner('details-error', data.error || 'Could not update your profile.');
        return;
      }

      renderUser(data.user);
      showBanner('details-success', 'Profile updated.');

    } catch (err) {
      showBanner('details-error', 'Could not reach the server.');
    }
  });

  // ---------- Change password ----------
  const passwordForm = document.getElementById('password-form');
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideBanners('password-error', 'password-success');

    const currentPassword = document.getElementById('pw-current').value;
    const newPassword = document.getElementById('pw-new').value;
    const confirmPassword = document.getElementById('pw-confirm').value;

    if (newPassword !== confirmPassword) {
      showBanner('password-error', 'New passwords do not match.');
      return;
    }

    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        showBanner('password-error', data.error || 'Could not update your password.');
        return;
      }

      passwordForm.reset();
      showBanner('password-success', 'Password updated.');

    } catch (err) {
      showBanner('password-error', 'Could not reach the server.');
    }
  });

  // ---------- Sign out ----------
  const signOutBtn = document.getElementById('signout-btn');
  signOutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (err) {
      // ignore — redirect regardless
    }
    window.location.href = 'signin.html';
  });

  // ---------- Delete account ----------
  const deleteBtn = document.getElementById('delete-account-btn');
  deleteBtn.addEventListener('click', async () => {
    const confirmed = window.confirm('Delete your account? This cannot be undone.');
    if (!confirmed) return;

    try {
      const res = await fetch('/api/profile', { method: 'DELETE', credentials: 'same-origin' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Could not delete your account.');
        return;
      }
      window.location.href = 'signin.html';
    } catch (err) {
      alert('Could not reach the server.');
    }
  });

});
