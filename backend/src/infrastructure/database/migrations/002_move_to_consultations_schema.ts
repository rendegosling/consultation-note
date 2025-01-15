import { Kysely, sql } from 'kysely';

interface Database {
  consultation_sessions: {
    id: string;
    started_at: Date;
    ended_at: Date | null;
    status: string;
    metadata: unknown;
    created_at: Date;
    updated_at: Date;
  }
}

export async function up(db: Kysely<Database>): Promise<void> {
  // Create the schema
  await db.schema.createSchema('consultations').execute();

  // Move the table to the new schema
  await sql`
    ALTER TABLE consultation_sessions 
    SET SCHEMA consultations
  `.execute(db);
}

export async function down(db: Kysely<Database>): Promise<void> {
  // Move the table back to public schema
  await sql`
    ALTER TABLE consultations.consultation_sessions 
    SET SCHEMA public
  `.execute(db);

  // Drop the schema
  await db.schema.dropSchema('consultations').execute();
} 