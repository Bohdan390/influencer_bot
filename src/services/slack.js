const axios = require('axios');

class SlackService {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.botToken = process.env.SLACK_BOT_TOKEN;
    this.channel = process.env.SLACK_CHANNEL || '#influencer-campaigns';
    this.archiveChannel = '#post-archive'; // Dedicated channel for post archiving
    this.appId = process.env.SLACK_APP_ID;
    this.clientId = process.env.SLACK_CLIENT_ID;
    this.clientSecret = process.env.SLACK_CLIENT_SECRET;
    this.signingSecret = process.env.SLACK_SIGNING_SECRET;
    this.verificationToken = process.env.SLACK_VERIFICATION_TOKEN;
    this.isConfigured = !!this.webhookUrl;
  }

  /**
   * Archive influencer post when they tag the brand
   */
  async archiveInfluencerPost(influencer, post, analysis) {
    if (!this.isConfigured) return;

    try {
      const qualityEmoji = analysis.quality_score >= 80 ? '🌟' : analysis.quality_score >= 60 ? '👍' : '⚠️';
      const complianceEmoji = analysis.compliant ? '✅' : '❌';
      const timestamp = new Date().toISOString().split('T')[0];
      
      const archiveMessage = {
        text: `📁 Post Archived: ${influencer.instagram_handle} tagged @dermao.official`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `📁 Post Archived - ${timestamp}`
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Influencer:* @${influencer.instagram_handle}`
              },
              {
                type: "mrkdwn",
                text: `*Followers:* ${influencer.follower_count?.toLocaleString() || 'Unknown'}`
              },
              {
                type: "mrkdwn",
                text: `*Quality Score:* ${qualityEmoji} ${analysis.quality_score}/100`
              },
              {
                type: "mrkdwn",
                text: `*Brand Compliant:* ${complianceEmoji} ${analysis.compliant ? 'Yes' : 'No'}`
              },
              {
                type: "mrkdwn",
                text: `*Post Date:* ${post.created_at || 'Unknown'}`
              },
              {
                type: "mrkdwn",
                text: `*Status:* ✅ Posted & Tagged`
              }
            ]
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Post Metrics:*\n• Likes: ${post.likes_count || 0}\n• Comments: ${post.comments_count || 0}\n• Engagement: ${post.engagement_rate?.toFixed(2) || 0}%\n• Reach: ${post.reach || 'Unknown'}`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Caption Preview:*\n${post.caption ? post.caption.substring(0, 200) + (post.caption.length > 200 ? '...' : '') : 'No caption'}`
            }
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "📱 View Post"
                },
                url: post.url,
                style: "primary"
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "👤 View Profile"
                },
                url: `https://instagram.com/${influencer.instagram_handle}`
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "📊 Dashboard"
                },
                url: `${process.env.APP_URL}/dashboard/influencers/${influencer.id}`
              }
            ]
          }
        ]
      };

      // Send to archive channel
      await this.sendMessageToChannel(archiveMessage, this.archiveChannel);
      
      // Also send notification to main channel
      await this.sendPostNotification(influencer, post, analysis);
      
      console.log(`📁 Archived post from ${influencer.instagram_handle} to Slack`);
      return true;
    } catch (error) {
      console.error('Failed to archive post to Slack:', error);
      return false;
    }
  }

  /**
   * Send notification for new influencer post
   */
  async sendPostNotification(influencer, post, analysis) {
    if (!this.isConfigured) return;

    try {
      const qualityEmoji = analysis.quality_score >= 80 ? '🌟' : analysis.quality_score >= 60 ? '👍' : '⚠️';
      const complianceEmoji = analysis.compliant ? '✅' : '❌';
      
      const message = {
        text: `🎉 New Influencer Post Detected!`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🎉 New Influencer Post Detected!"
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Influencer:* ${influencer.instagram_handle}`
              },
              {
                type: "mrkdwn",
                text: `*Followers:* ${influencer.follower_count?.toLocaleString() || 'Unknown'}`
              },
              {
                type: "mrkdwn",
                text: `*Quality Score:* ${qualityEmoji} ${analysis.quality_score}/100`
              },
              {
                type: "mrkdwn",
                text: `*Brand Compliant:* ${complianceEmoji} ${analysis.compliant ? 'Yes' : 'No'}`
              }
            ]
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Post Metrics:*\n• Likes: ${post.likes_count || 0}\n• Comments: ${post.comments_count || 0}\n• Engagement: ${post.engagement_rate?.toFixed(2) || 0}%`
            }
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "View Post"
                },
                url: post.url,
                style: "primary"
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "View Dashboard"
                },
                url: `${process.env.APP_URL}/dashboard/influencers/${influencer.id}`
              }
            ]
          }
        ]
      };

      await this.sendMessage(message);
      console.log(`✅ Sent Slack notification for post from ${influencer.instagram_handle}`);
    } catch (error) {
      console.error('Failed to send post notification:', error);
    }
  }

  /**
   * Send email response notification
   */
  async sendEmailResponseNotification(influencer, response, aiDecision) {
    if (!this.isConfigured) return;

    try {
      const sentimentEmoji = {
        'positive': '😊',
        'negative': '😞',
        'neutral': '😐',
        'confused': '🤔'
      };

      const actionEmoji = {
        'ship_product': '📦',
        'ask_for_address': '🏠',
        'ask_for_consent': '📝',
        'manual_review': '👀',
        'polite_decline': '❌'
      };

      const message = {
        text: `📧 New Email Response from ${influencer.instagram_handle}`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "📧 New Email Response"
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Influencer:* ${influencer.instagram_handle}`
              },
              {
                type: "mrkdwn",
                text: `*AI Confidence:* ${Math.round(aiDecision.confidence * 100)}%`
              },
              {
                type: "mrkdwn",
                text: `*Sentiment:* ${sentimentEmoji[aiDecision.sentiment] || '🤷'} ${aiDecision.sentiment}`
              },
              {
                type: "mrkdwn",
                text: `*Next Action:* ${actionEmoji[aiDecision.action] || '🔄'} ${aiDecision.action.replace('_', ' ')}`
              }
            ]
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Response Preview:*\n${response.substring(0, 200)}${response.length > 200 ? '...' : ''}`
            }
          }
        ]
      };

      if (aiDecision.action === 'manual_review') {
        message.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: "⚠️ *This response requires manual review*"
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Review Now"
            },
            url: `${process.env.APP_URL}/dashboard/manual-review`,
            style: "danger"
          }
        });
      }

      await this.sendMessage(message);
      console.log(`✅ Sent Slack notification for email response from ${influencer.instagram_handle}`);
    } catch (error) {
      console.error('Failed to send email response notification:', error);
    }
  }

  /**
   * Send campaign milestone notification
   */
  async sendCampaignMilestone(milestone, data) {
    if (!this.isConfigured) return;

    const milestones = {
      'new_influencer_responded': {
        emoji: '💬',
        title: 'New Influencer Response',
        message: `${data.influencer_handle} just responded to our outreach!`
      },
      'product_shipped': {
        emoji: '📦',
        title: 'Product Shipped',
        message: `IPL device shipped to ${data.influencer_handle}. Tracking: ${data.tracking_number}`
      },
      'campaign_goal_reached': {
        emoji: '🎯',
        title: 'Campaign Goal Reached',
        message: `We've reached ${data.milestone} influencers! Current stats: ${data.shipped} shipped, ${data.posted} posted content.`
      },
      'high_engagement_post': {
        emoji: '🔥',
        title: 'High Engagement Post',
        message: `${data.influencer_handle}'s post is performing exceptionally well! ${data.likes} likes, ${data.comments} comments.`
      }
    };

    const config = milestones[milestone];
    if (!config) return;

    try {
      const message = {
        text: `${config.emoji} ${config.title}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${config.emoji} *${config.title}*\n${config.message}`
            }
          }
        ]
      };

      await this.sendMessage(message);
    } catch (error) {
      console.error('Failed to send milestone notification:', error);
    }
  }

  /**
   * Send daily campaign summary
   */
  async sendDailySummary(stats) {
    if (!this.isConfigured) return;

    try {
      const message = {
        text: `📊 Daily Campaign Summary - ${new Date().toLocaleDateString()}`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `📊 Daily Campaign Summary - ${new Date().toLocaleDateString()}`
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*🔍 New Discoveries:* ${stats.new_discoveries}`
              },
              {
                type: "mrkdwn",
                text: `*📧 Emails Sent:* ${stats.emails_sent}`
              },
              {
                type: "mrkdwn",
                text: `*💬 Responses Received:* ${stats.responses_received}`
              },
              {
                type: "mrkdwn",
                text: `*📦 Products Shipped:* ${stats.products_shipped}`
              },
              {
                type: "mrkdwn",
                text: `*📸 New Posts:* ${stats.new_posts}`
              },
              {
                type: "mrkdwn",
                text: `*👥 Manual Reviews:* ${stats.manual_reviews}`
              }
            ]
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*📈 Campaign Progress:*\n• Total Active: ${stats.total_active}\n• Conversion Rate: ${stats.conversion_rate}%\n• Avg Response Time: ${stats.avg_response_time}h`
            }
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "View Dashboard"
                },
                url: `${process.env.APP_URL}/dashboard`
              }
            ]
          }
        ]
      };

      await this.sendMessage(message);
    } catch (error) {
      console.error('Failed to send daily summary:', error);
    }
  }

  /**
   * Send error/alert notification
   */
  async sendAlert(type, message, details = {}) {
    if (!this.isConfigured) return;

    const alertTypes = {
      'system_error': '🚨',
      'api_failure': '⚠️',
      'rate_limit': '🛑',
      'database_issue': '💾',
      'email_failure': '📧'
    };

    try {
      const slackMessage = {
        text: `${alertTypes[type] || '⚠️'} System Alert: ${message}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${alertTypes[type] || '⚠️'} *System Alert*\n${message}`
            }
          }
        ]
      };

      if (Object.keys(details).length > 0) {
        slackMessage.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Details:*\n${Object.entries(details).map(([key, value]) => `• ${key}: ${value}`).join('\n')}`
          }
        });
      }

      await this.sendMessage(slackMessage);
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  /**
   * Send message to Slack
   */
  async sendMessage(message) {
    if (!this.isConfigured) {
      console.log('⚠️ Slack not configured - notification skipped');
      return;
    }

    try {
      await axios.post(this.webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Slack message send failed:', error);
      throw error;
    }
  }

  /**
   * Send message to specific Slack channel using Bot Token
   */
  async sendMessageToChannel(message, channel) {
    if (!this.isConfigured || !this.botToken) {
      console.log('⚠️ Slack bot token not configured - channel message skipped');
      // Fallback to webhook if bot token not available
      return this.sendMessage(message);
    }

    try {
      const payload = {
        channel: channel,
        ...message
      };

      await axios.post('https://slack.com/api/chat.postMessage', payload, {
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error(`Failed to send message to channel ${channel}:`, error);
      // Fallback to webhook
      return this.sendMessage(message);
    }
  }

  /**
   * Get list of influencers who have posted vs who haven't
   */
  async sendInfluencerPostingStatus(influencers) {
    if (!this.isConfigured) return;

    try {
      const posted = influencers.filter(inf => inf.has_posted);
      const notPosted = influencers.filter(inf => !inf.has_posted && inf.product_shipped);
      const pending = influencers.filter(inf => !inf.product_shipped);

      const message = {
        text: `📊 Influencer Posting Status Report`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "📊 Influencer Posting Status Report"
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*✅ Posted (${posted.length}):*\n${posted.map(inf => `• @${inf.instagram_handle}`).join('\n') || 'None yet'}`
              },
              {
                type: "mrkdwn",
                text: `*⏳ Shipped but Not Posted (${notPosted.length}):*\n${notPosted.map(inf => `• @${inf.instagram_handle} (${inf.days_since_shipped} days)`).join('\n') || 'None'}`
              }
            ]
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*📦 Pending Shipment (${pending.length}):*\n${pending.map(inf => `• @${inf.instagram_handle}`).join('\n') || 'None'}`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*📈 Summary:*\n• Conversion Rate: ${((posted.length / (posted.length + notPosted.length)) * 100).toFixed(1)}%\n• Total Engaged: ${posted.length + notPosted.length + pending.length}`
            }
          }
        ]
      };

      await this.sendMessageToChannel(message, this.archiveChannel);
      console.log('📊 Sent influencer posting status report');
    } catch (error) {
      console.error('Failed to send posting status:', error);
    }
  }

  /**
   * Test Slack connection
   */
  async testConnection() {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Slack webhook URL not configured'
      };
    }

    try {
      const testMessage = {
        text: '🧪 Test Notification from Dermao Influencer Bot',
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "🧪 *Test Notification*\nSlack integration is working correctly! You'll receive notifications for:\n\n• 🎉 New influencer posts\n• 📧 Email responses\n• 📦 Product shipments\n• 🎯 Campaign milestones\n• 🚨 System alerts"
            }
          }
        ]
      };

      await this.sendMessage(testMessage);
      
      return {
        success: true,
        message: 'Slack connection test successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Slack connection test failed'
      };
    }
  }

  /**
   * ✨ Send split test winner notification
   */
  async sendSplitTestWinnerNotification(test, winnerVariant, winnerResults) {
    if (!this.isConfigured) return;

    try {
      const message = {
        text: `🏆 Split Test Winner Declared!`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🏆 Split Test Winner Declared!"
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Test:* ${test.name}`
              },
              {
                type: "mrkdwn",
                text: `*Winner:* ${winnerVariant.name}`
              },
              {
                type: "mrkdwn",
                text: `*Response Rate:* ${Math.round(winnerResults.response_rate * 100)}%`
              },
              {
                type: "mrkdwn",
                text: `*Conversion Rate:* ${Math.round(winnerResults.conversion_rate * 100)}%`
              }
            ]
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Description:* ${winnerVariant.description}\n*Emails Sent:* ${winnerResults.sent}\n*Total Responses:* ${winnerResults.responded}`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "🎯 *Action Required:* Consider updating your default templates with this winning variant!"
            },
            accessory: {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Full Results"
              },
              url: `${process.env.APP_URL}/split-tests/${test.id}`,
              style: "primary"
            }
          }
        ]
      };

      await this.sendMessage(message);
      console.log(`✅ Sent split test winner notification for ${test.name}`);
    } catch (error) {
      console.error('Failed to send split test winner notification:', error);
    }
  }

  /**
   * ✨ Send split test progress update
   */
  async sendSplitTestProgress(test, milestone) {
    if (!this.isConfigured) return;

    try {
      const totalSent = Object.values(test.current_counts).reduce((sum, count) => sum + count, 0);
      const targetTotal = test.target_count * test.variants.length;
      const completion = Math.round((totalSent / targetTotal) * 100);

      const message = {
        text: `🧪 Split Test Progress: ${test.name}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `🧪 *Split Test Update:* ${test.name}\n📊 *Progress:* ${totalSent}/${targetTotal} emails sent (${completion}%)\n🎯 *Milestone:* ${milestone}`
            }
          }
        ]
      };

      if (completion >= 50 && completion < 100) {
        message.blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: "⚡ *Halfway there!* Keep an eye on the results - early trends are starting to emerge."
          }
        });
      }

      await this.sendMessage(message);
    } catch (error) {
      console.error('Failed to send split test progress:', error);
    }
  }
}

module.exports = new SlackService(); 