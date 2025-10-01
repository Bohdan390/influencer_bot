const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

/**
 * 🚀 Initialize Supabase client
 */
function initializeSupabase() {
  try {
    console.log('supabaseUrl', supabaseUrl);
    console.log('supabaseKey', supabaseKey);
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });

    console.log('✅ Supabase initialized successfully');
    return supabase;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error.message);
    throw error;
  }
}

/**
 * 🏥 Test Supabase connection
 */
async function testSupabaseConnection() {
  try {
    if (!supabase) {
      supabase = initializeSupabase();
    }

    // Test connection with a simple query
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error.message);
    return false;
  }
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
      const { data, error } = await supabase
        .from('influencers')
        .insert([{
          email: influencerData.email,
          instagram_handle: influencerData.instagram_handle,
          name: influencerData.name,
          followers: influencerData.followers || 0,
          engagement_rate: influencerData.engagement_rate || 0,
          source_hashtags: influencerData.source_hashtags || [],
          status: influencerData.status || 'discovered',
          contact_method: influencerData.contact_method || 'email',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log(`✅ Added influencer: ${influencerData.email}`);
      return data;
    } catch (error) {
      console.error('❌ Error adding influencer:', error.message);
      throw error;
    }
  },

  /**
   * Get influencer by email
   */
  async getByEmail(email) {
    try {
      const { data, error } = await supabase
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
      
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      const { count: totalInfluencers } = await supabase
        .from('influencers')
        .select('*', { count: 'exact', head: true });

      const { count: emailsSent } = await supabase
        .from('influencers')
        .select('*', { count: 'exact', head: true })
        .in('status', ['contacted', 'responded', 'agreed', 'shipped', 'posted']);

      const { count: responsesReceived } = await supabase
        .from('influencers')
        .select('*', { count: 'exact', head: true })
        .in('status', ['responded', 'agreed', 'shipped', 'posted']);

      const { count: productsShipped } = await supabase
        .from('influencers')
        .select('*', { count: 'exact', head: true })
        .in('status', ['shipped', 'posted']);

      const { count: postsTracked } = await supabase
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
   * Check for duplicates
   */
  async checkForDuplicates(handles) {
    try {
      const results = {};
      
      for (const handle of handles) {
        const normalizedHandle = handle.toLowerCase().replace('@', '');
        
        const { data, error } = await supabase
          .from('influencers')
          .select('email, instagram_handle, status, contact_method')
          .ilike('instagram_handle', `%${normalizedHandle}%`);

        if (error) throw error;

        results[handle] = {
          isDuplicate: data && data.length > 0,
          existingRecord: data && data.length > 0 ? data[0] : null,
          details: data && data.length > 0 ? 
            `Found existing: ${data[0].email} (${data[0].status})` : 
            'No duplicates found'
        };
      }

      return results;
    } catch (error) {
      console.error('❌ Error checking duplicates:', error.message);
      
      // Return fallback results
      const results = {};
      handles.forEach(handle => {
        results[handle] = {
          isDuplicate: false,
          existingRecord: null,
          details: 'Error checking duplicates'
        };
      });
      return results;
    }
  },

  /**
   * Get hashtag performance
   */
  async getHashtagPerformance() {
    try {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
        
        const { data, error } = await supabase
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
 * 🔄 Initialize Supabase and setup database tables
 */
async function setupSupabaseDatabase() {
  try {
    if (!supabase) {
      supabase = initializeSupabase();
    }

    // Test connection
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to Supabase');
    }

    // Check if influencers table exists, create if not
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'influencers');

    if (tablesError) {
      console.log('ℹ️ Could not check tables, they may need to be created manually');
    }

    console.log('✅ Supabase database setup completed');
    return {
      success: true,
      message: 'Supabase database connection established',
      tables_found: tables ? tables.length : 0
    };
  } catch (error) {
    console.error('❌ Supabase database setup failed:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
}

module.exports = {
  initializeSupabase,
  testSupabaseConnection,
  setupSupabaseDatabase,
  supabase: () => supabase,
  influencers: supabaseInfluencers
}; 