import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageSquare, Instagram, Clock, Check, CheckCheck, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface Message {
  id: string;
  content: string;
  type: 'sent' | 'received';
  timestamp: string;
  read: boolean;
  delivered: boolean;
}

interface Conversation {
  id: string;
  influencer: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    followers: number;
    verified: boolean;
  };
  messages: Message[];
  lastMessage: string;
  lastActivity: string;
  unreadCount: number;
  status: 'active' | 'archived' | 'blocked';
}

const InstagramConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('cosara_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/instagram/conversations`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast({
        title: "Loading Failed",
        description: "Could not load Instagram conversations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE}/api/instagram/send-message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          message: newMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add message to conversation
        const newMsg: Message = {
          id: data.message_id,
          content: newMessage,
          type: 'sent',
          timestamp: new Date().toISOString(),
          read: false,
          delivered: false
        };

        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, newMsg],
          lastMessage: newMessage,
          lastActivity: 'just now'
        } : null);

        setNewMessage('');
        
        toast({
          title: "Message Sent",
          description: "Your message has been sent successfully",
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Send Failed",
        description: "Could not send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.influencer.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ConversationList = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (filteredConversations.length === 0) {
      return (
        <div className="text-center py-12">
          <Instagram className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Conversations</h3>
          <p className="text-gray-500">
            {searchQuery ? 'No conversations match your search' : 'No Instagram conversations found'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredConversations.map((conversation) => (
          <Card 
            key={conversation.id} 
            className={`cursor-pointer transition-colors ${
              selectedConversation?.id === conversation.id 
                ? 'ring-2 ring-purple-500 bg-purple-50' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => setSelectedConversation(conversation)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={conversation.influencer.avatar || conversation.influencer.profile_image || conversation.influencer.profile_picture} 
                      alt={conversation.influencer.name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {conversation.influencer.name ? 
                        conversation.influencer.name.split(' ').map(n => n[0]).join('').toUpperCase() :
                        conversation.influencer.handle ? 
                          conversation.influencer.handle.replace('@', '').substring(0, 2).toUpperCase() :
                          'IG'
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{conversation.influencer.name}</span>
                      {conversation.influencer.verified && (
                        <Check className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {conversation.influencer.handle} • {conversation.influencer.followers.toLocaleString()} followers
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {conversation.unreadCount > 0 && (
                    <Badge className="bg-purple-600 mb-1">{conversation.unreadCount}</Badge>
                  )}
                  <div className="text-xs text-muted-foreground">{conversation.lastActivity}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {conversation.lastMessage}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const MessageBubble = ({ message }: { message: Message }) => (
    <div className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          message.type === 'sent' 
            ? 'bg-purple-600 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <div className={`flex items-center gap-1 mt-1 text-xs ${
          message.type === 'sent' ? 'text-purple-200' : 'text-gray-500'
        }`}>
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {message.type === 'sent' && (
            <>
              {message.delivered ? (
                <CheckCheck className="w-3 h-3" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  const ConversationDetail = ({ conversation }: { conversation: Conversation }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage 
                  src={conversation.influencer.avatar || conversation.influencer.profile_image || conversation.influencer.profile_picture} 
                  alt={conversation.influencer.name}
                />
                <AvatarFallback className="text-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  {conversation.influencer.name ? 
                    conversation.influencer.name.split(' ').map(n => n[0]).join('').toUpperCase() :
                    conversation.influencer.handle ? 
                      conversation.influencer.handle.replace('@', '').substring(0, 2).toUpperCase() :
                      'IG'
                  }
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{conversation.influencer.name}</h3>
                  {conversation.influencer.verified && (
                    <Check className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <p className="text-muted-foreground">{conversation.influencer.handle}</p>
                <p className="text-sm">{conversation.influencer.followers.toLocaleString()} followers</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Instagram className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto max-h-96 mb-4">
            {conversation.messages.length > 0 ? (
              conversation.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No messages in this conversation yet</p>
              </div>
            )}
          </div>
          
          {/* Message Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={2}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button 
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Instagram Conversations</h2>
        <p className="text-muted-foreground">Manage direct messages with influencers</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Conversation List */}
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Direct Messages</CardTitle>
              <CardDescription>
                {filteredConversations.length > 0 
                  ? `${filteredConversations.length} conversation${filteredConversations.length !== 1 ? 's' : ''}`
                  : 'No conversations'
                }
              </CardDescription>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ConversationList />
            </CardContent>
          </Card>
        </div>

        {/* Conversation Detail */}
        <div className="col-span-12 lg:col-span-8">
          {selectedConversation ? (
            <ConversationDetail conversation={selectedConversation} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Instagram className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Conversation</h3>
                  <p className="text-gray-500">Choose a conversation from the list to view messages and reply</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstagramConversations; 