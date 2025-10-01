# Dermao Influencer Marketing Bot - Lovable Frontend Guide

## 🎯 Project Overview
This is an automated influencer marketing system for Dermao's IPL hair laser campaigns. The backend is fully functional with Instagram scraping, email automation, Shopify integration, and post tracking.

## 🏗️ Current Backend Architecture

### ✅ Fully Functional APIs
- **Health Check**: `GET /health` - System status
- **Templates**: `GET /api/campaigns/test/templates` - All email templates
- **Email Testing**: `POST /api/campaigns/test/email` - Send test emails
- **Discovery**: `POST /api/campaigns/test/discovery` - Find influencers
- **Database**: `POST /api/campaigns/test/database` - Database operations
- **Shopify**: `POST /api/campaigns/test/shopify` - E-commerce integration
- **Apify**: `POST /api/campaigns/test/apify` - Instagram scraping

### 🔌 Integrated Services
- **Firebase**: Database and analytics
- **Apify**: Instagram data scraping
- **Brevo**: Email automation
- **Shopify**: Order fulfillment
- **Real-time data**: Live campaign tracking

## 🎨 Frontend Requirements for Lovable

### 1. 📊 Live Activity Dashboard
**Endpoint**: `GET /health` + `GET /api/campaigns/stats`

**Components Needed**:
```jsx
// Live Feed Component
<LiveActivityFeed>
  - Influencers discovered: 127 (last 24h)
  - Emails extracted: 98 (76% success rate)
  - Outreach sent: 85 emails
  - Responses received: 12 (14% response rate)  
  - Products shipped: 3 orders
  - Posts tracked: 1 new post
</LiveActivityFeed>

// Real-time Chart
<ActivityChart>
  - Line chart showing activity over time
  - Metrics: Discovery, Outreach, Responses, Shipments
  - Time filters: 24h, 7d, 30d
</ActivityChart>
```

**Data Structure**:
```json
{
  "influencers_discovered": 127,
  "emails_found": 98,
  "outreach_sent": 85,
  "responses_received": 12,
  "response_rate": 14.1,
  "products_shipped": 3,
  "posts_tracked": 1,
  "last_updated": "2024-01-07T13:33:48Z"
}
```

### 2. ⚙️ Settings Page
**Endpoint**: `POST /api/settings` (needs to be created)

**Components Needed**:
```jsx
<SettingsPage>
  <APIKeySection>
    - Firebase Config (Project ID, Private Key, etc.)
    - Apify API Token
    - Brevo API Key  
    - Shopify Credentials
    - Test Connection buttons
  </APIKeySection>
  
  <CampaignSettings>
    - Target follower range (10k-100k)
    - Target hashtags (#beauty, #skincare)
    - Email sending limits
    - Follow-up schedules
  </CampaignSettings>
</SettingsPage>
```

### 3. 📧 Email Templates Manager
**Endpoint**: `GET /api/campaigns/test/templates`

**Current Templates Available**:
- `initial_outreach` - Brand ambassador test invitation
- `ask_for_address` - Request shipping address
- `ask_for_consent` - Request consent for content
- `ask_for_both` - Request both address and consent
- `ship_order` - Order processing confirmation
- `order_shipped` - Shipping notification
- `payment_inquiry` - Payment questions response
- `non_target_country` - Non-target country decline
- `follow_up_1` - First follow-up
- `follow_up_2` - Final follow-up

**Components Needed**:
```jsx
<EmailTemplatesManager>
  <TemplateList>
    - Template cards with preview
    - Edit, duplicate, delete actions
    - Template statistics (sent, opened, replied)
  </TemplateList>
  
  <TemplateEditor>
    - Rich text editor with variables
    - Subject line editor
    - Template variables: {{first_name}}, {{tracking_number}}, etc.
    - Preview mode
    - A/B testing options
  </TemplateEditor>
</EmailTemplatesManager>
```

### 4. 💬 Email Threads View (Gmail-style)
**Endpoint**: `GET /api/conversations/:influencer_id` (needs to be created)

**Components Needed**:
```jsx
<EmailThreadsView>
  <ConversationList>
    - List of influencer conversations
    - Status indicators (new, replied, shipped, etc.)
    - Search and filter options
    - Response rate indicators
  </ConversationList>
  
  <ConversationDetail>
    - Gmail-style thread view
    - All emails in chronological order
    - Quick reply options
    - Action buttons (Ship product, Mark as interested, etc.)
    - Influencer profile sidebar
  </ConversationDetail>
</EmailThreadsView>
```

