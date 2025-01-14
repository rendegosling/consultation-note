import { Request, Response } from 'express';
import { ConsultationService } from './service';
import { AppError } from '../../infrastructure/middleware/error-handler';

export class ConsultationController {
  constructor(private service: ConsultationService) {}

  async createConsultation(req: Request, res: Response) {
    try {
      const metadata = req.body.metadata || {};
      const consultation = await this.service.createConsultation({ metadata });
      res.status(201).json({ consultation });
    } catch (error) {
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
    } catch (error) {
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
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      throw new AppError(500, 'Failed to create session');
    }
  }
}