import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { getAccessToken } from '@/lib/api'

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
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = getAccessToken()
      
      if (token) {
        // Initialize socket connection
        const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
          auth: {
            token,
          },
          transports: ['websocket'],
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
