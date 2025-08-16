import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { env } from './config/env'
import { errorHandler } from './middleware/error'
import authRoutes from './routes/auth'
import auctionRoutes from './routes/auctions'
import notificationRoutes from './routes/notifications'

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

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../public')
  app.use(express.static(publicPath))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'))
  })
}

// Error handling
app.use(errorHandler)

export default app