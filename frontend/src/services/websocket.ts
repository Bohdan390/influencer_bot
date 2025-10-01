/**
 * 🌐 Global WebSocket Service
 * Single connection shared across all components with auto-reconnect and error handling
 */

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketSubscription {
  id: string;
  type: string;
  handler: (message: WebSocketMessage) => void;
}

export interface WebSocketListener {
  id: string;
  type: string;
  callback: (message: WebSocketMessage) => void;
  once?: boolean; // If true, listener will be removed after first call
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscriptions = new Map<string, WebSocketSubscription>();
  private listeners = new Map<string, WebSocketListener>();
  private isConnecting = false;
  private shouldReconnect = true;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to WebSocket with auto-reconnect
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Wait for existing connection attempt
        const checkConnection = () => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            resolve();
          } else if (!this.isConnecting) {
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      this.isConnecting = true;
      console.log(`🔌 Connecting to WebSocket: ${this.url}`);

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect and stop reconnecting
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send message to server
   */
  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, message not sent:', message);
    }
  }

  /**
   * Subscribe to specific message types
   */
  subscribe(type: string, handler: (message: WebSocketMessage) => void): string {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.subscriptions.set(id, { id, type, handler });
    console.log(`📡 Subscribed to ${type} (${id})`);
    return id;
  }

  /**
   * Unsubscribe from message type
   */
  unsubscribe(id: string): void {
    if (this.subscriptions.delete(id)) {
      console.log(`📡 Unsubscribed ${id}`);
    }
  }

  /**
   * Unsubscribe all handlers for a specific type
   */
  unsubscribeType(type: string): void {
    const toDelete: string[] = [];
    this.subscriptions.forEach((sub, id) => {
      if (sub.type === type) {
        toDelete.push(id);
      }
    });
    toDelete.forEach(id => this.subscriptions.delete(id));
    console.log(`📡 Unsubscribed all handlers for ${type}`);
  }

  /**
   * Add a listener for specific message types
   */
  addListener(type: string, callback: (message: WebSocketMessage) => void, once = false): string {
    const id = `listener_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.listeners.set(id, { id, type, callback, once });
    console.log(`👂 Added listener for ${type} (${id})`);
    return id;
  }

  /**
   * Remove a specific listener
   */
  removeListener(id: string): void {
    if (this.listeners.delete(id)) {
      console.log(`👂 Removed listener ${id}`);
    }
  }

  /**
   * Remove all listeners for a specific type
   */
  removeListenersByType(type: string): void {
    const toDelete: string[] = [];
    this.listeners.forEach((listener, id) => {
      if (listener.type === type) {
        toDelete.push(id);
      }
    });
    toDelete.forEach(id => this.listeners.delete(id));
    console.log(`👂 Removed all listeners for ${type}`);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
    console.log(`👂 Removed all listeners`);
  }

  /**
   * Listen for a specific message type (returns promise)
   */
  waitForMessage(type: string, timeout = 10000): Promise<WebSocketMessage> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeListener(listenerId);
        reject(new Error(`Timeout waiting for message type: ${type}`));
      }, timeout);

      const listenerId = this.addListener(type, (message) => {
        clearTimeout(timeoutId);
        this.removeListener(listenerId);
        resolve(message);
      }, true);
    });
  }

  /**
   * Get connection status
   */
  getStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (this.isConnecting) return 'connecting';
    if (this.ws?.readyState === WebSocket.OPEN) return 'connected';
    if (this.ws?.readyState === WebSocket.CLOSED) return 'disconnected';
    return 'error';
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('📨 WebSocket message received:', message);
    
    // Call all subscribers for this message type
    this.subscriptions.forEach((subscription) => {
      if (subscription.type === message.type) {
        try {
          subscription.handler(message);
        } catch (error) {
          console.error(`❌ Error in subscription handler for ${subscription.type}:`, error);
        }
      }
    });

    // Call all listeners for this message type
    const listenersToRemove: string[] = [];
    this.listeners.forEach((listener, id) => {
      if (listener.type === message.type) {
        try {
          listener.callback(message);
          if (listener.once) {
            listenersToRemove.push(id);
          }
        } catch (error) {
          console.error(`❌ Error in listener for ${listener.type}:`, error);
        }
      }
    });

    // Remove one-time listeners
    listenersToRemove.forEach(id => this.listeners.delete(id));
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch((error) => {
          console.error('❌ Reconnection failed:', error);
        });
      }
    }, delay);
  }
}

// Create singleton instance with environment-based URL
const getWebSocketUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  // Convert http/https to ws/wss
  const wsBase = apiBase.replace(/^http/, 'ws');
  return `${wsBase}/ws/discovery-progress`;
};

const wsService = new WebSocketService(getWebSocketUrl());

export default wsService;
