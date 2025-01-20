import { DynamoDB } from 'aws-sdk';
import { config } from '@/config';

export class DynamoDBClient {
  private static instance: DynamoDB.DocumentClient;

  static getInstance(): DynamoDB.DocumentClient {
    if (!this.instance) {
      this.instance = new DynamoDB.DocumentClient({
        region: config.aws.region,
        endpoint: config.aws.endpoint,
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test'
        }
      });
    }
    return this.instance;
  }
} 