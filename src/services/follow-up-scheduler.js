/**
 * 📬 Follow-up Scheduler Service
 * Handles automated follow-up emails based on influencer journey stages
 */
class FollowUpScheduler {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the follow-up scheduler
   */
  start() {
    this.isRunning = true;
    console.log('📬 Follow-up scheduler started');
  }

  /**
   * Stop the follow-up scheduler
   */
  stop() {
    this.isRunning = false;
    console.log('📬 Follow-up scheduler stopped');
  }

  /**
   * ✨ Process scheduled follow-ups
   */
  async processScheduledFollowUps() {
    try {
      console.log('📬 Processing scheduled follow-ups...');
      
      const { getDb } = require('./database');
      const db = getDb();
      
      // Get influencers needing follow-ups
      const now = new Date();
      const followUpCandidates = await this.getFollowUpCandidates(db, now);
      
      let followUpsSent = 0;
      
      for (const influencer of followUpCandidates) {
        try {
          const followUpType = this.determineFollowUpType(influencer);
          
          if (followUpType) {
            await this.sendFollowUp(influencer, followUpType);
            await this.updateInfluencerFollowUpStatus(db, influencer.id, followUpType);
            followUpsSent++;
          }
          
        } catch (error) {
          console.error(`Error sending follow-up to ${influencer.instagram_handle}:`, error);
        }
      }
      
      console.log(`✅ Follow-up processing completed: ${followUpsSent} emails sent`);
      
      return {
        sent: followUpsSent,
        candidates: followUpCandidates.length
      };
      
    } catch (error) {
      console.error('Error processing follow-ups:', error);
      throw error;
    }
  }

  /**
   * Get influencers who need follow-ups
   */
  async getFollowUpCandidates(db, now) {
    try {
      const candidates = [];
      
      // 1. Initial outreach follow-up (3 days after first email, no response)
      const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
      const initialFollowUps = await db.collection('influencers')
        .where('status', '==', 'contacted')
        .where('journey_reached_out_at', '<=', threeDaysAgo)
        .where('journey_follow_up_1_sent', '==', false)
        .get();
      
      initialFollowUps.forEach(doc => {
        const data = doc.data();
        candidates.push({
          id: doc.id,
          ...data,
          follow_up_reason: 'initial_no_response'
        });
      });
      
      // 2. Product shipped follow-up (7 days after shipping)
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      const shippedFollowUps = await db.collection('influencers')
        .where('status', '==', 'product_shipped')
        .where('journey_shipped_at', '<=', sevenDaysAgo)
        .where('journey_content_posted', '==', false)
        .get();
      
      shippedFollowUps.forEach(doc => {
        const data = doc.data();
        candidates.push({
          id: doc.id,
          ...data,
          follow_up_reason: 'content_reminder'
        });
      });
      
      // 3. Content creation follow-up (14 days after shipping, no content)
      const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
      const contentFollowUps = await db.collection('influencers')
        .where('status', '==', 'product_shipped')
        .where('journey_shipped_at', '<=', fourteenDaysAgo)
        .where('journey_content_posted', '==', false)
        .where('journey_follow_up_3_sent', '==', false)
        .get();
      
      contentFollowUps.forEach(doc => {
        const data = doc.data();
        candidates.push({
          id: doc.id,
          ...data,
          follow_up_reason: 'final_content_reminder'
        });
      });
      
      console.log(`📊 Found ${candidates.length} follow-up candidates`);
      return candidates;
      
    } catch (error) {
      console.error('Error getting follow-up candidates:', error);
      return [];
    }
  }

  /**
   * Determine the type of follow-up needed
   */
  determineFollowUpType(influencer) {
    switch (influencer.follow_up_reason) {
      case 'initial_no_response':
        return influencer.journey_follow_up_1_sent === false ? 'first_follow_up' : 'second_follow_up';
      
      case 'content_reminder':
        return 'content_creation_reminder';
      
      case 'final_content_reminder':
        return 'final_content_reminder';
      
      default:
        return null;
    }
  }

  /**
   * Send follow-up email
   */
  async sendFollowUp(influencer, followUpType) {
    try {
      const emailService = require('./email');
      const { emailVariants } = require('../templates/email-variants');
      
      // Get appropriate follow-up template
      let template;
      
      switch (followUpType) {
        case 'first_follow_up':
          template = emailVariants.follow_up.gentle_social_proof;
          break;
        case 'second_follow_up':
          template = emailVariants.follow_up.urgency_scarcity;
          break;
        case 'content_creation_reminder':
          template = this.getContentReminderTemplate();
          break;
        case 'final_content_reminder':
          template = this.getFinalReminderTemplate();
          break;
        default:
          throw new Error(`Unknown follow-up type: ${followUpType}`);
      }
      
      // Personalize template
      const personalizedTemplate = this.personalizeTemplate(template, influencer);
      
      // Send email
      await emailService.sendEmail(
        influencer.email,
        personalizedTemplate.subject,
        personalizedTemplate.html,
        {
          influencer_id: influencer.id,
          template_type: followUpType,
          campaign_id: influencer.campaigns?.[0]
        }
      );
      
      console.log(`📧 Sent ${followUpType} to ${influencer.instagram_handle}`);
      
    } catch (error) {
      console.error(`Error sending follow-up to ${influencer.instagram_handle}:`, error);
      throw error;
    }
  }

