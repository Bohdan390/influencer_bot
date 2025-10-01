import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Key, Mail, Database, ShoppingCart, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const SettingsPage = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    firebase: 'disconnected',
    apify: 'disconnected', 
    brevo: 'disconnected',
    shopify: 'disconnected'
  });
  
  const [apiKeys, setApiKeys] = useState({
    firebase_project_id: '',
    firebase_private_key: '',
    apify_token: '',
    brevo_api_key: '',
    shopify_store_url: '',
    shopify_access_token: ''
  });
  
  const [campaignSettings, setCampaignSettings] = useState({
    min_followers: 10000,
    max_followers: 100000,
    target_hashtags: 'beauty,skincare,hairremoval,laser',
    email_daily_limit: 50,
    followup_delay_days: 3
  });

  const [emailSettings, setEmailSettings] = useState({
    sender_name: 'Dermao Team',
          sender_email: 'influencers@trycosara.com',
    reply_to: 'hello@dermao.com',
    signature: 'Best regards,\nThe Dermao Team\n\n--\nDermao IPL Hair Removal\nwww.dermao.com'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('dermao_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/settings`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const settings = result.data;
          
          if (settings.api_keys) {
            setApiKeys(settings.api_keys);
          }
          if (settings.campaign_settings) {
            setCampaignSettings(settings.campaign_settings);
          }
          if (settings.email_settings) {
            setEmailSettings(settings.email_settings);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: "Loading Failed",
        description: "Could not load your settings",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const saveSettings = async (settingsType) => {
    setIsSaving(true);
    try {
      const settingsData = {
        api_keys: apiKeys,
        campaign_settings: campaignSettings,
        email_settings: emailSettings
      };

      const response = await fetch(`${API_BASE}/api/auth/settings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ settings: settingsData })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: "Settings Saved",
            description: `Your ${settingsType} settings have been saved successfully`,
          });
        }
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Save Failed",
        description: "Could not save your settings",
        variant: "destructive"
      });
    }
    setIsSaving(false);
  };

  const testConnection = async (service) => {
    setConnectionStatus(prev => ({ ...prev, [service]: 'testing' }));
    
    try {
      let endpoint = '';
      let payload = {};
      
      switch (service) {
        case 'firebase':
          endpoint = '/api/campaigns/test/database';
          break;
        case 'apify':
          endpoint = '/api/campaigns/test/apify';
          payload = { hashtags: ['test'], limit: 1 };
          break;
        case 'brevo':
          endpoint = '/api/campaigns/test/email';
          payload = { to: 'test@dermao.com', template: 'initial_outreach', data: { first_name: 'Test' } };
          break;
        case 'shopify':
          endpoint = '/api/campaigns/test/shopify';
          break;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        setConnectionStatus(prev => ({ ...prev, [service]: 'connected' }));
        toast({
          title: "Connection Successful",
          description: `${service.charAt(0).toUpperCase() + service.slice(1)} is working correctly`,
        });
      } else {
        setConnectionStatus(prev => ({ ...prev, [service]: 'error' }));
        toast({
          title: "Connection Failed",
          description: `Failed to connect to ${service}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [service]: 'error' }));
      toast({
        title: "Connection Error",
        description: "Backend connection required for testing",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'testing': return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'testing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const ServiceCard = ({ service, icon: Icon, title, description }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-purple-600" />
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(connectionStatus[service])}>
            {getStatusIcon(connectionStatus[service])}
            {connectionStatus[service]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {service === 'firebase' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="firebase_project_id">Project ID</Label>
              <Input
                id="firebase_project_id"
                placeholder="your-project-id"
                value={apiKeys.firebase_project_id}
                onChange={(e) => setApiKeys(prev => ({ ...prev, firebase_project_id: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firebase_private_key">Private Key</Label>
              <Textarea
                id="firebase_private_key"
                placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                value={apiKeys.firebase_private_key}
                onChange={(e) => setApiKeys(prev => ({ ...prev, firebase_private_key: e.target.value }))}
                rows={3}
              />
            </div>
          </>
        )}
        
        {service === 'apify' && (
          <div className="space-y-2">
            <Label htmlFor="apify_token">API Token</Label>
            <Input
              id="apify_token"
              type="password"
              placeholder="apify_api_..."
              value={apiKeys.apify_token}
              onChange={(e) => setApiKeys(prev => ({ ...prev, apify_token: e.target.value }))}
            />
          </div>
        )}
        
        {service === 'brevo' && (
          <div className="space-y-2">
            <Label htmlFor="brevo_api_key">API Key</Label>
            <Input
              id="brevo_api_key"
              type="password"
              placeholder="xkeysib-..."
              value={apiKeys.brevo_api_key}
              onChange={(e) => setApiKeys(prev => ({ ...prev, brevo_api_key: e.target.value }))}
            />
          </div>
        )}
        
        {service === 'shopify' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="shopify_store_url">Store URL</Label>
              <Input
                id="shopify_store_url"
                placeholder="your-store.myshopify.com"
                value={apiKeys.shopify_store_url}
                onChange={(e) => setApiKeys(prev => ({ ...prev, shopify_store_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopify_access_token">Access Token</Label>
              <Input
                id="shopify_access_token"
                type="password"
                placeholder="shpat_..."
                value={apiKeys.shopify_access_token}
                onChange={(e) => setApiKeys(prev => ({ ...prev, shopify_access_token: e.target.value }))}
              />
            </div>
          </>
        )}
        
        <Button 
          onClick={() => testConnection(service)} 
          disabled={connectionStatus[service] === 'testing'}
          className="w-full"
        >
          {connectionStatus[service] === 'testing' ? 'Testing...' : 'Test Connection'}
        </Button>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Loading your settings...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Configure API connections and campaign settings</p>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">API Connections</TabsTrigger>
          <TabsTrigger value="campaign">Campaign Settings</TabsTrigger>
          <TabsTrigger value="templates">Email Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ServiceCard
              service="firebase"
              icon={Database}
              title="Firebase"
              description="Database and analytics storage"
            />
            <ServiceCard
              service="apify"
              icon={Settings}
              title="Apify"
              description="Instagram data scraping service"
            />
            <ServiceCard
              service="brevo"
              icon={Mail}
              title="Brevo"
              description="Email automation platform"
            />
            <ServiceCard
              service="shopify"
              icon={ShoppingCart}
              title="Shopify"
              description="E-commerce integration"
            />
          </div>
        </TabsContent>

        <TabsContent value="campaign" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Configuration</CardTitle>
              <CardDescription>Set targeting and automation parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min_followers">Minimum Followers</Label>
                  <Input
                    id="min_followers"
                    type="number"
                    value={campaignSettings.min_followers}
                    onChange={(e) => setCampaignSettings(prev => ({ ...prev, min_followers: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_followers">Maximum Followers</Label>
                  <Input
                    id="max_followers"
                    type="number"
                    value={campaignSettings.max_followers}
                    onChange={(e) => setCampaignSettings(prev => ({ ...prev, max_followers: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target_hashtags">Target Hashtags (comma-separated)</Label>
                <Input
                  id="target_hashtags"
                  placeholder="beauty,skincare,hairremoval"
                  value={campaignSettings.target_hashtags}
                  onChange={(e) => setCampaignSettings(prev => ({ ...prev, target_hashtags: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email_daily_limit">Daily Email Limit</Label>
                  <Input
                    id="email_daily_limit"
                    type="number"
                    value={campaignSettings.email_daily_limit}
                    onChange={(e) => setCampaignSettings(prev => ({ ...prev, email_daily_limit: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followup_delay_days">Follow-up Delay (days)</Label>
                  <Input
                    id="followup_delay_days"
                    type="number"
                    value={campaignSettings.followup_delay_days}
                    onChange={(e) => setCampaignSettings(prev => ({ ...prev, followup_delay_days: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => saveSettings('campaign')}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Campaign Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure email sending and template settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sender_name">Sender Name</Label>
                <Input 
                  id="sender_name" 
                  placeholder="Dermao Team"
                  value={emailSettings.sender_name}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, sender_name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sender_email">Sender Email</Label>
                <Input 
                  id="sender_email" 
                  placeholder="influencers@trycosara.com"
                  value={emailSettings.sender_email}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, sender_email: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reply_to">Reply-To Email</Label>
                <Input 
                  id="reply_to" 
                  placeholder="hello@dermao.com"
                  value={emailSettings.reply_to}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, reply_to: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signature">Email Signature</Label>
                <Textarea 
                  id="signature"
                  placeholder="Best regards,&#10;The Dermao Team&#10;&#10;--&#10;Dermao IPL Hair Removal&#10;www.dermao.com"
                  rows={4}
                  value={emailSettings.signature}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, signature: e.target.value }))}
                />
              </div>
              
              <Button 
                onClick={() => saveSettings('email')}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Email Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
