import React, { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Instagram, Send, Sparkles, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Influencer {
  id: string | number;
  instagram_handle: string;
  full_name?: string;
  name?: string;
  email?: string;
  follower_count?: number;
  avatar?: string;
  profile_image?: string;
  profile_picture?: string;
}

interface DMModalProps {
  isOpen: boolean;
  onClose: () => void;
  influencer: Influencer | null;
  onSend: (data: {
    influencer: Influencer;
    dmType: 'email' | 'instagram';
    message: string;
    firstSend: boolean;
    subject?: string;
  }) => Promise<void>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const DMModal: React.FC<DMModalProps> = ({
  isOpen,
  onClose,
  influencer,
  onSend
}) => {
  const [dmType, setDmType] = useState<'email' | 'instagram'>('email');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen && influencer) {
      setMessage('');
      setSubject('');
      setDmType(influencer.email ? 'email' : 'instagram');
    }
  }, [isOpen, influencer]);

  const handleGenerateMessage = async () => {
    if (!influencer) return;

    setIsGenerating(true);
    try {
      const response = await fetch(`${API_BASE}/api/ai/generate-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          influencer: influencer,
          dmType: dmType,
          campaignType: 'outreach'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate message');
      }

      const data = await response.json();
      setMessage(data.message);
      if (data.subject) {
        setSubject(data.subject);
      }

      toast({
        title: "Message Generated",
        description: "AI has generated a personalized message for this influencer.",
      });
    } catch (error) {
      console.error('Error generating message:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate message. Please try again or write manually.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!influencer || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a message before sending.",
        variant: "destructive",
      });
      return;
    }

    if (dmType === 'email' && !subject.trim()) {
      toast({
        title: "Missing Subject",
        description: "Please enter an email subject.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      await onSend({
        influencer,
        dmType,
        message: message.trim(),
        firstSend: true,
        subject: dmType === 'email' ? subject.trim() : undefined,
      });

      toast({
        title: "Message Sent",
        description: `Your ${dmType === 'email' ? 'email' : 'Instagram DM'} has been sent successfully.`,
      });

      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Send Failed",
        description: `Failed to send ${dmType === 'email' ? 'email' : 'Instagram DM'}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!influencer) return null;

  const canSendEmail = !!influencer.email;
  const canSendInstagram = !!influencer.instagram_handle;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Message to {influencer.full_name || influencer.instagram_handle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Influencer Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={influencer.profile_picture} 
                alt={influencer.full_name || influencer.instagram_handle}
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {influencer.full_name ? 
                  influencer.full_name.split(' ').map(n => n[0]).join('').toUpperCase() :
                  influencer.instagram_handle ? 
                    influencer.instagram_handle.replace('@', '').substring(0, 2).toUpperCase() :
                    <User className="h-5 w-5" />
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">
                {influencer.name || influencer.instagram_handle}
              </div>
              <div className="text-sm text-gray-600">
                {influencer.instagram_handle}
                {influencer.follower_count && (
                  <span className="ml-2">
                    • {influencer.follower_count.toLocaleString()} followers
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {canSendEmail && (
                <Badge variant="outline" className="text-xs">
                  <Mail className="h-3 w-3 mr-1" />
                  Email Available
                </Badge>
              )}
              {canSendInstagram && (
                <Badge variant="outline" className="text-xs">
                  <Instagram className="h-3 w-3 mr-1" />
                  Instagram Available
                </Badge>
              )}
            </div>
          </div>

          {/* DM Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Choose Message Type</Label>
            <RadioGroup
              value={dmType}
              onValueChange={(value: 'email' | 'instagram') => setDmType(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="email" 
                  id="email" 
                  disabled={!canSendEmail}
                />
                <Label 
                  htmlFor="email" 
                  className={`flex items-center gap-2 ${!canSendEmail ? 'text-gray-400' : 'cursor-pointer'}`}
                >
                  <Mail className="h-4 w-4" />
                  Email
                  {!canSendEmail && <span className="text-xs">(No email available)</span>}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="instagram" 
                  id="instagram"
                  disabled={!canSendInstagram}
                />
                <Label 
                  htmlFor="instagram" 
                  className={`flex items-center gap-2 ${!canSendInstagram ? 'text-gray-400' : 'cursor-pointer'}`}
                >
                  <Instagram className="h-4 w-4" />
                  Instagram DM
                  {!canSendInstagram && <span className="text-xs">(No handle available)</span>}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Email Subject (only for email) */}
          {dmType === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                placeholder="Enter email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Message Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Message</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateMessage}
                disabled={isGenerating}
                className="text-xs"
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                {isGenerating ? 'Generating...' : 'Generate with AI'}
              </Button>
            </div>
            <Textarea
              id="message"
              placeholder={`Type your ${dmType === 'email' ? 'email' : 'Instagram DM'} message here...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <div className="text-xs text-gray-500">
              {message.length} characters
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isSending || !message.trim() || (dmType === 'email' && !subject.trim())}
            className="min-w-[100px]"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DMModal;
