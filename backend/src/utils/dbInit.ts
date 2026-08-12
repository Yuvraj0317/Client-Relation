import { execSync } from 'child_process';
import path from 'path';
import { prisma } from '../prisma';
import { env } from '../config/env';

export async function ensureDatabaseSeeded() {
  const backendDir = path.resolve(__dirname, '../..');
  const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL || '';

  if (!databaseUrl || databaseUrl.includes('localhost')) {
    if (env.NODE_ENV === 'production') {
      console.warn('⚠️ WARNING: DATABASE_URL is missing or set to localhost in production!');
      console.warn('⚠️ Please add DATABASE_URL to your Render Web Service Environment Variables.');
      return;
    }
  }

  const childEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl,
  };

  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('🌱 Database connected but 0 users found. Running seed script...');
      execSync('npx prisma db seed', { stdio: 'inherit', cwd: backendDir, env: childEnv });
      console.log('✅ Demo login credentials successfully seeded into database!');
    } else {
      console.log(`✅ Database ready with ${userCount} existing users.`);
    }
  } catch (err: any) {
    console.log('⚠️ Database tables missing or uninitialized. Running automatic prisma db push & seed...');
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: backendDir, env: childEnv });
      execSync('npx prisma db seed', { stdio: 'inherit', cwd: backendDir, env: childEnv });
      console.log('✅ Automatic database schema push and demo credentials seeding completed!');
    } catch (seedErr) {
      console.error('❌ Failed to auto-initialize database tables/seed:', seedErr);
    }
  }
}
