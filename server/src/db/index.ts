import { Pool, type PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

function resolveSsl(): PoolConfig['ssl'] {
  if (process.env.DATABASE_SSL === 'true') {
    return { rejectUnauthorized: false };
  }
  if (process.env.DATABASE_SSL === 'false') {
    return false;
  }
  if (process.env.DATABASE_URL?.includes('sslmode=require')) {
    return { rejectUnauthorized: false };
  }
  if (process.env.VERCEL) {
    return { rejectUnauthorized: false };
  }
  return false;
}

function buildPoolConfig(): PoolConfig {
  const ssl = resolveSsl();
  const isServerless = !!process.env.VERCEL;

  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl,
      max: isServerless ? 1 : 10,
      idleTimeoutMillis: isServerless ? 5000 : 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  if (process.env.DATABASE_HOST) {
    return {
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT) || 5432,
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      ssl,
      max: isServerless ? 1 : 10,
      idleTimeoutMillis: isServerless ? 5000 : 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  throw new Error(
    'Database not configured. Set DATABASE_URL or DATABASE_HOST/DATABASE_NAME/DATABASE_USERNAME/DATABASE_PASSWORD.'
  );
}

export const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});
