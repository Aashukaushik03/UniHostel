// ========================
// UniHostel - Main App JS
// ========================

const API = 'http://localhost:5000/api';
// ── Register Service Worker (PWA) ─────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ UniHostel PWA: Service Worker registered', reg.scope))
      .catch(err => console.log('❌ SW registration failed:', err));
  });
}

// ========================
// TOAST NOTIFICATIONS
// ========================
function showToast(message, type = 'success', duration = 3500) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}
let currentUser = null;
let currentReviewId = null;
let currentFilter = 'all';

// ========================
// INIT
// ========================
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);

  const token = localStorage.getItem('hostelToken');
  const user = localStorage.getItem('hostelUser');
  if (token && user) {
    currentUser = JSON.parse(user);
    showApp();
  }
  setMinDates();

  setupDragDrop();
});

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const el = document.getElementById('timeDisplay');
  if (el) el.textContent = `${dateStr} | ${timeStr}`;
}

function setMinDates() {
  // ========================
// WEEKEND CHECK (Hide Proof Upload)
// ========================
function setupWeekendCheck() {

  const outDateInput = document.getElementById('noOutDate');
  const proofSection = document.getElementById('proofSection');

  if (!outDateInput || !proofSection) return;

  outDateInput.addEventListener('change', function () {

    const date = new Date(this.value);
    const day = date.getDay();

    // Sunday = 0 , Saturday = 6
    if (day === 0 || day === 6) {

      proofSection.style.display = "none";

    } else {

      proofSection.style.display = "block";

    }

  });

}
}

// ========================
// AUTH
// ========================
function switchTab(tab, el) {

  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.classList.remove('active');
  });

  document.getElementById('studentLoginForm').classList.add('hidden');
  document.getElementById('adminLoginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.add('hidden');

  if(tab === "studentLogin"){
    document.getElementById('studentLoginForm').classList.remove('hidden');
  }

  if(tab === "adminLogin"){
    document.getElementById('adminLoginForm').classList.remove('hidden');
  }

  if(tab === "register"){
    document.getElementById('registerForm').classList.remove('hidden');
  }

  el.classList.add('active');
}
  // hideAuthError();


function showAuthError(msg) {
  const el = document.getElementById('authError');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideAuthError() {
  document.getElementById('authError').classList.add('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) return showAuthError(data.message);
    localStorage.setItem('hostelToken', data.token);
    localStorage.setItem('hostelUser', JSON.stringify(data.student));
    currentUser = data.student;
    showApp();
  } 
  catch (err) {
    showAuthError('Login Failed.');
  }
}
async function handleAdminLogin(e) {
  e.preventDefault();

  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.success) {
      return showAuthError(data.message);
    }

    localStorage.setItem('hostelToken', data.token);
    localStorage.setItem('hostelUser', JSON.stringify(data.student));

    currentUser = data.student;

    showApp();

  //   if (currentUser.role === "admin") {

  //     // show admin menu
  //     document.getElementById("adminNav").classList.remove("hidden");

  //     // hide student menu
  //     document.querySelector('[data-page="dashboard"]').style.display = "none";
  //     document.querySelector('[data-page="nightout"]').style.display = "none";
  //     document.querySelector('[data-page="myRequests"]').style.display = "none";
  //     document.querySelector('[data-page="profile"]').style.display = "none";

  //     // ⭐ hide ALL pages first
  //     document.querySelectorAll(".page").forEach(p => {
  //       p.classList.remove("active");
  //     });

  //     // ⭐ show only admin dashboard
  //     document.getElementById("page-adminDashboard").classList.add("active");

  //   }
 }
  catch (err) {
    console.error(err);
    showAuthError('Admin Login Failed.');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('regName').value,
    email: document.getElementById('regEmail').value,
    password: document.getElementById('regPassword').value,
    phone: document.getElementById('regPhone').value,
    rollNumber: document.getElementById('regRoll').value,
    roomNumber: document.getElementById('regRoom').value,
    course: document.getElementById('regCourse').value,
    year: document.getElementById('regYear').value,
    parentName: document.getElementById('regParentName').value,
    parentPhone: document.getElementById('regParentPhone').value,
  };
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) return showAuthError(data.message);
    localStorage.setItem('hostelToken', data.token);
    localStorage.setItem('hostelUser', JSON.stringify(data.student));
    currentUser = data.student;
    showApp();
  } catch (err) {
    showAuthError('Connection failed. Make sure the server is running on port 5000.');
  }
}

function handleLogout() {
  localStorage.removeItem('hostelToken');
  localStorage.removeItem('hostelUser');
  currentUser = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('authModal').classList.add('active');
  document.getElementById('authModal').classList.remove('hidden');
}

function getToken() {
  return localStorage.getItem('hostelToken');
}

async function authFetch(url, options = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
}

