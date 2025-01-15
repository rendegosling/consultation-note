import { Request, Response } from 'express';
import { ConsultationService } from './service';
import { StorageService } from '../../infrastructure/storage/types';
import { AppError } from '../../infrastructure/middleware/error-handler';
import { logger } from '../../infrastructure/logging/logger';
import crypto from 'crypto';

const COMPONENT_NAME = 'ConsultationController';

export class ConsultationController {
  constructor(
    private service: ConsultationService,
    private storageService: StorageService
  ) {}

  async createConsultation(req: Request, res: Response) {
    try {
      const metadata = req.body.metadata || {};
      const consultation = await this.service.createConsultation({ metadata });
      res.status(201).json({ consultation });
    } catch {
      throw new AppError(500, 'Failed to create consultation');
    }
  }

  async getConsultation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const consultation = await this.service.getConsultation(id);

      if (!consultation) {
        throw new AppError(404, 'Consultation not found');
      }

      res.json({ consultation });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Failed to get consultation');
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      await this.service.updateStatus(id, status);
      res.status(204).send();
    } catch {
      throw new AppError(500, 'Failed to update consultation status');
    }
  }

  async createSession(req: Request, res: Response) {
    try {
      const session = await this.service.createSession();

      res.status(201).json({
        session,
        metadata: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      throw new AppError(500, 'Failed to create session');
    }
  }

  async uploadChunk(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const file = req.file;
      const validatedData = req.validatedChunk;

      if (!file || !validatedData) {
        throw new AppError(400, 'Missing required chunk data');
      }

      const requestId = crypto.randomUUID();

      logger.info(COMPONENT_NAME, 'Processing audio chunk', {
        requestId,
        sessionId,
        chunkNumber: validatedData.chunkNumber,
        size: validatedData.metadata.size,
      });

      // 1. Upload to S3
      const s3Key = `consultations/${sessionId}/chunks/${validatedData.chunkNumber}.wav`;
      logger.info(COMPONENT_NAME, 'Starting S3 upload', {
        requestId,
        sessionId,
        s3Key,
        chunkNumber: validatedData.chunkNumber,
      });

      await this.storageService.uploadFile(s3Key, file.buffer, {
        contentType: 'audio/wav',
        chunkNumber: validatedData.chunkNumber,
        timestamp: validatedData.metadata.timestamp,
        isLastChunk: String(validatedData.isLastChunk),
        requestId,
      });

      logger.info(COMPONENT_NAME, 'S3 upload completed', {
        requestId,
        sessionId,
        s3Key,
      });

      // 2. Create chunk record (to be implemented)
      // logger.info(COMPONENT_NAME, 'Recording chunk in database', {
      //   requestId,
      //   sessionId,
      //   chunkNumber: validatedData.chunkNumber,
      // });
      
      // await this.service.recordChunk({
      //   sessionId,
      //   chunkNumber: validatedData.chunkNumber,
      //   s3Key,
      //   requestId,
      //   metadata: {
      //     size: validatedData.metadata.size,
      //     type: validatedData.metadata.type,
      //     timestamp: validatedData.metadata.timestamp,
      //     isLastChunk: validatedData.isLastChunk,
      //   }
      // });

      // 3. Return accepted response
      logger.info(COMPONENT_NAME, 'Chunk processing accepted', {
        requestId,
        sessionId,
        chunkNumber: validatedData.chunkNumber,
        isLastChunk: validatedData.isLastChunk,
      });

      res.status(202).json({
        success: true,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          chunkNumber: validatedData.chunkNumber,
          isLastChunk: validatedData.isLastChunk,
          status: 'uploaded' // Changed from 'processing' to reflect actual state
        },
      });

    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to process audio chunk', {
        error: error instanceof Error ? error.message : String(error),
        sessionId: req.params.sessionId,
      });

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to process audio chunk');
    }
  }
}
