import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Database } from './schema';
import { logger } from '../logging/logger';

const COMPONENT_NAME = 'Database';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

pool.on('error', (err) => {
  logger.error(COMPONENT_NAME, 'Unexpected database error', {
    error: err.message,
    stack: err.stack
  });
});

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool
  })
}); 