**Data Structure for Conversations**:
```json
{
  "conversation_id": "conv_123",
  "influencer": {
    "name": "Sarah Johnson",
    "handle": "@sarahbeauty",
    "followers": 45000,
    "email": "sarah@example.com"
  },
  "status": "interested", // new, contacted, interested, shipped, posted
  "emails": [
    {
      "id": "email_1",
      "template": "initial_outreach", 
      "sent_at": "2024-01-01T10:00:00Z",
      "opened": true,
      "clicked": false
    },
    {
      "id": "email_2",
      "type": "reply",
      "content": "Hi! I'm interested in trying your IPL device...",
      "received_at": "2024-01-02T14:30:00Z"
    }
  ]
}
```

## 🚀 Quick Start for Lovable

### Step 1: Connect to Backend
```javascript
// Base API URL
const API_BASE = 'http://localhost:3000'

// Test connection
fetch(`${API_BASE}/health`)
  .then(res => res.json())
  .then(data => console.log('Backend status:', data))
```

### Step 2: Get Live Data
```javascript
// Get current templates
fetch(`${API_BASE}/api/campaigns/test/templates`)
  .then(res => res.json())
  .then(templates => console.log('Available templates:', templates))

// Test email sending
fetch(`${API_BASE}/api/campaigns/test/email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'test@example.com',
    template: 'initial_outreach',
    data: { first_name: 'Sarah' }
  })
})
```

### Step 3: Get Influencer Data
```javascript
// Discover influencers
fetch(`${API_BASE}/api/campaigns/test/discovery`, {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hashtags: ['beauty', 'skincare'],
    limit: 10
  })
})
.then(res => res.json())
.then(influencers => console.log('Found influencers:', influencers))
```

## 📱 Recommended UI/UX Design

### Color Scheme
- Primary: #7C3AED (Purple) - matches Dermao branding
- Secondary: #10B981 (Green) - for success states
- Accent: #F59E0B (Orange) - for pending/warning states
- Neutral: #6B7280 (Gray) - for text and borders

### Layout Structure
```
┌─────────────────────────────────────────┐
│ Header: Dermao Bot | Settings | Profile │
├─────────────────────────────────────────┤
│ Sidebar:                    │ Main Area │
│ - Dashboard                 │           │
│ - Live Feed                 │ Dashboard │
│ - Email Threads             │ or        │
│ - Templates                 │ Current   │
│ - Settings                  │ Page      │
│ - Analytics                 │ Content   │
└─────────────────────────────────────────┘
```

### Key Interactions
1. **Live Updates**: Use WebSockets or polling for real-time data
2. **Drag & Drop**: For template management
3. **Quick Actions**: One-click buttons for common tasks
4. **Smart Filters**: Auto-suggest based on campaign data
5. **Responsive Design**: Mobile-friendly for on-the-go management

## 🔥 Advanced Features to Consider

1. **AI-Powered Suggestions**: 
   - Smart template recommendations
   - Optimal send time suggestions
   - Response likelihood scoring

2. **Bulk Operations**:
   - Mass email sending
   - Bulk template updates
   - Batch influencer import

3. **Campaign Analytics**:
   - ROI calculations
   - Performance trends
   - A/B testing results

4. **Automation Rules**:
   - Auto-follow-up sequences
   - Smart response categorization
   - Automatic shipping triggers

## 📦 What's Already Built & Ready

✅ **Backend API**: Fully functional with all integrations
✅ **Email Templates**: 10 professional templates ready
✅ **Database**: Firebase with proper data structure  
✅ **Email Service**: Brevo integration working
✅ **E-commerce**: Shopify integration for product shipping
✅ **Data Collection**: Instagram scraping via Apify
✅ **Real-time Tracking**: Live campaign monitoring

## 🎯 What Lovable Should Build

🎨 **Modern React Frontend** with:
- Real-time dashboard with live activity feed
- Gmail-style email threads interface  
- Professional email template editor
- Settings page for API configuration
- Mobile-responsive design
- Clean, intuitive UX focused on efficiency

The backend is rock-solid and ready to power an amazing frontend experience! 🚀 