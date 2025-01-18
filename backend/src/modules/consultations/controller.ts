import { Request, Response } from 'express';
import { StorageService } from '@/infrastructure/storage';
import { AppError } from '@/infrastructure/middleware';
import { logger } from '@/infrastructure/logging';
import crypto from 'crypto';
import { ConsultationSessionRepository } from '@/modules/consultations/repository';
import { ConsultationSession } from '@/modules/consultations/models';
import { ConsultationNotFound } from '@/modules/consultations/errors';
import { CreateConsultationResponse } from './dtos';
import { AudioChunkUploadFailed } from '@/modules/consultations/errors';

export namespace Consultations {
  export class Controller {
    private readonly COMPONENT_NAME = 'ConsultationController';

    constructor(
      private repository: ConsultationSessionRepository,
      private storageService: StorageService
    ) {}

    async createConsultation(req: Request, res: Response) {
      try {
        const metadata = req.body.metadata || {};
        const consultation = await this.repository.createConsultation(metadata);
        
        // Map domain model to DTO
        const response: CreateConsultationResponse = {
          session: consultation.toJSON()
        };

        logger.info(this.COMPONENT_NAME, 'Consultation created', {
          id: consultation.toJSON().id
        });

        res.status(201).json(response);
      } catch (error) {
        logger.error(this.COMPONENT_NAME, 'Failed to create consultation', {
          error: error instanceof Error ? error.message : String(error)
        });
        throw new AppError(500, 'Failed to create consultation');
      }
    }

    async getConsultation(req: Request, res: Response) {
      try {
        const { id } = req.params;
        const consultation = await this.repository.findById(id);

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

        await this.repository.updateConsultationStatus(id, status);
        res.status(204).send();
      } catch {
        throw new AppError(500, 'Failed to update consultation status');
      }
    }

    async createSession(req: Request, res: Response) {
      try {
        const session = await this.repository.createConsultation();

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

    async uploadChunk(req: Request, res: Response): Promise<Response> {
      const { id } = req.params;
      try {
        logger.debug(this.COMPONENT_NAME, 'Processing chunk request', { 
          id,
          params: req.params,
          path: req.path,
          method: req.method
        });

        const consultation = await this.repository.findById(id);
        if (!consultation) {
          throw new ConsultationNotFound(id);
        }

        const { chunkNumber, isLastChunk } = req.validatedChunk!;
        const file = req.file!;

        // 1. Generate and upload to S3
        const s3Key = `sessions/${id}/chunks/${chunkNumber}`;
        logger.debug(this.COMPONENT_NAME, 'Uploading to S3', { 
          sessionId: id, 
          chunkNumber, 
          s3Key 
        });

        try {
          await this.storageService.uploadFile(s3Key, file.buffer, {
            contentType: file.mimetype,
            chunkNumber: String(chunkNumber),
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          logger.error(this.COMPONENT_NAME, 'S3 upload failed', {
            sessionId: id,
            chunkNumber,
            error: error instanceof Error ? error.message : String(error)
          });
          throw new AudioChunkUploadFailed(id, chunkNumber);
        }

        // 2. Update session with chunk info
        logger.debug(this.COMPONENT_NAME, 'Updating session with chunk info', {
          sessionId: id,
          chunkNumber,
          isLastChunk
        });

        consultation.addAudioChunk({
          chunkNumber,
          s3Key,
          isLastChunk,
          metadata: {
            size: file.size,
            type: file.mimetype,
            timestamp: new Date().toISOString()
          }
        });

        await this.repository.save(consultation);

        logger.info(this.COMPONENT_NAME, 'Audio chunk processed', {
          sessionId: id,
          chunkNumber,
          isLastChunk
        });

        return res.status(202).json({
          status: 'success',
          data: { sessionId: id }
        });

      } catch (error) {
        logger.error(this.COMPONENT_NAME, 'Failed to process audio chunk', {
          sessionId: id,
          error: error instanceof Error ? error.message : String(error)
        });
        
        if (error instanceof ConsultationNotFound || 
            error instanceof AudioChunkUploadFailed) {
          throw error;
        }
        throw new AudioChunkUploadFailed(id, req.validatedChunk?.chunkNumber || 0);
      }
    }
  }
}
