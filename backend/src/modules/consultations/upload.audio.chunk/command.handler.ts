import { ConsultationSessionRepository } from '@/modules/consultations/repository';
import { StorageService } from '@/infrastructure/storage';
import { logger } from '@/infrastructure/logging';
import { ConsultationNotFound, AudioChunkUploadFailed } from '../errors';
import { config } from '@/config/app.config';
import { AudioChunkUpload } from '../models';

const COMPONENT_NAME = 'UploadAudioChunkCommandHandler';

export interface UploadAudioChunkCommand {
  sessionId: string;
  chunkNumber: number;
  isLastChunk: boolean;
  file: Express.Multer.File;
}

export class UploadAudioChunkCommandHandler {
  constructor(
    private readonly repository: ConsultationSessionRepository,
    private readonly storageService: StorageService
  ) {}

  async execute(command: UploadAudioChunkCommand): Promise<void> {
    const { sessionId, chunkNumber, file, isLastChunk } = command;

    const consultation = await this.repository.findById(sessionId);
    if (!consultation) {
      throw new ConsultationNotFound(sessionId);
    }

    const s3Key = `sessions/${sessionId}/chunks/${chunkNumber}`;
    
    try {
      await this.storageService.uploadFile(s3Key, file.buffer, {
        bucket: config.aws.s3.audioBucket,
        metadata: {
          contentType: file.mimetype,
          chunkNumber: String(chunkNumber),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'S3 upload failed', {
        sessionId,
        chunkNumber,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new AudioChunkUploadFailed(sessionId, chunkNumber);
    }

    consultation.addAudioChunk({
      chunkNumber,
      s3Key,
      isLastChunk,
      size: file.size,
      type: file.mimetype,
      timestamp: new Date().toISOString()
    } as AudioChunkUpload);

    await this.repository.save(consultation);
  }
}