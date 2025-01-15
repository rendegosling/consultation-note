import { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonArray = JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export interface Database {
  'consultations.consultation_sessions': {
    id: Generated<string>;
    started_at: ColumnType<Date, string, never>;
    ended_at: ColumnType<Date | null, string | null, string | null>;
    status: 'active' | 'completed' | 'error';
    metadata: ColumnType<JsonObject, JsonObject, JsonObject>;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
  }
}

export type ConsultationRow = Selectable<Database['consultations.consultation_sessions']>;
export type NewConsultation = Insertable<Database['consultations.consultation_sessions']>;
export type ConsultationUpdate = Updateable<Database['consultations.consultation_sessions']>;
