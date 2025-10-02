/**
 * 🧪 Enhanced Features Testing Endpoints
 * Test all the new functionality: geo-verification, engagement checking, DM throttling, post detection
 */

const express = require('express');
const router = express.Router();

// Test geo-verification service
router.post('/geo-verification', async (req, res) => {
  try {
    const geoVerification = require('../services/geo-verification');
    const { influencer_data, shipping_address } = req.body;

    if (!influencer_data) {
      return res.status(400).json({ error: 'influencer_data required' });
    }

    const results = {};

    // Test influencer location verification
    if (influencer_data) {
      results.location_verification = await geoVerification.verifyInfluencerLocation(influencer_data);
    }

    // Test shipping address validation
    if (shipping_address) {
      results.address_validation = await geoVerification.validateShippingAddress(shipping_address);
    }

    // Test pre-shipment verification
    if (influencer_data && shipping_address) {
      results.pre_shipment_verification = await geoVerification.preShipmentVerification(influencer_data, shipping_address);
    }

    res.json({
      success: true,
      service: 'geo-verification',
      results,
      test_data: {
        influencer_data,
        shipping_address
      }
    });

  } catch (error) {
    console.error('Geo-verification test failed:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      service: 'geo-verification'
    });
  }
});

// Test engagement calculator service
router.post('/engagement-calculator', async (req, res) => {
  try {
    const engagementCalculator = require('../services/engagement-calculator');
    const { influencer_data, recent_posts } = req.body;

    if (!influencer_data) {
      return res.status(400).json({ error: 'influencer_data required' });
    }

    const results = {};

    // Test engagement rate calculation
    results.engagement_analysis = await engagementCalculator.calculateEngagementRate(influencer_data, recent_posts || []);

    // Test engagement validation
    results.engagement_validation = await engagementCalculator.validateInfluencerEngagement(influencer_data, recent_posts || []);

    res.json({
      success: true,
      service: 'engagement-calculator',
      results,
      test_data: {
        influencer_data,
        recent_posts: recent_posts || []
      }
    });

  } catch (error) {
    console.error('Engagement calculator test failed:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      service: 'engagement-calculator'
    });
  }
});

// Test DM throttling service
router.post('/dm-throttling', async (req, res) => {
  try {
    const dmThrottling = require('../services/dm-throttling');
    const { recipient, message, options } = req.body;

    if (!recipient || !message) {
      return res.status(400).json({ error: 'recipient and message required' });
    }

    // Initialize if not already done
    dmThrottling.initialize();

    // Queue a test DM
    const dmId = await dmThrottling.queueDM(recipient, message, options || {});

    // Get current stats
    const stats = dmThrottling.getStats();
    const queueStatus = dmThrottling.getQueueStatus();

    res.json({
      success: true,
      service: 'dm-throttling',
      dm_id: dmId,
      stats,
      queue_status: queueStatus,
      test_data: {
        recipient,
        message,
        options: options || {}
      }
    });

  } catch (error) {
    console.error('DM throttling test failed:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      service: 'dm-throttling'
    });
  }
});

// Test post detection service
router.post('/post-detection', async (req, res) => {
  try {
    const postDetection = require('../services/post-detection');
    const { influencer_data, options } = req.body;

    if (!influencer_data) {
      return res.status(400).json({ error: 'influencer_data required' });
    }

    // Start monitoring
    const monitoringId = await postDetection.startMonitoring(influencer_data, options || {});

    // Get monitoring stats
    const stats = postDetection.getMonitoringStats();

    res.json({
      success: true,
      service: 'post-detection',
      monitoring_id: monitoringId,
      stats,
      test_data: {
        influencer_data,
        options: options || {}
      }
    });

  } catch (error) {
    console.error('Post detection test failed:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      service: 'post-detection'
    });
  }
});

// Test enhanced discovery with all new features
router.post('/enhanced-discovery', async (req, res) => {
  try {
    const discovery = require('../services/discovery');
    const { hashtags, criteria } = req.body;

    if (!hashtags || !Array.isArray(hashtags)) {
      return res.status(400).json({ error: 'hashtags array required' });
    }

    const enhancedCriteria = {
      hashtags,
      count: 5, // Small test batch
      campaign_id: 'test_enhanced_discovery',
      check_geo: true,
      check_engagement: true,
      ...criteria
    };

    console.log('🧪 Testing enhanced discovery with:', enhancedCriteria);

    const results = await discovery.discoverInfluencers(enhancedCriteria);

    res.json({
      success: true,
      service: 'enhanced-discovery',
      results,
      test_data: enhancedCriteria
    });

  } catch (error) {
    console.error('Enhanced discovery test failed:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      service: 'enhanced-discovery'
    });
  }
});

