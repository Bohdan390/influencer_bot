# 🚀 Digital Ocean Deployment Checklist

## Pre-Deployment Requirements

### 1. Environment Variables Setup
Ensure all required environment variables are configured in Digital Ocean:

**Required Secrets:**
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_PRIVATE_KEY_ID`
- [ ] `FIREBASE_PRIVATE_KEY`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_CLIENT_ID`
- [ ] `BREVO_API_KEY`
- [ ] `APIFY_TOKEN`
- [ ] `SHOPIFY_SHOP_NAME`
- [ ] `SHOPIFY_ACCESS_TOKEN`
- [ ] `SHOPIFY_API_KEY`
- [ ] `SHOPIFY_API_SECRET`
- [ ] `GEMINI_API_KEY`

**Optional Variables:**
- [ ] `FROM_EMAIL` (your sending email)
- [ ] `FROM_NAME` (default: "Dermao Partnership Team")

### 2. Database Setup
- [ ] Supabase project created
- [ ] Database tables created (run `supabase_complete_schema_update.sql`)
- [ ] Supabase URL and API key configured

### 3. API Keys Verification
- [ ] Firebase Admin SDK configured
- [ ] Brevo (Sendinblue) API key active
- [ ] Apify API token valid
- [ ] Shopify API credentials working
- [ ] Gemini AI API key active

### 4. Frontend Build
- [ ] Frontend builds successfully (`npm run build`)
- [ ] All dependencies installed
- [ ] Environment variables configured for frontend

## Deployment Steps

### Option 1: Digital Ocean App Platform (Recommended)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically

### Option 2: Digital Ocean Droplet
1. Create Ubuntu droplet
2. Install Node.js 18+
3. Clone repository
4. Run deployment script
5. Configure PM2

## Post-Deployment Verification
- [ ] Application accessible via URL
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] Email sending functional
- [ ] WebSocket connections working
- [ ] Frontend loading correctly
