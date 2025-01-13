import { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely'

export interface Database {
  consultation_sessions: ConsultationSessionTable
}

export interface ConsultationSessionTable {
  id: string
  started_at: ColumnType<Date, string, string>
  ended_at: ColumnType<Date | null, string | null, string | null>
  status: 'active' | 'completed' | 'error'
  metadata: ColumnType<JsonObject, JsonObject, JsonObject>
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

// Types for CRUD operations
export type ConsultationSession = Selectable<ConsultationSessionTable>
export type NewConsultationSession = Insertable<ConsultationSessionTable>
export type ConsultationSessionUpdate = Updateable<ConsultationSessionTable> 