// ========================
// APP SHELL
// ========================
function showApp() {
  document.getElementById('authModal').classList.remove('active');
  document.getElementById('authModal').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'warden';

  if (isAdmin) {
    // Show admin nav, hide ALL student-only items
    document.getElementById('adminNav').classList.remove('hidden');
    document.querySelectorAll('.student-only').forEach(el => el.style.display = 'none');
  } else {
    // Hide admin nav, show ALL student-only items
    document.getElementById('adminNav').classList.add('hidden');
    document.querySelectorAll('.student-only').forEach(el => el.style.display = '');
  }

  document.getElementById('sidebarUser').innerHTML = `
    <strong style="color:white;display:block">${currentUser.name}</strong>
    <span>${currentUser.role} • Room ${currentUser.roomNumber || 'ADMIN'}</span>
  `;
  document.getElementById('topbarUser').textContent = currentUser.name;

  if (isAdmin) {
    showPage('adminDashboard');
  } else {
    showPage('dashboard');
  }
}
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  const titles = {
    dashboard: 'Dashboard',
    nightout: 'Night Out Application',
    myRequests: 'My Requests',
    notices: 'Notices',
    profile: 'My Profile',
    adminDashboard: 'Admin Overview',
    adminRequests: 'All Requests',
    adminStudents: 'Students',
    postNotice: 'Post Notice',
    complaints: 'Complaints & Maintenance',
    adminComplaints: 'Manage Complaints',
    roomAllocation:   'Room Allocation'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  const loaders = {
    dashboard: loadDashboard,
    myRequests: loadMyRequests,
    notices: loadNotices,
    profile: loadProfile,
    adminDashboard: loadAdminDashboard,
    adminRequests: () => loadAllRequests('all'),
    adminStudents: loadStudents,
    complaints: loadMyComplaints,
    adminComplaints: () => loadAdminComplaints('all'),
    roomAllocation:   loadRoomAllocation
  };
  if (loaders[page]) loaders[page]();

  if (window.innerWidth < 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ========================
// DASHBOARD
// ========================
async function loadDashboard() {
  document.getElementById('welcomeMsg').textContent = `Welcome back, ${currentUser.name}! 👋`;

  // ── Night-out stats ───────────────────────────────────────
  try {
    const res  = await authFetch(`${API}/nightout/my-requests`);
    const data = await res.json();
    if (data.success) {
      const reqs     = data.requests;
      const pending  = reqs.filter(r => r.status === 'pending').length;
      const approved = reqs.filter(r => ['approved','out','returned'].includes(r.status)).length;
      const rejected = reqs.filter(r => r.status === 'rejected').length;
      document.getElementById('statTotal').textContent    = reqs.length;
      document.getElementById('statPending').textContent  = pending;
      document.getElementById('statApproved').textContent = approved;
      document.getElementById('statRejected').textContent = rejected;
      renderDashboardRequests(reqs.slice(0, 5));

      // ── Upcoming approved night-out ───────────────────────
      const upcoming = reqs.find(r => r.status === 'approved');
      const nightoutEl = document.getElementById('dashNightout');
      if (upcoming) {
        nightoutEl.innerHTML = `
          <div style="font-size:13px">
            <div style="font-weight:600;margin-bottom:4px">📍 ${upcoming.destination}</div>
            <div style="color:var(--text-muted);font-size:12px">
              Out: ${formatDate(upcoming.outDate)} ${upcoming.outTime}<br>
              Return: ${formatDate(upcoming.returnDate)} ${upcoming.returnTime}
            </div>
            <div style="margin-top:8px">
              <span class="status-badge approved">APPROVED ✅</span>
            </div>
          </div>`;
      } else {
        nightoutEl.innerHTML = '<p style="font-size:12px;color:var(--text-muted)">No upcoming approved night-out.</p>';
      }
    }
  } catch (err) {
    document.getElementById('dashboardRequests').innerHTML =
      `<p class="empty-state">Could not load data. Is the server running?</p>`;
  }

  // ── Today's mess menu ─────────────────────────────────────
  try {
    const res  = await authFetch(`${API}/mess/menu`);
    const data = await res.json();
    const el   = document.getElementById('dashTodayMenu');
    if (data.menu) {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const menu  = data.menu[today] || {};
      const meals = [
        { key: 'breakfast', label: '🌅 B/fast' },
        { key: 'lunch',     label: '☀️ Lunch'  },
        { key: 'snacks',    label: '🫖 Snacks' },
        { key: 'dinner',    label: '🌙 Dinner' }
      ];
      el.innerHTML = meals.map(m => `
        <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px">
          <span style="color:var(--text-muted);font-weight:600">${m.label}</span>
          <span style="text-align:right;max-width:60%">${menu[m.key] || '—'}</span>
        </div>`).join('');
    } else {
      el.innerHTML = '<p style="font-size:12px;color:var(--text-muted)">No menu set for today.</p>';
    }
  } catch (err) {
    document.getElementById('dashTodayMenu').innerHTML =
      '<p style="font-size:12px;color:var(--text-muted)">Could not load menu.</p>';
  }

  // ── Active complaints ─────────────────────────────────────
  try {
    const res  = await authFetch(`${API}/complaints/my`);
    const data = await res.json();
    const el   = document.getElementById('dashComplaints');
    if (data.success && data.complaints.length) {
      const active = data.complaints.filter(c => c.status !== 'resolved' && c.status !== 'closed');
      if (active.length) {
        el.innerHTML = active.slice(0, 2).map(c => `
          <div style="padding:6px 0;border-bottom:1px solid var(--border)">
            <div style="font-size:13px;font-weight:600">${c.title}</div>
            <div style="display:flex;justify-content:space-between;margin-top:3px">
              <span style="font-size:11px;color:var(--text-muted)">${c.category}</span>
              <span class="complaint-badge badge-status-${c.status}" style="font-size:10px;padding:2px 7px">
                ${c.status.replace('_',' ').toUpperCase()}
              </span>
            </div>
          </div>`).join('') +
          (active.length > 2
            ? `<p style="font-size:12px;color:var(--text-muted);margin-top:6px">+${active.length - 2} more</p>`
            : '');
      } else {
        el.innerHTML = '<p style="font-size:12px;color:#16a34a">✅ No active complaints!</p>';
      }
    } else {
      el.innerHTML = '<p style="font-size:12px;color:var(--text-muted)">No complaints yet.</p>';
    }
  } catch (err) {
    document.getElementById('dashComplaints').innerHTML =
      '<p style="font-size:12px;color:var(--text-muted)">Could not load.</p>';
  }
}

function renderDashboardRequests(requests) {
  const el = document.getElementById('dashboardRequests');
  if (!requests.length) {
    el.innerHTML = `<p class="empty-state">No requests yet. <a href="#" onclick="showPage('nightout')" style="color:var(--blue)">Apply for night out →</a></p>`;
    return;
  }
  el.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Destination</th>
          <th>Departure</th>
          <th>Return</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${requests.map(r => `
          <tr>
            <td>
              <strong>${r.destination}</strong><br>
              <small style="color:var(--text-muted)">${r.reason.slice(0, 40)}...</small>
            </td>
            <td>${formatDate(r.outDate)}</td>
            <td>${formatDate(r.returnDate)}</td>
            <td><span class="status-badge ${r.status}">${r.status.toUpperCase()}</span></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

// ========================
// NIGHT OUT FORM
// ========================
function handleFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const preview = document.getElementById('filePreview');
  preview.innerHTML = `✅ Selected: <strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)`;
  preview.classList.remove('hidden');
  document.getElementById('dropZone').style.borderColor = 'var(--green)';
}

function setupDragDrop() {
  const zone = document.getElementById('dropZone');
  if (!zone) return;
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.style.borderColor = 'var(--blue)';
  });
  zone.addEventListener('dragleave', () => {
    zone.style.borderColor = 'var(--border)';
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      document.getElementById('proofFile').files = e.dataTransfer.files;
      handleFileSelect(document.getElementById('proofFile'));
    }
  });
}

async function submitNightout(e) {
  e.preventDefault();

  const errEl = document.getElementById('nightoutError');
  const sucEl = document.getElementById('nightoutSuccess');

  errEl.classList.add('hidden');
  sucEl.classList.add('hidden');

  const outDateValue = document.getElementById('noOutDate').value;
  const returnDateValue = document.getElementById('noReturnDate').value;

  const fileInput = document.getElementById('proofFile');
  const file = fileInput.files[0];

  if (!outDateValue) {
    errEl.textContent = "Please select out date.";
    errEl.classList.remove('hidden');
    return;
  }

  const date = new Date(outDateValue);
  const day = date.getDay();

// weekend check
  const isWeekend = (day === 0 || day === 6);

// Only require proof if weekday AND proof section is visible
  const proofSection = document.getElementById("proofSection");

  if (!isWeekend && proofSection.style.display !== "none" && !file) {

    errEl.textContent = "Proof document is required for weekday night-out.";
    errEl.classList.remove("hidden");
    return;

}

  const formData = new FormData();

  formData.append('reason', document.getElementById('noReason').value);
  formData.append('destination', document.getElementById('noDestination').value);
  formData.append('outDate', outDateValue);
  formData.append('returnDate', returnDateValue);
  formData.append('outTime', document.getElementById('noOutTime').value);
  formData.append('returnTime', document.getElementById('noReturnTime').value);
  formData.append('proofType', document.getElementById('noProofType').value);
  formData.append('additionalNotes', document.getElementById('noNotes').value);

  // Only attach file if provided
  if (file) {
    formData.append('proofDocument', file);
  }

  try {

    const btn = e.target.querySelector('button[type=submit]');
    btn.textContent = 'Submitting...';
    btn.disabled = true;

    const res = await fetch(`${API}/nightout/apply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: formData
    });

    const data = await res.json();

    btn.textContent = 'Submit Night Out Request 🌙';
    btn.disabled = false;

    if (!data.success) {
      errEl.textContent = data.message;
      errEl.classList.remove('hidden');
      return;
    }

    sucEl.textContent = "✅ Request submitted successfully!";
    sucEl.classList.remove('hidden');
    showToast('Night-out request submitted! Awaiting admin approval.', 'success');

    document.getElementById('nightoutForm').reset();
    document.getElementById('filePreview').classList.add('hidden');
    document.getElementById('dropZone').style.borderColor = 'var(--border)';

  } catch (err) {

    errEl.textContent = "Server error. Please try again.";
    errEl.classList.remove('hidden');

  }
}


// ========================
// MY REQUESTS
// ========================
async function loadMyRequests() {
  const el = document.getElementById('myRequestsList');
  el.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const res = await authFetch(`${API}/nightout/my-requests`);
    const data = await res.json();
    if (!data.requests.length) {
      el.innerHTML = `<p class="empty-state">No requests yet. <a href="#" onclick="showPage('nightout')" style="color:var(--blue)">Apply now →</a></p>`;
      return;
    }
    el.innerHTML = data.requests.map(r => requestCard(r, false)).join('');
  } catch (err) {
    el.innerHTML = '<p class="empty-state">Failed to load requests.</p>';
  }
}

function requestCard(r, isAdmin = false) {

  // Gate pass button — shows for approved requests
  const gatePassBtn = r.status === 'approved' ? `
    <a href="/gate-pass.html?id=${r._id}" target="_blank" 
       style="display:inline-block;margin-top:8px;padding:8px 14px;background:#1e3a5f;color:white;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">
      🎫 View Gate Pass
    </a>` : '';

  const adminBtns = isAdmin && r.status === 'pending' ? `
    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn-approve" onclick="openReview('${r._id}')">Review Request</button>
      <a href="http://localhost:5000${r.proofDocument}" target="_blank" class="btn-view">📄 View Proof</a>
    </div>
    ${gatePassBtn}` : `
    <div style="margin-top:10px">
      <a href="http://localhost:5000${r.proofDocument}" target="_blank" class="btn-view">📄 View Proof</a>
    </div>
    ${gatePassBtn}`;

  const remarks = r.adminRemarks
    ? `<div class="request-remarks">💬 Admin Remarks: ${r.adminRemarks}</div>` : '';

  return `
    <div class="request-card ${r.status}">
      <div class="request-header">
        <div>
          <div class="request-title">🌙 ${r.destination}</div>
          <div class="request-subtitle">${r.reason.slice(0, 80)}${r.reason.length > 80 ? '...' : ''}</div>
          ${isAdmin ? `<div class="request-subtitle" style="margin-top:4px">🎓 ${r.studentName} · ${r.rollNumber} · Room ${r.roomNumber}</div>` : ''}
        </div>
        <span class="status-badge ${r.status}">${r.status.toUpperCase()}</span>
      </div>
      <div class="request-details">
        <div class="detail-item"><strong>${formatDate(r.outDate)} ${r.outTime}</strong>Departure</div>
        <div class="detail-item"><strong>${formatDate(r.returnDate)} ${r.returnTime}</strong>Return</div>
        <div class="detail-item"><strong>${proofLabel(r.proofType)}</strong>Proof Type</div>
      </div>
      ${remarks}
      ${adminBtns}
    </div>`;
}

