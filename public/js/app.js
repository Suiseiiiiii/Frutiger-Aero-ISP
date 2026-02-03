// ==================== GLOBAL STATE ====================

const API_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let isAdmin = localStorage.getItem('isAdmin') === 'true';

// ==================== UTILITY FUNCTIONS ====================

function showAlert(message, type = 'info') {
  const alertContainer = document.getElementById('alert-container');
  if (!alertContainer) return;

  const alertId = 'alert-' + Date.now();
  const icons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    danger: '✕'
  };

  const alertHTML = `
    <div class="alert alert-${type}" id="${alertId}">
      <span class="alert-icon">${icons[type] || icons.info}</span>
      <span>${message}</span>
    </div>
  `;

  alertContainer.insertAdjacentHTML('beforeend', alertHTML);

  setTimeout(() => {
    const element = document.getElementById(alertId);
    if (element) element.remove();
  }, 5000);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString();
}

function getAuthHeader() {
  if (!authToken) return {};
  return { 'Authorization': `Bearer ${authToken}` };
}

async function apiCall(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    };

    if (data) options.body = JSON.stringify(data);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'API request failed');
    }

    return result;
  } catch (error) {
    showAlert(error.message, 'danger');
    throw error;
  }
}

// ==================== NAVIGATION & ROUTING ====================

function navigateTo(page) {
  console.debug('navigateTo called:', page);
  const pages = ['home', 'login', 'signup', 'plans', 'support', 'account', 'admin', 'admin-users', 'admin-tickets', 'admin-logs'];
  
  pages.forEach(p => {
    const element = document.getElementById(`page-${p}`);
    if (element) element.style.display = 'none';
  });

  const targetPage = document.getElementById(`page-${page}`);
  if (targetPage) {
    targetPage.style.display = 'block';
    window.scrollTo(0, 0);

    // Call page-specific initialization
    if (page === 'account' && currentUser) initAccountPage();
    if (page === 'plans') loadPlans();
    if (page === 'support') initSupportPage();
    if (page === 'admin-users') loadAdminUsers();
    if (page === 'admin-tickets') loadAdminTickets();
    if (page === 'admin-logs') loadAdminLogs();
  } else {
    console.error(`Page not found: page-${page}`);
  }
}

function updateNavigation() {
  const nav = document.querySelector('nav ul');
  if (!nav) return;

  let navHTML = '<li><a href="#" onclick="navigateTo(\'home\'); return false;">Home</a></li>';
  navHTML += '<li><a href="#" onclick="navigateTo(\'plans\'); return false;">Plans</a></li>';
  navHTML += '<li><a href="#" onclick="navigateTo(\'support\'); return false;">Support</a></li>';

  if (currentUser && !isAdmin) {
    navHTML += '<li><a href="#" onclick="navigateTo(\'account\'); return false;">Account</a></li>';
    navHTML += `<li><button class="nav-button" onclick="logout()">Logout (${currentUser.username})</button></li>`;
  } else if (isAdmin) {
    navHTML += '<li><a href="#" onclick="navigateTo(\'admin\'); return false;">Admin Panel</a></li>';
    navHTML += `<li><button class="nav-button" onclick="logout()">Admin Logout</button></li>`;
  } else {
    navHTML += '<li><button class="nav-button-primary" onclick="navigateTo(\'login\'); return false;">Login</button></li>';
    navHTML += '<li><button class="nav-button-primary" onclick="navigateTo(\'signup\'); return false;">Sign Up</button></li>';
  }

  nav.innerHTML = navHTML;
}

// ==================== AUTHENTICATION ====================

async function handleLogin(email, password) {
  try {
    const result = await apiCall('/auth/login', 'POST', { email, password });
    authToken = result.token;
    currentUser = result.user;
    isAdmin = false;

    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('isAdmin', 'false');

    showAlert('Login successful!', 'success');
    updateNavigation();
    navigateTo('home');
  } catch (error) {
    showAlert('Login failed: ' + error.message, 'danger');
  }
}

async function handleAdminLogin(username, password) {
  try {
    const result = await apiCall('/auth/admin-login', 'POST', { username, password });
    authToken = result.token;
    currentUser = result.admin;
    isAdmin = true;

    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('isAdmin', 'true');

    showAlert('Admin login successful!', 'success');
    updateNavigation();
    navigateTo('admin');
  } catch (error) {
    showAlert('Admin login failed: ' + error.message, 'danger');
  }
}

