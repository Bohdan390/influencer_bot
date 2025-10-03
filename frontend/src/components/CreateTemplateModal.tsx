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
import { Plus, RefreshCw, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HTMLEditor from './HTMLEditor';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newTemplate: {
    name: string;
    subject: string;
    html: string;
    text: string;
    description: string;
    category: 'outreach' | 'follow_up' | 'reminder' | 'custom' | 'partnership' | 'collaboration';
  }) => Promise<void>;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html: '<p>New email content...</p>',
    text: 'New email content...',
    description: '',
    category: 'custom' as 'outreach' | 'follow_up' | 'reminder' | 'custom' | 'partnership' | 'collaboration'
  });
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.subject.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in the template name and subject.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await onCreate(formData);
      
      toast({
        title: "Template Created",
        description: "Your new email template has been created successfully.",
      });
      
      // Reset form
      setFormData({
        name: '',
        subject: '',
        html: '<p>New email content...</p>',
        text: 'New email content...',
        description: '',
        category: 'custom'
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      name: '',
      subject: '',
      html: '<p>New email content...</p>',
      text: 'New email content...',
      description: '',
      category: 'custom'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name..."
                required
              />
            </div>
            <div>
              <Label htmlFor="template-category">Category</Label>
              <select
                id="template-category"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
              >
                <option value="outreach">Outreach</option>
                <option value="follow_up">Follow-up</option>
                <option value="reminder">Reminder</option>
                <option value="custom">Custom</option>
                <option value="partnership">Partnership</option>
                <option value="collaboration">Collaboration</option>
              </select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="template-subject">Subject Line *</Label>
            <Input
              id="template-subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter email subject..."
              required
            />
          </div>
          
          <div>
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this template..."
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="template-html">HTML Content</Label>
            <div className="mt-2">
              <HTMLEditor
                value={formData.html}
                onChange={(value) => setFormData(prev => ({ ...prev, html: value }))}
                height={400}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="template-text">Plain Text Version</Label>
            <Textarea
              id="template-text"
              value={formData.text}
              onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Enter plain text version..."
              rows={8}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isCreating}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !formData.name.trim() || !formData.subject.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isCreating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isCreating ? 'Creating...' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTemplateModal;
