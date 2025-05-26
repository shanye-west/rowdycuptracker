// client/src/lib/websocket.tsx
import { createContext, useContext, useEffect, useState, ReactNode, JSX } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketContextType {
  isConnected: boolean;
  send: (data: Record<string, unknown>) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps): JSX.Element {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    // Always target the backend server port (set via VITE_BACKEND_WS_PORT or default to 3000)
    const wsPort = import.meta.env.VITE_BACKEND_WS_PORT ?? '3000';

    const token = localStorage.getItem('auth_token') || '';
    const wsUrl = `${protocol}//${host}:${wsPort}/?token=${token}`;

    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      setIsConnected(true);
    };

    newSocket.onclose = () => {
      setIsConnected(false);
    };

    newSocket.onerror = () => {
      setIsConnected(false);
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Example: handle updates and invalidate related queries
        if (data?.type === 'match-update') {
          queryClient.invalidateQueries({ queryKey: ['match', data.matchId] });
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    setSocket(newSocket);
    return () => newSocket.close();
  }, [queryClient]);

  const send = (data: Record<string, unknown>) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, send }}>
      {children}
    </WebSocketContext.Provider>
  );
}