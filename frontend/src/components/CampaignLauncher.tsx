import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rocket, Users, Mail, Clock, CheckCircle, AlertCircle, Instagram, MessageSquare, Zap, Shield, Hash, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DiscoveryProgressNew from "./DiscoveryProgressNew";
import { useWebSocket, useWebSocketListener } from "../contexts/WebSocketContext";
import { API_BASE, getApiUrl } from "../utils/api";

const CampaignLauncher = () => {
  const [campaignData, setCampaignData] = useState({
    outreachType: 'email',
    hashtags: '#beauty #skincare #hairremoval #laser #cosara',
    targetCount: 50,
    minFollowers: 10000,
    maxFollowers: 100000,
    emailTemplate: 'initial_outreach',
    instagramTemplate: 'dm_initial_casual',
    productOffer: 'IPL Hair Laser Device',
    enableSplitTest: true,
    template: 'initial_outreach', // Added for unified template selection
    // Targeting fields
    location: '',
    competitorHandles: ''
  });
  
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [launchStep, setLaunchStep] = useState('');
  const [campaignResults, setCampaignResults] = useState(null);
  const [discoveryId, setDiscoveryId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [isDiscoveryActive, setIsDiscoveryActive] = useState(false);
  
  // Competitor discovery state
  const [competitorHandles, setCompetitorHandles] = useState<string[]>([]);
  const [competitorHandleInput, setCompetitorHandleInput] = useState('');
  const [competitorDiscoveryType, setCompetitorDiscoveryType] = useState<'tags' | 'followers'>('tags');
  const [isCompetitorDiscoveryActive, setIsCompetitorDiscoveryActive] = useState(false);
  const [competitorDiscoveryProgress, setCompetitorDiscoveryProgress] = useState(0);
  const [competitorDiscoveryStep, setCompetitorDiscoveryStep] = useState('');
  
  const { toast } = useToast();
  const { send: sendWebSocketMessage } = useWebSocket();

  // Listen for discovery started
  useWebSocketListener('discovery_started', (message) => {
    if (message.discoveryId === discoveryId) {
      console.log('🚀 CampaignLauncher received discovery started:', message.data);
      setLaunchStep(message.data.currentStep || 'Discovery started...');
      if (message.data.progress) setLaunchProgress(message.data.progress);
      setIsDiscoveryActive(true);
      setShowProgress(true);
    }
  }, [discoveryId]);

  // Listen for discovery progress updates
  useWebSocketListener('discovery_progress', (message) => {
    console.log('🔍 CampaignLauncher received progress update:', message);
    if (message.discoveryId === discoveryId) {
      console.log('🔍 CampaignLauncher received progress update:', message.data);
      setLaunchStep(message.data.currentStep || 'Discovery in progress...');
      setLaunchProgress(message.data.progress || 0);
      setIsDiscoveryActive(true);
      setShowProgress(true); // Ensure progress bar is visible
      console.log('📊 Progress bar should be visible - isDiscoveryActive:', true, 'showProgress:', true);
    }
  }, [discoveryId]);

  // Listen for discovery completion
  useWebSocketListener('discovery_completed', (message) => {
    if (message.discoveryId === discoveryId) {
      console.log('✅ CampaignLauncher received completion:', message.data);
      handleDiscoveryComplete(message.data.results);
    }
  }, [discoveryId]);

  // Listen for discovery failure
  useWebSocketListener('discovery_failed', (message) => {
    if (message.discoveryId === discoveryId) {
      console.log('❌ CampaignLauncher received failure:', message.data);
      handleDiscoveryError(message.data.error);
    }
  }, [discoveryId]);

  // Callback for when discovery completes
  const handleDiscoveryComplete = (results: any) => {
    console.log('Discovery completed:', results);
    setLaunchStep('Discovery completed! Starting outreach...');
    setLaunchProgress(100);
    setIsDiscoveryActive(false);
    
    setTimeout(function() {
      setShowProgress(false);
    }, 3000)
    
    // Continue with the rest of the campaign
  };

  // Callback for when discovery fails
  const handleDiscoveryError = (error: string) => {
    console.error('Discovery failed:', error);
    setShowProgress(false);
    setIsDiscoveryActive(false);
    setIsLaunching(false);
    toast({
      title: "Discovery Failed",
      description: error,
      variant: "destructive",
    });
  };


  const presetHashtags = [
    { name: 'Beauty & Skincare', tags: '#beauty #skincare #antiaging #glowup #beautytips' },
    { name: 'Hair Removal', tags: '#hairremoval #laser #iplhairremoval #smoothskin #hairfree' },
    { name: 'Wellness & Health', tags: '#wellness #healthylifestyle #selfcare #bodypositivity' },
    { name: 'Lifestyle & Fashion', tags: '#lifestyle #fashion #ootd #influencer #style' },
    { name: 'Tech & Gadgets', tags: '#tech #gadgets #innovation #beautytech #homedevices' }
  ];

  const emailTemplates = [
    { id: 'initial_outreach', name: 'Initial Partnership Outreach', desc: 'Professional introduction and partnership proposal' },
    { id: 'split_test_opener', name: 'Split Test Opener (A/B/C/D)', desc: 'Automatically test 4 different openers' },
    { id: 'product_collaboration', name: 'Product Collaboration', desc: 'Focused on product testing and review' },
    { id: 'affiliate_program', name: 'Affiliate Program Invitation', desc: 'Commission-based partnership offer' }
  ];

  const instagramTemplates = [
    { id: 'dm_initial_casual', name: 'Casual DM Opener', desc: 'Friendly, personal approach for DMs' },
    { id: 'dm_split_test', name: 'Split Test DM (A/B/C)', desc: 'Test different DM approaches' },
    { id: 'dm_story_reply', name: 'Story Reply Style', desc: 'Respond to their story with collaboration offer' },
    { id: 'dm_compliment_opener', name: 'Compliment + Offer', desc: 'Start with genuine compliment' }
  ];


  const launchCampaign = async () => {
    setIsLaunching(true);
    setLaunchProgress(0);
    setCampaignResults(null);
    
    try {
      // Step 1: Discover Influencers
      setLaunchStep('Starting influencer discovery...');
      setLaunchProgress(10);
      
      const hashtagArray = campaignData.hashtags.split(' ').filter(tag => tag.startsWith('#'));
      
      // Build discovery request with all targeting options
      const discoveryRequest: any = {
        hashtags: hashtagArray,
        location: campaignData.location,
        competitor_handles: campaignData.competitorHandles,
        limit: campaignData.targetCount,
        minFollowers: campaignData.minFollowers,
        maxFollowers: campaignData.maxFollowers,
        outreach_type: 'unified' // Use unified contact system
      };

      // Debug: Log the target settings being sent
      console.log('🎯 Target Settings being sent:', {
        targetCount: campaignData.targetCount,
        minFollowers: campaignData.minFollowers,
        maxFollowers: campaignData.maxFollowers,
        hashtags: hashtagArray
      });

      // Validate target settings
      if (campaignData.minFollowers >= campaignData.maxFollowers) {
        throw new Error('Minimum followers must be less than maximum followers');
      }

      if (campaignData.targetCount < 1 || campaignData.targetCount > 200) {
        throw new Error('Target count must be between 1 and 200');
      }

        const discoveryResponse = await fetch(getApiUrl('api/campaigns/discover'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discoveryRequest)
      });
      
      if (!discoveryResponse.ok) {
        throw new Error('Failed to discover influencers');
      }
      
      const discoveryData = await discoveryResponse.json();
      
      // Check if we got a discovery ID for real-time tracking
      if (discoveryData.discoveryId) {
        setDiscoveryId(discoveryData.discoveryId);
        setShowProgress(true);
        setIsDiscoveryActive(true);
        setLaunchStep('Discovery started - tracking progress in real-time...');
        setLaunchProgress(20);
        
        // Subscribe to discovery progress via WebSocket
        sendWebSocketMessage({
          type: 'subscribe',
          discoveryId: discoveryData.discoveryId
        });
        
        // Don't continue with the rest of the campaign until discovery is complete
        // The DiscoveryProgress component will handle the completion callback
        return;
      }
      
      // Fallback to old behavior if no discovery ID
      setLaunchProgress(40);
      
      // Step 2: Setup Split Test (if enabled)
      let splitTestId = null;
      setLaunchProgress(60);
      
      // Step 3: Unified Outreach (automatically chooses email or DM)
      setLaunchStep('Preparing unified outreach...');
      setLaunchProgress(80);
      
      // Determine template based on preferred method
      let template = campaignData.template || 'initial_outreach';
      
      const outreachResponse = await fetch(getApiUrl('api/campaigns/send-outreach'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          influencers: discoveryData.influencers,
          template: template,
          productOffer: campaignData.productOffer,
          split_test_id: splitTestId
        })
      });
      
      if (!outreachResponse.ok) {
        throw new Error('Failed to send outreach');
      }
      
      const outreachData = await outreachResponse.json();
      setCampaignResults(outreachData);
      
      setLaunchProgress(100);
      setLaunchStep('Campaign launched successfully!');
      
      // Show results based on what was actually sent
      const totalContacted = (outreachData.emailsSent || 0) + (outreachData.dmsSent || 0);
      const contactMethods = [];
      if (outreachData.emailsSent > 0) contactMethods.push(`${outreachData.emailsSent} emails`);
      if (outreachData.dmsSent > 0) contactMethods.push(`${outreachData.dmsSent} DMs`);
      
      toast({
        title: `🚀 Campaign Launched Successfully!`,
        description: `Sent ${contactMethods.join(' and ')}${splitTestId ? ' with split testing' : ''}`,
      });
      
    } catch (error) {
      console.error('Campaign launch failed:', error);
      toast({
        title: "Campaign Launch Failed",
        description: error.message || "Please check your configuration and try again",
        variant: "destructive"
      });
    } finally {
      setIsLaunching(false);
    }
  };

  // Competitor discovery functions
  const addCompetitorHandle = () => {
    if (competitorHandleInput.trim() && !competitorHandles.includes(competitorHandleInput.trim())) {
      setCompetitorHandles([...competitorHandles, competitorHandleInput.trim()]);
      setCompetitorHandleInput('');
    }
  };

  const removeCompetitorHandle = (handle: string) => {
    setCompetitorHandles(competitorHandles.filter(h => h !== handle));
  };

  const handleCompetitorDiscovery = async () => {
    if (competitorHandles.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one competitor handle.",
        variant: "destructive",
      });
      return;
    }

    setIsCompetitorDiscoveryActive(true);
    setCompetitorDiscoveryProgress(0);
    setCompetitorDiscoveryStep('Starting competitor discovery...');

    try {
      const endpoint = competitorDiscoveryType === 'tags' 
        ? '/api/campaigns/discover-competitor-tags'
        : '/api/campaigns/discover-competitor-followers';

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competitorHandles,
          minFollowers: campaignData.minFollowers,
          maxFollowers: campaignData.maxFollowers,
          minEngagementRate: 1, // Default engagement rate
          maxResults: campaignData.targetCount,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Competitor discovery response:', data);

      if (data.success) {
        setCompetitorDiscoveryStep('Discovery completed successfully!');
        setCompetitorDiscoveryProgress(100);
        toast({
          title: "Success",
          description: `Found ${data.influencers?.length || 0} influencers from competitor analysis.`,
        });
      } else {
        throw new Error(data.error || 'Failed to start competitor discovery');
      }
    } catch (error) {
      console.error('Error starting competitor discovery:', error);
      toast({
        title: "Error",
        description: `Failed to start competitor discovery: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setCompetitorDiscoveryStep('Discovery failed');
    } finally {
      setIsCompetitorDiscoveryActive(false);
    }
  };

  console.log(showProgress, discoveryId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
          <Rocket className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Launch New Campaign</h2>
          <p className="text-muted-foreground">Start your influencer outreach campaign</p>
        </div>
      </div>

      {/* NEW: Unified Contact Method */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Method</CardTitle>
          <CardDescription>Automatically chooses the best contact method for each influencer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Smart Contact System</h3>
                <p className="text-sm text-muted-foreground">
                  Email first, Instagram DMs only when no email is available
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="ml-auto">
              Unified
            </Badge>
          </div>
          
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>Email outreach (primary method when email is available)</span>
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              <span>Instagram DMs (fallback when no email is found)</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Duplicate prevention across all contact methods</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discovery & Targeting Configuration */}
      

      {/* Campaign Configuration */}
      <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Discovery & Targeting</CardTitle>
          <CardDescription>Choose how to find influencers and define your targeting criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hashtag" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hashtag" className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Hashtag Discovery
              </TabsTrigger>
              <TabsTrigger value="competitor" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Competitor Analysis
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="hashtag" className="space-y-6 mt-6">
          {/* Location Configuration */}
          <div className="space-y-3">
            <Label htmlFor="location" className="text-base font-semibold">Target Location</Label>
            <Input
              id="location"
              value={campaignData.location}
              onChange={(e) => setCampaignData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., New York, Los Angeles, London, Paris"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Enter city names or regions to find influencers in specific locations
            </p>
          </div>

          {/* Hashtag Configuration */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Hashtag Targeting</Label>
            
            <div className="space-y-3">
              <Label>Quick Presets</Label>
              <div className="flex flex-wrap gap-2">
                {presetHashtags.map((preset) => (
                  <Badge
                    key={preset.name}
                    variant="outline"
                    className="cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-colors"
                    onClick={() => setCampaignData(prev => ({ ...prev, hashtags: preset.tags }))}
                  >
                    {preset.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="hashtags">Custom Hashtags</Label>
              <Textarea
                id="hashtags"
                placeholder="#beauty #skincare #hairremoval #laser #cosara"
                value={campaignData.hashtags}
                onChange={(e) => setCampaignData(prev => ({ ...prev, hashtags: e.target.value }))}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Separate hashtags with spaces. Include the # symbol.</span>
                <span className="text-purple-600 font-medium">
                  {campaignData.hashtags.split(' ').filter(tag => tag.startsWith('#')).length} hashtags
                </span>
              </div>
            </div>
          </div>
            </TabsContent>
            
            <TabsContent value="competitor" className="space-y-6 mt-6">
              {/* Competitor Discovery Type */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Discovery Method</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      competitorDiscoveryType === 'tags' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setCompetitorDiscoveryType('tags')}
                  >
                    <div className="flex items-center gap-3">
                      <Hash className="w-5 h-5 text-purple-600" />
                      <div>
                        <h3 className="font-medium">Tag-Based Discovery</h3>
                        <p className="text-sm text-muted-foreground">
                          Find users who tagged competitors in posts
                        </p>
                      </div>
                    </div>
                  </div>
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      competitorDiscoveryType === 'followers' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setCompetitorDiscoveryType('followers')}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-600" />
                      <div>
                        <h3 className="font-medium">Follower Analysis</h3>
                        <p className="text-sm text-muted-foreground">
                          Analyze competitor followers for influencers
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Competitor Handles */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Competitor Handles</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="@competitor1, @competitor2"
                    value={competitorHandleInput}
                    onChange={(e) => setCompetitorHandleInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCompetitorHandle()}
                  />
                  <Button onClick={addCompetitorHandle} variant="outline">
                    Add
                  </Button>
                </div>
                {competitorHandles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {competitorHandles.map((handle, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {handle}
                        <button
                          onClick={() => removeCompetitorHandle(handle)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Note about using existing target settings */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Target Settings</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Follower count, engagement rate, and result limits will use the settings from the "Target Settings" card below.
                </p>
              </div>

              {/* Competitor Discovery Progress */}
              {isCompetitorDiscoveryActive && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">{competitorDiscoveryStep}</span>
                  </div>
                  <Progress value={competitorDiscoveryProgress} className="w-full" />
                </div>
              )}

              {/* Start Competitor Discovery Button */}
              <Button
                onClick={handleCompetitorDiscovery}
                disabled={isCompetitorDiscoveryActive || competitorHandles.length === 0}
                className="w-full"
                size="lg"
              >
                {isCompetitorDiscoveryActive ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Discovering...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Start Competitor Discovery
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
        {/* Target Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Target Settings</CardTitle>
            <CardDescription>Define your audience parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Target Count: {campaignData.targetCount} influencers</Label>
              <Slider
                value={[campaignData.targetCount]}
                onValueChange={([value]) => setCampaignData(prev => ({ ...prev, targetCount: value }))}
                max={200}
                min={10}
                step={10}
                className="w-full"
              />
              <div className="text-xs text-gray-500">
                Will discover {campaignData.targetCount} influencers within your follower range
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minFollowers">Min Followers</Label>
                <Input
                  id="minFollowers"
                  type="number"
                  value={campaignData.minFollowers}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, minFollowers: parseInt(e.target.value) || 0 }))}
                  placeholder="10000"
                />
                <div className="text-xs text-gray-500">
                  {campaignData.minFollowers.toLocaleString()} followers
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxFollowers">Max Followers</Label>
                <Input
                  id="maxFollowers"
                  type="number"
                  value={campaignData.maxFollowers}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, maxFollowers: parseInt(e.target.value) || 0 }))}
                  placeholder="100000"
                />
                <div className="text-xs text-gray-500">
                  {campaignData.maxFollowers.toLocaleString()} followers
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Selection */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Message Template</CardTitle>
            <CardDescription>Choose your outreach message template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={campaignData.template || 'initial_outreach'}
                onValueChange={(value) => setCampaignData(prev => ({ 
                  ...prev, 
                  template: value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Email Templates</SelectLabel>
                    {emailTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">{template.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Instagram DM Templates</SelectLabel>
                    {instagramTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">{template.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Templates will be automatically adapted for email or DM based on available contact info
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="productOffer">Product Offer</Label>
              <Input
                id="productOffer"
                value={campaignData.productOffer}
                onChange={(e) => setCampaignData(prev => ({ ...prev, productOffer: e.target.value }))}
                placeholder="IPL Hair Laser Device"
              />
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* Launch Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Launch Campaign
          </CardTitle>
          <CardDescription>
            Review your settings and launch your influencer outreach campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Real-time Discovery Progress */}
          {(showProgress || isDiscoveryActive) && discoveryId && (
            <DiscoveryProgressNew
              discoveryId={discoveryId}
              onComplete={handleDiscoveryComplete}
              onError={handleDiscoveryError}
            />
          )}
          
          {campaignResults && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Campaign Launched Successfully!</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Influencers Found</div>
                  <div>{campaignResults.influencersFound || campaignResults.totalInfluencers}</div>
                </div>
                <div>
                  <div className="font-medium">Emails Sent</div>
                  <div>{campaignResults.emailsSent || 0}</div>
                </div>
                <div>
                  <div className="font-medium">DMs Sent</div>
                  <div>{campaignResults.dmsSent || 0}</div>
                </div>
                <div>
                  <div className="font-medium">Total Contacted</div>
                  <div>{campaignResults.totalContacted || (campaignResults.emailsSent || 0) + (campaignResults.dmsSent || 0)}</div>
                </div>
              </div>
              {(campaignResults.skipped > 0 || campaignResults.failed > 0) && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-amber-700">Skipped</div>
                      <div className="text-amber-600">{campaignResults.skipped || 0}</div>
                    </div>
                    <div>
                      <div className="font-medium text-red-700">Failed</div>
                      <div className="text-red-600">{campaignResults.failed || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <Button
            onClick={launchCampaign}
            disabled={isLaunching || isDiscoveryActive}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {isLaunching ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Launching Campaign...
              </>
            ) : isDiscoveryActive ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Discovering Influencers...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Launch Email-First Campaign
              </>
            )}
          </Button>
          
          {/* Discovery Status Message */}
          {isDiscoveryActive && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Discovery in Progress</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Please wait while we discover and analyze influencers. The button will be enabled once discovery is complete.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignLauncher; 