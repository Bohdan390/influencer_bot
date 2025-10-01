const { influencers, emails } = require('./database');
const supabase = require('./supabase');

/**
 * Split Test Manager for Conversation Flows & Email Templates
 * Handles A/B testing with 100 messages per variant
 */
class SplitTestManager {
  constructor() {
    this.activeTests = new Map();
    this.testResults = new Map();
  }

  /**
   * Create a new split test
   */
  async createSplitTest(testConfig) {
    const test = {
      id: `test_${Date.now()}`,
      name: testConfig.name,
      description: testConfig.description,
      type: testConfig.type, // 'template', 'flow', 'opener'
      status: 'active',
      created_at: new Date(),
      
      // Test configuration
      variants: testConfig.variants, // Array of template/flow variants
      target_count: testConfig.target_count || 100, // Messages per variant
      allocation: testConfig.allocation || 'equal', // equal, weighted
      
      // Tracking
      current_counts: {},
      results: {},
      
      // Success metrics
      success_metrics: testConfig.success_metrics || [
        'response_rate',
        'positive_sentiment_rate', 
        'conversion_to_shipping'
      ],
      
      // Auto-winner detection
      auto_declare_winner: testConfig.auto_declare_winner || true,
      min_statistical_significance: testConfig.min_statistical_significance || 0.95,
      
      // Test duration limits
      max_duration_days: testConfig.max_duration_days || 30,
      expires_at: new Date(Date.now() + (testConfig.max_duration_days || 30) * 24 * 60 * 60 * 1000)
    };

    // Initialize counters for each variant
    test.variants.forEach(variant => {
      test.current_counts[variant.id] = 0;
      test.results[variant.id] = {
        sent: 0,
        opened: 0,
        responded: 0,
        positive_responses: 0,
        neutral_responses: 0,
        negative_responses: 0,
        shipped: 0,
        conversion_rate: 0,
        response_rate: 0,
        avg_response_time_hours: 0
      };
    });

    this.activeTests.set(test.id, test);
    
    console.log(`🧪 Created split test: ${test.name} with ${test.variants.length} variants`);
    
    // Save to database
    await this.saveSplitTest(test);
    
    return test;
  }

  /**
   * Get next variant for new influencer (load balancing)
   */
  getVariantForInfluencer(testId, influencerId) {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'active') {
      return null;
    }

    // Check if test is complete
    const totalSent = Object.values(test.current_counts).reduce((sum, count) => sum + count, 0);
    const targetTotal = test.target_count * test.variants.length;
    
    if (totalSent >= targetTotal) {
      console.log(`🏁 Split test ${test.name} completed - no more variants assigned`);
      return null;
    }

    // Find variant with lowest count (equal allocation)
    let selectedVariant = null;
    let minCount = Infinity;
    
    for (const variant of test.variants) {
      const currentCount = test.current_counts[variant.id] || 0;
      
      if (currentCount < test.target_count && currentCount < minCount) {
        minCount = currentCount;
        selectedVariant = variant;
      }
    }

    if (selectedVariant) {
      test.current_counts[selectedVariant.id]++;
      console.log(`🎯 Assigned variant "${selectedVariant.name}" to ${influencerId} (${test.current_counts[selectedVariant.id]}/${test.target_count})`);
    }

