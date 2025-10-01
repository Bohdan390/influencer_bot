-- 🔄 Complete Supabase Schema Update
-- Run this SQL in your Supabase SQL editor to add all missing tables and columns

-- ✅ 1. Add missing columns to influencers table
ALTER TABLE public.influencers 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500),
ADD COLUMN IF NOT EXISTS external_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS discovery_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS journey_milestones JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS campaigns UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(5,2) DEFAULT 0;

-- ✅ 2. Create split_tests table
CREATE TABLE IF NOT EXISTS public.split_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed'
    test_type VARCHAR(100) NOT NULL, -- 'email_template', 'dm_template', 'timing', 'subject_line'
    variants JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of test variants
    winner_variant VARCHAR(255), -- ID of winning variant
    test_parameters JSONB DEFAULT '{}'::jsonb, -- Additional test configuration
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    total_participants INTEGER DEFAULT 0,
    results JSONB DEFAULT '{}'::jsonb, -- Test results and metrics
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ 3. Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}'::jsonb, -- All user settings as JSON
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ 4. Create email_campaigns table
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    influencer_id UUID REFERENCES public.influencers(id) ON DELETE CASCADE,
    influencer_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ 5. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    influencer_handle VARCHAR(255),
    sender_type VARCHAR(50) NOT NULL, -- 'user', 'influencer', 'system'
    subject VARCHAR(500),
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'email', 'dm'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_influencers_is_verified ON public.influencers(is_verified);
CREATE INDEX IF NOT EXISTS idx_influencers_discovery_date ON public.influencers(discovery_date);
CREATE INDEX IF NOT EXISTS idx_influencers_quality_score ON public.influencers(quality_score);
CREATE INDEX IF NOT EXISTS idx_influencers_campaigns ON public.influencers USING GIN(campaigns);

CREATE INDEX IF NOT EXISTS idx_split_tests_status ON public.split_tests(status);
CREATE INDEX IF NOT EXISTS idx_split_tests_test_type ON public.split_tests(test_type);
CREATE INDEX IF NOT EXISTS idx_split_tests_created_at ON public.split_tests(created_at);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_recipient ON public.email_campaigns(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_sent_at ON public.email_campaigns(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_campaign_id ON public.email_campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_influencer_id ON public.email_campaigns(influencer_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_campaign_id ON public.chat_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_influencer_id ON public.chat_messages(influencer_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON public.chat_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_settings_id ON public.user_settings(id);

-- ✅ 5. Add triggers to automatically update updated_at fields
CREATE TRIGGER update_split_tests_updated_at BEFORE UPDATE ON public.split_tests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ✅ 6. Update existing influencers records with default values
UPDATE public.influencers 
SET 
    bio = COALESCE(bio, ''),
    profile_picture = COALESCE(profile_picture, ''),
    external_url = COALESCE(external_url, ''),
    is_verified = COALESCE(is_verified, FALSE),
    post_count = COALESCE(post_count, 0),
    discovery_date = COALESCE(discovery_date, created_at),
    journey_milestones = COALESCE(journey_milestones, '{}'::jsonb),
    campaigns = COALESCE(campaigns, '{}'),
    quality_score = COALESCE(quality_score, 0)
WHERE 
    bio IS NULL OR 
    profile_picture IS NULL OR 
    external_url IS NULL OR 
    is_verified IS NULL OR 
    post_count IS NULL OR 
    discovery_date IS NULL OR 
    journey_milestones IS NULL OR 
    campaigns IS NULL OR 
    quality_score IS NULL;

-- ✅ 7. Insert default user settings for existing users
INSERT INTO public.user_settings (id, settings)
SELECT id, '{
  "targeting": {
    "follower_range": {"min": 10000, "max": 100000},
    "engagement_rate_min": 2.0,
    "location_preferences": [],
    "niche_categories": ["beauty", "skincare", "lifestyle"]
  },
  "outreach": {
    "daily_limit": 100,
    "email_templates": ["collaboration", "partnership", "gift"],
    "dm_templates": ["collaboration_dm", "partnership_dm"],
    "follow_up_schedule": [1, 3, 7]
  },
  "automation": {
    "auto_discovery": true,
    "auto_outreach": false,
    "auto_follow_up": true,
    "post_detection": true
  },
  "notifications": {
    "email_alerts": true,
    "slack_alerts": true,
    "daily_reports": true
  }
}'::jsonb
FROM public.users
WHERE id NOT IN (SELECT id FROM public.user_settings)
ON CONFLICT (id) DO NOTHING;

-- ✅ 8. Verify the schema update
SELECT 
    'influencers' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'influencers' 
AND table_schema = 'public'
AND column_name IN ('bio', 'profile_picture', 'external_url', 'is_verified', 'post_count', 'discovery_date', 'journey_milestones', 'campaigns', 'quality_score')

UNION ALL

SELECT 
    'split_tests' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'split_tests' 
AND table_schema = 'public'

UNION ALL

SELECT 
    'user_settings' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND table_schema = 'public'

ORDER BY table_name, column_name;

-- 🎉 Complete schema update finished!
-- All missing tables and columns have been added.
