import { app } from './app'
import { initializeDatabase } from './config/db'
import { env } from './config/env'

const PORT = env.PORT

async function startServer() {
  try {
    await initializeDatabase()
    
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })

    // Initialize Socket.IO
    const { initializeSocket } = await import('./socket')
    initializeSocket(server)

  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()