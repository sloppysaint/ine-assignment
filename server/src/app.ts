import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { env } from './config/env'
import { errorHandler } from './middleware/error'
import authRoutes from './routes/auth'
import auctionRoutes from './routes/auctions'
import notificationRoutes from './routes/notifications'

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}))

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/auctions', auctionRoutes)
app.use('/api/notifications', notificationRoutes)

// Serve static files from React build
const publicPath = path.join(__dirname, '../public')
app.use(express.static(publicPath))

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'))
})

// Error handling
app.use(errorHandler)

export default app