const { ApifyClient } = require('apify-client');
const { config } = require('../config/hardcoded-config');
const websocketService = require('./websocket');
const logger = require('../utils/logger');

class CompetitorDiscoveryService {
  constructor() {
    this.apifyClient = new ApifyClient({
      token: process.env.APIFY_TOKEN || config.apis.apify.api_token,
    });
  }

  /**
   * Discover influencers who have tagged competitors in their posts
   */
  async discoverInfluencersByCompetitorTags(competitorHandles, options = {}) {
    const {
      limit = 50,
      minFollowers = 1000,
      maxFollowers = 1000000,
      minEngagementRate = 0.0,
      discoveryId = null,
      location = null
    } = options;

    const currentDiscoveryId = discoveryId || `competitor_discovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🎯 Starting competitor-based discovery for: ${competitorHandles.join(', ')}`);
    console.log(`📊 Filters: ${minFollowers}-${maxFollowers} followers, ${minEngagementRate}%+ engagement`);

    // Start progress tracking
    websocketService.startDiscovery(currentDiscoveryId, location, competitorHandles, {
      limit,
      minFollowers,
      maxFollowers,
      minEngagementRate,
      discoveryType: 'competitor_tags'
    });

    try {
      const allInfluencers = [];

      for (const competitorHandle of competitorHandles) {
        const cleanHandle = competitorHandle.replace('@', '');
        
        websocketService.updateStep(currentDiscoveryId, `Analyzing ${competitorHandle} tagged posts...`, {
          progress: 20
        });

        // Get people who tagged this competitor
        const taggedUsers = await this.getUsersWhoTaggedCompetitor(cleanHandle, {
          limit: Math.ceil(limit / competitorHandles.length),
          minFollowers,
          maxFollowers,
          minEngagementRate
        });

        allInfluencers.push(...taggedUsers);
        
        websocketService.updateStep(currentDiscoveryId, `Found ${taggedUsers.length} users who tagged ${competitorHandle}`, {
          progress: 40 + (competitorHandles.indexOf(competitorHandle) * 20)
        });
      }

      // Remove duplicates and enrich profiles
      const uniqueInfluencers = this.removeDuplicates(allInfluencers);
      
      websocketService.updateStep(currentDiscoveryId, `Enriching ${uniqueInfluencers.length} unique profiles...`, {
        progress: 80
      });

      // Enrich profiles with additional data
      const enrichedInfluencers = await this.enrichInfluencerProfiles(uniqueInfluencers);

      websocketService.completeDiscovery(currentDiscoveryId, {
        influencersFound: enrichedInfluencers.length,
        discoveryType: 'competitor_tags',
        competitors: competitorHandles
      });

      console.log(`✅ Competitor discovery completed: ${enrichedInfluencers.length} influencers found`);
      return enrichedInfluencers;

    } catch (error) {
      console.error('❌ Competitor discovery failed:', error);
      websocketService.failDiscovery(currentDiscoveryId, error.message);
      throw error;
    }
  }

  /**
   * Get users who have tagged a specific competitor in their posts
   */
  async getUsersWhoTaggedCompetitor(competitorHandle, options = {}) {
    try {
      console.log(`🔍 Finding users who tagged @${competitorHandle}...`);

      // Use Apify Instagram Hashtag Scraper to find posts mentioning the competitor
      const run = await this.apifyClient.actor('apify/instagram-hashtag-scraper').call({
        hashtags: [`@${competitorHandle}`], // Search for posts mentioning the competitor
        resultsLimit: options.limit * 3, // Get more posts to find more users
        includePosts: true,
        includeComments: true,
        includeLikes: true
      });

      console.log(`⏳ Waiting for Apify to find posts mentioning @${competitorHandle}...`);
      const finishedRun = await this.apifyClient.run(run.id).waitForFinish();

      if (finishedRun.status !== 'SUCCEEDED') {
        console.error(`❌ Apify scraping failed for @${competitorHandle}: ${finishedRun.status}`);
        return [];
      }

      const { items } = await this.apifyClient.dataset(finishedRun.defaultDatasetId).listItems();
      console.log(`📊 Found ${items.length} posts mentioning @${competitorHandle}`);

      // Extract unique users from posts
      const users = new Map();
      
      for (const item of items) {
        if (item.type === 'Post' && item.owner) {
          const user = item.owner;
          
          // Apply follower filters
          if (user.followersCount < options.minFollowers || user.followersCount > options.maxFollowers) {
            continue;
          }

          // Calculate engagement rate if possible
          const engagementRate = this.calculateEngagementRate(user);
          if (engagementRate < options.minEngagementRate) {
            continue;
          }

          // Store user data
          if (!users.has(user.username)) {
            users.set(user.username, {
              instagram_handle: `@${user.username}`,
              full_name: user.fullName || user.username,
              name: user.fullName || user.username,
              followers: user.followersCount,
              follower_count: user.followersCount,
              following: user.followsCount || 0,
              posts_count: user.mediaCount || 0,
              bio: user.biography || '',
              profile_picture: user.profilePicUrl || '',
              avatar: user.profilePicUrl || '',
              is_verified: user.isVerified || false,
              is_private: user.isPrivate || false,
              engagement_rate: engagementRate,
              discovery_source: 'competitor_tags',
              competitor_tagged: competitorHandle,
              last_post_date: item.timestamp ? new Date(item.timestamp).toISOString() : null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      const userArray = Array.from(users.values());
      console.log(`👥 Found ${userArray.length} unique users who tagged @${competitorHandle}`);
      return userArray;

    } catch (error) {
      console.error(`❌ Error finding users who tagged @${competitorHandle}:`, error);
      return [];
    }
  }

  /**
   * Calculate engagement rate for a user
   */
  calculateEngagementRate(user) {
    if (!user.followersCount || user.followersCount === 0) return 0;
    
    // Estimate engagement based on available data
    const estimatedLikes = user.followersCount * 0.02; // Assume 2% of followers like posts
    const estimatedComments = user.followersCount * 0.001; // Assume 0.1% comment
    
    const totalEngagement = estimatedLikes + estimatedComments;
    return (totalEngagement / user.followersCount) * 100;
  }

  /**
   * Remove duplicate influencers based on Instagram handle
   */
  removeDuplicates(influencers) {
    const seen = new Set();
    return influencers.filter(influencer => {
      if (seen.has(influencer.instagram_handle)) {
        return false;
      }
      seen.add(influencer.instagram_handle);
      return true;
    });
  }

  /**
   * Enrich influencer profiles with additional data
   */
  async enrichInfluencerProfiles(influencers) {
    const enrichedInfluencers = [];

    for (const influencer of influencers) {
      try {
        // Get additional profile data using Instagram Profile Scraper
        const profileData = await this.getProfileData(influencer.instagram_handle);
        
        if (profileData) {
          enrichedInfluencers.push({
            ...influencer,
            ...profileData,
            updated_at: new Date().toISOString()
          });
        } else {
          enrichedInfluencers.push(influencer);
        }
      } catch (error) {
        console.error(`⚠️ Could not enrich profile for ${influencer.instagram_handle}:`, error.message);
        enrichedInfluencers.push(influencer);
      }
    }

    return enrichedInfluencers;
  }

  /**
   * Get detailed profile data for an influencer
   */
  async getProfileData(instagramHandle) {
    try {
      const username = instagramHandle.replace('@', '');
      
      const run = await this.apifyClient.actor('apify/instagram-profile-scraper').call({
        usernames: [username],
        resultsLimit: 1,
        includePosts: true,
        includeStories: false,
        includeHighlights: false
      });

      const finishedRun = await this.apifyClient.run(run.id).waitForFinish();
      
      if (finishedRun.status !== 'SUCCEEDED') {
        return null;
      }

      const { items } = await this.apifyClient.dataset(finishedRun.defaultDatasetId).listItems();
      const profile = items.find(item => item.type === 'Profile');
      
      if (!profile) return null;

      return {
        full_name: profile.fullName || profile.username,
        name: profile.fullName || profile.username,
        followers: profile.followersCount,
        follower_count: profile.followersCount,
        following: profile.followsCount || 0,
        posts_count: profile.mediaCount || 0,
        bio: profile.biography || '',
        profile_picture: profile.profilePicUrl || '',
        avatar: profile.profilePicUrl || '',
        is_verified: profile.isVerified || false,
        is_private: profile.isPrivate || false,
        external_url: profile.externalUrl || '',
        business_category: profile.businessCategory || '',
        contact_phone: profile.contactPhone || '',
        contact_email: profile.contactEmail || ''
      };

    } catch (error) {
      console.error(`Error getting profile data for ${instagramHandle}:`, error);
      return null;
    }
  }

  /**
   * Discover influencers by analyzing competitor's followers
   */
  async discoverInfluencersByCompetitorFollowers(competitorHandles, options = {}) {
    const {
      limit = 50,
      minFollowers = 1000,
      maxFollowers = 1000000,
      discoveryId = null
    } = options;

    const currentDiscoveryId = discoveryId || `competitor_followers_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`👥 Starting competitor follower analysis for: ${competitorHandles.join(', ')}`);

    websocketService.startDiscovery(currentDiscoveryId, null, competitorHandles, {
      limit,
      minFollowers,
      maxFollowers,
      discoveryType: 'competitor_followers'
    });

    try {
      const allInfluencers = [];

      for (const competitorHandle of competitorHandles) {
        const cleanHandle = competitorHandle.replace('@', '');
        
        websocketService.updateStep(currentDiscoveryId, `Analyzing ${competitorHandle} followers...`, {
          progress: 20
        });

        // Get competitor's followers
        const followers = await this.getCompetitorFollowers(cleanHandle, {
          limit: Math.ceil(limit / competitorHandles.length),
          minFollowers,
          maxFollowers
        });

        allInfluencers.push(...followers);
        
        websocketService.updateStep(currentDiscoveryId, `Found ${followers.length} potential influencers from ${competitorHandle} followers`, {
          progress: 40 + (competitorHandles.indexOf(competitorHandle) * 20)
        });
      }

      const uniqueInfluencers = this.removeDuplicates(allInfluencers);
      const enrichedInfluencers = await this.enrichInfluencerProfiles(uniqueInfluencers);

      websocketService.completeDiscovery(currentDiscoveryId, {
        influencersFound: enrichedInfluencers.length,
        discoveryType: 'competitor_followers',
        competitors: competitorHandles
      });

      console.log(`✅ Competitor follower analysis completed: ${enrichedInfluencers.length} influencers found`);
      return enrichedInfluencers;

    } catch (error) {
      console.error('❌ Competitor follower analysis failed:', error);
      websocketService.failDiscovery(currentDiscoveryId, error.message);
      throw error;
    }
  }

  /**
   * Get followers of a competitor account
   */
  async getCompetitorFollowers(competitorHandle, options = {}) {
    try {
      console.log(`👥 Getting followers of @${competitorHandle}...`);

      const run = await this.apifyClient.actor('apify/instagram-profile-scraper').call({
        usernames: [competitorHandle],
        resultsLimit: 1,
        includeFollowers: true,
        includePosts: false
      });

      const finishedRun = await this.apifyClient.run(run.id).waitForFinish();
      
      if (finishedRun.status !== 'SUCCEEDED') {
        console.error(`❌ Failed to get followers for @${competitorHandle}: ${finishedRun.status}`);
        return [];
      }

      const { items } = await this.apifyClient.dataset(finishedRun.defaultDatasetId).listItems();
      const profile = items.find(item => item.type === 'Profile');
      
      if (!profile || !profile.followers) {
        console.log(`⚠️ No followers data available for @${competitorHandle}`);
        return [];
      }

      // Filter followers based on criteria
      const filteredFollowers = profile.followers
        .filter(follower => 
          follower.followersCount >= options.minFollowers && 
          follower.followersCount <= options.maxFollowers
        )
        .slice(0, options.limit)
        .map(follower => ({
          instagram_handle: `@${follower.username}`,
          full_name: follower.fullName || follower.username,
          name: follower.fullName || follower.username,
          followers: follower.followersCount,
          follower_count: follower.followersCount,
          following: follower.followsCount || 0,
          bio: follower.biography || '',
          profile_picture: follower.profilePicUrl || '',
          avatar: follower.profilePicUrl || '',
          is_verified: follower.isVerified || false,
          is_private: follower.isPrivate || false,
          discovery_source: 'competitor_followers',
          competitor_followed: competitorHandle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

      console.log(`👥 Found ${filteredFollowers.length} potential influencers from @${competitorHandle} followers`);
      return filteredFollowers;

    } catch (error) {
      console.error(`❌ Error getting followers for @${competitorHandle}:`, error);
      return [];
    }
  }
}

module.exports = new CompetitorDiscoveryService();
