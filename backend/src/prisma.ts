import { PrismaClient } from '@prisma/client';
import { env } from './config/env';

export const prisma = new PrismaClient({
  datasources: env.DATABASE_URL
    ? {
        db: {
          url: env.DATABASE_URL,
        },
      }
    : undefined,
  log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
