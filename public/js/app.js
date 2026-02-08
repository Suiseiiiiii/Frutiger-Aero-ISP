// ==================== GLOBAL STATE ====================

const API_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let isAdmin = localStorage.getItem('isAdmin') === 'true';
let darkMode = localStorage.getItem('darkMode') === 'true';

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

function toggleDarkMode() {
  darkMode = !darkMode;
  localStorage.setItem('darkMode', darkMode);
  applyDarkMode();
}

function applyDarkMode() {
  const html = document.documentElement;
  if (darkMode) {
    html.style.filter = 'invert(1) hue-rotate(180deg)';
    html.classList.add('dark-mode');
  } else {
    html.style.filter = 'none';
    html.classList.remove('dark-mode');
  }
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
    if (page === 'admin') initAdminPanel();
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

  let isAdminMode = false;

  // Form submission handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted. isAdminMode:', isAdminMode);
    
    if (isAdminMode) {
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      console.log('Admin login attempt. Username:', username, 'Password length:', password.length);
      
      if (!username || !password) {
        showAlert('Username and password required', 'danger');
        return;
      }
      await handleAdminLogin(username, password);
    } else {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      console.log('User login attempt. Email:', email, 'Password length:', password.length);
      
      if (!email || !password) {
        showAlert('Email and password required', 'danger');
        return;
      }
      await handleLogin(email, password);
    }
  };

  form.addEventListener('submit', handleFormSubmit);

  // Admin login toggle
  const adminCheckbox = document.getElementById('login-as-admin');
  const emailField = document.getElementById('login-email-field');
  const usernameField = document.getElementById('login-username-field');
  const emailInput = document.getElementById('login-email');
  const usernameInput = document.getElementById('login-username');

  if (adminCheckbox) {
    adminCheckbox.addEventListener('change', (e) => {
      isAdminMode = e.target.checked;
      console.log('Admin checkbox changed. isAdminMode:', isAdminMode);
      
      if (isAdminMode) {
        if (emailField) emailField.style.display = 'none';
        if (usernameField) usernameField.style.display = 'block';
        if (emailInput) emailInput.removeAttribute('required');
        if (usernameInput) usernameInput.setAttribute('required', 'required');
      } else {
        if (emailField) emailField.style.display = 'block';
        if (usernameField) usernameField.style.display = 'none';
        if (emailInput) emailInput.setAttribute('required', 'required');
        if (usernameInput) usernameInput.removeAttribute('required');
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
        <div class="panel-title">Account Information</div>
        <form id="account-form" style="display: grid; gap: 20px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="form-group">
              <label for="account-username">Username</label>
              <input type="text" id="account-username" value="${user.username}" required>
            </div>
            <div class="form-group">
              <label for="account-email">Email Address</label>
              <input type="email" id="account-email" value="${user.email}" required>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="form-group">
              <label for="account-phone">Phone Number</label>
              <input type="tel" id="account-phone" value="${user.phone || ''}" placeholder="Optional">
            </div>
            <div class="form-group">
              <label for="account-plan">Plan</label>
              <select id="account-plan" required>
                <option value="basic" ${user.plan === 'basic' ? 'selected' : ''}>Basic - £19.99/month</option>
                <option value="professional" ${user.plan === 'professional' ? 'selected' : ''}>Professional - £39.99/month</option>
                <option value="enterprise" ${user.plan === 'enterprise' ? 'selected' : ''}>Enterprise - £79.99/month</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="form-group">
              <label for="account-status">Account Status</label>
              <select id="account-status" required>
                <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
              </select>
            </div>
            <div class="form-group">
              <label for="account-consent">
                <input type="checkbox" id="account-consent" ${user.data_consent ? 'checked' : ''}>
                I agree to data collection for service improvement
              </label>
            </div>
          </div>

          <div style="display: grid; gap: 10px;">
            <div style="background: #f0f0f0; padding: 15px; border-radius: 3px; border-left: 4px solid #003da5;">
              <strong>Member Since:</strong> ${formatDate(user.created_at)}
            </div>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 3px; border-left: 4px solid #003da5;">
              <strong>Account Status:</strong> <span class="badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}">${user.status}</span>
            </div>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button type="submit" class="btn btn-primary">Save Changes</button>
            <button type="button" class="btn" onclick="navigateTo('home'); return false;">Cancel</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('account-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateUserProfile({
        username: document.getElementById('account-username').value,
        email: document.getElementById('account-email').value,
        phone: document.getElementById('account-phone').value,
        plan: document.getElementById('account-plan').value,
        status: document.getElementById('account-status').value,
        data_consent: document.getElementById('account-consent').checked ? 1 : 0
      });
    });
  } catch (error) {
    const container = document.getElementById('account-content');
    if (container) {
      container.innerHTML = '<div class="alert alert-danger">Failed to load account details</div>';
    }
  }
}

