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
      bucket: string;
    };
  }
  
  export interface DatabaseConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  }
  
  export interface AppConfig {
    port: number;
    environment: 'development' | 'staging' | 'production';
    aws: {
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
        bucket: string;
      };
    };
  }