// Test complete workflow with all enhanced features
router.post('/complete-workflow', async (req, res) => {
  try {
    const { product_name, hashtags } = req.body;

    if (!product_name || !hashtags) {
      return res.status(400).json({ error: 'product_name and hashtags required' });
    }

    const workflow = {
      step: 1,
      results: {},
      errors: []
    };

    // Step 1: Enhanced Discovery
    try {
      console.log('🔍 Step 1: Enhanced Discovery');
      const discovery = require('../services/discovery');
      
      workflow.results.discovery = await discovery.discoverInfluencers({
        hashtags,
        count: 3,
        campaign_id: 'test_complete_workflow',
        check_geo: true,
        check_engagement: true
      });
      
      workflow.step = 2;
    } catch (error) {
      workflow.errors.push(`Discovery failed: ${error.message}`);
    }

    // Step 2: Geo-verification for discovered influencers
    if (workflow.results.discovery && workflow.results.discovery.discovered > 0) {
      try {
        console.log('🌍 Step 2: Geo-verification');
        const geoVerification = require('../services/geo-verification');
        const { influencers } = require('../services/database');
        
        // Get discovered influencers
        const discoveredInfluencers = await influencers.getByStatus('discovered', 3);
        
        workflow.results.geo_verification = [];
        for (const influencer of discoveredInfluencers.slice(0, 2)) {
          const geoCheck = await geoVerification.verifyInfluencerLocation(influencer);
          workflow.results.geo_verification.push({
            influencer: influencer.instagram_handle,
            geo_check: geoCheck
          });
        }
        
        workflow.step = 3;
      } catch (error) {
        workflow.errors.push(`Geo-verification failed: ${error.message}`);
      }
    }

    // Step 3: DM Throttling simulation
    try {
      console.log('📱 Step 3: DM Throttling');
      const dmThrottling = require('../services/dm-throttling');
      
      dmThrottling.initialize();
      
      const dmId = await dmThrottling.queueDM(
        '@test_influencer',
        'Test message for enhanced workflow',
        { priority: 'high', campaign_id: 'test_complete_workflow' }
      );
      
      workflow.results.dm_throttling = {
        dm_id: dmId,
        stats: dmThrottling.getStats(),
        queue_status: dmThrottling.getQueueStatus()
      };
      
      workflow.step = 4;
    } catch (error) {
      workflow.errors.push(`DM throttling failed: ${error.message}`);
    }

    // Step 4: Post Detection setup
    try {
      console.log('📸 Step 4: Post Detection');
      const postDetection = require('../services/post-detection');
      
      const monitoringId = await postDetection.startMonitoring({
        id: 'test_influencer_123',
        instagram_handle: '@test_influencer',
        email: 'test@example.com'
      }, {
        campaign_id: 'test_complete_workflow',
        product_shipped_date: new Date(),
        expected_post_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      
      workflow.results.post_detection = {
        monitoring_id: monitoringId,
        stats: postDetection.getMonitoringStats()
      };
      
      workflow.step = 5;
    } catch (error) {
      workflow.errors.push(`Post detection failed: ${error.message}`);
    }

    res.json({
      success: workflow.errors.length === 0,
      service: 'complete-workflow',
      workflow,
      completed_steps: workflow.step - 1,
      total_steps: 4,
      test_data: { product_name, hashtags }
    });

  } catch (error) {
    console.error('Complete workflow test failed:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      service: 'complete-workflow'
    });
  }
});

// Get status of all enhanced services
router.get('/status', async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Check geo-verification service
    try {
      const geoVerification = require('../services/geo-verification');
      status.services.geo_verification = {
        status: 'operational',
        target_countries: ['US', 'UK', 'AU']
      };
    } catch (error) {
      status.services.geo_verification = {
        status: 'error',
        error: error.message
      };
    }

    // Check engagement calculator
    try {
      const engagementCalculator = require('../services/engagement-calculator');
      status.services.engagement_calculator = {
        status: 'operational',
        min_engagement_rate: 2.0,
        max_engagement_rate: 15.0
      };
    } catch (error) {
      status.services.engagement_calculator = {
        status: 'error',
        error: error.message
      };
    }

    // Check DM throttling
    try {
      const dmThrottling = require('../services/dm-throttling');
      status.services.dm_throttling = {
        status: 'operational',
        stats: dmThrottling.getStats(),
        queue_status: dmThrottling.getQueueStatus()
      };
    } catch (error) {
      status.services.dm_throttling = {
        status: 'error',
        error: error.message
      };
    }

    // Check post detection
    try {
      const postDetection = require('../services/post-detection');
      status.services.post_detection = {
        status: 'operational',
        stats: postDetection.getMonitoringStats()
      };
    } catch (error) {
      status.services.post_detection = {
        status: 'error',
        error: error.message
      };
    }

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Status check failed:', error);
    res.status(500).json({ 
      success: false,
      error: error.message
    });
  }
});

// Test Archive.com connection
router.get('/archive-connection', async (req, res) => {
  try {
    const archiveService = require('../services/archive');
    const result = await archiveService.testConnection();
    
    res.json({
      success: result.success,
      service: 'archive-com',
      result: result,
      stats: archiveService.getMonitoringStats()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'archive-com',
      error: error.message
    });
  }
});

