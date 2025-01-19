import { ConsultationNotFound } from "./errors";
import { ConsultationSessionRepository } from "./repository";
import { logger } from "@/infrastructure/logging";
import { AudioChunkStatus } from "./models";

// Process Chunk
export interface ProcessChunkCommand {
  sessionId: string;
  chunkNumber: number;
  s3Key: string;
}

export interface ProcessChunkResult {
  chunkNumber: number;
  transcript: string;
  processedAt: Date;
}

export class ProcessChunkCommandHandler {
  constructor(private readonly repository: ConsultationSessionRepository) {}
  
  async execute(command: ProcessChunkCommand): Promise<ProcessChunkResult | undefined> {
    logger.info('Processing chunk', 'ProcessChunkCommandHandler', { command });

    const session = await this.repository.findById(command.sessionId);
    if (!session) throw new ConsultationNotFound(command.sessionId);
    
    const chunk = session.getChunkByNumber(command.chunkNumber);
    
    if (!chunk || chunk.status !== AudioChunkStatus.PENDING) {
      logger.info('Skipping chunk - not pending', 'ProcessChunkCommandHandler', {
        chunkNumber: command.chunkNumber,
        currentStatus: chunk?.status
      });
      return undefined;
    }

    // Continue processing...
    const transcript = `Placeholder transcript for chunk ${command.chunkNumber}`;
    session.addTranscript(command.chunkNumber, transcript);
    await this.repository.save(session);

    return {
      chunkNumber: command.chunkNumber,
      transcript,
      processedAt: new Date()
    };
  }
}
