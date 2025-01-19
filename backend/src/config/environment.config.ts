import { AppConfig } from './types/config.types';

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  environment: (process.env.NODE_ENV || 'development') as AppConfig['environment'],
  
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.AWS_ENDPOINT,
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    } : undefined,
    dynamodb: {
      tableName: process.env.DYNAMODB_TABLE || 'consultations',
    },
    s3: {
      bucket: process.env.S3_BUCKET || 'consultations-audio',
    },
  },
};