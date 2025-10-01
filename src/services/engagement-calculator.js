/**
 * 📊 Engagement Rate Calculator Service
 * Calculates real engagement rates and detects fake engagement
 */

class EngagementCalculator {
  constructor() {
    this.minEngagementRate = 2.0; // 2% minimum
    this.maxEngagementRate = 15.0; // 15% maximum (above this is suspicious)
    this.minPostsToAnalyze = 3;
    this.maxPostsToAnalyze = 12;
  }

  /**
   * 📈 Calculate engagement rate from recent posts
   */
  async calculateEngagementRate(influencerData, recentPosts = []) {
    try {
      const analysis = {
        engagement_rate: 0,
        confidence: 0,
        posts_analyzed: 0,
        flags: [],
        metrics: {
          avg_likes: 0,
          avg_comments: 0,
          avg_total_engagement: 0,
          like_to_comment_ratio: 0,
          engagement_consistency: 0
        },
        authenticity_score: 0
      };

      if (!recentPosts || recentPosts.length === 0) {
        analysis.flags.push('no_posts_data');
        return analysis;
      }

      if (!influencerData.follower_count || influencerData.follower_count === 0) {
        analysis.flags.push('no_follower_count');
        return analysis;
      }

      // Filter valid posts (with engagement data)
      const validPosts = recentPosts.filter(post => 
        post.likes !== undefined && 
        post.comments !== undefined &&
        post.likes >= 0 && 
        post.comments >= 0
      );

      if (validPosts.length < this.minPostsToAnalyze) {
        analysis.flags.push('insufficient_posts');
        return analysis;
      }

      analysis.posts_analyzed = Math.min(validPosts.length, this.maxPostsToAnalyze);
      const postsToAnalyze = validPosts.slice(0, analysis.posts_analyzed);

      // Calculate basic metrics
      const totalLikes = postsToAnalyze.reduce((sum, post) => sum + post.likes, 0);
      const totalComments = postsToAnalyze.reduce((sum, post) => sum + post.comments, 0);
      const totalEngagement = totalLikes + totalComments;

      analysis.metrics.avg_likes = totalLikes / analysis.posts_analyzed;
      analysis.metrics.avg_comments = totalComments / analysis.posts_analyzed;
      analysis.metrics.avg_total_engagement = totalEngagement / analysis.posts_analyzed;

      // Calculate engagement rate with validation
      if (influencerData.follower_count > 0 && !isNaN(analysis.metrics.avg_total_engagement)) {
        analysis.engagement_rate = (analysis.metrics.avg_total_engagement / influencerData.follower_count) * 100;
      } else {
        analysis.engagement_rate = 0;
      }

      // Calculate like-to-comment ratio with validation
      if (analysis.metrics.avg_comments > 0 && !isNaN(analysis.metrics.avg_likes)) {
        analysis.metrics.like_to_comment_ratio = analysis.metrics.avg_likes / analysis.metrics.avg_comments;
      } else {
        analysis.metrics.like_to_comment_ratio = analysis.metrics.avg_likes || 0;
      }

      // Calculate engagement consistency with validation
      const engagementRates = postsToAnalyze.map(post => {
        const likes = post.likes || 0;
        const comments = post.comments || 0;
        return influencerData.follower_count > 0 ? ((likes + comments) / influencerData.follower_count) * 100 : 0;
      });
      
      const avgRate = engagementRates.reduce((sum, rate) => sum + rate, 0) / engagementRates.length;
      const variance = engagementRates.reduce((sum, rate) => sum + Math.pow(rate - avgRate, 2), 0) / engagementRates.length;
      const standardDeviation = Math.sqrt(variance);
      
      // Prevent division by zero in consistency calculation
      analysis.metrics.engagement_consistency = avgRate > 0 ? 1 - (standardDeviation / avgRate) : 0; // Higher = more consistent

      // Detect suspicious patterns
      analysis.authenticity_score = this.calculateAuthenticityScore(analysis, postsToAnalyze, influencerData);

      // Set confidence based on data quality
      analysis.confidence = this.calculateConfidence(analysis, postsToAnalyze);

      return analysis;

    } catch (error) {
      console.error('Error calculating engagement rate:', error);
      return {
        engagement_rate: 0,
        confidence: 0,
        posts_analyzed: 0,
        flags: ['calculation_error'],
        metrics: {},
        authenticity_score: 0
      };
    }
  }

