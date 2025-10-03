const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
require('dotenv').config();

// Import logger
const logger = require('./utils/logger');

// Import routes
const webhooksRouter = require('./routes/webhooks');
const campaignsRouter = require('./routes/campaigns');
const dashboardRouter = require('./routes/dashboard');
const setupRouter = require('./routes/setup');
const authRouter = require('./routes/auth');
const instagramRouter = require('./routes/instagram');
const emailCampaignsRouter = require('./routes/email-campaigns');
const slackEvents = require('./routes/slack-events');
const imagesRouter = require('./routes/images');
const templatesRouter = require('./routes/templates');

// Import services
const { initializeSupabase, createDefaultUser } = require('./services/database');
const authService = require('./services/auth');
const websocketService = require('./services/websocket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(cors());

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files in production (frontend)
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// ✨ Initialize hardcoded configuration for per@markusakerlund.com
const { validateConfig } = require('./config/hardcoded-config');
console.log('🔧 Validating hardcoded configuration...');
const configValid = validateConfig();
if (!configValid) {
  logger.warn('⚠️ Some configuration values are missing. Please check environment variables.');
}

// 🚀 ENHANCED Supabase initialization
let supabaseInitialized = false;
let supabaseEnabled = false;

console.log('🚀 Starting Supabase initialization...');

try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY not configured in .env file');
  }
  
  // Initialize Supabase
  initializeSupabase();
  supabaseInitialized = true;
} catch (error) {
  console.error('');
  console.error('❌ Supabase initialization failed:', error.message);
  console.error('');
  
  if (error.message.includes('SUPABASE_URL') || error.message.includes('SUPABASE_ANON_KEY')) {
    console.error('🔧 CONFIGURATION REQUIRED:');
    console.error('');
    console.error('   1. 🌐 Go to: https://supabase.com');
    console.error('   2. 📂 Create or select a Supabase project');
    console.error('   3. ⚙️  Go to Project Settings → API');
    console.error('   4. 🔑 Copy URL and anon key');
    console.error('   5. 📋 Copy values to your .env file');
    console.error('');
  }
  
  console.error('⚠️ Application will run in local-only mode');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: supabaseEnabled ? 'healthy' : 'degraded', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      supabase: supabaseEnabled,
      database_status: supabaseEnabled ? 'connected' : 'fallback_mode',
      apify: !!process.env.APIFY_TOKEN && process.env.APIFY_TOKEN !== 'your-apify-token',
      email: {
        provider: process.env.EMAIL_PROVIDER || 'none',
        sendgrid: !!process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key',
        brevo: !!process.env.BREVO_API_KEY && process.env.BREVO_API_KEY !== 'your-brevo-api-key'
      },
      shopify: !!process.env.SHOPIFY_ACCESS_TOKEN && process.env.SHOPIFY_ACCESS_TOKEN !== 'your-access-token',
      instagram: {
        accounts_configured: !!(process.env.INSTAGRAM_USERNAME && process.env.INSTAGRAM_PASSWORD)
      }
    },
    warnings: supabaseEnabled ? [] : [
      'Supabase database not enabled - running in fallback mode',
      'Hashtag tracking and duplicate prevention will not persist'
    ]
  });
});

