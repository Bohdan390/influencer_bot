/**
 * 🏷️ Hashtag Performance Tracker
 * Tracks which hashtags perform best for different:
 * - Product types
 * - Influencer avatars/personas
 * - Geographic regions
 * - Campaign objectives
 */
class HashtagPerformanceTracker {
  constructor() {
    this.performanceCache = new Map();
    this.avatarProfiles = new Map();
  }

  /**
   * ✨ Track hashtag performance for a campaign
   */
  async trackHashtagPerformance(campaignId, hashtags, metrics) {
    try {
      const { getDb } = require('./database');
      const db = getDb();
      
      const performanceData = {
        campaign_id: campaignId,
        hashtags: hashtags,
        metrics: {
          discovery_rate: metrics.discovery_rate || 0, // How many influencers found
          response_rate: metrics.response_rate || 0,   // % who responded
          conversion_rate: metrics.conversion_rate || 0, // % who agreed
          engagement_quality: metrics.engagement_quality || 0, // Avg engagement rate
          shipping_rate: metrics.shipping_rate || 0    // % who got products shipped
        },
        timestamp: new Date(),
        product_type: metrics.product_type,
        target_countries: metrics.target_countries || [],
        follower_range: metrics.follower_range
      };

      // Save to database
      await db.collection('hashtag_performance').add(performanceData);
      
      // Update performance cache
      for (const hashtag of hashtags) {
        await this.updateHashtagScore(hashtag, performanceData);
      }
      
      console.log(`📊 Tracked performance for ${hashtags.length} hashtags in campaign ${campaignId}`);
      
      return performanceData;
    } catch (error) {
      console.error('Error tracking hashtag performance:', error);
      throw error;
    }
  }

  /**
   * ✨ Update individual hashtag performance score
   */
  async updateHashtagScore(hashtag, performanceData) {
    try {
      const { getDb } = require('./database');
      const db = getDb();
      
      // Calculate composite score (weighted average)
      const weights = {
        discovery_rate: 0.2,
        response_rate: 0.3,
        conversion_rate: 0.3,
        engagement_quality: 0.1,
        shipping_rate: 0.1
      };
      
      const compositeScore = Object.entries(weights).reduce((score, [metric, weight]) => {
        return score + (performanceData.metrics[metric] * weight);
      }, 0);
      
      // Get existing hashtag data or create new
      const hashtagRef = db.collection('hashtag_scores').doc(hashtag.replace('#', ''));
      const existingDoc = await hashtagRef.get();
      
      let hashtagData;
      if (existingDoc.exists) {
        hashtagData = existingDoc.data();
        
        // Update running averages
        const totalCampaigns = hashtagData.campaign_count + 1;
        hashtagData.average_score = ((hashtagData.average_score * hashtagData.campaign_count) + compositeScore) / totalCampaigns;
        hashtagData.campaign_count = totalCampaigns;
        hashtagData.last_updated = new Date();
        
        // Update metrics
        Object.keys(weights).forEach(metric => {
          const currentAvg = hashtagData.metrics[metric] || 0;
          hashtagData.metrics[metric] = ((currentAvg * (totalCampaigns - 1)) + performanceData.metrics[metric]) / totalCampaigns;
        });
        
      } else {
        // Create new hashtag record
        hashtagData = {
          hashtag: hashtag,
          average_score: compositeScore,
          campaign_count: 1,
          first_used: new Date(),
          last_updated: new Date(),
          metrics: { ...performanceData.metrics },
          product_types: [performanceData.product_type],
          countries: performanceData.target_countries || []
        };
      }
      
      // Track product types this hashtag works for
      if (!hashtagData.product_types.includes(performanceData.product_type)) {
        hashtagData.product_types.push(performanceData.product_type);
      }
      
      // Save updated data
      await hashtagRef.set(hashtagData);
      
      // Update cache
      this.performanceCache.set(hashtag, hashtagData);
      
    } catch (error) {
      console.error(`Error updating hashtag score for ${hashtag}:`, error);
    }
  }

  /**
   * ✨ Get best performing hashtags for a product type
   */
  async getBestHashtagsForProduct(productType, limit = 10) {
    try {
      const { getDb } = require('./database');
      const db = getDb();
      
      // Query hashtags that have been used for this product type
      const snapshot = await db.collection('hashtag_scores')
        .where('product_types', 'array-contains', productType)
        .orderBy('average_score', 'desc')
        .limit(limit)
        .get();
      
      const topHashtags = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        topHashtags.push({
          hashtag: data.hashtag,
          score: data.average_score,
          campaign_count: data.campaign_count,
          metrics: data.metrics,
          confidence: this.calculateConfidence(data.campaign_count)
        });
      });
      
