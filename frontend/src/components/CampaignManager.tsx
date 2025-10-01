import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Check, 
  Mail, 
  MessageSquare, 
  Search, 
  Send as SendIcon,
  Send as SentIcon,
  Mail as MailIcon,
  Tag as TagIcon,
  Clock as ClockIcon,
  ChevronDown as ChevronDownIcon,
  Paperclip as AttachFile,
  Smile as InsertEmoticon,
  Send as SendButton,
  Minimize2 as Minimize,
  Maximize2 as Maximize,
  X,
  Loader2
} from "lucide-react";

const API_BASE = 'http://localhost:3000';

const CampaignManager = ({ onStatsUpdate }) => {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [emailCampaigns, setEmailCampaigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [newMessage, setNewMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [replyStats, setReplyStats] = useState({
    totalGoodReplies: 0,
    totalBadReplies: 0,
    totalReplies: 0,
    averageReplyRate: 0,
    unreadCampaigns: 0
  });
  const chatContainerRef = useRef(null);

  const getEmailCampaigns = async () => {
    const response = await fetch(`${API_BASE}/api/email-campaigns`);
    const data = await response.json();
    setEmailCampaigns(data.campaigns);
    
    // Calculate reply statistics (only for unread campaigns)
    const stats = data.campaigns.reduce((acc, campaign) => {
      if (!campaign.is_read) {
        acc.totalGoodReplies += campaign.good_reply_count || 0;
        acc.totalBadReplies += campaign.bad_reply_count || 0;
        acc.totalReplies += campaign.total_replies || 0;
        acc.unreadCampaigns += 1;
      }
      return acc;
    }, { totalGoodReplies: 0, totalBadReplies: 0, totalReplies: 0, unreadCampaigns: 0 });
    
    stats.averageReplyRate = stats.totalReplies > 0 ? 
      ((stats.totalGoodReplies / stats.totalReplies) * 100).toFixed(1) : 0;
    
    setReplyStats(stats);
  }

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const getEmailCampaignMessages = async (instagramHandle: string) => {
    const response = await fetch(`${API_BASE}/api/email-campaigns/${instagramHandle}/chat-messages`);
    const data = await response.json();
    setChatMessages(data.messages);
    
    // Scroll to bottom after messages are loaded
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }

  const markCampaignAsRead = async (campaignId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/email-campaigns/${campaignId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh the campaigns list to update the reply counts
        await getEmailCampaigns();
        // Update the main tab badges
        if (onStatsUpdate) {
          onStatsUpdate();
        }
      }
    } catch (error) {
      console.error('Error marking campaign as read:', error);
    }
  }

  const handleSendDM = async (data) => {
    try {
      setIsSending(true);
      const response = await fetch(`${API_BASE}/api/dm/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const result = await response.json();
      if (data.influencer.influencer_handle == selectedMessage.influencers.influencer_handle) {
        getEmailCampaignMessages(selectedMessage.influencers.instagram_handle);
        chatMessages.push({
          subject: data.subject,
          message: data.message,
          sender_type: 'user',
          created_at: new Date().toISOString(),
        });
        
        // Scroll to bottom after sending message
        setTimeout(() => {
          scrollToBottom();
        }, 100);
        
        // Update the main tab badges
        if (onStatsUpdate) {
          onStatsUpdate();
        }
      }
      // Clear the message input after successful send
      setNewMessage('');
      
      return result;
    } catch (error) {
      console.error('Error sending DM:', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    getEmailCampaigns();
  }, []);

  // Scroll to bottom when chat messages change
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Influencers Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-800">Influencers</h1>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search influencers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-100 border-0 rounded-full h-9 text-sm"
            />
          </div>
        </div>

        {/* Influencers List */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1 p-2">
            {emailCampaigns.map((contact) => (
              <div
                key={contact.id}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedMessage?.id === contact.id ? 'bg-blue-50 border border-blue-200' : ''
                }`}
                onClick={() => {
                  const message = emailCampaigns.find(m => m.id === contact.id);
                  if (message) {
                    setSelectedMessage(message);
                    // Mark campaign as read and reset reply counts
                    markCampaignAsRead(contact.id);
                  }
                  getEmailCampaignMessages(contact.influencers.instagram_handle);
                }}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={contact.influencers.profile_picture} alt={contact.influencers.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {contact.influencers.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{contact.influencers.name}</h4>
                    <span className="text-xs text-gray-500">{contact.created_at.split('T')[0]}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{contact.influencers.instagram_handle}</p>
                  <p className="text-xs text-gray-600 truncate mt-1">{contact.message}</p>
                  
                  {/* Reply Count Badges - Only show if not read */}
                  {!contact.is_read && (
                    <div className="flex items-center gap-2 mt-2">
                      {contact.good_reply_count > 0 && (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-0.5">
                          <Check className="w-3 h-3 mr-1" />
                          {contact.good_reply_count}
                        </Badge>
                      )}
                      {contact.bad_reply_count > 0 && (
                        <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-0.5">
                          <X className="w-3 h-3 mr-1" />
                          {contact.bad_reply_count}
                        </Badge>
                      )}
                      {contact.total_replies > 0 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          {contact.reply_rate}% rate
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Read indicator */}
                  {contact.is_read && (
                    <div className="flex items-center gap-1 mt-2">
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Read</span>
                    </div>
                  )}
                </div>
                {contact.unread > 0 && (
                  <div className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {contact.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {!selectedMessage ? (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Select an influencer</h3>
              <p className="text-gray-500">Choose an influencer to start messaging</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white">
            {/* Selected Influencer Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedMessage.influencers.profile_picture} alt={selectedMessage.influencers.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {selectedMessage.influencers.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedMessage.influencers.name}</h2>
                      <p className="text-sm text-gray-500">{selectedMessage.influencers.instagram_handle}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gmail Conversation View */}
            <div className="flex-1 flex flex-col bg-white">
              {/* Gmail Conversation Thread */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No messages yet</h3>
                      <p className="text-gray-500">Start a conversation with {selectedMessage.influencers.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto p-6" style={{height: 575}}>
                    {/* Conversation Messages */}
                    <div className="space-y-6" style={{marginBottom: 10}}>
                      {chatMessages.map((msg, index) => (
                        <div key={msg.id} className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={msg.influencers?.profile_picture || selectedMessage.influencers.profile_picture} alt={msg.sender_name} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {msg.sender_type === 'user' ? 'Y' : (msg.sender_name?.split(' ').map(n => n[0]).join('').toUpperCase() || selectedMessage.influencers.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2))}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {msg.sender_type === 'user' ? 'You' : (msg.sender_name || selectedMessage.influencers.name)}
                                </h4>
                                <span className="text-sm text-gray-500">
                                  {msg.sender_type === 'user' ? 'to ' + selectedMessage.influencers.name : 'to you'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">{msg.timestamp}</span>
                                {msg.sender_type === 'user' && (
                                  <Check className="h-4 w-4 text-blue-500" />
                                )}
                              </div>
                            </div>
                            <div style={{fontSize: 14}} dangerouslySetInnerHTML={{ __html: msg.message }}>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div style={{height: 10}}></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Gmail Reply Area */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="max-w-4xl mx-auto">
                  
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4">
                      <Textarea
                        placeholder="Type your message here..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="border-0 resize-none focus:ring-0 text-sm min-h-24"
                      />
                    </div>
                    <div className="flex items-center justify-end p-3 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Button 
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={() => handleSendDM({
                            influencer: selectedMessage.influencers,
                            subject: chatMessages[0].subject,
                            email: selectedMessage.influencers.email,
                            message_id: selectedMessage.message_id,
                            dmType: 'email',
                            message: newMessage.trim(),
                          })}
                          disabled={!newMessage.trim() || isSending}
                        >
                          {isSending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <SendButton className="h-4 w-4 mr-1" />
                          )}
                          {isSending ? 'Sending...' : 'Send'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
};

export default CampaignManager;
