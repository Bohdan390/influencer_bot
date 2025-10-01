// ✨ Instagram DM Automation Service
// Handles sending, reading, and responding to Instagram DMs with AI
// Uses real Instagram Private API via dm-throttling service

const { instagramDMVariants, dmHelpers } = require('../templates/instagram-dm-variants');
const splitTestManager = require('./split-test-manager');
const aiResponseHandler = require('./ai-response-handler');
const dmThrottlingService = require('./dm-throttling');
const { influencers } = require('./database');
const slackService = require('./slack');
const logger = require('../utils/logger');

class InstagramDMAutomation {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * 🔧 Initialize the service
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      logger.info('🔐 Initializing Instagram DM automation...');
      
      // Initialize dm-throttling service with real Instagram accounts
      await dmThrottlingService.initialize();
      
      this.isInitialized = true;
      logger.success('✅ Instagram DM automation initialized');
      
    } catch (error) {
      logger.error('❌ Failed to initialize Instagram DM automation:', error);
      throw error;
    }
  }

  /**
   * 📱 Send campaign DMs to multiple influencers
   */
  async sendCampaignDMs(influencers, template, productOffer, splitTestId = null) {
    try {
      // Ensure service is initialized
      await this.initialize();
      
      logger.info(`🚀 Starting Instagram DM campaign to ${influencers.length} influencers`);

      // ✨ Check for duplicates and previous outreach across all channels
      const { influencers: db } = require('./database');
      const handles = influencers.map(inf => inf.instagram_handle);
      
      const outreachCheck = await db.checkOutreachStatus(handles);
      const canContact = outreachCheck.filter(check => check.can_contact);
      const alreadyContacted = outreachCheck.filter(check => !check.can_contact);
      
      logger.info(`🚫 Duplicate prevention: ${canContact.length} can contact, ${alreadyContacted.length} already contacted`);
      
      let messagesSent = 0;
      let messagesQueued = 0;
      const results = [];
      const skipped = [];

      for (const influencer of influencers) {
        try {
          // Check if we can contact this influencer
          const contactCheck = outreachCheck.find(check => 
            check.handle.replace('@', '').toLowerCase() === influencer.instagram_handle.replace('@', '').toLowerCase()
          );
          
          if (!contactCheck?.can_contact) {
            skipped.push({
              influencer_id: influencer.id,
              instagram_handle: influencer.instagram_handle,
              reason: contactCheck?.was_contacted ? 'already_contacted' : 'exists_in_database',
              current_stage: contactCheck?.current_stage,
              last_contact: contactCheck?.last_contact,
              source_hashtags: contactCheck?.source_hashtags,
              previous_channel: contactCheck?.was_contacted ? 'email_or_dm' : 'discovered'
            });
            continue;
          }

          // Get split test variant if enabled
          let dmTemplate = template;
          let variantUsed = null;
          
          if (splitTestId) {
            const variant = splitTestManager.getVariantForInfluencer(splitTestId, influencer.id);
            if (variant) {
              dmTemplate = variant;
              variantUsed = variant;
            }
          }

          // Send DM via throttling service
          const result = await this.sendDM(influencer, dmTemplate, productOffer);
          
          if (result.success || result.queued) {
            if (result.success) messagesSent++;
            if (result.queued) messagesQueued++;
            
            // Track split test performance
            if (splitTestId && variantUsed) {
              await splitTestManager.trackDMPerformance(
                splitTestId,
                variantUsed.id,
                influencer.id,
                'sent',
                { template: dmTemplate }
              );
            }

            // Update influencer journey with DM sent
            await db.update(influencer.id, {
              journey_stage: 'dm_sent',
              journey_reached_out: true,
              journey_reached_out_at: new Date().toISOString(),
              dm_template: dmTemplate,
              split_test_id: splitTestId,
              variant_used: variantUsed?.name,
              dm_id: result.dm_id,
              dm_sent_count: (influencer.dm_sent_count || 0) + 1
            });

          }

          results.push({
            influencer_id: influencer.id,
            instagram_handle: influencer.instagram_handle,
            success: result.success,
            queued: result.queued,
            message: result.message,
            dm_id: result.dm_id
          });

        } catch (error) {
          logger.error(`Failed to send DM to ${influencer.instagram_handle}:`, error);
          results.push({
            influencer_id: influencer.id,
            instagram_handle: influencer.instagram_handle,
            success: false,
            error: error.message
          });
        }
      }

      // Send Slack notification
      await slackService.sendCampaignMilestone('dm_campaign_started', {
        total_influencers: influencers.length,
        messages_sent: messagesSent,
        messages_queued: messagesQueued,
        duplicates_skipped: skipped.length,
        template: template,
        split_test_active: !!splitTestId
      });

      logger.success(`📱 DM campaign completed: ${messagesSent} sent, ${messagesQueued} queued, ${skipped.length} duplicates skipped`);

      return {
        success: true,
        messagesSent,
        messagesQueued,
        totalTargeted: influencers.length,
        duplicatesSkipped: skipped.length,
        results,
        skipped_details: skipped
      };

    } catch (error) {
      logger.error('DM campaign failed:', error);
      throw error;
    }
  }

  /**
   * 📤 Send individual DM
   */
  async sendDM(influencer, template, productOffer) {
    try {
      // Ensure service is initialized
      await this.initialize();

      // Get or create DM template
      let dmTemplate;
      if (typeof template === 'string') {
        // Get template by ID
        dmTemplate = this.getTemplateById(template);
      } else {
        dmTemplate = template;
      }

      if (!dmTemplate) {
        throw new Error(`Template not found: ${template}`);
      }

      // Personalize the message
      const personalizedMessage = dmHelpers.personalizeDM(dmTemplate, {
        first_name: influencer.first_name || influencer.instagram_handle.replace('@', ''),
        instagram_handle: influencer.instagram_handle,
        follower_count: influencer.follower_count,
        recent_post_type: influencer.recent_post_type || 'content'
      });

      // Validate DM
      const validation = dmHelpers.validateDM(personalizedMessage, influencer);
      if (!validation.isValid) {
        logger.warn(`DM validation failed for ${influencer.instagram_handle}:`, validation.recommendations);
      }

      // Queue DM via throttling service
      const dmId = await dmThrottlingService.queueDM(
        influencer.instagram_handle,
        personalizedMessage,
        {
          campaign_id: influencer.campaign_id,
          influencer_id: influencer.id,
          priority: 'normal'
        }
      );

      // Store conversation in database
      await this.storeDMConversation(influencer.id, personalizedMessage, 'sent', dmId);

      logger.info(`📱 DM queued for ${influencer.instagram_handle} (ID: ${dmId})`);

      return {
        success: true,
        queued: true,
        dm_id: dmId,
        message: 'DM queued successfully'
      };

    } catch (error) {
      logger.error(`Failed to send DM to ${influencer.instagram_handle}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 📥 Check for new DM responses
   */
  async checkDMResponses() {
    try {
      // Ensure service is initialized
      await this.initialize();
      
      logger.info('📱 Checking for new Instagram DM responses...');

      // Get recent DMs from throttling service
      const recentDMs = await dmThrottlingService.checkDMResponses();
      
      let responsesProcessed = 0;

      for (const dm of recentDMs) {
        try {
          // Skip if we've already processed this DM
          if (await this.isDMProcessed(dm.message_id)) {
            continue;
          }

          // Find influencer by Instagram handle
          const influencer = await influencers.findByInstagramHandle(dm.from_username);
          if (!influencer) {
            logger.warn(`Received DM from unknown handle: ${dm.from_username}`);
            continue;
          }

          // Store the received DM
          await this.storeDMConversation(influencer.id, dm.message, 'received', dm.message_id);

          // Process response with AI
          await this.processAIResponse(influencer, dm);

          responsesProcessed++;

        } catch (error) {
          logger.error(`Failed to process DM from ${dm.from_username}:`, error);
        }
      }

      if (responsesProcessed > 0) {
        logger.success(`📱 Processed ${responsesProcessed} new DM responses`);
      }

      return {
        success: true,
        responsesProcessed
      };

    } catch (error) {
      logger.error('Failed to check DM responses:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🤖 Process AI response to DM
   */
  async processAIResponse(influencer, receivedDM) {
    try {
      // Analyze the response with AI
      const analysis = await aiResponseHandler.analyzeDMResponse(receivedDM.message, influencer);

      logger.info(`🤖 AI analysis for ${influencer.instagram_handle}: ${analysis.sentiment} (${analysis.intent})`);

      // Update influencer journey based on response
      if (analysis.sentiment === 'positive' && analysis.intent === 'interested') {
        await influencers.updateJourney(influencer.id, 'dm_responded_positive');
        
        // Send follow-up DM asking for shipping info
        await this.sendFollowUpDM(influencer, 'ask_for_shipping');

      } else if (analysis.sentiment === 'negative' || analysis.intent === 'not_interested') {
        await influencers.updateJourney(influencer.id, 'dm_responded_negative');
        
        // Mark as not interested and don't follow up
        await influencers.updateStatus(influencer.id, 'not_interested');

      } else if (analysis.intent === 'question' || analysis.intent === 'negotiation') {
        await influencers.updateJourney(influencer.id, 'dm_negotiating');
        
        // Handle specific questions/negotiations
        await this.handleNegotiation(influencer, receivedDM, analysis);

      } else if (analysis.intent === 'shipping_info') {
        // They provided shipping information
        await influencers.updateJourney(influencer.id, 'shipping_info_provided');
        await this.processShippingInfo(influencer, receivedDM.message);

      }

      // Track split test performance if applicable
      if (influencer.split_test_id) {
        await splitTestManager.trackDMPerformance(
          influencer.split_test_id,
          influencer.variant_used,
          influencer.id,
          'responded',
          analysis
        );
      }

      // Send Slack notification for important responses
      if (analysis.sentiment === 'positive' || analysis.intent === 'shipping_info') {
        await slackService.sendInfluencerUpdate(influencer, 'dm_positive_response', {
          message: receivedDM.message,
          analysis: analysis
        });
      }

    } catch (error) {
      logger.error(`Failed to process AI response for ${influencer.instagram_handle}:`, error);
    }
  }

  /**
   * 🤝 Handle negotiations and questions
   */
  async handleNegotiation(influencer, receivedDM, analysis) {
    try {
      let responseTemplate;

      if (analysis.topics.includes('shipping_cost')) {
        responseTemplate = instagramDMVariants.negotiation_dm_variants.variant_shipping_cost;
      } else if (analysis.topics.includes('timing')) {
        responseTemplate = instagramDMVariants.negotiation_dm_variants.variant_timing;
      } else if (analysis.topics.includes('payment') || analysis.topics.includes('money')) {
        responseTemplate = instagramDMVariants.negotiation_dm_variants.variant_payment_request;
      } else {
        // Generic helpful response
        responseTemplate = {
          message: `Great question! Let me clarify - this is a product collaboration where you receive our IPL device (worth $299) for free in exchange for one authentic post about your experience. No payment required, just genuine content! 

Any other questions I can answer? 💜`
        };
      }

      // Send the negotiation response
      await this.sendDM(influencer, responseTemplate, null);

      logger.info(`🤝 Sent negotiation response to ${influencer.instagram_handle} about: ${analysis.topics.join(', ')}`);

    } catch (error) {
      logger.error(`Failed to handle negotiation for ${influencer.instagram_handle}:`, error);
    }
  }

  /**
   * 📦 Process shipping information
   */
  async processShippingInfo(influencer, message) {
    try {
      // Extract shipping info with AI/regex
      const shippingInfo = await this.extractShippingInfo(message);

      if (shippingInfo.isComplete) {
        // Update influencer with shipping info
        await influencers.updateShippingInfo(influencer.id, shippingInfo);
        await influencers.updateJourney(influencer.id, 'ready_to_ship');

        // Send confirmation DM
        const confirmationDM = {
          message: `Perfect! Got your shipping info 📦

Your IPL device will ship within 24-48 hours and I'll send you tracking info as soon as it's on its way!

So excited for you to try it - the results are going to be amazing! 💜✨`
        };

        await this.sendDM(influencer, confirmationDM, null);

        // Notify Slack for manual shipping
        await slackService.sendShippingRequest(influencer, shippingInfo);

        logger.success(`📦 Shipping info collected for ${influencer.instagram_handle}`);

      } else {
        // Request missing information
        const missingFields = shippingInfo.missing || ['address', 'phone'];
        const followUpDM = {
          message: `Almost there! I just need a bit more info to ship your device:

${missingFields.includes('address') ? '📍 Complete address (street, city, state/country, zip)' : ''}
${missingFields.includes('phone') ? '📱 Phone number for shipping' : ''}

Once I have that, your IPL device will be on its way! 🚀`
        };

        await this.sendDM(influencer, followUpDM, null);
      }

    } catch (error) {
      logger.error(`Failed to process shipping info for ${influencer.instagram_handle}:`, error);
    }
  }

  /**
   * 📤 Send follow-up DM
   */
  async sendFollowUpDM(influencer, followUpType) {
    try {
      let template;

      switch (followUpType) {
        case 'ask_for_shipping':
          // Get appropriate response variant
          template = splitTestManager.getResponseVariant(influencer.split_test_id) || 
                    instagramDMVariants.response_dm_variants.variant_a_excited;
          break;

        case 'shipping_confirmation':
          template = {
            message: `Your IPL device is on its way! 📦✨

Tracking: {{tracking_number}}

Can't wait to see your results! Once you've had time to test it, would love to see your experience shared with your followers 💜

No rush at all - take your time and create something authentic! 🤍`
          };
          break;

        case 'post_reminder':
          template = {
            message: `Hey {{first_name}}! Hope you're loving your IPL device! 💜

Just a gentle reminder - if you've had a chance to test it out, we'd love to see your experience shared with your followers when you're ready!

No pressure at all, just excited to see your results ✨`
          };
          break;
      }

      if (template) {
        await this.sendDM(influencer, template, null);
        logger.info(`📤 Sent ${followUpType} follow-up to ${influencer.instagram_handle}`);
      }

    } catch (error) {
      logger.error(`Failed to send follow-up DM to ${influencer.instagram_handle}:`, error);
    }
  }

  /**
   * 📊 Get DM campaign statistics
   */
  async getDMStats() {
    try {
      const stats = await influencers.getDMStats();
      const throttlingStats = dmThrottlingService.getStats();
      
      return {
        campaign_stats: {
          total_dms_sent: stats.dm_sent || 0,
          responses_received: stats.dm_responded || 0,
          response_rate: stats.dm_sent ? ((stats.dm_responded / stats.dm_sent) * 100).toFixed(1) : 0,
          positive_responses: stats.dm_responded_positive || 0,
          shipping_info_collected: stats.shipping_info_provided || 0,
          conversion_rate: stats.dm_sent ? ((stats.shipping_info_provided / stats.dm_sent) * 100).toFixed(1) : 0
        },
        throttling_stats: throttlingStats
      };
    } catch (error) {
      logger.error('Failed to get DM stats:', error);
      return { error: error.message };
    }
  }

  // =============================================================================
  // 🔧 HELPER METHODS
  // =============================================================================

  /**
   * 📋 Get template by ID
   */
  getTemplateById(templateId) {
    const allVariants = {
      ...instagramDMVariants.initial_dm_variants,
      ...instagramDMVariants.follow_up_dm_variants,
      ...instagramDMVariants.response_dm_variants,
      ...instagramDMVariants.negotiation_dm_variants
    };

    return Object.values(allVariants).find(variant => variant.id === templateId) || null;
  }

  /**
   * 💾 Store DM conversation
   */
  async storeDMConversation(influencerId, message, type, dmId = null) {
    try {
      const { db } = require('./database');
      
      await db.collection('dm_conversations').add({
        influencer_id: influencerId,
        message: message,
        type: type, // 'sent' or 'received'
        dm_id: dmId,
        timestamp: new Date(),
        processed: type === 'sent' // Sent messages are already processed
      });

    } catch (error) {
      logger.error('Failed to store DM conversation:', error);
    }
  }

  /**
   * ✅ Check if DM is already processed
   */
  async isDMProcessed(dmId) {
    try {
      const { db } = require('./database');
      
      const doc = await db.collection('dm_conversations')
        .where('dm_id', '==', dmId)
        .where('processed', '==', true)
        .limit(1)
        .get();

      return !doc.empty;

    } catch (error) {
      logger.error('Failed to check DM processed status:', error);
      return false;
    }
  }

  /**
   * 🚢 Extract shipping information from message
   */
  async extractShippingInfo(message) {
    // TODO: Implement AI-powered shipping info extraction
    // For now, basic regex patterns
    
    const addressPattern = /(?:address|ship|send).+/i;
    const phonePattern = /(?:phone|tel|mobile).+?(\+?[\d\s\-\(\)]{10,})/i;
    
    const hasAddress = addressPattern.test(message);
    const phoneMatch = message.match(phonePattern);
    
    return {
      isComplete: hasAddress && phoneMatch,
      address: hasAddress ? message.match(addressPattern)?.[0] : null,
      phone: phoneMatch?.[1] || null,
      missing: [
        ...(!hasAddress ? ['address'] : []),
        ...(!phoneMatch ? ['phone'] : [])
      ]
    };
  }
}

module.exports = new InstagramDMAutomation(); 