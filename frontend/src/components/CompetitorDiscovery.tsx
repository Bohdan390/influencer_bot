import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Users, 
  Search, 
  Plus, 
  X, 
  RefreshCw,
  TrendingUp,
  UserCheck,
  Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompetitorDiscoveryProps {
  onDiscoveryStart: (discoveryId: string, discoveryType: string) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const CompetitorDiscovery: React.FC<CompetitorDiscoveryProps> = ({ onDiscoveryStart }) => {
  const [competitorHandles, setCompetitorHandles] = useState<string[]>(['']);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryType, setDiscoveryType] = useState<'tags' | 'followers'>('tags');
  const [filters, setFilters] = useState({
    limit: 50,
    minFollowers: 1000,
    maxFollowers: 1000000,
    minEngagementRate: 0.0
  });
  const { toast } = useToast();

  const addCompetitorHandle = () => {
    setCompetitorHandles([...competitorHandles, '']);
  };

  const removeCompetitorHandle = (index: number) => {
    if (competitorHandles.length > 1) {
      setCompetitorHandles(competitorHandles.filter((_, i) => i !== index));
    }
  };

  const updateCompetitorHandle = (index: number, value: string) => {
    const updated = [...competitorHandles];
    updated[index] = value;
    setCompetitorHandles(updated);
  };

  const startDiscovery = async () => {
    const validHandles = competitorHandles
      .map(handle => handle.trim())
      .filter(handle => handle.length > 0)
      .map(handle => handle.startsWith('@') ? handle : `@${handle}`);

    if (validHandles.length === 0) {
      toast({
        title: "No Competitors",
        description: "Please enter at least one competitor handle.",
        variant: "destructive",
      });
      return;
    }

    setIsDiscovering(true);

    try {
      const endpoint = discoveryType === 'tags' 
        ? '/api/campaigns/discover-competitor-tags'
        : '/api/campaigns/discover-competitor-followers';

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitor_handles: validHandles,
          limit: filters.limit,
          minFollowers: filters.minFollowers,
          maxFollowers: filters.maxFollowers,
          minEngagementRate: filters.minEngagementRate
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "Discovery Started",
          description: `${discoveryType === 'tags' ? 'Tag-based' : 'Follower-based'} discovery started for ${validHandles.length} competitors.`,
        });

        onDiscoveryStart(data.discoveryId, data.discoveryType);
      } else {
        throw new Error('Failed to start discovery');
      }
    } catch (error) {
      console.error('Discovery error:', error);
      toast({
        title: "Discovery Failed",
        description: "Failed to start competitor discovery. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Competitor-Based Discovery
        </CardTitle>
        <CardDescription>
          Find influencers who have tagged your competitors or follow them
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Discovery Type Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Discovery Method</Label>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={discoveryType === 'tags' ? 'default' : 'outline'}
              onClick={() => setDiscoveryType('tags')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Hash className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Tagged Competitors</div>
                <div className="text-xs text-gray-500">Find users who tagged competitors in posts</div>
              </div>
            </Button>
            <Button
              variant={discoveryType === 'followers' ? 'default' : 'outline'}
              onClick={() => setDiscoveryType('followers')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Users className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Competitor Followers</div>
                <div className="text-xs text-gray-500">Find influencers from competitor followers</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Competitor Handles */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Competitor Handles</Label>
          <div className="space-y-2">
            {competitorHandles.map((handle, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="@competitor_handle"
                  value={handle}
                  onChange={(e) => updateCompetitorHandle(index, e.target.value)}
                  className="flex-1"
                />
                {competitorHandles.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCompetitorHandle(index)}
                    className="px-3"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addCompetitorHandle}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Competitor
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Discovery Filters</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="limit">Max Results</Label>
              <Input
                id="limit"
                type="number"
                value={filters.limit}
                onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) || 50 }))}
                min="1"
                max="500"
              />
            </div>
            <div>
              <Label htmlFor="minFollowers">Min Followers</Label>
              <Input
                id="minFollowers"
                type="number"
                value={filters.minFollowers}
                onChange={(e) => setFilters(prev => ({ ...prev, minFollowers: parseInt(e.target.value) || 1000 }))}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="maxFollowers">Max Followers</Label>
              <Input
                id="maxFollowers"
                type="number"
                value={filters.maxFollowers}
                onChange={(e) => setFilters(prev => ({ ...prev, maxFollowers: parseInt(e.target.value) || 1000000 }))}
                min="0"
              />
            </div>
            {discoveryType === 'tags' && (
              <div>
                <Label htmlFor="minEngagement">Min Engagement Rate (%)</Label>
                <Input
                  id="minEngagement"
                  type="number"
                  value={filters.minEngagementRate}
                  onChange={(e) => setFilters(prev => ({ ...prev, minEngagementRate: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Discovery Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {discoveryType === 'tags' ? (
                <Hash className="w-5 h-5 text-blue-600 mt-0.5" />
              ) : (
                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              )}
            </div>
            <div className="text-sm">
              <div className="font-medium text-blue-900 mb-1">
                {discoveryType === 'tags' ? 'Tag-Based Discovery' : 'Follower-Based Discovery'}
              </div>
              <div className="text-blue-700">
                {discoveryType === 'tags' 
                  ? 'This will find users who have mentioned or tagged your competitors in their Instagram posts. Great for finding engaged users who are already interested in your industry.'
                  : 'This will analyze your competitors\' followers to find potential influencers. Useful for finding users who are already interested in similar brands.'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Start Discovery Button */}
        <Button
          onClick={startDiscovery}
          disabled={isDiscovering || competitorHandles.every(handle => handle.trim() === '')}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isDiscovering ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Search className="w-4 h-4 mr-2" />
          )}
          {isDiscovering ? 'Starting Discovery...' : `Start ${discoveryType === 'tags' ? 'Tag-Based' : 'Follower-Based'} Discovery`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CompetitorDiscovery;
