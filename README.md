# Premium ISP Website

A professional ISP website with Windows Vista/7 Frutiger Aero design, user authentication, admin panel, and real-time monitoring.

## Quick Start

```bash
./setup.sh
npm start
```

Server runs on `http://localhost:3000`

## Features

- **Design**: Frutiger Aero (Windows Vista/7 style) with glass morphism
- **Frontend**: Responsive HTML/CSS/JavaScript, multiple pages
- **Backend**: Express.js + SQLite with REST API
- **Auth**: JWT tokens, password hashing, rate limiting
- **Admin Panel**: Manage users, tickets, view logs and uptime
- **Security**: CORS, Helmet headers, data protection compliance

## Setup

### Requirements
- Node.js v14+
- npm

### Installation
```bash
./setup.sh        # Install dependencies and create db directory
npm start         # Start server on localhost:3000
npm test          # Run test suite
./verify.sh       # Check system and monitor (30 min intervals when server is live)
```

## Admin Access

**Default credentials:**
- Username: `admin`
- Password: `admin123`

Change these in production!

## User Guide

### Regular Users
1. **Sign Up**: Create account with username, email, password (8+ chars), select plan
2. **Login**: Use email and password
3. **Account**: View profile and subscription details
4. **Support**: Submit and track support tickets
5. **Plans**: Browse available plans

### Administrators
1. **Login**: Check "Login as Administrator" on login page
2. **Dashboard**: View user stats, open tickets, server uptime
3. **Users**: View all users, suspend/reactivate accounts
4. **Tickets**: Manage support tickets, change status
5. **Logs**: Monitor admin activity
6. **Uptime**: Track server availability

## API Endpoints

```
Public:
  GET  /api/health                    Server status
  GET  /api/plans                     Available plans

Auth:
  POST /api/auth/signup               Register user
  POST /api/auth/login                User login
  POST /api/auth/admin-login          Admin login

User (requires token):
  GET  /api/user/profile              Get user data
  PUT  /api/user/profile              Update profile

Support (requires token):
  POST /api/support/ticket            Create ticket
  GET  /api/support/tickets           Get user tickets

Admin (requires admin token):
  GET  /api/admin/users               All users
  GET  /api/admin/user/:id            User details
  POST /api/admin/user/:id/suspend    Suspend user
  POST /api/admin/user/:id/reactivate Reactivate user
  GET  /api/admin/support-tickets     All tickets
  PUT  /api/admin/support-ticket/:id  Update ticket
  GET  /api/admin/logs                Admin logs
  GET  /api/admin/uptime              Server uptime
  GET  /api/admin/statistics          System stats
```

## Security

- **Password**: Minimum 8 characters, bcrypt hashing
- **Tokens**: JWT with expiration (7 days user, 1 day admin)
- **Rate Limiting**: 
  - General: 100 requests/15 min per IP
  - Login: 5 failed attempts/15 min per IP
  - Signup: 50 signups/hour per IP
- **Headers**: Helmet.js security headers
- **CORS**: Restricted to localhost
- **Compliance**: UK Data Protection Law, consent tracking

## Project Structure

```
├── backend/
│   ├── server.js          Express server, API routes
│   ├── test.js            Test suite
│   └── db/                Database directory
├── public/
│   ├── index.html         Main page
│   ├── css/style.css      Styling
│   └── js/app.js          Frontend logic
├── package.json           Dependencies
└── README.md              This file
```

## Database

Auto-created SQLite database with tables for:
- **users**: User accounts
- **admins**: Admin accounts
- **support_tickets**: Support tickets
- **admin_logs**: Admin activity logs

## Troubleshooting

**Port 3000 in use:**
```bash
lsof -ti:3000 | xargs kill -9
npm start
```

**Database issues:**
```bash
rm backend/db/isp.db
npm start
```

**Dependencies:**
```bash
npm ci --silent
```

## Testing

```bash
npm test
```

Validates all endpoints, auth, security, and functionality.

## License

ISP website for demonstration purposes.

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
