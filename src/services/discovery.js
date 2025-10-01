const { ApifyClient } = require('apify-client');
const { config } = require('../config/hardcoded-config');

/**
 * 🔍 Influencer Discovery Service
 * Discovers relevant influencers based on hashtags and criteria
 */
class DiscoveryService {
  constructor() {
    this.apifyClient = new ApifyClient({
      token: config.apis.apify.api_token
    });
  }

  /**
   * ✨ Discover influencers based on criteria
   */
  async discoverInfluencers(criteria) {
    try {
      console.log('🔍 Starting influencer discovery:', criteria);
      
      const {
        hashtags,
        count,
        follower_range,
        countries,
        campaign_id
      } = criteria;

      let allInfluencers = [];
      
      // Search for each hashtag
      for (const hashtag of hashtags) {
        try {
          console.log(`🏷️ Searching hashtag: ${hashtag}`);
          
          const hashtagInfluencers = await this.searchHashtag(hashtag, {
            maxResults: Math.ceil(count / hashtags.length) + 10, // Extra buffer
            follower_range,
            countries
          });
          
          allInfluencers = [...allInfluencers, ...hashtagInfluencers];
          
        } catch (error) {
          console.error(`Error searching hashtag ${hashtag}:`, error);
        }
      }
      
      // Remove duplicates and filter
      const uniqueInfluencers = this.deduplicateInfluencers(allInfluencers);
      const filteredInfluencers = await this.filterInfluencers(uniqueInfluencers, criteria);
      
      // Limit to requested count
      const selectedInfluencers = filteredInfluencers.slice(0, count);
      
      // Save to database
      const savedCount = await this.saveInfluencers(selectedInfluencers, campaign_id);
      
      console.log(`✅ Discovery completed: ${savedCount} influencers saved`);
      
      return {
        discovered: savedCount,
        total_found: uniqueInfluencers.length,
        hashtags_searched: hashtags.length,
        campaign_id
      };
      
    } catch (error) {
      console.error('Discovery failed:', error);
      throw error;
    }
  }

  /**
   * Search influencers by hashtag using Apify
   */
  async searchHashtag(hashtag, options = {}) {
    try {
      const input = {
        hashtags: [hashtag.replace('#', '')],
        resultsLimit: options.maxResults || 50,
        resultsType: 'posts',
        searchType: 'hashtag',
        addParentData: true
      };

      console.log(`🤖 Running Apify scraper for ${hashtag}...`);
      
      // Run the Instagram scraper
      const run = await this.apifyClient.actor(config.apis.apify.instagram_scraper_id).call(input);
      
      // Get results
      const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();
      
      const influencers = [];
      
      for (const item of items) {
        if (item.ownerUsername && item.ownerFullName) {
          // Extract influencer data
          const influencer = {
            instagram_handle: item.ownerUsername,
            full_name: item.ownerFullName,
            followers_count: item.ownerFollowersCount || 0,
            following_count: item.ownerFollowingCount || 0,
            posts_count: item.ownerMediaCount || 0,
            is_verified: item.ownerIsVerified || false,
            profile_pic_url: item.ownerProfilePicUrl,
            bio: item.ownerBiography || '',
            external_url: item.ownerExternalUrl || '',
            is_business: item.ownerIsBusinessAccount || false,
            category: item.ownerBusinessCategoryName || '',
            
            // Post data
            recent_post: {
              id: item.id,
              shortcode: item.shortCode,
              caption: item.caption,
              likes_count: item.likesCount || 0,
              comments_count: item.commentsCount || 0,
              timestamp: item.timestamp,
              hashtags: item.hashtags || [],
              mentions: item.mentions || []
            },
            
            // Discovery metadata
            discovered_via: hashtag,
            discovered_at: new Date(),
            engagement_rate: this.calculateEngagementRate(item)
          };
          
          influencers.push(influencer);
        }
      }
      
      console.log(`📊 Found ${influencers.length} influencers for ${hashtag}`);
      return influencers;
      
    } catch (error) {
      console.error(`Error searching hashtag ${hashtag}:`, error);
      return [];
    }
  }

  /**
   * Calculate engagement rate from post data
   */
  calculateEngagementRate(postData) {
    const followers = postData.ownerFollowersCount || 1;
    const likes = postData.likesCount || 0;
    const comments = postData.commentsCount || 0;
    
    // Prevent division by zero and ensure valid numbers
    if (followers <= 0) return 0;
    if (isNaN(likes) || isNaN(comments) || isNaN(followers)) return 0;
    
    return ((likes + comments) / followers) * 100;
  }