      console.log(`📈 Found ${topHashtags.length} top hashtags for ${productType}`);
      return topHashtags;
      
    } catch (error) {
      console.error('Error getting best hashtags:', error);
      return [];
    }
  }

  /**
   * ✨ Discover and test new hashtag combinations
   */
  async discoverNewHashtagCombinations(productType, existingHashtags = []) {
    try {
      console.log(`🔍 Discovering new hashtag combinations for ${productType}...`);
      
      // Get AI to suggest new hashtags based on top performers
      const topHashtags = await this.getBestHashtagsForProduct(productType, 5);
      const aiResponseHandler = require('./ai-response-handler');
      
      const prompt = `
Based on these top-performing hashtags for ${productType}:
${topHashtags.map(h => `${h.hashtag} (score: ${h.score.toFixed(2)})`).join('\n')}

Generate 10 NEW hashtag variations and combinations that could perform even better.

Requirements:
- Mix trending and niche hashtags
- Include semantic variations of top performers
- Add emerging hashtags in the ${productType} space
- Consider different influencer personas/avatars
- Avoid these existing hashtags: ${existingHashtags.join(', ')}

Return as JSON array: ["#hashtag1", "#hashtag2", ...]
`;

      const aiResponse = await aiResponseHandler.callAI(prompt);
      const hashtagMatch = aiResponse.match(/\[.*\]/);
      
      let newHashtags = [];
      if (hashtagMatch) {
        newHashtags = JSON.parse(hashtagMatch[0]);
      }
      
      // Add some algorithmic combinations
      const algorithmicHashtags = this.generateAlgorithmicCombinations(topHashtags, productType);
      newHashtags = [...newHashtags, ...algorithmicHashtags];
      
      // Remove duplicates and existing hashtags
      newHashtags = [...new Set(newHashtags)].filter(tag => 
        !existingHashtags.includes(tag) && tag.startsWith('#')
      );
      
      console.log(`✨ Generated ${newHashtags.length} new hashtag combinations`);
      return newHashtags.slice(0, 15); // Return top 15
      
    } catch (error) {
      console.error('Error discovering new hashtags:', error);
      return [];
    }
  }

  /**
   * Generate algorithmic hashtag combinations
   */
  generateAlgorithmicCombinations(topHashtags, productType) {
    const combinations = [];
    
    // Product type variations
    const productVariations = {
      'Beauty Device': ['beautytech', 'athomebeauty', 'beautyinnovation'],
      'Skincare': ['skincaretips', 'glowingskin', 'skincarecommunity'],
      'Fashion': ['fashiontrends', 'styleinspo', 'fashionforward'],
      'Fitness': ['fitnessmotivation', 'workoutgear', 'fitnessjourney']
    };
    
    if (productVariations[productType]) {
      productVariations[productType].forEach(variation => {
        combinations.push(`#${variation}`);
      });
    }
    
    // Trending suffixes
    const trendingSuffixes = ['2024', 'trend', 'viral', 'musthave', 'review'];
    topHashtags.slice(0, 3).forEach(hashtagData => {
      const baseTag = hashtagData.hashtag.replace('#', '');
      trendingSuffixes.forEach(suffix => {
        combinations.push(`#${baseTag}${suffix}`);
      });
    });
    
    return combinations;
  }

  /**
   * ✨ Test different influencer avatars/personas
   */
  async testInfluencerAvatars(campaignId, productType) {
    try {
      console.log(`👥 Testing influencer avatars for ${productType}...`);
      
      // Define avatar profiles to test
      const avatarProfiles = {
        'beauty_guru': {
          description: 'Beauty expert with tutorial focus',
          hashtags: ['#beautyguru', '#makeuptutorial', '#beautyexpert'],
          follower_range: { min: 50000, max: 200000 },
          engagement_style: 'educational'
        },
        'lifestyle_influencer': {
          description: 'Lifestyle content with product integration',
          hashtags: ['#lifestyle', '#dailyroutine', '#selfcare'],
          follower_range: { min: 20000, max: 100000 },
          engagement_style: 'aspirational'
        },
        'micro_influencer': {
          description: 'Authentic, relatable content creator',
          hashtags: ['#authentic', '#reallife', '#honest'],
          follower_range: { min: 10000, max: 50000 },
          engagement_style: 'authentic'
        },
        'fitness_enthusiast': {
          description: 'Health and wellness focused',
          hashtags: ['#fitness', '#wellness', '#healthylifestyle'],
          follower_range: { min: 15000, max: 80000 },
          engagement_style: 'motivational'
        }
      };
      
      // Create split test for avatar testing
      const splitTestManager = require('./split-test-manager');
      
      const avatarTestConfig = {
        name: `${productType} - Avatar Testing`,
        description: `Testing different influencer personas for ${productType}`,
        type: 'avatar_test',
        variants: Object.entries(avatarProfiles).map(([key, profile]) => ({
          name: key,
          description: profile.description,
          targeting: {
            hashtags: profile.hashtags,
            follower_range: profile.follower_range,
            engagement_style: profile.engagement_style
          }
        })),
        target_count: 20, // 20 influencers per avatar type
        success_metric: 'conversion_rate'
      };
      
      const avatarTest = await splitTestManager.createSplitTest(avatarTestConfig);
      
      // Track avatar test
      await this.trackAvatarTest(campaignId, avatarTest.id, avatarProfiles);
      
      console.log(`✅ Created avatar test with ${Object.keys(avatarProfiles).length} variants`);
      return avatarTest;
      
    } catch (error) {
      console.error('Error testing influencer avatars:', error);
      return null;
    }
  }

  /**
   * Track avatar test performance
   */
  async trackAvatarTest(campaignId, testId, avatarProfiles) {
    try {
      const { getDb } = require('./database');
      const db = getDb();
      
      const avatarTestData = {
        campaign_id: campaignId,
        test_id: testId,
        avatar_profiles: avatarProfiles,
        created_at: new Date(),
        status: 'active'
      };
      
      await db.collection('avatar_tests').add(avatarTestData);
      this.avatarProfiles.set(testId, avatarProfiles);
      
    } catch (error) {
      console.error('Error tracking avatar test:', error);
    }
  }

  /**
   * ✨ Get performance insights and recommendations
   */
  async getPerformanceInsights(productType) {
    try {
      const topHashtags = await this.getBestHashtagsForProduct(productType, 20);
      const { getDb } = require('./database');
      const db = getDb();
      
      // Get recent campaign performance
      const recentCampaigns = await db.collection('hashtag_performance')
        .where('product_type', '==', productType)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();
      
      const insights = {
        top_hashtags: topHashtags.slice(0, 10),
        performance_trends: this.analyzePerformanceTrends(recentCampaigns),
        recommendations: this.generateRecommendations(topHashtags, productType),
        avatar_insights: await this.getAvatarInsights(productType)
      };
      
      return insights;
      
    } catch (error) {
      console.error('Error getting performance insights:', error);
      return null;
    }
  }

  /**
   * Analyze performance trends
   */
  analyzePerformanceTrends(campaigns) {
    const trends = {
      improving_hashtags: [],
      declining_hashtags: [],
      stable_performers: []
    };
    
    // Analyze trends (simplified version)
    campaigns.forEach(doc => {
      const data = doc.data();
      // Add trend analysis logic here
    });
    
    return trends;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(topHashtags, productType) {
    const recommendations = [];
    
    if (topHashtags.length > 0) {
      const avgScore = topHashtags.reduce((sum, h) => sum + h.score, 0) / topHashtags.length;
      
      if (avgScore > 0.7) {
        recommendations.push({
          type: 'optimization',
          message: `Your hashtag strategy is performing well! Focus on the top 5 hashtags for maximum impact.`,
          priority: 'medium'
        });
      } else {
        recommendations.push({
          type: 'improvement',
          message: `Consider testing new hashtag combinations. Current performance can be improved.`,
          priority: 'high'
        });
      }
    }
    
    recommendations.push({
      type: 'testing',
      message: `Test micro-influencers vs macro-influencers for ${productType} to optimize avatar targeting.`,
      priority: 'medium'
    });
    
    return recommendations;
  }

  /**
   * Get avatar performance insights
   */
  async getAvatarInsights(productType) {
    try {
      const { getDb } = require('./database');
      const db = getDb();
      
      const avatarTests = await db.collection('avatar_tests')
        .where('status', '==', 'completed')
        .limit(5)
        .get();
      
      const insights = {
        best_performing_avatar: null,
        avatar_performance: [],
        recommendations: []
      };
      
      // Analyze avatar test results
      // Add analysis logic here
      
      return insights;
      
    } catch (error) {
      console.error('Error getting avatar insights:', error);
      return { best_performing_avatar: null, avatar_performance: [], recommendations: [] };
    }
  }

  /**
   * Calculate confidence score based on sample size
   */
  calculateConfidence(campaignCount) {
    if (campaignCount >= 10) return 'high';
    if (campaignCount >= 5) return 'medium';
    if (campaignCount >= 2) return 'low';
    return 'very_low';
  }

  /**
   * ✨ Export hashtag performance report
   */
  async exportPerformanceReport(productType = null) {
    try {
      const { getDb } = require('./database');
      const db = getDb();
      
      let query = db.collection('hashtag_scores').orderBy('average_score', 'desc');
      
      if (productType) {
        query = query.where('product_types', 'array-contains', productType);
      }
      
      const snapshot = await query.limit(100).get();
      const report = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        report.push({
          hashtag: data.hashtag,
          score: data.average_score,
          campaigns: data.campaign_count,
          confidence: this.calculateConfidence(data.campaign_count),
          product_types: data.product_types,
          metrics: data.metrics
        });
      });
      
      return {
        generated_at: new Date(),
        product_type: productType || 'all',
        total_hashtags: report.length,
        data: report
      };
      
    } catch (error) {
      console.error('Error exporting performance report:', error);
      return null;
    }
  }
}

module.exports = new HashtagPerformanceTracker(); 