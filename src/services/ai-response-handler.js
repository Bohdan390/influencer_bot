const axios = require('axios');
const { influencers, emails } = require('./database');
const emailService = require('./email');
const shopifyService = require('./shopify');

class AIResponseHandler {
  constructor() {
    // Support for multiple AI providers with Gemini as preferred
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.aiProvider = process.env.AI_PROVIDER || 'gemini'; // 'gemini', 'openai', or 'claude'
    this.emailService = require('./email');
    this.shopifyService = require('./shopify');
    this.influencers = require('./database').influencers;
    
    // ✨ NEW: Split testing integration
    this.splitTestManager = require('./split-test-manager');
    this.emailVariants = require('../templates/email-variants');
    
    // Provider fallback order
    this.providerFallback = ['gemini', 'openai', 'claude'];
  }

  /**
   * Analyze email response and determine next action
   */
  async analyzeResponse(emailContent, influencerData, campaignContext) {
    try {
      console.log(`🤖 Analyzing email response from ${influencerData.instagram_handle}`);
      
      const analysisPrompt = this.buildAnalysisPrompt(emailContent, influencerData, campaignContext);
      const aiResponse = await this.callAI(analysisPrompt);
      
      const decision = this.parseAIResponse(aiResponse);
      
      console.log(`🎯 AI Decision: ${decision.action} for ${influencerData.instagram_handle}`);
      
      // Execute the decision
      await this.executeDecision(decision, influencerData, emailContent);
      
      return decision;
      
    } catch (error) {
      console.error('❌ AI Response analysis failed:', error);
      // Fallback to manual review
      return {
        action: 'manual_review',
        confidence: 0,
        reason: 'AI analysis failed - requires manual review',
        next_steps: ['Add to manual review queue']
      };
    }
  }

  /**
   * Build analysis prompt for AI with full conversation context
   */
  buildAnalysisPrompt(emailContent, influencerData, campaignContext) {
    const conversationHistory = campaignContext.conversation_history || [];
    const historyText = conversationHistory.length > 0 
      ? conversationHistory.map(msg => `${msg.type.toUpperCase()}: ${msg.content.substring(0, 200)}...`).join('\n')
      : 'No previous conversation history';

    return `
You are an AI assistant for Cosara's influencer marketing campaign. Analyze this email response and decide the next action based on full conversation context.

INFLUENCER PROFILE:
- Handle: ${influencerData.instagram_handle}
- Followers: ${influencerData.follower_count || 'Unknown'}
- Email: ${influencerData.email}
- Current Status: ${influencerData.status || 'contacted'}
- Previous Interactions: ${campaignContext.previous_emails || 0}
- Engagement Level: ${campaignContext.engagement_level || 'new'}
- Campaign Stage: ${campaignContext.campaign_stage || 'initial'}

CONVERSATION HISTORY:
${historyText}

LATEST EMAIL RESPONSE:
"${emailContent}"

CAMPAIGN CONTEXT:
- We offer free IPL hair laser device ($299 value) for content creation
- Need shipping address + content creation agreement
- Only ship to US, UK, Australia
- Looking for authentic content, not just product placement

ANALYZE FOR:
1. Response sentiment (positive/negative/neutral/confused)
2. Intent (interested/not interested/wants more info/asking for payment)
3. Shipping address provided (yes/no/partial)
4. Content creation agreement (yes/no/unclear)
5. Geographic eligibility (US/UK/AU or other)
6. Red flags (spam/fake/unrealistic demands)

POSSIBLE ACTIONS:
- ship_product: They provided address + agreed to create content
- ask_for_address: Interested but missing shipping address
- ask_for_consent: Has address but unclear on content agreement
- ask_for_both: Interested but missing both address and agreement
- payment_discussion: They want upfront payment (explain our model)
- non_target_country: They're outside US/UK/AU
- polite_decline: Not a good fit/red flags detected
- follow_up_later: Need more time/unclear response
- manual_review: Complex response requiring human review

Respond with JSON:
{
  "action": "ship_product|ask_for_address|ask_for_consent|ask_for_both|payment_discussion|non_target_country|polite_decline|follow_up_later|manual_review",
  "confidence": 0.0-1.0,
  "sentiment": "positive|negative|neutral|confused",
  "intent": "interested|not_interested|wants_info|wants_payment|unclear",
  "has_address": true|false,
  "has_consent": true|false,
  "country_detected": "US|UK|AU|other|unknown",
  "red_flags": ["flag1", "flag2"],
  "reason": "Brief explanation of decision",
  "extracted_data": {
    "shipping_address": "if provided",
    "preferred_content_type": "if mentioned",
    "special_requests": "any specific asks"
  },
  "next_steps": ["step1", "step2"]
}
`;
  }

