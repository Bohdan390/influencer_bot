const express = require('express');
const router = express.Router();
const emailService = require('../services/email');
const { supabase } = require('../services/supabase');


/**
 * Get all email campaigns
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const {data: campaigns, error: campaignsError} = await supabase()
      .from('email_campaigns')
      .select('*, influencers (id, instagram_handle, name, profile_picture, email)')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
      if (campaignsError) {
        throw new Error('Failed to fetch email campaigns', campaignsError);
      }

    // Add reply counts to each campaign
    const campaignsWithReplyCounts = campaigns.map(campaign => ({
      ...campaign,
      good_reply_count: campaign.good_reply || 0,
      bad_reply_count: campaign.bad_reply || 0,
      total_replies: (campaign.good_reply || 0) + (campaign.bad_reply || 0),
      reply_rate: campaign.good_reply && campaign.bad_reply ? 
        ((campaign.good_reply / (campaign.good_reply + campaign.bad_reply)) * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      campaigns: campaignsWithReplyCounts,
      total: campaigns.length
    });
  } catch (error) {
    console.error('❌ Error fetching email campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email campaigns',
      details: error.message
    });
  }
});

router.get('/:influencerHandle/chat-messages', async (req, res) => {
  try {
    const { influencerHandle } = req.params;
    const { data, error } = await supabase()
      .from('chat_messages')
      .select('*')
      .eq('influencer_handle', influencerHandle)
      .order('created_at', { ascending: true });
    if (error) {
      throw error;
    }
    res.json({
      success: true,
      messages: data || [],
      total: data?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching email campaign messages by influencer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email campaign messages',
      details: error.message
    });
  }
});

router.get('/influencer/:influencerId', async (req, res) => {
  try {
    const { influencerId } = req.params;
    const campaigns = await emailService.getEmailCampaignsByInfluencer(influencerId);
    
    res.json({
      success: true,
      campaigns,
      total: campaigns.length
    });
  } catch (error) {
    console.error('❌ Error fetching email campaigns by influencer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email campaigns',
      details: error.message
    });
  }
});

/**
 * Send email to influencer
 */
router.post('/send', async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName,
      subject,
      content,
      htmlContent,
      influencerId,
      campaignId,
      metadata = {}
    } = req.body;

    if (!recipientEmail || !subject || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: recipientEmail, subject, content'
      });
    }

    // Send email
    const result = await emailService.sendEmail(
      recipientEmail,
      subject,
      htmlContent || content,
      {
        recipientName,
        influencerId,
        campaignId,
        metadata
      }
    );

    res.json({
      success: true,
      message: 'Email sent successfully',
      result
    });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
});

/**
 * Get chat messages for a campaign
 */
router.get('/:campaignId/chat', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        influencers (
          instagram_handle,
          full_name,
          profile_image
        )
      `)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      messages: data || [],
      total: data?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching chat messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat messages',
      details: error.message
    });
  }
});

/**
 * Send chat message
 */
router.post('/:campaignId/chat', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const {
      message,
      senderType = 'user',
      senderName,
      senderEmail,
      messageType = 'text',
      influencerId,
      metadata = {}
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        campaign_id: campaignId,
        influencer_id: influencerId,
        sender_type: senderType,
        sender_name: senderName,
        sender_email: senderEmail,
        message,
        message_type: messageType,
        metadata
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Chat message sent successfully',
      chatMessage: data
    });
  } catch (error) {
    console.error('❌ Error sending chat message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send chat message',
      details: error.message
    });
  }
});

/**
 * Mark chat messages as read
 */
router.put('/:campaignId/chat/read', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { messageIds = [] } = req.body;

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    if (messageIds.length === 0) {
      // Mark all messages as read
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('campaign_id', campaignId)
        .neq('sender_type', 'user'); // Don't mark user's own messages as read

      if (error) throw error;
    } else {
      // Mark specific messages as read
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .in('id', messageIds);

      if (error) throw error;
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read',
      details: error.message
    });
  }
});

/**
 * Mark campaign as read and reset reply counts
 */
router.put('/:campaignId/mark-read', async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Reset reply counts to 0 and mark as read
    const { error } = await supabase()
      .from('email_campaigns')
      .update({ 
        good_reply: 0,
        bad_reply: 0,
      })
      .eq('id', campaignId);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Campaign marked as read and reply counts reset'
    });
  } catch (error) {
    console.error('❌ Error marking campaign as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark campaign as read',
      details: error.message
    });
  }
});

/**
 * Get email campaign statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: campaigns, error } = await supabase
      .from('email_campaigns')
      .select('status, sent_at, opened_at, clicked_at');

    if (error) throw error;

    const stats = {
      total: campaigns.length,
      sent: campaigns.filter(c => c.status === 'sent').length,
      delivered: campaigns.filter(c => c.status === 'delivered').length,
      opened: campaigns.filter(c => c.opened_at).length,
      clicked: campaigns.filter(c => c.clicked_at).length,
      failed: campaigns.filter(c => c.status === 'failed').length
    };

    // Calculate rates
    stats.deliveryRate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;
    stats.openRate = stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0;
    stats.clickRate = stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0;

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error fetching email stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email statistics',
      details: error.message
    });
  }
});

/**
 * Send bulk emails to multiple influencers
 */
router.post('/send-bulk', async (req, res) => {
  try {
    const { influencers, subject, message } = req.body;

    if (!influencers || !Array.isArray(influencers) || influencers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No influencers provided'
      });
    }

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Subject and message are required'
      });
    }

    console.log(`📧 Starting bulk email campaign to ${influencers.length} influencers`);

    const results = {
      total: influencers.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    // Send emails to each influencer
    for (const influencer of influencers) {
      try {
        // Check if influencer has email
        if (!influencer.email) {
          results.failed++;
          results.errors.push({
            influencer: influencer.instagram_handle,
            error: 'No email address'
          });
          continue;
        }

        // Send email using email service
        const emailResult = await emailService.sendEmail({
          to: influencer.email,
          subject: subject,
          html: message,
          influencer: influencer
        });

        if (emailResult.success) {
          results.sent++;
          
          // Update influencer journey in database
          await supabase()
            .from('influencers')
            .update({
              journey_stage: 'reached_out',
              journey: {
                reached_out: true,
                reached_out_at: new Date().toISOString(),
                email_sent_at: new Date().toISOString()
              }
            })
            .eq('id', influencer.id);

          console.log(`✅ Email sent to ${influencer.instagram_handle}`);
        } else {
          results.failed++;
          results.errors.push({
            influencer: influencer.instagram_handle,
            error: emailResult.error || 'Unknown error'
          });
        }

        // Add small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error sending email to ${influencer.instagram_handle}:`, error);
        results.failed++;
        results.errors.push({
          influencer: influencer.instagram_handle,
          error: error.message
        });
      }
    }

    console.log(`📊 Bulk email campaign completed: ${results.sent} sent, ${results.failed} failed`);

    res.json({
      success: true,
      message: `Bulk email campaign completed: ${results.sent} sent, ${results.failed} failed`,
      results: results
    });

  } catch (error) {
    console.error('❌ Error in bulk email campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk emails',
      details: error.message
    });
  }
});

module.exports = router;