async function handleSignup(username, email, password, plan, dataConsent) {
  try {
    if (password.length < 8) {
      showAlert('Password must be at least 8 characters', 'warning');
      return;
    }

    if (!dataConsent) {
      showAlert('You must agree to data processing to continue', 'warning');
      return;
    }

    const result = await apiCall('/auth/signup', 'POST', {
      username,
      email,
      password,
      plan,
      data_consent: dataConsent ? 1 : 0
    });

    authToken = result.token;
    currentUser = { id: username, username, email, plan };
    isAdmin = false;

    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('isAdmin', 'false');

    showAlert('Account created successfully!', 'success');
    updateNavigation();
    navigateTo('home');
  } catch (error) {
    showAlert('Signup failed: ' + error.message, 'danger');
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  isAdmin = false;

  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('isAdmin');

  updateNavigation();
  navigateTo('home');
  showAlert('Logged out successfully', 'success');
}

// ==================== HOME PAGE ====================

function initHomePage() {
  // Already initialized
}

// ==================== LOGIN PAGE ====================

function initLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    await handleLogin(email, password);
  });

  // Admin login toggle
  const adminCheckbox = document.getElementById('login-as-admin');
  const emailField = document.getElementById('login-email-field');
  const usernameField = document.getElementById('login-username-field');

  if (adminCheckbox) {
    adminCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        if (emailField) emailField.style.display = 'none';
        if (usernameField) usernameField.style.display = 'block';
        document.getElementById('login-form').onsubmit = async (e) => {
          e.preventDefault();
          const username = document.getElementById('login-username').value;
          const password = document.getElementById('login-password').value;
          await handleAdminLogin(username, password);
        };
      } else {
        if (emailField) emailField.style.display = 'block';
        if (usernameField) usernameField.style.display = 'none';
        document.getElementById('login-form').onsubmit = async (e) => {
          e.preventDefault();
          const email = document.getElementById('login-email').value;
          const password = document.getElementById('login-password').value;
          await handleLogin(email, password);
        };
      }
    });
  }
}

// ==================== SIGNUP PAGE ====================

function initSignupPage() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const plan = document.getElementById('signup-plan').value;
    const dataConsent = document.getElementById('signup-consent').checked;

    await handleSignup(username, email, password, plan, dataConsent);
  });
}

// ==================== PLANS PAGE ====================

async function loadPlans() {
  try {
    const plans = await apiCall('/plans', 'GET');
    const container = document.getElementById('plans-grid');
    if (!container) return;

    container.innerHTML = plans.map(plan => `
      <div class="card">
        <div class="card-header">${plan.name}</div>
        <div class="card-price">${plan.price}<span style="font-size: 16px; color: #666;">/month</span></div>
        <div class="card-features">
          <li>Speed: ${plan.speed}</li>
          <li>Data: ${plan.data}</li>
          <li>24/7 Support</li>
          <li>No Setup Fees</li>
        </div>
        <button class="btn btn-primary" onclick="selectPlan('${plan.id}')" style="width: 100%;">Choose Plan</button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load plans:', error);
  }
}

function selectPlan(planId) {
  if (!authToken) {
    showAlert('Please login first', 'info');
    navigateTo('login');
    return;
  }

  showAlert(`Plan ${planId} selected! This would be processed in production.`, 'success');
}

// ==================== ACCOUNT PAGE ====================

async function initAccountPage() {
  if (!currentUser) {
    navigateTo('login');
    return;
  }

  try {
    const user = await apiCall('/user/profile', 'GET');
    const container = document.getElementById('account-content');
    if (!container) return;

    container.innerHTML = `
      <div class="panel">
        <div class="panel-title">Your Account Details</div>
        <table>
          <tr>
            <td><strong>Username:</strong></td>
            <td>${user.username}</td>
          </tr>
          <tr>
            <td><strong>Email:</strong></td>
            <td>${user.email}</td>
          </tr>
          <tr>
            <td><strong>Plan:</strong></td>
            <td><span class="badge badge-info">${user.plan}</span></td>
          </tr>
          <tr>
            <td><strong>Status:</strong></td>
            <td><span class="badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}">${user.status}</span></td>
          </tr>
          <tr>
            <td><strong>Member Since:</strong></td>
            <td>${formatDate(user.created_at)}</td>
          </tr>
          <tr>
            <td><strong>Data Consent:</strong></td>
            <td>${user.data_consent ? '✓ Agreed' : '✗ Not agreed'}</td>
          </tr>
        </table>
        <button class="btn btn-primary mt-20" onclick="navigateTo('home')">Back to Home</button>
      </div>
    `;
  } catch (error) {
    const container = document.getElementById('account-content');
    if (container) {
      container.innerHTML = '<div class="alert alert-danger">Failed to load account details</div>';
    }
  }
}

// ==================== SUPPORT PAGE ====================

async function initSupportPage() {
  const form = document.getElementById('support-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!authToken) {
      showAlert('Please login first', 'info');
      navigateTo('login');
      return;
    }

    const subject = document.getElementById('support-subject').value;
    const message = document.getElementById('support-message').value;

    try {
      await apiCall('/support/ticket', 'POST', { subject, message });
      showAlert('Support ticket created successfully!', 'success');
      form.reset();
      await loadUserTickets();
    } catch (error) {
      showAlert('Failed to create ticket: ' + error.message, 'danger');
    }
  });

  await loadUserTickets();
}

async function loadUserTickets() {
  if (!authToken) return;

  try {
    const tickets = await apiCall('/support/tickets', 'GET');
    const container = document.getElementById('user-tickets');
    if (!container) return;

    if (tickets.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">No support tickets yet</p>';
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${tickets.map(ticket => `
            <tr>
              <td>#${ticket.id}</td>
              <td>${ticket.subject}</td>
              <td><span class="badge ${ticket.status === 'open' ? 'badge-warning' : 'badge-success'}">${ticket.status}</span></td>
              <td>${formatDate(ticket.created_at)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Failed to load tickets:', error);
  }
}

// ==================== ADMIN PANEL ====================

function initAdminPanel() {
  if (!isAdmin) {
    navigateTo('login');
    return;
  }

  // Initialize tabs
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tabName = tab.getAttribute('data-tab');
      const contents = document.querySelectorAll('.tab-content');
      contents.forEach(c => c.classList.remove('active'));
      
      const activeContent = document.getElementById(`tab-${tabName}`);
      if (activeContent) activeContent.classList.add('active');

      if (tabName === 'overview') loadAdminOverview();
      if (tabName === 'users') loadAdminUsers();
      if (tabName === 'tickets') loadAdminTickets();
      if (tabName === 'logs') loadAdminLogs();
      if (tabName === 'uptime') loadAdminUptime();
    });
  });

  loadAdminOverview();
}

