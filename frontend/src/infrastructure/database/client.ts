import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { Database } from './schema'

const dialect = new PostgresDialect({
  pool: new Pool({
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  })
})

export const db = new Kysely<Database>({
  dialect,
}) 