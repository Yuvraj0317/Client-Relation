import { execSync } from 'child_process';
import path from 'path';
import { prisma } from '../prisma';

export async function ensureDatabaseSeeded() {
  const backendDir = path.resolve(__dirname, '../..');
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('🌱 No users found in database. Automatically running seed script...');
      execSync('npx prisma db seed', { stdio: 'inherit', cwd: backendDir });
      console.log('✅ Demo login credentials successfully seeded into database!');
    } else {
      console.log(`✅ Database ready with ${userCount} existing users.`);
    }
  } catch (err: any) {
    console.log('⚠️ Database tables missing or uninitialized. Running automatic prisma db push & seed...');
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: backendDir });
      execSync('npx prisma db seed', { stdio: 'inherit', cwd: backendDir });
      console.log('✅ Automatic database schema push and demo credentials seeding completed!');
    } catch (seedErr) {
      console.error('❌ Failed to auto-initialize database:', seedErr);
    }
  }
}
