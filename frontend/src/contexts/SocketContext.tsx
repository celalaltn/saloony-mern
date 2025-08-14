import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  emit: (event: string, data?: any) => void
  on: (event: string, callback: (data: any) => void) => void
  off: (event: string, callback?: (data: any) => void) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  // Using null as default since Socket.IO is disabled
  const [socket] = useState<Socket | null>(null)
  const [isConnected] = useState(false)
  const { isAuthenticated, user } = useAuth()

  // Socket connection is disabled to prevent connection errors
  useEffect(() => {
    // Socket connection is intentionally disabled
    // Uncomment the code below when your backend Socket.IO server is ready
    /*
    if (isAuthenticated && user) {
      const token = getAccessToken()
      
      if (token) {
        // Initialize socket connection
        const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
          auth: {
            token,
          },
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000
        })

        // Connection event handlers
        newSocket.on('connect', () => {
          console.log('Socket connected:', newSocket.id)
          setIsConnected(true)
        })

        newSocket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason)
          setIsConnected(false)
        })

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error)
          setIsConnected(false)
        })

        // Set socket instance
        setSocket(newSocket)

        // Cleanup on unmount
        return () => {
          newSocket.close()
          setSocket(null)
          setIsConnected(false)
        }
      }
    } else {
      // User is not authenticated, close socket if exists
      if (socket) {
        socket.close()
        setSocket(null)
        setIsConnected(false)
      }
    }
    */
  }, [isAuthenticated, user])

  const emit = (event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    }
  }

  const on = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback)
    }
  }

  const off = (event: string, callback?: (data: any) => void) => {
    if (socket) {
      if (callback) {
        socket.off(event, callback)
      } else {
        socket.off(event)
      }
    }
  }

  const value: SocketContextType = {
    socket,
    isConnected,
    emit,
    on,
    off,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export default SocketContext
