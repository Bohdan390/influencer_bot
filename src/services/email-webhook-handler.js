const aiResponseHandler = require('./ai-response-handler');
const { influencers, emails } = require('./database');

class EmailWebhookHandler {
  constructor() {
    this.supportedProviders = ['brevo', 'sendgrid', 'mailgun'];
  }

  /**
   * Process incoming email webhook
   */
  async processWebhook(provider, webhookData) {
    const startTime = Date.now(); // ✨ Track processing time
    
    try {
      console.log(`📧 Processing ${provider} webhook`);
      
      const parsedEmail = await this.parseWebhookData(provider, webhookData);
      
      if (!parsedEmail) {
        console.log('⚠️ Unable to parse webhook data');
        return { success: false, reason: 'Unable to parse webhook data' };
      }

      // Find the influencer this response is from
      const influencer = await this.findInfluencerByEmail(parsedEmail.from_email);
      
      if (!influencer) {
        console.log(`⚠️ No influencer found for email: ${parsedEmail.from_email}`);
        return { success: false, reason: 'Influencer not found' };
      }

      console.log(`🎯 Processing response from ${influencer.instagram_handle}`);

      // ✨ Calculate response time if we have the last sent email
      const responseTime = await this.calculateResponseTime(influencer, parsedEmail.received_at);
      
      // Add to conversation thread for full context
      await influencers.addToConversation(influencer.id, {
        type: 'received',
        content: parsedEmail.content,
        subject: parsedEmail.subject,
        provider: provider,
        response_time_hours: responseTime?.hours || null
      });

      // Get campaign context with conversation history
      const campaignContext = await this.getCampaignContext(influencer);

      // ✨ Enhanced logging with response metrics
      await emails.logReceived({
        influencer_id: influencer.id,
        from_email: parsedEmail.from_email,
        subject: parsedEmail.subject,
        content: parsedEmail.content,
        webhook_provider: provider,
        received_at: new Date(),
        response_time_hours: responseTime?.hours || null,
        processing_started_at: new Date(startTime)
      });

      // Trigger AI analysis if configured
      if (aiResponseHandler.isConfigured()) {
        console.log(`🤖 Starting AI analysis for ${influencer.instagram_handle}...`);
        
        const aiDecision = await aiResponseHandler.analyzeResponse(
          parsedEmail.content,
          influencer,
          campaignContext
        );

        console.log(`🎯 AI Decision for ${influencer.instagram_handle}: ${aiDecision.action} (confidence: ${Math.round(aiDecision.confidence * 100)}%)`);
        
        // Send Slack notification for email response
        const slackService = require('./slack');
        await slackService.sendEmailResponseNotification(influencer, parsedEmail.content, aiDecision);
        
        // ✨ NEW: The AI decision has already been executed in analyzeResponse()
        // The executeDecision() is called automatically in the AI handler
        const processingTime = Date.now() - startTime;
        console.log(`✅ Automatic response processing completed for ${influencer.instagram_handle} in ${processingTime}ms`);
        
        // ✨ Track split test performance for responses
        await this.trackSplitTestPerformance(influencer, aiDecision, responseTime);
        
        return {
          success: true,
          influencer: influencer.instagram_handle,
          ai_decision: aiDecision.action,
          confidence: aiDecision.confidence,
          automatic_response_sent: true,
          processing_time_ms: processingTime,
          response_time_hours: responseTime?.hours || null
        };
      } else {
        // If no AI configured, add to manual review
        await influencers.update(influencer.id, {
          status: 'response_received',
          response_content: parsedEmail.content,
          needs_manual_review: true
        });

        console.log(`👥 Added ${influencer.instagram_handle} to manual review (no AI configured)`);
        
        return {
          success: true,
          influencer: influencer.instagram_handle,
          action: 'manual_review',
          reason: 'AI not configured'
        };
      }

    } catch (error) {
      console.error('❌ Webhook processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Parse webhook data based on provider
   */
  async parseWebhookData(provider, data) {
    try {
      switch (provider) {
        case 'brevo':
          return this.parseBrevoWebhook(data);
        case 'sendgrid':
          return this.parseSendGridWebhook(data);
        case 'mailgun':
          return this.parseMailgunWebhook(data);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Failed to parse ${provider} webhook:`, error);
      return null;
    }
  }

  /**
   * Parse Brevo webhook data
   */
  parseBrevoWebhook(data) {
    // Brevo inbound email webhook structure
    return {
      from_email: data.from?.email || data.sender?.email,
      subject: data.subject,
      content: data.body_plain || data.body_html || data.text,
      html_content: data.body_html,
      message_id: data.message_id,
      received_at: data.date ? new Date(data.date) : new Date()
    };
  }

  /**
   * Parse SendGrid webhook data  
   */
  parseSendGridWebhook(data) {
    // SendGrid inbound email webhook structure
    return {
      from_email: data.from,
      subject: data.subject,
      content: data.text || data.html,
      html_content: data.html,
      message_id: data.message_id,
      received_at: new Date()
    };
  }

  /**
   * Parse Mailgun webhook data
   */
  parseMailgunWebhook(data) {
    // Mailgun inbound email webhook structure
    return {
      from_email: data.sender,
      subject: data.subject,
      content: data['body-plain'] || data['body-html'],
      html_content: data['body-html'],
      message_id: data['Message-Id'],
      received_at: data.timestamp ? new Date(data.timestamp * 1000) : new Date()
    };
  }

  /**
   * Find influencer by email address
   */
  async findInfluencerByEmail(email) {
    if (!email) return null;

    try {
      const { getDb } = require('./database');
      const db = await getDb();
      
      // Search for influencer with this email
      const snapshot = await db.collection('influencers')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }

      // Also check for any variations or aliases
      const emailVariations = this.generateEmailVariations(email);
      
      for (const variation of emailVariations) {
        const varSnapshot = await db.collection('influencers')
          .where('email', '==', variation)
          .limit(1)
          .get();
          
        if (!varSnapshot.empty) {
          const doc = varSnapshot.docs[0];
          return { id: doc.id, ...doc.data() };
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding influencer by email:', error);
      return null;
    }
  }

  /**
   * Generate email variations for matching
   */
  generateEmailVariations(email) {
    const variations = [];
    const [localPart, domain] = email.toLowerCase().split('@');
    
    // Remove dots from Gmail addresses (gmail treats them the same)
    if (domain === 'gmail.com') {
      const noDots = localPart.replace(/\./g, '');
      variations.push(`${noDots}@${domain}`);
    }
    
    // Remove + aliases
    const withoutAlias = localPart.split('+')[0];
    variations.push(`${withoutAlias}@${domain}`);
    
    return variations;
  }

  /**
   * Get campaign context for influencer with conversation history
   */
  async getCampaignContext(influencer) {
    try {
      // Get email history
      const emailHistory = await emails.getByInfluencer(influencer.id);
      
      return {
        previous_emails: emailHistory.length,
        last_email_sent: emailHistory[0]?.sent_at,
        current_status: influencer.status,
        engagement_level: this.calculateEngagementLevel(influencer, emailHistory),
        campaign_stage: this.determineCampaignStage(influencer, emailHistory),
        conversation_history: influencer.conversation_thread || [],
        journey: {
          stage: influencer.journey_stage,
          discovered_at: influencer.journey_discovered_at,
          reached_out: influencer.journey_reached_out,
          responded: influencer.journey_responded,
          agreed_to_deal: influencer.journey_agreed_to_deal,
          tracking_number: influencer.journey_tracking_number,
          content_posted: influencer.journey_content_posted,
          post_url: influencer.journey_post_url
        },
        engagement_metrics: influencer.engagement_metrics || {}
      };
    } catch (error) {
      console.error('Error getting campaign context:', error);
      return {
        previous_emails: 0,
        current_status: influencer.status || 'unknown',
        conversation_history: [],
        journey: {},
        engagement_metrics: {}
      };
    }
  }

  /**
   * Calculate engagement level based on response history
   */
  calculateEngagementLevel(influencer, emailHistory) {
    const totalSent = emailHistory.filter(e => e.status === 'sent').length;
    const totalResponded = emailHistory.filter(e => e.responded).length;
    
    if (totalSent === 0) return 'new';
    
    const responseRate = totalResponded / totalSent;
    
    if (responseRate >= 0.8) return 'high';
    if (responseRate >= 0.5) return 'medium';
    if (responseRate >= 0.2) return 'low';
    return 'very_low';
  }

  /**
   * Determine current campaign stage
   */
  determineCampaignStage(influencer, emailHistory) {
    const lastEmail = emailHistory[0];
    
    if (!lastEmail) return 'initial';
    
    const stages = {
      'initial_outreach': 'outreach',
      'ask_for_address': 'address_collection',
      'ask_for_consent': 'consent_collection',
      'ask_for_both': 'information_collection',
      'order_shipped': 'product_shipped',
      'follow_up_1': 'follow_up',
      'follow_up_2': 'final_follow_up'
    };
    
    return stages[lastEmail.template_used] || 'unknown';
  }

  /**
   * Test webhook processing with sample data
   */
  async testWebhookProcessing(provider = 'brevo') {
    const sampleData = this.generateSampleWebhookData(provider);
    
    console.log(`🧪 Testing ${provider} webhook processing...`);
    
    const result = await this.processWebhook(provider, sampleData);
    
    console.log('Test result:', result);
    return result;
  }

  /**
   * Generate sample webhook data for testing
   */
  generateSampleWebhookData(provider) {
    const samples = {
      brevo: {
        from: { email: 'test.influencer@gmail.com' },
        subject: 'Re: Brand Ambassador Opportunity with Dermao IPL',
        body_plain: 'Hi! I\'m interested in your brand ambassador program. My shipping address is 123 Main St, New York, NY 10001. I\'d love to create content featuring your IPL device!',
        message_id: 'test-message-123',
        date: new Date().toISOString()
      },
      sendgrid: {
        from: 'test.influencer@gmail.com',
        subject: 'Re: Brand Ambassador Opportunity with Dermao IPL',
        text: 'Hi! I\'m interested in your brand ambassador program. My shipping address is 123 Main St, New York, NY 10001. I\'d love to create content featuring your IPL device!',
        message_id: 'test-message-123'
      },
      mailgun: {
        sender: 'test.influencer@gmail.com',
        subject: 'Re: Brand Ambassador Opportunity with Dermao IPL',
        'body-plain': 'Hi! I\'m interested in your brand ambassador program. My shipping address is 123 Main St, New York, NY 10001. I\'d love to create content featuring your IPL device!',
        'Message-Id': 'test-message-123',
        timestamp: Math.floor(Date.now() / 1000)
      }
    };
    
    return samples[provider] || samples.brevo;
  }

  /**
   * ✨ Calculate response time from last sent email
   */
  async calculateResponseTime(influencer, receivedAt) {
    try {
      const emails = require('./database').emails;
      const lastSentEmail = await emails.getLastSentByInfluencer(influencer.id);
      
      if (lastSentEmail && lastSentEmail.sent_at) {
        const sentTime = lastSentEmail.sent_at.toDate ? lastSentEmail.sent_at.toDate() : new Date(lastSentEmail.sent_at);
        const responseTime = receivedAt - sentTime;
        const hours = Math.round(responseTime / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal
        
        console.log(`⏱️ Response time: ${hours} hours for ${influencer.instagram_handle}`);
        
        return {
          hours: hours,
          milliseconds: responseTime,
          fast_response: hours < 2, // Less than 2 hours is considered fast
          slow_response: hours > 48 // More than 48 hours is considered slow
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error calculating response time:', error);
      return null;
    }
  }

  /**
   * ✨ Track split test performance for email responses
   */
  async trackSplitTestPerformance(influencer, aiDecision, responseTime) {
    try {
      // Check if this influencer is part of any active split tests
      if (influencer.split_test_id && influencer.variant_used) {
        const splitTestManager = require('./split-test-manager');
        
        // Track the response
        await splitTestManager.trackEmailPerformance(
          influencer.split_test_id,
          influencer.variant_used,
          influencer.id,
          'responded',
          {
            sentiment: aiDecision.sentiment,
            response_time_hours: responseTime?.hours
          }
        );

        // Track conversion events based on AI decision
        if (aiDecision.action === 'ship_product') {
          await splitTestManager.trackEmailPerformance(
            influencer.split_test_id,
            influencer.variant_used,
            influencer.id,
            'shipped'
          );
        }

        console.log(`📊 Tracked split test performance: ${influencer.split_test_id}:${influencer.variant_used} - response (${aiDecision.sentiment})`);
      }
    } catch (error) {
      console.error('Error tracking split test performance:', error);
    }
  }
}

module.exports = new EmailWebhookHandler(); 