  /**
   * Call AI service for analysis
   */
  async callAI(prompt) {
    try {
      if (this.aiProvider === 'gemini') {
        return await this.callGemini(prompt);
      } else if (this.aiProvider === 'openai') {
        return await this.callOpenAI(prompt);
      } else if (this.aiProvider === 'claude') {
        return await this.callClaude(prompt);
      } else {
        throw new Error('No AI provider configured');
      }
    } catch (error) {
      console.warn('⚠️ AI service unavailable, using fallback template system');
      return this.generateFallbackResponse(prompt);
    }
  }

  /**
   * Generate fallback response when AI services are unavailable
   */
  generateFallbackResponse(prompt) {
    // Simple template-based fallback for common prompts
    if (prompt.includes('personalized outreach') || prompt.includes('outreach')) {
      return JSON.stringify({
        subject: "Exciting Partnership Opportunity with Cosara!",
        html: `
          <p>Hi there!</p>
          <p>I hope this message finds you well! I'm reaching out from Cosara, and I'm excited to share an amazing partnership opportunity with you.</p>
          <p>We're offering influencers like yourself a free Cosara IPL Hair Laser device (valued at $299) in exchange for authentic content creation. This revolutionary at-home hair removal device delivers professional salon results.</p>
          <p>What we're looking for:</p>
          <ul>
            <li>Authentic content showcasing the device</li>
            <li>Honest reviews and testimonials</li>
            <li>Engagement with your audience about the product</li>
          </ul>
          <p>If you're interested, please let me know and I'll provide more details about the partnership!</p>
          <p>Best regards,<br>Cosara Partnership Team</p>
        `,
        text: `
          Hi there!
          
          I hope this message finds you well! I'm reaching out from Cosara, and I'm excited to share an amazing partnership opportunity with you.
          
          We're offering influencers like yourself a free Cosara IPL Hair Laser device (valued at $299) in exchange for authentic content creation. This revolutionary at-home hair removal device delivers professional salon results.
          
          What we're looking for:
          - Authentic content showcasing the device
          - Honest reviews and testimonials
          - Engagement with your audience about the product
          
          If you're interested, please let me know and I'll provide more details about the partnership!
          
          Best regards,
          Cosara Partnership Team
        `
      });
    }
    
    // Default fallback response
    return JSON.stringify({
      action: 'follow_up_later',
      confidence: 0.5,
      reason: 'AI service unavailable - using fallback template',
      next_steps: ['Schedule manual follow-up']
    });
  }

