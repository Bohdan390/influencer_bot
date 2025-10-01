/**
 * 🔄 Discovery Progress Component (New)
 * Uses global WebSocket service with React Context
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle, Clock, Users, Mail, Hash } from 'lucide-react';
import { useDiscoveryProgress } from '../contexts/WebSocketContext';

interface DiscoveryProgressProps {
  discoveryId: string;
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
}

export const DiscoveryProgressNew: React.FC<DiscoveryProgressProps> = ({
  discoveryId,
  onComplete,
  onError,
}) => {
  const { progress, isLoading, isConnected } = useDiscoveryProgress(discoveryId);
  const [logs, setLogs] = useState<string[]>([]);

  // Add log function
  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-49), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Handle progress updates
  useEffect(() => {
    if (progress) {
      console.log('🔍 DiscoveryProgressNew received progress:', progress);
      addLog(`📊 Progress: ${progress.progress}% - ${progress.currentStep}`);
      
      // Call parent callback

      // Handle completion
      if (progress.status === 'completed') {
        addLog(`✅ Discovery completed! Found ${progress.influencersFound} influencers`);
        onComplete?.(progress.results);
      }

      // Handle failure
      if (progress.status === 'failed') {
        addLog(`❌ Discovery failed: ${progress.error}`);
        onError?.(progress.error);
      }
    }
  }, [progress, onComplete, onError]);

  // Add connection status log
  useEffect(() => {
    if (isConnected) {
      addLog('✅ Connected to WebSocket');
    } else {
      addLog('❌ Disconnected from WebSocket');
    }
  }, [isConnected]);

  const getStatusIcon = () => {
    if (!progress) return <Clock className="h-4 w-4" />;
    
    switch (progress.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    if (!progress) return 'bg-gray-500';
    
    switch (progress.status) {
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

  // Show loading state if no progress data yet
  if (!progress) {
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
              {progress.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{parseInt(progress.progress)}%</span>
            </div>
            <Progress value={progress.progress} className="w-full" />
          </div>

          {/* Current Step */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span className="font-medium">Current Step:</span>
            </div>
            <p className="text-sm text-gray-600 ml-6">{progress.currentStep}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                <span className="text-2xl font-bold">{progress.influencersFound || 0}</span>
              </div>
              <p className="text-xs text-gray-600">Influencers Found</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Mail className="h-4 w-4" />
                <span className="text-2xl font-bold">{progress.emailsFound || 0}</span>
              </div>
              <p className="text-xs text-gray-600">Emails Found</p>
            </div>
            
            <div className="text-center">
              <span className="text-2xl font-bold">{progress.completedSteps || 0}</span>
              <p className="text-xs text-gray-600">Steps Completed</p>
            </div>
            
            <div className="text-center">
              <span className="text-2xl font-bold">{progress.totalSteps || 0}</span>
              <p className="text-xs text-gray-600">Total Steps</p>
            </div>
          </div>

          {/* Errors */}
          {progress.errors && progress.errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="font-medium text-red-700">Errors ({progress.errors.length})</span>
              </div>
              <div className="space-y-1">
                {progress.errors.slice(-3).map((error: any, index: number) => (
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

export default DiscoveryProgressNew;