  /**
   * Get content reminder template
   */
  getContentReminderTemplate() {
    return {
      subject: "How's your Cosara experience going? 📸",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi {{first_name}}! 👋</h2>
          
          <p>I hope you're loving your Cosara IPL device! It's been about a week since we shipped it to you.</p>
          
          <p>We'd love to see how your hair removal journey is going! When you're ready, we'd be thrilled if you could share:</p>
          
          <ul>
            <li>📸 Before/after photos (if you're comfortable)</li>
            <li>🎥 A quick video of your experience</li>
            <li>📝 Your honest thoughts about the device</li>
          </ul>
          
          <p>Remember, authenticity is key - we want your genuine experience, whether it's amazing results or just getting started!</p>
          
          <p>If you have any questions about using the device or need any support, just reply to this email.</p>
          
          <p>Looking forward to seeing your content! 🌟</p>
          
          <p>Best,<br>
          The Cosara Team</p>
        </div>
      `
    };
  }

  /**
   * Get final reminder template
   */
  getFinalReminderTemplate() {
    return {
      subject: "Final reminder: Share your Cosara journey 🌟",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi {{first_name}},</h2>
          
          <p>I hope you've been enjoying your Cosara IPL device! It's been about 2 weeks since we sent it your way.</p>
          
          <p>This is just a friendly final reminder about creating content for our collaboration. We understand life gets busy, but we'd still love to see your experience with the device!</p>
          
          <p><strong>What we're looking for:</strong></p>
          <ul>
            <li>An honest review of your experience</li>
            <li>Photos or videos showing the device in use</li>
            <li>Your genuine thoughts and results</li>
          </ul>
          
          <p>If you're no longer able to create content, no worries at all - just let us know and we'll update our records.</p>
          
          <p>If you need any help or have questions, I'm here to support you!</p>
          
          <p>Thanks for being part of the Cosara community! 💜</p>
          
          <p>Best regards,<br>
          The Cosara Team</p>
        </div>
      `
    };
  }

  /**
   * Personalize email template
   */
  personalizeTemplate(template, influencer) {
    const firstName = influencer.first_name || 
                     influencer.full_name?.split(' ')[0] || 
                     influencer.instagram_handle;
    
    return {
      subject: template.subject.replace('{{first_name}}', firstName),
      html: template.html
        .replace(/{{first_name}}/g, firstName)
        .replace(/{{instagram_handle}}/g, influencer.instagram_handle)
        .replace(/{{full_name}}/g, influencer.full_name || influencer.instagram_handle)
    };
  }

  /**
   * Update influencer follow-up status
   */
  async updateInfluencerFollowUpStatus(db, influencerId, followUpType) {
    try {
      const influencerRef = db.collection('influencers').doc(influencerId);
      const updateData = {
        updated_at: new Date().toISOString()
      };
      
      switch (followUpType) {
        case 'first_follow_up':
        case 'second_follow_up':
          // Update follow-up count in journey_milestones
          const currentMilestones = influencer.journey_milestones || {};
          updateData.journey_milestones = {
            ...currentMilestones,
            follow_up_count: (currentMilestones.follow_up_count || 0) + 1
          };
          break;
        
        case 'content_creation_reminder':
          updateData.journey_follow_up_2_sent = true;
          updateData.journey_follow_up_2_at = new Date().toISOString();
          break;
        
        case 'final_content_reminder':
          updateData.journey_follow_up_3_sent = true;
          updateData.journey_follow_up_3_at = new Date().toISOString();
          break;
      }
      
      await influencerRef.update(updateData);
      
    } catch (error) {
      console.error(`Error updating follow-up status for ${influencerId}:`, error);
    }
  }

  /**
   * ✨ Get follow-up statistics
   */
  async getFollowUpStats() {
    try {
      const { getDb } = require('./database');
      const db = getDb();
      
      const now = new Date();
      const last30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      // Get follow-up stats for last 30 days
      const followUpsSnapshot = await db.collection('influencers')
        .where('journey_follow_up_1_at', '>=', last30Days)
        .get();
      
      const stats = {
        total_follow_ups_sent: followUpsSnapshot.size,
        by_type: {},
        response_rate: 0,
        pending_follow_ups: 0
      };
      
      followUpsSnapshot.forEach(doc => {
        const data = doc.data();
        const followUpType = data.journey_milestones?.last_follow_up_type || 'unknown';
        stats.by_type[followUpType] = (stats.by_type[followUpType] || 0) + 1;
      });
      
      // Get pending follow-ups
      const candidates = await this.getFollowUpCandidates(db, now);
      stats.pending_follow_ups = candidates.length;
      
      return stats;
      
    } catch (error) {
      console.error('Error getting follow-up stats:', error);
      return null;
    }
  }
}

module.exports = new FollowUpScheduler(); 