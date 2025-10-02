const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const supabase = require('./supabase');

// Fallback user storage file
const USERS_FILE = path.join(__dirname, '../data/users.json');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'cosara-secret-key-change-in-production';
    this.jwtExpiry = process.env.JWT_EXPIRY || '7d';
    this.useSupabase = false;
    this.db = null;
    
    // Initialize data directory
    this.initializeDataDir();
    
    // Try to initialize Supabase
    this.initializeDatabase();
  }

  /**
   * Initialize database connection
   */
  async initializeDatabase() {
    try {
      const { database } = require('./database');
      this.db = database;
      
      // Test Supabase connection
      await this.db.testConnection();
      this.useSupabase = true;
      console.log('✅ Authentication: Supabase database connected');
    } catch (error) {
      this.useSupabase = false;
      console.log('⚠️ Authentication: Using local file storage (Supabase not available)');
    }
  }

  /**
   * Initialize data directory for local storage
   */
  async initializeDataDir() {
    try {
      const dataDir = path.join(__dirname, '../data');
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create data directory:', error);
    }
  }

  /**
   * Create a new user account
   */
  async createUser(userData) {
    try {
      const { email, password, full_name, company = 'Cosara' } = userData;

      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user document
      const user = {
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        full_name,
        company,
        role: 'admin', // Default role
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
        login_count: 0
      };

      let userId;
      if (this.useSupabase) {
        const { data, error } = await supabase.supabase()
          .from('users')
          .insert([user])
          .select()
          .single();
        
        if (error) throw error;
        userId = data.id;
      } else {
        userId = await this.createUserLocal(user);
      }
      
      // Don't return password hash
      const { password_hash, ...userResponse } = user;
      
      console.log(`✅ Created new user: ${email}`);
      return { 
        id: userId, 
        ...userResponse,
        message: 'User created successfully'
      };

    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Create user in local file storage
   */
  async createUserLocal(user) {
    try {
      let users = [];
      try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        users = JSON.parse(data);
      } catch (error) {
        // File doesn't exist, start with empty array
      }

      const userId = Date.now().toString();
      const userWithId = { id: userId, ...user };
      users.push(userWithId);

      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
      return userId;
    } catch (error) {
      throw new Error('Failed to save user locally');
    }
  }

  /**
   * Authenticate user login
   */
  async authenticateUser(email, password) {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Update login stats
      await this.updateLoginStats(user.id);

      // Generate JWT token
      const token = this.generateToken(user);

      // Don't return password hash
      const { password_hash, ...userResponse } = user;

      console.log(`✅ User logged in: ${email}`);
      return {
        user: userResponse,
        token,
        message: 'Login successful'
      };

    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase.supabase()
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        return data;
      } else {
        return await this.getUserByEmailLocal(email);
      }

    } catch (error) {
      console.error('Failed to get user by email:', error);
      return null;
    }
  }

  /**
   * Get user by email from local storage
   */
  async getUserByEmailLocal(email) {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      return users.find(user => user.email === email.toLowerCase()) || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase.supabase()
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        const { password_hash, ...user } = data || {};
        return user;
      } else {
        return await this.getUserByIdLocal(userId);
      }

    } catch (error) {
      console.error('Failed to get user by ID:', error);
      return null;
    }
  }

  /**
   * Get user by ID from local storage
   */
  async getUserByIdLocal(userId) {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      const user = users.find(u => u.id === userId);
      if (user) {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update user login statistics
   */
  async updateLoginStats(userId) {
    try {
      if (this.useSupabase) {
        // First get current login count
        const { data: userData } = await supabase.supabase()
          .from('users')
          .select('login_count')
          .eq('id', userId)
          .single();

        const currentCount = userData?.login_count || 0;

        await supabase.supabase()
          .from('users')
          .update({
            last_login: new Date().toISOString(),
            login_count: currentCount + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      } else {
        await this.updateLoginStatsLocal(userId);
      }
    } catch (error) {
      console.error('Failed to update login stats:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Update login stats in local storage
   */
  async updateLoginStatsLocal(userId) {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        users[userIndex].last_login = new Date();
        users[userIndex].login_count = (users[userIndex].login_count || 0) + 1;
        users[userIndex].updated_at = new Date();
        
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
      }
    } catch (error) {
      console.error('Failed to update login stats locally:', error);
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      company: user.company
    };

    return jwt.sign(payload, this.jwtSecret, { 
      expiresIn: this.jwtExpiry,
      issuer: 'cosara-influencer-hub'
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Middleware to protect routes
   */
  requireAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          error: 'Access token required' 
        });
      }

      const token = authHeader.substring(7);
      const decoded = this.verifyToken(token);
      
      // Get current user data
      const user = await this.getUserById(decoded.userId);
      if (!user || !user.is_active) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid or inactive user' 
        });
      }

      req.user = user;
      next();

    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        error: error.message 
      });
    }
  };

  /**
   * Create default admin user if none exists
   */
  async createDefaultUser() {
    try {
      let hasUsers = false;
      
      if (this.useSupabase) {
        const { data, error } = await supabase.supabase()
          .from('users')
          .select('id')
          .limit(1);
        hasUsers = data && data.length > 0;
      } else {
        try {
          const data = await fs.readFile(USERS_FILE, 'utf8');
          const users = JSON.parse(data);
          hasUsers = users.length > 0;
        } catch (error) {
          hasUsers = false;
        }
      }
      
      if (!hasUsers) {
        console.log('📝 Creating default admin user...');
        await this.createUser({
          email: 'admin@cosara.com',
          password: 'CosaraAdmin123!',
          full_name: 'Cosara Administrator',
          company: 'Cosara'
        });
        console.log('✅ Default admin user created: admin@cosara.com / CosaraAdmin123!');
      }
    } catch (error) {
      console.log('⚠️ Could not create default user:', error.message);
    }
  }

  /**
   * Save user settings
   */
  async saveUserSettings(userId, settings) {
    try {
      const settingsData = {
        ...settings,
        updated_at: new Date(),
        updated_by: userId
      };

      if (this.useSupabase) {
        await supabase.supabase()
          .from('user_settings')
          .upsert([{ id: userId, ...settingsData }]);
      } else {
        await this.saveUserSettingsLocal(userId, settingsData);
      }

      console.log(`✅ Settings saved for user: ${userId}`);
      return settingsData;
    } catch (error) {
      console.error('Failed to save user settings:', error);
      throw error;
    }
  }

  /**
   * Get user settings
   */
  async getUserSettings(userId) {
    try {
      let settings = null;

      if (this.useSupabase) {
        const { data, error } = await supabase.supabase()
          .from('user_settings')
          .select('*')
          .eq('id', userId)
          .single();
        settings = data;
      } else {
        settings = await this.getUserSettingsLocal(userId);
      }

      // Return default settings if none exist
      if (!settings) {
        settings = this.getDefaultSettings();
      }

      return settings;
    } catch (error) {
      console.error('Failed to get user settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Save user settings locally
   */
  async saveUserSettingsLocal(userId, settings) {
    try {
      const settingsFile = path.join(path.dirname(USERS_FILE), 'user_settings.json');
      let allSettings = {};
      
      try {
        const data = await fs.readFile(settingsFile, 'utf8');
        allSettings = JSON.parse(data);
      } catch (error) {
        // File doesn't exist, start with empty object
      }

      allSettings[userId] = settings;
      await fs.writeFile(settingsFile, JSON.stringify(allSettings, null, 2));
    } catch (error) {
      throw new Error('Failed to save settings locally');
    }
  }

  /**
   * Get user settings locally
   */
  async getUserSettingsLocal(userId) {
    try {
      const settingsFile = path.join(path.dirname(USERS_FILE), 'user_settings.json');
      const data = await fs.readFile(settingsFile, 'utf8');
      const allSettings = JSON.parse(data);
      return allSettings[userId] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      api_keys: {
        firebase_project_id: '',
        firebase_private_key: '',
        apify_token: '',
        brevo_api_key: '',
        shopify_store_url: '',
        shopify_access_token: ''
      },
      campaign_settings: {
        min_followers: 10000,
        max_followers: 100000,
        target_hashtags: 'beauty,skincare,hairremoval,laser',
        email_daily_limit: 50,
        followup_delay_days: 3
      },
      email_settings: {
        sender_name: 'Cosara Team',
        sender_email: 'influencers@trycosara.com',
        reply_to: 'hello@cosara.com',
        signature: 'Best regards,\nThe Cosara Team\n\n--\nCosara IPL Hair Removal\nwww.cosara.com'
      },
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  /**
   * Get user count
   */
  async getUserCount() {
    try {
      if (this.useSupabase) {
        const { count } = await supabase.supabase()
          .from('users')
          .select('*', { count: 'exact', head: true });
        return count || 0;
      } else {
        try {
          const data = await fs.readFile(USERS_FILE, 'utf8');
          const users = JSON.parse(data);
          return users.length;
        } catch (error) {
          return 0;
        }
      }
    } catch (error) {
      return 0;
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const userCount = await this.getUserCount();
      return { 
        success: true, 
        message: 'Authentication service connected',
        database_type: this.useSupabase ? 'supabase' : 'local_file',
        user_count: userCount
      };
    } catch (error) {
      return { 
        success: false, 
        error: 'Authentication service error',
        database_type: 'none'
      };
    }
  }
}

module.exports = new AuthService(); 