import { Server as HttpServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { User } from '../models/user'
import { handleAuctionRooms } from './rooms'

export let io: SocketIOServer

export function initializeSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true
    }
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                   socket.request.headers.cookie?.split('token=')[1]?.split(';')[0]

      if (!token) {
        return next(new Error('Authentication required'))
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string }
      const user = await User.findByPk(decoded.userId)

      if (!user) {
        return next(new Error('Invalid user'))
      }

      socket.data.user = user
      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`User ${socket.data.user.name} connected`)

    handleAuctionRooms(socket)

    socket.on('disconnect', () => {
      console.log(`User ${socket.data.user.name} disconnected`)
    })
  })

  console.log('Socket.IO initialized')
  return io
}

export { io as socketIO }