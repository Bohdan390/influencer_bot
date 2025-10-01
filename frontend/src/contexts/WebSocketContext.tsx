/**
 * 🌐 WebSocket React Context
 * Provides WebSocket service to all components
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import wsService, { WebSocketMessage, WebSocketSubscription } from '../services/websocket';

interface WebSocketContextType {
  // Connection status
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Methods
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (message: WebSocketMessage) => void;
  subscribe: (type: string, handler: (message: WebSocketMessage) => void) => string;
  unsubscribe: (id: string) => void;
  unsubscribeType: (type: string) => void;
  
  // Listener methods
  addListener: (type: string, callback: (message: WebSocketMessage) => void, once?: boolean) => string;
  removeListener: (id: string) => void;
  removeListenersByType: (type: string) => void;
  waitForMessage: (type: string, timeout?: number) => Promise<WebSocketMessage>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  autoConnect = true 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  // Update status when WebSocket state changes
  useEffect(() => {
    const updateStatus = () => {
      const newStatus = wsService.getStatus();
      const connected = wsService.isConnected();
      
      setStatus(newStatus);
      setIsConnected(connected);
    };

    // Check status immediately
    updateStatus();

    // Check status every second
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      wsService.connect().catch(console.error);
    }
  }, [autoConnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsService.disconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      await wsService.connect();
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    wsService.disconnect();
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    wsService.send(message);
  }, []);

  const subscribe = useCallback((type: string, handler: (message: WebSocketMessage) => void) => {
    return wsService.subscribe(type, handler);
  }, []);

  const unsubscribe = useCallback((id: string) => {
    wsService.unsubscribe(id);
  }, []);

  const unsubscribeType = useCallback((type: string) => {
    wsService.unsubscribeType(type);
  }, []);

  const addListener = useCallback((type: string, callback: (message: WebSocketMessage) => void, once = false) => {
    return wsService.addListener(type, callback, once);
  }, []);

  const removeListener = useCallback((id: string) => {
    wsService.removeListener(id);
  }, []);

  const removeListenersByType = useCallback((type: string) => {
    wsService.removeListenersByType(type);
  }, []);

  const waitForMessage = useCallback((type: string, timeout = 10000) => {
    return wsService.waitForMessage(type, timeout);
  }, []);

  const value: WebSocketContextType = {
    isConnected,
    status,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    unsubscribeType,
    addListener,
    removeListener,
    removeListenersByType,
    waitForMessage,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to use WebSocket context
 */
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

/**
 * Hook to subscribe to specific message types
 */
export const useWebSocketSubscription = (
  type: string,
  handler: (message: WebSocketMessage) => void,
  deps: React.DependencyList = []
) => {
  const { subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    const subscriptionId = subscribe(type, handler);
    return () => unsubscribe(subscriptionId);
  }, [type, subscribe, unsubscribe, ...deps]);
};

/**
 * Hook for discovery progress specifically
 */
export const useDiscoveryProgress = (discoveryId: string | null) => {
  const [progress, setProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { subscribe, unsubscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!discoveryId || !isConnected) {
      setProgress(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Subscribe to discovery messages
    const subscriptions: string[] = [];

    const handleDiscoveryStarted = (message: WebSocketMessage) => {
      if (message.discoveryId === discoveryId) {
        setProgress(message.data);
        setIsLoading(false);
      }
    };

    const handleDiscoveryProgress = (message: WebSocketMessage) => {
      if (message.discoveryId === discoveryId) {
        setProgress(message.data);
      }
    };

    const handleDiscoveryCompleted = (message: WebSocketMessage) => {
      if (message.discoveryId === discoveryId) {
        setProgress(message.data);
        setIsLoading(false);
      }
    };

    const handleDiscoveryFailed = (message: WebSocketMessage) => {
      if (message.discoveryId === discoveryId) {
        setProgress(message.data);
        setIsLoading(false);
      }
    };

    // Subscribe to all discovery message types
    subscriptions.push(subscribe('discovery_started', handleDiscoveryStarted));
    subscriptions.push(subscribe('discovery_progress', handleDiscoveryProgress));
    subscriptions.push(subscribe('discovery_completed', handleDiscoveryCompleted));
    subscriptions.push(subscribe('discovery_failed', handleDiscoveryFailed));

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach(id => unsubscribe(id));
    };
  }, [discoveryId, isConnected, subscribe, unsubscribe]);

  return {
    progress,
    isLoading,
    isConnected,
  };
};

/**
 * Hook for easy WebSocket listening
 */
export const useWebSocketListener = (
  type: string,
  callback: (message: WebSocketMessage) => void,
  deps: React.DependencyList = []
) => {
  const { addListener, removeListener } = useWebSocket();

  useEffect(() => {
    const listenerId = addListener(type, callback);
    return () => removeListener(listenerId);
  }, [type, addListener, removeListener, ...deps]);
};

        /**
         * Hook for one-time message listening
         */
        export const useWebSocketOnce = (
          type: string,
          callback: (message: WebSocketMessage) => void,
          deps: React.DependencyList = []
        ) => {
          const { addListener, removeListener } = useWebSocket();

          useEffect(() => {
            const listenerId = addListener(type, callback, true);
            return () => removeListener(listenerId);
          }, [type, addListener, removeListener, ...deps]);
        };

        /**
         * Hook for chat message listening
         */
        export const useChatListener = (
          campaignId: string,
          callback: (message: any) => void,
          deps: React.DependencyList = []
        ) => {
          const { addListener, removeListener } = useWebSocket();

          useEffect(() => {
            const listenerId = addListener('chat_message_received', (message) => {
              if (message.campaignId === campaignId) {
                callback(message);
              }
            });
            return () => removeListener(listenerId);
          }, [campaignId, addListener, removeListener, ...deps]);
        };