// 🎯 Database setup assistant endpoint
app.get('/api/setup/database', async (req, res) => {
  const setupSteps = [
    {
      step: 1,
      title: '🌐 Open Firebase Console',
      action: 'Go to https://console.firebase.google.com',
      status: 'pending'
    },
    {
      step: 2,
      title: '📂 Select or Create Project',
      action: `Select project: ${process.env.FIREBASE_PROJECT_ID}`,
      status: supabaseInitialized ? 'completed' : 'pending',
      url: `https://console.firebase.google.com/project/${process.env.FIREBASE_PROJECT_ID}`
    },
    {
      step: 3,
      title: '🗄️ Enable Supabase Database',
      action: 'Build → Firestore Database → Create database',
      status: supabaseEnabled ? 'completed' : 'required',
      url: `https://console.firebase.google.com/project/${process.env.FIREBASE_PROJECT_ID}/firestore`
    },
    {
      step: 4,
      title: '🔒 Choose Security Mode',
      action: 'Select "Start in test mode" for development',
      status: supabaseEnabled ? 'completed' : 'pending'
    },
    {
      step: 5,
      title: '🌍 Select Location',
      action: 'Choose us-central1 (recommended)',
      status: supabaseEnabled ? 'completed' : 'pending'
    },
    {
      step: 6,
      title: '🔄 Restart Application',
      action: 'Restart this app after enabling Supabase',
      status: supabaseEnabled ? 'completed' : 'pending'
    }
  ];
  
  res.json({
    database_status: supabaseEnabled ? 'ready' : 'setup_required',
    project_id: process.env.FIREBASE_PROJECT_ID,
    setup_steps: setupSteps,
    current_status: {
      firebase_sdk: supabaseInitialized,
      supabase_enabled: supabaseEnabled,
      user_created: supabaseEnabled,
      hashtag_tracking: supabaseEnabled,
      duplicate_prevention: supabaseEnabled
    },
    quick_links: {
      firebase_console: 'https://console.firebase.google.com',
      project_dashboard: `https://console.firebase.google.com/project/${process.env.FIREBASE_PROJECT_ID}`,
      supabase_setup: `https://console.firebase.google.com/project/${process.env.FIREBASE_PROJECT_ID}/firestore`,
      service_accounts: `https://console.firebase.google.com/project/${process.env.FIREBASE_PROJECT_ID}/settings/serviceaccounts`
    },
    next_action: supabaseEnabled ? 
      'Database is ready! You can start using all features.' :
      'Please enable Supabase in Firebase Console and restart the application.'
  });
});

// API Root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Cosara Influencer Marketing Bot API',
    version: '1.0.0',
    status: 'fully_operational',
    setup_needed: !supabaseInitialized,
    endpoints: {
      health: '/health',
      webhooks: '/api/webhooks',
      campaigns: '/api/campaigns',
      dashboard: '/api/dashboard',
      setup: '/setup'
    }
  });
});

