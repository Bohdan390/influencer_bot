import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MousePointer,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';

interface EmailCampaign {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  content: string;
  html_content?: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  provider: string;
  provider_message_id?: string;
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  error_message?: string;
  campaign_id?: string;
  influencer_id?: string;
  metadata?: any;
  influencers?: {
    instagram_handle?: string;
    full_name?: string;
    profile_image?: string;
  };
}

interface EmailHistoryProps {
  influencerId?: string;
  campaignId?: string;
  limit?: number;
  showInfluencerInfo?: boolean;
}

const EmailHistory: React.FC<EmailHistoryProps> = ({
  influencerId,
  campaignId,
  limit = 10,
  showInfluencerInfo = true
}) => {
  const [emails, setEmails] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailCampaign | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchEmails();
  }, [influencerId, campaignId, limit]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `${API_BASE}/api/email-campaigns`;
      if (influencerId) {
        url = `${API_BASE}/api/email-campaigns/influencer/${influencerId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch email history');
      }

      const data = await response.json();
      setEmails(data.campaigns || []);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch email history');
    } finally {
      setLoading(false);
    }
  };

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

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchEmails} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History
            <Badge variant="secondary">{emails.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No emails sent yet</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(email.status)}
                          <Badge className={getStatusColor(email.status)}>
                            {email.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatRelativeTime(email.sent_at)}
                          </span>
                        </div>
                        
                        <h4 className="font-medium text-sm truncate">
                          {email.subject}
                        </h4>
                        
                        <p className="text-sm text-gray-600 truncate">
                          To: {email.recipient_email}
                        </p>
                        
                        {showInfluencerInfo && email.influencers && (
                          <div className="flex items-center gap-2 mt-2">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {email.influencers.instagram_handle || email.influencers.full_name || 'Unknown'}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(email.sent_at)}
                          </div>
                          {email.opened_at && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Opened {formatRelativeTime(email.opened_at)}
                            </div>
                          )}
                          {email.clicked_at && (
                            <div className="flex items-center gap-1">
                              <MousePointer className="h-3 w-3" />
                              Clicked {formatRelativeTime(email.clicked_at)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmail(email);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] m-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Details
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEmail(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Subject</h3>
                    <p className="text-sm text-gray-600">{selectedEmail.subject}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Recipient</h3>
                    <p className="text-sm text-gray-600">{selectedEmail.recipient_email}</p>
                    {selectedEmail.recipient_name && (
                      <p className="text-sm text-gray-500">{selectedEmail.recipient_name}</p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Status</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedEmail.status)}
                      <Badge className={getStatusColor(selectedEmail.status)}>
                        {selectedEmail.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Content</h3>
                    <div 
                      className="text-sm text-gray-600 whitespace-pre-wrap border rounded p-3 bg-gray-50"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.html_content || selectedEmail.content }}
                    />
                  </div>
                  
                  {selectedEmail.error_message && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-medium mb-2 text-red-600">Error</h3>
                        <p className="text-sm text-red-600">{selectedEmail.error_message}</p>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmailHistory;
