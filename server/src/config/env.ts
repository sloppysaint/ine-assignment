import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') })

export const env = {
  PORT: parseInt(process.env.PORT || '8080'),
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Database
//   DB_HOST: process.env.DB_HOST || 'localhost',
//   DB_PORT: parseInt(process.env.DB_PORT || '5432'),
//   DB_NAME: process.env.DB_NAME || 'auction',
//   DB_USER: process.env.DB_USER || 'postgres',
//   DB_PASSWORD: process.env.DB_PASSWORD || 'password',
//   DB_SSL: process.env.DB_SSL === 'true',
  
  // Redis
  UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL || '',
  
  // SendGrid
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  MAIL_FROM: process.env.MAIL_FROM || 'noreply@auction.com'
}