async function loadAdminOverview() {
  try {
    const stats = await apiCall('/admin/statistics', 'GET');
    const uptime = await apiCall('/admin/uptime', 'GET');

    const container = document.getElementById('tab-overview');
    if (!container) return;

    container.innerHTML = `
      <div class="grid grid-2">
        <div class="card">
          <div class="card-header">Total Users</div>
          <div class="card-price">${stats.total_users}</div>
          <p style="color: #666;">Active: ${stats.active_users}</p>
        </div>
        <div class="card">
          <div class="card-header">Open Support Tickets</div>
          <div class="card-price">${stats.open_support_tickets}</div>
          <p style="color: #666;">Awaiting Response</p>
        </div>
        <div class="card">
          <div class="card-header">Server Uptime</div>
          <div class="card-price" style="font-size: 20px;">${uptime.uptime_formatted}</div>
          <p style="color: #666;">${uptime.server_time}</p>
        </div>
        <div class="card">
          <div class="card-header">System Status</div>
          <div class="card-price" style="font-size: 20px; color: #16a34a;">✓ ONLINE</div>
          <p style="color: #666;">All systems operational</p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Failed to load overview:', error);
  }
}

async function loadAdminUsers() {
  try {
    const users = await apiCall('/admin/users', 'GET');
    const container = document.getElementById('tab-users');
    if (!container) return;

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => `
            <tr>
              <td>${user.username}</td>
              <td>${user.email}</td>
              <td><span class="badge badge-info">${user.plan}</span></td>
              <td><span class="badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}">${user.status}</span></td>
              <td>${formatDate(user.created_at)}</td>
              <td>
                <button class="btn" style="font-size: 12px;" onclick="viewUserDetails(${user.id})">View</button>
                <button class="btn ${user.status === 'active' ? 'btn-danger' : 'btn-success'}" style="font-size: 12px;" onclick="toggleUserStatus(${user.id}, '${user.status}')">
                  ${user.status === 'active' ? 'Suspend' : 'Reactivate'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Failed to load users:', error);
  }
}

async function viewUserDetails(userId) {
  try {
    const user = await apiCall(`/admin/user/${userId}`, 'GET');
    const modal = document.getElementById('modal');
    const modalBody = document.querySelector('.modal-body');

    if (modal && modalBody) {
      modalBody.innerHTML = `
        <table style="margin: 0;">
          <tr>
            <td><strong>Username:</strong></td>
            <td>${user.username}</td>
          </tr>
          <tr>
            <td><strong>Email:</strong></td>
            <td>${user.email}</td>
          </tr>
          <tr>
            <td><strong>Plan:</strong></td>
            <td><span class="badge badge-info">${user.plan}</span></td>
          </tr>
          <tr>
            <td><strong>Status:</strong></td>
            <td><span class="badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}">${user.status}</span></td>
          </tr>
          <tr>
            <td><strong>Member Since:</strong></td>
            <td>${formatDate(user.created_at)}</td>
          </tr>
          <tr>
            <td><strong>Data Consent:</strong></td>
            <td>${user.data_consent ? '✓ Agreed' : '✗ Not agreed'}</td>
          </tr>
        </table>
      `;

      document.querySelector('.modal-title').textContent = `User: ${user.username}`;
      modal.style.display = 'block';
    }
  } catch (error) {
    showAlert('Failed to load user details: ' + error.message, 'danger');
  }
}

async function toggleUserStatus(userId, currentStatus) {
  try {
    const action = currentStatus === 'active' ? 'suspend' : 'reactivate';
    await apiCall(`/admin/user/${userId}/${action}`, 'POST');
    showAlert(`User ${action}ed successfully`, 'success');
    await loadAdminUsers();
  } catch (error) {
    showAlert('Failed to update user: ' + error.message, 'danger');
  }
}

async function loadAdminTickets() {
  try {
    const tickets = await apiCall('/admin/support-tickets', 'GET');
    const container = document.getElementById('tab-tickets');
    if (!container) return;

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Username</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${tickets.map(ticket => `
            <tr>
              <td>#${ticket.id}</td>
              <td>${ticket.username || 'Unknown'}</td>
              <td>${ticket.subject}</td>
              <td>
                <select style="padding: 4px; border-radius: 3px;" onchange="updateTicketStatus(${ticket.id}, this.value)">
                  <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
                  <option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                  <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                  <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Closed</option>
                </select>
              </td>
              <td>${formatDate(ticket.created_at)}</td>
              <td>
                <button class="btn" style="font-size: 12px;" onclick="viewTicketDetails(${ticket.id}, '${ticket.subject}', '${ticket.message}')">View</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Failed to load tickets:', error);
  }
}

function viewTicketDetails(ticketId, subject, message) {
  const modal = document.getElementById('modal');
  const modalBody = document.querySelector('.modal-body');

  if (modal && modalBody) {
    modalBody.innerHTML = `
      <div>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p style="background: #f5f5f5; padding: 10px; border-radius: 3px; margin: 10px 0;">${message}</p>
      </div>
    `;

    document.querySelector('.modal-title').textContent = `Ticket #${ticketId}`;
    modal.style.display = 'block';
  }
}

async function updateTicketStatus(ticketId, newStatus) {
  try {
    await apiCall(`/admin/support-ticket/${ticketId}`, 'PUT', { status: newStatus });
    showAlert('Ticket updated successfully', 'success');
    await loadAdminTickets();
  } catch (error) {
    showAlert('Failed to update ticket: ' + error.message, 'danger');
  }
}

async function loadAdminLogs() {
  try {
    const logs = await apiCall('/admin/logs', 'GET');
    const container = document.getElementById('tab-logs');
    if (!container) return;

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Admin</th>
            <th>Action</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(log => `
            <tr>
              <td>${formatDate(log.timestamp)}</td>
              <td>${log.username || 'System'}</td>
              <td><span class="badge badge-info">${log.action}</span></td>
              <td>${log.details || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Failed to load logs:', error);
  }
}

async function loadAdminUptime() {
  try {
    const uptime = await apiCall('/admin/uptime', 'GET');
    const container = document.getElementById('tab-uptime');
    if (!container) return;

    container.innerHTML = `
      <div class="panel">
        <div class="panel-title">Server Uptime Information</div>
        <table>
          <tr>
            <td><strong>Uptime:</strong></td>
            <td>${uptime.uptime_formatted}</td>
          </tr>
          <tr>
            <td><strong>Total Seconds:</strong></td>
            <td>${Math.floor(uptime.uptime_seconds)}</td>
          </tr>
          <tr>
            <td><strong>Current Server Time:</strong></td>
            <td>${new Date(uptime.server_time).toLocaleString('en-GB')}</td>
          </tr>
          <tr>
            <td><strong>Status:</strong></td>
            <td><span class="badge badge-success">✓ ONLINE</span></td>
          </tr>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Failed to load uptime:', error);
  }
}

// ==================== MODAL FUNCTIONS ====================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'block';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

window.onclick = function(event) {
  const modal = document.getElementById('modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
  updateNavigation();

  if (currentUser && !isAdmin) {
    navigateTo('home');
  } else if (isAdmin) {
    navigateTo('admin');
  } else {
    navigateTo('home');
  }

  // Initialize page-specific handlers
  initLoginPage();
  initSignupPage();
  initSupportPage();

  if (currentUser && isAdmin) {
    initAdminPanel();
  }
});

// Expose navigation helper for inline handlers and debugging
window.navigateTo = navigateTo;

// Debug: Log that app.js has loaded
console.log('✅ app.js loaded successfully! navigateTo available.');
console.log('Current user:', currentUser);
console.log('Auth token:', authToken ? 'Present' : 'None');
