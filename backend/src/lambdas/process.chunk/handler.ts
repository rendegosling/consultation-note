import { DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { ProcessChunkCommand, ProcessChunkCommandHandler } from '../../modules/consultations/commands';
import { logger } from '@/infrastructure/logging';

const COMPONENT_NAME = 'ProcessChunkStreamHandler';

export class ProcessChunkStreamHandler {
  constructor(
    private readonly processChunkHandler: ProcessChunkCommandHandler
  ) {}

  async handleEvent(event: DynamoDBStreamEvent): Promise<void> {
    for (const record of event.Records) {
      try {
        if (record.eventName === 'MODIFY') {
          const newImage = DynamoDB.Converter.unmarshall(record.dynamodb?.NewImage || {});
          const oldImage = DynamoDB.Converter.unmarshall(record.dynamodb?.OldImage || {});

          // Check if new chunk was added
          if (newImage.metadata.audioChunks?.length > oldImage.metadata.audioChunks?.length) {
            const newChunk = newImage.metadata.audioChunks[newImage.metadata.audioChunks.length - 1];
            
            logger.info(COMPONENT_NAME, 'New chunk detected', {
              sessionId: newImage.id,
              chunkNumber: newChunk.chunkNumber
            });

            const command: ProcessChunkCommand = {
              sessionId: newImage.id,
              chunkNumber: newChunk.chunkNumber,
              s3Key: newChunk.s3Key
            };

            const result = await this.processChunkHandler.execute(command);

            logger.info(COMPONENT_NAME, 'Chunk processing completed', {
              sessionId: newImage.id,
              command,
              result
            });
          }
        }
      } catch (error) {
        logger.error(COMPONENT_NAME, 'Failed to process stream record', {
          error: error instanceof Error ? error.message : String(error),
          record
        });
        throw error;
      }
    }
  }
} 