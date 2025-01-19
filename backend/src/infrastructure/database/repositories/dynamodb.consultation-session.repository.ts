import { ConsultationSession, ConsultationSessionRepository, ConsultationStatus } from '@/modules/consultations';
import { DynamoDB } from 'aws-sdk';
import { logger } from '@/infrastructure/logging';
import { ConsultationNotFound } from '@/modules/consultations/errors';

const COMPONENT_NAME = 'DynamoDBConsultationSessionRepository';

export class DynamoDBConsultationSessionRepository implements ConsultationSessionRepository {
  constructor(
    private readonly dynamoDB: DynamoDB.DocumentClient,
    private readonly tableName: string
  ) {}

  async findById(id: string): Promise<ConsultationSession | null> {
    try {
      logger.info(COMPONENT_NAME, 'Fetching consultation session', { id });

      const params = {
        TableName: this.tableName,
        Key: {
          id: id
        }
      };

      logger.debug(COMPONENT_NAME, 'DynamoDB GetItem params', { 
        params,
        tableName: this.tableName,
        id 
      });

      const result = await this.dynamoDB.get(params).promise();

      if (!result.Item) {
        logger.info(COMPONENT_NAME, 'Consultation session not found', { id });
        return null;
      }

      return ConsultationSession.create({
        id: result.Item.id,
        status: result.Item.status,
        metadata: result.Item.metadata || {},
        startedAt: new Date(result.Item.startedAt),
        endedAt: result.Item.endedAt ? new Date(result.Item.endedAt) : null
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to fetch consultation session', {
        id,
        tableName: this.tableName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async save(consultation: ConsultationSession): Promise<void> {
    try {
      logger.info(COMPONENT_NAME, 'Saving consultation session', {
        id: consultation.toJSON().id,
        tableName: this.tableName
      });

      const data = consultation.toJSON();
      logger.debug(COMPONENT_NAME, 'Consultation data to save', { data });

      const item = {
        ...data,
        startedAt: data.startedAt.toISOString(),
        endedAt: data.endedAt?.toISOString() ?? null
      };
      
      logger.debug(COMPONENT_NAME, 'DynamoDB Item to save', { 
        tableName: this.tableName,
        item 
      });

      await this.dynamoDB.put({
        TableName: this.tableName,
        Item: item
      }).promise();

      logger.info(COMPONENT_NAME, 'Successfully saved consultation session');
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to save consultation session', {
        tableName: this.tableName,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async createConsultation(metadata?: Record<string, unknown>): Promise<ConsultationSession> {
    try {
      const consultation = ConsultationSession.createNew(metadata);
      await this.save(consultation);
      
      logger.info(COMPONENT_NAME, 'Created new consultation session', { 
        id: consultation.toJSON().id 
      });

      return consultation;
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to create consultation session', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async updateConsultationStatus(id: string, status: ConsultationStatus): Promise<void> {
    try {
      const consultation = await this.findById(id);
      if (!consultation) {
        throw new ConsultationNotFound(id);
      }

      consultation.updateStatus(status);
      await this.save(consultation);

      logger.info(COMPONENT_NAME, 'Successfully updated consultation status', { id, status });
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to update consultation status', {
        id,
        status,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
} 