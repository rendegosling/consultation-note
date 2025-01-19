import { DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { ProcessChunkCommand, ProcessChunkCommandHandler } from '@/modules/consultations/commands';
import { DynamoDBConsultationSessionRepository } from '@/infrastructure/database/repositories/dynamodb.consultation-session.repository';
import { logger } from '@/infrastructure/logging';

const COMPONENT_NAME = 'ProcessChunkLambda';

const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  endpoint: 'http://localstack:4566'  // Use Docker service name instead of localhost
});

const repository = new DynamoDBConsultationSessionRepository(
  dynamoDB,
  'dev-consultation-sessions'
);

const processChunkHandler = new ProcessChunkCommandHandler(repository);

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  logger.info('🎯 Lambda triggered', COMPONENT_NAME, { 
    recordCount: event.Records.length 
  });

  const commandHandler = new ProcessChunkCommandHandler(repository);
  
  for (const record of event.Records) {
    logger.info('Processing record', COMPONENT_NAME, {
      eventName: record.eventName,
      keys: record.dynamodb?.Keys
    });

    if (record.eventName === 'MODIFY') {
      const newImage = DynamoDB.Converter.unmarshall(record.dynamodb?.NewImage || {});
      const oldImage = DynamoDB.Converter.unmarshall(record.dynamodb?.OldImage || {});

      const newChunks = newImage?.metadata?.audioChunks || [];
      const oldChunks = oldImage?.metadata?.audioChunks || [];

      logger.info('Chunks comparison', COMPONENT_NAME, {
        oldCount: oldChunks.length,
        newCount: newChunks.length,
        hasNewChunks: newChunks.length > oldChunks.length
      });

      if (newChunks.length > oldChunks.length) {
        const latestChunk = newChunks[newChunks.length - 1];
        
        logger.info('Processing latest chunk', COMPONENT_NAME, {
          sessionId: newImage.id,
          chunkNumber: latestChunk.chunkNumber,
          s3Key: latestChunk.s3Key
        });

        try {
          await commandHandler.execute({
            sessionId: newImage.id,
            chunkNumber: Number(latestChunk.chunkNumber),
            s3Key: latestChunk.s3Key
          });
          logger.info('Chunk processed successfully', COMPONENT_NAME);
        } catch (error) {
          logger.error('Failed to process chunk', COMPONENT_NAME, { error });
          throw error; // Re-throw to mark Lambda as failed
        }
      }
    }
  }
}; 