  /**
   * Call Google Gemini API
   */
  async callGemini(prompt) {
    try {
      console.log('🔑 Using Gemini API key:', this.geminiApiKey ? 'Present' : 'Missing');
      
      if (!this.geminiApiKey) {
        throw new Error('Gemini API key is not configured');
      }

      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${this.geminiApiKey}`, {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('✅ Gemini API call successful');
      return response.data.candidates[0].content.parts[0].text;
      
    } catch (error) {
      console.error('❌ Gemini API call failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data
      });
      
      if (error.response?.status === 404) {
        throw new Error('Gemini API endpoint not found. Please check the API configuration.');
      } else if (error.response?.status === 401) {
        throw new Error('Gemini API key is invalid or expired.');
      } else if (error.response?.status === 429) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Gemini API error: ${error.message}`);
      }
    }
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(prompt) {
    try {
      console.log('🔑 Using OpenAI API key:', this.openaiApiKey);
      console.log(prompt)
      
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key is not configured');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
               prompt
            },
            {
              role: "user",
              content: prompt
            }
          ]
        }),
      });

      const data = await response.json();
      const message = data.choices[0].message.content
      console.log('✅ OpenAI API call successful', message);
      return message;
      
    } catch (error) {
      console.error('❌ OpenAI API call failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data
      });
      
      if (error.response?.status === 404) {
        throw new Error('OpenAI API endpoint not found. Please check the API configuration.');
      } else if (error.response?.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.');
      } else if (error.response?.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
    }
  }

  /**
   * Call Claude API (if using Anthropic)
   */
  async callClaude(prompt) {
    try {
      console.log('🔑 Using Claude API key:', this.openaiApiKey ? 'Present' : 'Missing');
      
      if (!this.openaiApiKey) {
        throw new Error('Claude API key is not configured');
      }

      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-sonnet-20240229',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }, {
        headers: {
          'x-api-key': this.openaiApiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('✅ Claude API call successful');
      return response.data.content[0].text;
      
    } catch (error) {
      console.error('❌ Claude API call failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data
      });
      
      if (error.response?.status === 404) {
        throw new Error('Claude API endpoint not found. Please check the API configuration.');
      } else if (error.response?.status === 401) {
        throw new Error('Claude API key is invalid or expired.');
      } else if (error.response?.status === 429) {
        throw new Error('Claude API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Claude API error: ${error.message}`);
      }
    }
  }

  /**
   * Parse AI response JSON
   */
  parseAIResponse(aiResponse) {
    try {
      // Extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return JSON.parse(aiResponse);
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  /**
   * Execute the AI decision
   */
  async executeDecision(decision, influencerData, originalEmail) {
    const actions = {
      ship_product: () => this.processShipment(decision, influencerData),
      ask_for_address: () => this.sendFollowUpEmail('ask_for_address', influencerData, decision),
      ask_for_consent: () => this.sendFollowUpEmail('ask_for_consent', influencerData, decision),
      ask_for_both: () => this.sendFollowUpEmail('ask_for_both', influencerData, decision),
      payment_discussion: () => this.sendFollowUpEmail('payment_inquiry', influencerData, decision),
      non_target_country: () => this.sendFollowUpEmail('non_target_country', influencerData, decision),
      polite_decline: () => this.updateInfluencerStatus(influencerData, 'declined', decision.reason),
      follow_up_later: () => this.scheduleFollowUp(influencerData, decision),
      manual_review: () => this.addToManualReview(influencerData, originalEmail, decision)
    };

    const actionFunction = actions[decision.action];
    if (actionFunction) {
      await actionFunction();
    } else {
      console.error(`Unknown action: ${decision.action}`);
    }

    // Update influencer record with AI analysis
    await this.updateInfluencerWithAIAnalysis(influencerData, decision, originalEmail);
  }

  /**
   * Process product shipment with geo-verification
   */
  async processShipment(decision, influencerData) {
    try {
      console.log(`📦 Processing shipment for ${influencerData.instagram_handle}`);
      
      const shippingAddress = decision.extracted_data?.shipping_address;
      if (!shippingAddress) {
        throw new Error('Shipping address not found in AI analysis');
      }

      // 🌍 NEW: Geo-verification before shipment
      const geoVerification = require('./geo-verification');
      const verification = await geoVerification.preShipmentVerification(influencerData, shippingAddress);
      
      if (!verification.approved) {
        console.log(`⚠️ Geo-verification failed for ${influencerData.instagram_handle}: ${verification.recommendation}`);
        
        if (verification.recommendation === 'reject') {
          await this.sendFollowUpEmail('non_target_country', influencerData, decision);
          await influencers.update(influencerData.id, {
            status: 'geo_rejected',
            geo_verification: verification,
            ai_processed: true
          });
          return;
        } else {
          // Send to manual review for borderline cases
          await this.addToManualReview(influencerData, `Geo-verification: ${verification.recommendation}`, {
            ...decision,
            geo_verification: verification
          });
          return;
        }
      }

      console.log(`✅ Geo-verification passed for ${influencerData.instagram_handle} (${verification.country})`);

      // Create Shopify order
      const order = await shopifyService.createOrder({
        influencer: influencerData,
        address: shippingAddress,
        product_value: 299,
        discount_code: `INFLUENCER_${influencerData.instagram_handle.replace('@', '').toUpperCase()}`
      });

      // Send order confirmation email
      await this.sendFollowUpEmail('order_shipped', influencerData, {
        ...decision,
        order_id: order.id,
        tracking_number: order.tracking_number
      });

      // Update influencer status
      await influencers.update(influencerData.id, {
        status: 'product_shipped',
        order_id: order.id,
        shipping_address: shippingAddress,
        agreement_confirmed: true,
        ai_processed: true,
        geo_verification: verification
      });

      // Update journey milestones
      await influencers.updateJourney(influencerData.id, 'responded');
      await influencers.updateJourney(influencerData.id, 'agreed_to_deal');
      await influencers.updateJourney(influencerData.id, 'shipping_address_provided');
      await influencers.updateJourney(influencerData.id, 'product_shipped', {
        tracking_number: order.tracking_number,
        order_id: order.id
      });

      // 📸 NEW: Start post monitoring
      const postDetection = require('./post-detection');
      await postDetection.startMonitoring(influencerData, {
        campaign_id: decision.campaign_id,
        product_shipped_date: new Date(),
        expected_post_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      console.log(`✅ Shipment processed for ${influencerData.instagram_handle}`);
      
    } catch (error) {
      console.error('❌ Shipment processing failed:', error);
      // Fall back to manual review
      await this.addToManualReview(influencerData, 'Shipment processing failed', decision);
    }
  }

  /**
   * Send follow-up email based on AI decision (with split testing)
   */
  async sendFollowUpEmail(templateType, influencerData, decision) {
    try {
      // ✨ NEW: Check for active split tests
      const activeTests = this.splitTestManager.getActiveTests();
      let template = null;
      let variantUsed = null;
      let splitTestId = null;

      // Find relevant split test for this template type
      const relevantTest = activeTests.find(test => {
        return (test.type === 'response' && templateType.startsWith('ask_for')) ||
               (test.type === 'follow_up' && templateType.startsWith('follow_up'));
      });

      if (relevantTest) {
        // Get variant from split test
        const variant = this.splitTestManager.getVariantForInfluencer(relevantTest.id, influencerData.id);
        
        if (variant) {
          template = variant;
          variantUsed = variant;
          splitTestId = relevantTest.id;
          console.log(`🧪 Using split test variant: ${variant.name} for ${influencerData.instagram_handle}`);
        }
      }

      // Fallback to regular template if no split test variant
      if (!template) {
        template = this.emailService.getTemplate(templateType);
        if (!template) {
          throw new Error(`Template ${templateType} not found`);
        }
      }

      const emailData = {
        first_name: influencerData.first_name || influencerData.full_name?.split(' ')[0] || 'there',
        influencer_name: influencerData.full_name || influencerData.instagram_handle,
        influencer_handle: influencerData.instagram_handle,
        follower_count: influencerData.follower_count,
        template: templateType,
        influencer_id: influencerData.id,
        ai_generated: true,
        ai_confidence: decision.confidence,
        split_test_id: splitTestId,
        variant_id: variantUsed?.id || null,
        ...decision.extracted_data
      };

      await this.emailService.sendEmail(
        influencerData.email,
        template.subject,
        template.html,
        emailData
      );

      // ✨ Track split test performance
      if (splitTestId && variantUsed) {
        await this.splitTestManager.trackEmailPerformance(
          splitTestId,
          variantUsed.id,
          influencerData.id,
          'sent'
        );
      }

      // Update influencer status
      await this.influencers.update(influencerData.id, {
        status: `awaiting_${templateType.replace('ask_for_', '')}`,
        last_email_template: templateType,
        ai_processed: true,
        ai_confidence: decision.confidence,
        split_test_id: splitTestId,
        variant_used: variantUsed?.id || null
      });

      // Update journey milestones based on template type
      await this.influencers.updateJourney(influencerData.id, 'responded');
      
      if (templateType === 'ask_for_address') {
        await this.influencers.updateJourney(influencerData.id, 'agreed_to_deal');
      }

      console.log(`📧 Sent ${templateType} email to ${influencerData.instagram_handle}${splitTestId ? ` (Split Test: ${variantUsed.name})` : ''}`);
      
    } catch (error) {
      console.error(`❌ Failed to send ${templateType} email:`, error);
    }
  }

  /**
   * Update influencer status
   */
  async updateInfluencerStatus(influencerData, status, reason) {
    await influencers.update(influencerData.id, {
      status: status,
      status_reason: reason,
      ai_processed: true,
      updated_at: new Date()
    });
  }

  /**
   * Schedule follow-up for later
   */
  async scheduleFollowUp(influencerData, decision) {
    const followUpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    await influencers.update(influencerData.id, {
      status: 'follow_up_scheduled',
      follow_up_date: followUpDate,
      ai_processed: true,
      ai_reason: decision.reason
    });
  }

  /**
   * Add to manual review queue
   */
  async addToManualReview(influencerData, originalEmail, decision) {
    await influencers.update(influencerData.id, {
      status: 'manual_review_required',
      review_reason: decision.reason,
      review_priority: decision.confidence < 0.5 ? 'high' : 'medium',
      original_response: originalEmail,
      ai_analysis: JSON.stringify(decision),
      ai_processed: true
    });

    console.log(`👥 Added ${influencerData.instagram_handle} to manual review queue`);
  }

  /**
   * Update influencer with AI analysis results
   */
  async updateInfluencerWithAIAnalysis(influencerData, decision, originalEmail) {
    await influencers.update(influencerData.id, {
      ai_sentiment: decision.sentiment,
      ai_intent: decision.intent,
      ai_confidence: decision.confidence,
      ai_decision: decision.action,
      ai_analysis_date: new Date(),
      response_analyzed: true,
      last_response: originalEmail.substring(0, 500) // Store first 500 chars
    });
  }

  /**
   * Check if AI is configured
   */
  isConfigured() {
    if (this.aiProvider === 'gemini') {
      return !!this.geminiApiKey;
    } else if (this.aiProvider === 'openai') {
      return !!this.openaiApiKey;
    } else if (this.aiProvider === 'claude') {
      return !!this.openaiApiKey; // Claude uses same key as OpenAI for now
    }
    return false;
  }

  /**
   * Bulk analyze multiple responses
   */
  async bulkAnalyzeResponses(responses) {
    console.log(`🤖 Starting bulk AI analysis for ${responses.length} responses`);
    
    const results = [];
    
    for (const response of responses) {
      try {
        const decision = await this.analyzeResponse(
          response.email_content,
          response.influencer_data,
          response.campaign_context
        );
        
        results.push({
          influencer_id: response.influencer_data.id,
          decision: decision,
          status: 'processed'
        });
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error analyzing response from ${response.influencer_data.instagram_handle}:`, error);
        results.push({
          influencer_id: response.influencer_data.id,
          decision: null,
          status: 'error',
          error: error.message
        });
      }
    }
    
    console.log(`✅ Bulk AI analysis completed. Processed ${results.filter(r => r.status === 'processed').length} responses`);
    return results;
  }

  /**
   * Generate personalized outreach email content using AI
   */
  async generatePersonalizedOutreach(influencerData, campaignSettings) {
    try {
      console.log(`🤖 Generating personalized outreach for ${influencerData.instagram_handle}`);
      
      const prompt = this.buildOutreachPrompt(influencerData, campaignSettings);
      const aiResponse = await this.callAI(prompt);
      
      const emailContent = this.parseOutreachResponse(aiResponse);
      
      console.log(`✅ Generated personalized outreach for ${influencerData.instagram_handle}`);
      
      return emailContent;
      
    } catch (error) {
      console.error('❌ Personalized outreach generation failed:', error);
      // Fallback to template
      return this.getFallbackTemplate(influencerData, campaignSettings);
    }
  }

  /**
   * Build outreach prompt for AI
   */
  buildOutreachPrompt(influencerData, campaignSettings) {
    const { template, productOffer, brandName, campaignType } = campaignSettings;
    
    return `
You are writing a personalized outreach email for ${brandName}'s influencer marketing campaign.

INFLUENCER PROFILE:
- Handle: @${influencerData.instagram_handle}
- Name: ${influencerData.name || influencerData.instagram_handle}
- Followers: ${influencerData.followers_count?.toLocaleString() || 'Unknown'}
- Bio: ${influencerData.bio || 'No bio available'}
- Verified: ${influencerData.is_verified ? 'Yes' : 'No'}
- Engagement Rate: ${influencerData.engagement_rate || 'Unknown'}%

CAMPAIGN DETAILS:
- Brand: ${brandName}
- Product: ${productOffer}
- Campaign Type: ${campaignType}
- Template Style: ${template}

BRAND VOICE & GUIDELINES:
- Professional but friendly and approachable
- Focus on mutual value and authentic partnership
- Highlight the product's benefits and innovation
- Emphasize free product offer (no upfront payment required)
- Clear next steps and expectations
- Mention shipping to US, UK, Australia only

PERSONALIZATION REQUIREMENTS:
1. Use their actual name/handle appropriately
2. Reference their follower count if substantial
3. Mention specific audience alignment if clear from bio
4. Professional subject line (40 chars max)
5. Email body (150-200 words)
6. Clear call-to-action
7. Professional signature

Write a compelling outreach email that feels personal and authentic. Avoid generic language.

Respond with JSON:
{
  "subject": "Personalized subject line under 40 characters",
  "html": "Full HTML formatted email with proper styling",
  "text": "Plain text version of the email",
  "personalization_notes": "What made this email personal to this influencer"
}
`;
  }

  /**
   * Parse AI outreach response
   */
  parseOutreachResponse(aiResponse) {
    try {
      // Clean the response to extract JSON
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      // Validate required fields
      if (!parsed.subject || !parsed.html || !parsed.text) {
        throw new Error('Missing required email fields');
      }
      
      return {
        subject: parsed.subject,
        html: parsed.html,
        text: parsed.text,
        personalization_notes: parsed.personalization_notes || 'AI-generated personalized content'
      };
      
    } catch (error) {
      console.error('❌ Failed to parse AI outreach response:', error);
      throw error;
    }
  }

  /**
   * Fallback template when AI generation fails
   */
  getFallbackTemplate(influencerData, campaignSettings) {
    const { productOffer, brandName } = campaignSettings;
    const name = influencerData.full_name || influencerData.instagram_handle;
    
    return {
      subject: `Partnership Opportunity with ${brandName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6B46C1;">Hi ${name}!</h2>
          
          <p>I hope this email finds you well! I came across your Instagram (@${influencerData.instagram_handle}) and was really impressed by your content and engaged audience${influencerData.followers_count ? ` of ${influencerData.followers_count.toLocaleString()} followers` : ''}.</p>
          
          <p>I'm reaching out from <strong>${brandName}</strong> because we'd love to collaborate with you on an exciting partnership opportunity featuring our <strong>${productOffer}</strong>.</p>
          
          <p><strong>What we're offering:</strong></p>
          <ul>
            <li>Free ${productOffer} (valued at $299)</li>
            <li>No upfront payment required from you</li>
            <li>Simple content creation agreement</li>
            <li>Full product support and guidance</li>
          </ul>
          
          <p>We're currently shipping to the US, UK, and Australia. If you're interested in learning more about this collaboration, I'd love to send you more details!</p>
          
          <p>Looking forward to hearing from you!</p>
          
          <p>Best regards,<br>
          <strong>Cosara Partnership Team</strong><br>
          partnership@cosara.com</p>
        </div>
      `,
      text: `Hi ${name}!

I hope this email finds you well! I came across your Instagram (@${influencerData.instagram_handle}) and was really impressed by your content and engaged audience${influencerData.followers_count ? ` of ${influencerData.followers_count.toLocaleString()} followers` : ''}.

I'm reaching out from ${brandName} because we'd love to collaborate with you on an exciting partnership opportunity featuring our ${productOffer}.

What we're offering:
- Free ${productOffer} (valued at $299)
- No upfront payment required from you
- Simple content creation agreement
- Full product support and guidance

We're currently shipping to the US, UK, and Australia. If you're interested in learning more about this collaboration, I'd love to send you more details!

Looking forward to hearing from you!

Best regards,
Cosara Partnership Team
partnership@cosara.com`,
      personalization_notes: 'Fallback template with basic personalization'
    };
  }

  /**
   * Generate bulk outreach message for multiple influencers
   */
  async generateBulkOutreach(influencers, campaignSettings) {
    try {
      console.log(`🤖 Generating bulk outreach for ${influencers.length} influencers`);
      
      const prompt = this.buildBulkOutreachPrompt(influencers, campaignSettings);
      const aiResponse = await this.callAI(prompt);
      
      const emailContent = this.parseOutreachResponse(aiResponse);
      
      console.log(`✅ Generated bulk outreach for ${influencers.length} influencers`);
      
      return emailContent;
      
    } catch (error) {
      console.error('❌ Bulk outreach generation failed:', error);
      // Fallback to template
      return this.getBulkFallbackTemplate(influencers, campaignSettings);
    }
  }

  /**
   * Build bulk outreach prompt for AI
   */
  buildBulkOutreachPrompt(influencers, campaignSettings) {
    const { template, productOffer, brandName, campaignType } = campaignSettings;
    
    // Create a summary of influencers for the AI
    const influencerSummary = influencers.slice(0, 10).map(inf => 
      `- @${inf.instagram_handle} (${inf.followers_count?.toLocaleString() || 'Unknown'} followers)`
    ).join('\n');
    
    const totalInfluencers = influencers.length;
    const avgFollowers = Math.round(
      influencers.reduce((sum, inf) => sum + (inf.followers_count || 0), 0) / totalInfluencers
    );
    
    return `
You are writing a bulk outreach email for ${brandName}'s influencer marketing campaign that will be sent to ${totalInfluencers} influencers.

INFLUENCER SUMMARY:
${influencerSummary}
${totalInfluencers > 10 ? `... and ${totalInfluencers - 10} more influencers` : ''}

STATISTICS:
- Total Influencers: ${totalInfluencers}
- Average Followers: ${avgFollowers.toLocaleString()}
- Campaign Type: ${campaignType}

CAMPAIGN DETAILS:
- Brand: ${brandName}
- Product: ${productOffer}
- Template Style: ${template}

BRAND VOICE & GUIDELINES:
- Professional but friendly and approachable
- Focus on mutual value and authentic partnership
- Highlight the product's benefits and innovation
- Emphasize free product offer (no upfront payment required)
- Clear next steps and expectations
- Mention shipping to US, UK, Australia only
- Generic enough to work for diverse influencer types
- Personal but not overly specific to any one influencer

BULK EMAIL REQUIREMENTS:
1. Professional subject line (40 chars max)
2. Email body (200-250 words)
3. Generic greeting that works for all
4. Clear value proposition
5. Simple call-to-action
6. Professional signature
7. Avoid specific follower counts or personal details

Write a compelling bulk outreach email that feels professional and valuable to all recipients.

Respond with JSON:
{
  "subject": "Professional subject line under 40 characters",
  "html": "Full HTML formatted email with proper styling",
  "text": "Plain text version of the email",
  "personalization_notes": "Bulk email optimized for ${totalInfluencers} diverse influencers"
}
`;
  }

  /**
   * Get fallback template for bulk outreach
   */
  getBulkFallbackTemplate(influencers, campaignSettings) {
    const { productOffer, brandName } = campaignSettings;
    
    return {
      subject: `Partnership Opportunity - ${brandName}`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Partnership Opportunity with ${brandName}</h2>
  
  <p>Hello,</p>
  
  <p>We hope this message finds you well! We're reaching out from ${brandName} because we believe your content would be a perfect fit for our brand.</p>
  
  <p>We'd love to offer you a <strong>free ${productOffer}</strong> (valued at $299) in exchange for authentic content creation. This is a no-strings-attached partnership - no upfront payment required from you.</p>
  
  <p><strong>What we're looking for:</strong></p>
  <ul>
    <li>Honest review and demonstration of our product</li>
    <li>Content that showcases the product's benefits</li>
    <li>Tagging @${brandName.toLowerCase()} in your posts</li>
  </ul>
  
  <p><strong>What you get:</strong></p>
  <ul>
    <li>Free ${productOffer} (worth $299)</li>
    <li>No upfront payment required</li>
    <li>Flexible content timeline</li>
    <li>Potential for ongoing partnership</li>
  </ul>
  
  <p>We ship to the US, UK, and Australia. If you're interested, please reply with your shipping address and we'll get the product sent out right away!</p>
  
  <p>Looking forward to working with you!</p>
  
  <p>Best regards,<br>
  ${brandName} Partnership Team<br>
  partnership@${brandName.toLowerCase()}.com</p>
</div>`,
      text: `Partnership Opportunity with ${brandName}

Hello,

We hope this message finds you well! We're reaching out from ${brandName} because we believe your content would be a perfect fit for our brand.

We'd love to offer you a free ${productOffer} (valued at $299) in exchange for authentic content creation. This is a no-strings-attached partnership - no upfront payment required from you.

What we're looking for:
- Honest review and demonstration of our product
- Content that showcases the product's benefits
- Tagging @${brandName.toLowerCase()} in your posts

What you get:
- Free ${productOffer} (worth $299)
- No upfront payment required
- Flexible content timeline
- Potential for ongoing partnership

We ship to the US, UK, and Australia. If you're interested, please reply with your shipping address and we'll get the product sent out right away!

Looking forward to working with you!

Best regards,
${brandName} Partnership Team
partnership@${brandName.toLowerCase()}.com`,
      personalization_notes: `Bulk email template for ${influencers.length} influencers`
    };
  }

  /**
   * Generate email template using AI
   */
  async generateEmailTemplate(options) {
    try {
      const {
        templateType = 'outreach',
        brandName = 'Cosara',
        productDescription = 'IPL Hair Laser Device',
        targetAudience = 'beauty influencers',
        tone = 'professional',
        callToAction = 'brand ambassador opportunity',
        additionalRequirements = ''
      } = options;

      console.log(`🤖 Generating ${templateType} template for ${brandName}`);

      const prompt = this.buildTemplateGenerationPrompt({
        templateType,
        brandName,
        productDescription,
        targetAudience,
        tone,
        callToAction,
        additionalRequirements
      });

      const aiResponse = await this.callAI(prompt);
      const templateData = this.parseTemplateResponse(aiResponse, options);

      console.log(`✅ Generated ${templateType} template successfully`);
      return templateData;

    } catch (error) {
      console.error('❌ Template generation failed:', error);
      throw error;
    }
  }

  /**
   * Build prompt for template generation
   */
  buildTemplateGenerationPrompt(options) {
    const {
      templateType,
      brandName,
      productDescription,
      targetAudience,
      tone,
      callToAction,
      additionalRequirements
    } = options;

    return `You are an expert email marketing copywriter specializing in influencer outreach. Generate a professional email template with the following specifications:

**Template Type:** ${templateType}
**Brand Name:** ${brandName}
**Product Description:** ${productDescription}
**Target Audience:** ${targetAudience}
**Tone:** ${tone}
**Call to Action:** ${callToAction}
${additionalRequirements ? `**Additional Requirements:** ${additionalRequirements}` : ''}

**Requirements:**
1. Create both HTML and plain text versions
2. Use professional email structure with proper HTML formatting
3. Use INLINE STYLES ONLY - NO CSS classes or external stylesheets
4. Include personalization variables like {{first_name}}, {{instagram_handle}}
5. Make it engaging but not overly salesy
6. Include clear call-to-action
7. Keep it concise but informative
8. Use appropriate subject line
9. Include brand signature
10. Ensure all styling is inline to prevent CSS conflicts

**HTML Styling Guidelines:**
- Use inline styles for ALL elements (e.g., style="color: #000000; font-size: 16px;")
- NO CSS classes (class="...") or external stylesheets
- Use table-based layout for email compatibility
- Include proper inline styling for fonts, colors, spacing, borders
- Example: <p style="margin: 0 0 16px 0; line-height: 1.5; color: #000000; font-family: Arial, sans-serif;">

**Output Format:**
Return a JSON object with:
{
  "name": "Template Name",
  "subject": "Email Subject Line",
  "html": "HTML version with inline styles only",
  "text": "Plain text version of the email",
  "description": "Brief description of the template",
  "category": "${templateType}",
  "variables": ["list", "of", "personalization", "variables"]
}

Generate a compelling, professional email template that will resonate with ${targetAudience} and effectively communicate the ${callToAction} for ${brandName}.`;
  }

  /**
   * Parse AI response for template generation
   */
  parseTemplateResponse(aiResponse, options) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const templateData = JSON.parse(jsonMatch[0]);
        
        // Ensure required fields are present and clean HTML
        return {
          id: `ai_generated_${Date.now()}`,
          name: templateData.name || `${options.templateType} Template for ${options.brandName}`,
          subject: templateData.subject || `Partnership Opportunity with ${options.brandName}`,
          html: this.cleanHTMLForInlineStyles(templateData.html) || this.generateFallbackHTML(options),
          text: templateData.text || this.generateFallbackText(options),
          description: templateData.description || `AI-generated ${options.templateType} template for ${options.brandName}`,
          category: templateData.category || options.templateType,
          variables: templateData.variables || ['{{first_name}}', '{{instagram_handle}}', '{{follower_count}}'],
          is_active: true,
        };
      } else {
        // Fallback if JSON parsing fails
        return this.generateFallbackTemplate(options);
      }
    } catch (error) {
      console.error('❌ Failed to parse AI template response:', error);
      return this.generateFallbackTemplate(options);
    }
  }

  /**
   * Clean HTML to ensure inline styles only
   */
  cleanHTMLForInlineStyles(html) {
    if (!html) return html;
    
    // Remove any CSS classes and convert common classes to inline styles
    let cleanedHTML = html
      // Remove class attributes
      .replace(/class\s*=\s*["'][^"']*["']/gi, '')
      // Convert common Tailwind/CSS classes to inline styles
      .replace(/<p\s+([^>]*?)>/gi, (match, attrs) => {
        if (!attrs.includes('style=')) {
          return `<p style="margin: 0 0 16px 0; line-height: 1.5; color: #000000; font-family: Arial, sans-serif;" ${attrs}>`;
        }
        return match;
      })
      .replace(/<h([1-6])\s+([^>]*?)>/gi, (match, level, attrs) => {
        if (!attrs.includes('style=')) {
          const fontSize = level === '1' ? '24px' : level === '2' ? '20px' : level === '3' ? '18px' : '16px';
          return `<h${level} style="margin: 0 0 16px 0; font-size: ${fontSize}; font-weight: bold; color: #000000; font-family: Arial, sans-serif;" ${attrs}>`;
        }
        return match;
      })
      .replace(/<div\s+([^>]*?)>/gi, (match, attrs) => {
        if (!attrs.includes('style=')) {
          return `<div style="margin: 0; padding: 0;" ${attrs}>`;
        }
        return match;
      })
      .replace(/<table\s+([^>]*?)>/gi, (match, attrs) => {
        if (!attrs.includes('style=')) {
          return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;" ${attrs}>`;
        }
        return match;
      })
      .replace(/<td\s+([^>]*?)>/gi, (match, attrs) => {
        if (!attrs.includes('style=')) {
          return `<td style="padding: 0;" ${attrs}>`;
        }
        return match;
      })
      .replace(/<tr\s+([^>]*?)>/gi, (match, attrs) => {
        if (!attrs.includes('style=')) {
          return `<tr ${attrs}>`;
        }
        return match;
      })
      .replace(/<strong\s+([^>]*?)>/gi, (match, attrs) => {
        if (!attrs.includes('style=')) {
          return `<strong style="font-weight: bold;" ${attrs}>`;
        }
        return match;
      })
      .replace(/<a\s+([^>]*?)>/gi, (match, attrs) => {
        if (!attrs.includes('style=')) {
          return `<a style="color: #000000; text-decoration: underline;" ${attrs}>`;
        }
        return match;
      });
    
    return cleanedHTML;
  }

  /**
   * Generate fallback template if AI fails
   */
  generateFallbackTemplate(options) {
    const { brandName, productDescription, templateType, callToAction } = options;
    
    return {
      id: `ai_generated_${Date.now()}`,
      name: `${templateType} Template for ${brandName}`,
      subject: `Partnership Opportunity with ${brandName}`,
      html: this.generateFallbackHTML(options),
      text: this.generateFallbackText(options),
      description: `AI-generated ${templateType} template for ${brandName}`,
      category: templateType,
      variables: ['{{first_name}}', '{{instagram_handle}}', '{{follower_count}}'],
      is_active: true,
    };
  }

  /**
   * Generate fallback HTML template
   */
  generateFallbackHTML(options) {
    const { brandName, productDescription, callToAction } = options;
    
    return `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I'm reaching out on behalf of <strong>${brandName}</strong> — ${productDescription}. We help people achieve their goals with our innovative technology.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I came across your profile @{{instagram_handle}} and was impressed by your content and engaged community. Your aesthetic aligns perfectly with our brand values.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <strong>Here's what I'd love to offer you:</strong>
        </p>
        
        <p style="margin: 0 0 8px 0; line-height: 1.5;">
          🎯 <strong>${callToAction}:</strong> We're offering a free product in exchange for authentic content about your experience.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          This is your chance to be part of our community and showcase innovative products to your audience.
        </p>
        
        <p style="margin: 0 0 24px 0; line-height: 1.5;">
          Are you interested in this opportunity? I'd love to share more details!
        </p>
        
        <p style="margin: 0 0 8px 0; line-height: 1.5;">Best regards,</p>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">The ${brandName} Partnership Team</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>${brandName}</strong><br>
              <a href="https://${brandName.toLowerCase()}.com" target="_blank" style="color: #000000; text-decoration: underline;">${brandName.toLowerCase()}.com</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  }

  /**
   * Generate fallback text template
   */
  generateFallbackText(options) {
    const { brandName, productDescription, callToAction } = options;
    
    return `Hi {{first_name}},

I'm reaching out on behalf of ${brandName} — ${productDescription}. We help people achieve their goals with our innovative technology.

I came across your profile @{{instagram_handle}} and was impressed by your content and engaged community. Your aesthetic aligns perfectly with our brand values.

Here's what I'd love to offer you:

🎯 ${callToAction}: We're offering a free product in exchange for authentic content about your experience.

This is your chance to be part of our community and showcase innovative products to your audience.

Are you interested in this opportunity? I'd love to share more details!

Best regards,
The ${brandName} Partnership Team

${brandName}
${brandName.toLowerCase()}.com`;
  }
}

module.exports = new AIResponseHandler(); 