export class ConsultationNotFound extends Error {
  constructor(id: string) {
    super(`Consultation session not found: ${id}`);
    this.name = 'ConsultationNotFound';
  }
}

export class AudioChunkUploadFailed extends Error {
  constructor(sessionId: string, chunkNumber: number) {
    super(`Failed to upload audio chunk ${chunkNumber} for session ${sessionId}`);
    this.name = 'AudioChunkUploadFailed';
  }
}

export class CannotAddNoteToInactiveSession extends Error {
  constructor(sessionId: string) {
    super(`Cannot add notes to a non-active session: ${sessionId}`);
    this.name = 'CannotAddNoteToInactiveSession';
  }
}

export class EmptyNoteError extends Error {
  constructor() {
    super('Note cannot be empty');
    this.name = 'EmptyNoteError';
  }
}

export class NoteTooLongError extends Error {
  constructor(maxLength: number) {
    super(`Note cannot be longer than ${maxLength} characters`);
    this.name = 'NoteTooLongError';
  }
}

export class AudioProcessingIncomplete extends Error {
  constructor(sessionId: string) {
    super(`Audio processing is not complete for session: ${sessionId}`);
    this.name = 'AudioProcessingIncomplete';
  }
} 