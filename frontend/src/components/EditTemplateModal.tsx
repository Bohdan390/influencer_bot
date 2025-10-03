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
import { Save, RefreshCw, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import HTMLEditor from './HTMLEditor';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  description?: string;
  category: 'outreach' | 'follow_up' | 'reminder' | 'custom' | 'partnership' | 'collaboration';
  is_active: boolean;
}

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
  onSave: (updatedTemplate: EmailTemplate) => Promise<void>;
  isNewTemplate?: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const EditTemplateModal: React.FC<EditTemplateModalProps> = ({
  isOpen,
  onClose,
  template,
  onSave,
  isNewTemplate = false
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    subject: '',
    html: '',
    text: '',
    description: '',
    category: 'outreach' as 'outreach' | 'follow_up' | 'reminder' | 'custom' | 'partnership' | 'collaboration'
  });
  const { toast } = useToast();

  // Reset form when template changes
  useEffect(() => {
    if (template && isOpen) {
      setEditForm({
        name: template.name,
        subject: template.subject,
        html: template.html,
        text: template.text || '',
        description: template.description || '',
        category: template.category
      });
    }
  }, [template, isOpen]);

  const handleSave = async () => {
    if (!template) return;
    
    setIsSaving(true);
    try {
      const updatedTemplate = {
        ...template,
        ...editForm,
      };

      await onSave(updatedTemplate);
      
      toast({
        title: isNewTemplate ? "Template Created" : "Template Updated",
        description: isNewTemplate ? "Your new email template has been created successfully." : "Your email template has been saved successfully.",
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (template) {
      setEditForm({
        name: template.name,
        subject: template.subject,
        html: template.html,
        text: template.text || '',
        description: template.description || '',
        category: template.category
      });
    }
    onClose();
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            {isNewTemplate ? 'Review AI Generated Template' : `Edit Template: ${template.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name..."
              />
            </div>
            <div>
              <Label htmlFor="template-category">Category</Label>
              <select
                id="template-category"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={editForm.category}
                onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as any }))}
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
            <Label htmlFor="template-subject">Subject Line</Label>
            <Input
              id="template-subject"
              value={editForm.subject}
              onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter email subject..."
            />
          </div>
          
          <div>
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this template..."
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="template-html">HTML Content</Label>
            <div className="mt-2">
              <HTMLEditor
                value={editForm.html}
                onChange={(value) => setEditForm(prev => ({ ...prev, html: value }))}
                height={400}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="template-text">Plain Text Version</Label>
            <Textarea
              id="template-text"
              value={editForm.text}
              onChange={(e) => setEditForm(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Enter plain text version..."
              rows={8}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? (isNewTemplate ? 'Creating...' : 'Saving...') : (isNewTemplate ? 'Save Template' : 'Save Changes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTemplateModal;
