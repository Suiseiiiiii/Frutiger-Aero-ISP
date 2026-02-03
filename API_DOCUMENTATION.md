# ISP Website API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require JWT token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All responses are in JSON format.

**Success Response**:
```json
{
  "message": "Success message",
  "data": {}
}
```

**Error Response**:
```json
{
  "error": "Error message"
}
```

---

## PUBLIC ENDPOINTS

### 1. Health Check
Check if the server is running and get uptime information.

**Endpoint**: `GET /health`

**Authentication**: None

**Response**:
```json
{
  "status": "online",
  "uptime": 3456.78
}
```

---

### 2. Get Plans
Retrieve all available internet plans.

**Endpoint**: `GET /plans`

**Authentication**: None

**Response**:
```json
[
  {
    "id": "basic",
    "name": "Basic",
    "price": "£19.99",
    "speed": "50 Mbps",
    "data": "Unlimited"
  },
  {
    "id": "professional",
    "name": "Professional",
    "price": "£39.99",
    "speed": "100 Mbps",
    "data": "Unlimited"
  },
  {
    "id": "enterprise",
    "name": "Enterprise",
    "price": "£79.99",
    "speed": "300 Mbps",
    "data": "Unlimited"
  }
]
```

---

## AUTHENTICATION ENDPOINTS

### 1. User Signup
Create a new user account.

**Endpoint**: `POST /auth/signup`

**Rate Limit**: 3 signups per hour per IP

**Authentication**: None

**Request Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "plan": "basic",
  "data_consent": 1
}
```

**Response** (201):
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- 400: Missing required fields, password too short
- 409: Username or email already exists

---

### 2. User Login
Authenticate a user account.

**Endpoint**: `POST /auth/login`

**Rate Limit**: 5 failed attempts per 15 minutes per IP

**Authentication**: None

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "plan": "basic"
  }
}
```

**Error Responses**:
- 401: Invalid email or password
- 429: Too many login attempts (rate limited)

---

### 3. Admin Login
Authenticate an administrator account.

**Endpoint**: `POST /auth/admin-login`

**Rate Limit**: 5 failed attempts per 15 minutes per IP

**Authentication**: None

**Request Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response** (200):
```json
{
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "username": "admin"
  }
}
```

**Error Responses**:
- 401: Invalid admin credentials
- 429: Too many login attempts (rate limited)

---

## USER ENDPOINTS

### 1. Get User Profile
Retrieve the current user's profile information.

**Endpoint**: `GET /user/profile`

**Authentication**: Required (User token)

**Response** (200):
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "plan": "basic",
  "status": "active",
  "created_at": "2026-02-03T10:30:00Z",
  "data_consent": 1
}
```

**Error Responses**:
- 401: No token provided or invalid token
- 404: User not found

---

### 2. Update User Profile
Update user profile information.

**Endpoint**: `PUT /user/profile`

**Authentication**: Required (User token)

**Request Body**:
```json
{
  "plan": "professional"
}
```

**Response** (200):
```json
{
  "message": "Profile updated"
}
```

**Error Responses**:
- 401: No token provided or invalid token
- 500: Database error

---

## SUPPORT ENDPOINTS

### 1. Create Support Ticket
Submit a new support ticket.

**Endpoint**: `POST /support/ticket`

**Authentication**: Required (User token)

**Request Body**:
```json
{
  "subject": "Internet connection issues",
  "message": "I'm experiencing slow speeds in the evening hours"
}
```

**Response** (201):
```json
{
  "message": "Ticket created",
  "ticketId": 5
}
```

**Error Responses**:
- 400: Missing subject or message
- 401: No token provided

---

### 2. Get User Support Tickets
Retrieve all support tickets for the current user.

**Endpoint**: `GET /support/tickets`

**Authentication**: Required (User token)

**Response** (200):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "subject": "Internet connection issues",
    "message": "I'm experiencing slow speeds",
    "status": "open",
    "created_at": "2026-02-03T11:00:00Z",
    "resolved_at": null
  }
]
```

**Error Responses**:
- 401: No token provided

---

## ADMIN ENDPOINTS

**Note**: All admin endpoints require authentication with an admin token. Non-admin users will receive a 403 Forbidden response.

### 1. Get All Users
Retrieve all user accounts (paginated list with details).

**Endpoint**: `GET /admin/users`

**Authentication**: Required (Admin token)

**Response** (200):
```json
[
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "plan": "basic",
    "status": "active",
    "created_at": "2026-02-03T10:30:00Z"
  }
]
```

**Error Responses**:
- 401: No token provided
- 403: Admin access required

---

### 2. Get Specific User Details
Retrieve detailed information about a specific user (UK Data Protection compliant).

**Endpoint**: `GET /admin/user/:id`

**Authentication**: Required (Admin token)

**URL Parameters**:
- `id` (integer): User ID

