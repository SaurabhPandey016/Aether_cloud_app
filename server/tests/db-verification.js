import prisma from '../config/database.js';

async function verifyDatabase() {
  try {
    console.log('🔍 Testing Prisma Database Connection...\n');

    // Test 1: Check if we can query User table
    console.log('1️⃣ Testing User table...');
    const userCount = await prisma.user.count();
    console.log(`   ✅ User table exists - Count: ${userCount} users\n`);

    // Test 2: Check if we can query Folder table
    console.log('2️⃣ Testing Folder table...');
    const folderCount = await prisma.folder.count();
    console.log(`   ✅ Folder table exists - Count: ${folderCount} folders\n`);

    // Test 3: Check if we can query File table
    console.log('3️⃣ Testing File table...');
    const fileCount = await prisma.file.count();
    console.log(`   ✅ File table exists - Count: ${fileCount} files\n`);

    // Test 4: Check if we can query Share table
    console.log('4️⃣ Testing Share table...');
    const shareCount = await prisma.share.count();
    console.log(`   ✅ Share table exists - Count: ${shareCount} shares\n`);

    // Test 5: Check if we can query PublicLink table
    console.log('5️⃣ Testing PublicLink table...');
    const publicLinkCount = await prisma.publicLink.count();
    console.log(`   ✅ PublicLink table exists - Count: ${publicLinkCount} public links\n`);

    // Test 6: Check if we can query Trash table
    console.log('6️⃣ Testing Trash table...');
    const trashCount = await prisma.trash.count();
    console.log(`   ✅ Trash table exists - Count: ${trashCount} trash items\n`);

    // Test 7: Check Session table
    console.log('7️⃣ Testing Session table...');
    const sessionCount = await prisma.session.count();
    console.log(`   ✅ Session table exists - Count: ${sessionCount} sessions\n`);

    console.log('✅ ALL DATABASE TABLES VERIFIED SUCCESSFULLY!');
    console.log('   All 7 tables are accessible via Prisma');
    console.log('   Database is ready for operations\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database Verification Failed:');
    console.error(error.message);
    process.exit(1);
  }
}

verifyDatabase();