  /**
   * Remove duplicate influencers
   */
  deduplicateInfluencers(influencers) {
    const seen = new Set();
    return influencers.filter(influencer => {
      const key = influencer.instagram_handle.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Filter influencers based on criteria with enhanced verification
   */
  async filterInfluencers(influencers, criteria) {
    const filteredInfluencers = [];
    
    for (const influencer of influencers) {
      try {
        // Follower count filter
        if (criteria.follower_range) {
          const followers = influencer.followers_count;
          if (followers < criteria.follower_range.min || followers > criteria.follower_range.max) {
            continue;
          }
        }
        
        // 🌍 Enhanced geo-verification
        if (criteria.check_geo !== false) {
          const geoVerification = require('./geo-verification');
          const geoCheck = await geoVerification.verifyInfluencerLocation(influencer);
          if (!geoCheck.eligible || geoCheck.confidence < 0.5) {
            console.log(`   ⏭️ Skipped ${influencer.instagram_handle}: Geo-verification failed`);
            continue;
          }
          influencer.geo_verification = geoCheck;
        }

        // 📊 Enhanced engagement rate checking
        if (criteria.check_engagement !== false && influencer.recent_posts) {
          const engagementCalculator = require('./engagement-calculator');
          const engagementValidation = await engagementCalculator.validateInfluencerEngagement(
            influencer, 
            influencer.recent_posts
          );
          
          if (!engagementValidation.passed) {
            console.log(`   ⏭️ Skipped ${influencer.instagram_handle}: ${engagementValidation.reasons.join(', ')}`);
            continue;
          }
          
          influencer.engagement_analysis = engagementValidation;
        } else {
          // Fallback to basic engagement rate check
          if (influencer.engagement_rate < 1.0) {
            continue;
          }
        }
        
        // Bio quality filter (has bio)
        if (!influencer.bio || influencer.bio.length < 10) {
          continue;
        }
        
        // Calculate quality score with new data
        influencer.quality_score = this.calculateQualityScore(influencer);
        
        filteredInfluencers.push(influencer);
        console.log(`   ✅ Qualified ${influencer.instagram_handle} (Quality: ${influencer.quality_score}/100)`);

      } catch (error) {
        console.error(`Error filtering ${influencer.instagram_handle}:`, error);
        // Continue with next influencer
      }
    }

    // Sort by quality score
    return filteredInfluencers.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0));
  }

  /**
   * Save influencers to database
   */
  async saveInfluencers(influencers, campaignId) {
    try {
      const { database } = require('./database');
      const supabase = require('./supabase');
      
      let savedCount = 0;
      
      for (const influencer of influencers) {
        try {
          // Check if influencer already exists
          const { data: existingData, error: queryError } = await supabase.supabase()
            .from('influencers')
            .select('*')
            .eq('instagram_handle', influencer.instagram_handle)
            .limit(1)
            .single();
          
          if (existingData && !queryError) {
            // Update existing influencer with new campaign
            const campaigns = existingData.campaigns || [];
            if (!campaigns.includes(campaignId)) {
              campaigns.push(campaignId);
              
              await supabase.supabase()
                .from('influencers')
                .update({
                  campaigns,
                  last_discovered: new Date().toISOString(),
                  discovery_count: (existingData.discovery_count || 0) + 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingData.id);
            }
          } else {
            // Create new influencer record
            const influencerData = {
              ...influencer,
              campaigns: [campaignId],
              status: 'discovered',
              journey: {
                discovered_at: new Date().toISOString(),
                current_stage: 'discovered',
                stages: ['discovered']
              },
              discovery_count: 1,
              quality_score: this.calculateQualityScore(influencer),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            await supabase.supabase()
              .from('influencers')
              .insert([influencerData]);
          }
          
          savedCount++;
          
        } catch (error) {
          console.error(`Error saving influencer ${influencer.instagram_handle}:`, error);
        }
      }
      
      return savedCount;
      
    } catch (error) {
      console.error('Error saving influencers:', error);
      return 0;
    }
  }

  /**
   * Calculate quality score for influencer
   */
  calculateQualityScore(influencer) {
    let score = 0;
    
    // Validate engagement rate to prevent NaN
    const engagementRate = isNaN(influencer.engagement_rate) || influencer.engagement_rate === null || influencer.engagement_rate === undefined ? 0 : influencer.engagement_rate;
    
    // Engagement rate (40 points max)
    score += Math.min(engagementRate * 4, 40);
    
    // Follower count (20 points max)
    const followers = isNaN(influencer.followers_count) || influencer.followers_count === null || influencer.followers_count === undefined ? 0 : influencer.followers_count;
    if (followers >= 10000 && followers <= 100000) {
      score += 20; // Sweet spot
    } else if (followers > 100000) {
      score += 15; // Still good but less personal
    } else {
      score += 10; // Too small
    }
    
    // Bio quality (15 points max)
    if (influencer.bio) {
      score += Math.min(influencer.bio.length / 10, 15);
    }
    
    // Business account (10 points)
    if (influencer.is_business) {
      score += 10;
    }
    
    // Verified account (10 points)
    if (influencer.is_verified) {
      score += 10;
    }
    
    // External URL (5 points)
    if (influencer.external_url) {
      score += 5;
    }
    
    return Math.min(score, 100);
  }

  /**
   * ✨ Get discovery statistics
   */
  async getDiscoveryStats(campaignId = null) {
    try {
      const supabase = require('./supabase');
      
      let query = supabase.supabase().from('influencers').select('*');
      
      if (campaignId) {
        query = query.contains('campaigns', [campaignId]);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const stats = {
        total_discovered: data ? data.length : 0,
        by_status: {},
        avg_quality_score: 0,
        avg_engagement_rate: 0,
        follower_distribution: {
          micro: 0,    // 10K-50K
          mid: 0,      // 50K-100K
          macro: 0     // 100K+
        }
      };
      
      let totalQuality = 0;
      let totalEngagement = 0;
      
      if (data) {
        data.forEach(influencer => {
        
        // Status distribution
        const status = influencer.status || 'unknown';
        stats.by_status[status] = (stats.by_status[status] || 0) + 1;
        
        // Quality and engagement
        totalQuality += influencer.quality_score || 0;
        totalEngagement += influencer.engagement_rate || 0;
        
        // Follower distribution
        const followers = influencer.followers_count || 0;
        if (followers >= 100000) {
          stats.follower_distribution.macro++;
        } else if (followers >= 50000) {
          stats.follower_distribution.mid++;
        } else if (followers >= 10000) {
          stats.follower_distribution.micro++;
        }
        });
      }
      
      if (data && data.length > 0) {
        stats.avg_quality_score = totalQuality / data.length;
        stats.avg_engagement_rate = totalEngagement / data.length;
      }
      
      return stats;
      
    } catch (error) {
      console.error('Error getting discovery stats:', error);
      return null;
    }
  }
}

module.exports = new DiscoveryService(); 