// Test Archive.com monitoring
router.post('/archive-monitoring', async (req, res) => {
  try {
    const archiveService = require('../services/archive');
    const { test_mode = true } = req.body;
    
    if (test_mode) {
      // Run a limited test monitoring cycle
      const result = await archiveService.monitorBrandMentions();
      
      res.json({
        success: true,
        service: 'archive-monitoring',
        result: result,
        test_mode: true
      });
    } else {
      res.json({
        success: false,
        error: 'Full monitoring disabled in test mode'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'archive-monitoring',
      error: error.message
    });
  }
});

// Test Slack connection
router.post('/slack-test', async (req, res) => {
  try {
    const slackService = require('../services/slack');
    const result = await slackService.testConnection();
    
    res.json({
      success: result.success,
      service: 'slack',
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'slack',
      error: error.message
    });
  }
});

// Test Slack post notification
router.post('/slack-post-notification', async (req, res) => {
  try {
    const slackService = require('../services/slack');
    const { influencer, post, analysis } = req.body;
    
    if (!influencer || !post || !analysis) {
      return res.status(400).json({
        success: false,
        error: 'influencer, post, and analysis required'
      });
    }
    
    await slackService.sendPostNotification(influencer, post, analysis);
    
    res.json({
      success: true,
      service: 'slack-post-notification',
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'slack-post-notification',
      error: error.message
    });
  }
});

// Test Slack post archiving
router.post('/slack-archive-test', async (req, res) => {
  try {
    const slackService = require('../services/slack');
    
    // Mock influencer data
    const mockInfluencer = {
      id: 'test_influencer_123',
      instagram_handle: 'test_influencer',
      follower_count: 15000
    };
    
    // Mock post data with brand mention
    const mockPost = {
      url: 'https://instagram.com/p/test123',
      caption: 'Loving my new IPL device from @cosara.official! #cosarapartner #skincare',
      created_at: new Date().toISOString(),
      likes_count: 245,
      comments_count: 18,
      engagement_rate: 1.75,
      hashtags: ['#cosarapartner', '#skincare', '#ipl'],
      mentions: ['@cosara.official']
    };
    
    // Mock analysis
    const mockAnalysis = {
      quality_score: 85,
      compliant: true,
      compliance_score: 90
    };
    
    // Test archiving
    const archived = await slackService.archiveInfluencerPost(mockInfluencer, mockPost, mockAnalysis);
    
    res.json({
      success: true,
      service: 'slack-archive-test',
      message: 'Post archiving test completed',
      archived: archived,
      test_data: {
        influencer: mockInfluencer.instagram_handle,
        post_url: mockPost.url,
        brand_mentioned: true,
        quality_score: mockAnalysis.quality_score
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'slack-archive-test',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test influencer posting status report
router.post('/slack-status-report', async (req, res) => {
  try {
    const slackService = require('../services/slack');
    
    // Mock influencer data for status report
    const mockInfluencers = [
      {
        instagram_handle: 'beauty_guru_1',
        has_posted: true,
        product_shipped: true,
        days_since_shipped: 5
      },
      {
        instagram_handle: 'skincare_lover',
        has_posted: true,
        product_shipped: true,
        days_since_shipped: 3
      },
      {
        instagram_handle: 'wellness_coach',
        has_posted: false,
        product_shipped: true,
        days_since_shipped: 12
      },
      {
        instagram_handle: 'lifestyle_blogger',
        has_posted: false,
        product_shipped: true,
        days_since_shipped: 8
      },
      {
        instagram_handle: 'fitness_model',
        has_posted: false,
        product_shipped: false,
        days_since_shipped: 0
      }
    ];
    
    await slackService.sendInfluencerPostingStatus(mockInfluencers);
    
    res.json({
      success: true,
      service: 'slack-status-report',
      message: 'Posting status report sent to Slack',
      summary: {
        total_influencers: mockInfluencers.length,
        posted: mockInfluencers.filter(inf => inf.has_posted).length,
        shipped_not_posted: mockInfluencers.filter(inf => !inf.has_posted && inf.product_shipped).length,
        pending_shipment: mockInfluencers.filter(inf => !inf.product_shipped).length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'slack-status-report',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test complete Archive.com + Slack workflow
router.post('/archive-slack-workflow', async (req, res) => {
  try {
    const archiveService = require('../services/archive');
    const slackService = require('../services/slack');
    
    // Test Archive.com connection
    const archiveTest = await archiveService.testConnection();
    
    // Test Slack connection
    const slackTest = await slackService.testConnection();
    
    // Run monitoring if both are working
    let monitoringResult = null;
    if (archiveTest.success && slackTest.success) {
      monitoringResult = await archiveService.monitorBrandMentions();
    }
    
    res.json({
      success: archiveTest.success && slackTest.success,
      service: 'archive-slack-workflow',
      results: {
        archive_connection: archiveTest,
        slack_connection: slackTest,
        monitoring_result: monitoringResult
      },
      workflow_status: archiveTest.success && slackTest.success ? 'operational' : 'needs_configuration'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'archive-slack-workflow',
      error: error.message
    });
  }
});

module.exports = router; 