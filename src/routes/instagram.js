const express = require('express');
const router = express.Router();
const authService = require('../services/auth');
const instagramDMAutomation = require('../services/instagram-dm-automation');
const { instagramDMVariants } = require('../templates/instagram-dm-variants');
const { influencers } = require('../services/database');

// Mock data for Instagram conversations (replace with real Instagram API integration)
const mockConversations = [
  {
    id: 'conv_1',
    influencer: {
      id: 'inf_1',
      name: 'Sarah Beauty',
      handle: '@sarahbeauty',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150',
      followers: 45000,
      verified: true
    },
    messages: [
      {
        id: 'msg_1',
        content: 'Hi! Thanks for reaching out about the collaboration opportunity',
        type: 'received',
        timestamp: '2025-01-02T10:30:00Z',
        read: true,
        delivered: true
      },
      {
        id: 'msg_2',
        content: 'Hey Sarah! So excited to work with you. Have you had a chance to check out our IPL device?',
        type: 'sent',
        timestamp: '2025-01-02T10:45:00Z',
        read: true,
        delivered: true
      },
      {
        id: 'msg_3',
        content: 'Yes! It looks amazing. I\'d love to try it out. How does the collaboration work exactly?',
        type: 'received',
        timestamp: '2025-01-02T11:00:00Z',
        read: true,
        delivered: true
      }
    ],
    lastMessage: 'Yes! It looks amazing. I\'d love to try it out. How does the collaboration work exactly?',
    lastActivity: '2 hours ago',
    unreadCount: 0,
    status: 'active'
  },
  {
    id: 'conv_2',
    influencer: {
      id: 'inf_2',
      name: 'Jessica Glow',
      handle: '@jessicaglow',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      followers: 32000,
      verified: false
    },
    messages: [
      {
        id: 'msg_4',
        content: 'Hi! I got your message about the brand partnership. I\'m interested but have some questions.',
        type: 'received',
        timestamp: '2025-01-02T09:15:00Z',
        read: true,
        delivered: true
      },
      {
        id: 'msg_5',
        content: 'Hi Jessica! Great to hear from you. What questions can I help answer?',
        type: 'sent',
        timestamp: '2025-01-02T09:30:00Z',
        read: true,
        delivered: true
      }
    ],
    lastMessage: 'Hi Jessica! Great to hear from you. What questions can I help answer?',
    lastActivity: '4 hours ago',
    unreadCount: 1,
    status: 'active'
  },
  {
    id: 'conv_3',
    influencer: {
      id: 'inf_3',
      name: 'Emma Wellness',
      handle: '@emmawellness',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      followers: 78000,
      verified: true
    },
    messages: [
      {
        id: 'msg_6',
        content: 'Thank you for sending the IPL device! I\'ve been using it for 2 weeks now and LOVE it!',
        type: 'received',
        timestamp: '2025-01-01T15:20:00Z',
        read: true,
        delivered: true
      },
      {
        id: 'msg_7',
        content: 'That\'s amazing to hear Emma! We\'re so glad you\'re loving it. Would you be interested in creating some content to share your experience?',
        type: 'sent',
        timestamp: '2025-01-01T15:35:00Z',
        read: true,
        delivered: true
      },
      {
        id: 'msg_8',
        content: 'Absolutely! I was actually planning to post about it this week. The results have been incredible!',
        type: 'received',
        timestamp: '2025-01-01T16:00:00Z',
        read: true,
        delivered: true
      }
    ],
    lastMessage: 'Absolutely! I was actually planning to post about it this week. The results have been incredible!',
    lastActivity: '1 day ago',
    unreadCount: 0,
    status: 'active'
  }
];

