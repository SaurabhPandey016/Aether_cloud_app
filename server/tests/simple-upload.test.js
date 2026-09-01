import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../config/database.js';

test('Test: Direct Prisma file creation with buffer', async () => {
  const userId = 'cmtig65hw002ocyq2ei81zp29'; // Use existing user from previous test
  const buffer = Buffer.from('test file content');
  
  console.log('Creating file with buffer...');
  console.log('Buffer:', { length: buffer.length, type: buffer.constructor.name });
  
  try {
    const file = await prisma.file.create({
      data: {
        name: 'direct-test.txt',
        mimeType: 'text/plain',
        size: BigInt(buffer.length),
        fileData: buffer,
        fileKey: null,
        ownerId: userId,
        folderId: null,
      },
    });

    console.log('✅ File created:', file.id);
    assert.ok(file.id, 'File ID should exist');
    assert.equal(file.size.toString(), buffer.length.toString(), 'File size should match');
    
  } catch (error) {
    console.error('❌ Error creating file:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    console.error('  Stack:', error.stack?.split('\n').slice(0, 3).join('\n'));
    throw error;
  }
});
