import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './useAuth'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && !socketRef.current) {
      socketRef.current = io('', {
        withCredentials: true,
      })
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [isAuthenticated])

  return socketRef.current
}