/**
 * 📱 DM Throttling Service
 * Manages Instagram DM rate limiting and multiple account rotation
 * Uses instagram-private-api for real Instagram integration
 */

const { IgApiClient } = require('instagram-private-api');
const fs = require('fs').promises;
const path = require('path');
const { common } = require('../config/common');

class DMThrottlingService {
  constructor() {
    this.accounts = []; // Will be populated from config
    this.igClients = new Map(); // Instagram API clients for each account
    this.sessions = new Map(); // Session data for each account
    this.dailyLimits = {
      dm_per_account: 40,      // Max DMs per account per day (Instagram limit)
      dm_per_hour: 8,          // Max DMs per account per hour
      follow_per_account: 60,   // Max follows per account per day
      like_per_account: 200     // Max likes per account per day
    };
    
    this.accountStatus = new Map(); // Track usage for each account
    this.messageQueue = [];          // Queue of pending messages
    this.isProcessing = false;
    this.sessionDir = path.join(__dirname, '../data/instagram-sessions');
  }

  /**
   * 🔧 Initialize with Instagram accounts
   */
  async initialize(accounts = []) {
    this.accounts = accounts.length > 0 ? accounts : this.getDefaultAccounts();
    
    // Debug: Log account information (without passwords)
    console.log(`📱 Initializing ${this.accounts.length} Instagram accounts:`);
    this.accounts.forEach((account, index) => {
      console.log(`  ${index + 1}. ${account.username} (password: ${account.password ? 'SET' : 'NOT SET'})`);
    });
    
    // Create sessions directory if it doesn't exist
    try {
      await fs.mkdir(this.sessionDir, { recursive: true });
    } catch (error) {
      console.log('Sessions directory already exists');
    }
    
    // Initialize Instagram clients and sessions
    for (const account of this.accounts) {
      try {
        await this.initializeAccount(account);
      } catch (error) {
        console.error(`Failed to initialize account ${account.username}:`, error.message);
      }
    }

    console.log(`📱 DM Throttling initialized with ${this.accounts.length} accounts`);
  }

