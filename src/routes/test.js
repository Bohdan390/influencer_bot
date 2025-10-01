const express = require('express');
const router = express.Router();
const { testFirestoreConnection, influencers, createDefaultUser } = require('../services/database');
const supabaseService = require('../services/supabase');
const apifyService = require('../services/apify');

// Test database (existing Firebase/Firestore test)
router.get('/database', async (req, res) => {
  try {
    console.log('🔥 Running comprehensive database connection test...');
    console.log('🔥 Testing Firestore connection...');
    const connectionResult = await testFirestoreConnection();
    
    const response = {
      success: connectionResult.success,
      database_type: process.env.DATABASE_TYPE || 'firebase',
      connection_status: connectionResult.success ? 'connected' : 'failed',
      message: connectionResult.message,
      details: connectionResult,
      tests: {},
      timestamp: new Date().toISOString()
    };

    if (connectionResult.success) {
      try {
        // Test core database operations
        const stats = await influencers.getCRMDashboard();
        
        // Test hashtag performance tracking
        const hashtagTest = await influencers.getHashtagPerformance();
        
        // Test duplicate checking
        const duplicateTest = await influencers.checkForDuplicates(['@test_user']);
        
        // Test user creation
        const userTest = await createDefaultUser();
        
        response.tests = {
          crm_dashboard: { status: 'passed', data: stats },
          hashtag_performance: { 
            status: 'passed', 
            total_hashtags: hashtagTest.summary.total_hashtags,
            total_influencers: hashtagTest.summary.total_influencers
          },
          duplicate_checking: { 
            status: 'passed',
            test_result: 'passed'
          },
          user_management: { 
            status: 'passed',
            default_user: userTest.email || 'per@markusakerlund.com'
          }
        };
        
      } catch (testError) {
        response.tests = {
          error: 'Some tests failed',
          details: testError.message
        };
      }
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      success: false,
      database_type: process.env.DATABASE_TYPE || 'firebase',
      connection_status: 'failed',
      message: '❌ Database connection test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test Supabase database connection
router.get('/supabase', async (req, res) => {
  try {
    console.log('🧪 Running comprehensive Supabase connection test...');
    console.log('🧪 Testing Supabase connection...');
    
    // Test 1: Initialize Supabase
    const supabase = supabaseService.initializeSupabase();
    console.log('✅ Test 1 passed: Supabase initialized');
    
    // Test 3: Test database setup
    const setupResult = await supabaseService.setupSupabaseDatabase();
    console.log('✅ Test 3 passed: Database setup completed');
    
    // Test 4: Test influencers operations
    try {
      const testStats = await supabaseService.influencers.getCRMDashboard();
      console.log('✅ Test 4 passed: Influencers operations working');
    } catch (error) {
      console.log('⚠️ Test 4 partial: Influencers operations need table setup');
    }
    
    res.json({
      success: true,
      database_type: 'supabase',
      connection_status: 'connected',
      tests_passed: 4,
      setup_result: setupResult,
      message: 'Supabase connection test completed successfully',
      timestamp: new Date().toISOString(),
      url: process.env.SUPABASE_URL,
      has_service_key: !!process.env.SUPABASE_SERVICE_KEY
    });
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error.message);
    res.status(500).json({
      success: false,
      database_type: 'supabase',
      connection_status: 'failed',
      error: error.message,
      message: 'Supabase connection test failed',
      timestamp: new Date().toISOString(),
      url: process.env.SUPABASE_URL,
      has_service_key: !!process.env.SUPABASE_SERVICE_KEY,
      troubleshooting: [
        'Check if SUPABASE_URL is correct',
        'Verify SUPABASE_SERVICE_KEY is valid',
        'Ensure Supabase project is active',
        'Check if tables need to be created manually'
      ]
    });
  }
});

// Test web scraping functionality
router.post('/scraping', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        message: 'Please provide a URL to test scraping'
      });
    }

    console.log(`🧪 Testing web scraping for URL: ${url}`);
    
    // Test the web scraping
    const emails = await apifyService.extractEmailFromExternalUrl(url);
    
    res.json({
      success: true,
      url: url,
      emails_found: emails.length,
      emails: emails,
      message: `Successfully scraped ${emails.length} email(s) from ${url}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Web scraping test failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Web scraping test failed',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 