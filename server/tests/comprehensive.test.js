import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const BASE_URL = 'http://localhost:10000/api';
const client = {};

// Helper to make HTTP requests
const request = (method, path, options = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers = {
      'Content-Type': 'application/json',
      ...(client.cookies && { 'Cookie': client.cookies }),
      ...options.headers,
    };

    const reqOptions = { method, headers };
    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const body = data ? JSON.parse(data) : {};
          if (res.headers['set-cookie']) {
            const cookies = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
            client.cookies = cookies;
          }
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
};

test('Comprehensive MVP Feature Testing', async (t) => {
  // Step 1: Signup
  await t.test('1. Signup', async () => {
    const { status, data } = await request('POST', '/auth/signup', {
      body: {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User',
      },
    });
    assert.equal(status, 201, `Signup failed: ${data.message}`);
    assert.ok(data.user.id);
    client.userId = data.user.id;
  });

  // Step 2: Get current user
  await t.test('2. Get current user', async () => {
    const { status, data } = await request('GET', '/auth/me');
    assert.equal(status, 200);
    assert.equal(data.user.id, client.userId);
  });

  // Step 3: Create folder
  await t.test('3. Create folder', async () => {
    const { status, data } = await request('POST', '/folders', {
      body: { name: 'Test Folder' },
    });
    assert.equal(status, 201);
    assert.ok(data.folder.id);
    client.folderId = data.folder.id;
  });

  // Step 4: Get files list (should have root folder files)
  await t.test('4. Get files list', async () => {
    const { status, data } = await request('GET', '/files');
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.files));
  });

  // Step 5: Test rename endpoint
  await t.test('5. Test rename endpoint', async () => {
    // This will fail because no file exists, but tests the endpoint
    const { status } = await request('PUT', `/files/nonexistent-id`, {
      body: { name: 'newname.txt' },
    });
    assert.equal(status, 404);
  });

  // Step 6: Test move file endpoint
  await t.test('6. Test move file endpoint', async () => {
    const { status } = await request('PATCH', `/files/nonexistent-id/move`, {
      body: { folderId: client.folderId },
    });
    assert.equal(status, 404);
  });

  // Step 7: Test favorite endpoint
  await t.test('7. Test favorite endpoint', async () => {
    const { status } = await request('PATCH', `/files/nonexistent-id/favorite`);
    assert.equal(status, 404);
  });

  // Step 8: Get favorites (should be empty or have previous ones)
  await t.test('8. Get favorite files', async () => {
    const { status, data } = await request('GET', '/files/favorites');
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.files));
  });

  // Step 9: Test share creation
  await t.test('9. Test create share', async () => {
    const { status } = await request('POST', '/shares', {
      body: {
        fileId: 'nonexistent-id',
        userId: client.userId,
        permission: 'Viewer',
      },
    });
    // Should fail with 404 or 400 depending on implementation
    assert.ok([400, 404].includes(status));
  });

  // Step 10: Test public link
  await t.test('10. Test create public link', async () => {
    const { status } = await request('POST', '/public-links', {
      body: {
        fileId: 'nonexistent-id',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    assert.ok([400, 404].includes(status));
  });

  // Step 11: Get trash
  await t.test('11. Get trash', async () => {
    const { status, data } = await request('GET', '/trash');
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.trash));
  });

  // Step 12: Get recent files
  await t.test('12. Get recent files', async () => {
    const { status, data } = await request('GET', '/files/recent');
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.files));
  });

  // Step 13: Search files
  await t.test('13. Search files', async () => {
    const { status, data } = await request('GET', '/files?search=test');
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.files));
  });

  // Step 14: Delete folder
  await t.test('14. Delete folder', async () => {
    const { status, data } = await request('DELETE', `/folders/${client.folderId}`);
    assert.equal(status, 200);
    assert.ok(data.folder);
  });

  // Step 15: Logout
  await t.test('15. Logout', async () => {
    const { status, data } = await request('POST', '/auth/logout');
    assert.equal(status, 200);
    assert.ok(data.success);
  });
});
