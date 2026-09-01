import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'crypto';

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

// Helper to upload file using multipart form-data
const uploadFileMultipart = (fileBuffer, filename, folderId) => {
  return new Promise((resolve, reject) => {
    const boundary = `----WebKitFormBoundary${crypto.randomBytes(16).toString('hex')}`;
    const contentType = `multipart/form-data; boundary=${boundary}`;

    // Build multipart body
    const parts = [];
    
    // Add folderId field
    if (folderId) {
      parts.push(`--${boundary}`);
      parts.push('Content-Disposition: form-data; name="folderId"');
      parts.push('');
      parts.push(folderId);
    }

    // Add file field
    parts.push(`--${boundary}`);
    parts.push(`Content-Disposition: form-data; name="file"; filename="${filename}"`);
    parts.push('Content-Type: application/octet-stream');
    parts.push('');

    const body = Buffer.concat([
      Buffer.from(parts.join('\r\n') + '\r\n'),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const url = new URL(BASE_URL + '/files/upload');
    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Length': body.length,
        ...(client.cookies && { 'Cookie': client.cookies }),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          if (res.headers['set-cookie']) {
            const cookies = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
            client.cookies = cookies;
          }
          resolve({ status: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

test('File Upload and Download End-to-End', async (t) => {
  const testFileContent = 'This is test file content for upload and download verification!';
  const fileBuffer = Buffer.from(testFileContent);
  
  // Step 1: Signup
  await t.test('1. Signup', async () => {
    const { status, data } = await request('POST', '/auth/signup', {
      body: {
        email: `upload-test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Upload Test User',
      },
    });
    assert.equal(status, 201);
    assert.ok(data.user.id);
    client.userId = data.user.id;
  });

  // Step 2: Create folder
  await t.test('2. Create folder', async () => {
    const { status, data } = await request('POST', '/folders', {
      body: { name: 'Upload Test Folder' },
    });
    assert.equal(status, 201);
    assert.ok(data.folder.id);
    client.folderId = data.folder.id;
  });

  // Step 3: Upload file
  await t.test('3. Upload file', async () => {
    const { status, data } = await uploadFileMultipart(fileBuffer, 'testfile.txt', client.folderId);
    assert.equal(status, 201, `Upload failed: ${data.message}`);
    assert.ok(data.file.id);
    assert.equal(data.file.name, 'testfile.txt');
    client.fileId = data.file.id;
  });

  // Step 4: Download file
  await t.test('4. Download file', async () => {
    return new Promise((resolve, reject) => {
      const url = new URL(BASE_URL + `/files/${client.fileId}/download`);
      const req = http.request(url, {
        method: 'GET',
        headers: {
          ...(client.cookies && { 'Cookie': client.cookies }),
        },
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            assert.equal(res.statusCode, 200, `Download failed with status ${res.statusCode}`);
            assert.equal(data, testFileContent, 'Downloaded content does not match uploaded content');
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  });

  // Step 5: Get file list
  await t.test('5. Get files in folder', async () => {
    const { status, data } = await request('GET', `/files?folderId=${client.folderId}`);
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.files));
    const uploadedFile = data.files.find(f => f.id === client.fileId);
    assert.ok(uploadedFile, 'File should be in the list');
    assert.equal(uploadedFile.name, 'testfile.txt');
  });

  // Step 6: Delete file
  await t.test('6. Delete file (move to trash)', async () => {
    const { status, data } = await request('DELETE', `/files/${client.fileId}`);
    assert.equal(status, 200);
    assert.ok(data.trash);
  });

  // Step 7: Verify file is in trash
  await t.test('7. Verify file in trash', async () => {
    const { status, data } = await request('GET', '/trash');
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.trash));
    // File might appear as a nested object in trash
    const trashItem = data.trash.find(t => 
      (t.fileId === client.fileId) || (t.file && t.file.id === client.fileId)
    );
    assert.ok(trashItem, `File (${client.fileId}) should be in trash. Trash contents: ${JSON.stringify(data.trash.map(t => ({ fileId: t.fileId, folderId: t.folderId })))}`);
  });
});
