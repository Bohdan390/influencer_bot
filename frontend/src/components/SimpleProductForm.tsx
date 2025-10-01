import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Loader2, Send, Sparkles, Target, Hash, Users } from 'lucide-react';

const SimpleProductForm = () => {
  const [formData, setFormData] = useState({
    productName: 'Dermao IPL Hair Laser',
    productType: 'Beauty Device',
    description: 'Revolutionary at-home IPL hair removal device that delivers professional salon results',
    influencerCount: '50',
    hashtags: ''
  });

  const [hashtagList, setHashtagList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState(null);

  // Handle hashtag input
  const handleHashtagInput = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, hashtags: value });

    // Parse hashtags from input
    const tags = value.split(/[,\s]+/)
      .map(tag => tag.trim().replace(/^#/, ''))
      .filter(tag => tag.length > 0)
      .map(tag => `#${tag}`);
    
    setHashtagList(tags);
  };

  // Start campaign
  const handleStartCampaign = async () => {
    setIsLoading(true);
    setCampaignStatus(null);

    try {
      const campaignData = {
        product: {
          name: formData.productName,
          type: formData.productType,
          description: formData.description
        },
        targeting: {
          influencer_count: parseInt(formData.influencerCount),
          hashtags: hashtagList.length > 0 ? hashtagList : null // null = AI will find hashtags
        },
        auto_start: true
      };

      console.log('🚀 Starting campaign with:', campaignData);

      const response = await fetch('/api/campaigns/simple-start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      });

      const result = await response.json();

      if (result.success) {
        setCampaignStatus({
          type: 'success',
          message: `Campaign started! Targeting ${result.campaign.target_count} influencers`,
          details: result
        });
      } else {
        setCampaignStatus({
          type: 'error',
          message: result.error || 'Failed to start campaign'
        });
      }
    } catch (error) {
      console.error('Campaign start error:', error);
      setCampaignStatus({
        type: 'error',
        message: 'Network error - please try again'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          🚀 Influencer Marketing Bot
        </h1>
        <p className="text-gray-600">
          Simple setup - AI handles the rest
        </p>
      </div>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Product & Campaign Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Product Name *
            </label>
            <Input
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="e.g., Dermao IPL Hair Laser"
              className="w-full"
            />
          </div>

          {/* Product Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Product Type *
            </label>
            <Input
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              placeholder="e.g., Beauty Device, Skincare, Fashion"
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Short Description *
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your product and its benefits..."
              rows={3}
              className="w-full"
            />
          </div>

          {/* Influencer Count */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              How many influencers to reach out to? *
            </label>
            <Input
              type="number"
              value={formData.influencerCount}
              onChange={(e) => setFormData({ ...formData, influencerCount: e.target.value })}
              min="10"
              max="500"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Recommended: 50-100 for best results
            </p>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Hashtags (Optional)
            </label>
            <Input
              value={formData.hashtags}
              onChange={handleHashtagInput}
              placeholder="beauty, skincare, hairremoval (or leave empty for AI to find)"
              className="w-full"
            />
            
            {/* Hashtag Preview */}
            {hashtagList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {hashtagList.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Sparkles className="w-3 h-3" />
              {hashtagList.length === 0 ? 
                'AI will automatically find the best hashtags and test different combinations' :
                'AI will test these hashtags plus find additional ones'
              }
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStartCampaign}
            disabled={isLoading || !formData.productName || !formData.productType || !formData.description}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting Campaign...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Start AI Campaign
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Campaign Status */}
      {campaignStatus && (
        <Card className={`border-l-4 ${
          campaignStatus.type === 'success' ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
        }`}>
          <CardContent className="pt-6">
            <div className={`text-sm font-medium ${
              campaignStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {campaignStatus.message}
            </div>
            
            {campaignStatus.type === 'success' && campaignStatus.details && (
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Target: {campaignStatus.details.campaign?.target_count || formData.influencerCount} influencers
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Hashtags: {campaignStatus.details.campaign?.hashtags_used?.join(', ') || 'AI-generated'}
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 font-medium">✨ Campaign is now running!</p>
                  <p className="text-blue-700 text-xs mt-1">
                    AI will discover influencers, send personalized emails, and handle responses automatically.
                    You'll get notifications in Slack when there are updates.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
              <Sparkles className="w-4 h-4" />
              AI Automation
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Discovers relevant influencers</li>
              <li>• Sends personalized emails</li>
              <li>• Handles responses automatically</li>
              <li>• Ships products when ready</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
              <Target className="w-4 h-4" />
              Smart Targeting
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 10K-100K follower range</li>
              <li>• US, UK, Australia focus</li>
              <li>• High engagement rates</li>
              <li>• A/B tests different approaches</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleProductForm; 