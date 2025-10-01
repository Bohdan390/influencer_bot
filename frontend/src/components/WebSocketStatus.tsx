/**
 * 🌐 WebSocket Status Component
 * Shows connection status and allows testing WebSocket functionality
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';

export const WebSocketStatus: React.FC = () => {
  const { isConnected, status, connect, disconnect, send } = useWebSocket();

  const handleTestPing = () => {
    send({
      type: 'ping',
      timestamp: Date.now(),
      message: 'Test ping from frontend'
    });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'disconnected':
      case 'error':
      default:
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-blue-100 text-blue-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800';
      case 'error':
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          WebSocket Status
          <Badge className={getStatusColor()}>
            {status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
          <div>URL: {(() => {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
            const cleanApiBase = apiBase.replace(/\/$/, '');
            const wsBase = cleanApiBase.replace(/^http/, 'ws');
            return `${wsBase}/ws/discovery-progress`;
          })()}</div>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={connect}
            disabled={isConnected || status === 'connecting'}
          >
            Connect
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={disconnect}
            disabled={!isConnected}
          >
            Disconnect
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleTestPing}
            disabled={!isConnected}
          >
            Test Ping
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebSocketStatus;
