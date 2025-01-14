import { db } from './client';
import { promises as fs } from 'fs';
import path from 'path';
import { Migrator, Migration } from 'kysely';
import { logger } from '../logging/logger';

const COMPONENT_NAME = 'DatabaseMigrator';

async function migrateToLatest() {
  logger.info(COMPONENT_NAME, 'Starting database migration');
  
  const migrator = new Migrator({
    db,
    provider: {
      async getMigrations() {
        const migrations: Record<string, Migration> = {};
        const migrationsPath = path.join(__dirname, 'migrations');
        
        logger.debug(COMPONENT_NAME, 'Loading migrations from directory', { path: migrationsPath });
        
        const files = await fs.readdir(migrationsPath);
        logger.debug(COMPONENT_NAME, 'Found migration files', { count: files.length, files });
        
        for (const file of files) {
          if (file.endsWith('.ts')) {
            const migration = await import(path.join(migrationsPath, file));
            migrations[file.replace('.ts', '')] = migration;
            logger.trace(COMPONENT_NAME, 'Loaded migration file', { file });
          }
        }
        
        return migrations;
      },
    },
  });

  const { error, results } = await migrator.migrateToLatest();

  if (error) {
    logger.error(COMPONENT_NAME, 'Migration failed', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }

  if (results?.length) {
    logger.info(COMPONENT_NAME, 'Migrations completed successfully', { 
      appliedCount: results.length,
      migrations: results.map(it => it.migrationName) 
    });
  } else {
    logger.info(COMPONENT_NAME, 'No migrations to apply');
  }
}

migrateToLatest().catch((error: unknown) => {
  logger.error(COMPONENT_NAME, 'Unhandled migration error', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  process.exit(1);
});
