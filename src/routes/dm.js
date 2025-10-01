const express = require('express');
const router = express.Router();
const emailService = require('../services/email');
const instagramDMAutomation = require('../services/instagram-dm-automation');
const dmThrottling = require('../services/dm-throttling');

// POST /api/dm/send - Send individual DM (email or Instagram)
router.post('/send', async (req, res) => {
  try {
    const { influencer, dmType = 'email', message, subject, firstSend = false, message_id = null } = req.body;
    
    if (!influencer || !message) {
      return res.status(400).json({
        success: false,
        error: 'Influencer, DM type, and message are required'
      });
    }

    console.log(`📤 Sending ${dmType} to ${influencer.instagram_handle}`);

    let result = await sendDM(influencer, dmType, message, subject, firstSend, message_id);
    return res.status(200).json({
      success: true,
      result: result
    });


  } catch (error) {
    console.error('❌ Failed to send DM:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message'
    });
  }
});


async function sendDM(influencer, dmType, message, subject, firstSend, message_id) {
  let result;

    if (dmType === 'email') {
      if (!influencer.email) {
        return res.status(400).json({
          success: false,
          error: 'No email address available for this influencer'
        });
      }

      if (!subject && firstSend) {
        return res.status(400).json({
          success: false,
          error: 'Email subject is required'
        });
      }

      // Send email
      result = await emailService.sendEmail(
        influencer.email,
        subject,
        message.replace(/\n/g, '<br>'), // Convert line breaks to HTML
        {
          influencer_id: influencer.id,
          message_id,
          instagram_handle: influencer.instagram_handle,
          dm_type: 'email',
          manual_send: true,
          first_send: firstSend
        }
      );

    } else if (dmType === 'instagram') {
      if (!influencer.instagram_handle) {
        return res.status(400).json({
          success: false,
          error: 'No Instagram handle available for this influencer'
        });
      }

      // Initialize DM throttling if not already done
      if (!dmThrottling.isInitialized()) {
        dmThrottling.initialize();
      }

      // Queue Instagram DM
      const dmId = await dmThrottling.queueDM(
        influencer.instagram_handle,
        message,
        {
          influencer_id: influencer.id,
          manual_send: true,
          priority: 'high'
        }
      );

      result = {
        dm_id: dmId,
        status: 'queued',
        message: 'Instagram DM queued for sending'
      };
    }

    // Update influencer status in database
    try {
      const { influencers } = require('../services/database');
      await influencers.update(influencer.id, {
        status: dmType === 'email' ? 'reached_out' : 'dm_sent',
        last_message: message.substring(0, 200) // Store first 200 chars
      });
    } catch (dbError) {
      console.warn('⚠️ Could not update influencer status in database:', dbError.message);
    }

    console.log(`✅ ${dmType} sent successfully to ${influencer.instagram_handle}`);
    return result;
}

// POST /api/dm/send-bulk - Send DMs to multiple influencers
router.post('/send-bulk', async (req, res) => {
  try {
    const { influencers: targetInfluencers, dmType = 'email', message, subject } = req.body;
    
    if (!targetInfluencers || !Array.isArray(targetInfluencers) || targetInfluencers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Influencers array is required'
      });
    }

    // if (!dmType || !['email', 'instagram'].includes(dmType)) {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'DM type must be either "email" or "instagram"'
    //   });
    // }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log(`📤 Sending bulk ${dmType} to ${targetInfluencers.length} influencers`);

    const results = [];
    const errors = [];

    for (const influencer of targetInfluencers) {
      try {
        const result = await sendDM(influencer, dmType, message, subject, true, null);
        results.push({
          influencer_id: influencer.id,
          instagram_handle: influencer.instagram_handle,
          success: true,
          result: result
        });
      } catch (error) {
        errors.push({
          influencer_id: influencer.id,
          instagram_handle: influencer.instagram_handle,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      dm_type: dmType,
      total_influencers: targetInfluencers.length,
      successful: results.length,
      failed: errors.length,
      results: results,
      errors: errors,
      message: `Bulk ${dmType} sending completed: ${results.length} successful, ${errors.length} failed`
    });

  } catch (error) {
    console.error('❌ Failed to send bulk DMs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send bulk messages'
    });
  }
});

// GET /api/dm/status - Get DM sending status and queue info
router.get('/status', (req, res) => {
  try {
    const dmStats = dmThrottling.getStats();
    const queueStatus = dmThrottling.getQueueStatus();

    res.json({
      success: true,
      dm_throttling: {
        initialized: dmThrottling.isInitialized(),
        stats: dmStats,
        queue: queueStatus
      },
      email_service: {
        provider: emailService.provider || 'unknown',
        configured: !!emailService.fromEmail
      }
    });

  } catch (error) {
    console.error('❌ Failed to get DM status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get DM status'
    });
  }
});

module.exports = router;
