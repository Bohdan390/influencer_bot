# 🚀 Digital Ocean Deployment Guide

## Method 1: Digital Ocean App Platform (Recommended)

### Step 1: Prepare Your Repository
1. **Push all changes to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Digital Ocean deployment"
   git push origin main
   ```

### Step 2: Create Digital Ocean App
1. **Go to Digital Ocean App Platform:**
   - Visit: https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Connect GitHub Repository:**
   - Select "GitHub" as source
   - Choose your repository: `permain2/Influencermarketingbot`
   - Select branch: `main`
   - Choose source directory: `/` (root)

3. **Configure App Settings:**
   - **App Name:** `dermao-influencer-connect`
   - **Region:** Choose closest to your users
   - **Instance Size:** Basic XS (1GB RAM, 1 vCPU)

### Step 3: Configure Environment Variables
In the Digital Ocean App Platform dashboard:

**Required Secrets (mark as SECRET):**
```
FIREBASE_PROJECT_ID = influencer-marketing-bot
FIREBASE_PRIVATE_KEY_ID = [your_firebase_private_key_id]
FIREBASE_PRIVATE_KEY = [your_firebase_private_key]
FIREBASE_CLIENT_EMAIL = [your_firebase_client_email]
FIREBASE_CLIENT_ID = [your_firebase_client_id]
BREVO_API_KEY = [your_brevo_api_key]
APIFY_API_TOKEN = [your_apify_api_token]
SHOPIFY_SHOP_NAME = [your_shopify_shop_name]
SHOPIFY_ACCESS_TOKEN = [your_shopify_access_token]
SHOPIFY_API_KEY = [your_shopify_api_key]
SHOPIFY_API_SECRET = [your_shopify_api_secret]
GEMINI_API_KEY = [your_gemini_api_key]
SUPABASE_URL = [your_supabase_url]
SUPABASE_ANON_KEY = [your_supabase_anon_key]
```

**Public Variables:**
```
NODE_ENV = production
PORT = 8080
FROM_EMAIL = partnerships@dermao.com
FROM_NAME = Dermao Partnership Team
EMAIL_PROVIDER = brevo
DEFAULT_PRODUCT_VALUE = 299
CAMPAIGN_HASHTAG = #DermaoPartner
BRAND_INSTAGRAM = @dermao.official
AI_PROVIDER = gemini
VITE_API_BASE_URL = https://dermao-influencer-connect-xxxxx.ondigitalocean.app
```

### Step 4: Deploy
1. **Review Configuration:**
   - Check all environment variables
   - Verify build command: `npm ci && cd frontend && npm ci && npm run build`
   - Verify run command: `node src/app.js`

2. **Deploy:**
   - Click "Create Resources"
   - Wait for deployment (5-10 minutes)

3. **Get Your URL:**
   - After deployment, you'll get a URL like: `https://dermao-influencer-connect-xxxxx.ondigitalocean.app`
   - Update `VITE_API_BASE_URL` with this URL

## Method 2: Digital Ocean Droplet (Alternative)

### Step 1: Create Droplet
1. **Create Ubuntu 22.04 Droplet:**
   - Size: 1GB RAM, 1 vCPU (Basic plan)
   - Region: Choose closest to your users
   - Add SSH key for access

### Step 2: Server Setup
```bash
# Connect to your droplet
ssh root@your_droplet_ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Git
apt install git -y
```

### Step 3: Deploy Application
```bash
# Clone repository
git clone https://github.com/permain2/Influencermarketingbot.git
cd Influencermarketingbot

# Install dependencies
npm install
cd frontend && npm install && npm run build && cd ..

# Copy environment file
cp .env.production .env
# Edit .env with your actual values
nano .env

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Step 4: Configure Nginx (Optional)
```bash
# Install Nginx
apt install nginx -y

# Create Nginx config
cat > /etc/nginx/sites-available/dermao-influencer <<EOF
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/dermao-influencer /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Post-Deployment Verification

### 1. Health Checks
```bash
# Check if app is running
curl https://your-app-url.ondigitalocean.app/health

# Check API endpoints
curl https://your-app-url.ondigitalocean.app/api/campaigns/stats
```

### 2. Database Setup
1. **Run Database Migration:**
   ```sql
   -- Execute supabase_complete_schema_update.sql in your Supabase dashboard
   ```

### 3. Test Core Features
- [ ] Frontend loads correctly
- [ ] Campaign launcher works
- [ ] Database view shows data
- [ ] Email sending works
- [ ] WebSocket connections work

## Monitoring & Maintenance

### PM2 Commands (Droplet Method)
```bash
# View logs
pm2 logs influencer-marketing-bot

# Restart app
pm2 restart influencer-marketing-bot

# Stop app
pm2 stop influencer-marketing-bot

# Monitor
pm2 monit
```

### Digital Ocean App Platform
- Use the dashboard to monitor logs
- Set up alerts for errors
- Monitor resource usage

## Troubleshooting

### Common Issues
1. **Build Fails:** Check Node.js version (needs 18+)
2. **Environment Variables:** Ensure all secrets are set
3. **Database Connection:** Verify Supabase credentials
4. **Frontend Not Loading:** Check VITE_API_BASE_URL

### Logs
- **App Platform:** Check deployment logs in dashboard
- **Droplet:** `pm2 logs` or `journalctl -u your-service`

## Security Considerations
- [ ] Use HTTPS (automatic with App Platform)
- [ ] Keep environment variables secure
- [ ] Regular security updates
- [ ] Monitor for suspicious activity

## Cost Optimization
- **App Platform:** ~$5-12/month for basic plan
- **Droplet:** ~$6/month for 1GB droplet
- **Database:** Supabase free tier (500MB)
- **APIs:** Pay per use for Apify, Brevo, etc.
