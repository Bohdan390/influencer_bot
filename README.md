# 🚀 Cosara Influencer Marketing Bot

**Fully automated influencer marketing system** for Cosara's IPL hair laser campaigns. This system handles the complete workflow from discovery to content tracking.

## ✨ Features

- **🔍 Instagram Discovery**: Automated hashtag and competitor analysis
- **📧 Email Campaigns**: Personalized outreach with A/B testing
- **📱 Instagram DM Automation**: Real Instagram DM campaigns with 40 messages/day limit
- **🤖 AI Response Processing**: Automated response analysis and follow-ups
- **🧪 Split Testing**: Built-in A/B testing for emails and DMs
- **📦 Shopify Integration**: Product fulfillment tracking
- **📊 Analytics Dashboard**: Real-time campaign performance
- **🔄 24/7 Automation**: Continuous inbox monitoring and responses
- **📢 Slack Integration**: Real-time notifications and alerts

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd influencer-marketing-bot
```

2. **Install dependencies**
```bash
npm install
cd frontend && npm install && cd ..
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Start the application**
```bash
npm start
```

5. **Access the dashboard**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

## 📱 Instagram DM Automation

### Overview
The system uses the `instagram-private-api` library to send and receive Instagram DMs with proper rate limiting and account management.

### Features
- **40 DMs per day limit** per Instagram account (Instagram's safe limit)
- **Account rotation** for higher volume campaigns
- **Session management** with automatic re-authentication
- **Rate limiting** with 8 DMs per hour maximum
- **Real-time response checking** every 5 minutes
- **AI-powered response analysis** and automated replies
- **Split testing** with 4 different DM variants

### Setup

1. **Add Instagram credentials to .env:**
```bash
INSTAGRAM_USERNAME=your_instagram_username
INSTAGRAM_PASSWORD=your_instagram_password

# Optional: Additional accounts for rotation
INSTAGRAM_USERNAME_2=your_second_account
INSTAGRAM_PASSWORD_2=your_second_password
```

2. **Instagram Account Requirements:**
- Use a business/creator account
- Account should be established (not newly created)
- Enable two-factor authentication is recommended
- Use strong, unique passwords

3. **Initial Setup:**
- First login may require challenge verification
- Sessions are saved in `src/data/instagram-sessions/`
- Sessions are automatically refreshed and maintained

### DM Campaign Types

#### 📤 **Initial Outreach DMs**
- **Variant A**: Casual & Friendly approach
- **Variant B**: Compliment-First approach  
- **Variant C**: Story-Reply style
- **Variant D**: Problem/Solution approach

#### 🤝 **Follow-up DMs**
- Response to positive replies
- Shipping information collection
- Negotiation handling
- Post reminders

#### 🤖 **AI Response Processing**
- Sentiment analysis (positive/negative/neutral)
- Intent detection (interested/not_interested/question/negotiation)
- Automatic categorization and appropriate responses
- Shipping information extraction

### Usage

1. **Launch DM Campaign from Frontend:**
   - Go to Launch tab
   - Select "Instagram DMs" instead of "Email"
   - Choose DM template or enable split testing
   - System will queue DMs respecting rate limits

2. **Monitor Campaign:**
   - Check Instagram tab for real-time conversations
   - View DM statistics and response rates
   - Track conversion from DM to shipping

3. **Automated Workflow:**
   - System sends DMs → Reads responses → AI analyzes → Sends appropriate follow-ups → Collects shipping info → Tracks fulfillment

### Rate Limiting & Safety

- **Daily Limit**: 40 DMs per account per day
- **Hourly Limit**: 8 DMs per account per hour  
- **Minimum Interval**: 3 minutes between DMs
- **Random Delays**: 2-8 minutes between messages to appear human
- **Account Health Monitoring**: Automatic banning on restrictions
- **Challenge Handling**: Manual intervention required for challenges

### Troubleshooting

**Authentication Issues:**
```bash
# Check logs for authentication errors
# May need to complete challenge on Instagram
# Sessions saved in src/data/instagram-sessions/
```

**Rate Limiting:**
```bash
# Check /api/instagram/stats for current usage
# Add more accounts for higher volume
# Respect daily limits to avoid restrictions
```

**DM Delivery Issues:**
```bash
# Verify recipient usernames are correct
# Check if accounts are private/restricted
# Monitor account health in dashboard
```

## 🔧 Configuration

### Firebase (Required)
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
```

### Instagram Discovery (Required)
```bash
APIFY_TOKEN=your-apify-token
```

### Email Service (Required - Choose One)
```bash
# Option 1: Brevo (Recommended)
EMAIL_PROVIDER=brevo
BREVO_API_KEY=your-brevo-api-key

# Option 2: SendGrid
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
```

### Instagram DM Automation (New)
```bash
INSTAGRAM_USERNAME=your_instagram_username
INSTAGRAM_PASSWORD=your_instagram_password
```

### Shopify Integration
```bash
SHOPIFY_SHOP_NAME=your-shop-name
SHOPIFY_ACCESS_TOKEN=your-access-token
```

### Slack Notifications
```bash
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=your-slack-channel-id
```

## 🧪 Split Testing

### Email Split Tests
- **Variant A**: Brand Ambassador approach
- **Variant B**: Gift-First approach
- **Variant C**: Social Proof approach
- **Variant D**: Problem-Solution approach

### Instagram DM Split Tests
- **Variant A**: Casual & Friendly
- **Variant B**: Compliment-First
- **Variant C**: Story-Reply style
- **Variant D**: Problem/Solution

### Features
- **Automatic winner detection** with statistical significance
- **Real-time performance tracking**
- **Campaign-specific configurations**
- **Slack notifications** for test results

## 📊 Dashboard Features

### Launch Tab
- **Campaign Setup**: Create new campaigns with targeting
- **Template Selection**: Choose email or DM templates
- **Split Testing**: Enable A/B testing with custom configurations
- **Bulk Actions**: Launch to multiple influencers simultaneously

### Campaigns Tab
- **Active Campaigns**: Monitor ongoing campaigns
- **Performance Metrics**: Response rates, conversion rates
- **Influencer Journey**: Track progress through sales funnel
- **Manual Actions**: Approve, reject, or modify campaigns

### Database Tab
- **Influencer Management**: Search, filter, and manage influencers
- **Journey Tracking**: See complete influencer lifecycle
- **Bulk Operations**: Export, import, and mass updates
- **Segmentation**: Create custom audience segments

### Instagram Tab
- **DM Conversations**: Real-time Instagram conversations
- **Response Management**: AI-powered response suggestions
- **Account Health**: Monitor Instagram account status
- **DM Statistics**: Track sending and response rates

### Dashboard Tab
- **Real-time Analytics**: Campaign performance overview
- **Conversion Funnel**: Track influencer journey stages
- **Revenue Tracking**: Monitor ROI and conversion rates
- **Performance Trends**: Historical data and insights

## 🔄 Automation Features

### 24/7 Automation Manager
- **Email Monitoring**: Checks inbox every 5 minutes
- **Instagram DM Monitoring**: Checks DMs every 5 minutes
- **AI Response Processing**: Automated response analysis
- **Follow-up Scheduling**: Intelligent follow-up timing
- **Split Test Management**: Automatic winner detection

### Scheduled Tasks
- **Daily Discovery**: Find new influencers at 9 AM
- **Content Monitoring**: Check for new posts every 30 minutes
- **Follow-up Processing**: Send follow-ups every 6 hours
- **Daily Summaries**: Campaign reports at 9 AM
- **Weekly Reports**: Performance analysis every Monday

### AI Integration
- **Response Analysis**: Sentiment and intent detection
- **Negotiation Handling**: Automated negotiation responses
- **Shipping Info Extraction**: Parse addresses and contact info
- **Content Quality Assessment**: Evaluate posted content
- **Engagement Prediction**: Predict campaign success

## 🔐 Security & Privacy

### Instagram Sessions
- Sessions encrypted and stored locally
- Automatic session refresh and maintenance
- No password storage in plain text
- Challenge handling for security verification

### Data Protection
- All credentials in environment variables
- Firebase security rules for data access
- Encrypted communication with APIs
- Audit logs for all actions

### Rate Limiting
- Instagram API rate limits respected
- Account health monitoring
- Automatic cooldown periods
- Account rotation for high volume

## 📈 Performance Optimization

### High Volume Campaigns
- **Multiple Instagram Accounts**: Add accounts for higher DM volume
- **Smart Queuing**: Prioritize high-value targets
- **Batch Processing**: Efficient database operations
- **Caching**: Reduce API calls with intelligent caching

### Monitoring & Alerts
- **Slack Integration**: Real-time campaign alerts
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Track system performance
- **Health Checks**: Monitor all service dependencies

## 🚀 Deployment

### Production Deployment
```bash
# Build frontend
cd frontend && npm run build && cd ..

# Start production server
NODE_ENV=production npm start
```

### Vercel Deployment
```bash
# Deploy frontend
vercel --prod

# Backend runs on your server
# Configure environment variables in production
```

## 📞 Support

For technical support or questions:
- Check logs in `/health` endpoint
- Monitor automation status at `/api/automation/status`
- Review Instagram DM stats at `/api/instagram/stats`
- Check split test performance at `/api/split-tests/performance`

## 🔄 Updates

**Latest Version**: Real Instagram DM automation with 40 messages/day limit
- ✅ instagram-private-api integration
- ✅ Account rotation and session management
- ✅ AI-powered DM response processing
- ✅ Split testing for DM campaigns
- ✅ Real-time conversation monitoring
- ✅ Automated shipping info collection

## 📊 Hashtag Performance & Duplicate Prevention

The system now includes comprehensive hashtag tracking and duplicate prevention to optimize your influencer outreach:

### 🏷️ Hashtag Performance Analysis

**Every influencer discovered is automatically tagged with the hashtags used to find them**, allowing you to track which hashtags deliver the best results:

- **Conversion Rate Tracking**: See which hashtags lead to actual product shipments
- **Response Rate Analysis**: Track which hashtags get better response rates  
- **ROI Optimization**: Focus budget on hashtags that convert
- **Performance Insights**: Get actionable recommendations

#### API Endpoints:
```bash
# Get hashtag performance analysis
GET /api/campaigns/hashtag-performance

# Example response:
{
  "success": true,
  "hashtag_performance": {
    "#skincare": {
      "total_discovered": 25,
      "contacted": 20,
      "responded": 8,
      "converted": 3,
      "conversion_rate": 15,
      "response_rate": 40,
      "avg_followers": 45000
    }
  },
  "insights": {
    "top_performers": [
      {
        "hashtag": "#skincare",
        "conversion_rate": "15%",
        "recommendation": "#skincare converts at 15% - focus here"
      }
    ],
    "recommendations": [
      "Double down on #skincare - it has the highest conversion rate",
      "Focus on hashtags with >5% conversion rate for future campaigns"
    ]
  }
}
```

### 🚫 Duplicate Prevention System

**Never contact the same influencer twice** - the system automatically prevents duplicate outreach across all channels:

- **Cross-Channel Protection**: Prevents duplicates between email and Instagram DMs
- **Database Integration**: Checks existing influencers before adding new ones
- **Journey Tracking**: Knows if someone was already contacted
- **Smart Detection**: Handles variations like @username vs username

#### API Endpoints:
```bash
# Check for duplicates before discovery
POST /api/campaigns/check-duplicates
{
  "handles": ["@beauty_guru1", "@skincare_expert", "beauty_guru1"]
}

# Response shows existing status:
{
  "success": true,
  "total_checked": 3,
  "duplicates": [],
  "unique_count": 2,
  "outreach_status": [
    {
      "handle": "@beauty_guru1",
      "exists": true,
      "was_contacted": true,
      "current_stage": "responded",
      "last_contact": "2025-06-14T08:00:00.000Z",
      "source_hashtags": ["#skincare", "#beauty"],
      "can_contact": false
    }
  ],
  "safe_to_contact": 1
}
```

### 🔄 Automated Integration

The duplicate prevention and hashtag tracking work automatically:

#### Discovery Process:
1. **Hashtag Discovery**: System discovers influencers using specified hashtags
2. **Duplicate Check**: Automatically checks if influencers already exist
3. **Smart Storage**: Only stores new influencers with hashtag attribution
4. **Performance Tracking**: Tracks journey progression for analytics

#### Outreach Process:
1. **Pre-Send Validation**: Checks if influencer was already contacted
2. **Cross-Channel Prevention**: Prevents email if already sent DM (and vice versa)
3. **Journey Updates**: Updates influencer status automatically
4. **Performance Attribution**: Links results back to source hashtags

### 📈 Smart Recommendations

The system provides actionable insights:

- **"Double down on #skincare"** - Shows which hashtags have highest conversion rates
- **"Phase out #generic hashtags"** - Identifies hashtags that discover influencers but don't convert
- **"Test similar hashtags"** - Suggests expanding successful hashtag themes
- **Follower Quality Analysis** - Shows average follower count by hashtag

### 🎯 Campaign Optimization

Use hashtag performance data to optimize campaigns:

1. **Discovery**: Start with broad hashtag mix
2. **Analysis**: After 2-3 weeks, check hashtag performance
3. **Optimization**: Focus budget on converting hashtags
4. **Expansion**: Test hashtags similar to top performers
5. **Elimination**: Remove hashtags with 0% conversion after 10+ discoveries

### 💡 Best Practices

**Hashtag Strategy:**
- Start with 5-8 hashtags per campaign
- Mix broad (#beauty) and niche (#athomeIPL) hashtags  
- Check performance weekly
- Replace non-converting hashtags after 2 weeks

**Duplicate Prevention:**
- System handles this automatically
- Check `/api/campaigns/check-duplicates` before manual outreach
- Review skipped duplicates in campaign reports
- Use different messaging if re-engaging after 6+ months

### 🔧 Technical Implementation

**Database Schema:**
```javascript
// Influencer record includes:
{
  source_hashtags: ["#skincare", "#beauty"], // Which hashtags found this person
  journey_stage: "discovered", // Current status
  last_contact_date: "2025-06-14",
  dm_sent_count: 0,
  email_sent_count: 1
}
```

**Duplicate Detection:**
- Case-insensitive handle matching
- Handles @ prefix variations
- Cross-references email AND Instagram DM history
- Prevents double-outreach across channels

This system ensures you **never waste time on duplicates** and can **focus on hashtags that actually convert** influencers into brand ambassadors!

---

## �� Quick Start Guide
# Test Auto-Deploy
