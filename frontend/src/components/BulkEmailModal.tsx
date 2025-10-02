import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Mail, Users, CheckCircle, AlertCircle, Sparkles, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Influencer {
  id: string | number;
  instagram_handle: string;
  full_name?: string;
  name?: string;
  email?: string;
  follower_count?: number;
  journey_stage?: string;
}

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  influencers: Influencer[];
  onSendBulk: (data: {
    influencers: Influencer[];
    subject: string;
    message: string;
  }) => Promise<void>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const BulkEmailModal: React.FC<BulkEmailModalProps> = ({
  isOpen,
  onClose,
  influencers,
  onSendBulk
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const { toast } = useToast();

  // Filter influencers who have email and haven't been contacted yet
  const eligibleInfluencers = influencers.filter(inf => 
    inf.email && 
    inf.journey_stage === 'discovered' && 
    !inf.journey?.reached_out
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setMessage('');
      setSendingProgress(0);
      setSentCount(0);
      setFailedCount(0);
    }
  }, [isOpen]);

  const handleGenerateMessage = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_BASE}/api/ai/generate-bulk-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          influencers: eligibleInfluencers,
          campaignType: 'bulk_outreach'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate message');
      }

      const data = await response.json();
      setMessage(data.message);
      setSubject(data.subject);

      toast({
        title: "Bulk Message Generated",
        description: `AI has generated a personalized message for ${eligibleInfluencers.length} influencers.`,
      });
    } catch (error) {
      console.error('Error generating message:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate bulk message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendBulk = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and message fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setSendingProgress(0);
    setSentCount(0);
    setFailedCount(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSendingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      await onSendBulk({
        influencers: eligibleInfluencers,
        subject,
        message
      });

      clearInterval(progressInterval);
      setSendingProgress(100);
      setSentCount(eligibleInfluencers.length);

      toast({
        title: "Bulk Email Sent",
        description: `Successfully sent emails to ${eligibleInfluencers.length} influencers.`,
      });

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error sending bulk emails:', error);
      toast({
        title: "Bulk Send Failed",
        description: "Failed to send bulk emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Bulk Email Campaign
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Overview */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Campaign Overview</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Total Influencers:</span>
                <span className="ml-2 text-blue-900">{influencers.length}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Eligible for Email:</span>
                <span className="ml-2 text-blue-900">{eligibleInfluencers.length}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Already Contacted:</span>
                <span className="ml-2 text-blue-900">
                  {influencers.length - eligibleInfluencers.length}
                </span>
              </div>
            </div>
          </div>

          {/* Influencer List - Only show eligible influencers */}
          <div className="max-h-48 overflow-y-auto border rounded-lg">
            <div className="p-3 bg-gray-50 border-b font-medium text-sm">
              Eligible Influencers ({eligibleInfluencers.length} ready to contact)
            </div>
            <div className="divide-y">
              {eligibleInfluencers.slice(0, 20).map((influencer) => (
                <div key={influencer.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium text-sm">{influencer.instagram_handle}</div>
                      <div className="text-xs text-gray-500">{influencer.email}</div>
                    </div>
                  </div>
                  <Badge variant="default" className="text-xs">
                    Ready to contact
                  </Badge>
                </div>
              ))}
              {eligibleInfluencers.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No eligible influencers found</p>
                  <p className="text-xs">All influencers have either been contacted or don't have email addresses</p>
                </div>
              )}
              {eligibleInfluencers.length > 20 && (
                <div className="p-3 text-center text-sm text-gray-500">
                  ... and {eligibleInfluencers.length - 20} more eligible influencers
                </div>
              )}
            </div>
          </div>

          {/* Email Content */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="message">Email Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your email message..."
                className="mt-1 min-h-32"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerateMessage}
                disabled={isGenerating || eligibleInfluencers.length === 0}
                variant="outline"
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Indicator */}
          {isSending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sending emails...</span>
                <span>{sentCount} sent, {failedCount} failed</span>
              </div>
              <Progress value={sendingProgress} className="w-full" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            onClick={handleSendBulk}
            disabled={!subject.trim() || !message.trim() || isSending || eligibleInfluencers.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to {eligibleInfluencers.length} Influencers
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEmailModal;
