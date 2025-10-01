import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, Clock, Users, Mail, Hash } from 'lucide-react';

interface DiscoveryProgressProps {
  discoveryId: string;
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: any) => void;
}

interface DiscoveryData {
  id: string;
  hashtags: string[];
  options: any;
  status: 'starting' | 'processing' | 'completed' | 'failed';
  currentStep: string;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  influencersFound: number;
  influencersProcessed: number;
  emailsFound: number;
  errors: any[];
  currentInfluencer: {
    handle: string;
    followers: number;
    hasEmail: boolean;
    bio: string;
  } | null;
  estimatedTimeRemaining: number | null;
  startTime: string;
  endTime?: string;
  duration?: number;
  results?: any;
  error?: string;
}

export const DiscoveryProgress: React.FC<DiscoveryProgressProps> = ({
  discoveryId,
  onComplete,
  onError,
  onProgress
}) => {
  const [discovery, setDiscovery] = useState<DiscoveryData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const cleanApiBase = apiBase.replace(/\/$/, '');
    const wsBase = cleanApiBase.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/discovery-progress`;
    addLog(`🔌 Attempting to connect to: ${wsUrl}`);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      addLog('✅ Connected to discovery progress WebSocket');
      setIsConnected(true);
      
      // Subscribe to this discovery
      const subscribeMessage = {
        type: 'subscribe',
        discoveryId
      };
      addLog(`📤 Sending subscription: ${JSON.stringify(subscribeMessage)}`);
      wsRef.current?.send(JSON.stringify(subscribeMessage));
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addLog(`📨 Received: ${data.type} - ${JSON.stringify(data).substring(0, 100)}...`);
        console.log(data)
        if (data.type === 'discovery_started' && data.discoveryId === discoveryId) {
          setDiscovery(data.data);
          addLog(`✅ Discovery started: ${data.data.hashtags.join(', ')}`);
          console.log('🔍 Calling onProgress for discovery_started:', data.data);
          onProgress?.(data.data);
        } 
        else if (data.type === 'discovery_progress' && data.discoveryId === discoveryId) {
          setDiscovery(data.data);
          addLog(`📊 Progress: ${data.data.progress}% - ${data.data.currentStep}`);
          console.log('🔍 Calling onProgress for discovery_progress:', data.data);
          onProgress?.(data.data);
        } else if (data.type === 'discovery_completed' && data.discoveryId === discoveryId) {
          setDiscovery(data.data);
          addLog(`✅ Discovery completed! Found ${data.data.influencersFound} influencers`);
          onComplete?.(data.data.results);
        } else if (data.type === 'discovery_failed' && data.discoveryId === discoveryId) {
          setDiscovery(data.data);
          addLog(`❌ Discovery failed: ${data.data.error}`);
          onError?.(data.data.error);
        } else if (data.type === 'connection') {
          addLog(`🔌 ${data.message}`);
        } else {
          addLog(`❓ Unknown message type: ${data.type}`);
        }
      } catch (error) {
        addLog(`❌ Error parsing message: ${error.message}`);
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason);
      setIsConnected(false);
      addLog(`❌ Connection closed: ${event.code} - ${event.reason}`);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      addLog(`❌ WebSocket error: ${error}`);
    };

    return () => {
      wsRef.current?.close();
    };
  }, [discoveryId, onComplete, onError]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-49), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const getStatusIcon = () => {
    if (!discovery) return <Clock className="h-4 w-4" />;
    
    switch (discovery.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    if (!discovery) return 'bg-gray-500';
    
    switch (discovery.status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'Calculating...';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  // Show progress UI even if discovery is null - just show connecting state
  if (!discovery) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Discovery in Progress...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Connecting...</span>
              <span>0%</span>
            </div>
            <Progress value={0} className="w-full" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span className="font-medium">Status:</span>
            </div>
            <p className="text-sm text-gray-600 ml-6">Initializing discovery...</p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected to WebSocket' : 'Connecting to WebSocket...'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Discovery Progress
            <Badge variant="outline" className={getStatusColor()}>
              {discovery.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{parseInt(discovery.progress.toString())}%</span>
            </div>
            <Progress value={discovery.progress} className="w-full" />
          </div>

          {/* Current Step */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span className="font-medium">Current Step:</span>
            </div>
            <p className="text-sm text-gray-600 ml-6">{discovery.currentStep}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                <span className="text-2xl font-bold">{discovery.influencersFound}</span>
              </div>
              <p className="text-xs text-gray-600">Influencers Found</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Mail className="h-4 w-4" />
                <span className="text-2xl font-bold">{discovery.emailsFound}</span>
              </div>
              <p className="text-xs text-gray-600">Emails Found</p>
            </div>
            
            <div className="text-center">
              <span className="text-2xl font-bold">{discovery.completedSteps}</span>
              <p className="text-xs text-gray-600">Steps Completed</p>
            </div>
            
            <div className="text-center">
              <span className="text-2xl font-bold">{discovery.totalSteps}</span>
              <p className="text-xs text-gray-600">Total Steps</p>
            </div>
          </div>

          {/* Current Influencer */}
          {discovery.currentInfluencer && (
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">Currently Processing:</span>
                <Badge variant="secondary">@{discovery.currentInfluencer.handle}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Followers:</span>
                  <span className="ml-1 font-medium">
                    {discovery.currentInfluencer.followers.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-1 font-medium">
                    {discovery.currentInfluencer.hasEmail ? '✅ Found' : '❌ Not found'}
                  </span>
                </div>
              </div>
              {discovery.currentInfluencer.bio && (
                <p className="text-sm text-gray-600 mt-2">
                  "{discovery.currentInfluencer.bio}"
                </p>
              )}
            </div>
          )}

          {/* Errors */}
          {discovery.errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="font-medium text-red-700">Errors ({discovery.errors.length})</span>
              </div>
              <div className="space-y-1">
                {discovery.errors.slice(-3).map((error, index) => (
                  <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Live Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs h-48 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Waiting for logs...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscoveryProgress;
