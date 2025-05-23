import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketContextType {
  isConnected: boolean;
  send: (data: any) => void;
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
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setSocket(null);
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        // Re-run this effect by updating state or manually creating connection
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        // Handle real-time updates
        switch (data.type) {
          case 'match_score_updated':
          case 'match_status_updated':
            queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
            break;
          case 'hole_score_updated':
            queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
            queryClient.invalidateQueries({ queryKey: ['/api/hole-scores'] });
            break;
          case 'standings_updated':
            queryClient.invalidateQueries({ queryKey: ['/api/standings'] });
            queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
            break;
          case 'team_created':
          case 'player_created':
            queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
            queryClient.invalidateQueries({ queryKey: ['/api/players'] });
            break;
          case 'round_created':
          case 'round_status_updated':
            queryClient.invalidateQueries({ queryKey: ['/api/rounds'] });
            break;
          case 'match_created':
            queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, [queryClient]);

  const send = (data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  };

  const value = { isConnected, send };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
