import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = 'http://localhost:10000/api';

function buildCookieHeader(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function request(path, options = {}, cookies = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  if (Object.keys(cookies).length > 0) {
    headers.Cookie = buildCookieHeader(cookies);
  }

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { response, data };
}

function extractSetCookies(headers) {
  const setCookieHeader = headers.getSetCookie?.() ?? headers.get('set-cookie');
  if (!setCookieHeader) return {};

  const cookies = {};
  const items = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const item of items) {
    const match = item.match(/^([^=]+)=([^;]+)/);
    if (match) {
      cookies[match[1]] = match[2];
    }
  }
  return cookies;
}

test('Debug: Signup and check session', async () => {
  const email = `debug-${Date.now()}@example.com`;

  console.log('\n=== STEP 1: Signup ===');
  const signupRes = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'Demo@1234', name: 'Debug User' }),
  });

  console.log('Status:', signupRes.response.status);
  console.log('Data:', signupRes.data);
  
  const signupCookies = extractSetCookies(signupRes.response.headers);
  console.log('Cookies from signup:', signupCookies);

  assert.equal(signupRes.response.status, 201, 'Signup should return 201');

  console.log('\n=== STEP 2: Get current user ===');
  const meRes = await request('/auth/me', { method: 'GET' }, signupCookies);
  console.log('Status:', meRes.response.status);
  console.log('Data:', meRes.data);
  console.log('Cookies used:', signupCookies);

  assert.equal(meRes.response.status, 200, 'Should be able to get current user');

  console.log('\n=== STEP 3: Create folder ===');
  const folderRes = await request('/folders', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test Folder', parentId: null }),
  }, signupCookies);

  console.log('Status:', folderRes.response.status);
  console.log('Data:', folderRes.data);

  assert.equal(folderRes.response.status, 201, 'Create folder should return 201');
  const folderId = folderRes.data.folder.id;

  console.log('\n=== STEP 4: Upload file ===');
  const fileForm = new FormData();
  fileForm.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');
  fileForm.append('folderId', folderId);

  const uploadRes = await request('/files/upload', {
    method: 'POST',
    body: fileForm,
  }, signupCookies);

  console.log('Status:', uploadRes.response.status);
  console.log('Data:', JSON.stringify(uploadRes.data, null, 2));
  console.log('Cookies used:', signupCookies);

  assert.equal(uploadRes.response.status, 201, `Upload should return 201 - Error: ${JSON.stringify(uploadRes.data)}`);
});
