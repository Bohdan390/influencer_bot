import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Mail,
  Search,
  Filter,
  MoreVertical,
  Reply,
  Forward,
  Trash2,
  Star,
  StarOff,
  Check,
  CheckCheck,
  Clock,
  Send,
  User,
  Bot,
  MessageSquare,
  Calendar,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Archive,
  Flag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket, useWebSocketListener } from '@/contexts/WebSocketContext';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import MessageComposer from './MessageComposer';

interface EmailMessage {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  content: string;
  html_content?: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
  error_message?: string;
  influencers?: {
    instagram_handle: string;
    full_name: string;
    profile_image?: string;
  };
}

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
  influencers?: {
    instagram_handle: string;
    full_name: string;
    profile_image?: string;
  };
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const EmailCampaignMessages: React.FC = () => {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterInfluencer, setFilterInfluencer] = useState('all');
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [composerInfluencer, setComposerInfluencer] = useState<any>(null);
  
  const { toast } = useToast();
  const { send: sendWebSocketMessage } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for real-time chat messages
  useWebSocketListener('chat_message_received', (message) => {
    if (message.campaignId === selectedCampaign) {
      setChatMessages(prev => [...prev, message.message]);
      scrollToBottom();
    }
  }, [selectedCampaign]);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (selectedMessage) {
      fetchChatMessages(selectedMessage.id);
      setSelectedCampaign(selectedMessage.id);
    }
  }, [selectedMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/email-campaigns`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.campaigns || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast({
        title: "Error",
        description: "Failed to load email messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (campaignId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/email-campaigns/${campaignId}/chat`);
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedCampaign) return;

    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE}/api/email-campaigns/${selectedCampaign}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: selectedCampaign,
          sender_type: 'user',
          sender_name: 'You',
          message: newMessage.trim(),
          message_type: 'text',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, data.chatMessage]);
        setNewMessage('');
        
        // Send via WebSocket for real-time update
        sendWebSocketMessage({
          type: 'chat_message',
          campaignId: selectedCampaign,
          message: data.chatMessage
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleComposeMessage = async (messageData: {
    to: string;
    subject: string;
    content: string;
    htmlContent?: string;
    type: 'email' | 'dm';
  }) => {
    try {
      // Send email via the email campaigns API
      const response = await fetch(`${API_BASE}/api/email-campaigns/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: messageData.to,
          recipientName: composerInfluencer?.full_name || 'Influencer',
          subject: messageData.subject,
          content: messageData.content,
          htmlContent: messageData.htmlContent,
          influencerId: composerInfluencer?.id,
          campaignId: selectedCampaign || 'new-campaign'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Message Sent",
          description: "Your message has been sent successfully",
        });
        // Refresh messages
        fetchMessages();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`${API_BASE}/api/email-campaigns/${messageId}/chat/read`, {
        method: 'PUT',
      });
      setMessages(prev => 
        prev.map(msg => msg.id === messageId ? { ...msg, status: 'opened' } : msg)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Send className="h-4 w-4" />;
      case 'delivered': return <Check className="h-4 w-4" />;
      case 'opened': return <Eye className="h-4 w-4" />;
      case 'clicked': return <CheckCheck className="h-4 w-4" />;
      case 'failed': return <Trash2 className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'opened': return 'bg-purple-100 text-purple-800';
      case 'clicked': return 'bg-indigo-100 text-indigo-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = !searchTerm || 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.influencers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
    const matchesInfluencer = filterInfluencer === 'all' || 
      message.influencers?.instagram_handle === filterInfluencer;
    const matchesUnread = !showUnreadOnly || message.status === 'sent' || message.status === 'delivered';
    
    return matchesSearch && matchesStatus && matchesInfluencer && matchesUnread;
  });

  const InboxList = () => (
    <div className="space-y-1">
      {filteredMessages.map((message) => (
        <div
          key={message.id}
          className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
            selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          } ${message.status === 'sent' || message.status === 'delivered' ? 'font-semibold' : ''} ${
            message.status === 'sent' || message.status === 'delivered' ? 'bg-blue-50' : ''
          }`}
          onClick={() => {
            setSelectedMessage(message);
            markAsRead(message.id);
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={message.influencers?.profile_image} 
                  alt={message.influencers?.full_name || message.recipient_name}
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                  {message.influencers?.full_name ? 
                    message.influencers.full_name.split(' ').map(n => n[0]).join('').toUpperCase() :
                    message.recipient_name ? 
                      message.recipient_name.split(' ').map(n => n[0]).join('').toUpperCase() :
                      'U'
                  }
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {message.influencers?.full_name || message.recipient_name || message.recipient_email}
                  </span>
                  <Badge className={`text-xs ${getStatusColor(message.status)}`}>
                    {getStatusIcon(message.status)}
                    {message.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {message.influencers?.instagram_handle && `@${message.influencers.instagram_handle} • `}
                  {message.recipient_email}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right text-xs text-gray-500">
                {formatDistanceToNow(parseISO(message.sent_at), { addSuffix: true })}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setComposerInfluencer({
                      id: message.influencers?.instagram_handle || message.recipient_email,
                      instagram_handle: message.influencers?.instagram_handle || '',
                      full_name: message.influencers?.full_name || message.recipient_name || 'Influencer',
                      email: message.recipient_email,
                      profile_image: message.influencers?.profile_image
                    });
                    setShowComposer(true);
                  }}
                >
                  <Reply className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(message.id);
                  }}
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          <div className="ml-11">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-medium text-sm">{message.subject}</div>
              {(message.status === 'sent' || message.status === 'delivered') && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
            <div className="text-sm text-gray-600 line-clamp-2">
              {message.content.substring(0, 100)}...
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const MessageView = () => {
    if (!selectedMessage) return null;

    return (
      <div className="space-y-4">
        {/* Message Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={selectedMessage.influencers?.profile_image} 
                    alt={selectedMessage.influencers?.full_name || selectedMessage.recipient_name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    {selectedMessage.influencers?.full_name ? 
                      selectedMessage.influencers.full_name.split(' ').map(n => n[0]).join('').toUpperCase() :
                      selectedMessage.recipient_name ? 
                        selectedMessage.recipient_name.split(' ').map(n => n[0]).join('').toUpperCase() :
                        'U'
                    }
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedMessage.influencers?.full_name || selectedMessage.recipient_name || selectedMessage.recipient_email}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedMessage.influencers?.instagram_handle && `@${selectedMessage.influencers.instagram_handle} • `}
                    {selectedMessage.recipient_email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedMessage.status)}>
                  {getStatusIcon(selectedMessage.status)}
                  {selectedMessage.status}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setComposerInfluencer({
                      id: selectedMessage.influencers?.instagram_handle || selectedMessage.recipient_email,
                      instagram_handle: selectedMessage.influencers?.instagram_handle || '',
                      full_name: selectedMessage.influencers?.full_name || selectedMessage.recipient_name || 'Influencer',
                      email: selectedMessage.recipient_email,
                      profile_image: selectedMessage.influencers?.profile_image
                    });
                    setShowComposer(true);
                  }}
                >
                  <Reply className="h-4 w-4 mr-1" />
                  Reply
                </Button>
                <Button variant="outline" size="sm">
                  <Forward className="h-4 w-4 mr-1" />
                  Forward
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{selectedMessage.subject}</h4>
                <div className="text-sm text-gray-600 mb-4">
                  Sent {format(parseISO(selectedMessage.sent_at), 'PPpp')}
                  {selectedMessage.opened_at && (
                    <span className="ml-4">
                      • Opened {format(parseISO(selectedMessage.opened_at), 'PPpp')}
                    </span>
                  )}
                </div>
              </div>
              <Separator />
              <div className="prose max-w-none">
                {selectedMessage.html_content ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedMessage.html_content }} />
                ) : (
                  <div className="whitespace-pre-wrap">{selectedMessage.content}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 pr-4">
              <div className="space-y-4">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-3 ${
                      msg.sender_type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender_type !== 'user' && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.influencers?.profile_image} alt={msg.sender_name} />
                        <AvatarFallback>
                          {msg.sender_type === 'influencer' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.sender_type === 'user'
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-200 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {msg.sender_type === 'user' ? 'You' : msg.sender_name || 'System'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {msg.message_type}
                        </Badge>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                      <span className={`text-xs ${msg.sender_type === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                        {formatDistanceToNow(parseISO(msg.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {msg.sender_type === 'user' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isSending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Campaign Messages</h1>
          <p className="text-gray-600">Manage and track your email campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowUnreadOnly(!showUnreadOnly)}>
            {showUnreadOnly ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showUnreadOnly ? 'Show All' : 'Unread Only'}
          </Button>
          <Button variant="outline" onClick={fetchMessages}>
            <Mail className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowComposer(true)}>
            <Send className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="opened">Opened</option>
              <option value="clicked">Clicked</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Inbox List */}
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Inbox
              </CardTitle>
              <CardDescription>
                {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <InboxList />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Message View */}
        <div className="col-span-12 lg:col-span-8">
          {selectedMessage ? (
            <MessageView />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Message</h3>
                  <p className="text-gray-500">Choose a message from the inbox to view details and chat</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Message Composer Modal */}
      <MessageComposer
        isOpen={showComposer}
        onClose={() => {
          setShowComposer(false);
          setComposerInfluencer(null);
        }}
        onSend={handleComposeMessage}
        selectedInfluencer={composerInfluencer}
      />
    </div>
  );
};

export default EmailCampaignMessages;
