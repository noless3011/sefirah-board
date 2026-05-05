import 'dotenv/config';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import db, { pool } from '../utils/db.js';
import { httpServer, io } from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: join(__dirname, '../../.env.test'), override: true });

export async function clearDatabase() {
  const tablenames = await db.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE '_prisma_migrations';`;

  if (tablenames.length === 0) return;

  const tables = tablenames
    .map(({ tablename }) => `"${tablename}"`)
    .join(', ');

  try {
    await db.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }
}

// Optional: Global setup/teardown if needed per file
beforeAll(async () => {
  // Ensure we are connected to the test database
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('DATABASE_URL must contain "test" to run tests.');
  }
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    io.close(() => {
      httpServer.close(() => {
        resolve();
      });
    });
  });
  await db.$disconnect();
  await pool.end();
});
