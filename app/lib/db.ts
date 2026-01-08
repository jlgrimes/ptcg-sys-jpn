/**
 * Prisma Client Singleton (Prisma 7.x with PostgreSQL adapter)
 *
 * Creates a single Prisma client instance for the application.
 * Uses lazy initialization to avoid module-level instantiation issues.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Reuse pool if already created
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({ connectionString });
  }

  const adapter = new PrismaPg(globalForPrisma.pool);
  return new PrismaClient({ adapter });
}

/**
 * Get the Prisma client instance (lazy initialization)
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Export prisma as a getter for backwards compatibility
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getPrisma(), prop);
  },
});