// Setup guide endpoint
app.get('/setup', (req, res) => {
  const missingServices = [];
  
  if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID === 'your-firebase-project-id') {
    missingServices.push('Firebase');
  }
  if (!process.env.APIFY_TOKEN || process.env.APIFY_TOKEN === 'your-apify-token') {
    missingServices.push('Apify');
  }
  const hasEmailService = (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key') ||
                         (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY !== 'your-brevo-api-key');
  if (!hasEmailService) {
    missingServices.push('Email Service (SendGrid or Brevo)');
  }
  if (!process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN === 'your-access-token') {
    missingServices.push('Shopify');
  }
  
  res.json({
    message: 'Setup Guide for Cosara Influencer Marketing Bot',
    status: missingServices.length === 0 ? 'complete' : 'incomplete',
    missing_services: missingServices,
    setup_instructions: {
      firebase: {
        description: 'Database and backend services',
        steps: [
          '1. Go to https://console.firebase.google.com',
          '2. Create a new project or select existing one',
          '3. Go to Project Settings > Service Accounts',
          '4. Generate new private key',
          '5. Copy the values to your .env file'
        ]
      },
      apify: {
        description: 'Instagram scraping service',
        steps: [
          '1. Go to https://apify.com',
          '2. Create account or login',
          '3. Go to Account > Integrations',
          '4. Copy your API token',
          '5. Update APIFY_TOKEN in .env file'
        ]
      },
      email: {
        description: 'Email sending service (choose one)',
        sendgrid: {
          steps: [
            '1. Go to https://sendgrid.com',
            '2. Create account or login',
            '3. Go to Settings > API Keys',
            '4. Create new API key with full access',
            '5. Update SENDGRID_API_KEY and set EMAIL_PROVIDER=sendgrid in .env'
          ]
        },
        brevo: {
          steps: [
            '1. Go to https://brevo.com (formerly Sendinblue)',
            '2. Create account or login',
            '3. Go to SMTP & API > API Keys',
            '4. Create new API key',
            '5. Update BREVO_API_KEY and set EMAIL_PROVIDER=brevo in .env',
            '✅ Your Brevo API key is already configured!'
          ]
        }
      },
      shopify: {
        description: 'E-commerce integration',
        steps: [
          '1. Go to your Shopify admin',
          '2. Go to Apps > App and sales channel settings',
          '3. Click Develop apps > Create an app',
          '4. Configure API access and get credentials',
          '5. Update Shopify settings in .env file'
        ]
      }
    }
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/setup', setupRouter);
app.use('/api/images', imagesRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/instagram', instagramRouter);
app.use('/api/email-campaigns', emailCampaignsRouter);
app.use('/api/split-tests', require('./routes/split-tests')); // ✨ NEW: Split testing routes
app.use('/api/test-enhanced', require('./routes/test-enhanced-features')); // ✨ NEW: Enhanced features testing
app.use('/api/test', require('./routes/test')); // 🧪 NEW: Database testing routes (Firebase & Supabase)
app.use('/api/ai', require('./routes/ai')); // 🤖 NEW: AI message generation routes
app.use('/api/dm', require('./routes/dm')); // 💬 NEW: Direct messaging routes
app.use('/api', slackEvents);

// ✨ Add automation status endpoint
app.get('/api/automation/status', (req, res) => {
  const automationManager = require('./services/automation-manager');
  res.json(automationManager.getStatus());
});

// ✨ Add hashtag performance endpoint
app.get('/api/hashtags/performance/:productType?', async (req, res) => {
  try {
    const hashtagTracker = require('./services/hashtag-performance-tracker');
    const insights = await hashtagTracker.getPerformanceInsights(req.params.productType);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from frontend
const path = require('path');

// Serve static files from frontend/dist
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      error: 'API route not found',
      path: req.path,
      method: req.method
    });
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Schedule automated tasks
const followUpScheduler = require('./services/follow-up-scheduler');
followUpScheduler.start();
logger.info('Follow-up scheduler started');

// ✨ Initialize split test manager
const splitTestManager = require('./services/split-test-manager');
logger.info('Split test manager initialized');

// Run influencer discovery daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  logger.info('Starting daily influencer discovery...');
  // We'll implement this later
});

// Check for new posts every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  logger.info('🔍 Checking for new influencer posts...');
  try {
    const archiveService = require('./services/archive');
    const slackService = require('./services/slack');
    
    const result = await archiveService.monitorBrandMentions();
    
    if (result.newPosts > 0) {
      await slackService.sendCampaignMilestone('new_posts_detected', {
        count: result.newPosts,
        total_monitored: result.monitored
      });
    }
    
    logger.info(`✅ Content monitoring completed: ${result.newPosts} new posts found`);
  } catch (error) {
    logger.error('❌ Content monitoring failed:', error);
    const slackService = require('./services/slack');
    await slackService.sendAlert('system_error', 'Content monitoring failed', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Send follow-up emails every 6 hours
cron.schedule('0 */6 * * *', async () => {
  logger.info('📧 Processing follow-up emails...');
  try {
    const { influencers } = require('./services/database');
    const emailService = require('./services/email');
    const slackService = require('./services/slack');
    
    const needingFollowUp = await influencers.getNeedingFollowUp();
    let followUpsSent = 0;
    
    for (const influencer of needingFollowUp) {
      try {
        const template = emailService.getTemplate(influencer.follow_up_type);
        if (template) {
          await emailService.sendEmail(
            influencer.email,
            template.subject,
            template.html,
            {
              first_name: influencer.first_name || influencer.name?.split(' ')[0] || 'there',
              influencer_name: influencer.name || influencer.instagram_handle,
              days_since_shipped: influencer.days_since_shipped,
              tracking_number: influencer.journey_tracking_number,
              template: influencer.follow_up_type,
              influencer_id: influencer.id
            }
          );
          
          // Update journey milestone
          await influencers.updateJourney(influencer.id, influencer.follow_up_type);
          followUpsSent++;
        }
      } catch (error) {
        logger.error(`Failed to send follow-up to ${influencer.instagram_handle}:`, error);
      }
    }
    
    if (followUpsSent > 0) {
      await slackService.sendCampaignMilestone('follow_ups_sent', {
        count: followUpsSent
      });
    }
    
    logger.info(`✅ Follow-up processing completed: ${followUpsSent} emails sent`);
  } catch (error) {
    logger.error('❌ Follow-up processing failed:', error);
  }
});

// Daily campaign summary at 9 AM
cron.schedule('0 9 * * *', async () => {
  logger.info('📊 Generating daily campaign summary...');
  try {
    const { influencers, posts, emails } = require('./services/database');
    const slackService = require('./services/slack');
    
    // Calculate yesterday's stats
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const stats = {
      emails_sent: await emails.getCountSince(yesterday, 'sent'),
      responses_received: await emails.getCountSince(yesterday, 'responded'),
      products_shipped: await influencers.getCountSince(yesterday, 'product_shipped'),
      new_posts: await posts.getCountSince(yesterday, 'detected'),
      manual_reviews: await influencers.getCountByStatus('manual_review_required'),
      total_active: await influencers.getCountByStatus('active'),
      conversion_rate: await influencers.getConversionRate(),
      avg_response_time: await influencers.getAvgResponseTime()
    };
    
    await slackService.sendDailySummary(stats);
    logger.info('✅ Daily summary sent');
  } catch (error) {
    logger.error('❌ Daily summary failed:', error);
  }
});

// Weekly performance report every Monday at 10 AM
cron.schedule('0 10 * * 1', async () => {
  logger.info('📈 Generating weekly performance report...');
  try {
    const { analytics } = require('./services/database');
    const slackService = require('./services/slack');
    
    const weeklyStats = await analytics.getWeeklyReport();
    
    await slackService.sendMessage({
      text: `📈 Weekly Performance Report`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📈 Weekly Performance Report"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Total Influencers:* ${weeklyStats.total_influencers}`
            },
            {
              type: "mrkdwn",
              text: `*Response Rate:* ${weeklyStats.response_rate}%`
            },
            {
              type: "mrkdwn",
              text: `*Shipping Rate:* ${weeklyStats.shipping_rate}%`
            },
            {
              type: "mrkdwn",
              text: `*Content Rate:* ${weeklyStats.content_rate}%`
            },
            {
              type: "mrkdwn",
              text: `*Avg Quality Score:* ${weeklyStats.avg_quality_score}/100`
            },
            {
              type: "mrkdwn",
              text: `*Total Engagement:* ${weeklyStats.total_engagement.toLocaleString()}`
            }
          ]
        }
      ]
    });
    
    logger.info('✅ Weekly report sent');
  } catch (error) {
    logger.error('❌ Weekly report failed:', error);
  }
});

// Send follow-up emails daily at 2 PM
cron.schedule('0 14 * * *', async () => {
  logger.info('Processing follow-up emails...');
  // We'll implement this later
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled application error', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Note: React app handles all non-API routes via the wildcard route above

// Note: Default user creation is now handled in Firebase initialization above

// Initialize WebSocket service
websocketService.initialize(server);

// Start server
server.listen(PORT, async () => {
  logger.success(`🚀 Simplified Influencer Marketing Bot running on port ${PORT}`);
  logger.info(`📱 Frontend: http://localhost:${PORT}`);
  logger.info(`🔧 API: http://localhost:${PORT}/api`);
  logger.info(`❤️ Health: http://localhost:${PORT}/health`);
  logger.info(`🤖 Automation: http://localhost:${PORT}/api/automation/status`);
  logger.info(`🔌 WebSocket: ws://localhost:${PORT}/ws/discovery-progress`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log system status
  logger.info('System Status:', {
    supabase: supabaseInitialized,
    apify: !!process.env.APIFY_TOKEN,
    email_provider: process.env.EMAIL_PROVIDER || 'none',
    environment: process.env.NODE_ENV || 'development',
    hardcoded_config: configValid
  });
  console.log(123456)
  
  // ✨ Initialize Instagram DM service
  // try {
  //   const dmThrottlingService = require('./services/dm-throttling');
  //   await dmThrottlingService.initialize();
  //   logger.success('✅ Instagram DM service initialized');
  //   logger.info('📱 40 DMs per day limit per account');
  //   logger.info('🔄 Account rotation enabled');
  // } catch (error) {
  //   logger.error('❌ Failed to initialize Instagram DM service:', error);
  //   logger.warn('⚠️ Instagram automation will not work without proper credentials');
  // }

  // ✨ Start 24/7 automation manager
  try {
    const automationManager = require('./services/automation-manager');
    await automationManager.start();
    logger.success('✅ 24/7 Automation Manager started successfully');
    logger.info('📧 Inbox checking every 5 minutes');
    logger.info('📱 Instagram DM checking every 5 minutes');
    logger.info('🤖 AI responses enabled');
    logger.info('🧪 Split testing active');
  } catch (error) {
    logger.error('❌ Failed to start automation manager:', error);
  }
  
  if (!supabaseInitialized) {
    logger.warn('⚠️ Firebase not initialized - authentication will not work');
    logger.info('📝 To enable authentication, configure Firebase in your .env file');
  } else {
    logger.info('🔐 Authentication system ready');
    logger.info('👤 Hardcoded user: per@markusakerlund.com / Renati123!');
  }
}); 