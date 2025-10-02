const { ApifyClient } = require('apify-client');
const { influencers } = require('./database');
const websocketService = require('./websocket');
const axios = require('axios');
const cheerio = require('cheerio');
// Removed puppeteer - using Cheerio + Axios for better Digital Ocean compatibility

// Load hardcoded config to ensure environment variables are set
const { config } = require('../config/hardcoded-config');

// Initialize Apify client
console.log(111, process.env.APIFY_TOKEN || config.apis.apify.api_token);
const client = new ApifyClient({
	token: process.env.APIFY_TOKEN || config.apis.apify.api_token,
});

/**
 * Current working Instagram Actor IDs from Apify Store 2024/2025
 */
const INSTAGRAM_HASHTAG_SCRAPER_ID = 'apify/instagram-hashtag-scraper'; // Official Apify hashtag scraper
const INSTAGRAM_PROFILE_SCRAPER_ID = 'apify/instagram-profile-scraper';  // Official Apify profile scraper

/**
 * Instagram Mention Scraper Actor ID
 * This actor finds mentions/competitors
 */
const INSTAGRAM_MENTION_SCRAPER_ID = 'zTSjdcGqjg6KEIBlt';

/**
 * Email extraction regex patterns - Enhanced for better detection
 */
const EMAIL_PATTERNS = [
	// Standard email format
	/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
	// Email with spaces around @
	/\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b/g,
	// Email with (at) instead of @
	/\b[A-Za-z0-9._%+-]+\s*\(\s*at\s*\)\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b/g,
	// Email with [at] instead of @
	/\b[A-Za-z0-9._%+-]+\s*\[\s*at\s*\]\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b/g,
	// Email with spaces and special characters
	/\b[A-Za-z0-9._%+-]+\s*[\(\[]?\s*at\s*[\)\]]?\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b/g,
	// Email with "at" written out
	/\b[A-Za-z0-9._%+-]+\s+at\s+[A-Za-z0-9.-]+\s+dot\s+[A-Z|a-z]{2,}\b/g,
	// Email with common typos and variations
	/\b[A-Za-z0-9._%+-]+\s*[aA][tT]\s*[A-Za-z0-9.-]+\s*[dD][oO][tT]\s*[A-Z|a-z]{2,}\b/g
];

/**
 * Common link-in-bio services
 */
const LINKTREE_SERVICES = [
	'linktr.ee',
	'linktree.com',
	'bio.link',
	'flowpage.com',
	'beacons.ai',
	'allmylinks.com',
	'tap.bio',
	'shorby.com'
];

