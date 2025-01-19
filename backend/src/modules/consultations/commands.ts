import { ConsultationNotFound } from "./errors";
import { ConsultationSessionRepository } from "./repository";
import { logger } from "@/infrastructure/logging";

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
  
  async execute(command: ProcessChunkCommand): Promise<ProcessChunkResult> {
    logger.info('ProcessChunkCommandHandler', 'Processing chunk', { 
      sessionId: command.sessionId,
      chunkNumber: command.chunkNumber,
      s3Key: command.s3Key
    });

    const session = await this.repository.findById(command.sessionId);
    if (!session) throw new ConsultationNotFound(command.sessionId);
    
    const transcript = `Placeholder transcript for chunk ${command.chunkNumber}`;
    logger.debug('ProcessChunkCommandHandler', 'Generated transcript', { 
      sessionId: command.sessionId,
      chunkNumber: command.chunkNumber,
      transcript 
    });

    session.addTranscript(command.chunkNumber, transcript);
    await this.repository.save(session);

    const result = {
      chunkNumber: command.chunkNumber,
      transcript,
      processedAt: new Date()
    };

    logger.info('ProcessChunkCommandHandler', 'Chunk processed', { 
      sessionId: command.sessionId,
      result 
    });

    return result;
  }
}
