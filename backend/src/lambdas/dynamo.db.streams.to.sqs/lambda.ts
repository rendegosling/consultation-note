import { DynamoDBStreamEvent } from 'aws-lambda'
import { DynamoDB, SQS } from 'aws-sdk'
import { logger } from '@/infrastructure/logging';
import { config } from '@/config/app.config';

const COMPONENT_NAME = 'DynamoDbStreamsToSqsLambda';

const sqs = new SQS({
  region: config.aws.region,
  endpoint: config.aws.endpoint
});

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  logger.debug('🎯 Lambda triggered', COMPONENT_NAME, { 
    recordCount: event.Records.length 
  });

  for (const record of event.Records) {
    if (record.eventName === 'MODIFY') {
      const newImage = DynamoDB.Converter.unmarshall(record.dynamodb?.NewImage || {});
      const oldImage = DynamoDB.Converter.unmarshall(record.dynamodb?.OldImage || {});

      // Early return if status is not pending
//      if (newImage.status !== 'pending') {
//        logger.debug('Skipping non-pending session', COMPONENT_NAME, {
//          sessionId: newImage.id,
//          status: newImage.status
//        });
//        continue;
//      }

      const newChunks = newImage?.metadata?.audioChunks || [];
      const oldChunks = oldImage?.metadata?.audioChunks || [];

      // Only process if new chunks were added
      if (newChunks.length > oldChunks.length) {
        const latestChunk = newChunks[newChunks.length - 1];
        
        logger.info('Processing latest chunk', COMPONENT_NAME, {
          sessionId: newImage.id,
          chunkNumber: latestChunk.chunkNumber,
          s3Key: latestChunk.s3Key,
          status: newImage.status
        });

        try {
          const queueUrl = config.aws.sqs.audioChunksQueue;
          if (!queueUrl) {
            throw new Error('SQS_AUDIO_CHUNKS environment variable is not set');
          }

          // Send message to SQS
          await sqs.sendMessage({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify({
              sessionId: newImage.id,
              chunkNumber: Number(latestChunk.chunkNumber),
              s3Key: latestChunk.s3Key,
              eventName: record.eventName
            })
          }).promise();

          logger.debug('Message sent to SQS', COMPONENT_NAME, {
            sessionId: newImage.id,
            chunkNumber: latestChunk.chunkNumber
          });
        } catch (error) {
          logger.error('Failed to send message to SQS', COMPONENT_NAME, { error });
          throw error;
        }
      }
    }
  }
}; 