  /**
   * 🔍 Calculate authenticity score to detect fake engagement
   */
  calculateAuthenticityScore(analysis, posts, influencerData) {
    let score = 100; // Start with perfect score
    const flags = [];

    // Validate engagement rate to prevent NaN comparisons
    const engagementRate = isNaN(analysis.engagement_rate) || analysis.engagement_rate === null || analysis.engagement_rate === undefined ? 0 : analysis.engagement_rate;

    // 1. Check if engagement rate is suspiciously high
    if (engagementRate > this.maxEngagementRate) {
      score -= 30;
      flags.push('suspiciously_high_engagement');
    }

    // 2. Check like-to-comment ratio (normal is 10-50:1)
    const ratio = analysis.metrics.like_to_comment_ratio;
    if (ratio > 100) {
      score -= 20;
      flags.push('low_comment_engagement');
    } else if (ratio < 5) {
      score -= 15;
      flags.push('suspiciously_high_comments');
    }

    // 3. Check engagement consistency
    if (analysis.metrics.engagement_consistency < 0.3) {
      score -= 25;
      flags.push('inconsistent_engagement');
    }

    // 4. Check for round numbers (bots often use round numbers)
    const roundNumberPosts = posts.filter(post => 
      post.likes % 100 === 0 || post.comments % 10 === 0
    ).length;
    if (roundNumberPosts > posts.length * 0.5) {
      score -= 15;
      flags.push('suspicious_round_numbers');
    }

    // 5. Check follower-to-engagement ratio
    const avgEngagement = analysis.metrics.avg_total_engagement;
    if (avgEngagement > influencerData.follower_count * 0.2) {
      score -= 20;
      flags.push('engagement_exceeds_followers');
    }

    // 6. Check for very low engagement (could be bought followers)
    if (engagementRate < 0.5) {
      score -= 10;
      flags.push('very_low_engagement');
    }

    // 7. Check comment quality indicators (if available)
    const avgCommentsPerPost = analysis.metrics.avg_comments;
    if (avgCommentsPerPost < 1 && influencerData.follower_count > 10000) {
      score -= 10;
      flags.push('low_comment_rate');
    }

    // Add flags to main analysis
    analysis.flags.push(...flags);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 🎯 Calculate confidence in the engagement calculation
   */
  calculateConfidence(analysis, posts) {
    let confidence = 0.5; // Base confidence

    // More posts = higher confidence
    if (analysis.posts_analyzed >= 8) {
      confidence += 0.3;
    } else if (analysis.posts_analyzed >= 5) {
      confidence += 0.2;
    } else if (analysis.posts_analyzed >= 3) {
      confidence += 0.1;
    }

    // Recent posts = higher confidence
    const now = new Date();
    const recentPosts = posts.filter(post => {
      if (!post.timestamp) return false;
      const postDate = new Date(post.timestamp);
      const daysDiff = (now - postDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30; // Within last 30 days
    });

    if (recentPosts.length >= analysis.posts_analyzed * 0.8) {
      confidence += 0.2;
    }

    // Consistent engagement = higher confidence
    if (analysis.metrics.engagement_consistency > 0.7) {
      confidence += 0.1;
    }

    // No major red flags = higher confidence
    const majorFlags = ['suspiciously_high_engagement', 'engagement_exceeds_followers', 'calculation_error'];
    if (!analysis.flags.some(flag => majorFlags.includes(flag))) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * ✅ Check if influencer meets engagement criteria
   */
  async validateInfluencerEngagement(influencerData, recentPosts = []) {
    const analysis = await this.calculateEngagementRate(influencerData, recentPosts);
    
    // Validate engagement rate to prevent NaN
    const engagementRate = isNaN(analysis.engagement_rate) || analysis.engagement_rate === null || analysis.engagement_rate === undefined ? 0 : analysis.engagement_rate;
    
    const validation = {
      passed: false,
      engagement_rate: engagementRate,
      authenticity_score: analysis.authenticity_score,
      confidence: analysis.confidence,
      flags: analysis.flags,
      recommendation: 'reject',
      reasons: []
    };

    // Check minimum engagement rate
    if (engagementRate < this.minEngagementRate) {
      validation.reasons.push(`Low engagement rate: ${engagementRate.toFixed(2)}% < ${this.minEngagementRate}%`);
    }

    // Check maximum engagement rate (suspicious)
    if (engagementRate > this.maxEngagementRate) {
      validation.reasons.push(`Suspiciously high engagement: ${engagementRate.toFixed(2)}% > ${this.maxEngagementRate}%`);
    }

    // Check authenticity score
    if (analysis.authenticity_score < 60) {
      validation.reasons.push(`Low authenticity score: ${analysis.authenticity_score}/100`);
    }

    // Check confidence
    if (analysis.confidence < 0.5) {
      validation.reasons.push(`Low confidence in calculation: ${(analysis.confidence * 100).toFixed(0)}%`);
    }

    // Make final decision
    if (engagementRate >= this.minEngagementRate && 
        engagementRate <= this.maxEngagementRate &&
        analysis.authenticity_score >= 60 &&
        analysis.confidence >= 0.5) {
      
      validation.passed = true;
      validation.recommendation = 'approve';
      
      if (analysis.authenticity_score >= 80 && analysis.confidence >= 0.8) {
        validation.recommendation = 'highly_recommend';
      }
    } else if (engagementRate >= this.minEngagementRate * 0.8 && 
               analysis.authenticity_score >= 50) {
      validation.recommendation = 'manual_review';
    }

    return validation;
  }

  /**
   * 📊 Get engagement statistics for a campaign
   */
  async getCampaignEngagementStats(campaignId) {
    try {
      const { getDb } = require('./database');
      const db = getDb();
      
      const snapshot = await db.collection('influencers')
        .where('campaigns', 'array-contains', campaignId)
        .get();
      
      const stats = {
        total_analyzed: 0,
        avg_engagement_rate: 0,
        avg_authenticity_score: 0,
        engagement_distribution: {
          high: 0,    // > 5%
          medium: 0,  // 2-5%
          low: 0      // < 2%
        },
        authenticity_distribution: {
          high: 0,    // > 80
          medium: 0,  // 60-80
          low: 0      // < 60
        },
        common_flags: {}
      };
      
      let totalEngagement = 0;
      let totalAuthenticity = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const engagementData = data.engagement_analysis;
        
        if (engagementData) {
          stats.total_analyzed++;
          
          const rate = engagementData.engagement_rate || 0;
          const authenticity = engagementData.authenticity_score || 0;
          
          totalEngagement += rate;
          totalAuthenticity += authenticity;
          
          // Engagement distribution
          if (rate > 5) {
            stats.engagement_distribution.high++;
          } else if (rate >= 2) {
            stats.engagement_distribution.medium++;
          } else {
            stats.engagement_distribution.low++;
          }
          
          // Authenticity distribution
          if (authenticity > 80) {
            stats.authenticity_distribution.high++;
          } else if (authenticity >= 60) {
            stats.authenticity_distribution.medium++;
          } else {
            stats.authenticity_distribution.low++;
          }
          
          // Count flags
          if (engagementData.flags) {
            engagementData.flags.forEach(flag => {
              stats.common_flags[flag] = (stats.common_flags[flag] || 0) + 1;
            });
          }
        }
      });
      
      if (stats.total_analyzed > 0) {
        stats.avg_engagement_rate = totalEngagement / stats.total_analyzed;
        stats.avg_authenticity_score = totalAuthenticity / stats.total_analyzed;
      }
      
      return stats;
      
    } catch (error) {
      console.error('Error getting engagement stats:', error);
      return null;
    }
  }

  /**
   * 🔄 Batch analyze influencers for engagement
   */
  async batchAnalyzeEngagement(influencers, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 10;
    
    for (let i = 0; i < influencers.length; i += batchSize) {
      const batch = influencers.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (influencer) => {
        try {
          // If we have recent posts data, use it
          const recentPosts = influencer.recent_posts || [];
          const analysis = await this.calculateEngagementRate(influencer, recentPosts);
          const validation = await this.validateInfluencerEngagement(influencer, recentPosts);
          
          return {
            influencer_id: influencer.id,
            instagram_handle: influencer.instagram_handle,
            analysis,
            validation,
            processed_at: new Date().toISOString()
          };
        } catch (error) {
          console.error(`Error analyzing ${influencer.instagram_handle}:`, error);
          return {
            influencer_id: influencer.id,
            instagram_handle: influencer.instagram_handle,
            error: error.message,
            processed_at: new Date().toISOString()
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < influencers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

module.exports = new EngagementCalculator(); 