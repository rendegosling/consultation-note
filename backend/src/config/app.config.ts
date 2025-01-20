export interface AwsConfig {
  region: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  dynamodb: {
    tableName: string;
  };
  s3: {
    audioBucket: string;
    reportBucket: string;
  };
  sqs: {
    audioChunksQueue: string;
    summaryGenerationQueue: string;
  };
}

export interface LogConfig {
  level: string;
  service: string;
}

export interface ValidationConfig {
  audio: {
    maxChunkSize: number;  // in bytes
    allowedMimeTypes: string[];
  };
}

export interface AppConfig {
  port: number;
  environment: 'development' | 'staging' | 'production';
  aws: AwsConfig;
  logging: LogConfig;
  validation: ValidationConfig;
  storage: {
    signedUrls: {
      summary: {
        expirySeconds: number;  // in seconds
      };
    };
  };
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  environment: (process.env.NODE_ENV || 'development') as AppConfig['environment'],
  
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    service: process.env.SERVICE_NAME || 'consultation-backend'
  },

  aws: {
    region: process.env.AWS_REGION || 'ap-southeast-2',
    endpoint: process.env.AWS_ENDPOINT,
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    } : undefined,
    dynamodb: {
      tableName: process.env.DYNAMODB_TABLE || 'dev-consultation-sessions',
    },
    s3: {
      audioBucket: process.env.S3_AUDIO_BUCKET || 'dev-consultations-audio',
      reportBucket: process.env.S3_REPORT_BUCKET || 'dev-consultations-reports'
    },
    sqs: {
      audioChunksQueue: process.env.SQS_AUDIO_CHUNKS || 'dev-audio-chunks-queue',
      summaryGenerationQueue: process.env.SQS_SUMMARY_GENERATION || 'dev-summary-generation'
    }
  },

  validation: {
    audio: {
      maxChunkSize: Number(process.env.MAX_CHUNK_SIZE) || 2 * 1024 * 1024, // 2MB default
      allowedMimeTypes: ['audio/webm', 'audio/ogg', 'audio/wav']
    }
  },

  storage: {
    signedUrls: {
      summary: {
        expirySeconds: Number(process.env.SUMMARY_SIGNED_URL_EXPIRY) || 3600, // 1 hour default
      }
    }
  },
}; 