import { ConsultationSessionRepository } from '@/modules/consultations/repository';
import { logger } from '@/infrastructure/logging';
import { ConsultationNotFound } from '../errors';
import { AudioChunkStatus } from '../models';
import axios from 'axios';
import { config } from '@/config/app.config';

const COMPONENT_NAME = 'TranscribeAudioChunkCommandHandler';

export interface TranscribeAudioChunkCommand {
  sessionId: string;
  chunkNumber: number;
  s3Key: string;
}

export interface TranscribeAudioChunkResult {
  chunkNumber: number;
  transcript: string;
  processedAt: Date;
}

export class TranscribeAudioChunkCommandHandler {
  constructor(private readonly repository: ConsultationSessionRepository) {}
  
  async execute(command: TranscribeAudioChunkCommand): Promise<TranscribeAudioChunkResult | undefined> {
    logger.info(COMPONENT_NAME, 'Processing chunk', { command });

    const session = await this.repository.findById(command.sessionId);
    if (!session) throw new ConsultationNotFound(command.sessionId);
    
    const chunk = session.getChunkByNumber(command.chunkNumber);
    
    if (!chunk || chunk.status !== AudioChunkStatus.PENDING) {
      logger.info(COMPONENT_NAME, 'Skipping chunk - not pending', {
        chunkNumber: command.chunkNumber,
        currentStatus: chunk?.status
      });
      return undefined;
    }

    try {
      // Call our audio-to-text API without sessionId
      const response = await axios.post(
        `http://backend:5000/ai/audio-to-text`,
        {
          audioUrl: `s3://${command.s3Key}`
        },
        {
          headers: {
            'Authorization': 'Basic ' + Buffer.from('admin:password').toString('base64')
          }
        }
      );

      session.addTranscript(command.chunkNumber, response.data.text);
      await this.repository.save(session);

      return {
        chunkNumber: command.chunkNumber,
        transcript: response.data.text,
        processedAt: new Date()
      };

    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to transcribe chunk', {
        error: error instanceof Error ? error.message : String(error),
        sessionId: command.sessionId,
        chunkNumber: command.chunkNumber
      });
      throw error;
    }
  }
}