async function updateUserProfile(data) {
  try {
    await apiCall('/user/profile', 'PUT', data);
    showAlert('Profile updated successfully!', 'success');
    currentUser = data;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    await initAccountPage();
  } catch (error) {
    showAlert('Failed to update profile: ' + error.message, 'danger');
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

  console.log('Initializing admin panel...');

  // Initialize tabs
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tabName = tab.getAttribute('data-tab');
      console.log('Switching to tab:', tabName);
      
      const contents = document.querySelectorAll('.tab-content');
      contents.forEach(c => c.classList.remove('active'));
      
      const activeContent = document.getElementById(`tab-${tabName}`);
      if (activeContent) {
        activeContent.classList.add('active');
      } else {
        console.warn('Tab content not found:', `tab-${tabName}`);
      }

      if (tabName === 'overview') loadAdminOverview();
      else if (tabName === 'users') loadAdminUsers();
      else if (tabName === 'tickets') loadAdminTickets();
      else if (tabName === 'logs') loadAdminLogs();
      else if (tabName === 'uptime') loadAdminUptime();
    });
  });

  console.log('Loading initial admin overview...');
  loadAdminOverview();
  initAdminTerminal();
}

async function loadAdminOverview() {
  try {
    console.log('Loading admin overview...');
    const stats = await apiCall('/admin/statistics', 'GET');
    const uptime = await apiCall('/admin/uptime', 'GET');
    const activityLogs = await apiCall('/admin/activity-logs', 'GET');

    const container = document.getElementById('tab-overview');
    if (!container) {
      console.error('tab-overview container not found');
      return;
    }

    // Get recent logs (last 10)
    const recentLogs = activityLogs.slice(0, 10);

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

      <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
        <h3 style="color: #003da5; margin-bottom: 15px;">Server Control</h3>
        <div class="grid grid-2" style="gap: 20px;">
          <button class="btn btn-primary" style="padding: 12px;" onclick="toggleServerStatus()">
            ⏻ Server Status: ONLINE
          </button>
          <button class="btn" style="padding: 12px;" onclick="refreshAdminOverview()">
            ↻ Refresh Overview
          </button>
        </div>
      </div>

      <div style="margin-top: 30px;">
        <h3 style="color: #003da5; margin-bottom: 15px;">Recent Activity Log</h3>
        <div id="live-log-container" style="background: #1a1a1a; color: #00ff00; font-family: 'Courier New', monospace; font-size: 12px; padding: 15px; border-radius: 3px; max-height: 300px; overflow-y: auto; margin-bottom: 10px;">
          ${recentLogs.map(log => `
            <div style="margin-bottom: 5px; border-bottom: 1px solid #333; padding-bottom: 5px;">
              <span style="color: #888;">[${new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span style="color: #ffff00;">${log.username || 'system'}:</span>
              <span>${log.action}</span>
              ${log.details ? `<div style="color: #00ff99; margin-left: 20px; font-size: 11px;">${log.details}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <button class="btn" onclick="clearLiveLog()" style="font-size: 12px;">Clear Log</button>
      </div>

      <div style="margin-top: 30px;">
        <h3 style="color: #003da5; margin-bottom: 15px;">Server Uptime Chart</h3>
        <div id="uptime-chart" style="height: 300px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 3px; display: flex; align-items: flex-end; padding: 10px; gap: 2px;">
          <div style="text-align: center; color: #666; width: 100%;">Loading chart...</div>
        </div>
      </div>
    `;

    // Load uptime chart
    loadUptimeChart();
    
    console.log('Admin overview loaded successfully');
  } catch (error) {
    console.error('Failed to load overview:', error);
    showAlert('Failed to load overview: ' + error.message, 'danger');
    const container = document.getElementById('tab-overview');
    if (container) {
      container.innerHTML = `<div class="alert alert-danger">Failed to load overview. Check console for details.</div>`;
    }
  }
}

async function refreshAdminOverview() {
  await loadAdminOverview();
  showAlert('Overview refreshed', 'success');
}

async function loadUptimeChart() {
  try {
    const history = await apiCall('/admin/uptime-history', 'GET');
    const chartContainer = document.getElementById('uptime-chart');
    if (!chartContainer) return;

    const maxUptime = 100;
    const minUptime = 90;
    const range = maxUptime - minUptime;

    let html = '';
    history.forEach(item => {
      const percentage = item.uptime;
      const height = ((percentage - minUptime) / range) * 250 + 20;
      html += `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
          <div style="width: 100%; height: ${height}px; background: #4a9eff; border-radius: 3px; transition: all 0.2s;" 
               title="${percentage}% - ${new Date(item.timestamp).toLocaleTimeString()}"></div>
          <div style="font-size: 10px; margin-top: 5px; color: #666;">${percentage}%</div>
        </div>
      `;
    });

    chartContainer.innerHTML = html;
  } catch (error) {
    console.error('Failed to load uptime chart:', error);
  }
}

async function toggleServerStatus() {
  const confirmed = confirm('This would toggle the server status. Are you sure? (Currently disabled for safety)');
  if (confirmed) {
    showAlert('Server control is disabled for safety in development.', 'info');
  }
}

function clearLiveLog() {
  const logContainer = document.getElementById('live-log-container');
  if (logContainer) {
    logContainer.innerHTML = '<div style="color: #888;">Log cleared</div>';
  }
}

async function loadAdminUsers() {
  try {
    console.log('Loading admin users...');
    const users = await apiCall('/admin/users', 'GET');
    const container = document.getElementById('tab-users');
    if (!container) {
      console.error('tab-users container not found');
      return;
    }

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
    console.log('Admin users loaded successfully');
  } catch (error) {
    console.error('Failed to load users:', error);
    showAlert('Failed to load users: ' + error.message, 'danger');
    const container = document.getElementById('tab-users');
    if (container) {
      container.innerHTML = `<div class="alert alert-danger">Failed to load users. Check console for details.</div>`;
    }
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

// Store pagination state
let ticketsPaginationState = { page: 1, pageSize: 12, allTickets: [] };

async function loadAdminTickets() {
  try {
    console.log('Loading admin tickets...');
    const tickets = await apiCall('/admin/support-tickets', 'GET');
    ticketsPaginationState.allTickets = tickets;
    ticketsPaginationState.page = 1;
    displayTicketsPage();
  } catch (error) {
    console.error('Failed to load tickets:', error);
    showAlert('Failed to load tickets: ' + error.message, 'danger');
  }
}

function displayTicketsPage() {
  const container = document.getElementById('tab-tickets');
  if (!container) return;

  const { page, pageSize, allTickets } = ticketsPaginationState;
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageTickets = allTickets.slice(startIdx, endIdx);
  const totalPages = Math.ceil(allTickets.length / pageSize);

  let html = `
    <div style="margin-bottom: 20px; font-size: 14px; color: #666;">
      Showing ${startIdx + 1}-${Math.min(endIdx, allTickets.length)} of ${allTickets.length} tickets
    </div>
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
        ${pageTickets.map(ticket => `
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
              <button class="btn" style="font-size: 12px;" onclick="viewTicketDetails(${ticket.id}, '${ticket.subject.replace(/'/g, "\\'")}', '${ticket.message.replace(/'/g, "\\'")}')">View</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
      ${page > 1 ? `<button class="btn" onclick="previousTicketPage()">← Previous</button>` : ''}
      ${page < totalPages ? `<button class="btn btn-primary" onclick="nextTicketPage()">Next →</button>` : ''}
      <span style="padding: 8px 12px; background: #f0f0f0; border-radius: 3px;">Page ${page}/${totalPages}</span>
    </div>
  `;

  container.innerHTML = html;
}

function nextTicketPage() {
  const { page, pageSize, allTickets } = ticketsPaginationState;
  const totalPages = Math.ceil(allTickets.length / pageSize);
  if (page < totalPages) {
    ticketsPaginationState.page++;
    displayTicketsPage();
  }
}

function previousTicketPage() {
  if (ticketsPaginationState.page > 1) {
    ticketsPaginationState.page--;
    displayTicketsPage();
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
    const logs = await apiCall('/admin/activity-logs', 'GET');
    const container = document.getElementById('tab-logs');
    if (!container) return;

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #003da5; margin-bottom: 10px;">Activity Log Terminal</h3>
        <div id="admin-terminal" style="background: #1a1a1a; color: #00ff00; font-family: 'Courier New', monospace; font-size: 12px; padding: 15px; border-radius: 3px; height: 400px; overflow-y: auto; border: 2px solid #00ff00;">
          ${logs.map(log => `
            <div style="margin-bottom: 5px; border-bottom: 1px solid #333; padding-bottom: 5px;">
              <span style="color: #888;">[${new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span style="color: #ffff00;">${log.username || 'system'}@admin:</span>
              <span style="color: #00ff00;">$ ${log.action}</span>
              ${log.details ? `<div style="color: #00ff99; margin-left: 20px; font-size: 11px;">${log.details}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <div style="margin-top: 10px;">
          <button class="btn" onclick="clearAdminTerminal()" style="font-size: 12px;">Clear Terminal</button>
          <button class="btn btn-primary" onclick="refreshAdminLogs()" style="font-size: 12px;">Refresh Logs</button>
        </div>
      </div>

      <h3 style="color: #003da5; margin-bottom: 10px; margin-top: 30px;">Detailed Activity Log</h3>
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
    showAlert('Failed to load logs: ' + error.message, 'danger');
  }
}

async function refreshAdminLogs() {
  await loadAdminLogs();
  showAlert('Activity logs refreshed', 'success');
}

function clearAdminTerminal() {
  const terminal = document.getElementById('admin-terminal');
  if (terminal) {
    terminal.innerHTML = '<div style="color: #00ff00;">Terminal cleared. Ready for commands.</div>';
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
  applyDarkMode();
  showDebugButtonIfAdmin();

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

// ==================== ADMIN TERMINAL ====================

function initAdminTerminal() {
  const terminalContainer = document.getElementById('admin-terminal-container');
  if (!terminalContainer) return;

  terminalContainer.innerHTML = `
    <div class="terminal-header">
      <h3 style="margin: 0; color: #00ff00; font-family: 'Courier New';">System Terminal</h3>
      <button class="btn" style="padding: 5px 10px; font-size: 12px;" onclick="clearAdminTerminal()">Clear</button>
    </div>
    <div id="terminal-output" class="terminal-output"></div>
    <div class="terminal-input-container">
      <span style="color: #00ff00; font-family: 'Courier New';">admin@isp:~$ </span>
      <input type="text" id="terminal-input" class="terminal-input" placeholder="Type 'help' for commands" autocomplete="off">
    </div>
  `;

  const input = document.getElementById('terminal-input');
  const output = document.getElementById('terminal-output');

  input.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      const command = input.value.trim();
      input.value = '';

      if (!command) return;

      // Display command
      output.innerHTML += `<div style="color: #00ff00; font-family: 'Courier New'; margin: 5px 0;">admin@isp:~$ ${command}</div>`;

      try {
        const response = await apiCall('/admin/terminal/execute', 'POST', { command });
        
        if (response.success) {
          const lines = response.output.split('\n');
          lines.forEach(line => {
            output.innerHTML += `<div style="color: #0f0; font-family: 'Courier New'; margin: 2px 0; white-space: pre-wrap;">${escapeHtml(line)}</div>`;
          });
        } else {
          output.innerHTML += `<div style="color: #ff4444; font-family: 'Courier New'; margin: 5px 0;">Error: ${response.error}</div>`;
        }
      } catch(error) {
        output.innerHTML += `<div style="color: #ff4444; font-family: 'Courier New'; margin: 5px 0;">Error: ${error.message}</div>`;
      }

      output.scrollTop = output.scrollHeight;
    }
  });

  input.focus();
}

function clearAdminTerminal() {
  const output = document.getElementById('terminal-output');
  if (output) output.innerHTML = '';
  const input = document.getElementById('terminal-input');
  if (input) input.focus();
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function showDebugButtonIfAdmin() {
  const debugButton = document.getElementById('debug-button');
  if (debugButton) {
    debugButton.style.display = isAdmin ? 'block' : 'none';
  }
}

// Expose navigation helper for inline handlers and debugging
window.navigateTo = navigateTo;

// Expose admin functions for inline onclick handlers
window.viewUserDetails = viewUserDetails;
window.toggleUserStatus = toggleUserStatus;
window.updateTicketStatus = updateTicketStatus;
window.initAdminTerminal = initAdminTerminal;
window.clearAdminTerminal = clearAdminTerminal;
window.viewTicketDetails = viewTicketDetails;
window.nextTicketPage = nextTicketPage;
window.previousTicketPage = previousTicketPage;
window.closeModal = closeModal;
window.openModal = openModal;
window.toggleServerStatus = toggleServerStatus;
window.clearLiveLog = clearLiveLog;
window.refreshAdminOverview = refreshAdminOverview;
window.clearAdminTerminal = clearAdminTerminal;
window.refreshAdminLogs = refreshAdminLogs;

// Debug: Log that app.js has loaded
console.log('✅ app.js loaded successfully! navigateTo available.');
console.log('Current user:', currentUser);
console.log('Auth token:', authToken ? 'Present' : 'None');
console.log('Admin functions exposed:', !!window.viewUserDetails);
