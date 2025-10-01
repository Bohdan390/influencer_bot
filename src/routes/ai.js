const express = require('express');
const router = express.Router();
const aiResponseHandler = require('../services/ai-response-handler');

// POST /api/ai/generate-message - Generate personalized message using AI
router.post('/generate-message', async (req, res) => {
  try {
    const { influencer, dmType, campaignType = 'outreach' } = req.body;
    
    if (!influencer) {
      return res.status(400).json({
        success: false,
        error: 'Influencer data is required'
      });
    }

    if (!dmType || !['email', 'instagram'].includes(dmType)) {
      return res.status(400).json({
        success: false,
        error: 'Valid DM type (email or instagram) is required'
      });
    }

    console.log(`🤖 Generating ${dmType} message for ${influencer.instagram_handle}`);

    // Generate personalized message using AI
    const messageData = await aiResponseHandler.generatePersonalizedOutreach(
      influencer,
      {
        template: 'personalized',
        productOffer: 'IPL Hair Laser Device',
        brandName: 'Dermao',
        campaignType: campaignType,
        dmType: dmType
      }
    );

    // Format response based on DM type
    const response = {
      success: true,
      message: dmType === 'email' ? messageData.text : messageData.text,
      subject: dmType === 'email' ? messageData.subject : undefined,
      personalization_notes: messageData.personalization_notes,
      dm_type: dmType,
      influencer_handle: influencer.instagram_handle
    };

    console.log(`✅ Generated ${dmType} message for ${influencer.instagram_handle}`);
    res.json(response);

  } catch (error) {
    console.error('❌ Failed to generate message:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate message'
    });
  }
});

// POST /api/ai/analyze-response - Analyze influencer response using AI
router.post('/analyze-response', async (req, res) => {
  try {
    const { emailContent, influencerData, campaignContext } = req.body;
    
    if (!emailContent || !influencerData) {
      return res.status(400).json({
        success: false,
        error: 'Email content and influencer data are required'
      });
    }

    console.log(`🤖 Analyzing response from ${influencerData.instagram_handle}`);

    const analysis = await aiResponseHandler.analyzeResponse(
      emailContent,
      influencerData,
      campaignContext || {}
    );

    res.json({
      success: true,
      analysis: analysis,
      influencer_handle: influencerData.instagram_handle
    });

  } catch (error) {
    console.error('❌ Failed to analyze response:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze response'
    });
  }
});

// GET /api/ai/status - Check AI service status
router.get('/status', (req, res) => {
  const isConfigured = aiResponseHandler.isConfigured();
  const provider = process.env.AI_PROVIDER || 'gemini';
  
  let hasApiKey = false;
  if (provider === 'gemini') {
    hasApiKey = !!process.env.GEMINI_API_KEY;
  } else if (provider === 'openai') {
    hasApiKey = !!process.env.OPENAI_API_KEY;
  }
  
  res.json({
    success: true,
    configured: isConfigured,
    provider: provider,
    has_api_key: hasApiKey,
    available_providers: {
      gemini: !!process.env.GEMINI_API_KEY,
      openai: !!process.env.OPENAI_API_KEY
    }
  });
});

// POST /api/ai/generate-bulk-message - Generate bulk message for multiple influencers
router.post('/generate-bulk-message', async (req, res) => {
  try {
    const { influencers, campaignType = 'bulk_outreach' } = req.body;
    
    if (!influencers || !Array.isArray(influencers) || influencers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Influencers array is required'
      });
    }

    console.log(`🤖 Generating bulk message for ${influencers.length} influencers`);

    // Generate bulk message using AI
    const messageData = await aiResponseHandler.generateBulkOutreach(
      influencers,
      {
        template: 'bulk_personalized',
        productOffer: 'IPL Hair Laser Device',
        brandName: 'Dermao',
        campaignType: campaignType,
        dmType: 'email'
      }
    );

    const response = {
      success: true,
      message: messageData.text,
      subject: messageData.subject,
      personalization_notes: messageData.personalization_notes,
      dm_type: 'email',
      influencer_count: influencers.length
    };

    console.log(`✅ Generated bulk message for ${influencers.length} influencers`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error generating bulk message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate bulk message',
      details: error.message
    });
  }
});

module.exports = router;
