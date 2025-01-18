export const env = {
  port: process.env.PORT || 5000,
  environment: process.env.NODE_ENV || 'development',
  aws: {
    region: process.env.AWS_REGION || 'ap-southeast-2',
    endpoint: process.env.AWS_ENDPOINT || 'http://localstack:4566',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
    },
    dynamodb: {
      tableName: process.env.DYNAMODB_TABLE_NAME || 'dev-consultation-sessions'
    }
  }
}; 