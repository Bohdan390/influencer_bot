
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Instagram, Mail, Send, Eye, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DMModal from "./DMModal";
import DiscoveryProgressNew from "./DiscoveryProgressNew";
import { useWebSocket } from "../contexts/WebSocketContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const InfluencerDiscovery = () => {
  const [hashtags, setHashtags] = useState(['beauty', 'skincare', 'hairremoval']);
  const [newHashtag, setNewHashtag] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [influencers, setInfluencers] = useState([]);
  const [dmModalOpen, setDmModalOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [discoveryId, setDiscoveryId] = useState(null);
  const [showProgress, setShowProgress] = useState(false);
  const { toast } = useToast();
  const { send: sendWebSocketMessage } = useWebSocket();

  // Mock influencer data
  const mockInfluencers = [
    {
      id: 1,
      username: 'beautyguru_sarah',
      display_name: 'Sarah Johnson',
      followers: 45000,
      engagement_rate: 4.2,
      email: 'sarah@example.com',
      avatar: '',
      bio: 'Beauty enthusiast sharing honest reviews ✨ Skincare addict 💕',
      recent_posts: 156,
      status: 'discovered'
    },
    {
      id: 2,
      username: 'skincare_maven',
      display_name: 'Emma Chen',
      followers: 32000,
      engagement_rate: 5.8,
      email: 'emma@maven.com',
      avatar: '',
      bio: 'Licensed esthetician | Clean beauty advocate | NYC',
      recent_posts: 89,
      status: 'contacted'
    },
    {
      id: 3,
      username: 'wellness_with_emma',
      display_name: 'Emma Rodriguez',
      followers: 28000,
      engagement_rate: 6.1,
      email: 'hello@wellnesswithemma.com',
      avatar: '',
      bio: 'Wellness coach | Natural beauty tips | Self-care Sunday',
      recent_posts: 234,
      status: 'interested'
    }
  ];

  const addHashtag = () => {
    if (newHashtag && !hashtags.includes(newHashtag.toLowerCase())) {
      setHashtags([...hashtags, newHashtag.toLowerCase()]);
      setNewHashtag('');
    }
  };

  const removeHashtag = (tag) => {
    setHashtags(hashtags.filter(h => h !== tag));
  };

  const discoverInfluencers = async () => {
    setIsSearching(true);
    setShowProgress(true);
    setInfluencers([]); // Clear previous results
    
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hashtags: hashtags,
          limit: 10,
          minFollowers: 5000,
          maxFollowers: 500000
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDiscoveryId(data.discoveryId);
        
        // Subscribe to discovery progress via WebSocket
        sendWebSocketMessage({
          type: 'subscribe',
          discoveryId: data.discoveryId
        });
        
        toast({
          title: "Discovery Started",
          description: "Real-time progress tracking enabled",
        });
      } else {
        // Fallback to test endpoint if main discovery fails
        const testResponse = await fetch(`${API_BASE}/api/campaigns/test/discovery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hashtags: hashtags,
            limit: 10
          })
        });
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          setInfluencers(testData.influencers || mockInfluencers);
          setShowProgress(false);
          toast({
            title: "Discovery Complete",
            description: `Found ${testData.influencers?.length || mockInfluencers.length} potential influencers`,
          });
        } else {
          setInfluencers(mockInfluencers);
          setShowProgress(false);
          toast({
            title: "Demo Discovery",
            description: "Showing sample influencers (backend required for live data)",
          });
        }
      }
    } catch (error) {
      setInfluencers(mockInfluencers);
      setShowProgress(false);
      toast({
        title: "Demo Mode",
        description: "Using sample data - connect backend for real discovery",
      });
    }
    setIsSearching(false);
  };

  const handleDiscoveryComplete = (results) => {
    console.log('Discovery completed with results:', results);
    setInfluencers(results.influencers || []);
    setShowProgress(false);
    toast({
      title: "Discovery Complete",
      description: `Found ${results.influencers?.length || 0} potential influencers`,
    });
  };

  const handleDiscoveryError = (error) => {
    console.error('Discovery failed:', error);
    setShowProgress(false);
    toast({
      title: "Discovery Failed",
      description: error || "An error occurred during discovery",
      variant: "destructive"
    });
  };

  const sendOutreach = async (influencer) => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/test/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: influencer.email,
          template: 'initial_outreach',
          data: { first_name: influencer.display_name.split(' ')[0] }
        })
      });
      
      toast({
        title: "Outreach Sent",
        description: `Email sent to @${influencer.username}`,
      });
    } catch (error) {
      toast({
        title: "Demo Mode",
        description: "Outreach functionality requires backend connection",
      });
    }
  };

  const handleOpenDMModal = (influencer) => {
    setSelectedInfluencer(influencer);
    setDmModalOpen(true);
  };

  const handleSendDM = async (data) => {
    try {
      const response = await fetch(`${API_BASE}/api/dm/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const result = await response.json();
      
      // Update local state
      setInfluencers(prev => 
        prev.map(inf => 
          inf.id === data.influencer.id 
            ? { 
                ...inf, 
                status: data.dmType === 'email' ? 'reached_out' : 'dm_sent',
              }
            : inf
        )
      );

      return result;
    } catch (error) {
      console.error('Error sending DM:', error);
      throw error;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'discovered': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'interested': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const InfluencerCard = ({ influencer }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage 
                src={influencer.avatar || influencer.profile_image || influencer.profile_picture} 
                alt={influencer.display_name || influencer.username}
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {influencer.display_name ? 
                  influencer.display_name.split(' ').map(n => n[0]).join('').toUpperCase() :
                  influencer.username ? 
                    influencer.username.substring(0, 2).toUpperCase() :
                    'IG'
                }
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">@{influencer.username}</CardTitle>
              <CardDescription>{influencer.display_name}</CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(influencer.status)}>
            {influencer.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{influencer.bio}</p>
        
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-blue-600">{influencer.followers.toLocaleString()}</div>
            <div className="text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">{influencer.engagement_rate}%</div>
            <div className="text-muted-foreground">Engagement</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">{influencer.recent_posts}</div>
            <div className="text-muted-foreground">Posts</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => sendOutreach(influencer)} disabled={influencer.status === 'contacted'}>
            <Send className="w-4 h-4 mr-1" />
            {influencer.status === 'contacted' ? 'Contacted' : 'Send Outreach'}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleOpenDMModal(influencer)}
            disabled={!influencer.email && !influencer.instagram_handle}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Send DM
          </Button>
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4 mr-1" />
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Influencer Discovery</h2>
        <p className="text-muted-foreground">Find and connect with beauty influencers</p>
      </div>

      {/* Search Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Discovery Settings</CardTitle>
          <CardDescription>Configure hashtags and search parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Target Hashtags</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {hashtags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  #{tag}
                  <button onClick={() => removeHashtag(tag)} className="ml-1 text-xs">×</button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add hashtag..."
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
              />
              <Button onClick={addHashtag}>Add</Button>
            </div>
          </div>
          
          <Button onClick={discoverInfluencers} disabled={isSearching} className="w-full">
            <Search className="w-4 h-4 mr-2" />
            {isSearching ? 'Discovering...' : 'Discover Influencers'}
          </Button>
        </CardContent>
      </Card>

      {/* Progress Tracking */}
      {showProgress && discoveryId && (
        <DiscoveryProgressNew
          discoveryId={discoveryId}
          onComplete={handleDiscoveryComplete}
          onError={handleDiscoveryError}
        />
      )}

      {/* Results */}
      {influencers.length > 0 && !showProgress && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Discovery Results</h3>
            <Badge variant="outline">{influencers.length} found</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {influencers.map((influencer) => (
              <InfluencerCard key={influencer.id} influencer={influencer} />
            ))}
          </div>
        </div>
      )}

      {/* DM Modal */}
      <DMModal
        isOpen={dmModalOpen}
        onClose={() => setDmModalOpen(false)}
        influencer={selectedInfluencer}
        onSend={handleSendDM}
      />
    </div>
  );
};

export default InfluencerDiscovery;
