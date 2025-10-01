const supabase = require('./supabase');

let db = null;
let connectionRetries = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Database type selection
const DATABASE_TYPE = process.env.DATABASE_TYPE || 'supabase';

/**
 * 🔄 Enhanced Supabase initialization with retry logic
 */
async function initializeSupabase() {
  try {
    // Check if Supabase is already initialized
    db = supabase.supabase();
    
    // Test the connection to make sure it's working
    // Validate environment variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required Supabase environment variables: ${missingVars.join(', ')}`);
    }

    // Initialize Supabase with enhanced settings
    db = supabase.initializeSupabase();
    
    connectionRetries = 0; // Reset retry counter on success
    
    return db;
  } catch (error) {
    console.error('❌ Supabase initialization failed:', error.message);
    
    // Retry logic for temporary failures
    if (connectionRetries < MAX_RETRIES) {
      connectionRetries++;
      console.log(`🔄 Retrying Supabase connection (${connectionRetries}/${MAX_RETRIES}) in ${RETRY_DELAY}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return await initializeSupabase();
    }
    
    console.error('💥 Supabase initialization failed after maximum retries');
    throw error;
  }
}

/**
 * 🔄 Initialize database connection
 */
async function initializeDatabase() {
  try {
    if (DATABASE_TYPE === 'supabase') {
      await initializeSupabase();
    } else {
      throw new Error(`Unsupported database type: ${DATABASE_TYPE}`);
    }
    
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

/**
 * 🔄 Get database instance
 */
async function getDatabase() {
  if (!db) {
    await initializeDatabase();
  }
  return db;
}

/**
 * 📊 Supabase Influencer Database Operations
 */
const supabaseInfluencers = {
  /**
   * Add new influencer
   */
  async add(influencerData) {
    try {
      const { data, error } = await supabase.supabase()
        .from('influencers')
        .insert([{
          email: influencerData.email,
          instagram_handle: influencerData.instagram_handle,
          name: influencerData.full_name || influencerData.name,
          followers: influencerData.followers || 0,
          engagement_rate: influencerData.engagement_rate || 0,
          source_hashtags: influencerData.source_hashtags || [],
          status: influencerData.status || 'discovered',
          contact_method: influencerData.contact_method || 'email',
          profile_picture: influencerData.profile_picture,
          bio: influencerData.bio,
          external_url: influencerData.external_url,
          is_verified: influencerData.is_verified || false,
          post_count: influencerData.post_count || 0,
          discovery_date: influencerData.discovery_date,
          journey_stage: influencerData.journey_stage || 'discovered',
          journey_milestones: influencerData.journey_milestones || {},
          conversation_thread: influencerData.conversation_thread || [],
          ai_analysis: influencerData.ai_analysis || {},
          campaigns: influencerData.campaigns || [],
          quality_score: influencerData.quality_score || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log(`✅ Added influencer: ${influencerData.instagram_handle}`);
      return data;
    } catch (error) {
      console.error('❌ Error adding influencer:', error.message);
      throw error;
    }
  },

  /**
   * Add multiple influencers in batch
   */
  async addBatch(influencersData) {
    try {
      if (!influencersData || influencersData.length === 0) {
        return { data: [], error: null };
      }

      // Map all influencer data to the correct format
      const mappedInfluencers = influencersData.map(influencerData => ({
        email: influencerData.email,
        instagram_handle: influencerData.instagram_handle,
        name: influencerData.full_name || influencerData.name,
        followers: influencerData.followers || 0,
        engagement_rate: influencerData.engagement_rate || 0,
        source_hashtags: influencerData.source_hashtags || [],
        status: influencerData.status || 'discovered',
        contact_method: influencerData.contact_method || 'email',
        profile_picture: influencerData.profile_picture,
        bio: influencerData.bio,
        external_url: influencerData.external_url,
        is_verified: influencerData.is_verified || false,
        post_count: influencerData.post_count || 0,
        discovery_date: influencerData.discovery_date,
        journey_stage: influencerData.journey_stage || 'discovered',
        journey_milestones: influencerData.journey_milestones || {},
        conversation_thread: influencerData.conversation_thread || [],
        ai_analysis: influencerData.ai_analysis || {},
        campaigns: influencerData.campaigns || [],
        quality_score: influencerData.quality_score || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase.supabase()
        .from('influencers')
        .upsert(mappedInfluencers, {
          onConflict: 'instagram_handle'
        })
        .select();

      if (error) throw error;
      
      console.log(`✅ Added ${data.length} influencers in batch`);
      return { data, error: null };
  } catch (error) {
      console.error('❌ Error adding influencers in batch:', error.message);
      throw error;
    }
  },

  /**
   * Get influencer by email
   */
  async getByEmail(email) {
    try {
      const { data, error } = await supabase.supabase()
        .from('influencers')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error getting influencer by email:', error.message);
      return null;
    }
  },

  /**
   * Get influencer by Instagram handle
   */
  async getByHandleInsensitive(handle) {
    try {
      const normalizedHandle = handle.toLowerCase().replace('@', '');
      
      const { data, error } = await supabase.supabase()
        .from('influencers')
        .select('*')
        .ilike('instagram_handle', `%${normalizedHandle}%`)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error getting influencer by handle:', error.message);
      return null;
    }
  },

  /**
   * Update influencer
   */
  async update(email, updates) {
    try {
      const { data, error } = await supabase.supabase()
        .from('influencers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select()
        .single();

      if (error) throw error;
      
      console.log(`✅ Updated influencer: ${email}`);
      return data;
    } catch (error) {
      console.error('❌ Error updating influencer:', error.message);
      throw error;
    }
  },

  /**
   * Get campaign stats
   */
  async getCRMDashboard() {
    try {
      // Get total counts
      const { count: totalInfluencers } = await supabase.supabase()
        .from('influencers')
        .select('*', { count: 'exact', head: true });

      const { count: emailsSent } = await supabase.supabase()
        .from('influencers')
        .select('*', { count: 'exact', head: true })
        .in('status', ['contacted', 'responded', 'agreed', 'shipped', 'posted']);

      const { count: responsesReceived } = await supabase.supabase()
        .from('influencers')
        .select('*', { count: 'exact', head: true })
        .in('status', ['responded', 'agreed', 'shipped', 'posted']);

      const { count: productsShipped } = await supabase.supabase()
        .from('influencers')
        .select('*', { count: 'exact', head: true })
        .in('status', ['shipped', 'posted']);

      const { count: postsTracked } = await supabase.supabase()
        .from('influencers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'posted');

      return {
        campaigns_active: 1,
        influencers_discovered: totalInfluencers || 0,
        emails_sent: emailsSent || 0,
        responses_received: responsesReceived || 0,
        products_shipped: productsShipped || 0,
        posts_tracked: postsTracked || 0,
        conversion_rate: emailsSent > 0 ? Math.round((responsesReceived / emailsSent) * 100) : 0,
        last_updated: new Date().toISOString(),
        backend_status: 'connected',
        message: 'Supabase connected - campaign data loaded successfully'
      };
    } catch (error) {
      console.error('❌ Error getting CRM dashboard:', error.message);
      return {
        campaigns_active: 1,
        influencers_discovered: 0,
          emails_sent: 0,
        responses_received: 0,
        products_shipped: 0,
        posts_tracked: 0,
        conversion_rate: 0,
        last_updated: new Date().toISOString(),
        backend_status: 'error',
        message: 'Error loading campaign data: ' + error.message
      };
    }
  },

  /**
   * Get comprehensive analytics based on journey milestones
   */
  async getAnalytics() {
    try {
      // Get all influencers with journey milestone data
      const { data: influencers, error } = await supabase.supabase()
        .from('influencers')
        .select('id, discovery_date, journey_stage, journey_reached_out_at, journey_responded_at, journey_agreed_at, journey_shipped_at, journey_posted_at, journey_stage, created_at, engagement_rate');

      if (error) throw error;

      // Calculate analytics based on journey milestone timestamps
      const now = new Date();
      const last30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const last7Days = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

      let analytics = {
        // Basic counts
        total_influencers: influencers.length,
        
        // Journey milestone counts
        reached_out: 0,
        responded: 0,
        agreed: 0,
        shipped: 0,
        posted: 0,
        
        // Conversion rates
        response_rate: 0,
        agreement_rate: 0,
        shipping_rate: 0,
        posting_rate: 0,
        
        // Daily activity data for charts
        daily_activity: []
      };

      // Generate daily activity data for the last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateStr = date.toISOString().split('T')[0];
        
        analytics.daily_activity.push({
          date: dateStr,
          discoveries: 0,
          reached_out: 0,
          responded: 0,
          agreed: 0,
          shipped: 0,
          posted: 0
        });
      }

      influencers.forEach(influencer => {
        const discoveryDate = influencer.discovery_date ? new Date(influencer.discovery_date) : new Date(influencer.created_at);
        
        // Update daily activity for discovery
        const discoveryDateStr = discoveryDate.toISOString().split('T')[0];
        const discoveryDay = analytics.daily_activity.find(day => day.date === discoveryDateStr);
        if (discoveryDay) discoveryDay.discoveries++;

        // Journey milestone counts
        if (influencer.journey_reached_out_at) {
          analytics.reached_out++;
          
          // Update daily activity
          const reachedOutDate = new Date(influencer.journey_reached_out_at);
          const reachedOutDateStr = reachedOutDate.toISOString().split('T')[0];
          const reachedOutDay = analytics.daily_activity.find(day => day.date === reachedOutDateStr);
          if (reachedOutDay) reachedOutDay.reached_out++;
        }

        if (influencer.journey_responded_at) {
          analytics.responded++;
          
          // Update daily activity
          const respondedDate = new Date(influencer.journey_responded_at);
          const respondedDateStr = respondedDate.toISOString().split('T')[0];
          const respondedDay = analytics.daily_activity.find(day => day.date === respondedDateStr);
          if (respondedDay) respondedDay.responded++;
        }

        if (influencer.journey_agreed_at) {
          analytics.agreed++;
          
          // Update daily activity
          const agreedDate = new Date(influencer.journey_agreed_at);
          const agreedDateStr = agreedDate.toISOString().split('T')[0];
          const agreedDay = analytics.daily_activity.find(day => day.date === agreedDateStr);
          if (agreedDay) agreedDay.agreed++;
        }

        if (influencer.journey_shipped_at) {
          analytics.shipped++;
          
          // Update daily activity
          const shippedDate = new Date(influencer.journey_shipped_at);
          const shippedDateStr = shippedDate.toISOString().split('T')[0];
          const shippedDay = analytics.daily_activity.find(day => day.date === shippedDateStr);
          if (shippedDay) shippedDay.shipped++;
        }

        if (influencer.journey_posted_at) {
          analytics.posted++;
          
          // Update daily activity
          const postedDate = new Date(influencer.journey_posted_at);
          const postedDateStr = postedDate.toISOString().split('T')[0];
          const postedDay = analytics.daily_activity.find(day => day.date === postedDateStr);
          if (postedDay) postedDay.posted++;
        }
      });

      // Calculate conversion rates
      analytics.response_rate = analytics.reached_out > 0 ? Math.round((analytics.responded / analytics.reached_out) * 100) : 0;
      analytics.agreement_rate = analytics.responded > 0 ? Math.round((analytics.agreed / analytics.responded) * 100) : 0;
      analytics.shipping_rate = analytics.agreed > 0 ? Math.round((analytics.shipped / analytics.agreed) * 100) : 0;
      analytics.posting_rate = analytics.shipped > 0 ? Math.round((analytics.posted / analytics.shipped) * 100) : 0;

      return analytics;
    } catch (error) {
      console.error('❌ Error getting analytics:', error.message);
      return {
        total_influencers: 0,
        reached_out: 0,
        responded: 0,
        agreed: 0,
        shipped: 0,
        posted: 0,
        response_rate: 0,
        agreement_rate: 0,
        shipping_rate: 0,
        posting_rate: 0,
        daily_activity: []
      };
    }
  },

  /**
   * Update influencer status
   */
  async updateStatus(influencerId, updateData) {
    try {
      const { data, error } = await supabase.supabase()
        .from('influencers')
        .update({
          journey_stage: updateData.journey_stage,
          updated_at: updateData.updated_at
        })
        .eq('id', influencerId)
        .select()
        .single();

      if (error) throw error;
      
      console.log(`✅ Updated influencer ${influencerId} status to ${updateData.journey_stage}`);
      return data;
    } catch (error) {
      console.error('❌ Error updating influencer status:', error.message);
      return null;
    }
  },

  /**
   * Get CRM list of influencers with filters
   */
  async getCRMList(limit = 100, filters = {}) {
    try {
      let query = supabase.supabase()
        .from('influencers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.journey_stage) {
        query = query.eq('journey_stage', filters.journey_stage);
      }
      if (filters.contact_method) {
        query = query.eq('contact_method', filters.contact_method);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log(`✅ Retrieved ${data?.length || 0} influencers for CRM list`);
      return data || [];
    } catch (error) {
      console.error('❌ Error getting CRM list:', error.message);
      return [];
    }
  },

  /**
   * Get influencers needing follow-up
   */
  async getNeedingFollowUp() {
    try {
      const { data, error } = await supabase.supabase()
        .from('influencers')
        .select('*')
        .in('status', ['contacted', 'responded'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`✅ Retrieved ${data?.length || 0} influencers needing follow-up`);
      return data || [];
    } catch (error) {
      console.error('❌ Error getting influencers needing follow-up:', error.message);
      return [];
    }
  },

  /**
   * Get influencer by ID
   */
  async getById(id) {
    try {
      const { data, error } = await supabase.supabase()
        .from('influencers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      console.log(`✅ Retrieved influencer by ID: ${id}`);
      return data;
    } catch (error) {
      console.error('❌ Error getting influencer by ID:', error.message);
      return null;
    }
  },

  /**
   * Update influencer journey
   */
  async updateJourney(id, followUpType) {
    try {
      const updates = {
        updated_at: new Date().toISOString()
      };

      // Update based on follow-up type
      switch (followUpType) {
        case 'follow_up_1':
          updates.journey_follow_up_1_sent = true;
          updates.journey_follow_up_1_at = new Date().toISOString();
          break;
        case 'follow_up_2':
          updates.journey_follow_up_2_sent = true;
          updates.journey_follow_up_2_at = new Date().toISOString();
          break;
        case 'follow_up_3':
          updates.journey_follow_up_3_sent = true;
          updates.journey_follow_up_3_at = new Date().toISOString();
          break;
        default:
          console.log(`Unknown follow-up type: ${followUpType}`);
          return false;
      }

      const { error } = await supabase.supabase()
        .from('influencers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      console.log(`✅ Updated journey for influencer ${id}: ${followUpType}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating influencer journey:', error.message);
      return false;
    }
  },

  /**
   * Check for duplicates
   */
  async checkForDuplicates(handles) {
    try {
      const duplicates = [];
      const uniqueCount = 0;
      
      for (const handle of handles) {
        const normalizedHandle = handle.toLowerCase().replace('@', '');
        
        const { data, error } = await supabase.supabase()
          .from('influencers')
          .select('email, instagram_handle, status, contact_method, id, journey, source_hashtags')
          .ilike('instagram_handle', `%${normalizedHandle}%`);

        if (error) throw error;

        if (data && data.length > 0) {
          const existingRecord = data[0];
          duplicates.push({
            handle: handle,
            reason: 'already_exists',
            existing_id: existingRecord.id,
            existing_data: {
              email: existingRecord.email,
              status: existingRecord.status,
              contact_method: existingRecord.contact_method,
              journey_stage: existingRecord.journey_stage || 'unknown',
              source_hashtags: existingRecord.source_hashtags || []
            }
          });
        }
      }
      
      return {
        duplicates: duplicates,
        duplicate_count: duplicates.length,
        unique_count: handles.length - duplicates.length,
        total_checked: handles.length
      };
    } catch (error) {
      console.error('❌ Error checking duplicates:', error.message);
      
      // Return fallback results
      return {
        duplicates: [],
        duplicate_count: 0,
        unique_count: handles.length,
        total_checked: handles.length
      };
    }
  },

  /**
   * Get hashtag performance
   */
  async getHashtagPerformance() {
    try {
      const { data, error } = await supabase.supabase()
        .from('influencers')
        .select('source_hashtags, status, followers, engagement_rate');

      if (error) throw error;

      const hashtagStats = {};
      let totalHashtags = 0;
      let totalInfluencers = data ? data.length : 0;

      if (data) {
        data.forEach(influencer => {
          if (influencer.source_hashtags && Array.isArray(influencer.source_hashtags)) {
            influencer.source_hashtags.forEach(hashtag => {
          if (!hashtagStats[hashtag]) {
            hashtagStats[hashtag] = {
                  total_influencers: 0,
              responded: 0,
              conversion_rate: 0,
              avg_followers: 0,
                  total_followers: 0
                };
                totalHashtags++;
              }
              
              hashtagStats[hashtag].total_influencers++;
              hashtagStats[hashtag].total_followers += influencer.followers || 0;
              hashtagStats[hashtag].avg_followers = Math.round(
                hashtagStats[hashtag].total_followers / hashtagStats[hashtag].total_influencers
              );
              
              if (['responded', 'agreed', 'shipped', 'posted'].includes(influencer.status)) {
                hashtagStats[hashtag].responded++;
              }
              
              hashtagStats[hashtag].conversion_rate = hashtagStats[hashtag].total_influencers > 0 ?
                Math.round((hashtagStats[hashtag].responded / hashtagStats[hashtag].total_influencers) * 100) : 0;
            });
          }
        });
      }

      // Find best performer
      let bestPerformer = null;
      let highestRate = 0;
      
      Object.entries(hashtagStats).forEach(([hashtag, stats]) => {
        if (stats.conversion_rate > highestRate) {
          highestRate = stats.conversion_rate;
          bestPerformer = hashtag;
        }
      });

      return {
        success: true,
        hashtag_performance: hashtagStats,
        summary: {
          total_hashtags: totalHashtags,
          best_performer: bestPerformer,
          total_influencers: totalInfluencers
        },
        insights: {
          top_performers: Object.entries(hashtagStats)
            .sort(([,a], [,b]) => b.conversion_rate - a.conversion_rate)
            .slice(0, 5)
            .map(([hashtag, stats]) => ({ hashtag, ...stats })),
          recommendations: totalHashtags > 0 ? [
            `Best performing hashtag: #${bestPerformer} (${highestRate}% conversion)`,
            'Continue using high-performing hashtags',
            'Test new variations of successful hashtags'
          ] : ['Start discovering influencers to see hashtag performance']
        }
      };
    } catch (error) {
      console.error('❌ Error getting hashtag performance:', error.message);
        return {
        success: false,
        hashtag_performance: {},
        summary: { total_hashtags: 0, best_performer: null, total_influencers: 0 },
        insights: { 
          top_performers: [], 
          recommendations: ['Error loading hashtag performance data'] 
        }
      };
    }
  },

  /**
   * Get Instagram DM statistics
   */
  async getDMStats() {
    try {
      // Get DM statistics from influencers who were contacted via Instagram
      const { data, error } = await supabase.supabase()
        .from('influencers')
        .select('status, contact_method, created_at')
        .eq('contact_method', 'instagram_dm');

      if (error) throw error;
      
      const stats = {
        total_dms_sent: 0,
        responded: 0,
        agreed: 0,
        shipped: 0,
        posted: 0,
        today_sent: 0,
        response_rate: 0,
        conversion_rate: 0
      };
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (data) {
        data.forEach(influencer => {
        stats.total_dms_sent++;
        
          if (['responded', 'agreed', 'shipped', 'posted'].includes(influencer.status)) {
            stats.responded++;
          }
          if (['agreed', 'shipped', 'posted'].includes(influencer.status)) {
            stats.agreed++;
          }
          if (['shipped', 'posted'].includes(influencer.status)) {
            stats.shipped++;
          }
          if (influencer.status === 'posted') {
            stats.posted++;
          }
        
        // Check if contacted today
          const contactedAt = new Date(influencer.created_at);
          if (contactedAt >= today) {
          stats.today_sent++;
        }
      });
      }
      
      // Calculate rates
      if (stats.total_dms_sent > 0) {
        stats.response_rate = Math.round((stats.responded / stats.total_dms_sent) * 100);
        stats.conversion_rate = Math.round((stats.shipped / stats.total_dms_sent) * 100);
      }
      
      return stats;
    } catch (error) {
      console.error('❌ Error getting DM stats:', error.message);
        return {
          total_dms_sent: 0,
          responded: 0,
          agreed: 0,
          shipped: 0,
          posted: 0,
          today_sent: 0,
          response_rate: 0,
          conversion_rate: 0
        };
      }
  },

  /**
   * Check outreach status for influencer handles
   */
  async checkOutreachStatus(influencerHandles) {
    try {
      const results = {};
      
      for (const handle of influencerHandles) {
        const normalizedHandle = handle.toLowerCase().replace('@', '');
        
        const { data, error } = await supabase.supabase()
          .from('influencers')
          .select('email, instagram_handle, status, contact_method, created_at')
          .ilike('instagram_handle', `%${normalizedHandle}%`);

        if (error) throw error;

        if (data && data.length > 0) {
          const influencer = data[0];
          results[handle] = {
            previously_contacted: true,
            contact_method: influencer.contact_method,
            status: influencer.status,
            contacted_date: influencer.created_at,
            email: influencer.email,
            recommendation: 'Skip - already contacted',
            duplicate_check: {
              is_duplicate: true,
              existing_record: influencer,
              found_via: 'instagram_handle_match'
            }
          };
        } else {
          results[handle] = {
            previously_contacted: false,
            contact_method: null,
            status: 'new',
            contacted_date: null,
            email: null,
            recommendation: 'Safe to contact',
            duplicate_check: {
              is_duplicate: false,
              existing_record: null,
              found_via: null
            }
          };
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Error checking outreach status:', error.message);
      
      // Return fallback results
      const results = {};
      influencerHandles.forEach(handle => {
        results[handle] = {
          previously_contacted: false,
          contact_method: null,
          status: 'unknown',
          contacted_date: null,
          email: null,
          recommendation: 'Check manually - system error',
          duplicate_check: {
            is_duplicate: false,
            existing_record: null,
            found_via: 'error'
          }
        };
      });
      return results;
    }
  }
};

/**
 * Choose between Firebase and Supabase based on DATABASE_TYPE environment variable
 */
const influencers = DATABASE_TYPE === 'supabase' ? supabaseInfluencers : supabaseInfluencers;

/**
 * 🎯 Main database interface
 */
const database = {
  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      if (DATABASE_TYPE === 'supabase') {
        await initializeSupabase();
        console.log('✅ Supabase database initialized successfully');
      } else {
        throw new Error(`Unsupported database type: ${DATABASE_TYPE}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      return false;
    }
  },

  /**
   * Get database instance
   */
  async getInstance() {
    if (!db) {
      await initializeDatabase();
    }
    return db;
  },
  /**
   * Get CRM dashboard data
   */
  async getCRMDashboard() {
    try {
      if (DATABASE_TYPE === 'supabase') {
        return await supabaseInfluencers.getCRMDashboard();
      } else {
        throw new Error(`Unsupported database type: ${DATABASE_TYPE}`);
      }
    } catch (error) {
      console.error('❌ Error getting CRM dashboard:', error.message);
    return {
        campaigns_active: 0,
        influencers_discovered: 0,
        emails_sent: 0,
        responses_received: 0,
        products_shipped: 0,
        posts_tracked: 0,
        conversion_rate: 0,
        last_updated: new Date().toISOString(),
        backend_status: 'error',
        message: 'Database error: ' + error.message
      };
    }
  },

  // Export influencer operations
  influencers
};

module.exports = {
  database,
  influencers,
  initializeSupabase,
}; 