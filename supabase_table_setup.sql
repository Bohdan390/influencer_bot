-- 🗃️ Supabase Table Setup for Influencer Marketing Bot
-- Run this SQL in your Supabase SQL editor to create all necessary tables

-- Enable RLS (Row Level Security) - recommended for production
-- You can modify these policies based on your security needs

-- ✅ 1. Create influencers table
CREATE TABLE IF NOT EXISTS public.influencers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    instagram_handle VARCHAR(255),
    name VARCHAR(255),
    full_name VARCHAR(255),
    followers INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    source_hashtags TEXT[], -- Array of hashtags
    status VARCHAR(50) DEFAULT 'discovered',
    journey_stage VARCHAR(50) DEFAULT 'discovered',
    contact_method VARCHAR(50) DEFAULT 'email',
    contact_attempts INTEGER DEFAULT 0,
    
    -- Journey tracking (converted from Firebase nested object)
    journey_discovered_at TIMESTAMPTZ DEFAULT NOW(),
    journey_reached_out BOOLEAN DEFAULT FALSE,
    journey_reached_out_at TIMESTAMPTZ,
    journey_responded BOOLEAN DEFAULT FALSE,
    journey_responded_at TIMESTAMPTZ,
    journey_agreed_to_deal BOOLEAN DEFAULT FALSE,
    journey_agreed_at TIMESTAMPTZ,
    journey_shipping_address_provided BOOLEAN DEFAULT FALSE,
    journey_address_provided_at TIMESTAMPTZ,
    journey_product_shipped BOOLEAN DEFAULT FALSE,
    journey_shipped_at TIMESTAMPTZ,
    journey_tracking_number VARCHAR(255),
    journey_delivery_confirmed BOOLEAN DEFAULT FALSE,
    journey_delivered_at TIMESTAMPTZ,
    journey_content_posted BOOLEAN DEFAULT FALSE,
    journey_posted_at TIMESTAMPTZ,
    journey_post_url VARCHAR(500),
    journey_post_likes INTEGER DEFAULT 0,
    journey_post_comments INTEGER DEFAULT 0,
    journey_post_views INTEGER DEFAULT 0,
    journey_follow_up_1_sent BOOLEAN DEFAULT FALSE,
    journey_follow_up_1_at TIMESTAMPTZ,
    journey_follow_up_2_sent BOOLEAN DEFAULT FALSE,
    journey_follow_up_2_at TIMESTAMPTZ,
    journey_follow_up_3_sent BOOLEAN DEFAULT FALSE,
    journey_follow_up_3_at TIMESTAMPTZ,
    journey_campaign_completed BOOLEAN DEFAULT FALSE,
    journey_completed_at TIMESTAMPTZ,
    journey_final_status VARCHAR(50), -- 'success', 'no_response', 'declined', 'failed'
    
    -- Conversation thread (JSON array)
    conversation_thread JSONB DEFAULT '[]'::jsonb,
    
    -- AI analysis (JSON object)
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    
    -- Engagement metrics
    engagement_emails_sent INTEGER DEFAULT 0,
    engagement_emails_opened INTEGER DEFAULT 0,
    engagement_emails_clicked INTEGER DEFAULT 0,
    engagement_emails_responded INTEGER DEFAULT 0,
    engagement_avg_response_time_hours DECIMAL(10,2),
    engagement_score DECIMAL(5,2) DEFAULT 0,
    
    -- Additional fields
    campaign_id UUID,
    contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ 2. Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    contacted INTEGER DEFAULT 0,
    responded INTEGER DEFAULT 0,
    shipped INTEGER DEFAULT 0,
    posted INTEGER DEFAULT 0,
    spent DECIMAL(10,2) DEFAULT 0,
    budget DECIMAL(10,2),
    target_influencers INTEGER,
    hashtags TEXT[],
    product_value DECIMAL(10,2) DEFAULT 299,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ 3. Create emails table  
CREATE TABLE IF NOT EXISTS public.emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    influencer_id UUID REFERENCES public.influencers(id),
    campaign_id UUID REFERENCES public.campaigns(id),
    subject VARCHAR(500),
    content TEXT,
    template_used VARCHAR(100),
    status VARCHAR(50) DEFAULT 'sent',
    opened BOOLEAN DEFAULT FALSE,
    clicked BOOLEAN DEFAULT FALSE,
    responded BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    response_received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ 4. Create email_responses table
CREATE TABLE IF NOT EXISTS public.email_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    influencer_id UUID REFERENCES public.influencers(id),
    original_email_id UUID REFERENCES public.emails(id),
    content TEXT,
    sentiment VARCHAR(50),
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    processed BOOLEAN DEFAULT FALSE,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ 5. Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    influencer_id UUID REFERENCES public.influencers(id),
    campaign_id UUID REFERENCES public.campaigns(id),
    platform VARCHAR(50) DEFAULT 'instagram',
    post_url VARCHAR(500),
    post_id VARCHAR(255),
    content TEXT,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2),
    posted_at TIMESTAMPTZ,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ 6. Create users table (for authentication)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Optional if using Supabase Auth
    role VARCHAR(50) DEFAULT 'admin',
    name VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_influencers_email ON public.influencers(email);
CREATE INDEX IF NOT EXISTS idx_influencers_instagram_handle ON public.influencers(instagram_handle);
CREATE INDEX IF NOT EXISTS idx_influencers_status ON public.influencers(status);
CREATE INDEX IF NOT EXISTS idx_influencers_journey_stage ON public.influencers(journey_stage);
CREATE INDEX IF NOT EXISTS idx_influencers_source_hashtags ON public.influencers USING GIN(source_hashtags);
CREATE INDEX IF NOT EXISTS idx_influencers_created_at ON public.influencers(created_at);

CREATE INDEX IF NOT EXISTS idx_emails_influencer_id ON public.emails(influencer_id);
CREATE INDEX IF NOT EXISTS idx_emails_campaign_id ON public.emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON public.emails(sent_at);

CREATE INDEX IF NOT EXISTS idx_posts_influencer_id ON public.posts(influencer_id);
CREATE INDEX IF NOT EXISTS idx_posts_campaign_id ON public.posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_posts_posted_at ON public.posts(posted_at);

-- ✅ 8. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ✅ 9. Add triggers to automatically update updated_at fields
CREATE TRIGGER update_influencers_updated_at BEFORE UPDATE ON public.influencers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON public.emails 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ✅ 10. Insert default user
INSERT INTO public.users (email, role, name, active) 
VALUES ('per@markusakerlund.com', 'admin', 'Per Markus', true)
ON CONFLICT (email) DO NOTHING;

-- ✅ 11. Enable Row Level Security (optional - you can customize these policies)
-- ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- ✅ 12. Create basic RLS policies (uncomment to enable)
-- CREATE POLICY "Users can view all data" ON public.influencers FOR SELECT USING (true);
-- CREATE POLICY "Users can modify all data" ON public.influencers FOR ALL USING (true);

-- 🎉 Setup complete! Your Supabase database is ready for the Influencer Marketing Bot

-- 📊 Verify setup with these queries:
-- SELECT COUNT(*) as influencers_count FROM public.influencers;
-- SELECT COUNT(*) as campaigns_count FROM public.campaigns;
-- SELECT COUNT(*) as users_count FROM public.users;
-- SELECT * FROM public.users WHERE email = 'per@markusakerlund.com'; 