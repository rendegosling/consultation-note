export const logger = {
  info: (component: string, message: string, meta?: Record<string, any>) => {
    console.log(`[INFO] [${component}] ${message}`, meta || '');
  },
  error: (component: string, message: string, meta?: Record<string, any>) => {
    console.error(`[ERROR] [${component}] ${message}`, meta || '');
  }
}; 