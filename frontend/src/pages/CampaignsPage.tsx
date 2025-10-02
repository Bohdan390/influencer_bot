import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Mail, 
  MessageSquare, 
  Users, 
  Send, 
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  MousePointer,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import EmailHistory from '../components/EmailHistory';
import ChatInterface from '../components/ChatInterface';
import EmailCampaignMessages from '../components/EmailCampaignMessages';

interface EmailCampaign {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  content: string;
  html_content?: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  provider: string;
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
  influencer_id?: string;
  influencers?: {
    instagram_handle?: string;
    full_name?: string;
    profile_image?: string;
  };
}

const CampaignsPage: React.FC = () => {
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientEmail: '',
    recipientName: '',
    subject: '',
    content: '',
    influencerId: ''
  });

  const { toast } = useToast();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchEmailCampaigns();
  }, []);

  const fetchEmailCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/email-campaigns`);
      if (!response.ok) {
        throw new Error('Failed to fetch email campaigns');
      }
      const data = await response.json();
      setEmailCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch email campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!emailForm.recipientEmail || !emailForm.subject || !emailForm.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/email-campaigns/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: emailForm.recipientEmail,
          recipientName: emailForm.recipientName,
          subject: emailForm.subject,
          content: emailForm.content,
          htmlContent: emailForm.content,
          influencerId: emailForm.influencerId || null,
          metadata: {
            sentFrom: 'campaigns_page'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: "Email sent successfully",
      });

      // Reset form
      setEmailForm({
        recipientEmail: '',
        recipientName: '',
        subject: '',
        content: '',
        influencerId: ''
      });
      setShowEmailForm(false);

      // Refresh campaigns
      fetchEmailCampaigns();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    }
  };

  const filteredCampaigns = emailCampaigns.filter(campaign => {
    const matchesSearch = 
      campaign.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.recipient_name && campaign.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'opened':
        return <Eye className="h-4 w-4 text-orange-500" />;
      case 'clicked':
        return <MousePointer className="h-4 w-4 text-purple-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'opened':
        return 'bg-orange-100 text-orange-800';
      case 'clicked':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-gray-600">Manage your email outreach and chat with influencers</p>
        </div>
        <Button onClick={() => setShowEmailForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Send Email
        </Button>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="history">Email History</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by email, name, or subject..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="opened">Opened</SelectItem>
                      <SelectItem value="clicked">Clicked</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns List */}
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                </CardContent>
              </Card>
            ) : filteredCampaigns.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No email campaigns found</p>
                </CardContent>
              </Card>
            ) : (
              filteredCampaigns.map((campaign) => (
                <Card 
                  key={campaign.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(campaign.status)}
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(campaign.sent_at)}
                          </span>
                        </div>
                        
                        <h3 className="font-medium text-lg truncate">
                          {campaign.subject}
                        </h3>
                        
                        <p className="text-sm text-gray-600 truncate">
                          To: {campaign.recipient_email}
                        </p>
                        
                        {campaign.recipient_name && (
                          <p className="text-sm text-gray-500">
                            {campaign.recipient_name}
                          </p>
                        )}
                        
                        {campaign.influencers && (
                          <div className="flex items-center gap-2 mt-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {campaign.influencers.instagram_handle || campaign.influencers.full_name || 'Unknown'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {campaign.opened_at && (
                          <div className="flex items-center gap-1 text-sm text-orange-600">
                            <Eye className="h-4 w-4" />
                            Opened
                          </div>
                        )}
                        {campaign.clicked_at && (
                          <div className="flex items-center gap-1 text-sm text-purple-600">
                            <MousePointer className="h-4 w-4" />
                            Clicked
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <EmailCampaignMessages />
        </TabsContent>

        <TabsContent value="history">
          <EmailHistory />
        </TabsContent>

        <TabsContent value="chat">
          {selectedCampaign ? (
            <ChatInterface
              campaignId={selectedCampaign.id}
              influencerId={selectedCampaign.influencer_id}
              influencerName={selectedCampaign.recipient_name || selectedCampaign.recipient_email}
              influencerImage={selectedCampaign.influencers?.profile_image}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select an email campaign to start chatting</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Send Email Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipientEmail">Recipient Email *</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={emailForm.recipientEmail}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                    placeholder="influencer@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    value={emailForm.recipientName}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, recipientName: e.target.value }))}
                    placeholder="Influencer Name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Partnership Opportunity with Cosara"
                />
              </div>
              
              <div>
                <Label htmlFor="content">Message Content *</Label>
                <Textarea
                  id="content"
                  value={emailForm.content}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your email message here..."
                  rows={8}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEmailForm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={sendEmail}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;
