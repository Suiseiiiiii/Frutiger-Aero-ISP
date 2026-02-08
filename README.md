i was to lazy to write this so i had deepseek make my MD because no one is meant to intall this, it is just a website twin

# Premium ISP Website - Complete Documentation

A professional, fully-featured ISP website built with HTML, CSS, JavaScript, Node.js, Express, and SQLite. Features Windows Vista/7 Frutiger Aero design, secure authentication, admin panel, and comprehensive rate limiting security measures.

## Features

### Frontend
- **Frutiger Aero Design**: Windows Vista/7-inspired user interface with glass morphism effects
- **Responsive Layout**: Functions consistently on desktop, tablet, and mobile devices
- **Multiple Pages**: Home, Login, Signup, Plans, Support, Account, Admin Panel
- **Real-time Authentication**: JWT-based token system
- **Interactive Admin Dashboard**: Manage users, view logs, handle support tickets

### Backend
- **Express.js Server**: RESTful API running on localhost:3000
- **SQLite Database**: Persistent storage for users, admins, support tickets, and logs
- **Security Features**:
  - Password hashing with bcryptjs
  - Rate limiting on login/signup endpoints
  - CORS protection
  - Helmet.js security headers
  - JWT token authentication
- **Admin Functionality**:
  - View all users and account details
  - Suspend/reactivate user accounts
  - Manage support tickets
  - Monitor server uptime
  - View comprehensive admin activity logs
  - Track system statistics

### Security and Compliance
- UK Data Protection Law Compliance
- Data consent tracking
- Comprehensive audit logs
- Rate limiting to prevent brute force attacks
- Secure password requirements (minimum 8 characters)
- Token-based authentication with expiration

## Project Structure

```
websit/
├── package.json                 # Node.js dependencies
├── public/
│   ├── index.html              # Main HTML file (all pages)
│   ├── css/
│   │   └── style.css           # Frutiger Aero styling
│   └── js/
│       └── app.js              # Frontend JavaScript logic
├── backend/
│   ├── server.js               # Express server and API endpoints
│   ├── test.js                 # Comprehensive test suite
│   ├── db/
│   │   └── isp.db              # SQLite database (auto-created)
│   └── logs/
│       └── admin_logs.json     # Admin activity logs
└── README.md                   # This file
```

## Quick Start Guide

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- A modern web browser

### Installation and Running

1. **Navigate to project directory**:
   ```bash
   cd /home/username/Desktop/websit
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```
   
   The server will start on `http://localhost:3000`

4. **Open in browser**:
   - Navigate to `http://localhost:3000` in your web browser
   - You should see the Premium ISP homepage

## Testing

Run the comprehensive test suite to verify all functionality:

```bash
npm test
```

The test suite will validate:
- Public API endpoints
- User authentication (signup/login)
- User profile management
- Support ticket creation and retrieval
- Admin authentication
- Admin endpoints (users, tickets, logs, uptime)
- User suspension/reactivation
- Security measures and permissions
- Input validation

## Default Admin Credentials

**Username**: `admin`
**Password**: `admin123`

**WARNING**: Change these credentials in production!

## User Guide

### For Regular Users

1. **Create Account**:
   - Click "Sign Up" button
   - Enter username, email, password (minimum 8 characters)
   - Select a plan (Basic, Professional, or Enterprise)
   - Agree to data processing terms
   - Click "Create Account"

2. **Login**:
   - Click "Login" button
   - Enter email and password
   - Click "Login"

3. **View Account**:
   - Click "Account" in navigation (only when logged in)
   - View your account details, plan, and member since date

4. **Create Support Ticket**:
   - Navigate to "Support" page
   - Fill in subject and message
   - Click "Submit Ticket"
   - View status of all your tickets

5. **View Plans**:
   - Click "Plans" to see available plans
   - Choose a plan to select (if logged in)

### For Administrators

1. **Admin Login**:
   - Go to Login page
   - Check "Login as Administrator"
   - Enter admin username and password
   - Click "Login"

2. **Dashboard Overview**:
   - See total users, active users
   - Monitor open support tickets
   - View server uptime

3. **User Accounts Management**:
   - View all registered users
   - Click "View" to see user details
   - Suspend/Reactivate user accounts

4. **Support Ticket Management**:
   - View all support tickets
   - Update ticket status (Open, In Progress, Resolved, Closed)
   - View ticket details and user messages

5. **Activity Logs**:
   - Monitor all admin actions
   - Track who did what and when
   - Comprehensive audit trail

6. **Server Uptime**:
   - Monitor server uptime in real-time
   - View server time and status
   - Track system availability

## API Endpoints

### Public Endpoints

```
GET  /api/health           - Server health check
GET  /api/plans            - Get available plans
```

### Authentication Endpoints

```
POST /api/auth/signup       - User registration
POST /api/auth/login        - User login
POST /api/auth/admin-login  - Admin login
```

