import { Request, Response } from 'express';
import { ConsultationService } from './service';
import { AppError } from '../../infrastructure/middleware/error-handler';
import { logger } from '../../infrastructure/logging/logger';

const COMPONENT_NAME = 'ConsultationController';

export class ConsultationController {
  constructor(private service: ConsultationService) {}

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

      logger.info(COMPONENT_NAME, 'Received audio chunk', {
        sessionId,
        chunkNumber: validatedData.chunkNumber,
        isLastChunk: validatedData.isLastChunk,
        size: validatedData.metadata.size,
        type: validatedData.metadata.type,
        timestamp: validatedData.metadata.timestamp,
      });

      // For now, just return a success response
      res.status(202).json({
        success: true,
        metadata: {
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          chunkNumber: validatedData.chunkNumber,
          isLastChunk: validatedData.isLastChunk,
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
