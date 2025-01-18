import { DynamoDB } from 'aws-sdk';
import { IConsultationSessionRepository, ConsultationSession } from './types';
import { JsonObject } from '@/infrastructure/database/schema';
import { logger } from '../../infrastructure/logging/logger';
import { randomUUID } from 'crypto';

const COMPONENT_NAME = 'DynamoDBConsultationRepository';

export class DynamoDBConsultationSessionRepository implements IConsultationSessionRepository {
  private tableName: string;
  private dynamoDB: DynamoDB.DocumentClient;

  constructor(tableName: string, dynamoDB: DynamoDB.DocumentClient) {
    this.tableName = tableName;
    this.dynamoDB = dynamoDB;
    logger.info(COMPONENT_NAME, 'Initialized DynamoDB repository', {
      tableName,
      type: 'INIT'
    });
  }

  async createConsultation(metadata: JsonObject = {}): Promise<ConsultationSession> {
    try {
      logger.info(COMPONENT_NAME, 'Creating consultation session', {
        type: 'CREATE_START',
        metadata: JSON.stringify(metadata)
      });

      const id = randomUUID();
      const now = new Date();
      
      const session: ConsultationSession = {
        id,
        startedAt: now,
        endedAt: null,
        status: 'active',
        metadata
      };

      await this.dynamoDB.put({
        TableName: this.tableName,
        Item: {
          ...session,
          startedAt: now.toISOString()
        }
      }).promise();

      logger.info(COMPONENT_NAME, 'Successfully created consultation session', {
        type: 'CREATE_SUCCESS',
        sessionId: id
      });

      return session;
    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to create consultation', {
        type: 'CREATE_ERROR',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getConsultation(id: string): Promise<ConsultationSession | null> {
    try {
      logger.info(COMPONENT_NAME, 'Fetching consultation session', {
        type: 'GET_START',
        sessionId: id
      });

      const result = await this.dynamoDB.get({
        TableName: this.tableName,
        Key: { id }
      }).promise();

      if (!result.Item) {
        logger.info(COMPONENT_NAME, 'Consultation session not found', {
          type: 'GET_NOT_FOUND',
          sessionId: id
        });
        return null;
      }

      logger.info(COMPONENT_NAME, 'Successfully fetched consultation session', {
        type: 'GET_SUCCESS',
        sessionId: id
      });

      return {
        ...result.Item,
        startedAt: new Date(result.Item.startedAt),
        endedAt: result.Item.endedAt ? new Date(result.Item.endedAt) : undefined
      } as ConsultationSession;

    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to get consultation', {
        type: 'GET_ERROR',
        sessionId: id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async updateConsultationStatus(id: string, status: ConsultationSession['status']): Promise<void> {
    try {
      logger.info(COMPONENT_NAME, 'Updating consultation status', {
        type: 'UPDATE_START',
        sessionId: id,
        status
      });

      await this.dynamoDB.update({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': status
        }
      }).promise();

      logger.info(COMPONENT_NAME, 'Successfully updated consultation status', {
        type: 'UPDATE_SUCCESS',
        sessionId: id,
        status
      });

    } catch (error) {
      logger.error(COMPONENT_NAME, 'Failed to update consultation status', {
        type: 'UPDATE_ERROR',
        sessionId: id,
        status,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
} 