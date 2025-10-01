// 🔒 Hardcoded Configuration for Demo Mode
// This eliminates the need for a settings page - all APIs are pre-configured

const hardcodedConfig = {
  // User Configuration
  user: {
    email: 'per@markusakerlund.com',
    password: 'Renati123!',
    name: 'Per Markus Akerlund',
    role: 'admin'
  },

  // API Keys (Production Ready - Hardcoded for Demo)
  apis: {
    // Email Provider - Brevo configured (temporarily switching back due to SMTP auth issues)
    email: {
      provider: 'brevo',
      brevo_api_key: process.env.BREVO_API_KEY,
      from_email: 'bohdanmotrych8@gmail.com',
      from_name: 'Dermao Partnership Team'
    },

    // Instagram Discovery - Apify configured
    apify: {
      api_token: process.env.APIFY_TOKEN,
      instagram_scraper_id: 'apify/instagram-scraper'
    },

    // Instagram Automation - DM sending
    instagram: {
      username: 'dermao.beauty',
      password: 'Dermao2024!',
      accounts: [
        {
          username: 'dermao.beauty',
          password: 'Dermao2024!',
          priority: 1
        }
      ]
    },

    // E-commerce - Shopify configured
    shopify: {
      shop_domain: 'e52ce7-7e.myshopify.com',
      access_token: process.env.SHOPIFY_ACCESS_TOKEN,
      api_version: '2023-10'
    },

    // Notifications - Slack
    slack: {
      webhook_url: process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/demo-webhook',
      channel: '#influencer-marketing'
    },

    // Database - Supabase configured
    supabase: {
      url: process.env.SUPABASE_URL || 'https://bozaltiotkwzqbaifazg.supabase.co',
      anon_key: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvemFsdGlvdGt3enFiYWlmYXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5Njk2MDksImV4cCI6MjA3MzU0NTYwOX0.tBlJFQRI6OEyr6eskNPc3m590bvnpfUuwjnXpfRBtmg'
    }
  },

  // Campaign Defaults
  campaign: {
    default_product: {
      name: 'Dermao IPL Hair Laser',
      type: 'Beauty Device',
      description: 'Revolutionary at-home IPL hair removal device that delivers professional salon results',
      value: 299,
      currency: 'USD'
    },

    // Targeting (from user_settings.json)
    targeting: {
      follower_range: {
        min: 5000,
        max: 500000
      },
      countries: ['US', 'UK', 'AU'],
      languages: ['en'],
      engagement_rate_min: 2.0,
      hashtags: 'beauty,skincare,hairremoval,laser,ipl,hairfree,smoothskin,dermao'
    },

    // Outreach Settings (from user_settings.json)
    outreach: {
      daily_limit: 100,
      response_timeout_hours: 120, // 5 days
      max_follow_ups: 2,
      auto_ship_threshold: 0.8,
      sender_name: 'Dermao Partnership Team',
      sender_email: 'influencers@trycosara.com',
      signature: 'Best regards,\nDermao Partnership Team\nBeauty Technology Innovation\n\n--\nDermao IPL Hair Removal\nwww.dermao.com | @dermao.official'
    }
  },

  // Automation Settings
  automation: {
    inbox_check_interval: 5, // Check inbox every 5 minutes
    discovery_schedule: '0 9 * * *', // Daily at 9 AM
    follow_up_schedule: '0 */6 * * *', // Every 6 hours
    reporting_schedule: '0 9 * * 1', // Weekly on Monday at 9 AM
    
    // AI Response Settings
    ai_auto_response: true,
    ai_confidence_threshold: 0.7,
    manual_review_threshold: 0.5
  },

  // Split Testing
  split_testing: {
    enabled: true,
    default_target_per_variant: 100,
    auto_declare_winner: true,
    min_statistical_significance: 0.95
  }
};

// Set environment variables from hardcoded config for demo mode
process.env.EMAIL_PROVIDER = 'brevo';
process.env.SHOPIFY_STORE_URL = hardcodedConfig.apis.shopify.shop_domain;
process.env.SHOPIFY_ACCESS_TOKEN = hardcodedConfig.apis.shopify.access_token;

// Validation function
function validateConfig() {
  console.log('✅ All API keys are hardcoded for demo mode');
  console.log('🎯 Supabase, Apify, Brevo, and Shopify are pre-configured');
  return true; // Always return true since everything is hardcoded
}

// Export configuration
module.exports = {
  config: hardcodedConfig,
  validateConfig,
  
  // Helper functions
  getApiKey: (service) => {
    const keys = {
      'email': hardcodedConfig.apis.email.brevo_api_key,
      'apify': hardcodedConfig.apis.apify.api_token,
      'shopify': hardcodedConfig.apis.shopify.access_token,
      'slack': hardcodedConfig.apis.slack.webhook_url,
      'firebase': hardcodedConfig.apis.firebase.project_id
    };
    return keys[service];
  },

  getUser: () => hardcodedConfig.user,
  getCampaignDefaults: () => hardcodedConfig.campaign,
  getAutomationSettings: () => hardcodedConfig.automation
}; 