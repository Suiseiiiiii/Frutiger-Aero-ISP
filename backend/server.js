const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-change-in-production-12345';

// ==================== SECURITY MIDDLEWARE ====================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // Allow inline scripts for onclick handlers
      scriptSrcAttr: ["'unsafe-inline'"],        // Allow inline event handlers (onclick, etc.)
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  }
}));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting - General
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Rate limiting - Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again after 15 minutes.'
});

// Rate limiting - Signup
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50, // Increased for testing
  message: 'Too many signup attempts from this IP, please try again later.'
});

app.use(limiter);

// ==================== DATABASE INITIALIZATION ====================
const dbPath = path.join(__dirname, 'db/isp.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

// Initialize database tables
const initDatabase = () => {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        plan TEXT DEFAULT 'basic',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_consent INTEGER DEFAULT 0
      )
    `);

    // Add phone column if it doesn't exist (migration)
    db.all(`PRAGMA table_info(users)`, (err, columns) => {
      if (columns && !columns.find(c => c.name === 'phone')) {
        db.run(`ALTER TABLE users ADD COLUMN phone TEXT`);
      }
    });

    // Admin accounts table
    db.run(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Support tickets table
    db.run(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Admin logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admins(id)
      )
    `);

    // Create default admin account
    const hashedAdminPassword = bcrypt.hashSync('admin123', 10);
    db.run(`
      INSERT OR IGNORE INTO admins (username, email, password, role)
      VALUES (?, ?, ?, ?)
    `, ['admin', 'admin@isp.local', hashedAdminPassword, 'admin']);

    console.log('Database tables initialized');
  });
};

initDatabase();

// ==================== LOGGING UTILITY ====================
const logAction = (adminId, action, details = '') => {
  db.run(`
    INSERT INTO admin_logs (admin_id, action, details)
    VALUES (?, ?, ?)
  `, [adminId, action, details], (err) => {
    if (err) console.error('Logging error:', err);
  });
};

// ==================== JWT MIDDLEWARE ====================
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.user = decoded;
    next();
  });
};

// ==================== PUBLIC API ENDPOINTS ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', uptime: process.uptime() });
});

// Get plans
app.get('/api/plans', (req, res) => {
  const plans = [
    { id: 'basic', name: 'Basic', price: '£19.99', speed: '50 Mbps', data: 'Unlimited' },
    { id: 'professional', name: 'Professional', price: '£39.99', speed: '100 Mbps', data: 'Unlimited' },
    { id: 'enterprise', name: 'Enterprise', price: '£79.99', speed: '300 Mbps', data: 'Unlimited' }
  ];
  res.json(plans);
});

// ==================== AUTHENTICATION ENDPOINTS ====================

// User Signup
app.post('/api/auth/signup', signupLimiter, (req, res) => {
  const { username, email, password, plan = 'basic', data_consent = 0 } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(`
    INSERT INTO users (username, email, password, plan, data_consent)
    VALUES (?, ?, ?, ?, ?)
  `, [username, email, hashedPassword, plan, data_consent], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }

    const token = jwt.sign(
      { id: this.lastID, username, email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ message: 'User created successfully', token });
  });
});

// User Login
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username, email: user.email, plan: user.plan } });
  });
});

// Admin Login
app.post('/api/auth/admin-login', loginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get(`SELECT * FROM admins WHERE username = ?`, [username], (err, admin) => {
    if (err || !admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    if (!bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ message: 'Admin login successful', token, admin: { id: admin.id, username: admin.username } });
  });
});

// ==================== USER ENDPOINTS ====================

// Get user profile
app.get('/api/user/profile', verifyToken, (req, res) => {
  db.get(`SELECT id, username, email, phone, plan, status, created_at, data_consent FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Update user profile
app.put('/api/user/profile', verifyToken, (req, res) => {
  const { username, email, phone, plan, status, data_consent } = req.body;
  
  // Validate input
  if (!username && !email && !phone && !plan && status === undefined && data_consent === undefined) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  // Build dynamic SQL update
  const updates = [];
  const values = [];

  if (username) {
    updates.push('username = ?');
    values.push(username);
  }
  if (email) {
    updates.push('email = ?');
    values.push(email);
  }
  if (phone) {
    updates.push('phone = ?');
    values.push(phone);
  }
  if (plan) {
    updates.push('plan = ?');
    values.push(plan);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }
  if (data_consent !== undefined) {
    updates.push('data_consent = ?');
    values.push(data_consent ? 1 : 0);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.user.id);

  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

  db.run(sql, values, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Username or email already in use' });
      }
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Return updated profile
    db.get(`SELECT id, username, email, phone, plan, status, created_at, updated_at, data_consent FROM users WHERE id = ?`, [req.user.id], (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(user);
    });
  });
});

// ==================== SUPPORT ENDPOINTS ====================

// Create support ticket
app.post('/api/support/ticket', verifyToken, (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message required' });
  }

  db.run(`
    INSERT INTO support_tickets (user_id, subject, message)
    VALUES (?, ?, ?)
  `, [req.user.id, subject, message], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(201).json({ message: 'Ticket created', ticketId: this.lastID });
  });
});

// Get user's support tickets
app.get('/api/support/tickets', verifyToken, (req, res) => {
  db.all(`SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id], (err, tickets) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(tickets || []);
  });
});

