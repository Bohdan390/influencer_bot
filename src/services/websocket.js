const WebSocket = require('ws');

/**
 * 🔄 Real-time Progress Tracking Service
 * Handles WebSocket connections for live progress updates during influencer discovery
 */
class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.activeDiscoveries = new Map(); // Track active discovery sessions
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/discovery-progress',
      perMessageDeflate: false
    });

    this.wss.on('connection', (ws, req) => {
      console.log('🔌 New WebSocket connection established');
      this.clients.add(ws);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connection',
        message: 'Connected to discovery progress updates',
        timestamp: new Date().toISOString()
      });

      // Handle client messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    console.log('✅ WebSocket server initialized on /ws/discovery-progress');
  }

  /**
   * Handle incoming client messages
   */
  handleClientMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        // Client wants to subscribe to discovery progress
        console.log(`📡 Client subscribed to discovery: ${data.discoveryId}`);
        break;
      case 'chat_message':
        // Broadcast chat message to all clients
        console.log(`💬 Chat message received for campaign: ${data.campaignId}`);
        this.broadcast({
          type: 'chat_message_received',
          campaignId: data.campaignId,
          message: data.message
        });
        break;
      case 'ping':
        // Respond to ping with pong
        this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      default:
        console.log('📨 Unknown message type:', data.type);
    }
  }

  /**
   * Send message to specific client
   */
  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('❌ Error sending WebSocket message:', error);
      }
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          console.error('❌ Error broadcasting WebSocket message:', error);
          this.clients.delete(ws);
        }
      } else {
        console.log(`⚠️ Client not ready, state: ${ws.readyState}`);
      }
    });
  }

  /**
   * Start tracking a discovery session
   */
  sendWebSocketMessage(socket, eventType, data) {
		if (socket && socket.readyState === 1) { // WebSocket.OPEN
			const message = JSON.stringify({
				type: eventType,
				data: data,
				timestamp: Date.now()
			});
			socket.send(message);
		}
	}

  startDiscovery(discoveryId, location, hashtags, options) {
    console.log(`🚀 Starting discovery tracking for ID: ${discoveryId}`);
    
    const discovery = {
      id: discoveryId,
      location,
      hashtags,
      options,
      status: 'starting',
      startTime: new Date(),
      currentStep: 'initializing',
      progress: 0,
      totalSteps: 0,
      completedSteps: 0,
      influencersFound: 0,
      influencersProcessed: 0,
      emailsFound: 0,
      errors: [],
      currentInfluencer: null,
      estimatedTimeRemaining: null
    };

    this.activeDiscoveries.set(discoveryId, discovery);
    
    console.log(`📡 Broadcasting discovery_started to ${this.clients.size} clients`);
    this.broadcast({
      type: 'discovery_started',
      discoveryId,
      data: discovery,
      timestamp: new Date().toISOString()
    });

    return discovery;
  }

  /**
   * Update discovery progress
   */
  updateProgress(discoveryId, updates) {
    const discovery = this.activeDiscoveries.get(discoveryId);
    if (!discovery) {
      console.warn(`⚠️ Discovery ${discoveryId} not found`);
      return;
    }

    // Update discovery data
    Object.assign(discovery, updates);
    discovery.lastUpdate = new Date();

    // Calculate progress percentage
    // if (discovery.totalSteps > 0) {
    //   discovery.progress = Math.round((discovery.completedSteps / discovery.totalSteps) * 100);
    // }

    // Estimate time remaining
    if (discovery.completedSteps > 0 && discovery.startTime) {
      const elapsed = Date.now() - discovery.startTime.getTime();
      const avgTimePerStep = elapsed / discovery.completedSteps;
      const remainingSteps = discovery.totalSteps - discovery.completedSteps;
      discovery.estimatedTimeRemaining = Math.round((remainingSteps * avgTimePerStep) / 1000); // in seconds
    }

    this.broadcast({
      type: 'discovery_progress',
      discoveryId,
      data: discovery,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Update current step
   */
  updateStep(discoveryId, step, details = {}) {
    this.updateProgress(discoveryId, {
      currentStep: step,
      stepDetails: details,
      completedSteps: (this.activeDiscoveries.get(discoveryId)?.completedSteps || 0) + 1
    });
  }

  /**
   * Add influencer found
   */
  addInfluencer(discoveryId, influencer, hasEmail = false) {
    const discovery = this.activeDiscoveries.get(discoveryId);
    if (!discovery) return;

    discovery.influencersFound++;
    if (hasEmail) {
      discovery.emailsFound++;
    }

    this.updateProgress(discoveryId, {
      currentInfluencer: {
        handle: influencer.instagram_handle,
        followers: influencer.follower_count,
        hasEmail,
        bio: influencer.bio?.substring(0, 100) + (influencer.bio?.length > 100 ? '...' : '')
      }
    });
  }

  /**
   * Add error
   */
  addError(discoveryId, error, context = '') {
    const discovery = this.activeDiscoveries.get(discoveryId);
    if (!discovery) return;

    discovery.errors.push({
      message: error.message || error,
      context,
      timestamp: new Date().toISOString()
    });

    this.updateProgress(discoveryId, {});
  }

  /**
   * Complete discovery
   */
  completeDiscovery(discoveryId, results) {
    const discovery = this.activeDiscoveries.get(discoveryId);
    if (!discovery) return;

    discovery.status = 'completed';
    discovery.endTime = new Date();
    discovery.duration = discovery.endTime - discovery.startTime;
    discovery.progress = 100;
    discovery.results = results;

    this.broadcast({
      type: 'discovery_completed',
      discoveryId,
      data: discovery,
      timestamp: new Date().toISOString()
    });

    // Clean up after 5 minutes
    setTimeout(() => {
      this.activeDiscoveries.delete(discoveryId);
    }, 5 * 60 * 1000);
  }

  /**
   * Fail discovery
   */
  failDiscovery(discoveryId, error) {
    const discovery = this.activeDiscoveries.get(discoveryId);
    if (!discovery) return;

    discovery.status = 'failed';
    discovery.endTime = new Date();
    discovery.duration = discovery.endTime - discovery.startTime;
    discovery.error = error.message || error;

    this.broadcast({
      type: 'discovery_failed',
      discoveryId,
      data: discovery,
      timestamp: new Date().toISOString()
    });

    // Clean up after 5 minutes
    setTimeout(() => {
      this.activeDiscoveries.delete(discoveryId);
    }, 5 * 60 * 1000);
  }

  /**
   * Get active discoveries
   */
  getActiveDiscoveries() {
    return Array.from(this.activeDiscoveries.values());
  }

  /**
   * Get discovery by ID
   */
  getDiscovery(discoveryId) {
    return this.activeDiscoveries.get(discoveryId);
  }
}

module.exports = new WebSocketService();
