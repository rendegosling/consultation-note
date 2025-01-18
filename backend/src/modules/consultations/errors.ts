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