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
    const wsPort = import.meta.env.DEV ? '3000' : window.location.port || (protocol === "wss:" ? "443" : "80");
    
    const wsUrl = `${protocol}//${host}:${wsPort}/ws`;
    // console.log("Attempting WebSocket connection to:", wsUrl); // For debugging

    let wsInstance: WebSocket | null = null;
    let reconnectTimeoutId: number | undefined;

    const connect = () => {
      // Clean up previous instance if any
      if (wsInstance) {
        wsInstance.onopen = null;
        wsInstance.onmessage = null;
        wsInstance.onerror = null;
        wsInstance.onclose = null;
        wsInstance.close();
      }
      
      wsInstance = new WebSocket(wsUrl);
      setSocket(wsInstance); // Set socket state early

      wsInstance.onopen = () => {
        console.log('WebSocket connected to:', wsUrl);
        setIsConnected(true);
        if (reconnectTimeoutId) {
          clearTimeout(reconnectTimeoutId);
          reconnectTimeoutId = undefined;
        }
      };

      wsInstance.onclose = (event) => {
        console.log('WebSocket disconnected.', event.reason);
        setIsConnected(false);
        setSocket(null); // Clear socket state
        
        // Only attempt to reconnect if not a deliberate close (e.g., code 1000)
        // and no existing reconnect attempt is scheduled.
        if (event.code !== 1000 && !reconnectTimeoutId) { 
          reconnectTimeoutId = window.setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connect();
          }, 3000);
        }
      };

      wsInstance.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Consider closing the socket here to trigger onclose and reconnect logic
        // wsInstance?.close(); 
      };

      wsInstance.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          console.log('WebSocket message received:', data);
          
          // Handle real-time updates
          // Ensure data.data contains necessary IDs for specific invalidations
          const messageData = data.data || {};

          switch (data.type) {
            case 'match_score_updated':
            case 'match_status_updated':
              queryClient.invalidateQueries({ queryKey: ['/api/matches'] }); // General list
              if (messageData.roundId) {
                queryClient.invalidateQueries({ queryKey: ['/api/rounds', messageData.roundId.toString(), 'matches'] });
              }
              if (messageData.id) {
                 queryClient.invalidateQueries({ queryKey: ['/api/matches', messageData.id.toString()] });
              }
              break;
            case 'hole_score_updated':
              if (messageData.matchId) {
                queryClient.invalidateQueries({ queryKey: ['/api/matches', messageData.matchId.toString(), 'scores'] });
                queryClient.invalidateQueries({ queryKey: ['/api/matches', messageData.matchId.toString()] });
                 // Also invalidate general matches list if match status/overall score changes
                queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
                if (messageData.roundId) { // Assuming hole_score_updated might include roundId
                    queryClient.invalidateQueries({ queryKey: ['/api/rounds', messageData.roundId.toString(), 'matches'] });
                }
              } else {
                queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
              }
              break;
            case 'standings_updated':
              queryClient.invalidateQueries({ queryKey: ['/api/standings'] });
              queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
              break;
            case 'team_created':
              queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
              break;
            case 'player_created':
              queryClient.invalidateQueries({ queryKey: ['/api/players'] });
              queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
              break;
            case 'round_created':
            case 'round_status_updated':
            case 'round_lock_updated':
            case 'round_deleted':
              queryClient.invalidateQueries({ queryKey: ['/api/rounds'] });
               // If rounds affect tournament views (e.g. list of rounds in a tournament)
              if (messageData.tournamentId) {
                queryClient.invalidateQueries({ queryKey: ['/api/tournaments', messageData.tournamentId.toString()] });
                queryClient.invalidateQueries({ queryKey: ["/api/rounds", { tournamentId: messageData.tournamentId }] });
              }
              break;
            case 'match_created':
            case 'match_lock_updated':
            case 'match_player_added': // Assuming this might affect match display
              queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
              if (messageData.roundId) {
                queryClient.invalidateQueries({ queryKey: ['/api/rounds', messageData.roundId.toString(), 'matches'] });
              }
              break;
            case 'course_created':
            case 'course_hole_created':
                 queryClient.invalidateQueries({queryKey: ['/api/courses']});
                 if(messageData.courseId) {
                     queryClient.invalidateQueries({queryKey: ['/api/courses', messageData.courseId.toString()]});
                     queryClient.invalidateQueries({queryKey: ['/api/courses', messageData.courseId.toString(), 'holes']});
                 }
                 break;
            case 'tournament_created':
            case 'tournament_active_updated':
                 queryClient.invalidateQueries({queryKey: ['/api/tournaments']});
                 queryClient.invalidateQueries({queryKey: ['/api/tournaments/active']});
                 break;
            default:
              console.warn("Unhandled WebSocket message type:", data.type);
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
      if (wsInstance) {
        wsInstance.onclose = null; 
        wsInstance.close();
        console.log("WebSocket connection closed on cleanup.");
      }
    };
  }, [queryClient]); // queryClient dependency is stable

  const send = (data: Record<string, unknown>) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket not connected or not ready. Message not sent:", data);
    }
  };

  const value = { isConnected, send };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}