/**
 * 📸 Post Detection Service
 * Monitors influencer posts and tracks content delivery
 */

class PostDetectionService {
  constructor() {
    this.brandKeywords = [
      'cosara', '@cosara.official', '#cosarapartner', 
      'ipl', 'hair removal', 'laser hair removal'
    ];
    this.monitoringQueue = [];
    this.isMonitoring = false;
    this.checkInterval = 6 * 60 * 60 * 1000; // Check every 6 hours
  }

  /**
   * 🔍 Start monitoring an influencer for posts
   */
  async startMonitoring(influencerData, options = {}) {
    const monitoringTask = {
      id: `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      influencer_id: influencerData.id,
      instagram_handle: influencerData.instagram_handle,
      campaign_id: options.campaign_id,
      product_shipped_date: options.product_shipped_date || new Date(),
      expected_post_deadline: options.expected_post_deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      monitoring_started: new Date(),
      last_checked: null,
      posts_found: [],
      status: 'active',
      check_count: 0,
      max_checks: options.max_checks || 60, // Check for 60 cycles (15 days if checking every 6 hours)
      brand_keywords: options.brand_keywords || this.brandKeywords,
      content_requirements: options.content_requirements || {
        must_tag_brand: true,
        must_show_product: true,
        min_engagement_threshold: 50
      }
    };

    this.monitoringQueue.push(monitoringTask);
    console.log(`👀 Started monitoring ${influencerData.instagram_handle} for posts`);

    // Start monitoring process if not already running
    if (!this.isMonitoring) {
      this.startMonitoringProcess();
    }

    return monitoringTask.id;
  }

  /**
   * 🔄 Start the monitoring process
   */
  async startMonitoringProcess() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🚀 Starting post monitoring process...');

    while (this.monitoringQueue.length > 0) {
      try {
        // Process active monitoring tasks
        const activeTasks = this.monitoringQueue.filter(task => task.status === 'active');
        
        for (const task of activeTasks) {
          await this.checkInfluencerPosts(task);
          
          // Small delay between checks to avoid rate limiting
          await this.sleep(5000);
        }

        // Remove completed or expired tasks
        this.monitoringQueue = this.monitoringQueue.filter(task => 
          task.status === 'active' && task.check_count < task.max_checks
        );

        // Wait before next monitoring cycle
        if (this.monitoringQueue.length > 0) {
          console.log(`⏳ Waiting ${this.checkInterval / 1000 / 60} minutes before next monitoring cycle...`);
          await this.sleep(this.checkInterval);
        }

      } catch (error) {
        console.error('Error in monitoring process:', error);
        await this.sleep(60000); // Wait 1 minute on error
      }
    }

    this.isMonitoring = false;
    console.log('✅ Post monitoring process completed');
  }

  /**
   * 🔎 Check an influencer's recent posts
   */
  async checkInfluencerPosts(task) {
    try {
      console.log(`🔍 Checking posts for ${task.instagram_handle} (Check #${task.check_count + 1})`);
      
      task.check_count++;
      task.last_checked = new Date();

      // Get recent posts from the influencer
      const recentPosts = await this.scrapeInfluencerPosts(task.instagram_handle);
      
      if (!recentPosts || recentPosts.length === 0) {
        console.log(`   ⚠️ No posts found for ${task.instagram_handle}`);
        return;
      }

      // Filter posts that might be related to our brand
      const relevantPosts = this.filterRelevantPosts(recentPosts, task);
      
      if (relevantPosts.length > 0) {
        console.log(`   ✅ Found ${relevantPosts.length} relevant posts for ${task.instagram_handle}`);
        
        for (const post of relevantPosts) {
          await this.processFoundPost(task, post);
        }
        
        task.status = 'completed';
      } else {
        console.log(`   ⏭️ No relevant posts found for ${task.instagram_handle}`);
        
        // Check if we've exceeded the deadline
        if (new Date() > task.expected_post_deadline) {
          console.log(`   ⏰ Deadline exceeded for ${task.instagram_handle}`);
          task.status = 'deadline_exceeded';
          await this.handleDeadlineExceeded(task);
        }
      }

    } catch (error) {
      console.error(`Error checking posts for ${task.instagram_handle}:`, error);
    }
  }

  /**
   * 🕷️ Scrape influencer's recent posts using Apify Instagram Profile Scraper
   */
  async scrapeInfluencerPosts(instagramHandle) {
    try {
      const username = instagramHandle.replace('@', '');
      console.log(`   📱 Scraping real posts for ${username}`);
      
      // Import Apify client
      const { ApifyClient } = require('apify-client');
      const { config } = require('../config/hardcoded-config');
      
      const client = new ApifyClient({
        token: process.env.APIFY_TOKEN || config.apis.apify.api_token,
      });
      
      // Use Apify Instagram Profile Scraper
      const run = await client.actor('apify/instagram-profile-scraper').call({
        usernames: [username],
        resultsLimit: 20,
        includeStories: false,
        includeHighlights: false,
        includePosts: true,
        includeComments: true,
        includeLikes: true,
        includeLocationInfo: true
      });
      
      console.log(`   ⏳ Waiting for Apify to scrape ${username}...`);
      const finishedRun = await client.run(run.id).waitForFinish();
      
      if (finishedRun.status !== 'SUCCEEDED') {
        console.error(`   ❌ Apify scraping failed for ${username}: ${finishedRun.status}`);
        return [];
      }
      
      const { items } = await client.dataset(finishedRun.defaultDatasetId).listItems();
      console.log(`   📊 Found ${items.length} posts for ${username}`);
      
      // Transform Apify data to our format
      const posts = items
        .filter(item => item.type === 'Post') // Only get posts, not stories
        .map(item => ({
          id: item.id,
          url: item.url,
          caption: item.caption || '',
          timestamp: item.timestamp,
          likes: item.likesCount || 0,
          comments: item.commentsCount || 0,
          media_type: item.type === 'Post' ? (item.videoUrl ? 'video' : 'photo') : 'photo',
          media_url: item.displayUrl || item.videoUrl || '',
          hashtags: this.extractHashtags(item.caption || ''),
          mentions: this.extractMentions(item.caption || ''),
          location: item.location?.name || null
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first
      
      return posts;
      
    } catch (error) {
      console.error(`Error scraping with Apify for ${instagramHandle}:`, error);
      
      // Try Instagram Private API as fallback
      try {
        console.log(`   🔄 Trying Instagram Private API for ${instagramHandle}`);
        return await this.scrapeInfluencerPostsWithPrivateAPI(instagramHandle);
      } catch (privateAPIError) {
        console.error(`Error scraping with Private API for ${instagramHandle}:`, privateAPIError);
      }
    }
  }

  /**
   * 🕷️ Alternative: Scrape using Instagram Private API (if Apify fails)
   */
  async scrapeInfluencerPostsWithPrivateAPI(instagramHandle) {
    try {
      const username = instagramHandle.replace('@', '');
      console.log(`   📱 Scraping with Instagram Private API for ${username}`);
      
      // Import DM throttling service to get Instagram client
      const dmThrottlingService = require('./dm-throttling');
      
      // Get first available Instagram client
      const igClients = dmThrottlingService.igClients;
      if (igClients.size === 0) {
        throw new Error('No Instagram clients available');
      }
      
      const ig = igClients.values().next().value;
      
      // Search for user
      const users = await ig.user.search(username);
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (!user) {
        throw new Error(`User ${username} not found`);
      }
      
      // Get user's posts
      const userFeed = ig.feed.user(user.pk);
      const posts = await userFeed.items();
      
      console.log(`   📊 Found ${posts.length} posts for ${username}`);
      
      // Transform to our format
      const transformedPosts = posts.map(post => ({
        id: post.id,
        url: `https://instagram.com/p/${post.code}`,
        caption: post.caption?.text || '',
        timestamp: new Date(post.taken_at * 1000).toISOString(),
        likes: post.like_count || 0,
        comments: post.comment_count || 0,
        media_type: post.media_type === 1 ? 'photo' : 'video',
        media_url: post.image_versions2?.candidates?.[0]?.url || post.video_versions?.[0]?.url || '',
        hashtags: this.extractHashtags(post.caption?.text || ''),
        mentions: this.extractMentions(post.caption?.text || ''),
        location: post.location?.name || null
      }));
      
      return transformedPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
    } catch (error) {
      console.error(`Error scraping with Private API for ${instagramHandle}:`, error);
      throw error;
    }
  }

  /**
   * 🏷️ Extract hashtags from text
   */
  extractHashtags(text) {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    return (text.match(hashtagRegex) || []).map(tag => tag.toLowerCase());
  }

  /**
   * 👤 Extract mentions from text
   */
  extractMentions(text) {
    const mentionRegex = /@[\w.]+/g;
    return (text.match(mentionRegex) || []).map(mention => mention.toLowerCase());
  }

  /**
   * 🎭 Generate mock posts for testing (fallback)
   */
  generateMockPosts(username) {
    const posts = [];
    const postCount = Math.floor(Math.random() * 5) + 1; // 1-5 posts
    
    for (let i = 0; i < postCount; i++) {
      const daysAgo = Math.floor(Math.random() * 7); // Posts from last 7 days
      const postDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
      
      // 20% chance of brand-related post
      const isBrandPost = Math.random() < 0.2;
      
      const post = {
        id: `post_${Date.now()}_${i}`,
        url: `https://instagram.com/p/${Math.random().toString(36).substr(2, 11)}`,
        caption: isBrandPost 
          ? `Loving my new @cosara.official IPL device! 🔥 #cosarapartner #hairremoval #beauty`
          : `Just another day in paradise ☀️ #lifestyle #mood`,
        timestamp: postDate.toISOString(),
        likes: Math.floor(Math.random() * 1000) + 100,
        comments: Math.floor(Math.random() * 50) + 5,
        media_type: Math.random() < 0.7 ? 'photo' : 'video',
        media_url: `https://example.com/media/${Math.random().toString(36).substr(2, 11)}.jpg`,
        hashtags: isBrandPost 
          ? ['cosarapartner', 'hairremoval', 'beauty', 'ipl']
          : ['lifestyle', 'mood', 'daily'],
        mentions: isBrandPost ? ['@cosara.official'] : [],
        location: null
      };
      
      posts.push(post);
    }
    
    return posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * 🎯 Filter posts that might be relevant to our brand
   */
  filterRelevantPosts(posts, task) {
    const relevantPosts = [];
    
    for (const post of posts) {
      const postDate = new Date(post.timestamp);
      const shippedDate = new Date(task.product_shipped_date);
      
      // Only consider posts after product was shipped
      if (postDate < shippedDate) continue;
      
      const relevanceScore = this.calculatePostRelevance(post, task);
      
      if (relevanceScore.score >= 0.6) { // 60% relevance threshold
        post.relevance_score = relevanceScore.score;
        post.relevance_reasons = relevanceScore.reasons;
        post.brand_compliance = this.checkBrandCompliance(post, task);
        relevantPosts.push(post);
      }
    }
    
    return relevantPosts;
  }

  /**
   * 📊 Calculate how relevant a post is to our brand
   */
  calculatePostRelevance(post, task) {
    let score = 0;
    const reasons = [];
    
    const caption = (post.caption || '').toLowerCase();
    const hashtags = (post.hashtags || []).map(tag => tag.toLowerCase());
    const mentions = (post.mentions || []).map(mention => mention.toLowerCase());
    
    // Check for brand keywords in caption
    for (const keyword of task.brand_keywords) {
      if (caption.includes(keyword.toLowerCase())) {
        score += 0.3;
        reasons.push(`Contains keyword: ${keyword}`);
      }
    }
    
    // Check for brand hashtags
    const brandHashtags = ['cosarapartner', 'cosara'];
    for (const hashtag of brandHashtags) {
      if (hashtags.includes(hashtag)) {
        score += 0.4;
        reasons.push(`Contains brand hashtag: #${hashtag}`);
      }
    }
    
    // Check for brand mentions
    const brandMentions = ['@cosara.official', '@cosara'];
    for (const mention of brandMentions) {
      if (mentions.includes(mention.toLowerCase())) {
        score += 0.5;
        reasons.push(`Mentions brand: ${mention}`);
      }
    }
    
    // Check for product-related keywords
    const productKeywords = ['ipl', 'hair removal', 'laser', 'beauty device'];
    for (const keyword of productKeywords) {
      if (caption.includes(keyword)) {
        score += 0.2;
        reasons.push(`Contains product keyword: ${keyword}`);
      }
    }
    
    // Check media type (videos often perform better)
    if (post.media_type === 'video') {
      score += 0.1;
      reasons.push('Video content');
    }
    
    return {
      score: Math.min(score, 1.0), // Cap at 100%
      reasons
    };
  }

  /**
   * ✅ Check if post meets brand compliance requirements
   */
  checkBrandCompliance(post, task) {
    const compliance = {
      meets_requirements: true,
      issues: [],
      score: 100
    };
    
    const requirements = task.content_requirements;
    const caption = (post.caption || '').toLowerCase();
    const mentions = (post.mentions || []).map(mention => mention.toLowerCase());
    
    // Check if brand is tagged
    if (requirements.must_tag_brand) {
      const hasBrandTag = mentions.some(mention => 
        mention.includes('cosara') || mention.includes('@cosara.official')
      );
      
      if (!hasBrandTag) {
        compliance.meets_requirements = false;
        compliance.issues.push('Brand not tagged');
        compliance.score -= 30;
      }
    }
    
    // Check engagement threshold
    if (requirements.min_engagement_threshold) {
      const totalEngagement = (post.likes || 0) + (post.comments || 0);
      if (totalEngagement < requirements.min_engagement_threshold) {
        compliance.issues.push(`Low engagement: ${totalEngagement} < ${requirements.min_engagement_threshold}`);
        compliance.score -= 20;
      }
    }
    
    // Check for product visibility (basic keyword check)
    if (requirements.must_show_product) {
      const hasProductKeywords = ['ipl', 'device', 'laser', 'hair removal'].some(keyword =>
        caption.includes(keyword)
      );
      
      if (!hasProductKeywords) {
        compliance.issues.push('Product not clearly shown/mentioned');
        compliance.score -= 25;
      }
    }
    
    compliance.score = Math.max(0, compliance.score);
    
    return compliance;
  }

  /**
   * 🎉 Process a found relevant post
   */
  async processFoundPost(task, post) {
    try {
      console.log(`   🎉 Processing found post: ${post.url}`);
      
      // Add to task's found posts
      task.posts_found.push({
        ...post,
        found_at: new Date(),
        processed: true
      });
      
      // Update influencer record in database
      await this.updateInfluencerWithPost(task, post);
      
      // Send notifications
      await this.sendPostFoundNotifications(task, post);
      
      // Track performance
      await this.trackPostPerformance(task, post);
      
    } catch (error) {
      console.error('Error processing found post:', error);
    }
  }

  /**
   * 📝 Update influencer record with found post
   */
  async updateInfluencerWithPost(task, post) {
    try {
      const { influencers } = require('./database');
      
      if (!task.influencer_id || task.influencer_id === 'unknown') {
        console.warn('⚠️ Cannot update influencer - invalid influencer_id');
        return;
      }
      
      await influencers.update(task.influencer_id, {
        status: 'content_posted',
        journey: {
          content_posted: true,
          posted_at: new Date(post.timestamp),
          post_url: post.url,
          post_engagement: (post.likes || 0) + (post.comments || 0),
          brand_compliance_score: post.brand_compliance?.score || 0
        },
        latest_post: {
          url: post.url,
          caption: post.caption,
          timestamp: post.timestamp,
          likes: post.likes,
          comments: post.comments,
          relevance_score: post.relevance_score,
          compliance: post.brand_compliance
        }
      });
      
      console.log(`   📝 Updated influencer ${task.instagram_handle} with post data`);
      
    } catch (error) {
      console.error('Error updating influencer with post:', error);
    }
  }

  /**
   * 📢 Send notifications about found post
   */
  async sendPostFoundNotifications(task, post) {
    try {
      const slackService = require('./slack');
      
      // Create influencer object for archiving
      const influencer = {
        id: task.influencer_id,
        instagram_handle: task.instagram_handle,
        follower_count: task.follower_count || 'Unknown'
      };
      
      // Create analysis object
      const analysis = {
        quality_score: Math.round((post.relevance_score || 0) * 100),
        compliant: (post.brand_compliance?.score || 0) >= 60,
        compliance_score: post.brand_compliance?.score || 0
      };
      
      // Enhanced post object
      const enhancedPost = {
        ...post,
        created_at: post.timestamp,
        likes_count: post.likes || 0,
        comments_count: post.comments || 0,
        engagement_rate: this.calculateEngagementRate(post, task),
        caption: post.caption || ''
      };
      
      // Check if post mentions/tags the brand
      const mentionsBrand = this.checkBrandMention(post);
      
      if (mentionsBrand) {
        // Archive the post since they tagged the brand
        await slackService.archiveInfluencerPost(influencer, enhancedPost, analysis);
        console.log(`   📁 Archived post from ${task.instagram_handle} (tagged brand)`);
      } else {
        // Just send regular notification
        await slackService.sendPostNotification(influencer, enhancedPost, analysis);
        console.log(`   📢 Sent notification for ${task.instagram_handle} post (no brand tag)`);
      }
      
    } catch (error) {
      console.error('Error sending post notifications:', error);
    }
  }

  /**
   * 🏷️ Check if post mentions or tags the brand
   */
  checkBrandMention(post) {
    const brandMentions = [
      '@cosara.official',
      '@cosara',
      '#cosara',
      '#cosarapartner',
      'cosara',
      '@cosara_official'
    ];
    
    const caption = (post.caption || '').toLowerCase();
    const hashtags = (post.hashtags || []).map(tag => tag.toLowerCase());
    const mentions = (post.mentions || []).map(mention => mention.toLowerCase());
    
    // Check caption for brand mentions
    const captionMention = brandMentions.some(mention => 
      caption.includes(mention.toLowerCase())
    );
    
    // Check hashtags
    const hashtagMention = hashtags.some(tag => 
      brandMentions.some(mention => mention.includes(tag) || tag.includes(mention.replace('#', '').replace('@', '')))
    );
    
    // Check mentions
    const mentionMatch = mentions.some(mention => 
      brandMentions.some(brand => brand.includes(mention) || mention.includes(brand.replace('@', '')))
    );
    
    return captionMention || hashtagMention || mentionMatch;
  }

  /**
   * 📊 Calculate engagement rate for post
   */
  calculateEngagementRate(post, task) {
    const totalEngagement = (post.likes || 0) + (post.comments || 0);
    const followerCount = task.follower_count || 1000; // Default fallback
    return (totalEngagement / followerCount) * 100;
  }

  /**
   * 📊 Track post performance
   */
  async trackPostPerformance(task, post) {
    try {
      const { getDb } = require('./database');
      const db = getDb();
      
      const performanceData = {
        campaign_id: task.campaign_id || 'unknown',
        influencer_id: task.influencer_id || 'unknown',
        instagram_handle: task.instagram_handle,
        post_url: post.url,
        post_timestamp: new Date(post.timestamp),
        initial_metrics: {
          likes: post.likes || 0,
          comments: post.comments || 0,
          total_engagement: (post.likes || 0) + (post.comments || 0)
        },
        relevance_score: post.relevance_score,
        compliance_score: post.brand_compliance?.score || 0,
        compliance_issues: post.brand_compliance?.issues || [],
        tracking_started: new Date(),
        status: 'tracking'
      };
      
      await db.collection('post_performance').add(performanceData);
      console.log(`   📊 Started tracking performance for ${task.instagram_handle} post`);
      
    } catch (error) {
      console.error('Error tracking post performance:', error);
    }
  }

  /**
   * ⏰ Handle when deadline is exceeded
   */
  async handleDeadlineExceeded(task) {
    try {
      console.log(`⏰ Deadline exceeded for ${task.instagram_handle}`);
      
      // Update influencer status
      const { influencers } = require('./database');
      await influencers.update(task.influencer_id, {
        status: 'deadline_exceeded',
        journey: {
          deadline_exceeded: true,
          deadline_exceeded_at: new Date()
        }
      });
      
      // Send notification
      const slackService = require('./slack');
      await slackService.sendMessage({
        text: `⏰ Content deadline exceeded for ${task.instagram_handle}. No relevant posts found within 30 days of shipment.`
      });
      
    } catch (error) {
      console.error('Error handling deadline exceeded:', error);
    }
  }

  /**
   * 📈 Get monitoring statistics
   */
  getMonitoringStats() {
    const stats = {
      total_monitoring: this.monitoringQueue.length,
      by_status: {},
      avg_checks_per_task: 0,
      posts_found_total: 0
    };
    
    let totalChecks = 0;
    
    this.monitoringQueue.forEach(task => {
      stats.by_status[task.status] = (stats.by_status[task.status] || 0) + 1;
      totalChecks += task.check_count;
      stats.posts_found_total += task.posts_found.length;
    });
    
    if (this.monitoringQueue.length > 0) {
      stats.avg_checks_per_task = totalChecks / this.monitoringQueue.length;
    }
    
    return stats;
  }

  /**
   * 🛑 Stop monitoring a specific influencer
   */
  stopMonitoring(influencerId) {
    const taskIndex = this.monitoringQueue.findIndex(task => task.influencer_id === influencerId);
    if (taskIndex !== -1) {
      this.monitoringQueue[taskIndex].status = 'stopped';
      console.log(`🛑 Stopped monitoring for influencer ${influencerId}`);
      return true;
    }
    return false;
  }

  /**
   * 💤 Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new PostDetectionService(); 