**Response** (200):
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "plan": "basic",
  "status": "active",
  "created_at": "2026-02-03T10:30:00Z",
  "data_consent": 1
}
```

**Error Responses**:
- 401: No token provided
- 403: Admin access required
- 404: User not found

---

### 3. Suspend User Account
Suspend a user account (prevent login and service access).

**Endpoint**: `POST /admin/user/:id/suspend`

**Authentication**: Required (Admin token)

**URL Parameters**:
- `id` (integer): User ID

**Response** (200):
```json
{
  "message": "User suspended"
}
```

**Error Responses**:
- 401: No token provided
- 403: Admin access required
- 500: Database error

---

### 4. Reactivate User Account
Reactivate a suspended user account.

**Endpoint**: `POST /admin/user/:id/reactivate`

**Authentication**: Required (Admin token)

**URL Parameters**:
- `id` (integer): User ID

**Response** (200):
```json
{
  "message": "User reactivated"
}
```

**Error Responses**:
- 401: No token provided
- 403: Admin access required
- 500: Database error

---

### 5. Get All Support Tickets
Retrieve all support tickets from all users.

**Endpoint**: `GET /admin/support-tickets`

**Authentication**: Required (Admin token)

**Response** (200):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "subject": "Internet connection issues",
    "message": "I'm experiencing slow speeds",
    "status": "open",
    "created_at": "2026-02-03T11:00:00Z",
    "username": "johndoe"
  }
]
```

**Error Responses**:
- 401: No token provided
- 403: Admin access required

---

### 6. Update Support Ticket Status
Update the status of a support ticket.

**Endpoint**: `PUT /admin/support-ticket/:id`

**Authentication**: Required (Admin token)

**URL Parameters**:
- `id` (integer): Ticket ID

**Request Body**:
```json
{
  "status": "in_progress"
}
```

**Valid Status Values**:
- `open`: Ticket is open and awaiting response
- `in_progress`: Admin is working on the ticket
- `resolved`: Issue has been resolved
- `closed`: Ticket is closed

**Response** (200):
```json
{
  "message": "Ticket updated"
}
```

**Error Responses**:
- 401: No token provided
- 403: Admin access required
- 500: Database error

---

### 7. Get Admin Activity Logs
Retrieve all admin activity logs (audit trail).

**Endpoint**: `GET /admin/logs`

**Authentication**: Required (Admin token)

**Response** (200):
```json
[
  {
    "id": 1,
    "admin_id": 1,
    "action": "VIEW_USER",
    "details": "User ID: 5",
    "timestamp": "2026-02-03T11:30:00Z",
    "username": "admin"
  },
  {
    "id": 2,
    "admin_id": 1,
    "action": "SUSPEND_USER",
    "details": "User ID: 3",
    "timestamp": "2026-02-03T11:35:00Z",
    "username": "admin"
  }
]
```

**Logged Actions**:
- `VIEW_ALL_USERS`: Admin viewed all users
- `VIEW_USER`: Admin viewed specific user details
- `SUSPEND_USER`: Admin suspended a user
- `REACTIVATE_USER`: Admin reactivated a user
- `VIEW_SUPPORT_TICKETS`: Admin viewed all tickets
- `UPDATE_TICKET`: Admin updated ticket status

**Error Responses**:
- 401: No token provided
- 403: Admin access required

---

### 8. Get Server Uptime
Retrieve server uptime and status information.

**Endpoint**: `GET /admin/uptime`

**Authentication**: Required (Admin token)

**Response** (200):
```json
{
  "uptime_seconds": 3600.45,
  "uptime_formatted": "1h 0m 0s",
  "server_time": "2026-02-03T12:00:00.000Z"
}
```

**Error Responses**:
- 401: No token provided
- 403: Admin access required

---

### 9. Get System Statistics
Retrieve system statistics and key metrics.

**Endpoint**: `GET /admin/statistics`

**Authentication**: Required (Admin token)

**Response** (200):
```json
{
  "total_users": 42,
  "active_users": 38,
  "open_support_tickets": 3
}
```

**Error Responses**:
- 401: No token provided
- 403: Admin access required

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Access denied (insufficient permissions) |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists (e.g., duplicate username) |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### Error Response Format

```json
{
  "error": "Descriptive error message"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| General requests | 100 | 15 minutes |
| Login attempts | 5 failed | 15 minutes |
| Signup | 3 | 1 hour |

When rate limited, you'll receive a 429 response:
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

---

## Security Best Practices

1. **Always use HTTPS in production**
2. **Keep your JWT tokens secure** - don't share them
3. **Change admin credentials** - use strong passwords
4. **Regularly rotate JWT secret** in production
5. **Monitor admin logs** for unusual activity
6. **Enable CORS only for trusted domains** in production
7. **Implement additional rate limiting** based on your needs

---

## Example Usage

### JavaScript Fetch Example

```javascript
// User login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.token;

// Get user profile
const profileResponse = await fetch('http://localhost:3000/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const profile = await profileResponse.json();
console.log(profile);
```

### cURL Example

```bash
# User login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePassword123"}'

# Get plans
curl http://localhost:3000/api/plans

# Admin get users (with token)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3000/api/admin/users
```

---

## Support

For API issues or questions, please create a support ticket through the website or contact:
- Email: support@premierisp.com
- Phone: 0800-XXX-XXXX
- Hours: 24/7

---

**Last Updated**: 3 February 2026
**API Version**: 1.0.0
**Server**: Express.js
**Database**: SQLite