### User Endpoints (requires token)

```
GET  /api/user/profile     - Get user profile
PUT  /api/user/profile     - Update user profile
```

### Support Endpoints (requires token)

```
POST /api/support/ticket   - Create support ticket
GET  /api/support/tickets  - Get user's tickets
```

### Admin Endpoints (requires admin token)

```
GET  /api/admin/users                    - Get all users
GET  /api/admin/user/:id                 - Get user details
POST /api/admin/user/:id/suspend         - Suspend user
POST /api/admin/user/:id/reactivate      - Reactivate user
GET  /api/admin/support-tickets          - Get all tickets
PUT  /api/admin/support-ticket/:id       - Update ticket status
GET  /api/admin/logs                     - Get admin activity logs
GET  /api/admin/uptime                   - Get server uptime
GET  /api/admin/statistics               - Get system statistics
```

## Security Features

### Rate Limiting
- **General**: 100 requests per 15 minutes per IP
- **Login**: 5 failed attempts per 15 minutes per IP
- **Signup**: 50 signups per hour per IP

### Authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Token-based**: JWT tokens with expiration
- **User tokens**: 7 days expiration
- **Admin tokens**: 1 day expiration

### Data Protection
- User consent tracking for data processing
- UK Data Protection Law compliance
- Secure password requirements (8 or more characters)
- CORS protection
- Helmet.js security headers

### Audit Trail
- Complete admin activity logging
- Timestamp on all actions
- User identification for all admin actions
- Detailed action descriptions

## Design Features

### Frutiger Aero Style
- Windows Vista/7 inspired design
- Glass morphism effects
- Gradient backgrounds
- Professional button styling
- Smooth transitions and animations
- Rounded corners with subtle shadows

### UI Components
- Responsive grid layouts
- Cards with hover effects
- Data tables with alternating rows
- Modal dialogs
- Alert messages
- Status badges
- Tab interfaces
- Form validation

## Browser Compatibility

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Troubleshooting

### Port 3000 Already in Use
```bash
# Kill process using port 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill -9

# For Windows, use Task Manager or:
netstat -ano | findstr :3000
```

### Database Issues
```bash
# Delete and recreate database
rm backend/db/isp.db
npm start
```

### Tests Failing
1. Ensure server is running on localhost:3000
2. Check that port 3000 is not blocked
3. Verify all npm dependencies are installed

## Database Schema

### Users Table
- id (Primary Key)
- username (Unique)
- email (Unique)
- password (Hashed)
- plan (basic/professional/enterprise)
- status (active/suspended)
- created_at
- updated_at
- data_consent (Boolean)

### Admins Table
- id (Primary Key)
- username (Unique)
- email (Unique)
- password (Hashed)
- role (admin)
- created_at

### Support Tickets Table
- id (Primary Key)
- user_id (Foreign Key)
- subject
- message
- status (open/in_progress/resolved/closed)
- created_at
- resolved_at

### Admin Logs Table
- id (Primary Key)
- admin_id (Foreign Key)
- action (e.g., VIEW_USER, SUSPEND_USER)
- details
- timestamp

## Production Deployment

### Before Deploying to Production:

1. **Change Admin Credentials**:
   - Update default admin password in backend/server.js

2. **Update JWT Secret**:
   - Change JWT_SECRET to a strong random string in backend/server.js

3. **Configure CORS**:
   - Update CORS origin to your production domain

4. **Enable HTTPS**:
   - Implement SSL/TLS certificates

5. **Environment Variables**:
   - Move secrets to .env file
   - Use process.env for configuration

6. **Database Backup**:
   - Implement regular SQLite backups

7. **Rate Limiting**:
   - Adjust rate limits based on your traffic patterns

8. **Monitoring**:
   - Set up logging and monitoring
   - Monitor database size and performance

## Support and Contact

For support or issues:
- Email: support@premierisp.com
- Phone: 0800-XXX-XXXX
- Hours: 24/7 Support Available

## License

This project is provided as-is for ISP website demonstration purposes.

## Features Checklist

- [X] Frutiger Aero (Windows Vista/7) Design
- [X] HTML, CSS, JavaScript Frontend
- [X] Node.js/Express Backend
- [X] SQLite Database
- [X] User Authentication (Signup/Login)
- [X] Admin Panel with Multiple Features
- [X] Support Ticket System
- [X] Rate Limiting Security
- [X] Admin Activity Logging
- [X] User Account Management
- [X] Server Uptime Monitoring
- [X] UK Data Protection Compliance
- [X] Localhost:3000 Ready
- [X] Comprehensive Test Suite
- [X] Fully Responsive Design
- [X] Error Handling and Validation
- [X] Multiple Pages (Home, Plans, Support, Account, Admin)
- [X] Real-time User Management
- [X] Support Ticket Management
- [X] System Statistics and Analytics