// GET /api/instagram/conversations - Get all Instagram conversations
router.get('/conversations', authService.requireAuth, async (req, res) => {
  try {
    // In a real implementation, you would integrate with Instagram's API
    // For now, returning mock data
    
    res.json({
      success: true,
      conversations: mockConversations,
      total: mockConversations.length
    });
  } catch (error) {
    console.error('Failed to fetch Instagram conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

// GET /api/instagram/conversations/:id - Get specific conversation
router.get('/conversations/:id', authService.requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = mockConversations.find(conv => conv.id === id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Failed to fetch conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation'
    });
  }
});

// POST /api/instagram/send-message - Send a message in a conversation
router.post('/send-message', authService.requireAuth, async (req, res) => {
  try {
    const { conversation_id, message } = req.body;
    
    if (!conversation_id || !message) {
      return res.status(400).json({
        success: false,
        error: 'Conversation ID and message are required'
      });
    }
    
    // In a real implementation, you would:
    // 1. Send the message via Instagram's API
    // 2. Store the message in your database
    // 3. Update the conversation thread
    
    // For now, just return success with a mock message ID
    const messageId = `msg_${Date.now()}`;
    
    console.log(`📱 Instagram message sent to conversation ${conversation_id}: ${message}`);
    
    res.json({
      success: true,
      message_id: messageId,
      sent_at: new Date().toISOString(),
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Failed to send Instagram message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// POST /api/instagram/send-campaign-dms - NEW: Send campaign DMs to multiple influencers
router.post('/send-campaign-dms', async (req, res) => {
  try {
    const { influencers: targetInfluencers, template, productOffer, split_test_id } = req.body;
    
    if (!targetInfluencers || !targetInfluencers.length) {
      return res.status(400).json({
        success: false,
        error: 'Influencers array is required'
      });
    }

    if (!template) {
      return res.status(400).json({
        success: false,
        error: 'Template is required'
      });
    }

    console.log(`🚀 Starting Instagram DM campaign to ${targetInfluencers.length} influencers`);
    console.log(`📋 Template: ${template}`);
    console.log(`🧪 Split test: ${split_test_id ? 'Enabled' : 'Disabled'}`);

    // Send campaign DMs
    const result = await instagramDMAutomation.sendCampaignDMs(
      targetInfluencers,
      template,
      productOffer,
      split_test_id
    );

    res.json({
      success: true,
      ...result,
      message: `Instagram DM campaign launched successfully`
    });

  } catch (error) {
    console.error('Failed to send campaign DMs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send campaign DMs'
    });
  }
});

// POST /api/instagram/check-responses - NEW: Check for new DM responses
router.post('/check-responses', async (req, res) => {
  try {
    console.log('📱 Manually checking for new Instagram DM responses...');
    
    const result = await instagramDMAutomation.checkDMResponses();
    
    res.json({
      success: true,
      ...result,
      message: `Processed ${result.responsesProcessed || 0} new responses`
    });

  } catch (error) {
    console.error('Failed to check DM responses:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check responses'
    });
  }
});

// GET /api/instagram/dm-stats - NEW: Get DM campaign statistics
router.get('/dm-stats', async (req, res) => {
  try {
    const stats = await instagramDMAutomation.getDMStats();
    
    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Failed to get DM stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get DM stats'
    });
  }
});

// GET /api/instagram/stats - Alias for dm-stats (for frontend compatibility)
router.get('/stats', async (req, res) => {
  try {
    // Get DM stats directly from database
    const dmStats = await influencers.getDMStats();
    
    // ✨ Get hashtag performance analysis
    const hashtagPerformance = await influencers.getHashtagPerformance();

    // Get account health info (simplified without Instagram service dependency)
    const accountsHealth = [{
      username: process.env.INSTAGRAM_USERNAME || 'dermao.beauty',
      status: 'healthy',
      daily_limit: 40,
      sent_today: dmStats.today_sent || 0,
      remaining_today: Math.max(0, 40 - (dmStats.today_sent || 0)),
      last_activity: new Date().toISOString()
    }];

    // Enhanced stats with hashtag insights
    const enhancedStats = {
      ...dmStats,
      accounts: accountsHealth,
      hashtag_insights: {
        ...hashtagPerformance,
        actionable_insights: {
          best_hashtags: Object.entries(hashtagPerformance.hashtag_performance || {})
            .filter(([, stats]) => stats.conversion_rate > 0)
            .slice(0, 3)
            .map(([hashtag, stats]) => ({
              hashtag,
              conversion_rate: `${stats.conversion_rate}%`,
              total_discovered: stats.total_discovered,
              recommendation: `#${hashtag} converts at ${stats.conversion_rate}% - focus here`
            })),
          underperforming_hashtags: Object.entries(hashtagPerformance.hashtag_performance || {})
            .filter(([, stats]) => stats.total_discovered >= 5 && stats.conversion_rate === 0)
            .slice(0, 3)
            .map(([hashtag, stats]) => ({
              hashtag,
              total_discovered: stats.total_discovered,
              recommendation: `#${hashtag} found ${stats.total_discovered} influencers but no conversions - consider replacing`
            })),
          next_steps: hashtagPerformance.summary?.best_performer ? [
            `Double down on #${hashtagPerformance.summary.best_performer}`,
            'Test similar hashtags to your top performers',
            'Phase out hashtags with 0% conversion after 10+ discoveries'
          ] : [
            'Start discovering influencers to build hashtag performance data',
            'Try a mix of broad and niche hashtags',
            'Track which hashtags lead to actual conversions'
          ]
        }
      },
      duplicate_prevention: {
        enabled: true,
        description: 'System automatically prevents contacting the same influencer twice across email and DM channels',
        last_check: new Date().toISOString()
      }
    };

    res.json(enhancedStats);

  } catch (error) {
    console.error('❌ Failed to get Instagram stats:', error);
    res.status(500).json({ 
      error: 'Failed to get Instagram statistics',
      details: error.message 
    });
  }
});

// GET /api/instagram/templates - NEW: Get available DM templates
router.get('/templates', (req, res) => {
  try {
    const templates = {
      initial_dm_variants: Object.keys(instagramDMVariants.initial_dm_variants).map(key => ({
        id: key,
        name: instagramDMVariants.initial_dm_variants[key].name,
        description: instagramDMVariants.initial_dm_variants[key].description,
        type: 'initial_outreach'
      })),
      follow_up_variants: Object.keys(instagramDMVariants.follow_up_dm_variants).map(key => ({
        id: key,
        name: instagramDMVariants.follow_up_dm_variants[key].name,
        description: instagramDMVariants.follow_up_dm_variants[key].description,
        type: 'follow_up'
      })),
      response_variants: Object.keys(instagramDMVariants.response_dm_variants).map(key => ({
        id: key,
        name: instagramDMVariants.response_dm_variants[key].name,
        description: instagramDMVariants.response_dm_variants[key].description,
        type: 'response'
      })),
      negotiation_variants: Object.keys(instagramDMVariants.negotiation_dm_variants).map(key => ({
        id: key,
        name: instagramDMVariants.negotiation_dm_variants[key].name,
        description: instagramDMVariants.negotiation_dm_variants[key].description || 'Handles specific negotiation scenarios',
        type: 'negotiation'
      }))
    };

    res.json({
      success: true,
      templates: templates,
      total_templates: Object.values(templates).reduce((sum, arr) => sum + arr.length, 0)
    });

  } catch (error) {
    console.error('Failed to get DM templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get DM templates'
    });
  }
});

// POST /api/instagram/mark-read - Mark messages as read
router.post('/mark-read', authService.requireAuth, async (req, res) => {
  try {
    const { conversation_id, message_ids } = req.body;
    
    if (!conversation_id) {
      return res.status(400).json({
        success: false,
        error: 'Conversation ID is required'
      });
    }
    
    // In a real implementation, mark messages as read in Instagram API
    console.log(`📱 Marked messages as read in conversation ${conversation_id}`);
    
    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }
});

// GET /api/instagram/profile/:handle - Get Instagram profile info
router.get('/profile/:handle', authService.requireAuth, async (req, res) => {
  try {
    const { handle } = req.params;
    
    // In a real implementation, fetch profile from Instagram API
    // For now, return mock profile data
    const mockProfile = {
      handle: handle,
      name: 'Mock Profile',
      bio: 'Beauty & Lifestyle Content Creator',
      followers: 50000,
      following: 1500,
      posts: 342,
      verified: false,
      profile_pic: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150',
      external_url: 'https://example.com'
    };
    
    res.json({
      success: true,
      profile: mockProfile
    });
  } catch (error) {
    console.error('Failed to fetch Instagram profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// POST /api/instagram/webhook - Handle Instagram webhooks
router.post('/webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    
    // In a real implementation, process Instagram webhook events
    // This could include new messages, mentions, etc.
    console.log('📱 Instagram webhook received:', webhookData);
    
    // If it's a new message, process it
    if (webhookData.object === 'instagram' && webhookData.entry) {
      for (const entry of webhookData.entry) {
        if (entry.messaging) {
          for (const message of entry.messaging) {
            // Process new DM
            await instagramDMAutomation.checkDMResponses();
          }
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error) {
    console.error('Failed to process Instagram webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook'
    });
  }
});

module.exports = router; 