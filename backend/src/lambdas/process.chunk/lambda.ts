import { DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { ProcessChunkCommand, ProcessChunkCommandHandler } from '../../modules/consultations/commands';
import { DynamoDBConsultationSessionRepository } from '@/infrastructure/database/repositories/dynamodb.consultation-session.repository';
import { ProcessChunkStreamHandler } from './handler';
import { logger } from '@/infrastructure/logging';

const COMPONENT_NAME = 'ProcessChunkLambda';

const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT
});

const repository = new DynamoDBConsultationSessionRepository(
  dynamoDB,
  process.env.TABLE_NAME!
);

const processChunkHandler = new ProcessChunkCommandHandler(repository);
const streamHandler = new ProcessChunkStreamHandler(processChunkHandler);

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  logger.info(COMPONENT_NAME, 'Processing DynamoDB Stream event', { 
    recordCount: event.Records.length 
  });

  try {
    await streamHandler.handleEvent(event);
  } catch (error) {
    logger.error(COMPONENT_NAME, 'Failed to process event', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}; 