// ========================
// NOTICES
// ========================
async function loadNotices() {
  const el = document.getElementById('noticesList');
  el.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const res = await authFetch(`${API}/notices`);
    const data = await res.json();
    if (!data.notices.length) {
      el.innerHTML = '<p class="empty-state">No notices yet.</p>';
      return;
    }
    el.innerHTML = data.notices.map(n => `
      <div class="notice-item ${n.type}">
        <div class="notice-header">
          <span class="notice-title">${n.title}</span>
          <span class="notice-meta">${formatDate(n.createdAt)} · ${n.postedByName || 'Admin'}</span>
        </div>
        <p class="notice-content">${n.content}</p>
      </div>`).join('');
  } catch (err) {
    el.innerHTML = '<p class="empty-state">Failed to load notices.</p>';
  }
}

async function submitNotice(e) {
  e.preventDefault();
  const msgEl = document.getElementById('noticeMsg');
  try {
    const res = await authFetch(`${API}/notices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:   document.getElementById('noticeTitle').value,
        content: document.getElementById('noticeContent').value,
        type:    document.getElementById('noticeType').value
      })
    });
    const data = await res.json();
    msgEl.className = data.success ? 'success-msg' : 'error-msg';
    msgEl.textContent = data.message;
    msgEl.classList.remove('hidden');
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) e.target.reset();
  } catch (err) {
    msgEl.className = 'error-msg';
    msgEl.textContent = 'Failed to post notice.';
    msgEl.classList.remove('hidden');
  }
}

// ========================
// PROFILE
// ========================
async function loadProfile() {
  try {
    // Fetch fresh profile from server
    const res = await authFetch(`${API}/auth/me`);
    const data = await res.json();
    if (!data.success) return;
    const s = data.student;

    // ── Avatar initials ──────────────────────────────────────────
    const initials = s.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    document.getElementById('profileAvatar').textContent = initials;
    document.getElementById('profileAvatar').style.cssText =
      'font-size:32px;font-weight:700;background:var(--blue-light);color:var(--blue);border-radius:50%;width:88px;height:88px;display:flex;align-items:center;justify-content:center;flex-shrink:0';

    // ── Top section name + role ──────────────────────────────────
    document.getElementById('profileInfo').innerHTML = `
      <div class="profile-name">${s.name}</div>
      <div class="profile-role">${s.role.charAt(0).toUpperCase() + s.role.slice(1)} · ${s.course || ''} · Year ${s.year || 'N/A'}</div>
      <div style="margin-top:6px;font-size:13px;color:var(--text-muted)">
        🏠 Room ${s.roomNumber} &nbsp;|&nbsp; 🎓 Roll No: ${s.rollNumber}
      </div>
    `;

    // ── Status badge ─────────────────────────────────────────────
    const statusColors = { active:'#22c55e', inactive:'#f59e0b', suspended:'#ef4444' };
    const statusColor = statusColors[s.status] || '#888';
    const outBadge = s.currentlyOut
      ? `<span style="background:#fff3cd;color:#856404;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid #ffd700;margin-left:8px">🚶 Currently Out</span>`
      : '';
    document.getElementById('profileStatusBadge').innerHTML = `
      <span style="background:${statusColor}22;color:${statusColor};font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid ${statusColor}44">
        ● ${s.status.toUpperCase()}
      </span>${outBadge}
    `;

    // ── Personal Info card ────────────────────────────────────────
    document.getElementById('profileDetails').innerHTML = `
      <div class="profile-grid" style="grid-template-columns:1fr 1fr">
        <div class="profile-item"><label>Email</label><p>${s.email}</p></div>
        <div class="profile-item"><label>Phone</label><p>${s.phone}</p></div>
        <div class="profile-item"><label>Course</label><p>${s.course || 'N/A'}</p></div>
        <div class="profile-item"><label>Year</label><p>${s.year || 'N/A'}</p></div>
        <div class="profile-item"><label>Roll Number</label><p>${s.rollNumber}</p></div>
        <div class="profile-item"><label>Room Number</label><p>${s.roomNumber}</p></div>
        <div class="profile-item"><label>Member Since</label>
          <p>${new Date(s.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>
        </div>
        <div class="profile-item"><label>Last Check-In</label>
          <p>${s.checkInTime ? new Date(s.checkInTime).toLocaleDateString('en-IN') : '—'}</p>
        </div>
      </div>
    `;

    // ── Parent Info card ──────────────────────────────────────────
    document.getElementById('profileParent').innerHTML = `
      <div class="profile-grid" style="grid-template-columns:1fr">
        <div class="profile-item"><label>Parent / Guardian Name</label><p>${s.parentName}</p></div>
        <div class="profile-item"><label>Parent Phone</label>
          <p><a href="tel:${s.parentPhone}" style="color:var(--blue);text-decoration:none">📞 ${s.parentPhone}</a></p>
        </div>
        <div class="profile-item"><label>Parent Email</label>
          <p>${s.parentEmail
            ? `<a href="mailto:${s.parentEmail}" style="color:var(--blue);text-decoration:none">✉️ ${s.parentEmail}</a>`
            : '<span style="color:var(--text-muted)">Not provided</span>'}</p>
        </div>
      </div>
    `;

    // ── Night-Out Stats ───────────────────────────────────────────
    try {
      const nRes = await authFetch(`${API}/nightout/my-requests`);
      const nData = await nRes.json();
      if (nData.success) {
        const reqs = nData.requests;
        const total    = reqs.length;
        const approved = reqs.filter(r => ['approved','out','returned'].includes(r.status)).length;
        const pending  = reqs.filter(r => r.status === 'pending').length;
        const lateRet  = reqs.filter(r => r.isLateReturn).length;
        document.getElementById('profileStats').innerHTML = `
          <div style="background:var(--blue-light);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:26px;font-weight:700;color:var(--blue)">${total}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Total Requests</div>
          </div>
          <div style="background:#dcfce7;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:26px;font-weight:700;color:#16a34a">${approved}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Approved</div>
          </div>
          <div style="background:#fef9c3;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:26px;font-weight:700;color:#ca8a04">${pending}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Pending</div>
          </div>
          <div style="background:#fee2e2;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:26px;font-weight:700;color:#dc2626">${lateRet}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Late Returns</div>
          </div>
        `;
      }
    } catch(e) { /* stats optional */ }

    // ── Pre-fill edit form ────────────────────────────────────────
    document.getElementById('editPhone').value       = s.phone || '';
    document.getElementById('editParentName').value  = s.parentName || '';
    document.getElementById('editParentPhone').value = s.parentPhone || '';
    document.getElementById('editParentEmail').value = s.parentEmail || '';

  } catch (err) {
    console.error('Profile load error', err);
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const btn = document.getElementById('saveProfileBtn');
  const msg = document.getElementById('profileSaveMsg');
  btn.textContent = 'Saving...';
  btn.disabled = true;
  msg.textContent = '';
  try {
    const res = await authFetch(`${API}/students/profile/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone:       document.getElementById('editPhone').value.trim(),
        parentName:  document.getElementById('editParentName').value.trim(),
        parentPhone: document.getElementById('editParentPhone').value.trim(),
        parentEmail: document.getElementById('editParentEmail').value.trim(),
      })
    });
    const data = await res.json();
    if (data.success) {
       msg.style.color = '#16a34a';
       msg.textContent = '✅ Profile updated successfully!';
       loadProfile();
       showToast('Profile updated successfully!', 'success');
} else {
  msg.style.color = '#dc2626';
  msg.textContent = '❌ ' + (data.message || 'Update failed');
  showToast(data.message || 'Update failed.', 'error');
}
  } catch(err) {
    msg.style.color = '#dc2626';
    msg.textContent = '❌ Network error. Try again.';
  } finally {
    btn.textContent = 'Save Changes';
    btn.disabled = false;
  }
}
// ========================
// ADMIN DASHBOARD
// ========================
let chartWeekly       = null;
let chartStatus       = null;
let chartDestinations = null;
let chartCourses      = null;

