import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Edit, 
  Save, 
  Eye, 
  Copy, 
  Plus, 
  Trash2, 
  Settings,
  FileText,
  Send,
  RefreshCw,
  Sparkles,
  Wand2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EditTemplateModal from "./EditTemplateModal";
import CreateTemplateModal from "./CreateTemplateModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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

const MessageManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  
  // AI Generation form state
  const [aiForm, setAiForm] = useState({
    templateType: 'outreach',
    brandName: 'Cosara',
    productDescription: 'IPL Hair Laser Device',
    targetAudience: 'beauty influencers',
    tone: 'professional',
    callToAction: 'brand ambassador opportunity',
    additionalRequirements: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading templates from API...');
      const response = await fetch(`${API_BASE}/api/templates`);
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📧 Templates data received:', data);
        setTemplates(data.templates || []);
        console.log('✅ Templates loaded:', data.templates?.length || 0, 'templates');
      } else {
        console.error('❌ API request failed:', response.status, response.statusText);
        setTemplates([]);
      }
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowEditModal(true);
  };

  const handleSaveTemplate = async (updatedTemplate: EmailTemplate) => {
    setIsSaving(true);
    try {
      // Check if this is a new template (AI generated) or existing template
      const isNewTemplate = !templates.some(t => t.id === updatedTemplate.id);
      
      let response;
      if (isNewTemplate) {
        // Create new template
        response = await fetch(`${API_BASE}/api/templates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTemplate)
        });
      } else {
        // Update existing template
        response = await fetch(`${API_BASE}/api/templates/${updatedTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTemplate)
        });
      }

      if (response.ok) {
        const responseData = await response.json();
        console.log('API Response:', responseData);
        
        if (isNewTemplate) {
          // Add new template to list
          const createdTemplate = responseData.template || responseData;
          console.log('Created template:', createdTemplate);
          setTemplates(prev => [createdTemplate, ...prev]);
          setSelectedTemplate(createdTemplate);
        } else {
          // Update existing template in list
          const updatedTemplateData = responseData.template || responseData;
          console.log('Updated template:', updatedTemplateData);
          setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplateData : t));
          setSelectedTemplate(updatedTemplateData);
        }
        setShowEditModal(false);
        setEditingTemplate(null);
      } else {
        throw new Error('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTemplate = () => {
    setShowCreateModal(true);
  };

  const handleCreateNewTemplate = async (templateData: {
    name: string;
    subject: string;
    html: string;
    text: string;
    description: string;
    category: 'outreach' | 'follow_up' | 'reminder' | 'custom' | 'partnership' | 'collaboration';
  }) => {
    setIsSaving(true);
    try {
      const newTemplate: EmailTemplate = {
        id: `template_${Date.now()}`,
        ...templateData,
        is_active: true,
      };

      const response = await fetch(`${API_BASE}/api/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });

      if (response.ok) {
        const responseData = await response.json();
        const createdTemplate = responseData.template || responseData;
        setTemplates(prev => [createdTemplate, ...prev]);
        setSelectedTemplate(createdTemplate);
        setShowCreateModal(false);
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAITemplate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_BASE}/api/ai/generate-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm)
      });

      if (response.ok) {
        const data = await response.json();
        const generatedTemplate = data.template;
        
        // Open edit modal with generated template instead of directly adding to list
        setEditingTemplate(generatedTemplate);
        setShowEditModal(true);
        setShowAIGenerator(false);
        
        toast({
          title: "Template Generated!",
          description: "AI has created a new email template. Review and save it.",
        });
      } else {
        throw new Error('Failed to generate template');
      }
    } catch (error) {
      console.error('Error generating template:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewMode(true);
  };

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingTemplateId(template.id);
    try {
      const response = await fetch(`${API_BASE}/api/templates/${template.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from templates list
        setTemplates(prev => prev.filter(t => t.id !== template.id));
        
        // Clear selection if deleted template was selected
        if (selectedTemplate?.id === template.id) {
          setSelectedTemplate(null);
        }
        
        toast({
          title: "Template Deleted",
          description: `"${template.name}" has been deleted successfully.`,
        });
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = (template.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (template.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'outreach': return 'bg-blue-100 text-blue-800';
      case 'follow_up': return 'bg-green-100 text-green-800';
      case 'reminder': return 'bg-yellow-100 text-yellow-800';
      case 'custom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Message Manager</h1>
          <p className="text-gray-600">Create and manage email templates for influencer outreach</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowAIGenerator(true)} 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
          <Button onClick={handleCreateTemplate} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
          <Button 
            onClick={loadTemplates} 
            variant="outline"
            disabled={isLoading}
            className="bg-gray-100 hover:bg-gray-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1 w-full">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Email Templates
              </CardTitle>
              <div className="space-y-4">
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedCategory === 'outreach' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('outreach')}
                  >
                    Outreach
                  </Button>
                  <Button
                    variant={selectedCategory === 'follow_up' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('follow_up')}
                  >
                    Follow-up
                  </Button>
                  <Button
                    variant={selectedCategory === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('custom')}
                  >
                    Custom
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredTemplates.map((template) => {
                return (
                  <div
                    key={template.id}
                    className={`w-full p-3 border rounded-lg cursor-pointer transition-colors min-h-[100px] ${
                      selectedTemplate?.id === template.id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{template.name || 'Unnamed Template'}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{template.subject || 'No subject'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                        {template.is_active && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewTemplate(template);
                        }}
                        title="Preview template"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                        title="Edit template"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template);
                        }}
                        title="Delete template"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deletingTemplateId === template.id}
                      >
                        {deletingTemplateId === template.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Template Editor/Preview */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Template Preview
                    </CardTitle>
                    <CardDescription>
                      Preview how your email will look
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditTemplate(selectedTemplate)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteTemplate(selectedTemplate)}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deletingTemplateId === selectedTemplate.id}
                    >
                      {deletingTemplateId === selectedTemplate.id ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Subject:</h4>
                    <p className="text-sm">{selectedTemplate.subject}</p>
                  </div>
                  
                  <div className="border rounded-lg">
                    <div className="bg-gray-100 px-4 py-2 border-b">
                      <h4 className="font-medium text-sm text-gray-700">Preview:</h4>
                    </div>
                    <div 
                      className="p-4"
                      dangerouslySetInnerHTML={{ __html: selectedTemplate.html }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Template Selected</h3>
                  <p className="text-gray-600">Choose a template from the list to view or edit it.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* AI Generator Modal */}
      {showAIGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-6 h-6 text-purple-600" />
                  <CardTitle>AI Template Generator</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIGenerator(false)}
                >
                  ✕
                </Button>
              </div>
              <CardDescription>
                Let AI create a professional email template tailored to your needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-type">Template Type</Label>
                  <select
                    id="template-type"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={aiForm.templateType}
                    onChange={(e) => setAiForm(prev => ({ ...prev, templateType: e.target.value }))}
                  >
                    <option value="outreach">Outreach</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="reminder">Reminder</option>
                    <option value="partnership">Partnership</option>
                    <option value="collaboration">Collaboration</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="brand-name">Brand Name</Label>
                  <Input
                    id="brand-name"
                    value={aiForm.brandName}
                    onChange={(e) => setAiForm(prev => ({ ...prev, brandName: e.target.value }))}
                    placeholder="Your brand name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="product-description">Product/Service Description</Label>
                <Textarea
                  id="product-description"
                  value={aiForm.productDescription}
                  onChange={(e) => setAiForm(prev => ({ ...prev, productDescription: e.target.value }))}
                  placeholder="Describe your product or service..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target-audience">Target Audience</Label>
                  <Input
                    id="target-audience"
                    value={aiForm.targetAudience}
                    onChange={(e) => setAiForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                    placeholder="e.g., beauty influencers, fitness enthusiasts"
                  />
                </div>
                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <select
                    id="tone"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={aiForm.tone}
                    onChange={(e) => setAiForm(prev => ({ ...prev, tone: e.target.value }))}
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="formal">Formal</option>
                    <option value="enthusiastic">Enthusiastic</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="call-to-action">Call to Action</Label>
                <Input
                  id="call-to-action"
                  value={aiForm.callToAction}
                  onChange={(e) => setAiForm(prev => ({ ...prev, callToAction: e.target.value }))}
                  placeholder="e.g., brand ambassador opportunity, product review"
                />
              </div>

              <div>
                <Label htmlFor="additional-requirements">Additional Requirements (Optional)</Label>
                <Textarea
                  id="additional-requirements"
                  value={aiForm.additionalRequirements}
                  onChange={(e) => setAiForm(prev => ({ ...prev, additionalRequirements: e.target.value }))}
                  placeholder="Any specific requirements or preferences..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAIGenerator(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateAITemplate}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Template
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Template Modal */}
      <EditTemplateModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSave={handleSaveTemplate}
        isNewTemplate={editingTemplate ? !templates.some(t => t.id === editingTemplate.id) : false}
      />

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateNewTemplate}
      />
    </div>
  );
};

export default MessageManager;
