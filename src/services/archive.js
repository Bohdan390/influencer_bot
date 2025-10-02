const axios = require('axios');
const { influencers, posts } = require('./database');

class ArchiveService {
  constructor() {
    this.apiKey = process.env.ARCHIVE_API_KEY;
    this.baseUrl = 'https://api.archive.com/v1';
    this.isConfigured = !!this.apiKey && this.apiKey !== 'your-archive-api-key';
    
    // Enhanced monitoring settings
    this.monitoringConfig = {
      platforms: ['instagram', 'tiktok', 'youtube'],
      searchInterval: 30, // minutes
      maxPostsPerSearch: 100,
      lookbackHours: 24
    };
    
    console.log(`📦 Archive.com service ${this.isConfigured ? 'configured' : 'not configured'}`);
  }

  /**
   * 🔍 Enhanced brand mention monitoring with multiple platforms
   */
  async monitorBrandMentions() {
    if (!this.isConfigured) {
      console.log('⚠️ Archive.com not configured - skipping content monitoring');
      return { monitored: 0, newPosts: 0 };
    }

    try {
      console.log('🔍 Starting comprehensive brand monitoring on Archive.com');
      
      const searchTerms = {
        hashtags: [
          process.env.CAMPAIGN_HASHTAG || '#CosaraPartner',
          '#Cosara',
          '#CosaraReview',
          '#IPLHairRemoval',
          '#CosaraSkincare',
          '#CosaraBeauty'
        ],
        mentions: [
          process.env.BRAND_INSTAGRAM || '@cosara.official',
          'cosara',
          'Cosara'
        ],
        keywords: [
          'Cosara IPL',
          'Cosara device',
          'Cosara hair removal',
          'Cosara skincare'
        ]
      };

      let totalMonitored = 0;
      let newPosts = 0;
      const detectedPosts = [];
      
      // Monitor across all platforms
      for (const platform of this.monitoringConfig.platforms) {
        console.log(`   📱 Monitoring ${platform}...`);
        
        // Search hashtags
        for (const hashtag of searchTerms.hashtags) {
          const posts = await this.searchContent(hashtag, 'hashtag', platform);
          totalMonitored += posts.length;
          
          for (const post of posts) {
            const result = await this.processFoundPost(post, 'hashtag', hashtag);
            if (result.isNew) {
              newPosts++;
              detectedPosts.push(result.post);
            }
          }
        }
        
        // Search mentions
        for (const mention of searchTerms.mentions) {
          const posts = await this.searchContent(mention, 'mention', platform);
          totalMonitored += posts.length;
          
          for (const post of posts) {
            const result = await this.processFoundPost(post, 'mention', mention);
            if (result.isNew) {
              newPosts++;
              detectedPosts.push(result.post);
            }
          }
        }
        
        // Search keywords
        for (const keyword of searchTerms.keywords) {
          const posts = await this.searchContent(keyword, 'keyword', platform);
          totalMonitored += posts.length;
          
          for (const post of posts) {
            const result = await this.processFoundPost(post, 'keyword', keyword);
            if (result.isNew) {
              newPosts++;
              detectedPosts.push(result.post);
            }
          }
        }
      }

      // Send summary to Slack
      if (newPosts > 0) {
        await this.sendMonitoringSummary(detectedPosts, totalMonitored);
      }

      console.log(`✅ Archive.com monitoring completed: ${totalMonitored} posts monitored, ${newPosts} new posts detected`);
      
      return { 
        monitored: totalMonitored, 
        newPosts, 
        detectedPosts,
        platforms: this.monitoringConfig.platforms 
      };
      
    } catch (error) {
      console.error('❌ Archive.com monitoring failed:', error);
      
      // Send error notification to Slack
      const slackService = require('./slack');
      await slackService.sendAlert('archive_error', 'Archive.com monitoring failed', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      return { monitored: 0, newPosts: 0, error: error.message };
    }
  }

  /**
   * 🔎 Enhanced content search with better API integration
   */
  async searchContent(query, type, platform = 'instagram') {
    try {
      const searchParams = {
        query: query,
        type: type,
        platform: platform,
        limit: this.monitoringConfig.maxPostsPerSearch,
        since: this.getSearchSince(),
        include_media: true,
        include_metrics: true,
        sort: 'recent'
      };

      console.log(`   🔍 Searching ${platform} for ${type}: "${query}"`);
      
      const response = await axios.get(`${this.baseUrl}/search`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Cosara-Influencer-Bot/1.0'
        },
        params: searchParams,
        timeout: 30000 // 30 second timeout
      });

      const posts = response.data.posts || response.data.data || [];
      console.log(`   📊 Found ${posts.length} posts for "${query}" on ${platform}`);
      
      return posts;
      
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn(`⚠️ Rate limited on Archive.com for ${query}, waiting...`);
        await this.sleep(60000); // Wait 1 minute
        return [];
      } else if (error.response?.status === 401) {
        console.error('❌ Archive.com API key invalid or expired');
        return [];
      } else {
        console.error(`Failed to search ${type} "${query}" on ${platform}:`, error.message);
        return [];
      }
    }
  }

  /**
   * 📝 Process found post and check if it's from a tracked influencer
   */
  async processFoundPost(post, searchType, searchTerm) {
    try {
      // Find influencer by handle
      const influencer = await this.findInfluencerByHandle(post.author_handle || post.username);
      
      if (!influencer) {
        // Not a tracked influencer, but log for potential discovery
        console.log(`   👤 Untracked user posted about "${searchTerm}": @${post.author_handle || post.username}`);
        return { isNew: false, post: null };
      }

      // Check if this is a new post
      const isNewPost = await this.isNewPost(post);
      if (!isNewPost) {
        return { isNew: false, post: null };
      }

      console.log(`🎉 NEW POST DETECTED! @${influencer.instagram_handle} posted: ${post.url || post.permalink}`);

      // Analyze post content
      const contentAnalysis = await this.analyzePostContent(post, searchType, searchTerm);
      
      // Create comprehensive post record
      const postData = await this.createPostRecord(post, influencer, contentAnalysis, searchType, searchTerm);
      
      // Update influencer journey
      await this.updateInfluencerJourney(influencer, post, contentAnalysis);
      
      // Send immediate Slack notification
      await this.sendImmediatePostNotification(influencer, post, contentAnalysis);
      
      return { isNew: true, post: postData };
      
    } catch (error) {
      console.error('Error processing found post:', error);
      return { isNew: false, post: null };
    }
  }

  /**
   * 🧠 Enhanced content analysis with AI scoring
   */
  async analyzePostContent(post, searchType, searchTerm) {
    try {
      const caption = post.caption || post.description || '';
      const hashtags = this.extractHashtags(caption);
      const mentions = this.extractMentions(caption);
      
      // Brand compliance scoring
      const brandMentions = mentions.filter(m => 
        m.toLowerCase().includes('cosara') || 
        m.toLowerCase().includes('cosarafficial')
      );
      
      const brandHashtags = hashtags.filter(h => 
        h.toLowerCase().includes('cosara') ||
        h.toLowerCase().includes('dermapartner') ||
        h.toLowerCase().includes('ipl')
      );
      
      // Calculate compliance score (0-100)
      let complianceScore = 0;
      if (brandMentions.length > 0) complianceScore += 40;
      if (brandHashtags.length > 0) complianceScore += 30;
      if (caption.toLowerCase().includes('cosara')) complianceScore += 20;
      if (hashtags.length >= 5) complianceScore += 10;
      
      // Quality assessment
      const qualityFactors = {
        hasCaption: caption.length > 50,
        hasHashtags: hashtags.length >= 3,
        hasMentions: mentions.length > 0,
        hasMedia: post.media_urls?.length > 0 || post.media_type,
        engagementRate: this.calculateEngagementRate(post)
      };
      
      const qualityScore = Object.values(qualityFactors).filter(Boolean).length * 20;
      
      return {
        compliant: complianceScore >= 60,
        compliance_score: complianceScore,
        quality_score: qualityScore,
        brand_mentions: brandMentions,
        brand_hashtags: brandHashtags,
        total_hashtags: hashtags.length,
        total_mentions: mentions.length,
        caption_length: caption.length,
        search_type: searchType,
        search_term: searchTerm,
        quality_factors: qualityFactors,
        analysis_timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Error analyzing post content:', error);
      return {
        compliant: false,
        compliance_score: 0,
        quality_score: 0,
        error: error.message
      };
    }
  }

  /**
   * 📊 Create comprehensive post record
   */
  async createPostRecord(post, influencer, analysis, searchType, searchTerm) {
    try {
      const postData = {
        influencer_id: influencer.id,
        campaign_id: influencer.campaign_id || 'archive_detected',
        post_url: post.url || post.permalink,
        post_id: post.id || post.post_id,
        platform: post.platform || 'instagram',
        caption: post.caption || post.description || '',
        hashtags_used: this.extractHashtags(post.caption || ''),
        mentions: this.extractMentions(post.caption || ''),
        likes: post.likes_count || post.like_count || 0,
        comments: post.comments_count || post.comment_count || 0,
        views: post.views_count || post.view_count || 0,
        shares: post.shares_count || post.share_count || 0,
        engagement_rate: this.calculateEngagementRate(post, influencer),
        posted_at: new Date(post.created_at || post.timestamp),
        content_type: post.media_type || 'image',
        media_urls: post.media_urls || [],
        
        // Archive.com specific data
        detected_via: 'archive_com',
        search_type: searchType,
        search_term: searchTerm,
        archive_post_id: post.archive_id,
        
        // Analysis results
        brand_compliant: analysis.compliant,
        compliance_score: analysis.compliance_score,
        quality_score: analysis.quality_score,
        brand_mentions: analysis.brand_mentions,
        brand_hashtags: analysis.brand_hashtags,
        
        // Timestamps
        detected_at: new Date(),
        archived_at: new Date(post.archived_at || Date.now()),
        
        // Status
        status: 'detected',
        review_required: analysis.compliance_score < 60
      };

      const createdPost = await posts.create(postData);
      console.log(`   📝 Created post record: ${createdPost.id}`);
      
      return createdPost;
      
    } catch (error) {
      console.error('Error creating post record:', error);
      throw error;
    }
  }

  /**
   * 🚀 Send immediate Slack notification for new post
   */
  async sendImmediatePostNotification(influencer, post, analysis) {
    try {
      const slackService = require('./slack');
      
      const complianceEmoji = analysis.compliant ? '✅' : '⚠️';
      const qualityEmoji = analysis.quality_score >= 80 ? '🌟' : analysis.quality_score >= 60 ? '👍' : '📝';
      
      const message = {
        text: `🎉 NEW POST DETECTED via Archive.com!`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎉 NEW INFLUENCER POST DETECTED!'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Influencer:* @${influencer.instagram_handle}`
              },
              {
                type: 'mrkdwn',
                text: `*Platform:* ${post.platform || 'Instagram'}`
              },
              {
                type: 'mrkdwn',
                text: `*Compliance:* ${complianceEmoji} ${analysis.compliance_score}%`
              },
              {
                type: 'mrkdwn',
                text: `*Quality:* ${qualityEmoji} ${analysis.quality_score}%`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Post URL:* ${post.url || post.permalink}\n*Engagement:* ${post.likes_count || 0} likes, ${post.comments_count || 0} comments\n*Brand Mentions:* ${analysis.brand_mentions?.length || 0}\n*Brand Hashtags:* ${analysis.brand_hashtags?.length || 0}`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Caption Preview:*\n${(post.caption || '').substring(0, 200)}${(post.caption || '').length > 200 ? '...' : ''}`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '👀 View Post'
                },
                url: post.url || post.permalink,
                style: 'primary'
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '📊 View Analytics'
                },
                url: `${process.env.APP_URL}/dashboard/influencer/${influencer.id}`
              }
            ]
          }
        ]
      };

      await slackService.sendMessage(message);
      console.log(`   📢 Sent immediate Slack notification for @${influencer.instagram_handle}`);
      
    } catch (error) {
      console.error('Error sending immediate post notification:', error);
    }
  }

  /**
   * 📈 Send monitoring summary to Slack
   */
  async sendMonitoringSummary(detectedPosts, totalMonitored) {
    try {
      const slackService = require('./slack');
      
      const platformBreakdown = {};
      const influencerBreakdown = {};
      
      detectedPosts.forEach(post => {
        const platform = post.platform || 'instagram';
        platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
        
        const handle = post.influencer_handle || 'unknown';
        influencerBreakdown[handle] = (influencerBreakdown[handle] || 0) + 1;
      });
      
      const message = {
        text: `📊 Archive.com Monitoring Summary`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📊 Archive.com Monitoring Summary'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Total Posts Monitored:* ${totalMonitored}`
              },
              {
                type: 'mrkdwn',
                text: `*New Posts Detected:* ${detectedPosts.length}`
              },
              {
                type: 'mrkdwn',
                text: `*Platforms:* ${Object.keys(platformBreakdown).join(', ')}`
              },
              {
                type: 'mrkdwn',
                text: `*Active Influencers:* ${Object.keys(influencerBreakdown).length}`
              }
            ]
          }
        ]
      };
      
      if (Object.keys(platformBreakdown).length > 0) {
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Platform Breakdown:*\n${Object.entries(platformBreakdown).map(([platform, count]) => `• ${platform}: ${count} posts`).join('\n')}`
          }
        });
      }
      
      await slackService.sendMessage(message);
      
    } catch (error) {
      console.error('Error sending monitoring summary:', error);
    }
  }

  /**
   * 🚀 Update influencer journey with post data
   */
  async updateInfluencerJourney(influencer, post, analysis) {
    try {
      const { influencers } = require('./database');
      
      await influencers.updateJourney(influencer.id, 'content_posted', {
        post_url: post.url || post.permalink,
        post_likes: post.likes_count || post.like_count || 0,
        post_comments: post.comments_count || post.comment_count || 0,
        post_views: post.views_count || post.view_count || 0,
        post_shares: post.shares_count || post.share_count || 0,
        content_quality: analysis.quality_score,
        compliance_score: analysis.compliance_score,
        platform: post.platform || 'instagram',
        detected_via: 'archive_com',
        brand_mentions: analysis.brand_mentions?.length || 0,
        brand_hashtags: analysis.brand_hashtags?.length || 0
      });
      
      // Update influencer status
      await influencers.update(influencer.id, {
        status: 'content_posted',
        latest_post: {
          url: post.url || post.permalink,
          posted_at: new Date(post.created_at || post.timestamp),
          compliance_score: analysis.compliance_score,
          quality_score: analysis.quality_score,
          platform: post.platform || 'instagram'
        }
      });
      
      console.log(`   📝 Updated influencer journey for @${influencer.instagram_handle}`);
      
    } catch (error) {
      console.error('Error updating influencer journey:', error);
    }
  }

  /**
   * 👤 Find influencer by Instagram handle
   */
  async findInfluencerByHandle(handle) {
    try {
      if (!handle) return null;
      
      // Normalize handle (remove @ if present, add if missing)
      const normalizedHandle = handle.startsWith('@') ? handle : `@${handle}`;
      const handleWithoutAt = handle.startsWith('@') ? handle.substring(1) : handle;
      
      const { influencers } = require('./database');
      
      // Try both formats
      let influencer = await influencers.getByHandle(normalizedHandle);
      if (!influencer) {
        influencer = await influencers.getByHandle(handleWithoutAt);
      }
      
      return influencer;
    } catch (error) {
      console.error('Error finding influencer by handle:', error);
      return null;
    }
  }

  /**
   * 🆕 Check if this is a new post we haven't processed
   */
  async isNewPost(post) {
    try {
      const { posts } = require('./database');
      
      const postUrl = post.url || post.permalink;
      const postId = post.id || post.post_id;
      
      if (!postUrl && !postId) {
        return false; // Can't verify without URL or ID
      }
      
      // Check by URL first
      if (postUrl) {
        const existingPost = await posts.getByUrl(postUrl);
        if (existingPost) {
          return false;
        }
      }
      
      // Check by post ID if available
      if (postId) {
        const existingPost = await posts.getByPostId(postId);
        if (existingPost) {
          return false;
        }
      }
      
      return true; // New post
      
    } catch (error) {
      console.error('Error checking if post is new:', error);
      return true; // Assume new if we can't check
    }
  }

  /**
   * 📅 Get search timestamp for recent content
   */
  getSearchSince() {
    const since = new Date();
    since.setHours(since.getHours() - this.monitoringConfig.lookbackHours);
    return since.toISOString();
  }

  /**
   * #️⃣ Extract hashtags from text
   */
  extractHashtags(text) {
    if (!text) return [];
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    return text.match(hashtagRegex) || [];
  }

  /**
   * @️⃣ Extract mentions from text
   */
  extractMentions(text) {
    if (!text) return [];
    const mentionRegex = /@[\w\u0590-\u05ff]+/g;
    return text.match(mentionRegex) || [];
  }

  /**
   * 📊 Calculate engagement rate
   */
  calculateEngagementRate(post, influencer = null) {
    try {
      const likes = post.likes_count || post.like_count || 0;
      const comments = post.comments_count || post.comment_count || 0;
      const shares = post.shares_count || post.share_count || 0;
      const totalEngagement = likes + comments + shares;
      
      // Use influencer's follower count if available, otherwise estimate
      const followerCount = influencer?.follower_count || post.author_followers || 10000;
      
      if (followerCount === 0) return 0;
      
      return (totalEngagement / followerCount) * 100;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 💤 Sleep utility for rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🧪 Test Archive.com API connection
   */
  async testConnection() {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Archive.com API key not configured'
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/account`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return {
        success: true,
        message: 'Archive.com connection successful',
        account: response.data.account || {},
        rate_limits: response.data.rate_limits || {}
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Archive.com connection test failed'
      };
    }
  }

  /**
   * 📊 Get monitoring statistics
   */
  getMonitoringStats() {
    return {
      service: 'Archive.com',
      configured: this.isConfigured,
      platforms: this.monitoringConfig.platforms,
      search_interval: this.monitoringConfig.searchInterval,
      max_posts_per_search: this.monitoringConfig.maxPostsPerSearch,
      lookback_hours: this.monitoringConfig.lookbackHours,
      last_check: this.lastCheckTime || null
    };
  }
}

module.exports = new ArchiveService(); 
