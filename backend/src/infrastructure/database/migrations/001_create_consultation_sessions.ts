import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('consultation_sessions')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('started_at', 'timestamptz', (col) => col.notNull())
    .addColumn('ended_at', 'timestamptz')
    .addColumn('status', 'text', (col) => 
      col.notNull().check(sql`status IN ('active', 'completed', 'error')`))
    .addColumn('metadata', 'jsonb', (col) => 
      col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_at', 'timestamptz', (col) => 
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamptz', (col) => 
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Add updated_at trigger
  await sql`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `.execute(db);

  await sql`
    CREATE TRIGGER update_consultation_sessions_updated_at
      BEFORE UPDATE ON consultation_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('consultation_sessions').execute();
} 