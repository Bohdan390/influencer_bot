import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Send, 
  User, 
  Bot, 
  Clock,
  CheckCircle,
  MessageCircle
} from 'lucide-react';
import { useWebSocket, useChatListener } from '../contexts/WebSocketContext';
import { getProxiedImageUrl } from '@/utils/imageProxy';

interface ChatMessage {
  id: string;
  campaign_id: string;
  influencer_id?: string;
  sender_type: 'user' | 'influencer' | 'system';
  sender_name?: string;
  sender_email?: string;
  message: string;
  message_type: 'text' | 'email' | 'dm' | 'system';
  is_read: boolean;
  created_at: string;
  metadata?: any;
  influencers?: {
    instagram_handle?: string;
    full_name?: string;
    profile_image?: string;
  };
}

interface ChatInterfaceProps {
  campaignId: string;
  influencerId?: string;
  influencerName?: string;
  influencerImage?: string;
  onMessageSent?: (message: ChatMessage) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  campaignId,
  influencerId,
  influencerName = 'Influencer',
  influencerImage,
  onMessageSent
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { send: sendWebSocketMessage } = useWebSocket();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchMessages();
  }, [campaignId]);

  // Listen for real-time chat messages
  useChatListener(campaignId, (message) => {
    console.log('💬 Received chat message:', message);
    // Add the new message to the list
    setMessages(prev => [...prev, message.message]);
  }, [campaignId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/email-campaigns/${campaignId}/chat`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/email-campaigns/${campaignId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          senderType: 'user',
          senderName: 'Cosara Team',
          senderEmail: 'team@cosara.com',
          messageType: 'text',
          influencerId: influencerId,
          metadata: {
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const sentMessage = data.chatMessage;
      
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      
      // Notify parent component
      onMessageSent?.(sentMessage);

      // Send WebSocket notification
      sendWebSocketMessage({
        type: 'chat_message',
        campaignId: campaignId,
        message: sentMessage
      });

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'influencer':
        return <Bot className="h-4 w-4" />;
      case 'system':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getSenderName = (message: ChatMessage) => {
    if (message.sender_type === 'user') {
      return 'You';
    }
    if (message.sender_type === 'influencer') {
      return message.influencers?.instagram_handle || 
             message.influencers?.full_name || 
             influencerName;
    }
    return message.sender_name || 'System';
  };

  const getSenderAvatar = (message: ChatMessage) => {
    if (message.sender_type === 'influencer' && message.influencers?.profile_image) {
      return getProxiedImageUrl(message.influencers.profile_image);
    }
    if (message.sender_type === 'influencer' && influencerImage) {
      return getProxiedImageUrl(influencerImage);
    }
    return undefined;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat with {influencerName}
          <Badge variant="secondary">{messages.length}</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No messages yet</p>
                <p className="text-sm text-gray-500">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender_type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={getSenderAvatar(message)} />
                    <AvatarFallback>
                      {getSenderIcon(message.sender_type)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div
                    className={`flex-1 max-w-[80%] ${
                      message.sender_type === 'user' ? 'items-end' : 'items-start'
                    } flex flex-col`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        message.sender_type === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.sender_type === 'system'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {getSenderName(message)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(message.created_at)}
                      </span>
                      {message.sender_type === 'user' && (
                        <CheckCircle className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Error Message */}
        {error && (
          <div className="px-6 py-2 bg-red-50 border-t">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
