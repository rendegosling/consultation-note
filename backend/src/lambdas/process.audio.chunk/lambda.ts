import { SQSEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { ProcessChunkCommandHandler } from '@/modules/consultations/commands';
import { DynamoDBConsultationSessionRepository } from '@/infrastructure/database/repositories/dynamodb.consultation-session.repository';
import { logger } from '@/infrastructure/logging';

const COMPONENT_NAME = 'ProcessAudioChunkLambda';

const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  endpoint: process.env.AWS_ENDPOINT || 'http://localstack:4566'
});

const repository = new DynamoDBConsultationSessionRepository(
  dynamoDB,
  `${process.env.NODE_ENV}-consultation-sessions`
);

export const handler = async (event: SQSEvent): Promise<void> => {
  logger.debug('Lambda triggered', COMPONENT_NAME, { 
    messageCount: event.Records.length 
  });

  const commandHandler = new ProcessChunkCommandHandler(repository);
  
  for (const record of event.Records) {
    let message;
    try {
      message = JSON.parse(record.body);
      
      logger.debug('Processing message', COMPONENT_NAME, {
        sessionId: message.sessionId,
        chunkNumber: message.chunkNumber,
        s3Key: message.s3Key
      });

      await commandHandler.execute({
        sessionId: message.sessionId,
        chunkNumber: Number(message.chunkNumber),
        s3Key: message.s3Key
      });

      logger.info('Chunk processed successfully', COMPONENT_NAME, {
        sessionId: message.sessionId,
        chunkNumber: message.chunkNumber
      });

    } catch (error) {
      logger.error('Failed to process chunk', COMPONENT_NAME, { 
        error,
        sessionId: message?.sessionId,
        chunkNumber: message?.chunkNumber
      });
      throw error;
    }
  }
}; 