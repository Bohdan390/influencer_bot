import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Mail, Edit, Copy, Send, BarChart, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [emailStats, setEmailStats] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
    loadEmailStats();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('dermao_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/test/templates`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.templates && Array.isArray(data.templates)) {
          setTemplates(data.templates);
        } else {
          // If no real templates exist, show empty state
          setTemplates([]);
        }
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]);
      toast({
        title: "Loading Failed",
        description: "Could not load email templates from backend",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmailStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/stats`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmailStats(data.email_stats || {});
      }
    } catch (error) {
      console.error('Failed to load email stats:', error);
    }
  };

  const testEmail = async (template) => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/test/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'test@cosara.com',
          template: template.name,
          data: { first_name: 'Sarah', tracking_number: 'TRK123456' }
        })
      });
      
      if (response.ok) {
        toast({
          title: "Test Email Sent",
          description: `Successfully sent ${template.name} template`,
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Backend connection required for test emails",
      });
    }
  };

  const TemplateCard = ({ template }) => {
    const templateStats = emailStats[template.name] || { sent: 0, opened: 0, replied: 0 };
    const replyRate = templateStats.sent > 0 ? Math.round((templateStats.replied / templateStats.sent) * 100) : 0;
    const openRate = templateStats.sent > 0 ? Math.round((templateStats.opened / templateStats.sent) * 100) : 0;

    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTemplate(template)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-600" />
              {template.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CardTitle>
            <Badge variant="outline">{templateStats.sent} sent</Badge>
          </div>
          <CardDescription>{template.subject}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600">{templateStats.opened}</div>
              <div className="text-muted-foreground">Opened ({openRate}%)</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">{templateStats.replied}</div>
              <div className="text-muted-foreground">Replied</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600">{replyRate}%</div>
              <div className="text-muted-foreground">Reply Rate</div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedTemplate(template); setIsEditing(true); }}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); testEmail(template); }}>
              <Send className="w-4 h-4 mr-1" />
              Test
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">Manage your automated email campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { loadTemplates(); loadEmailStats(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => { setSelectedTemplate(null); setIsEditing(true); }}>
            <Mail className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
                    </div>
                    <div className="text-center">
                      <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
                    </div>
                    <div className="text-center">
                      <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !selectedTemplate && !isEditing ? (
        templates.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Templates</h3>
            <p className="text-gray-500 mb-4">
              Start by creating your first email template for your influencer campaigns
            </p>
            <Button onClick={() => { setSelectedTemplate(null); setIsEditing(true); }}>
              <Mail className="w-4 h-4 mr-2" />
              Create First Template
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template, index) => (
              <TemplateCard key={index} template={template} />
            ))}
          </div>
        )
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {isEditing ? 'Edit Template' : 'Template Preview'}
              </CardTitle>
              <div className="flex gap-2">
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
                <Button variant="outline" onClick={() => { setSelectedTemplate(null); setIsEditing(false); }}>
                  Back to List
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="content" className="space-y-4">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Subject Line</label>
                  <Input 
                    value={selectedTemplate?.subject || ''} 
                    readOnly={!isEditing}
                    className={!isEditing ? 'bg-muted' : ''}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email Content</label>
                  <Textarea 
                    value={selectedTemplate?.content || ''} 
                    rows={12}
                    readOnly={!isEditing}
                    className={!isEditing ? 'bg-muted' : ''}
                  />
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <Button>Save Changes</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="variables" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Available Variables</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <code>{'{{first_name}}'}</code>
                        <span className="text-sm text-muted-foreground">Influencer's first name</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <code>{'{{handle}}'}</code>
                        <span className="text-sm text-muted-foreground">Instagram handle</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <code>{'{{tracking_number}}'}</code>
                        <span className="text-sm text-muted-foreground">Shipment tracking</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">{selectedTemplate?.stats?.sent || 0}</div>
                      <p className="text-sm text-muted-foreground">Total Sent</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">{selectedTemplate?.stats?.opened || 0}</div>
                      <p className="text-sm text-muted-foreground">Opened</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-purple-600">{selectedTemplate?.stats?.replied || 0}</div>
                      <p className="text-sm text-muted-foreground">Replied</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailTemplates;