async function loadAdminDashboard() {
  try {
    const res  = await authFetch(`${API}/admin/dashboard`);
    const data = await res.json();
    if (!data.success) return;

    const s = data.stats;
    const c = data.charts;

    // ── STAT CARDS ───────────────────────────────────────────────
    document.getElementById('adminStats').innerHTML = `
      <div class="stat-card blue">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-num">${s.totalStudents}</div>
          <div class="stat-label">Total Students</div>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-num">${s.activeStudents}</div>
          <div class="stat-label">Active Students</div>
        </div>
      </div>
      <div class="stat-card amber">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <div class="stat-num">${s.pendingNightouts}</div>
          <div class="stat-label">Pending Requests</div>
        </div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">🌙</div>
        <div class="stat-info">
          <div class="stat-num">${s.approvedNightouts}</div>
          <div class="stat-label">Approved Night-outs</div>
        </div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon">🚶</div>
        <div class="stat-info">
          <div class="stat-num">${s.studentsOut}</div>
          <div class="stat-label">Currently Outside</div>
        </div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">⚠️</div>
        <div class="stat-info">
          <div class="stat-num">${s.lateReturns}</div>
          <div class="stat-label">Late Returns</div>
        </div>
      </div>
    `;

    // ── PENDING LIST ─────────────────────────────────────────────
    const pendingEl = document.getElementById('adminPendingList');
    if (!data.recentRequests.length) {
      pendingEl.innerHTML = '<p class="empty-state">🎉 No pending requests!</p>';
    } else {
      pendingEl.innerHTML = data.recentRequests.map(r => requestCard(r, true)).join('');
    }

    // ── CHARTS (wait for canvas to be in DOM) ────────────────────
    setTimeout(() => renderCharts(c), 100);
    // ── COMPLAINT STATS ──────────────────────────────────────────
try {
  const cRes  = await authFetch(`${API}/complaints/stats`);
  const cData = await cRes.json();
  if (cData.success) {
    const cs = cData.stats;
    document.getElementById('complaintStats').innerHTML = `
      <div class="stat-card blue">
        <div class="stat-icon">🔧</div>
        <div class="stat-info">
          <div class="stat-num">${cs.total}</div>
          <div class="stat-label">Total Complaints</div>
        </div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">🔴</div>
        <div class="stat-info">
          <div class="stat-num">${cs.open}</div>
          <div class="stat-label">Open</div>
        </div>
      </div>
      <div class="stat-card amber">
        <div class="stat-icon">🟡</div>
        <div class="stat-info">
          <div class="stat-num">${cs.in_progress}</div>
          <div class="stat-label">In Progress</div>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-num">${cs.resolved}</div>
          <div class="stat-label">Resolved</div>
        </div>
      </div>
    `;
  }
} catch(e) { console.error('Complaint stats error', e); }

  } catch (err) {
    console.error('Admin dashboard error', err);
  }
}

