const express = require('express');
const router = express.Router();
const splitTestManager = require('../services/split-test-manager');
const { emailVariants, splitTestConfigs } = require('../templates/email-variants');
const { instagramDMVariants, instagramSplitTestConfigs } = require('../templates/instagram-dm-variants');

// Combine all split test configs
const allSplitTestConfigs = {
  ...splitTestConfigs,
  ...instagramSplitTestConfigs
};

// GET /api/split-tests - Get all split tests
router.get('/', async (req, res) => {
  try {
    const activeTests = splitTestManager.getActiveTests();
    const testResults = {};
    
    // Get detailed results for each test
    for (const test of activeTests) {
      testResults[test.id] = splitTestManager.getSplitTestResults(test.id);
    }
    
    res.json({
      success: true,
      active_tests: activeTests,
      test_results: testResults,
      total_active: activeTests.length
    });
  } catch (error) {
    console.error('Get split tests error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/split-tests/create - Create a new split test
router.post('/create', async (req, res) => {
  try {
    const { testConfigId, custom_config } = req.body;
    
    let config;
    
    if (testConfigId && allSplitTestConfigs[testConfigId]) {
      // Use predefined config
      config = allSplitTestConfigs[testConfigId];
    } else if (custom_config) {
      // Use custom configuration
      config = custom_config;
    } else {
      return res.status(400).json({ 
        error: 'Either testConfigId or custom_config is required',
        available_configs: Object.keys(allSplitTestConfigs)
      });
    }
    
    const test = await splitTestManager.createSplitTest(config);
    
    res.json({
      success: true,
      test: test,
      message: `Split test "${test.name}" created with ${test.variants.length} variants`,
      target_total: test.target_count * test.variants.length
    });
  } catch (error) {
    console.error('Create split test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/split-tests/:testId - Get specific test results
router.get('/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const results = splitTestManager.getSplitTestResults(testId);
    
    if (!results) {
      return res.status(404).json({ error: 'Split test not found' });
    }
    
    res.json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error('Get split test results error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/split-tests/:testId/winner - Manually declare a winner
router.post('/:testId/winner', async (req, res) => {
  try {
    const { testId } = req.params;
    const { variantId } = req.body;
    
    if (!variantId) {
      return res.status(400).json({ error: 'variantId is required' });
    }
    
    await splitTestManager.declareWinner(testId, variantId);
    
    res.json({
      success: true,
      message: `Winner declared for test ${testId}`,
      winner_variant: variantId
    });
  } catch (error) {
    console.error('Declare winner error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/split-tests/configs/available - Get available test configurations
router.get('/configs/available', (req, res) => {
  try {
    const configs = Object.keys(allSplitTestConfigs).map(key => ({
      id: key,
      name: allSplitTestConfigs[key].name,
      description: allSplitTestConfigs[key].description,
      type: allSplitTestConfigs[key].type,
      platform: allSplitTestConfigs[key].type.includes('dm') ? 'instagram' : 'email',
      variants_count: allSplitTestConfigs[key].variants.length,
      target_per_variant: allSplitTestConfigs[key].target_count,
      total_target: allSplitTestConfigs[key].target_count * allSplitTestConfigs[key].variants.length
    }));
    
    // Separate by platform
    const emailConfigs = configs.filter(c => c.platform === 'email');
    const instagramConfigs = configs.filter(c => c.platform === 'instagram');
    
    res.json({
      success: true,
      available_configs: configs,
      email_configs: emailConfigs,
      instagram_configs: instagramConfigs,
      email_variants: {
        initial_outreach: Object.keys(emailVariants.initial_outreach_variants).length,
        follow_up: Object.keys(emailVariants.follow_up_variants).length,
        response: Object.keys(emailVariants.response_variants).length
      },
      instagram_variants: {
        initial_dm: Object.keys(instagramDMVariants.initial_dm_variants).length,
        follow_up_dm: Object.keys(instagramDMVariants.follow_up_dm_variants).length,
        response_dm: Object.keys(instagramDMVariants.response_dm_variants).length,
        negotiation_dm: Object.keys(instagramDMVariants.negotiation_dm_variants).length
      }
    });
  } catch (error) {
    console.error('Get available configs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/split-tests/quick-start - Quick start with predefined test
router.post('/quick-start', async (req, res) => {
  try {
    const { test_type, campaign_type } = req.body;
    
    const testConfigs = {
      // Email tests
      'opener': 'opener_strategy_test',
      'followup': 'follow_up_strategy_test', 
      'response': 'response_handling_test',
      
      // Instagram DM tests
      'dm_opener': 'dm_opener_test',
      'dm_followup': 'dm_follow_up_test',
      'dm_response': 'dm_response_test',
      
      // Unified contact tests
      'unified_opener': 'unified_opener_test',
      'unified_followup': 'unified_follow_up_test',
      'unified_response': 'unified_response_test'
    };
    
    const configId = testConfigs[test_type];
    if (!configId) {
      return res.status(400).json({ 
        error: 'Invalid test_type',
        available_types: Object.keys(testConfigs),
        email_types: ['opener', 'followup', 'response'],
        instagram_types: ['dm_opener', 'dm_followup', 'dm_response']
      });
    }
    
    const config = allSplitTestConfigs[configId];
    const test = await splitTestManager.createSplitTest(config);
    
    const platform = test_type.includes('dm') ? 'Instagram DM' : 'Email';
    console.log(11111111111111111111,platform)
    res.json({
      success: true,
      test: test,
      message: `Quick-started ${platform} ${test_type.replace('dm_', '')} split test`,
      platform: platform.toLowerCase().replace(' ', '_'),
      next_steps: [
        `${platform} split test is now active`,
        `New ${platform.toLowerCase()}s will automatically use test variants`,
        `Target: ${test.target_count} messages per variant`,
        'Monitor results at /api/split-tests/' + test.id
      ]
    });
  } catch (error) {
    console.error('Quick start split test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/split-tests/:testId/export - Export test results
router.get('/:testId/export', async (req, res) => {
  try {
    const { testId } = req.params;
    const results = splitTestManager.getSplitTestResults(testId);
    
    if (!results) {
      return res.status(404).json({ error: 'Split test not found' });
    }
    
    // Format for CSV export
    const csvData = results.test.variants.map(variant => {
      const variantResults = results.test.results[variant.id];
      return {
        variant_name: variant.name,
        variant_description: variant.description,
        messages_sent: variantResults.sent,
        responses: variantResults.responded,
        response_rate: Math.round(variantResults.response_rate * 100) + '%',
        positive_responses: variantResults.positive_responses,
        conversion_rate: Math.round(variantResults.conversion_rate * 100) + '%',
        avg_response_time: variantResults.avg_response_time_hours.toFixed(1) + 'h'
      };
    });
    
    const platform = results.test.type.includes('dm') ? 'Instagram DM' : 'Email';
    
    res.json({
      success: true,
      test_summary: {
        name: results.test.name,
        platform: platform,
        status: results.test.status,
        created: results.test.created_at,
        completion: results.summary.completion_percentage + '%'
      },
      csv_data: csvData,
      winner: results.summary.best_variant
    });
  } catch (error) {
    console.error('Export split test error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 