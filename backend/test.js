#!/usr/bin/env node

/**
 * ISP Website Comprehensive Test Suite
 * Tests all functionality including authentication, admin panel, and security features
 */

const http = require('http');
const assert = require('assert');

const API_URL = 'http://localhost:3000/api';
let testsPassed = 0;
let testsFailed = 0;

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: responseData });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    console.error(`  Error: ${error.message}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log(' Starting ISP Website Test Suite...\n');

  let userToken = null;
  let adminToken = null;
  let userId = null;
  let ticketId = null;

  // ==================== PUBLIC API TESTS ====================
  console.log(' Public API Tests:');

  await test('Health check endpoint', async () => {
    const result = await makeRequest('GET', '/health');
    assert.strictEqual(result.status, 200);
    assert(result.body.status === 'online');
  });

  await test('Get plans endpoint', async () => {
    const result = await makeRequest('GET', '/plans');
    assert.strictEqual(result.status, 200);
    assert(Array.isArray(result.body));
    assert(result.body.length === 3);
  });

  // ==================== USER AUTHENTICATION TESTS ====================
  console.log('\n User Authentication Tests:');

  const testUsername = `testuser${Date.now()}`;
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';

  await test('User signup with valid credentials', async () => {
    const result = await makeRequest('POST', '/auth/signup', {
      username: testUsername,
      email: testEmail,
      password: testPassword,
      plan: 'basic',
      data_consent: 1
    });
    assert.strictEqual(result.status, 201);
    assert(result.body.token);
    userToken = result.body.token;
  });

  await test('User signup rejects duplicate email', async () => {
    const result = await makeRequest('POST', '/auth/signup', {
      username: `anotheruser${Date.now()}`,
      email: testEmail,
      password: testPassword,
      plan: 'basic',
      data_consent: 1
    });
    assert.strictEqual(result.status, 409);
  });

  await test('User signup rejects short password', async () => {
    const result = await makeRequest('POST', '/auth/signup', {
      username: `shortpass${Date.now()}`,
      email: `short${Date.now()}@example.com`,
      password: 'short',
      plan: 'basic',
      data_consent: 1
    });
    assert.strictEqual(result.status, 400);
  });

  await test('User login with correct credentials', async () => {
    const result = await makeRequest('POST', '/auth/login', {
      email: testEmail,
      password: testPassword
    });
    assert.strictEqual(result.status, 200);
    assert(result.body.token);
    assert(result.body.user.username === testUsername);
  });

  await test('User login rejects wrong password', async () => {
    const result = await makeRequest('POST', '/auth/login', {
      email: testEmail,
      password: 'WrongPassword123'
    });
    assert.strictEqual(result.status, 401);
  });

  // ==================== USER PROFILE TESTS ====================
  console.log('\n User Profile Tests:');

  await test('Get user profile with valid token', async () => {
    const result = await makeRequest('GET', '/user/profile', null, userToken);
    assert.strictEqual(result.status, 200);
    assert(result.body.username === testUsername);
    assert(result.body.email === testEmail);
    userId = result.body.id;
  });

  await test('Get user profile without token fails', async () => {
    const result = await makeRequest('GET', '/user/profile');
    assert.strictEqual(result.status, 401);
  });

  // ==================== SUPPORT TICKET TESTS ====================
  console.log('\n Support Ticket Tests:');

  await test('Create support ticket', async () => {
    const result = await makeRequest('POST', '/support/ticket', {
      subject: 'Test Ticket',
      message: 'This is a test support ticket'
    }, userToken);
    assert.strictEqual(result.status, 201);
    assert(result.body.ticketId);
    ticketId = result.body.ticketId;
  });

  await test('Get user support tickets', async () => {
    const result = await makeRequest('GET', '/support/tickets', null, userToken);
    assert.strictEqual(result.status, 200);
    assert(Array.isArray(result.body));
    assert(result.body.length > 0);
  });

  // ==================== ADMIN AUTHENTICATION TESTS ====================
  console.log('\n Admin Authentication Tests:');

  await test('Admin login with correct credentials', async () => {
    const result = await makeRequest('POST', '/auth/admin-login', {
      username: 'admin',
      password: 'admin123'
    });
    assert.strictEqual(result.status, 200);
    assert(result.body.token);
    adminToken = result.body.token;
  });

  await test('Admin login rejects wrong password', async () => {
    const result = await makeRequest('POST', '/auth/admin-login', {
      username: 'admin',
      password: 'wrongpassword'
    });
    assert.strictEqual(result.status, 401);
  });

  // ==================== ADMIN ENDPOINTS TESTS ====================
  console.log('\n  Admin Panel Tests:');

  await test('Get all users (admin only)', async () => {
    const result = await makeRequest('GET', '/admin/users', null, adminToken);
    assert.strictEqual(result.status, 200);
    assert(Array.isArray(result.body));
  });

  await test('Get specific user details (admin only)', async () => {
    const result = await makeRequest('GET', `/admin/user/${userId}`, null, adminToken);
    assert.strictEqual(result.status, 200);
    assert(result.body.username === testUsername);
  });

  await test('Get all support tickets (admin only)', async () => {
    const result = await makeRequest('GET', '/admin/support-tickets', null, adminToken);
    assert.strictEqual(result.status, 200);
    assert(Array.isArray(result.body));
  });

  await test('Update support ticket status (admin only)', async () => {
    const result = await makeRequest('PUT', `/admin/support-ticket/${ticketId}`, {
      status: 'in_progress'
    }, adminToken);
    assert.strictEqual(result.status, 200);
  });

  await test('Get admin logs (admin only)', async () => {
    const result = await makeRequest('GET', '/admin/logs', null, adminToken);
    assert.strictEqual(result.status, 200);
    assert(Array.isArray(result.body));
  });

  await test('Get admin statistics (admin only)', async () => {
    const result = await makeRequest('GET', '/admin/statistics', null, adminToken);
    assert.strictEqual(result.status, 200);
    assert(result.body.total_users !== undefined);
    assert(result.body.active_users !== undefined);
    assert(result.body.open_support_tickets !== undefined);
  });

  await test('Get server uptime (admin only)', async () => {
    const result = await makeRequest('GET', '/admin/uptime', null, adminToken);
    assert.strictEqual(result.status, 200);
    assert(result.body.uptime_seconds !== undefined);
    assert(result.body.uptime_formatted);
  });

  // ==================== USER STATUS MANAGEMENT TESTS ====================
  console.log('\n User Management Tests:');

  await test('Suspend user (admin only)', async () => {
    const result = await makeRequest('POST', `/admin/user/${userId}/suspend`, null, adminToken);
    assert.strictEqual(result.status, 200);
  });

  await test('Reactivate user (admin only)', async () => {
    const result = await makeRequest('POST', `/admin/user/${userId}/reactivate`, null, adminToken);
    assert.strictEqual(result.status, 200);
  });

  // ==================== SECURITY TESTS ====================
  console.log('\n🔒 Security Tests:');

  await test('Invalid token is rejected', async () => {
    const result = await makeRequest('GET', '/user/profile', null, 'invalid-token');
    assert.strictEqual(result.status, 401);
  });

  await test('Non-admin cannot access admin endpoints', async () => {
    const result = await makeRequest('GET', '/admin/users', null, userToken);
    assert.strictEqual(result.status, 403);
  });

  await test('Missing required fields in signup', async () => {
    const result = await makeRequest('POST', '/auth/signup', {
      username: 'testuser',
      // missing email and password
      plan: 'basic'
    });
    // May be 400 or 429 due to rate limiting
    assert(result.status === 400 || result.status === 429, `Expected 400 or 429, got ${result.status}`);
  });

  // ==================== TEST SUMMARY ====================
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);
  console.log('='.repeat(50));

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});
