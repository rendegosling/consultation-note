import { logger } from '@/infrastructure/logging';
import { ConsultationNote } from '../models';
import { ConsultationSessionRepository } from '../repository';

const COMPONENT_NAME = 'AddNoteCommandHandler';

// Command type definition
export interface AddNoteCommand {
  sessionId: string;
  note: string;
}

// Command result type definition
export interface AddNoteResult {
  id: string;
  sessionId: string;
  note: string;
  timestamp: string;
}

export class AddNoteCommandHandler {
  constructor(
    private readonly consultationSessionRepository: ConsultationSessionRepository
  ) {}

  async execute(command: AddNoteCommand): Promise<AddNoteResult> {
    try {
      logger.info(COMPONENT_NAME, 'Finding session', {
        sessionId: command.sessionId,
      });

      const session = await this.consultationSessionRepository.findById(command.sessionId);
      if (!session) {
        throw new Error(`Session not found: ${command.sessionId}`);
      }

      // Create the note value object first
      const note = ConsultationNote.create(command.note);
      
      // Pass the note object to session
      const consultationNote = session.addNote(note);

      await this.consultationSessionRepository.save(session);

      logger.info(COMPONENT_NAME, 'Note added successfully', {
        sessionId: session.id,
        noteId: consultationNote.id,
      });

      return {
        id: consultationNote.id,
        sessionId: session.id,
        note: consultationNote.note,
        timestamp: consultationNote.timestamp,
      };
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to execute add note command', {
        sessionId: command.sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
} 