class ApifyService {
	/**
	 * Discover influencers by hashtags using the official Apify Instagram Hashtag Scraper
	 */
	async discoverInfluencersByHashtags(hashtags, location, options = {}) {
		const {
			limit = 5,
			minFollowers = 1000,     // Lowered from 10000 to be more inclusive
			maxFollowers = 500000,   // Increased from 100000 to find more influencers
			minEngagementRate = 0.0,  // Set to 0 to include all influencers when engagement data is not available
			discoveryId = null       // Optional discovery ID for progress tracking
		} = options;

		// Generate discovery ID if not provided
		const currentDiscoveryId = discoveryId || `discovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		// Clean hashtags: remove # symbol and validate format
		const cleanedHashtags = hashtags.map(hashtag => {
			// Remove # symbol if present
			let cleaned = hashtag.replace(/^#/, '');
			// Remove any special characters that Apify doesn't accept
			cleaned = cleaned.replace(/[!?.,:;\-+=*&%$#@/\~^|<>()[\]{}"'`\s]/g, '');
			return cleaned;
		}).filter(hashtag => hashtag.length > 0); // Remove empty hashtags

		if (cleanedHashtags.length === 0) {
			throw new Error('No valid hashtags provided after cleaning');
		}

		console.log(`🔍 Starting influencer discovery for hashtags: ${cleanedHashtags.join(', ')}`);
		console.log(`📊 Filters: ${minFollowers}-${maxFollowers} followers, ${minEngagementRate}%+ engagement`);

		// Start progress tracking
		websocketService.startDiscovery(currentDiscoveryId, location, cleanedHashtags, {
			limit,
			minFollowers,
			maxFollowers,
			minEngagementRate,
			location
		});

		try {
			// Update progress: Starting Apify scraping
			websocketService.updateProgress(currentDiscoveryId, {
				status: 'processing',
				currentStep: 'Starting Apify hashtag scraping...',
				stage: 'apify_scraping',
				hashtags: cleanedHashtags,
				progress: 10
			});

			// Use the official Apify Instagram Hashtag Scraper with diversity settings
			const run = await client.actor(INSTAGRAM_HASHTAG_SCRAPER_ID).call({
				hashtags: cleanedHashtags,
				resultsLimit: limit * 3, // Get 3x more posts to find diverse influencers
				resultsType: 'posts', // Get posts instead of just top posts
				searchType: 'recent', // Get recent posts instead of top posts
				includeLocationData: true,
				includeHashtags: true,
				includeComments: false,
				includeLikes: true,
				includeCaption: true,
				includeTimestamp: true,
				// Add randomization to get different results each time
				randomizeResults: true,
				// Get posts from different time periods
				timeRange: 'all', // Get posts from all time periods, not just recent
				// Mix of popular and less popular posts
				includeLessPopular: true
			});

			console.log(`⏳ Apify run started. Run ID: ${run.id}`);

			// Update progress: Waiting for Apify to complete
			websocketService.updateProgress(currentDiscoveryId, {
				currentStep: 'Waiting for Apify scraping to complete...',
				stage: 'apify_waiting',
				runId: run.id,
				progress: 15
			});

			// Wait for the run to finish
			const finishedRun = await client.run(run.id).waitForFinish();

			if (finishedRun.status !== 'SUCCEEDED') {
				throw new Error(`Apify run failed with status: ${finishedRun.status}`);
			}

			// Get the results
			var { items: posts } = await client.dataset(finishedRun.defaultDatasetId).listItems();

			if (location) {	
				posts = posts.filter(post => {
					return post.location && post.location.name?.toLowerCase().includes(location.toLowerCase());
				});
			}

			console.log(`📊 Found ${posts.length} posts from hashtag scraping`);

			// Shuffle posts to get more diverse results with timestamp-based seed
			const timestamp = Date.now();
			const shuffledPosts = posts.sort((a, b) => {
				// Use timestamp as seed for more consistent randomization
				const seedA = (timestamp + a.shortCode?.charCodeAt(0) || 0) % 1000;
				const seedB = (timestamp + b.shortCode?.charCodeAt(0) || 0) % 1000;
				return seedA - seedB;
			});
			
			// Group posts by username to avoid duplicates
			const postsByUser = new Map();
			shuffledPosts.forEach(post => {
				const username = post.ownerUsername;
				if (username) {
					if (!postsByUser.has(username)) {
						postsByUser.set(username, []);
					}
					postsByUser.get(username).push(post);
				}
			});

			// Create a diverse selection by taking 1 post per user, then shuffling again
			const diversePosts = [];
			for (const [username, userPosts] of postsByUser) {
				// Take the post with highest engagement from each user
				const bestPost = userPosts.reduce((best, current) => {
					const currentEngagement = (current.ownerLikesCount || 0) + (current.ownerCommentsCount || 0);
					const bestEngagement = (best.ownerLikesCount || 0) + (best.ownerCommentsCount || 0);
					return currentEngagement > bestEngagement ? current : best;
				});
				diversePosts.push(bestPost);
			}

			// Shuffle again with timestamp-based randomization and limit to the requested amount
			const finalPosts = diversePosts.sort((a, b) => {
				const seedA = (timestamp + a.shortCode?.charCodeAt(0) || 0) % 1000;
				const seedB = (timestamp + b.shortCode?.charCodeAt(0) || 0) % 1000;
				return seedA - seedB;
			}).slice(0, limit * 2);

			console.log(`🎯 Selected ${finalPosts.length} diverse posts from ${postsByUser.size} unique users`);

			// Update progress: Processing posts
			websocketService.updateProgress(currentDiscoveryId, {
				currentStep: `Processing ${finalPosts.length} diverse posts from ${postsByUser.size} unique users...`,
				stage: 'processing_posts',
				postsFound: finalPosts.length,
				uniqueUsers: postsByUser.size,
				progress: 20
			});

			const influencerMap = new Map();
			let processedCount = 0;
			let filteredCount = 0;

			// Set total steps for progress tracking
			websocketService.updateProgress(currentDiscoveryId, {
				totalSteps: finalPosts.length + 1, // +1 for final processing
				status: 'processing',
				postsToProcess: finalPosts.length
			});

			for (const item of finalPosts) {
				processedCount++;

				// Update progress for each post processed
				websocketService.updateProgress(currentDiscoveryId, {
					currentStep: `Processing post ${processedCount}/${finalPosts.length}`,
					stage: 'post_processing',
					postsProcessed: processedCount,
					totalPosts: finalPosts.length,
					currentPost: item.shortCode || 'unknown',
					progress: 20 + (processedCount / finalPosts.length) * 10
				});

				// Extract user data from the post
				const username = item.ownerUsername;
				if (!username) {
					console.log(`⚠️  Post ${processedCount}: No username found, skipping`);
					websocketService.updateProgress(currentDiscoveryId, {
						currentStep: `⚠️ Post ${processedCount}: No username found, skipping`,
						stage: 'post_processing',
						skippedPosts: (websocketService.activeDiscoveries.get(currentDiscoveryId)?.skippedPosts || 0) + 1
					});
					continue;
				}

				// Estimate follower count if not provided (common with Instagram API restrictions)
				let followerCount = item.ownerFollowersCount || 0;

				// Calculate engagement rate with proper validation
				const likesCount = item.ownerLikesCount || 0;
				const commentsCount = item.ownerCommentsCount || 0;
				const totalEngagement = likesCount + commentsCount;
				const engagementRate = followerCount > 0 ? (totalEngagement / followerCount) * 100 : 0;

				console.log(`👤 Processing @${username}: ${followerCount} followers, ${engagementRate.toFixed(2)}% engagement`);

				// Update progress: Processing specific influencer
				websocketService.updateProgress(currentDiscoveryId, {
					currentStep: `Processing @${username}: ${followerCount.toLocaleString()} followers, ${engagementRate.toFixed(2)}% engagement`,
					stage: 'influencer_processing',
					currentInfluencer: username,
					currentInfluencerFollowers: followerCount,
					currentInfluencerEngagement: engagementRate
				});

				// Skip if already processed
				if (influencerMap.has(username)) {
					console.log(`   ⏭️  Skipped: Already processed @${username}`);
					websocketService.updateProgress(currentDiscoveryId, {
						currentStep: `⏭️ Skipped: Already processed @${username}`,
						stage: 'influencer_processing',
						duplicateInfluencers: (websocketService.activeDiscoveries.get(currentDiscoveryId)?.duplicateInfluencers || 0) + 1
					});
					continue;
				}

				// Check if already in database
				try {
					const existing = await influencers.getByHandle(`@${username}`);
					if (existing) {
						console.log(`   ⏭️  Skipped: @${username} already in database`);
						websocketService.updateProgress(currentDiscoveryId, {
							currentStep: `⏭️ Skipped: @${username} already in database`,
							stage: 'influencer_processing',
							existingInfluencers: (websocketService.activeDiscoveries.get(currentDiscoveryId)?.existingInfluencers || 0) + 1
						});
						continue;
					}
				} catch (error) {
					console.log(`   ⚠️  Database check failed for @${username}, continuing...`);
				}

				const influencerData = {
					instagram_handle: `@${username}`,
					full_name: item.ownerFullName || username,
					follower_count: followerCount,
					following_count: 0, // Not available in hashtag scraping
					engagement_rate: parseFloat(engagementRate.toFixed(2)),
					bio: '', // Not available in hashtag scraping - will be filled by profile scraper
					profile_url: `https://instagram.com/${username}`,
					profile_image: item.ownerProfilePicUrl || '',
					verified: item.ownerIsVerified || false,
					score: this.calculateInfluencerScore(followerCount, engagementRate, item.ownerIsVerified || false),
					tags: hashtags,
					source: 'hashtag_discovery',
					sample_post_engagement: (item.ownerLikesCount || 0) + (item.ownerCommentsCount || 0),
					discovery_post_url: item.url || `https://instagram.com/p/${item.shortCode}`,
					last_post_date: item.timestamp || new Date().toISOString()
				};

				influencerMap.set(username, influencerData);
				console.log(`   ✅ Added @${username} to discovery list`);

				// Update progress: New influencer found
				websocketService.updateProgress(currentDiscoveryId, {
					currentStep: `✅ Added @${username} to discovery list`,
					stage: 'influencer_added',
					influencersFound: influencerMap.size,
					currentInfluencer: username,
					currentInfluencerFollowers: followerCount,
					currentInfluencerEngagement: engagementRate
				});
			}

			const discoveredInfluencers = Array.from(influencerMap.values());
			console.log(`📈 Discovery Results:`);
			console.log(`   📊 Posts processed: ${processedCount}`);
			console.log(`   🚫 Filtered out: ${filteredCount}`);
			console.log(`   ✅ New influencers found: ${discoveredInfluencers.length}`);

			// Update progress: Discovery completed
			websocketService.updateProgress(currentDiscoveryId, {
				currentStep: `Discovery completed! Found ${discoveredInfluencers.length} influencers`,
				stage: 'discovery_completed',
				influencersFound: discoveredInfluencers.length,
				postsProcessed: processedCount,
				filteredOut: filteredCount,
				progress: 30
			});

			return discoveredInfluencers;

		} catch (error) {
			console.error('❌ Error in hashtag discovery:', error);

			// Update progress: Discovery failed
			websocketService.updateProgress(currentDiscoveryId, {
				currentStep: `❌ Discovery failed: ${error.message}`,
				stage: 'error',
				error: error.message,
				progress: 0
			});

			websocketService.failDiscovery(currentDiscoveryId, error);
			throw error;
		}
	}

	/**
	 * Extract email from Instagram profile using the official profile scraper
	 */
	async extractEmailFromProfile(username, discoveryId = null) {
		// Validate input
		if (!username) {
			console.log(`❌ Cannot extract email: username is undefined or null`);
			return null;
		}

		if (typeof username !== 'string') {
			console.log(`❌ Cannot extract email: username is not a string (type: ${typeof username})`);
			return null;
		}

		console.log(`📧 Extracting email for @${username}`);

		try {
			// Remove @ symbol if present
			const cleanUsername = username.replace('@', '');

			console.log(cleanUsername, 1111);
			const run = await client.actor(INSTAGRAM_PROFILE_SCRAPER_ID).call({
				usernames: [cleanUsername]
			});

			const finishedRun = await client.run(run.id).waitForFinish();

			if (finishedRun.status !== 'SUCCEEDED') {
				throw new Error(`Profile scraping failed: ${finishedRun.status}`);
			}

			const { items } = await client.dataset(finishedRun.defaultDatasetId).listItems();
			console.log(items, 2222);

			if (items.length === 0) {
				console.log(`❌ No profile data found for @${cleanUsername}`);
				return null;
			}

			const profile = items[0];
			const emails = [];

			// Extract email from bio
			const bio = profile.biography || '';
			if (bio) {
				const bioEmails = this.extractEmailsFromText(bio);
				emails.push(...bioEmails);
				console.log(`📝 Bio: "${bio.substring(0, 100)}${bio.length > 100 ? '...' : ''}"`);
			}

			// Check external URL for email
			if (profile.externalUrl) {
				console.log(`🔗 External URL found: ${profile.externalUrl}`);
				const urlEmails = await this.extractEmailFromExternalUrl(profile.externalUrl, discoveryId);
				emails.push(...urlEmails);
			}

			// Remove duplicates and validate
			const uniqueEmails = [...new Set(emails)].filter(email => this.isValidEmail(email));

			if (uniqueEmails.length > 0) {
				console.log(`✅ Found ${uniqueEmails.length} email(s) for @${cleanUsername}: ${uniqueEmails.join(', ')}`);
				return uniqueEmails[0]; // Return the first valid email
			}

			console.log(`❌ No email found for @${cleanUsername}`);
			return null;

		} catch (error) {
			console.error(`❌ Error extracting email for @${username}:`, error);
			return null;
		}
	}

	/**
	 * Extract emails from text using regex patterns
	 */
	extractEmailsFromText(text) {
		if (!text || typeof text !== 'string') {
			return [];
		}

		const emails = [];

		// Clean the text first
		const cleanText = text
			.replace(/\s+/g, ' ') // Replace multiple spaces with single space
			.replace(/\n/g, ' ') // Replace newlines with spaces
			.replace(/\r/g, ' ') // Replace carriage returns with spaces
			.trim();

		for (const pattern of EMAIL_PATTERNS) {
			const matches = cleanText.match(pattern);
			if (matches) {
				emails.push(...matches);
			}
		}

		// Additional manual checks for common patterns
		// Check for emails with spaces that might be missed
		const spaceEmailPattern = /[a-zA-Z0-9._%+-]+\s+@\s+[a-zA-Z0-9.-]+\s+\.\s+[a-zA-Z]{2,}/g;
		const spaceMatches = cleanText.match(spaceEmailPattern);
		if (spaceMatches) {
			emails.push(...spaceMatches.map(email => email.replace(/\s+/g, '')));
		}

		// Check for emails with "dot" instead of "."
		const dotEmailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\s+dot\s+[a-zA-Z]{2,}/gi;
		const dotMatches = cleanText.match(dotEmailPattern);
		if (dotMatches) {
			emails.push(...dotMatches.map(email => email.replace(/\s+dot\s+/gi, '.')));
		}

		// Filter and clean emails
		const validEmails = emails
			.map(email => email.trim().toLowerCase())
			.filter(email => this.isValidEmail(email));

		return [...new Set(validEmails)]; // Remove duplicates
	}

	/**
	 * Enhanced HTTP request with better error handling and retry logic
	 */
	async makeHttpRequest(url, options = {}) {
		const maxRetries = options.maxRetries || 3;
		const timeout = options.timeout || 15000;
		
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const response = await axios.get(url, {
					timeout,
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
						'Accept-Language': 'en-US,en;q=0.5',
						'Accept-Encoding': 'gzip, deflate, br',
						'Connection': 'keep-alive',
						'Upgrade-Insecure-Requests': '1',
						'Cache-Control': 'max-age=0',
						...options.headers
					},
					validateStatus: (status) => status < 500, // Don't throw on 4xx errors
					maxRedirects: 5
				});
				
				return response;
			} catch (error) {
				console.log(`⚠️ HTTP request attempt ${attempt}/${maxRetries} failed: ${error.message}`);
				
				if (attempt < maxRetries) {
					// Exponential backoff
					await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
					continue;
				} else {
					throw error;
				}
			}
		}
	}

	/**
	 * Extract emails using simple HTTP request (fallback method)
	 */
	async extractEmailWithHttpRequest(url, discoveryId = null) {
		try {
			console.log(`🌐 Using HTTP request fallback for: ${url}`);
			
			const https = require('https');
			const http = require('http');
			const { URL } = require('url');
			const zlib = require('zlib');
			
			const urlObj = new URL(url);
			const client = urlObj.protocol === 'https:' ? https : http;
			
			const response = await new Promise((resolve, reject) => {
				const req = client.get(url, {
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
						'Accept-Language': 'en-US,en;q=0.5',
						'Accept-Encoding': 'gzip, deflate',
						'Connection': 'keep-alive',
						'Upgrade-Insecure-Requests': '1'
					},
					timeout: 15000
				}, resolve);
				req.on('error', reject);
				req.setTimeout(15000, () => reject(new Error('Request timeout')));
			});
			
			let chunks = [];
			response.on('data', chunk => {
				chunks.push(chunk);
			});
			
			await new Promise((resolve, reject) => {
				response.on('end', resolve);
				response.on('error', reject);
			});
			
			// Handle gzipped content
			const buffer = Buffer.concat(chunks);
			let htmlContent = '';
			
			// Check if content is gzipped
			if (response.headers['content-encoding'] === 'gzip') {
				htmlContent = zlib.gunzipSync(buffer).toString('utf8');
			} else if (response.headers['content-encoding'] === 'deflate') {
				htmlContent = zlib.inflateSync(buffer).toString('utf8');
			} else {
				htmlContent = buffer.toString('utf8');
			}
			
			// Extract emails from the HTML content
			const emails = this.extractEmailsFromText(htmlContent);
			const uniqueEmails = [...new Set(emails)].filter(email => this.isValidEmail(email));
			
			if (uniqueEmails.length > 0) {
				console.log(`✅ Found ${uniqueEmails.length} email(s) via HTTP request: ${uniqueEmails.join(', ')}`);
				
				// Update progress if discovery ID provided
				if (discoveryId) {
					const websocketService = require('./websocket');
					const discovery = websocketService.getDiscovery(discoveryId);
					const currentEmailsFound = discovery ? discovery.emailsFound : 0;
					const newEmailsFound = currentEmailsFound + uniqueEmails.length;
					
					websocketService.updateProgress(discoveryId, {
						currentStep: `✅ Found ${uniqueEmails.length} email(s) via HTTP request`,
						stage: 'url_scraping_complete',
						emailsFound: newEmailsFound,
						emails: uniqueEmails
					});
				}
			} else {
				console.log(`❌ No emails found via HTTP request on ${url}`);
				
				// Update progress if discovery ID provided
				if (discoveryId) {
					const websocketService = require('./websocket');
					const discovery = websocketService.getDiscovery(discoveryId);
					const currentEmailsFound = discovery ? discovery.emailsFound : 0;
					
					websocketService.updateProgress(discoveryId, {
						currentStep: `❌ No emails found via HTTP request on ${url}`,
						stage: 'url_scraping_complete',
						emailsFound: currentEmailsFound
					});
				}
			}
			
			return uniqueEmails;
			
		} catch (error) {
			console.error(`❌ Error with HTTP request for ${url}:`, error.message);
			
			// Update progress if discovery ID provided
			if (discoveryId) {
				const websocketService = require('./websocket');
				websocketService.updateProgress(discoveryId, {
					currentStep: `❌ HTTP request failed: ${error.message}`,
					stage: 'url_scraping_error',
					error: error.message
				});
			}
			
			return [];
		}
	}

	/**
	 * Extract email from external URL using enhanced Cheerio + Axios (Digital Ocean optimized)
	 */
	async extractEmailFromExternalUrl(url, discoveryId = null) {
		try {
			if (!url || typeof url !== 'string') {
				console.log(`⚠️ Invalid URL provided: ${url}`);
				return [];
			}

			// Clean and validate URL
			let cleanUrl = url.trim();
			if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
				cleanUrl = 'https://' + cleanUrl;
			}

			console.log(`🔗 Scraping external URL with Cheerio + Axios: ${cleanUrl}`);

			// Update progress if discovery ID provided
			if (discoveryId) {
				websocketService.updateProgress(discoveryId, {
					currentStep: `Loading page: ${cleanUrl}`,
					stage: 'url_scraping',
					currentUrl: cleanUrl
				});
			}

			// Make HTTP request with enhanced error handling
			const response = await this.makeHttpRequest(cleanUrl, {
				timeout: 15000,
				maxRetries: 3
			});

			if (!response || !response.data) {
				throw new Error('No data received from URL');
			}

			// Update progress
			if (discoveryId) {
				websocketService.updateProgress(discoveryId, {
					currentStep: `Extracting content from: ${cleanUrl}`,
					stage: 'url_scraping',
					currentUrl: cleanUrl
				});
			}

			// Parse HTML with Cheerio
			const $ = cheerio.load(response.data);
			
			// Extract emails from various sources
			const emails = [];
			// 1. Extract from mailto links
			$('a[href^="mailto:"]').each((i, element) => {
				const href = $(element).attr('href');
				if (href) {
					const email = href.replace('mailto:', '').split('?')[0].trim();
					if (email) {
						emails.push(email);
					}
				}
			});

			// 2. Extract from data attributes
			$('[data-email], [data-contact], [data-mail]').each((i, element) => {
				const email = $(element).attr('data-email') ||
					$(element).attr('data-contact') ||
					$(element).attr('data-mail');
				if (email) {
					emails.push(email);
				}
			});

			// 3. Extract from contact-related elements
			const contactSelectors = [
				'[class*="contact"]',
				'[class*="email"]',
				'[class*="about"]',
				'[class*="bio"]',
				'[id*="contact"]',
				'[id*="email"]',
				'[id*="about"]',
				'[id*="bio"]'
			];

			let contactTexts = '';
			contactSelectors.forEach(selector => {
				$(selector).each((i, element) => {
					contactTexts += ' ' + $(element).text();
				});
			});

			// 4. Extract from all text content
			const allText = $('body').text() + ' ' + contactTexts + ' ' + response.data;

			// 5. Extract emails using regex patterns
			const regexEmails = this.extractEmailsFromText(allText);
			emails.push(...regexEmails);

			// Remove duplicates and validate
			const uniqueEmails = [...new Set(emails)].filter(email => this.isValidEmail(email));

			if (uniqueEmails.length > 0) {
				console.log(`✅ Found ${uniqueEmails.length} email(s) from ${cleanUrl}: ${uniqueEmails.join(', ')}`);

				// Update progress if discovery ID provided
				if (discoveryId) {
					const discovery = websocketService.getDiscovery(discoveryId);
					const currentEmailsFound = discovery ? discovery.emailsFound : 0;
					const newEmailsFound = currentEmailsFound + uniqueEmails.length;
					
					websocketService.updateProgress(discoveryId, {
						currentStep: `✅ Found ${uniqueEmails.length} email(s) from ${cleanUrl}`,
						stage: 'url_scraping_complete',
						emailsFound: newEmailsFound,
						emails: uniqueEmails
					});
				}
			} else {
				console.log(`❌ No emails found on ${cleanUrl}`);

				// Update progress if discovery ID provided
				if (discoveryId) {
					const discovery = websocketService.getDiscovery(discoveryId);
					const currentEmailsFound = discovery ? discovery.emailsFound : 0;
					
					websocketService.updateProgress(discoveryId, {
						currentStep: `❌ No emails found on ${cleanUrl}`,
						stage: 'url_scraping_complete',
						emailsFound: currentEmailsFound
					});
				}
			}

			return uniqueEmails;

		} catch (error) {
			console.error(`❌ Error scraping URL ${url} with Cheerio + Axios:`, error.message);

			// Update progress if discovery ID provided
			if (discoveryId) {
				websocketService.updateProgress(discoveryId, {
					currentStep: `❌ Error scraping URL: ${error.message}`,
					stage: 'url_scraping_error',
					error: error.message
				});
			}

			return [];
		}
	}

	/**
	 * Validate email format
	 */
	isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return email.includes(".com") && emailRegex.test(email) && !email.includes('..') && email.length <= 254;
	}

	/**
	 * Calculate influencer score based on metrics
	 */
	calculateInfluencerScore(followers, engagementRate, isVerified) {
		let score = 0;

		// Validate inputs to prevent NaN
		const validFollowers = isNaN(followers) || followers === null || followers === undefined ? 0 : followers;
		const validEngagementRate = isNaN(engagementRate) || engagementRate === null || engagementRate === undefined ? 0 : engagementRate;

		// Follower count score (0-40 points)
		if (validFollowers >= 100000) score += 40;
		else if (validFollowers >= 50000) score += 35;
		else if (validFollowers >= 20000) score += 30;
		else if (validFollowers >= 10000) score += 25;
		else if (validFollowers >= 5000) score += 20;
		else if (validFollowers >= 1000) score += 15;
		else score += 10;

		// Engagement rate score (0-40 points) 
		if (validEngagementRate >= 10) score += 40;
		else if (validEngagementRate >= 5) score += 35;
		else if (validEngagementRate >= 3) score += 30;
		else if (validEngagementRate >= 2) score += 25;
		else if (validEngagementRate >= 1) score += 20;
		else if (validEngagementRate >= 0.5) score += 15;
		else score += 10;

		// Verification bonus (0-20 points)
		if (isVerified) score += 20;

		return Math.min(score, 100); // Cap at 100
	}

	/**
	 * Get profile details for a username (optimized version)
	 */
	async getProfileDetails(username) {
		try {
			// Clean username
			const cleanUsername = username.replace('@', '');

			// Use optimized settings for faster scraping
			const run = await client.actor(INSTAGRAM_PROFILE_SCRAPER_ID).call({
				usernames: [cleanUsername],
				resultsLimit: 1,
				addParentData: false,
				// Add performance optimizations
				timeoutSecs: 30, // Reduced timeout
				maxRequestRetries: 2, // Reduced retries for speed
				requestQueueTimeoutSecs: 60
			});

			// Wait for completion with timeout
			const finishedRun = await Promise.race([
				client.run(run.id).waitForFinish(),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error('Profile scraping timeout')), 45000)
				)
			]);

			if (finishedRun.status !== 'SUCCEEDED') {
				console.log(`⚠️  Profile scraping failed for @${cleanUsername}: ${finishedRun.status}`);
				return null;
			}

			const { items } = await client.dataset(finishedRun.defaultDatasetId).listItems();

			if (items.length === 0) {
				console.log(`⚠️  No profile data found for @${cleanUsername}`);
				return null;
			}

			return items[0];

		} catch (error) {
			console.error(`❌ Error getting profile details for @${username}:`, error.message);
			return null;
		}
	}

	/**
	 * Bulk process influencers for email extraction
	 */
	async bulkExtractEmails(influencerList) {
		console.log(`📧 Starting bulk email extraction for ${influencerList.length} influencers`);

		const results = [];

		for (const influencer of influencerList) {
			try {
				// Validate influencer object
				if (!influencer) {
					console.log(`❌ Skipping undefined influencer object`);
					results.push({
						influencer_id: null,
						username: 'unknown',
						email: null,
						status: 'error',
						error: 'Influencer object is undefined'
					});
					continue;
				}

				// Validate instagram_handle
				if (!influencer.instagram_handle) {
					console.log(`❌ Skipping influencer with no instagram_handle:`, influencer);
					results.push({
						influencer_id: influencer.id || null,
						username: 'no_handle',
						email: null,
						status: 'error',
						error: 'No instagram_handle found'
					});
					continue;
				}

				const username = influencer.instagram_handle.replace('@', '');
				const email = await this.extractEmailFromProfile(username);

				results.push({
					influencer_id: influencer.id,
					username: influencer.instagram_handle,
					email: email,
					status: email ? 'found' : 'not_found'
				});

				// Add delay to avoid rate limiting
				await new Promise(resolve => setTimeout(resolve, 2000));

			} catch (error) {
				console.error(`Error processing ${influencer?.instagram_handle || 'unknown'}:`, error);
				results.push({
					influencer_id: influencer?.id || null,
					username: influencer?.instagram_handle || 'unknown',
					email: null,
					status: 'error',
					error: error.message
				});
			}
		}

		console.log(`✅ Bulk email extraction completed. Found emails for ${results.filter(r => r.email).length} influencers`);
		return results;
	}

	/**
	 * Discover influencers from competitor mentions
	 */
	async discoverCompetitorInfluencers(competitorUsernames, options = {}) {
		const { limit = 30 } = options;

		console.log(`🔍 Discovering influencers from competitors: ${competitorUsernames.join(', ')}`);

		try {
			const allInfluencers = [];

			for (const username of competitorUsernames) {
				console.log(`🔎 Analyzing mentions for @${username}`);

				const run = await client.actor(INSTAGRAM_MENTION_SCRAPER_ID).call({
					username: [username.replace('@', '')],
					resultsLimit: limit
				});

				const finishedRun = await client.run(run.id).waitForFinish();

				if (finishedRun.status !== 'SUCCEEDED') {
					console.error(`❌ Mention scraping failed for @${username}: ${finishedRun.status}`);
					continue;
				}

				const { items } = await client.dataset(finishedRun.defaultDatasetId).listItems();

				console.log(`📊 Found ${items.length} mentions for @${username}`);

				// Process mention data to find influencers
				for (const item of items) {
					// Extract mentioned users from the post
					if (item.mentionedUsers && item.mentionedUsers.length > 0) {
						for (const mention of item.mentionedUsers) {
							// Check if already in database
							const existing = await influencers.getByHandle(`@${mention.username}`);
							if (existing) {
								continue;
							}

							allInfluencers.push({
								instagram_handle: `@${mention.username}`,
								full_name: mention.full_name || '',
								source: 'competitor_mentions',
								competitor_source: username,
								tags: ['competitor_analysis']
							});
						}
					}
				}

				// Add delay between competitors
				await new Promise(resolve => setTimeout(resolve, 3000));
			}

			// Remove duplicates
			const uniqueInfluencers = allInfluencers.filter((influencer, index, self) =>
				index === self.findIndex(i => i.instagram_handle === influencer.instagram_handle)
			);

			console.log(`✅ Discovered ${uniqueInfluencers.length} unique influencers from competitor analysis`);
			return uniqueInfluencers;

		} catch (error) {
			console.error('❌ Error in competitor influencer discovery:', error);
			throw error;
		}
	}

	/**
	 * Optimized two-stage discovery: Find influencers via hashtags, then enrich with profile data
	 * Performance optimizations:
	 * - Parallel profile enrichment (batch processing)
	 * - Reduced API calls by combining profile and email extraction
	 * - Early termination when limit is reached
	 * - Reduced rate limiting delays
	 */
	async discoverInfluencersWithProfileEnrichment(hashtags, options = {}) {
		const {
			limit = 50,
			minFollowers = 50000,
			maxFollowers = 1000000,
			minEngagementRate = 0.0,
			discoveryId = null,
			location = null
		} = options;
		// Generate discovery ID if not provided
		const currentDiscoveryId = discoveryId || `discovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		console.log(`🔍 Starting optimized two-stage discovery for hashtags: ${hashtags.join(', ')}`);
		console.log(`📊 Target: ${limit} influencers with ${minFollowers}-${maxFollowers} followers`);

		// Start progress tracking
		websocketService.startDiscovery(currentDiscoveryId, location, hashtags, {
			limit,
			minFollowers,
			maxFollowers,
			minEngagementRate,
			location
		});

		try {
			// Update progress: Starting Stage 1
			websocketService.updateProgress(currentDiscoveryId, {
				status: 'processing',
				currentStep: 'Stage 1: Discovering initial candidates via hashtags...',
				totalSteps: 3,
				completedSteps: 0,
				progress: 5,
				stage: 'hashtag_discovery'
			});

			// Stage 1: Discover influencers via hashtags
			const initialInfluencers = await this.discoverInfluencersByHashtags(hashtags, location, {
				limit: limit, // Limit initial candidates to avoid too many API calls
				minFollowers: 1000, // Lower threshold for initial discovery
				maxFollowers: 2000000, // Higher threshold for initial discovery
				minEngagementRate: 0.0,
				discoveryId: currentDiscoveryId,
			});

			console.log(`📱 Stage 1 complete: Found ${initialInfluencers.length} initial candidates`);

			// Update progress: Stage 1 complete
			websocketService.updateStep(currentDiscoveryId, `Stage 1 complete: Found ${initialInfluencers.length} initial candidates`, {
				progress: 30,
				stage: 'hashtag_discovery_complete',
				candidatesFound: initialInfluencers.length
			});

			if (initialInfluencers.length === 0) {
				console.log(`⚠️  No initial candidates found, returning empty array`);
				websocketService.failDiscovery(currentDiscoveryId, new Error('No initial candidates found'));
				return [];
			}

			// Stage 2: Batch enrich with profile data (parallel processing)
			const enrichedInfluencers = [];
			const usernames = initialInfluencers.map(inf => inf.instagram_handle.replace('@', ''));

			console.log(`🔍 Stage 2: Batch enriching ${usernames.length} profiles...`);

			// Update progress: Starting Stage 2
			websocketService.updateStep(currentDiscoveryId, `Stage 2: Enriching ${usernames.length} profiles with detailed data...`, {
				progress: 35,
				stage: 'profile_enrichment',
				profilesToEnrich: usernames.length
			});

			// Process in batches for better performance
			const batchSize = 5;
			const batches = [];

			for (let i = 0; i < usernames.length; i += batchSize) {
				batches.push(usernames.slice(i, i + batchSize));
			}

			for (let batchIndex = 0; batchIndex < batches.length && enrichedInfluencers.length < limit; batchIndex++) {
				const batch = batches[batchIndex];
				console.log(`📊 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} profiles)`);

				// Update progress: Processing batch
				websocketService.updateStep(currentDiscoveryId, `Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} profiles)`, {
					progress: 35 + (batchIndex / batches.length) * 50,
					stage: 'profile_enrichment',
					currentBatch: batchIndex + 1,
					totalBatches: batches.length,
					profilesInBatch: batch.length,
					enrichedSoFar: enrichedInfluencers.length
				});

				// Process batch in parallel
				const batchPromises = batch.map(async (username, index) => {
					try {
						console.log(`   📊 Enriching @${username} (batch ${batchIndex + 1}, item ${index + 1})`);

						// Update progress: Processing individual profile
						websocketService.updateProgress(currentDiscoveryId, {
							currentStep: `Enriching @${username} (${index + 1}/${batch.length} in batch ${batchIndex + 1})`,
							progress: 35 + (batchIndex / batches.length) * 50 + (index / batch.length) * (50 / batches.length),
							stage: 'profile_enrichment',
							currentInfluencer: username,
							currentInfluencerIndex: index + 1,
							totalInCurrentBatch: batch.length
						});

						// Get profile data and extract email in one API call
						const profileData = await this.getProfileDetails(username);

						if (!profileData) {
							console.log(`   ⚠️  Could not enrich @${username}, skipping`);
							websocketService.updateProgress(currentDiscoveryId, {
								currentStep: `⚠️ Could not enrich @${username}, skipping`,
								stage: 'profile_enrichment',
								skippedProfiles: (websocketService.activeDiscoveries.get(currentDiscoveryId)?.skippedProfiles || 0) + 1
							});
							return null;
						}

						// Get original data
						const originalData = initialInfluencers.find(inf => inf.instagram_handle === `@${username}`);
						if (!originalData) {
							console.log(`   ⚠️  No original data found for @${username}, skipping`);
							return null;
						}

						// Apply filters with real data (try multiple field names)
						const followerCount = profileData.followersCount || profileData.followers || profileData.followerCount || 0;
						const followingCount = profileData.followsCount || profileData.following || profileData.followingCount || 0;
						const postCount = profileData.postsCount || profileData.posts || profileData.postCount || 0;
						const isVerified = profileData.isVerified || profileData.verified || false;

						// Calculate engagement rate
						const engagementRate = originalData?.sample_post_engagement && followerCount > 0
							? (originalData.sample_post_engagement / followerCount) * 100
							: 0;

						console.log(`   📊 @${username}: ${followerCount.toLocaleString()} followers, ${engagementRate.toFixed(2)}% engagement`);

						// Update progress: Analyzing profile data
						websocketService.updateProgress(currentDiscoveryId, {
							currentStep: `Analyzing @${username}: ${followerCount.toLocaleString()} followers, ${engagementRate.toFixed(2)}% engagement`,
							stage: 'profile_analysis',
							currentInfluencer: username,
							currentInfluencerFollowers: followerCount,
							currentInfluencerEngagement: engagementRate
						});

						if (followerCount >= minFollowers && followerCount <= maxFollowers && engagementRate >= minEngagementRate) {
							// Extract email from profile data (no additional API call needed)
							console.log(`   📧 Extracting email for @${username}...`);

							// Update progress: Extracting email
							websocketService.updateProgress(currentDiscoveryId, {
								currentStep: `Extracting email for @${username}...`,
								stage: 'email_extraction',
								currentInfluencer: username
							});

							const email = await this.extractEmailFromProfileData(profileData, currentDiscoveryId);
							if (!email) return null;
							console.log(`   📧 Email extraction result for @${username}: ${email || 'No email found'}`);

							// Update progress: Email extraction complete
							websocketService.updateProgress(currentDiscoveryId, {
								currentStep: `Email extraction complete for @${username}: ${email ? 'Found' : 'Not found'}`,
								stage: 'email_extraction_complete',
								currentInfluencer: username,
								emailFound: !!email,
								emailAddress: email
							});

							const enrichedData = {
								...originalData,
								instagram_handle: `@${username}`,
								full_name: profileData.fullName || profileData.name || profileData.displayName || originalData?.full_name,
								follower_count: followerCount,
								following_count: followingCount,
								engagement_rate: engagementRate,
								bio: profileData.biography || profileData.bio || profileData.description || '',
								profile_url: `https://instagram.com/${username}`,
								profile_image: profileData.profilePicUrl || profileData.profileImageUrl || originalData?.profile_image,
								verified: isVerified,
								post_count: postCount,
								email: email, // Add extracted email
								score: this.calculateInfluencerScore(followerCount, engagementRate, isVerified),
								tags: hashtags,
								source: 'hashtag_discovery_enriched',
								sample_post_engagement: originalData?.sample_post_engagement || 0,
								discovery_post_url: originalData?.discovery_post_url || '',
								last_post_date: originalData?.last_post_date || new Date().toISOString(),
								enrichment_date: new Date().toISOString()
							};

							console.log(`   ✅ Enriched @${username} added to final list${email ? ` (📧 ${email})` : ' (no email found)'}`);

							// Update progress: Influencer added to results
							websocketService.updateProgress(currentDiscoveryId, {
								currentStep: `✅ @${username} added to results${email ? ` (📧 ${email})` : ' (no email found)'}`,
								stage: 'influencer_added',
								currentInfluencer: username,
								enrichedSoFar: enrichedInfluencers.length + 1,
								emailFound: !!email,
								emailAddress: email
							});

							return enrichedData;
						} else {
							console.log(`   ⏭️  @${username} filtered out: ${followerCount} followers, ${engagementRate.toFixed(2)}% engagement`);

							// Update progress: Influencer filtered out
							websocketService.updateProgress(currentDiscoveryId, {
								currentStep: `⏭️ @${username} filtered out: ${followerCount} followers, ${engagementRate.toFixed(2)}% engagement`,
								stage: 'influencer_filtered',
								currentInfluencer: username,
								filterReason: followerCount < minFollowers ? 'too_few_followers' :
									followerCount > maxFollowers ? 'too_many_followers' :
										'low_engagement'
							});

							return null;
						}

					} catch (error) {
						console.error(`   ❌ Error enriching @${username}:`, error.message);

						// Update progress: Error processing influencer
						websocketService.updateProgress(currentDiscoveryId, {
							currentStep: `❌ Error processing @${username}: ${error.message}`,
							stage: 'error',
							currentInfluencer: username,
							error: error.message
						});

						return null;
					}
				});

				// Wait for batch to complete
				const batchResults = await Promise.all(batchPromises);

				// Add successful results to enriched list
				for (const result of batchResults) {
					if (result && enrichedInfluencers.length < limit) {
						enrichedInfluencers.push(result);
					}
				}

				// Update progress: Batch complete
				websocketService.updateStep(currentDiscoveryId, `Batch ${batchIndex + 1}/${batches.length} complete. Found ${enrichedInfluencers.length} influencers so far.`, {
					progress: 35 + ((batchIndex + 1) / batches.length) * 50,
					stage: 'batch_complete',
					currentBatch: batchIndex + 1,
					totalBatches: batches.length,
					enrichedSoFar: enrichedInfluencers.length,
					targetLimit: limit
				});

				// Early termination if we have enough influencers
				if (enrichedInfluencers.length >= limit) {
					console.log(`🎯 Target limit reached (${limit}), stopping enrichment`);
					websocketService.updateProgress(currentDiscoveryId, {
						currentStep: `🎯 Target limit reached (${limit}), stopping enrichment`,
						stage: 'target_reached',
						enrichedSoFar: enrichedInfluencers.length,
						targetLimit: limit
					});
					break;
				}

				// Reduced rate limiting between batches
				if (batchIndex < batches.length - 1) {
					await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms to 500ms
				}
			}

			// Update progress: Stage 2 complete
			websocketService.updateStep(currentDiscoveryId, `Stage 2 complete: Enriched ${enrichedInfluencers.length} influencers`, {
				progress: 85,
				stage: 'profile_enrichment_complete',
				enrichedCount: enrichedInfluencers.length
			});

			// Update progress: Starting Stage 3 (final processing)
			websocketService.updateStep(currentDiscoveryId, 'Stage 3: Finalizing results and saving to database...', {
				progress: 90,
				stage: 'final_processing'
			});

			console.log(`✅ Optimized two-stage discovery complete: ${enrichedInfluencers.length} influencers with accurate data`);

			// Get the accumulated count from WebSocket service
			const discovery = websocketService.getDiscovery(currentDiscoveryId);
			const accumulatedEmailsFound = discovery ? discovery.emailsFound : enrichedInfluencers.filter(inf => inf.email).length;

			// Complete the discovery
			websocketService.completeDiscovery(currentDiscoveryId, {
				influencers: enrichedInfluencers,
				totalFound: enrichedInfluencers.length,
				hashtags: hashtags,
				stats: {
					initialCandidates: initialInfluencers.length,
					enrichedInfluencers: enrichedInfluencers.length,
					batchesProcessed: batches.length,
					emailsFound: accumulatedEmailsFound
				}
			});

			return enrichedInfluencers;

		} catch (error) {
			console.error('❌ Error in optimized discovery:', error);
			websocketService.failDiscovery(currentDiscoveryId, error);
			throw error;
		}
	}

	/**
	 * Extract email from profile data without additional API calls
	 * This is an optimized version that works with already-fetched profile data
	 */
	async extractEmailFromProfileData(profileData, discoveryId = null) {
		if (!profileData) {
			return null;
		}

		// Debug: Log the actual structure of profileData
		console.log(`🔍 Profile data structure for debugging:`, {
			keys: Object.keys(profileData),
			biography: profileData.biography,
			fullName: profileData.fullName,
			externalUrl: profileData.externalUrl,
			// Check alternative field names
			bio: profileData.bio,
			name: profileData.name,
			external_url: profileData.external_url,
			website: profileData.website,
			url: profileData.url
		});

		const emails = [];

		// Extract email from bio (try multiple field names)
		const bio = profileData.biography || profileData.bio || profileData.description || '';
		if (bio) {
			console.log(`📝 Checking bio for emails: "${bio.substring(0, 100)}${bio.length > 100 ? '...' : ''}"`);
			const bioEmails = this.extractEmailsFromText(bio);
			emails.push(...bioEmails);
			console.log(`📧 Bio emails found: ${bioEmails.length}`);
		}

		// Extract email from full name (sometimes contains email)
		const fullName = profileData.fullName || profileData.name || profileData.displayName || '';
		if (fullName) {
			console.log(`👤 Checking full name for emails: "${fullName}"`);
			const nameEmails = this.extractEmailsFromText(fullName);
			emails.push(...nameEmails);
			console.log(`📧 Name emails found: ${nameEmails.length}`);
		}

		// Check external URL for email patterns (try multiple field names)
		const externalUrl = profileData.externalUrl || profileData.external_url || profileData.website || profileData.url || '';
		if (externalUrl) {
			console.log(`🔗 External URL found: ${externalUrl}`);

			// First check if URL contains email patterns directly
			const urlEmails = this.extractEmailsFromText(externalUrl);
			emails.push(...urlEmails);
			console.log(`📧 URL direct emails found: ${urlEmails.length}`);

			// Check for common email patterns in URLs
			let urlTextEmails = ''
			if (externalUrl.includes('@')) {
				console.log(`🔍 URL contains @ symbol, checking for email patterns`);
				const urlText = externalUrl.replace(/https?:\/\//g, '').replace(/\/.*$/, '');
				urlTextEmails = this.extractEmailsFromText(urlText);
				emails.push(...urlTextEmails);
				console.log(`📧 URL text emails found: ${urlTextEmails.length}`);
			}

			// If no emails found in URL text, scrape the actual webpage
			if (urlEmails.length === 0 && urlTextEmails.length === 0) {
				console.log(`🔍 No emails found in URL text, scraping webpage...`);
				try {
					const scrapedEmails = await this.extractEmailFromExternalUrl(externalUrl, discoveryId);
					emails.push(...scrapedEmails);
					console.log(`📧 Scraped emails found: ${scrapedEmails.length}`);
				} catch (error) {
					console.log(`⚠️ Error scraping URL: ${error.message}`);
				}
			}
		}

		// Remove duplicates and validate
		const uniqueEmails = [...new Set(emails)].filter(email => this.isValidEmail(email));

		if (uniqueEmails.length > 0) {
			console.log(`✅ Found ${uniqueEmails.length} email(s) from profile data: ${uniqueEmails.join(', ')}`);
			var validMail = ''
			uniqueEmails.forEach((email, i) => {
				if (this.isValidEmail(email)) {
					validMail += email + (i < uniqueEmails.length - 1 ? ', ' : '')
				}
			})
			return validMail; // Return the first valid email
		}

		console.log(`❌ No valid emails found in profile data`);
		return null;
	}

	/**
	 * Test Apify connection and actors
	 */
	async testConnection() {
		try {
			console.log('🧪 Testing Apify connection...');

			// Test hashtag scraper with a small request
			const testRun = await client.actor(INSTAGRAM_HASHTAG_SCRAPER_ID).call({
				hashtags: ['beauty'],
				resultsType: 'posts',
				resultsLimit: 5
			});

			const finishedRun = await client.run(testRun.id).waitForFinish();

			if (finishedRun.status === 'SUCCEEDED') {
				const { items } = await client.dataset(finishedRun.defaultDatasetId).listItems();

				return {
					success: true,
					message: `Apify connection successful. Test run returned ${items.length} items`,
					actor_id: INSTAGRAM_HASHTAG_SCRAPER_ID,
					run_id: testRun.id,
					sample_data: items.length > 0 ? items[0] : null
				};
			} else {
				return {
					success: false,
					error: `Test run failed with status: ${finishedRun.status}`
				};
			}

		} catch (error) {
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * Check if Apify is configured
	 */
	isConfigured() {
		return !!(process.env.APIFY_TOKEN && process.env.APIFY_TOKEN !== 'your-apify-token');
	}
}

module.exports = new ApifyService(); 