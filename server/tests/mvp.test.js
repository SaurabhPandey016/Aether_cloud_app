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

async function createUser(email, password, name) {
  const res = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });

  assert.equal(res.response.status, 201, `Signup failed for ${email}: ${JSON.stringify(res.data)}`);
  const cookieHeader = extractSetCookies(res.response.headers);
  return { user: res.data.user, cookies: cookieHeader };
}

test('MVP backend flow: auth, folders, files, share, public link, trash and restore', async () => {
  const email = `mvp-${Date.now()}@example.com`;
  const secondEmail = `mvp-share-${Date.now()}@example.com`;

  const firstUser = await createUser(email, 'Demo@1234', 'MVP User');
  const secondUser = await createUser(secondEmail, 'Demo@1234', 'Share User');

  const loginResponse = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'Demo@1234' }),
  }, firstUser.cookies);

  const loginCookies = {
    ...firstUser.cookies,
    ...extractSetCookies(loginResponse.response.headers),
  };

  assert.equal(loginResponse.response.status, 200, `Login failed: ${JSON.stringify(loginResponse.data)}`);

  const meResponse = await request('/auth/me', { method: 'GET' }, loginCookies);
  assert.equal(meResponse.response.status, 200, 'Current user fetch failed');
  assert.equal(meResponse.data.user.email, email);

  const folderResponse = await request('/folders', {
    method: 'POST',
    body: JSON.stringify({ name: 'Project Alpha', parentId: null }),
  }, loginCookies);

  assert.equal(folderResponse.response.status, 201, `Create folder failed: ${JSON.stringify(folderResponse.data)}`);
  const folderId = folderResponse.data.folder.id;

  const listFolders = await request('/folders', { method: 'GET' }, loginCookies);
  assert.equal(listFolders.response.status, 200);
  assert.ok(listFolders.data.folders.some((folder) => folder.id === folderId));

  const fileForm = new FormData();
  fileForm.append('file', new Blob(['hello world'], { type: 'text/plain' }), 'notes.txt');
  fileForm.append('folderId', folderId);

  const uploadResponse = await request('/files/upload', {
    method: 'POST',
    body: fileForm,
  }, loginCookies);

  assert.equal(uploadResponse.response.status, 201, `Upload failed: ${JSON.stringify(uploadResponse.data)}`);
  const fileId = uploadResponse.data.file.id;

  const filesResponse = await request('/files', { method: 'GET' }, loginCookies);
  assert.equal(filesResponse.response.status, 200);
  assert.ok(filesResponse.data.files.some((file) => file.id === fileId));

  const shareResponse = await request('/shares/user', {
    method: 'POST',
    body: JSON.stringify({
      itemId: folderId,
      itemType: 'folder',
      sharedWithEmail: secondEmail,
      permission: 'VIEWER',
    }),
  }, loginCookies);

  assert.equal(shareResponse.response.status, 201, `Share failed: ${JSON.stringify(shareResponse.data)}`);

  const publicLinkResponse = await request('/shares/link', {
    method: 'POST',
    body: JSON.stringify({
      itemId: fileId,
      itemType: 'file',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      password: 'secret123',
    }),
  }, loginCookies);

  assert.equal(publicLinkResponse.response.status, 201, `Public link failed: ${JSON.stringify(publicLinkResponse.data)}`);
  assert.ok(publicLinkResponse.data.link.publicUrl.includes('/shared/'));

  const searchResponse = await request(`/search?query=notes&sortBy=name&sortOrder=asc&type=all`, {
    method: 'GET',
  }, loginCookies);

  assert.equal(searchResponse.response.status, 200, `Search failed: ${JSON.stringify(searchResponse.data)}`);
  assert.ok(searchResponse.data.results.files.length >= 1);

  const trashResponse = await request(`/files/${fileId}`, { method: 'DELETE' }, loginCookies);
  assert.equal(trashResponse.response.status, 200, `Delete failed: ${JSON.stringify(trashResponse.data)}`);

  const trashListResponse = await request('/trash', { method: 'GET' }, loginCookies);
  assert.equal(trashListResponse.response.status, 200, `Trash list failed: ${JSON.stringify(trashListResponse.data)}`);
  assert.ok(trashListResponse.data.trash.some((item) => item.fileId === fileId || item.folderId === folderId));

  const trashItem = trashListResponse.data.trash.find((item) => item.fileId === fileId);
  const restoreResponse = await request(`/trash/${trashItem.id}/restore`, { method: 'POST' }, loginCookies);
  assert.equal(restoreResponse.response.status, 200, `Restore failed: ${JSON.stringify(restoreResponse.data)}`);

  const restoredTrashResponse = await request('/trash', { method: 'GET' }, loginCookies);
  assert.equal(restoredTrashResponse.response.status, 200);
  assert.ok(!restoredTrashResponse.data.trash.some((item) => item.fileId === fileId));
});