// ==================== ADMIN ENDPOINTS ====================

// Get all users
app.get('/api/admin/users', verifyAdmin, (req, res) => {
  logAction(req.user.id, 'VIEW_ALL_USERS');
  db.all(`SELECT id, username, email, plan, status, created_at FROM users`, (err, users) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(users || []);
  });
});

// Get specific user details
app.get('/api/admin/user/:id', verifyAdmin, (req, res) => {
  const userId = req.params.id;
  logAction(req.user.id, 'VIEW_USER', `User ID: ${userId}`);
  
  db.get(`SELECT id, username, email, plan, status, created_at, data_consent FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Suspend user
app.post('/api/admin/user/:id/suspend', verifyAdmin, (req, res) => {
  const userId = req.params.id;
  logAction(req.user.id, 'SUSPEND_USER', `User ID: ${userId}`);
  
  db.run(`UPDATE users SET status = ? WHERE id = ?`, ['suspended', userId], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'User suspended' });
  });
});

// Reactivate user
app.post('/api/admin/user/:id/reactivate', verifyAdmin, (req, res) => {
  const userId = req.params.id;
  logAction(req.user.id, 'REACTIVATE_USER', `User ID: ${userId}`);
  
  db.run(`UPDATE users SET status = ? WHERE id = ?`, ['active', userId], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'User reactivated' });
  });
});

// Get all support tickets
app.get('/api/admin/support-tickets', verifyAdmin, (req, res) => {
  logAction(req.user.id, 'VIEW_SUPPORT_TICKETS');
  db.all(`SELECT st.id, st.user_id, st.subject, st.message, st.status, st.created_at, u.username FROM support_tickets st LEFT JOIN users u ON st.user_id = u.id ORDER BY st.created_at DESC`, (err, tickets) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(tickets || []);
  });
});

// Update support ticket status
app.put('/api/admin/support-ticket/:id', verifyAdmin, (req, res) => {
  const { status } = req.body;
  const ticketId = req.params.id;
  logAction(req.user.id, 'UPDATE_TICKET', `Ticket ID: ${ticketId}, Status: ${status}`);
  
  db.run(`UPDATE support_tickets SET status = ? WHERE id = ?`, [status, ticketId], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'Ticket updated' });
  });
});

// Get admin logs
app.get('/api/admin/logs', verifyAdmin, (req, res) => {
  db.all(`SELECT al.id, al.admin_id, al.action, al.details, al.timestamp, ad.username FROM admin_logs al LEFT JOIN admins ad ON al.admin_id = ad.id ORDER BY al.timestamp DESC LIMIT 100`, (err, logs) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(logs || []);
  });
});

// Get system uptime
app.get('/api/admin/uptime', verifyAdmin, (req, res) => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  res.json({
    uptime_seconds: uptime,
    uptime_formatted: `${hours}h ${minutes}m ${seconds}s`,
    server_time: new Date().toISOString()
  });
});

// Get user statistics
app.get('/api/admin/statistics', verifyAdmin, (req, res) => {
  db.get(`SELECT COUNT(*) as total_users FROM users`, (err, userCount) => {
    db.get(`SELECT COUNT(*) as active_users FROM users WHERE status = 'active'`, (err, activeUsers) => {
      db.get(`SELECT COUNT(*) as open_tickets FROM support_tickets WHERE status = 'open'`, (err, openTickets) => {
        res.json({
          total_users: userCount?.total_users || 0,
          active_users: activeUsers?.active_users || 0,
          open_support_tickets: openTickets?.open_tickets || 0
        });
      });
    });
  });
});

// ==================== ERROR HANDLING ====================

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== SERVER STARTUP ====================

app.listen(PORT, () => {
  console.log(`ISP Website server running on http://localhost:${PORT}`);
  console.log('Admin credentials: username=admin, password=admin123');
  console.log('Change these in production!');
});