    return selectedVariant;
  }

  /**
   * Track email performance for split test
   */
  async trackEmailPerformance(testId, variantId, influencerId, eventType, eventData = {}) {
    const test = this.activeTests.get(testId);
    if (!test || !test.results[variantId]) {
      return;
    }

    const results = test.results[variantId];
    
    switch (eventType) {
      case 'sent':
        results.sent++;
        break;
        
      case 'opened':
        results.opened++;
        break;
        
      case 'responded':
        results.responded++;
        
        // Track sentiment if provided
        if (eventData.sentiment) {
          if (eventData.sentiment === 'positive') results.positive_responses++;
          else if (eventData.sentiment === 'negative') results.negative_responses++;
          else results.neutral_responses++;
        }
        
        // Track response time
        if (eventData.response_time_hours) {
          const currentAvg = results.avg_response_time_hours;
          const count = results.responded;
          results.avg_response_time_hours = ((currentAvg * (count - 1)) + eventData.response_time_hours) / count;
        }
        break;
        
      case 'shipped':
        results.shipped++;
        break;
    }
    
    // Recalculate rates
    results.response_rate = results.sent > 0 ? (results.responded / results.sent) : 0;
    results.conversion_rate = results.sent > 0 ? (results.shipped / results.sent) : 0;
    results.positive_sentiment_rate = results.responded > 0 ? (results.positive_responses / results.responded) : 0;
    
    console.log(`📊 Split test tracking - ${testId}:${variantId} - ${eventType} (${results.sent} sent, ${Math.round(results.response_rate * 100)}% response rate)`);
    
    // Check if we should declare a winner
    await this.checkForWinner(testId);
    
    // Save updated results
    await this.saveSplitTest(test);
  }

  /**
   * Check if we should declare a winner based on statistical significance
   */
  async checkForWinner(testId) {
    const test = this.activeTests.get(testId);
    if (!test || !test.auto_declare_winner || test.status !== 'active') {
      return;
    }

    // Check if all variants have minimum sample size
    const minSampleSize = 30;
    const allVariantsHaveData = test.variants.every(variant => 
      test.results[variant.id].sent >= minSampleSize
    );

    if (!allVariantsHaveData) {
      return;
    }

    // Find best performing variant for primary metric (response_rate)
    let bestVariant = null;
    let bestRate = 0;
    
    for (const variant of test.variants) {
      const results = test.results[variant.id];
      const rate = results.response_rate;
      
      if (rate > bestRate) {
        bestRate = rate;
        bestVariant = variant;
      }
    }

    // Simple statistical significance check (Chi-square test would be better)
    const bestResults = test.results[bestVariant.id];
    const hasSignificantLift = bestResults.response_rate > 0.1; // At least 10% response rate
    const hasSufficientSamples = bestResults.sent >= 50;
    
    if (hasSignificantLift && hasSufficientSamples) {
      await this.declareWinner(testId, bestVariant.id);
    }
  }

  /**
   * Declare a winner and end the test
   */
  async declareWinner(testId, winnerVariantId) {
    const test = this.activeTests.get(testId);
    if (!test) return;

    test.status = 'completed';
    test.winner_variant_id = winnerVariantId;
    test.completed_at = new Date();
    
    const winnerVariant = test.variants.find(v => v.id === winnerVariantId);
    const winnerResults = test.results[winnerVariantId];
    
    console.log(`🏆 SPLIT TEST WINNER DECLARED!`);
    console.log(`📊 Test: ${test.name}`);
    console.log(`🎯 Winner: ${winnerVariant.name}`);
    console.log(`📈 Response Rate: ${Math.round(winnerResults.response_rate * 100)}%`);
    console.log(`📦 Conversion Rate: ${Math.round(winnerResults.conversion_rate * 100)}%`);
    
    // Send Slack notification
    const slackService = require('./slack');
    await slackService.sendSplitTestWinnerNotification(test, winnerVariant, winnerResults);
    
    // Save final results
    await this.saveSplitTest(test);
  }

  /**
   * Get active split tests
   */
  getActiveTests() {
    return Array.from(this.activeTests.values()).filter(test => test.status === 'active');
  }

  /**
   * Get split test results
   */
  getSplitTestResults(testId) {
    const test = this.activeTests.get(testId);
    if (!test) return null;

    return {
      test: test,
      summary: {
        total_sent: Object.values(test.results).reduce((sum, r) => sum + r.sent, 0),
        avg_response_rate: Object.values(test.results).reduce((sum, r) => sum + r.response_rate, 0) / test.variants.length,
        best_variant: this.getBestPerformingVariant(testId),
        completion_percentage: this.getTestCompletionPercentage(testId)
      }
    };
  }

  /**
   * Get best performing variant
   */
  getBestPerformingVariant(testId) {
    const test = this.activeTests.get(testId);
    if (!test) return null;

    let bestVariant = null;
    let bestRate = 0;
    
    for (const variant of test.variants) {
      const results = test.results[variant.id];
      if (results.response_rate > bestRate) {
        bestRate = results.response_rate;
        bestVariant = {
          ...variant,
          results: results
        };
      }
    }
    
    return bestVariant;
  }

  /**
   * Get test completion percentage
   */
  getTestCompletionPercentage(testId) {
    const test = this.activeTests.get(testId);
    if (!test) return 0;

    const totalSent = Object.values(test.current_counts).reduce((sum, count) => sum + count, 0);
    const targetTotal = test.target_count * test.variants.length;
    
    return Math.round((totalSent / targetTotal) * 100);
  }

  /**
   * Save split test to database
   */
  async saveSplitTest(test) {
    try {
      const { data, error } = await supabase.supabase()
        .from('split_tests')
        .upsert([{
          id: test.id,
          ...test,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
      console.log(`✅ Split test saved: ${test.id}`);
    } catch (error) {
      console.error('Failed to save split test:', error);
    }
  }

  /**
   * Load active split tests from database
   */
  async loadActiveSplitTests() {
    try {
      const { data, error } = await supabase.supabase()
        .from('split_tests')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      
      if (data) {
        data.forEach(test => {
          this.activeTests.set(test.id, test);
        });
      }
      
      console.log(`🧪 Loaded ${this.activeTests.size} active split tests`);
    } catch (error) {
      console.error('Failed to load split tests:', error);
    }
  }
}

module.exports = new SplitTestManager(); 