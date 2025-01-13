import { promises as fs } from 'fs';
import path from 'path';
import { FileMigrationProvider, Migrator } from 'kysely';
import { db } from './client';
import { logger } from '../logging/logger';

const COMPONENT_NAME = 'DatabaseMigrator';

async function migrateToLatest() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      logger.info(COMPONENT_NAME, 'Migration successful', {
        migrationName: it.migrationName,
      });
    } else if (it.status === 'Error') {
      logger.error(COMPONENT_NAME, 'Migration failed', {
        migrationName: it.migrationName,
        error: it.error,
      });
    }
  });

  if (error) {
    logger.error(COMPONENT_NAME, 'Migration failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

migrateToLatest(); 