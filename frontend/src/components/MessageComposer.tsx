import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Send, X, Paperclip, Bold, Italic, Link, Smile } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: {
    to: string;
    subject: string;
    content: string;
    htmlContent?: string;
    type: 'email' | 'dm';
  }) => Promise<void>;
  selectedInfluencer?: {
    id: string;
    instagram_handle: string;
    full_name: string;
    email?: string;
    profile_image?: string;
  };
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  isOpen,
  onClose,
  onSend,
  selectedInfluencer
}) => {
  const [to, setTo] = useState(selectedInfluencer?.email || '');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [messageType, setMessageType] = useState<'email' | 'dm'>('email');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (selectedInfluencer) {
      setTo(selectedInfluencer.email || '');
    }
  }, [selectedInfluencer]);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      await onSend({
        to: to.trim(),
        subject: subject.trim(),
        content: content.trim(),
        htmlContent: content.trim(), // For now, same as content
        type: messageType
      });
      
      // Reset form
      setTo('');
      setSubject('');
      setContent('');
      onClose();
      
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Compose Message
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recipient Info */}
          {selectedInfluencer && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={selectedInfluencer.profile_image} 
                  alt={selectedInfluencer.full_name}
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  {selectedInfluencer.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{selectedInfluencer.full_name}</div>
                <div className="text-sm text-gray-600">
                  @{selectedInfluencer.instagram_handle}
                  {selectedInfluencer.email && ` • ${selectedInfluencer.email}`}
                </div>
              </div>
            </div>
          )}

          {/* Message Type */}
          <div className="flex items-center gap-4">
            <Label>Message Type</Label>
            <Select value={messageType} onValueChange={(value: 'email' | 'dm') => setMessageType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="dm">DM</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline">
              {messageType === 'email' ? '📧 Email' : '💬 Direct Message'}
            </Badge>
          </div>

          {/* To Field */}
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              placeholder="Enter email address or Instagram handle"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={!!selectedInfluencer}
            />
          </div>

          {/* Subject Field (only for emails) */}
          {messageType === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Message</Label>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Link className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Textarea
              id="content"
              placeholder={messageType === 'email' ? 'Write your email message...' : 'Write your DM...'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-32"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Paperclip className="h-4 w-4 mr-1" />
                Attach
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={isSending}>
                <Send className="h-4 w-4 mr-1" />
                {isSending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageComposer;