function renderCharts(c) {

  // Destroy old charts if they exist (prevents duplicate canvas error)
  if (chartWeekly)       { chartWeekly.destroy();       chartWeekly = null; }
  if (chartStatus)       { chartStatus.destroy();       chartStatus = null; }
  if (chartDestinations) { chartDestinations.destroy(); chartDestinations = null; }
  if (chartCourses)      { chartCourses.destroy();      chartCourses = null; }

  // ── LINE CHART: Last 7 days ──────────────────────────────────
  const weeklyCtx = document.getElementById('chartWeekly');
  if (weeklyCtx) {
    chartWeekly = new Chart(weeklyCtx, {
      type: 'line',
      data: {
        labels:   c.last7Days.map(d => d.date),
        datasets: [{
          label:           'Requests',
          data:            c.last7Days.map(d => d.count),
          borderColor:     '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.1)',
          borderWidth:     2,
          pointBackgroundColor: '#3b82f6',
          pointRadius:     4,
          tension:         0.4,
          fill:            true,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  // ── DOUGHNUT CHART: Status breakdown ────────────────────────
  const statusCtx = document.getElementById('chartStatus');
  if (statusCtx) {
    const sb = c.statusBreakdown;
    chartStatus = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'Approved', 'Rejected', 'Out', 'Returned'],
        datasets: [{
          data: [sb.pending, sb.approved, sb.rejected, sb.out, sb.returned],
          backgroundColor: ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'],
          borderWidth: 2,
          borderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 12, font: { size: 12 } } }
        },
        cutout: '65%',
      }
    });
  }

  // ── BAR CHART: Top destinations ──────────────────────────────
  const destCtx = document.getElementById('chartDestinations');
  if (destCtx) {
    chartDestinations = new Chart(destCtx, {
      type: 'bar',
      data: {
        labels:   c.topDestinations.map(d => d._id || 'Unknown'),
        datasets: [{
          label:           'Requests',
          data:            c.topDestinations.map(d => d.count),
          backgroundColor: '#3b82f6',
          borderRadius:    6,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  // ── BAR CHART: Students by course ────────────────────────────
  const courseCtx = document.getElementById('chartCourses');
  if (courseCtx) {
    chartCourses = new Chart(courseCtx, {
      type: 'bar',
      data: {
        labels:   c.studentsByCourse.map(d => d._id || 'Unknown'),
        datasets: [{
          label:           'Students',
          data:            c.studentsByCourse.map(d => d.count),
          backgroundColor: '#10b981',
          borderRadius:    6,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }
}

// ========================
// ADMIN - ALL REQUESTS
// ========================
async function loadAllRequests(filter = 'all') {
  currentFilter = filter;
  const el = document.getElementById('allRequestsList');
  el.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const url = filter === 'all'
      ? `${API}/nightout/all`
      : `${API}/nightout/all?status=${filter}`;
    const res = await authFetch(url);
    const data = await res.json();
    if (!data.requests.length) {
      el.innerHTML = '<p class="empty-state">No requests found.</p>';
      return;
    }
    el.innerHTML = `<div class="requests-grid">${data.requests.map(r => requestCard(r, true)).join('')}</div>`;
  } catch (err) {
    el.innerHTML = '<p class="empty-state">Failed to load requests.</p>';
  }
}

function filterRequests(filter, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadAllRequests(filter);
}

// ========================
// ADMIN - STUDENTS
// ========================
async function loadStudents() {
  const el = document.getElementById('studentsList');
  el.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const res = await authFetch(`${API}/students`);
    const data = await res.json();
    if (!data.students.length) {
      el.innerHTML = '<p class="empty-state">No students registered.</p>';
      return;
    }
    el.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Roll No</th>
            <th>Room</th>
            <th>Course</th>
            <th>Phone</th>
            <th>Parent</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.students.map(s => `
            <tr>
              <td><strong>${s.name}</strong><br>
                <small style="color:var(--text-muted)">${s.email}</small>
              </td>
              <td>${s.rollNumber}</td>
              <td>
                <span style="background:var(--blue-light);color:var(--blue);padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600">
                  ${s.roomNumber}
                </span>
              </td>
              <td>${s.course}<br><small style="color:var(--text-muted)">${s.year}</small></td>
              <td>${s.phone}</td>
              <td>${s.parentName}<br><small style="color:var(--text-muted)">${s.parentPhone}</small></td>
              <td><span class="status-badge ${s.status}">${s.status?.toUpperCase()}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (err) {
    el.innerHTML = '<p class="empty-state">Failed to load students.</p>';
  }
}

// ========================
// REVIEW MODAL
// ========================
function openReview(id) {
  currentReviewId = id;
  document.getElementById('adminRemarks').value = '';
  document.getElementById('reviewDetails').innerHTML = `
    <p style="color:var(--text-muted);margin-bottom:16px">
      Reviewing request ID: <code>${id}</code>
    </p>`;
  document.getElementById('reviewModal').classList.remove('hidden');
}

async function submitReview(status) {
  try {
    const remarks = document.getElementById('adminRemarks').value;
    const res = await authFetch(`${API}/nightout/${currentReviewId}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminRemarks: remarks })
    });
    const data = await res.json();
    if (data.success) {
      closeModal();
      loadAdminDashboard();
      loadAllRequests(currentFilter);
      loadMyRequests();
      showToast(`Request ${status} successfully!${status === 'approved' ? ' QR Gate Pass generated! 🎫' : ''}`, 'success');
    } else {
      showToast('Error: ' + data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to submit review. Server error.', 'error');
  }
}

function closeModal() {
  document.getElementById('reviewModal').classList.add('hidden');
}
// ========================
// HELPERS
// ========================
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function proofLabel(type) {
  const labels = {
    office_letter:       'Office Letter',
    internship_letter:   'Internship Letter',
    medical_certificate: 'Medical Cert',
    event_pass:          'Event Pass',
    parent_consent:      'Parent Consent',
    other:               'Other Document'
  };
  return labels[type] || type;
}

// ── ADMIN: Generate fees for all students ────────────────
async function generateFees() {
  const month  = document.getElementById('feeMonth').value;
  const year   = document.getElementById('feeYear').value;
  const amount = document.getElementById('feeAmount').value;
  const msgEl  = document.getElementById('generateMsg');

  try {
    const res  = await authFetch(`${API}/fees/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ month, year, amount })
    });
    const data = await res.json();

    msgEl.textContent  = data.message;
    msgEl.style.background = data.success ? '#d1fae5' : '#fee2e2';
    msgEl.style.color      = data.success ? '#065f46' : '#991b1b';
    msgEl.classList.remove('hidden');

    if (data.success) loadFees();

  } catch (err) {
    msgEl.textContent  = 'Server error. Please try again.';
    msgEl.style.background = '#fee2e2';
    msgEl.style.color      = '#991b1b';
    msgEl.classList.remove('hidden');
  }
}


// ── ADMIN: Load fee records with filters ─────────────────
async function loadFees() {
  const month  = document.getElementById('filterMonth').value;
  const year   = document.getElementById('filterYear').value;
  const status = document.getElementById('filterStatus').value;

  const params = new URLSearchParams();
  if (month)  params.append('month',  month);
  if (year)   params.append('year',   year);
  if (status) params.append('status', status);

  const listEl    = document.getElementById('feeList');
  const summaryEl = document.getElementById('feeSummary');

  listEl.innerHTML = '<p class="empty-state">Loading...</p>';

  try {
    const res  = await authFetch(`${API}/fees?${params}`);
    const data = await res.json();

    if (!data.success) {
      listEl.innerHTML = '<p class="empty-state">Failed to load fees.</p>';
      return;
    }

    const s = data.summary;

    // Summary cards
    summaryEl.innerHTML = `
      <div class="stat-card blue">
        <div class="stat-icon">📋</div>
        <div class="stat-info"><div class="stat-num">${s.total}</div><div class="stat-label">Total Records</div></div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">✅</div>
        <div class="stat-info"><div class="stat-num">${s.paid}</div><div class="stat-label">Paid · ₹${s.paidAmt.toLocaleString()}</div></div>
      </div>
      <div class="stat-card amber">
        <div class="stat-icon">⏳</div>
        <div class="stat-info"><div class="stat-num">${s.unpaid}</div><div class="stat-label">Unpaid</div></div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">🚨</div>
        <div class="stat-info"><div class="stat-num">${s.overdue}</div><div class="stat-label">Overdue · ₹${s.pendingAmt.toLocaleString()}</div></div>
      </div>
    `;

    if (!data.fees.length) {
      listEl.innerHTML = '<p class="empty-state">No fee records found. Generate fees first.</p>';
      return;
    }

    // Fee table
    listEl.innerHTML = `
      <div style="overflow-x:auto">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Room</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Paid On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${data.fees.map(f => `
              <tr>
                <td>
                  <strong>${f.studentName}</strong><br>
                  <small style="color:var(--text-muted)">${f.rollNumber}</small>
                </td>
                <td>
                  <span style="background:var(--blue-light);color:var(--blue);padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600">
                    ${f.roomNumber}
                  </span>
                </td>
                <td>${f.month} ${f.year}</td>
                <td><strong>₹${f.amount.toLocaleString()}</strong></td>
                <td><span class="status-badge ${f.status}">${f.status.toUpperCase()}</span></td>
                <td>${f.paidOn ? new Date(f.paidOn).toLocaleDateString('en-IN') : '—'}</td>
                <td>
                  ${f.status !== 'paid' ? `
                    <button onclick="openPayModal('${f._id}')"
                      style="padding:5px 10px;background:#10b981;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px">
                      ✅ Mark Paid
                    </button>
                    <button onclick="markOverdue('${f._id}')"
                      style="padding:5px 10px;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">
                      🚨 Overdue
                    </button>
                  ` : `<span style="color:#10b981;font-size:12px">✅ ${f.paymentMode?.toUpperCase() || 'PAID'}</span>`}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

  } catch (err) {
    listEl.innerHTML = '<p class="empty-state">Failed to load fee records.</p>';
  }
}


// ── Pay modal ─────────────────────────────────────────────
function openPayModal(feeId) {
  document.getElementById('payFeeId').value = feeId;
  document.getElementById('payMode').value    = 'cash';
  document.getElementById('payTxn').value     = '';
  document.getElementById('payRemarks').value = '';
  document.getElementById('payModal').classList.remove('hidden');
}

function closePayModal() {
  document.getElementById('payModal').classList.add('hidden');
}

async function submitPayment() {
  const feeId       = document.getElementById('payFeeId').value;
  const paymentMode = document.getElementById('payMode').value;
  const transactionId = document.getElementById('payTxn').value;
  const remarks     = document.getElementById('payRemarks').value;

  try {
    const res  = await authFetch(`${API}/fees/${feeId}/pay`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ paymentMode, transactionId, remarks })
    });
    const data = await res.json();

    if (data.success) {
      closePayModal();
      loadFees();
      alert(`✅ ${data.message}`);
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    alert('Server error. Please try again.');
  }
}


// ── Mark overdue ──────────────────────────────────────────
async function markOverdue(feeId) {
  if (!confirm('Mark this fee as overdue?')) return;
  try {
    const res  = await authFetch(`${API}/fees/${feeId}/overdue`, { method: 'PUT' });
    const data = await res.json();
    if (data.success) { loadFees(); }
    else { alert('Error: ' + data.message); }
  } catch (err) {
    alert('Server error.');
  }
}


// ── STUDENT: My fee history ───────────────────────────────
async function loadMyFees() {
  const listEl    = document.getElementById('myFeeList');
  const summaryEl = document.getElementById('myFeeSummary');

  listEl.innerHTML = '<p class="empty-state">Loading...</p>';

  try {
    const res  = await authFetch(`${API}/fees/my-fees`);
    const data = await res.json();

    // Summary
    summaryEl.innerHTML = `
      <div class="stat-card green">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-num">₹${data.totalPaid.toLocaleString()}</div>
          <div class="stat-label">Total Paid</div>
        </div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <div class="stat-num">₹${data.totalDue.toLocaleString()}</div>
          <div class="stat-label">Total Due</div>
        </div>
      </div>
    `;

    if (!data.fees.length) {
      listEl.innerHTML = '<p class="empty-state">No fee records found yet. Contact admin.</p>';
      return;
    }

    listEl.innerHTML = `
      <div style="overflow-x:auto">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Paid On</th>
              <th>Payment Mode</th>
            </tr>
          </thead>
          <tbody>
            ${data.fees.map(f => `
              <tr>
                <td><strong>${f.month} ${f.year}</strong></td>
                <td>₹${f.amount.toLocaleString()}</td>
                <td><span class="status-badge ${f.status}">${f.status.toUpperCase()}</span></td>
                <td>${f.paidOn ? new Date(f.paidOn).toLocaleDateString('en-IN') : '—'}</td>
                <td>${f.paymentMode ? f.paymentMode.replace('_', ' ').toUpperCase() : '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

  } catch (err) {
    listEl.innerHTML = '<p class="empty-state">Failed to load fee records.</p>';
  }
}
// Mess 
const DAYS_FULL = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAYS_LABEL = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEALS = ['breakfast','lunch','snacks','dinner'];
const MEAL_LABELS = { breakfast:'🌅 Breakfast', lunch:'☀️ Lunch', snacks:'🫖 Snacks', dinner:'🌙 Dinner' };

let selectedRating = 0;

// ── Tab switchers ─────────────────────────────────────────
function switchMessTab(tab, btn) {
  DAYS_FULL.forEach(d => {
    const el = document.getElementById(`messTab-${d}`);
    if (el) el.classList.add('hidden');
  });
  ['menu','feedback','optout','myOptouts'].forEach(t => {
    const el = document.getElementById(`messTab-${t}`);
    if (el) el.classList.add('hidden');
  });
  document.querySelectorAll('#page-messMenu .filter-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(`messTab-${tab}`);
  if (target) target.classList.remove('hidden');
  if (btn) btn.classList.add('active');

  if (tab === 'menu')      loadMessMenu();
  if (tab === 'myOptouts') loadMyOptOuts();
}

function switchAdminMessTab(tab, btn) {
  ['updateMenu','viewFeedback','optoutRequests'].forEach(t => {
    const el = document.getElementById(`adminMessTab-${t}`);
    if (el) el.classList.add('hidden');
  });
  document.querySelectorAll('#page-adminMess .filter-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(`adminMessTab-${tab}`);
  if (target) target.classList.remove('hidden');
  if (btn) btn.classList.add('active');

  if (tab === 'updateMenu')     { buildMenuForm(); loadCurrentMenu(); }
  if (tab === 'viewFeedback')   loadFeedbackStats();
  if (tab === 'optoutRequests') loadAllOptOuts();
}


// ── STUDENT: Load weekly menu display ────────────────────
async function loadMessMenu() {
  const el = document.getElementById('weeklyMenuDisplay');
  if (!el) return;
  el.innerHTML = '<p class="empty-state">Loading...</p>';

  // Set today's date in feedback tab
  const fbDate = document.getElementById('fbDate');
  if (fbDate) fbDate.value = new Date().toISOString().split('T')[0];

  try {
    const res  = await authFetch(`${API}/mess/menu`);
    const data = await res.json();

    if (!data.menu) {
      el.innerHTML = '<p class="empty-state">No menu set for this week yet. Check back later!</p>';
      return;
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    el.innerHTML = DAYS_FULL.map((day, i) => {
      const m       = data.menu[day] || {};
      const isToday = day === today;
      return `
        <div style="border:${isToday ? '2px solid var(--blue)' : '1px solid var(--border)'};border-radius:10px;padding:14px;margin-bottom:10px;background:${isToday ? 'var(--blue-light)' : 'var(--bg)'}">
          <div style="font-weight:600;font-size:15px;margin-bottom:10px;color:${isToday ? 'var(--blue)' : 'inherit'}">
            ${isToday ? '📍 ' : ''}${DAYS_LABEL[i]}${isToday ? ' (Today)' : ''}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${MEALS.map(meal => `
              <div style="background:var(--card-bg);padding:8px 10px;border-radius:8px;border:1px solid var(--border)">
                <div style="font-size:11px;color:var(--text-muted);font-weight:600">${MEAL_LABELS[meal]}</div>
                <div style="font-size:13px;margin-top:3px">${m[meal] || '—'}</div>
              </div>`).join('')}
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    el.innerHTML = '<p class="empty-state">Failed to load menu.</p>';
  }
}


// ── STUDENT: Star rating ──────────────────────────────────
function setRating(val) {
  selectedRating = val;
  document.getElementById('fbRating').value = val;
  document.querySelectorAll('#starRating span').forEach((star, i) => {
    star.style.opacity = i < val ? '1' : '0.3';
  });
}


// ── STUDENT: Submit feedback ──────────────────────────────
async function submitFeedback() {
  const msgEl   = document.getElementById('fbMsg');
  const mealType = document.getElementById('fbMealType').value;
  const date     = document.getElementById('fbDate').value;
  const rating   = document.getElementById('fbRating').value;
  const comment  = document.getElementById('fbComment').value;

  if (!rating || rating === '0') {
    msgEl.textContent = 'Please select a star rating!';
    msgEl.style.background = '#fee2e2';
    msgEl.style.color = '#991b1b';
    msgEl.classList.remove('hidden');
    return;
  }

  try {
    const res  = await authFetch(`${API}/mess/feedback`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ mealType, date, rating, comment })
    });
    const data = await res.json();

    msgEl.textContent       = data.message;
    msgEl.style.background  = data.success ? '#d1fae5' : '#fee2e2';
    msgEl.style.color       = data.success ? '#065f46' : '#991b1b';
    msgEl.classList.remove('hidden');

    if (data.success) {
      document.getElementById('fbComment').value = '';
      setRating(0);
    }
  } catch (err) {
    msgEl.textContent = 'Server error. Please try again.';
    msgEl.style.background = '#fee2e2';
    msgEl.style.color = '#991b1b';
    msgEl.classList.remove('hidden');
  }
}


// ── STUDENT: Submit opt-out ───────────────────────────────
async function submitOptOut() {
  const msgEl = document.getElementById('optMsg');

  const payload = {
    fromDate:      document.getElementById('optFromDate').value,
    toDate:        document.getElementById('optToDate').value,
    reason:        document.getElementById('optReason').value,
    skipBreakfast: document.getElementById('skipBreakfast').checked,
    skipLunch:     document.getElementById('skipLunch').checked,
    skipSnacks:    document.getElementById('skipSnacks').checked,
    skipDinner:    document.getElementById('skipDinner').checked,
  };

  if (!payload.fromDate || !payload.toDate || !payload.reason) {
    msgEl.textContent = 'Please fill all required fields!';
    msgEl.style.background = '#fee2e2';
    msgEl.style.color = '#991b1b';
    msgEl.classList.remove('hidden');
    return;
  }

  try {
    const res  = await authFetch(`${API}/mess/optout`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const data = await res.json();

    msgEl.textContent      = data.message;
    msgEl.style.background = data.success ? '#d1fae5' : '#fee2e2';
    msgEl.style.color      = data.success ? '#065f46' : '#991b1b';
    msgEl.classList.remove('hidden');

  } catch (err) {
    msgEl.textContent = 'Server error. Please try again.';
    msgEl.style.background = '#fee2e2';
    msgEl.style.color = '#991b1b';
    msgEl.classList.remove('hidden');
  }
}


// ── STUDENT: My opt-out history ───────────────────────────
async function loadMyOptOuts() {
  const el = document.getElementById('myOptOutList');
  el.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const res  = await authFetch(`${API}/mess/optout/my`);
    const data = await res.json();
    if (!data.optouts.length) {
      el.innerHTML = '<p class="empty-state">No opt-out requests yet.</p>';
      return;
    }
    el.innerHTML = data.optouts.map(o => `
      <div class="request-card ${o.status}" style="margin-bottom:10px">
        <div class="request-header">
          <div>
            <div class="request-title">🚫 ${formatDate(o.fromDate)} → ${formatDate(o.toDate)}</div>
            <div class="request-subtitle">${o.reason}</div>
          </div>
          <span class="status-badge ${o.status}">${o.status.toUpperCase()}</span>
        </div>
        <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">
          Skipping: ${[o.skipBreakfast&&'Breakfast',o.skipLunch&&'Lunch',o.skipSnacks&&'Snacks',o.skipDinner&&'Dinner'].filter(Boolean).join(', ') || 'All meals'}
        </div>
      </div>`).join('');
  } catch (err) {
    el.innerHTML = '<p class="empty-state">Failed to load.</p>';
  }
}


// ── ADMIN: Build menu form ────────────────────────────────
function buildMenuForm() {
  const el = document.getElementById('menuForm');
  if (!el) return;
  el.innerHTML = DAYS_FULL.map((day, i) => `
    <div style="border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:14px;margin-bottom:10px">${DAYS_LABEL[i]}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${MEALS.map(meal => `
          <div class="form-group" style="margin:0">
            <label style="font-size:12px">${MEAL_LABELS[meal]}</label>
            <input type="text" id="menu_${day}_${meal}" placeholder="e.g. Aloo Paratha, Dal"/>
          </div>`).join('')}
      </div>
    </div>`).join('');
}


// ── ADMIN: Load current menu into form ───────────────────
async function loadCurrentMenu() {
  try {
    const res  = await authFetch(`${API}/mess/menu`);
    const data = await res.json();
    if (!data.menu) return;

    DAYS_FULL.forEach(day => {
      MEALS.forEach(meal => {
        const input = document.getElementById(`menu_${day}_${meal}`);
        if (input && data.menu[day]) input.value = data.menu[day][meal] || '';
      });
    });
  } catch (err) {
    console.error('Menu load error:', err);
  }
}


// ── ADMIN: Save menu ──────────────────────────────────────
async function saveMenu() {
  const msgEl  = document.getElementById('menuSaveMsg');
  const payload = {};

  DAYS_FULL.forEach(day => {
    payload[day] = {};
    MEALS.forEach(meal => {
      const input = document.getElementById(`menu_${day}_${meal}`);
      if (input) payload[day][meal] = input.value.trim();
    });
  });

  try {
    const res  = await authFetch(`${API}/mess/menu`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const data = await res.json();

    msgEl.textContent      = data.message;
    msgEl.style.background = data.success ? '#d1fae5' : '#fee2e2';
    msgEl.style.color      = data.success ? '#065f46' : '#991b1b';
    msgEl.classList.remove('hidden');

  } catch (err) {
    msgEl.textContent = 'Server error. Please try again.';
    msgEl.style.background = '#fee2e2';
    msgEl.style.color = '#991b1b';
    msgEl.classList.remove('hidden');
  }
}


// ── ADMIN: Load feedback stats ────────────────────────────
async function loadFeedbackStats() {
  const statsEl  = document.getElementById('feedbackStats');
  const recentEl = document.getElementById('recentFeedback');

  statsEl.innerHTML = '<p class="empty-state">Loading...</p>';

  try {
    const res  = await authFetch(`${API}/mess/feedback`);
    const data = await res.json();

    if (!data.averages.length) {
      statsEl.innerHTML = '<p class="empty-state">No feedback submitted yet.</p>';
      recentEl.innerHTML = '';
      return;
    }

    // Rating cards
    statsEl.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
        ${data.averages.map(a => `
          <div class="stat-card blue">
            <div class="stat-icon">${MEAL_LABELS[a._id]?.split(' ')[0] || '⭐'}</div>
            <div class="stat-info">
              <div class="stat-num">${Number(a.avgRating).toFixed(1)} ⭐</div>
              <div class="stat-label">${a._id} (${a.count} reviews)</div>
            </div>
          </div>`).join('')}
      </div>`;

    // Recent comments
    if (!data.recent.length) {
      recentEl.innerHTML = '<p class="empty-state">No comments yet.</p>';
      return;
    }

    recentEl.innerHTML = data.recent.map(f => `
      <div style="border-bottom:1px solid var(--border);padding:10px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:600;font-size:13px">${f.studentName}</span>
          <span style="font-size:12px;color:var(--text-muted)">${formatDate(f.date)} · ${f.mealType}</span>
        </div>
        <div style="margin:4px 0;font-size:14px">${'⭐'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</div>
        ${f.comment ? `<div style="font-size:13px;color:var(--text-muted)">"${f.comment}"</div>` : ''}
      </div>`).join('');

  } catch (err) {
    statsEl.innerHTML = '<p class="empty-state">Failed to load feedback.</p>';
  }
}


// ── ADMIN: Load all opt-out requests ─────────────────────
async function loadAllOptOuts() {
  const el = document.getElementById('allOptOutList');
  el.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const res  = await authFetch(`${API}/mess/optout/all`);
    const data = await res.json();

    if (!data.optouts.length) {
      el.innerHTML = '<p class="empty-state">No opt-out requests yet.</p>';
      return;
    }

    el.innerHTML = data.optouts.map(o => `
      <div class="request-card ${o.status}" style="margin-bottom:10px">
        <div class="request-header">
          <div>
            <div class="request-title">${o.studentName} · Room ${o.roomNumber}</div>
            <div class="request-subtitle">${formatDate(o.fromDate)} → ${formatDate(o.toDate)} · ${o.reason}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">
              Skipping: ${[o.skipBreakfast&&'Breakfast',o.skipLunch&&'Lunch',o.skipSnacks&&'Snacks',o.skipDinner&&'Dinner'].filter(Boolean).join(', ') || 'All meals'}
            </div>
          </div>
          <span class="status-badge ${o.status}">${o.status.toUpperCase()}</span>
        </div>
        ${o.status === 'pending' ? `
          <div style="display:flex;gap:8px;margin-top:12px">
            <button onclick="reviewOptOut('${o._id}','approved')"
              style="padding:6px 14px;background:#10b981;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px">
              ✅ Approve
            </button>
            <button onclick="reviewOptOut('${o._id}','rejected')"
              style="padding:6px 14px;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px">
              ❌ Reject
            </button>
          </div>` : ''}
      </div>`).join('');
  } catch (err) {
    el.innerHTML = '<p class="empty-state">Failed to load.</p>';
  }
}


// ── ADMIN: Review opt-out ─────────────────────────────────
async function reviewOptOut(id, status) {
  try {
    const res  = await authFetch(`${API}/mess/optout/${id}/review`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) { loadAllOptOuts(); }
    else { alert('Error: ' + data.message); }
  } catch (err) {
    alert('Server error.');
  }
}


// ── ADMIN page loader ─────────────────────────────────────
function loadAdminMess() {
  buildMenuForm();
  loadCurrentMenu();
}
// ========================
// COMPLAINTS
// ========================

const CATEGORY_ICONS = {
  electrical:  '⚡',
  plumbing:    '🚿',
  furniture:   '🪑',
  cleanliness: '🧹',
  internet:    '📶',
  security:    '🔒',
  other:       '📝'
};

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };
const STATUS_LABELS   = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };

function complaintCard(c, isAdmin = false) {
  const icon     = CATEGORY_ICONS[c.category] || '📝';
  const priClass = `badge-priority-${c.priority}`;
  const stsClass = `badge-status-${c.status}`;
  const date     = new Date(c.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

  const remarks = c.adminRemarks
    ? `<div class="complaint-remarks">💬 Admin: ${c.adminRemarks}</div>`
    : '';

  const resolvedOn = c.resolvedAt
    ? `<span style="font-size:12px;color:var(--text-muted)"> · Resolved ${new Date(c.resolvedAt).toLocaleDateString('en-IN')}</span>`
    : '';

  const adminActions = isAdmin ? `
    <div class="admin-complaint-actions">
      <select id="status-${c._id}">
        <option value="open"        ${c.status==='open'        ?'selected':''}>🔴 Open</option>
        <option value="in_progress" ${c.status==='in_progress' ?'selected':''}>🟡 In Progress</option>
        <option value="resolved"    ${c.status==='resolved'    ?'selected':''}>🟢 Resolved</option>
        <option value="closed"      ${c.status==='closed'      ?'selected':''}>⚫ Closed</option>
      </select>
      <input type="text" id="remarks-${c._id}" placeholder="Add remarks (optional)" value="${c.adminRemarks || ''}" />
      <button class="btn-resolve" onclick="updateComplaint('${c._id}')">Update</button>
    </div>` : '';

  return `
    <div class="complaint-card" id="complaint-card-${c._id}">
      <div class="complaint-card-header">
        <div style="display:flex;align-items:flex-start">
          <span class="category-icon">${icon}</span>
          <div>
            <div class="complaint-title">${c.title}</div>
            <div class="complaint-meta">
              ${isAdmin ? `<strong>${c.studentName}</strong> · Room ${c.roomNumber} · ` : ''}
              ${c.category.charAt(0).toUpperCase() + c.category.slice(1)} · ${date}${resolvedOn}
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;align-items:flex-end">
          <span class="complaint-badge ${priClass}">${PRIORITY_LABELS[c.priority]}</span>
          <span class="complaint-badge ${stsClass}">${STATUS_LABELS[c.status]}</span>
        </div>
      </div>
      <div class="complaint-desc">${c.description}</div>
      ${remarks}
      ${adminActions}
    </div>`;
}

async function handleComplaintSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('complaintSubmitBtn');
  const msg = document.getElementById('complaintMsg');
  btn.textContent = 'Submitting...';
  btn.disabled = true;
  msg.textContent = '';
  try {
    const res = await authFetch(`${API}/complaints/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category:    document.getElementById('cCategory').value,
        priority:    document.getElementById('cPriority').value,
        title:       document.getElementById('cTitle').value.trim(),
        description: document.getElementById('cDescription').value.trim()
      })
    });
    const data = await res.json();
    if (data.success) {
      msg.style.color = '#16a34a';
      msg.textContent = '✅ Complaint submitted! We will look into it soon.';
      document.getElementById('complaintForm').reset();
      loadMyComplaints();
    } else {
      msg.style.color = '#dc2626';
      msg.textContent = '❌ ' + (data.message || 'Submission failed.');
    }
  } catch (err) {
    msg.style.color = '#dc2626';
    msg.textContent = '❌ Network error. Try again.';
  } finally {
    btn.textContent = 'Submit Complaint';
    btn.disabled = false;
  }
}

async function loadMyComplaints() {
  const el = document.getElementById('myComplaintsList');
  if (!el) return;
  el.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const res  = await authFetch(`${API}/complaints/my`);
    const data = await res.json();
    if (!data.success || !data.complaints.length) {
      el.innerHTML = '<p class="empty-state">No complaints submitted yet.</p>';
      return;
    }
    el.innerHTML = data.complaints.map(c => complaintCard(c, false)).join('');
  } catch (err) {
    el.innerHTML = '<p class="empty-state">Failed to load complaints.</p>';
  }
}

async function loadAdminComplaints(filter = 'all', btnEl = null) {
  // Update active filter button
  if (btnEl) {
    document.querySelectorAll('#page-adminComplaints .filter-btn')
      .forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }

  const el = document.getElementById('adminComplaintsList');
  if (!el) return;
  el.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const url  = filter === 'all' ? `${API}/complaints/all` : `${API}/complaints/all?status=${filter}`;
    const res  = await authFetch(url);
    const data = await res.json();
    if (!data.success || !data.complaints.length) {
      el.innerHTML = '<p class="empty-state">No complaints found.</p>';
      return;
    }
    el.innerHTML = data.complaints.map(c => complaintCard(c, true)).join('');
  } catch (err) {
    el.innerHTML = '<p class="empty-state">Failed to load complaints.</p>';
  }
}

async function updateComplaint(id) {
  const status      = document.getElementById(`status-${id}`).value;
  const adminRemarks = document.getElementById(`remarks-${id}`).value.trim();
  try {
    const res  = await authFetch(`${API}/complaints/${id}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminRemarks })
    });
    const data = await res.json();
    if (data.success) {
  const card = document.getElementById(`complaint-card-${id}`);
  if (card) card.outerHTML = complaintCard(data.complaint, true);
  showToast('Complaint updated successfully.', 'success');
} else {
  showToast('Update failed: ' + data.message, 'error');
}
} catch (err) {
  showToast('Network error. Try again.', 'error');
}
}
// ========================
// CHANGE PASSWORD
// ========================
async function handlePasswordChange(e) {
  e.preventDefault();
  const btn     = document.getElementById('cpBtn');
  const msg     = document.getElementById('cpMsg');
  const current = document.getElementById('cpCurrent').value;
  const newPass = document.getElementById('cpNew').value;
  const confirm = document.getElementById('cpConfirm').value;

  // Client-side checks
  if (newPass.length < 6) {
    msg.style.color = '#dc2626';
    msg.textContent = '❌ New password must be at least 6 characters.';
    return;
  }
  if (newPass !== confirm) {
    msg.style.color = '#dc2626';
    msg.textContent = '❌ New passwords do not match.';
    return;
  }
  if (current === newPass) {
    msg.style.color = '#dc2626';
    msg.textContent = '❌ New password must be different from current password.';
    return;
  }

  btn.textContent = 'Updating...';
  btn.disabled    = true;
  msg.textContent = '';

  try {
    const res  = await authFetch(`${API}/auth/change-password`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ currentPassword: current, newPassword: newPass })
    });
    const data = await res.json();

    if (data.success) {
  msg.style.color = '#16a34a';
  msg.textContent = '✅ Password updated successfully!';
  document.getElementById('changePasswordForm').reset();
  showToast('Password changed successfully!', 'success');
} else {
  msg.style.color = '#dc2626';
  msg.textContent = '❌ ' + (data.message || 'Update failed.');
  showToast(data.message || 'Update failed.', 'error');
}
  } catch (err) {
    msg.style.color = '#dc2626';
    msg.textContent = '❌ Network error. Try again.';
  } finally {
    btn.textContent = 'Update Password';
    btn.disabled    = false;
  }
}
// ========================
// ROOM ALLOCATION
// ========================
let allRoomsData = [];

function updateCapacity(type) {
  const map = { single: 1, double: 2, triple: 3 };
  document.getElementById('newRoomCapacity').value = map[type] || 2;
}

async function loadRoomAllocation() {
  await Promise.all([loadRoomStats(), loadRoomsGrid(), loadRoomDropdowns()]);
}

async function loadRoomStats() {
  try {
    const res  = await authFetch(`${API}/rooms/stats`);
    const data = await res.json();
    if (!data.success) return;
    const s = data.stats;
    document.getElementById('roomStats').innerHTML = `
      <div class="stat-card blue">
        <div class="stat-icon">🏠</div>
        <div class="stat-info"><div class="stat-num">${s.total}</div><div class="stat-label">Total Rooms</div></div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">✅</div>
        <div class="stat-info"><div class="stat-num">${s.available}</div><div class="stat-label">Available</div></div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">🔴</div>
        <div class="stat-info"><div class="stat-num">${s.full}</div><div class="stat-label">Full</div></div>
      </div>
      <div class="stat-card amber">
        <div class="stat-icon">🛏️</div>
        <div class="stat-info"><div class="stat-num">${s.vacant}</div><div class="stat-label">Vacant Beds</div></div>
      </div>
    `;
  } catch (err) { console.error('Room stats error', err); }
}

async function loadRoomsGrid(filter = 'all') {
  const el = document.getElementById('roomsGrid');
  el.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const res  = await authFetch(`${API}/rooms`);
    const data = await res.json();
    if (!data.success) return;
    allRoomsData = data.rooms;
    renderRoomsGrid(data.rooms, filter);
  } catch (err) {
    el.innerHTML = '<p class="empty-state">Failed to load rooms.</p>';
  }
}

function renderRoomsGrid(rooms, filter = 'all') {
  const el = document.getElementById('roomsGrid');
  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);
  if (!filtered.length) {
    el.innerHTML = '<p class="empty-state">No rooms found.</p>';
    return;
  }
  el.innerHTML = filtered.map(r => roomCard(r)).join('');
}

function roomCard(r) {
  const fillPct   = r.capacity > 0 ? (r.occupants.length / r.capacity) * 100 : 0;
  const fillColor = fillPct >= 100 ? '#ef4444' : fillPct >= 50 ? '#f59e0b' : '#22c55e';
  const badgeClass = `room-badge room-badge-${r.status}`;
  const statusLabel = { available: '🟢 Available', full: '🔴 Full', maintenance: '🟡 Maintenance' };

  const occupantRows = r.occupants.length
    ? r.occupants.map(s => `
        <div class="occupant-row">
          <div>
            <div class="occupant-name">${s.name}</div>
            <div class="occupant-info">${s.rollNumber} · ${s.course} · ${s.year}</div>
          </div>
          <button class="btn-remove-occupant" onclick="removeStudent('${r._id}','${s._id}','${s.name}')">
            ✕ Remove
          </button>
        </div>`)
      .join('')
    : '<p style="font-size:13px;color:var(--text-muted);margin:6px 0">No students assigned yet.</p>';

  const amenities = r.amenities && r.amenities.length
    ? `<div style="margin-top:8px;font-size:12px;color:var(--text-muted)">✨ ${r.amenities.join(' · ')}</div>`
    : '';

  return `
    <div class="room-card" id="room-card-${r._id}">
      <div class="room-card-header">
        <div>
          <div class="room-number">Room ${r.roomNumber}</div>
          <div class="room-meta">${r.floor} Floor · ${r.type.charAt(0).toUpperCase()+r.type.slice(1)} · ${r.occupants.length}/${r.capacity} beds</div>
        </div>
        <span class="${badgeClass}">${statusLabel[r.status]}</span>
      </div>

      <div class="room-capacity-bar">
        <div class="room-capacity-fill" style="width:${fillPct}%;background:${fillColor}"></div>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">
        ${r.occupants.length} occupied · ${r.capacity - r.occupants.length} vacant
      </div>

      ${amenities}

      <div class="room-occupants">${occupantRows}</div>

      <div class="room-actions">
        <button class="btn-maintenance" onclick="toggleMaintenance('${r._id}','${r.status}')">
          ${r.status === 'maintenance' ? '✅ Mark Available' : '🔧 Maintenance'}
        </button>
        <button class="btn-delete-room" onclick="deleteRoom('${r._id}','${r.roomNumber}')">🗑️</button>
      </div>
    </div>`;
}

async function loadRoomDropdowns() {
  try {
    const [sRes, rRes] = await Promise.all([
      authFetch(`${API}/rooms/unassigned-students`),
      authFetch(`${API}/rooms`)
    ]);
    const sData = await sRes.json();
    const rData = await rRes.json();

    // Student dropdown
    const sSel = document.getElementById('assignStudentId');
    if (sData.success) {
      sSel.innerHTML = '<option value="">Select a student</option>' +
        sData.students.map(s =>
          `<option value="${s._id}">${s.name} · ${s.rollNumber} · Room: ${s.roomNumber}</option>`
        ).join('');
    }

    // Room dropdown (only available rooms)
    const rSel = document.getElementById('assignRoomId');
    if (rData.success) {
      const available = rData.rooms.filter(r => r.status !== 'maintenance' && r.occupants.length < r.capacity);
      rSel.innerHTML = '<option value="">Select a room</option>' +
        available.map(r =>
          `<option value="${r._id}">Room ${r.roomNumber} · ${r.floor} Floor · ${r.occupants.length}/${r.capacity} beds</option>`
        ).join('');
    }
  } catch (err) { console.error('Dropdown error', err); }
}

async function createRoom() {
  const msg = document.getElementById('roomCreateMsg');
  const roomNumber = document.getElementById('newRoomNumber').value.trim();
  const floor      = document.getElementById('newRoomFloor').value.trim();
  const type       = document.getElementById('newRoomType').value;
  const capacity   = document.getElementById('newRoomCapacity').value;
  const amenities  = document.getElementById('newRoomAmenities').value.trim();

  if (!roomNumber || !floor) {
    msg.style.color = '#dc2626';
    msg.textContent = '❌ Room number and floor are required.';
    return;
  }
  try {
    const res  = await authFetch(`${API}/rooms/create`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ roomNumber, floor, type, capacity, amenities })
    });
    const data = await res.json();
    if (data.success) {
      msg.style.color = '#16a34a';
      msg.textContent = '✅ ' + data.message;
      document.getElementById('newRoomNumber').value  = '';
      document.getElementById('newRoomFloor').value   = '';
      document.getElementById('newRoomAmenities').value = '';
      showToast(data.message, 'success');
      loadRoomAllocation();
    } else {
      msg.style.color = '#dc2626';
      msg.textContent = '❌ ' + data.message;
      showToast(data.message, 'error');
    }
  } catch (err) {
    msg.style.color = '#dc2626';
    msg.textContent = '❌ Network error.';
  }
}

async function assignStudent() {
  const studentId = document.getElementById('assignStudentId').value;
  const roomId    = document.getElementById('assignRoomId').value;
  const msg       = document.getElementById('assignMsg');

  if (!studentId || !roomId) {
    msg.style.color = '#dc2626';
    msg.textContent = '❌ Please select both student and room.';
    return;
  }
  try {
    const res  = await authFetch(`${API}/rooms/${roomId}/assign`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ studentId })
    });
    const data = await res.json();
    if (data.success) {
      msg.style.color = '#16a34a';
      msg.textContent = '✅ ' + data.message;
      showToast(data.message, 'success');
      loadRoomAllocation();
    } else {
      msg.style.color = '#dc2626';
      msg.textContent = '❌ ' + data.message;
      showToast(data.message, 'error');
    }
  } catch (err) {
    msg.style.color = '#dc2626';
    msg.textContent = '❌ Network error.';
  }
}

async function removeStudent(roomId, studentId, studentName) {
  if (!confirm(`Remove ${studentName} from this room?`)) return;
  try {
    const res  = await authFetch(`${API}/rooms/${roomId}/remove`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ studentId })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadRoomAllocation();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Network error.', 'error');
  }
}

async function toggleMaintenance(roomId, currentStatus) {
  const newStatus = currentStatus === 'maintenance' ? 'available' : 'maintenance';
  try {
    const res  = await authFetch(`${API}/rooms/${roomId}/status`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, newStatus === 'maintenance' ? 'warning' : 'success');
      loadRoomAllocation();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Network error.', 'error');
  }
}

async function deleteRoom(roomId, roomNumber) {
  if (!confirm(`Delete Room ${roomNumber}? This cannot be undone.`)) return;
  try {
    const res  = await authFetch(`${API}/rooms/${roomId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadRoomAllocation();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Network error.', 'error');
  }
}

function filterRooms(filter, btnEl) {
  document.querySelectorAll('#page-roomAllocation .filter-btn')
    .forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderRoomsGrid(allRoomsData, filter);
}

function searchRooms(query) {
  const filtered = allRoomsData.filter(r =>
    r.roomNumber.toLowerCase().includes(query.toLowerCase()) ||
    r.floor.toLowerCase().includes(query.toLowerCase())
  );
  renderRoomsGrid(filtered);
}