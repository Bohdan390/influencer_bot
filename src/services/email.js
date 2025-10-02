const axios = require('axios');
const nodemailer = require('nodemailer');
const { supabase } = require('./supabase');

class EmailService {
  constructor() {
    // Check hardcoded config first, then environment variables
    const { config } = require('../config/hardcoded-config');
    
    this.provider = config.apis.email.provider || process.env.EMAIL_PROVIDER || 'brevo';
    
    if (this.provider === 'sendgrid') {
      this.sendgrid = require('@sendgrid/mail');
      this.sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    } else if (this.provider === 'smtp') {
      // Initialize SMTP transporter using hardcoded config or environment variables
      const smtpConfig = {
        host: config.apis.email.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com',
        port: config.apis.email.smtp_port || process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: config.apis.email.smtp_user || process.env.SMTP_USER || 'bohdanmotrych8@gmail.com',
          pass: config.apis.email.smtp_pass || process.env.SMTP_PASS
        }
      };
      
      console.log('📧 SMTP Configuration:', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        user: smtpConfig.auth.user,
        secure: smtpConfig.secure
      });
      
      this.smtpTransporter = nodemailer.createTransport(smtpConfig);
    }
    
    this.fromEmail = process.env.FROM_EMAIL || 'influencers@trycosara.com';
    this.fromName = process.env.FROM_NAME || 'Dermao Partnership Team';
  }

  /**
   * Get Brevo API key from hardcoded config
   */
  getBrevoApiKey() {
    const { config } = require('../config/hardcoded-config');
    return config.apis.email.brevo_api_key;
  }

  /**
   * Save email campaign to database
   */
  async saveEmailCampaign(campaignData) {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving email campaign:', error);
        return null;
      }

      console.log('✅ Email campaign saved to database:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Error saving email campaign:', error);
      return null;
    }
  }

  /**
   * Strip HTML tags from content
   */
  stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Get email campaigns by influencer ID
   */
  async getEmailCampaignsByInfluencer(influencerId) {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('influencer_id', influencerId)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching email campaigns:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching email campaigns:', error);
      return [];
    }
  }

  /**
   * Get all email campaigns
   */
  async getAllEmailCampaigns(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase()
        .from('email_campaigns')
        .select(`
          *,
          influencers (
            instagram_handle,
            full_name,
            profile_image
          )
        `)
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Error fetching email campaigns:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching email campaigns:', error);
      return [];
    }
  }

  /**
   * Send email using configured provider
   */
  async sendEmail(to, subject, htmlContent, templateData = {}) {
    try {
      console.log(`📧 Sending email via ${this.provider} to ${to}`);
      
      // Personalize content
      const personalizedHtml = this.personalizeContent(htmlContent, templateData);
      
      let result;
      if (this.provider === 'brevo') {
        result = await this.sendViaBrevo(to, subject, personalizedHtml, templateData.message_id);
      } else if (this.provider === 'sendgrid') {
        result = await this.sendViaSendGrid(to, subject, personalizedHtml);
      } else if (this.provider === 'smtp') {
        result = await this.sendViaSMTP(to, subject, personalizedHtml);
      } else {
        throw new Error(`Unknown email provider: ${this.provider}`);
      }
      
      if (!result) return
      // Log to database if available
      try {
        if (templateData.first_send) { 
          await supabase().from('email_campaigns').insert([{
            influencer_id: templateData.influencer_id || null,
            influencer_email: to,
          }]);

          const {error: updateError} = await supabase().from('influencers').update({
            journey_stage: 'reached_out',
            journey_reached_out: true,
            journey_reached_out_at: new Date().toISOString(),
          }).eq('id', templateData.influencer_id);
          if (updateError) {
            console.error('❌ Error123 updating influencer:', updateError.message);
          }
        }
        await supabase().from('chat_messages').insert([{
          influencer_handle: templateData.instagram_handle || null,
          sender_type: 'user',
          subject: subject,
          message: personalizedHtml,
          message_type: 'email',
        }]);
      } catch (dbError) {
        console.log('⚠️ Could not log email to database (Firebase not configured)');
      }
      
      console.log(`✅ Email sent successfully via ${this.provider}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to send email via ${this.provider}:`, error.message);
      
      // Provide helpful error messages for common issues
      if (error.response?.status === 401) {
        throw new Error(`Email API key is invalid or expired. Please check your ${this.provider.toUpperCase()}_API_KEY configuration.`);
      } else if (error.response?.status === 429) {
        throw new Error(`Email rate limit exceeded. Please wait before sending more emails.`);
      } else if (error.code === 'ENOTFOUND') {
        throw new Error(`Email service is unreachable. Please check your internet connection.`);
      }
      
      throw error;
    }
  }

  /**
   * Send email via Brevo API
   */
  async sendViaBrevo(to, subject, htmlContent, messageId) {
    const apiKey = this.getBrevoApiKey() || process.env.BREVO_API_KEY;
    console.log('🔑 Using Brevo API Key:', apiKey ? apiKey : 'NOT FOUND');
    console.log('📧 From:', this.fromName, this.fromEmail);
    console.log('📧 To:', to);
    try {
      const response = await axios.get("https://api.brevo.com/v3/account", {
        headers: { "api-key": apiKey }
      });
      console.log("✅ API Key is valid!");
      console.log(response.data); // prints account info
    } catch (err) {
      console.error("❌ Invalid API Key or unauthorized:");
      console.error(err.response?.data || err.message);
      return null;
    }

    var query = {}

    if (messageId) {
      query = {
        "In-Reply-To": messageId,
        "References": messageId
      }
    }

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: {
        name: "Lazaro",
        email: this.fromEmail
      },
      to: [{ email: 'fernandolaza80@gmail.com' }],
      subject: subject,
      htmlContent: htmlContent,
      ...query
    }, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(response.data, 'brevo');
    return {
      id: response.data.messageId,
      provider: 'brevo',
      status: 'sent'
    };
  }

  /**
   * Send email via SendGrid API
   */
  async sendViaSendGrid(to, subject, htmlContent) {
    const msg = {
      to: to,
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
      subject: subject,
      html: htmlContent,
      trackingSettings: {
        clickTracking: {
          enable: true
        },
        openTracking: {
          enable: true
        }
      }
    };

    const response = await this.sendgrid.send(msg);
    
    return {
      id: response[0].headers['x-message-id'],
      provider: 'sendgrid',
      status: 'sent'
    };
  }

  /**
   * Send email via SMTP
   */
  async sendViaSMTP(to, subject, htmlContent) {
    const mailOptions = {
      from: `${this.fromName} <${this.fromEmail}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      headers: {
        'X-Mailer': 'Dermao-Influencer-Bot',
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    };

    try {
      const info = await this.smtpTransporter.sendMail(mailOptions);
      return {
        id: info.messageId,
        provider: 'smtp',
        status: 'sent'
      };
    } catch (error) {
      console.error('❌ Failed to send email via SMTP:', error.message);
      throw error;
    }
  }

  /**
   * Personalize email content with template variables
   */
  personalizeContent(htmlContent, data) {
    let content = htmlContent;
    
    // Replace common placeholders (supporting both old and new formats)
    const replacements = {
      // New Dermao template format
      '{{first_name}}': data.first_name || data.influencer_name || 'there',
      '{{last_name}}': data.last_name || '',
      '{{full_name}}': data.full_name || (data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : data.influencer_name || 'there'),
      '{{tracking_number}}': data.tracking_number || '',
      '{{estimated_delivery}}': data.estimated_delivery || data.delivery_date || '',
      
      // Legacy format for backwards compatibility
      '{{INFLUENCER_NAME}}': data.influencer_name || data.first_name || 'there',
      '{{INFLUENCER_HANDLE}}': data.influencer_handle || '',
      '{{FOLLOWER_COUNT}}': data.follower_count ? this.formatNumber(data.follower_count) : '',
      '{{RECENT_POST_REFERENCE}}': data.recent_post || 'your recent content',
      '{{SENDER_NAME}}': data.sender_name || this.fromName,
      '{{TRACKING_NUMBER}}': data.tracking_number || '',
      '{{DELIVERY_DATE}}': data.delivery_date || '',
      '{{CARRIER}}': data.carrier || '',
      '{{DAYS_SINCE_DELIVERY}}': data.days_since_delivery || '',
      '{{DAYS_AGO}}': data.days_ago || '',
      '{{CONTENT_THEME}}': data.content_theme || 'beauty and wellness'
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    return content;
  }

  /**
   * Format numbers for display (e.g., 50000 -> "50K")
   */
  formatNumber(num) {
    if (num >= 1000000) {
      return Math.round(num / 1000000 * 10) / 10 + 'M';
    } else if (num >= 1000) {
      return Math.round(num / 1000 * 10) / 10 + 'K';
    }
    return num.toString();
  }

  /**
   * Create email campaign (for bulk sending)
   */
  async createCampaign(campaignData) {
    try {
      if (this.provider === 'brevo') {
        return await this.createBrevoCampaign(campaignData);
      } else if (this.provider === 'sendgrid') {
        // SendGrid campaigns are more complex, for now we'll use individual sends
        console.log('📧 SendGrid campaigns not implemented yet, using individual sends');
        return { id: 'sendgrid-individual-sends', provider: 'sendgrid' };
      }
    } catch (error) {
      console.error('❌ Failed to create email campaign:', error.message);
      throw error;
    }
  }

  /**
   * Create Brevo email campaign
   */
  async createBrevoCampaign(campaignData) {
    const response = await axios.post('https://api.brevo.com/v3/emailCampaigns', {
      name: campaignData.name,
      subject: campaignData.subject,
      sender: {
        name: this.fromName,
        email: this.fromEmail
      },
      type: 'classic',
      htmlContent: campaignData.htmlContent,
      scheduledAt: campaignData.scheduledAt || null,
      recipients: campaignData.recipients || { listIds: [] }
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return {
      id: response.data.id,
      provider: 'brevo',
      status: 'created'
    };
  }

  /**
   * Get email templates based on type
   */
  getTemplate(templateType) {
    // Import the new Dermao templates
    const dermaoTemplates = require('../templates/dermao-templates');
    
    // Return the requested template or null if not found
    return dermaoTemplates[templateType] || null;
  }
}

module.exports = new EmailService(); 