  /**
   * 🔐 Initialize individual Instagram account
   */
  async initializeAccount(account) {
    const ig = new IgApiClient();
    
    // Validate account credentials
    if (!account.username || !account.password) {
      console.error(`❌ Invalid credentials for account: username=${account.username}, password=${account.password ? 'SET' : 'NOT SET'}`);
      throw new Error('Invalid Instagram credentials');
    }
    
    // Set user agent and device with more realistic settings
    ig.state.generateDevice(account.username);
    
    // Configure proxy if available
    if (account.proxy) {
      console.log(`🌐 Using proxy for ${account.username}`);
      ig.request.setProxy(account.proxy);
    }
    
    // Try to load existing session
    const sessionPath = path.join(this.sessionDir, `${account.username}.json`);
    let sessionLoaded = false;
    
    try {
      const sessionData = await fs.readFile(sessionPath, 'utf8');
      await ig.state.deserialize(sessionData);
      
      // Verify session is still valid
      const user = await ig.account.currentUser();
      if (user) {
        sessionLoaded = true;
        console.log(`✅ Loaded existing session for ${account.username}`);
      }
    } catch (error) {
      console.log(`No valid session found for ${account.username}, will need to login`);
    }
    
    // Login if no valid session
    if (!sessionLoaded) {
      let loginAttempts = 0;
      const maxLoginAttempts = 3;
      
      while (loginAttempts < maxLoginAttempts) {
        try {
          console.log(`🔐 Logging in ${account.username}... (Attempt ${loginAttempts + 1}/${maxLoginAttempts})`);
          
          // Handle potential challenges
          ig.request.end$.subscribe(async () => {
            const serialized = await ig.state.serialize();
            delete serialized.constants;
            await fs.writeFile(sessionPath, JSON.stringify(serialized), 'utf8');
          });

          // Add timeout for login attempt
          const loginPromise = ig.account.login(account.username, account.password);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Login timeout')), 30000)
          );
          
          await Promise.race([loginPromise, timeoutPromise]);
          
          console.log(`✅ Successfully logged in ${account.username}`);
          
          // Save session
          const serialized = await ig.state.serialize();
          delete serialized.constants;
          
          console.log(serialized,'serialized');
          common.sessionString = JSON.stringify(serialized);
          await fs.writeFile(sessionPath, JSON.stringify(serialized), 'utf8');
          
          break; // Success, exit retry loop
          
        } catch (error) {
          loginAttempts++;
          console.error(`❌ Failed to login ${account.username} (Attempt ${loginAttempts}/${maxLoginAttempts}):`, error.message);
          
          // Handle specific error types
          if (error.message.includes('challenge_required')) {
            console.log(`⚠️ Challenge required for ${account.username} - manual intervention needed`);
            throw error; // Don't retry for challenges
          } else if (error.message.includes('rate_limit')) {
            console.log(`⏰ Rate limited for ${account.username} - will retry later`);
            throw error; // Don't retry for rate limits
          } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.log(`🌐 Network error for ${account.username} - retrying in 10 seconds...`);
            if (loginAttempts < maxLoginAttempts) {
              await this.sleep(10000); // Wait 10 seconds before retry
              continue;
            }
          } else if (error.message.includes('timeout')) {
            console.log(`⏰ Login timeout for ${account.username} - retrying...`);
            if (loginAttempts < maxLoginAttempts) {
              await this.sleep(5000); // Wait 5 seconds before retry
              continue;
            }
          }
          
          // If we've exhausted all attempts, throw the error
          if (loginAttempts >= maxLoginAttempts) {
            console.error(`❌ Failed to login ${account.username} after ${maxLoginAttempts} attempts`);
            throw error;
          }
        }
      }
    }
    
    // Store client and initialize status
    this.igClients.set(account.username, ig);
    this.accountStatus.set(account.username, {
      dm_sent_today: 0,
      dm_sent_this_hour: 0,
      follows_today: 0,
      likes_today: 0,
      last_dm_time: null,
      last_reset: new Date().toDateString(),
      last_hour_reset: new Date().getHours(),
      is_active: true,
      warnings: 0,
      banned_until: null,
      last_login: new Date(),
      user_id: sessionLoaded ? null : (await ig.account.currentUser()).pk
    });
  }

  /**
   * 📋 Get default accounts from config
   */
  getDefaultAccounts() {
    // Try to get from hardcoded config first
    try {
      const { config } = require('../config/hardcoded-config');
      if (config.apis.instagram && config.apis.instagram.accounts) {
        console.log(`📱 Using Instagram accounts from hardcoded config`);
        return config.apis.instagram.accounts.map(account => ({
          ...account,
          proxy: null
        }));
      }
    } catch (error) {
      console.log(`⚠️ Could not load hardcoded config:`, error.message);
    }
    
    // Fallback to environment variables
    return [
      {
        username: process.env.INSTAGRAM_USERNAME || 'dermao_partnerships',
        password: process.env.INSTAGRAM_PASSWORD || '',
        proxy: null,
        priority: 1
      }
    ];
  }

  /**
   * 📤 Queue a DM for sending
   */
  async queueDM(recipientHandle, message, options = {}) {
    const dmRequest = {
      id: `dm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipient: recipientHandle,
      message: message,
      priority: options.priority || 'normal', // high, normal, low
      campaign_id: options.campaign_id,
      influencer_id: options.influencer_id,
      retry_count: 0,
      max_retries: options.max_retries || 3,
      created_at: new Date(),
      scheduled_for: options.scheduled_for || new Date(),
      status: 'queued'
    };

    this.messageQueue.push(dmRequest);
    
    // Sort queue by priority and scheduled time
    this.messageQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.scheduled_for - b.scheduled_for;
    });

    console.log(`📬 Queued DM for ${recipientHandle} (Queue size: ${this.messageQueue.length})`);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return dmRequest.id;
  }

  /**
   * ⚡ Start processing the DM queue
   */
  async startProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('🚀 Starting DM queue processing...');

    while (this.messageQueue.length > 0) {
      try {
        const dmRequest = this.messageQueue.shift();
        
        // Check if it's time to send this message
        if (dmRequest.scheduled_for > new Date()) {
          // Put it back in queue and wait
          this.messageQueue.unshift(dmRequest);
          await this.sleep(60000); // Wait 1 minute
          continue;
        }

        // Find available account
        const account = await this.getAvailableAccount();
        
        if (!account) {
          // No accounts available, wait and try again
          this.messageQueue.unshift(dmRequest);
          console.log('⏳ No accounts available, waiting 30 minutes...');
          await this.sleep(30 * 60 * 1000); // Wait 30 minutes
          continue;
        }

        // Send the DM
        const result = await this.sendDM(account, dmRequest);
        
        if (result.success) {
          console.log(`✅ DM sent to ${dmRequest.recipient} via ${account.username}`);
          dmRequest.status = 'sent';
          dmRequest.sent_at = new Date();
          dmRequest.account_used = account.username;
          
          // Update account usage
          this.updateAccountUsage(account.username, 'dm');
          
        } else {
          console.log(`❌ Failed to send DM to ${dmRequest.recipient}: ${result.error}`);
          dmRequest.retry_count++;
          
          if (dmRequest.retry_count < dmRequest.max_retries) {
            // Retry later
            dmRequest.scheduled_for = new Date(Date.now() + (dmRequest.retry_count * 60 * 60 * 1000)); // Exponential backoff
            dmRequest.status = 'retry_scheduled';
            this.messageQueue.push(dmRequest);
          } else {
            dmRequest.status = 'failed';
            console.log(`💀 DM to ${dmRequest.recipient} failed after ${dmRequest.max_retries} retries`);
          }
          
          // Handle account issues
          if (result.account_issue) {
            this.handleAccountIssue(account.username, result.error);
          }
        }

        // Wait between messages to avoid detection
        await this.sleep(this.getRandomDelay());

      } catch (error) {
        console.error('Error processing DM queue:', error);
        await this.sleep(60000); // Wait 1 minute on error
      }
    }

    this.isProcessing = false;
    console.log('✅ DM queue processing completed');
  }

  /**
   * 🎯 Get an available account for sending
   */
  async getAvailableAccount() {
    const now = new Date();
    const currentHour = now.getHours();
    const today = now.toDateString();

    for (const account of this.accounts) {
      const status = this.accountStatus.get(account.username);
      
      if (!status || !status.is_active) continue;
      
      // Check if we have an active Instagram client
      if (!this.igClients.has(account.username)) continue;
      
      // Check if account is banned
      if (status.banned_until && status.banned_until > now) continue;
      
      // Reset daily counters if new day
      if (status.last_reset !== today) {
        status.dm_sent_today = 0;
        status.follows_today = 0;
        status.likes_today = 0;
        status.last_reset = today;
      }
      
      // Reset hourly counters if new hour
      if (status.last_hour_reset !== currentHour) {
        status.dm_sent_this_hour = 0;
        status.last_hour_reset = currentHour;
      }
      
      // Check daily limit
      if (status.dm_sent_today >= this.dailyLimits.dm_per_account) continue;
      
      // Check hourly limit
      if (status.dm_sent_this_hour >= this.dailyLimits.dm_per_hour) continue;
      
      // Check minimum time between messages (avoid spam detection)
      if (status.last_dm_time) {
        const timeSinceLastDM = now - status.last_dm_time;
        const minInterval = 3 * 60 * 1000; // 3 minutes minimum
        if (timeSinceLastDM < minInterval) continue;
      }
      
      return account;
    }
    
    return null;
  }

  /**
   * 📨 Send a DM using a specific account with real Instagram API
   */
  async sendDM(account, dmRequest) {
    try {
      const ig = this.igClients.get(account.username);
      if (!ig) {
        throw new Error('Instagram client not available');
      }
      
      console.log(`📱 Sending DM via ${account.username} to ${dmRequest.recipient}`);
      
      // Remove @ from handle if present
      const cleanHandle = dmRequest.recipient.replace('@', '');
      
      // Search for user with timeout and retry
      let userSearch = null;
      let searchAttempts = 0;
      const maxSearchAttempts = 3;
      
      while (searchAttempts < maxSearchAttempts) {
        try {
          const searchPromise = ig.user.searchExact(cleanHandle);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Search timeout')), 15000)
          );
          
          userSearch = await Promise.race([searchPromise, timeoutPromise]);
          break; // Success, exit retry loop
          
        } catch (error) {
          searchAttempts++;
          console.error(`Search attempt ${searchAttempts}/${maxSearchAttempts} failed for ${cleanHandle}:`, error.message);
          
          if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.log(`🌐 Network error during search - retrying in 5 seconds...`);
            if (searchAttempts < maxSearchAttempts) {
              await this.sleep(5000);
              continue;
            }
          } else if (error.message.includes('timeout')) {
            console.log(`⏰ Search timeout - retrying...`);
            if (searchAttempts < maxSearchAttempts) {
              await this.sleep(3000);
              continue;
            }
          }
          
          // If we've exhausted all attempts, throw the error
          if (searchAttempts >= maxSearchAttempts) {
            throw error;
          }
        }
      }
      
      if (!userSearch) {
        throw new Error(`User ${cleanHandle} not found`);
      }
      
      // Get user's thread
      const thread = ig.entity.directThread([userSearch.pk.toString()]);
      
      // Send the message with timeout
      const sendPromise = thread.broadcastText(dmRequest.message);
      const sendTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Send timeout')), 20000)
      );
      
      const sentMessage = await Promise.race([sendPromise, sendTimeoutPromise]);
      
      return {
        success: true,
        message_id: sentMessage.item_id,
        thread_id: sentMessage.thread_id,
        sent_at: new Date()
      };
      
    } catch (error) {
      console.error(`Error sending DM via ${account.username}:`, error);
      
      // Analyze error type
      let account_issue = false;
      let error_message = error.message;
      
      if (error.message.includes('challenge_required')) {
        account_issue = true;
        error_message = 'Account challenge required';
      } else if (error.message.includes('rate_limit') || error.message.includes('429')) {
        account_issue = true;
        error_message = 'Rate limit exceeded';
      } else if (error.message.includes('spam')) {
        account_issue = true;
        error_message = 'Account flagged for spam';
      } else if (error.message.includes('not found')) {
        error_message = 'Recipient not found';
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        error_message = 'Network connectivity issue';
      } else if (error.message.includes('timeout')) {
        error_message = 'Request timeout';
      }
      
      return {
        success: false,
        error: error_message,
        account_issue: account_issue
      };
    }
  }

  /**
   * 📥 Check for new DMs using Instagram API
   */
  async checkDMResponses() {
    const responses = [];
    
    for (const [username, ig] of this.igClients) {
      try {
        console.log(`📱 Checking DMs for ${username}...`);
        
        // Get direct inbox
        const inbox = await ig.feed.directInbox().items();
        
        for (const thread of inbox) {
          // Check for unread messages
          if (thread.read_state === 0) { // 0 = unread
            const messages = await ig.feed.directThread({
              thread_id: thread.thread_id
            }).items();
            
            for (const message of messages) {
              // Only process messages we haven't seen
              if (message.item_type === 'text' && message.user_id !== thread.viewer_id) {
                responses.push({
                  thread_id: thread.thread_id,
                  message_id: message.item_id,
                  from_user_id: message.user_id,
                  from_username: thread.users.find(u => u.pk === message.user_id)?.username,
                  message: message.text,
                  timestamp: new Date(message.timestamp / 1000),
                  account_username: username
                });
              }
            }
            
            // Mark thread as read
            await ig.directThread.markItemSeen({
              threadId: thread.thread_id,
              itemId: thread.items[0].item_id
            });
          }
        }
        
      } catch (error) {
        console.error(`Error checking DMs for ${username}:`, error.message);
      }
    }
    
    return responses;
  }

  /**
   * 📊 Update account usage statistics
   */
  updateAccountUsage(username, action) {
    const status = this.accountStatus.get(username);
    if (!status) return;
    
    const now = new Date();
    
    switch (action) {
      case 'dm':
        status.dm_sent_today++;
        status.dm_sent_this_hour++;
        status.last_dm_time = now;
        break;
      case 'follow':
        status.follows_today++;
        break;
      case 'like':
        status.likes_today++;
        break;
    }
    
    this.accountStatus.set(username, status);
  }

  /**
   * ⚠️ Handle account issues (restrictions, bans, etc.)
   */
  handleAccountIssue(username, error) {
    const status = this.accountStatus.get(username);
    if (!status) return;
    
    status.warnings++;
    
    if (error.includes('challenge_required')) {
      // Challenge required - need manual intervention
      status.banned_until = new Date(Date.now() + 24 * 60 * 60 * 1000);
      console.log(`⚠️ Account ${username} requires challenge verification`);
    } else if (error.includes('rate_limit')) {
      // Rate limited - ban for 6 hours
      status.banned_until = new Date(Date.now() + 6 * 60 * 60 * 1000);
      console.log(`⚠️ Account ${username} rate limited for 6 hours`);
    } else if (error.includes('spam')) {
      // Spam flagged - ban for 24 hours
      status.banned_until = new Date(Date.now() + 24 * 60 * 60 * 1000);
      console.log(`⚠️ Account ${username} flagged for spam for 24 hours`);
    } else if (status.warnings >= 3) {
      // Too many warnings - deactivate account
      status.is_active = false;
      console.log(`❌ Account ${username} deactivated due to repeated issues`);
    }
    
    this.accountStatus.set(username, status);
  }

  /**
   * 📈 Get throttling statistics
   */
  getStats() {
    const stats = {
      total_accounts: this.accounts.length,
      active_accounts: 0,
      banned_accounts: 0,
      queue_size: this.messageQueue.length,
      daily_usage: {},
      hourly_usage: {},
      account_health: {}
    };
    
    const now = new Date();
    
    this.accountStatus.forEach((status, username) => {
      if (status.is_active) {
        stats.active_accounts++;
      }
      
      if (status.banned_until && status.banned_until > now) {
        stats.banned_accounts++;
      }
      
      stats.daily_usage[username] = {
        dms: status.dm_sent_today,
        follows: status.follows_today,
        likes: status.likes_today,
        remaining_dms: Math.max(0, this.dailyLimits.dm_per_account - status.dm_sent_today)
      };
      
      stats.hourly_usage[username] = {
        dms: status.dm_sent_this_hour,
        remaining_dms: Math.max(0, this.dailyLimits.dm_per_hour - status.dm_sent_this_hour)
      };
      
      stats.account_health[username] = {
        warnings: status.warnings,
        is_active: status.is_active,
        banned_until: status.banned_until,
        has_session: this.igClients.has(username)
      };
    });
    
    return stats;
  }

  /**
   * 🔄 Reset account limits (for testing or manual reset)
   */
  resetAccountLimits(username = null) {
    if (username) {
      const status = this.accountStatus.get(username);
      if (status) {
        status.dm_sent_today = 0;
        status.dm_sent_this_hour = 0;
        status.follows_today = 0;
        status.likes_today = 0;
        status.banned_until = null;
        status.warnings = 0;
        status.is_active = true;
        this.accountStatus.set(username, status);
      }
    } else {
      // Reset all accounts
      this.accountStatus.forEach((status, username) => {
        status.dm_sent_today = 0;
        status.dm_sent_this_hour = 0;
        status.follows_today = 0;
        status.likes_today = 0;
        status.banned_until = null;
        status.warnings = 0;
        status.is_active = true;
        this.accountStatus.set(username, status);
      });
    }
  }

  /**
   * ⏱️ Get random delay between messages
   */
  getRandomDelay() {
    // Random delay between 2-8 minutes to appear human
    const minDelay = 2 * 60 * 1000; // 2 minutes
    const maxDelay = 8 * 60 * 1000; // 8 minutes
    return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  }

  /**
   * 💤 Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 📋 Get queue status
   */
  getQueueStatus() {
    const statusCounts = {
      queued: 0,
      retry_scheduled: 0,
      sent: 0,
      failed: 0
    };
    
    this.messageQueue.forEach(dm => {
      statusCounts[dm.status] = (statusCounts[dm.status] || 0) + 1;
    });
    
    return {
      total_in_queue: this.messageQueue.length,
      is_processing: this.isProcessing,
      status_breakdown: statusCounts,
      next_scheduled: this.messageQueue.length > 0 ? this.messageQueue[0].scheduled_for : null
    };
  }

  /**
   * 🛑 Stop processing (for maintenance)
   */
  stopProcessing() {
    this.isProcessing = false;
    console.log('🛑 DM processing stopped');
  }

  /**
   * ▶️ Resume processing
   */
  resumeProcessing() {
    if (!this.isProcessing && this.messageQueue.length > 0) {
      this.startProcessing();
    }
  }

  /**
   * 🔐 Re-authenticate account if needed
   */
  async reAuthenticateAccount(username) {
    const account = this.accounts.find(acc => acc.username === username);
    if (!account) return false;
    
    try {
      // Remove old client
      this.igClients.delete(username);
      
      // Re-initialize
      await this.initializeAccount(account);
      
      console.log(`✅ Re-authenticated ${username}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to re-authenticate ${username}:`, error.message);
      return false;
    }
  }
}

module.exports = new DMThrottlingService(); 