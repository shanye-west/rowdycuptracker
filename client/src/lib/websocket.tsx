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
    const host = window.location.hostname; // Usually 'localhost' in dev

    // Determine the correct port for the WebSocket server (your Express server)
    // In development, your Express server (with WebSocket) runs on port 3000.
    // In production, WebSocket might be on the same port as HTTP/HTTPS if proxied,
    // or a specific port if configured differently.
    // For now, assuming Express dev server is on 3000.
    const wsPort = import.meta.env.DEV ? '3000' : window.location.port || (protocol === "wss:" ? "443" : "80");
    
    const wsUrl = `${protocol}//${host}:${wsPort}/ws`;
    console.log("Attempting WebSocket connection to:", wsUrl); // For debugging

    let ws: WebSocket | null = null;
    let reconnectTimeoutId: number | undefined;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setSocket(ws);
        if (reconnectTimeoutId) {
          clearTimeout(reconnectTimeoutId);
          reconnectTimeoutId = undefined;
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setSocket(null);
        
        if (!reconnectTimeoutId) { // Avoid multiple reconnect attempts stacking
          reconnectTimeoutId = window.setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connect(); // Re-attempt connection
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // ws.close(); // Ensure it's closed on error to trigger onclose for reconnect
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string); // Added "as string"
          console.log('WebSocket message received:', data);
          
          // Handle real-time updates (ensure queryKeys match those used in your components)
          switch (data.type) {
            case 'match_score_updated':
            case 'match_status_updated':
              queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
              queryClient.invalidateQueries({ queryKey: ['/api/rounds', data.data?.roundId, 'matches'] }); // More specific
              queryClient.invalidateQueries({ queryKey: ['/api/matches', data.data?.id] }); // Specific match
              break;
            case 'hole_score_updated':
              queryClient.invalidateQueries({ queryKey: ['/api/matches'] }); // General match list might show aggregate status
              queryClient.invalidateQueries({ queryKey: ['/api/matches', data.data?.matchId, 'scores'] }); // Specific scores
              queryClient.invalidateQueries({ queryKey: ['/api/matches', data.data?.matchId] }); // Specific match details
              break;
            case 'standings_updated':
              queryClient.invalidateQueries({ queryKey: ['/api/standings'] });
              queryClient.invalidateQueries({ queryKey: ['/api/teams'] }); // Teams include standings
              break;
            case 'team_created':
              queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
              break;
            case 'player_created':
              queryClient.invalidateQueries({ queryKey: ['/api/players'] });
              queryClient.invalidateQueries({ queryKey: ['/api/teams'] }); // Teams include players
              break;
            case 'round_created':
            case 'round_status_updated':
            case 'round_lock_updated':
            case 'round_deleted':
              queryClient.invalidateQueries({ queryKey: ['/api/rounds'] });
              break;
            case 'match_created':
            case 'match_lock_updated':
              queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
              queryClient.invalidateQueries({ queryKey: ['/api/rounds', data.data?.roundId, 'matches'] });
              break;
            case 'tournament_created':
            case 'tournament_active_updated':
              queryClient.invalidateQueries({queryKey: ['/api/tournaments']});
              queryClient.invalidateQueries({queryKey: ['/api/tournaments/active']});
              break;
            default:
              console.log("Unhandled WebSocket message type:", data.type);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    }

    connect(); // Initial connection attempt

    return () => {
      if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId);
      }
      if (ws) {
        ws.onclose = null; // Prevent reconnect logic on manual close
        ws.close();
      }
    };
  }, [queryClient]);

  const send = (data: Record<string, unknown>) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket not connected. Message not sent:", data);
    }
  };

  const value = { isConnected, send };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}