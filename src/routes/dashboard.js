const express = require('express');
const router = express.Router();

// Dashboard overview
router.get('/', (req, res) => {
  res.json({ 
    message: 'Dashboard overview - TODO: Implement dashboard data',
    stats: {
      totalInfluencers: 0,
      activeCampaigns: 0,
      emailsSent: 0,
      postsTracked: 0
    }
  });
});

// Analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { influencers } = require('../services/database');
    const analytics = await influencers.getAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Recent activity
router.get('/activity', (req, res) => {
  res.json({ message: 'Activity feed - TODO: Implement activity tracking' });
});

// CRM Dashboard routes
router.get('/crm', async (req, res) => {
  try {
    const { influencers } = require('../services/database');
    const stats = await influencers.getCRMDashboard();
    
    res.json(stats);
  } catch (error) {
    console.error('CRM dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/crm/list', async (req, res) => {
  try {
    const { influencers } = require('../services/database');
    const { limit, status } = req.query;
    
    const filters = {};
    if (status && status !== 'all') {
      filters.status = status;
    }
    
    const influencerList = await influencers.getCRMList(
      limit ? parseInt(limit) : 100,
      filters
    );
    
    res.json({
      influencers: influencerList,
      total: influencerList.length
    });
  } catch (error) {
    console.error('CRM list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Follow-up automation routes
router.get('/follow-ups/needed', async (req, res) => {
  try {
    const { influencers } = require('../services/database');
    const needingFollowUp = await influencers.getNeedingFollowUp();
    
    res.json({
      follow_ups: needingFollowUp,
      total: needingFollowUp.length
    });
  } catch (error) {
    console.error('Follow-up needed error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/follow-ups/send', async (req, res) => {
  try {
    const { influencer_id, follow_up_type } = req.body;
    const { influencers } = require('../services/database');
    const emailService = require('../services/email');
    
    // Get influencer data
    const influencer = await influencers.getById(influencer_id);
    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }
    
    // Determine template based on follow-up type and days since shipped
    const templateMap = {
      'follow_up_1': 'follow_up_content_reminder',
      'follow_up_2': 'follow_up_content_urgent', 
      'follow_up_3': 'follow_up_final_request'
    };
    
    const template = emailService.getTemplate(templateMap[follow_up_type] || 'follow_up_1');
    if (!template) {
      return res.status(400).json({ error: 'Template not found' });
    }
    
    // Send follow-up email
    await emailService.sendEmail(
      influencer.email,
      template.subject,
      template.html,
      {
        first_name: influencer.first_name || influencer.full_name?.split(' ')[0] || 'there',
        influencer_name: influencer.full_name || influencer.instagram_handle,
        days_since_shipped: influencer.journey_shipped_at ? 
          Math.floor((Date.now() - new Date(influencer.journey_shipped_at).getTime()) / (24 * 60 * 60 * 1000)) : 0,
        tracking_number: influencer.journey_tracking_number,
        template: templateMap[follow_up_type],
        influencer_id: influencer.id
      }
    );
    
    // Update journey milestone
    await influencers.updateJourney(influencer_id, follow_up_type);
    
    res.json({
      success: true,
      message: `${follow_up_type} sent successfully`,
      influencer: influencer.instagram_handle
    });
    
  } catch (error) {
    console.error('Send follow-up error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 