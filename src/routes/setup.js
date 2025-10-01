const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// GET /api/setup/status - Get system status
router.get('/status', async (req, res) => {
  try {
    const db = require('../services/database');
    const influencers = await db.influencers.getAll();
    
    // Get log summary
    const logSummary = logger.getLogSummary();
    
    res.json({
      success: true,
      database_connected: true,
      influencer_count: influencers.length,
      firebase_status: 'connected',
      environment: process.env.NODE_ENV || 'development',
      services: {
        firebase: true,
        apify: !!process.env.APIFY_TOKEN,
        email: process.env.EMAIL_PROVIDER || 'none',
        shopify: !!process.env.SHOPIFY_ACCESS_TOKEN
      },
      logging: logSummary
    });
    
  } catch (error) {
    logger.error('Setup status check failed', error);
    res.status(500).json({
      success: false,
      database_connected: false,
      error: error.message
    });
  }
});

// GET /api/setup/logs - Get recent logs
router.get('/logs', async (req, res) => {
  try {
    const logType = req.query.type || 'general';
    const lines = parseInt(req.query.lines) || 50;
    
    const logSummary = logger.getLogSummary();
    const fs = require('fs');
    const path = require('path');
    
    const logFile = path.join(logger.logDir, `${logType}_${logger.startDate}.log`);
    
    if (!fs.existsSync(logFile)) {
      return res.json({
        success: true,
        logs: [],
        message: `No ${logType} logs found for today`
      });
    }
    
    const content = fs.readFileSync(logFile, 'utf8');
    const logLines = content.split('\n').filter(line => line.trim()).slice(-lines);
    
    res.json({
      success: true,
      logs: logLines,
      log_type: logType,
      total_lines: logLines.length,
      available_types: logSummary.logFiles.map(f => f.replace(`_${logger.startDate}.log`, ''))
    });
    
  } catch (error) {
    logger.error('Failed to retrieve logs', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve logs',
      details: error.message
    });
  }
});

// POST /api/setup/clear-logs - Clear log files
router.post('/clear-logs', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const logFiles = fs.readdirSync(logger.logDir).filter(f => f.endsWith('.log'));
    
    for (const file of logFiles) {
      fs.unlinkSync(path.join(logger.logDir, file));
    }
    
    logger.info(`Cleared ${logFiles.length} log files`);
    
    res.json({
      success: true,
      message: `Cleared ${logFiles.length} log files`,
      cleared_files: logFiles
    });
    
  } catch (error) {
    logger.error('Failed to clear logs', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear logs',
      details: error.message
    });
  }
});

// Initialize database collections
router.post('/init-database', async (req, res) => {
  try {
    console.log('🗄️ Initializing database collections...');
    
    // Initialize collections by adding and removing a dummy document
    const collections = ['influencers', 'campaigns', 'outreach', 'templates', 'analytics'];
    
    for (const collectionName of collections) {
      try {
        const dummyDoc = {
          _initialized: true,
          timestamp: new Date().toISOString()
        };
        
        const docRef = await db.collection(collectionName).add(dummyDoc);
        await docRef.delete(); // Clean up the dummy document
        
        console.log(`✅ Initialized ${collectionName} collection`);
      } catch (error) {
        console.log(`⚠️ Error initializing ${collectionName}:`, error.message);
      }
    }
    
    console.log('🗄️ Database initialization completed');
    
    res.json({
      success: true,
      message: 'Database collections initialized successfully',
      collections: collections
    });
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      error: error.message
    });
  }
});

module.exports = router; 