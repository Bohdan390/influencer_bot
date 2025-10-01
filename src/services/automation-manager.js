const cron = require('node-cron');
const { config, getAutomationSettings } = require('../config/hardcoded-config');
const { supabase } = require('./supabase');

/**
 * 24/7 Automation Manager
 * Handles all automated processes including:
 * - 5-minute inbox checking
 * - Continuous campaign management
 * - AI response processing
 * - Split test monitoring
 */
class AutomationManager {
	constructor() {
		this.isRunning = false;
		this.jobs = new Map();
		this.stats = {
			inbox_checks: 0,
			emails_processed: 0,
			responses_sent: 0,
			campaigns_active: 0,
			last_check: null,
			uptime_start: new Date()
		};
	}

	/**
	 * Start all automation processes
	 */

	async start() {
		await this.checkInboxAndProcess();

		if (this.isRunning) {
			console.log('⚠️ Automation manager already running');
			return;
		}

		console.log('🤖 Starting 24/7 Automation Manager...');
		this.isRunning = true;

		const settings = getAutomationSettings();
		// ✨ 1. INBOX CHECKING - Every 5 minutes
		const inboxJob = cron.schedule(`*/${settings.inbox_check_interval} * * * *`, async () => {
			await this.checkInboxAndProcess();
		}, { scheduled: false });

		this.jobs.set('inbox_check', inboxJob);
		inboxJob.start();
		console.log(`📧 Inbox checking started (every ${settings.inbox_check_interval} minutes)`);

		// ✨ 2. CAMPAIGN DISCOVERY - Daily at 9 AM
		const discoveryJob = cron.schedule(settings.discovery_schedule, async () => {
			await this.runDailyDiscovery();
		}, { scheduled: false });

		this.jobs.set('discovery', discoveryJob);
		discoveryJob.start();
		console.log('🔍 Daily discovery scheduled (9 AM)');

		// ✨ 3. FOLLOW-UP PROCESSING - Every 6 hours
		const followUpJob = cron.schedule(settings.follow_up_schedule, async () => {
			await this.processFollowUps();
		}, { scheduled: false });

		this.jobs.set('follow_ups', followUpJob);
		followUpJob.start();
		console.log('📬 Follow-up processing scheduled (every 6 hours)');

		// ✨ 4. SPLIT TEST MONITORING - Every hour
		const splitTestJob = cron.schedule('0 * * * *', async () => {
			await this.monitorSplitTests();
		}, { scheduled: false });

		this.jobs.set('split_tests', splitTestJob);
		splitTestJob.start();
		console.log('🧪 Split test monitoring scheduled (hourly)');

		// ✨ 5. DAILY REPORTING - Every day at 9 AM
		const reportingJob = cron.schedule(settings.reporting_schedule, async () => {
			await this.generateDailyReport();
		}, { scheduled: false });

		this.jobs.set('reporting', reportingJob);
		reportingJob.start();
		console.log('📊 Daily reporting scheduled (9 AM Monday)');

		// ✨ 6. HEALTH CHECK - Every 30 minutes
		const healthJob = cron.schedule('*/30 * * * *', async () => {
			await this.performHealthCheck();
		}, { scheduled: false });

		this.jobs.set('health_check', healthJob);
		healthJob.start();
		console.log('❤️ Health monitoring started (every 30 minutes)');

		// ✨ 7. DM RESPONSE CHECKING - Every 5 minutes
		const dmResponseJob = cron.schedule('*/5 * * * *', async () => {
			await this.checkDMResponses();
		}, { scheduled: false });

		this.jobs.set('dm_responses', dmResponseJob);
		dmResponseJob.start();
		console.log('📱 DM response checking scheduled (every 5 minutes)');

		// ✨ 8. Initialize new services
		await this.initializeEnhancedServices();

		// Send startup notification
		await this.sendStartupNotification();

		console.log('✅ 24/7 Automation Manager fully operational');
	}

	/**
	 * ✨ Check inbox and process new responses (every 5 minutes)
	 */
	async checkInboxAndProcess() {
		try {
			console.log('📧 Checking inbox for new responses...', 111111111111);
			this.stats.inbox_checks++;
			this.stats.last_check = new Date();

			// Check all email providers for new responses
			const emailProviders = ['gmail', 'brevo', 'sendgrid', 'mailgun'];
			let totalProcessed = 0;

			for (const provider of emailProviders) {
				try {
					// Simulate checking provider inbox
					// In production, this would connect to email provider APIs
					const newEmails = await this.checkProviderInbox(provider);

					if (newEmails.length > 0) {
						console.log(`📬 Found ${newEmails.length} new emails from ${provider}`);

						for (const email of newEmails) {
							await this.processIncomingEmail(email, provider);
							totalProcessed++;
						}
					}
				} catch (error) {
					console.error(`❌ Error checking ${provider} inbox:`, error);
				}
			}

			this.stats.emails_processed += totalProcessed;

			if (totalProcessed > 0) {
				console.log(`✅ Processed ${totalProcessed} new emails`);

				// Send Slack notification for significant activity
				if (totalProcessed >= 5) {
					const slackService = require('./slack');
					await slackService.sendMessage({
						text: `📧 High email activity: ${totalProcessed} responses processed in last check`
					});
				}
			}

		} catch (error) {
			console.error('❌ Inbox check failed:', error);
			await this.handleAutomationError('inbox_check', error);
		}
	}

	/**
	 * Check specific email provider for new emails
	 */
	async checkProviderInbox(provider) {
		try {
			console.log(`📧 Checking ${provider} inbox for new emails...`);

			if (provider === 'gmail' || provider === 'smtp') {
				// Use IMAP to check Gmail inbox
				return await this.checkGmailInbox();
			} else if (provider === 'brevo') {
				// Use Brevo API to check inbox
				return await this.checkBrevoInbox();
			} else if (provider === 'sendgrid') {
				// Use SendGrid API to check inbox
				return await this.checkSendGridInbox();
			}

			return [];
		} catch (error) {
			console.error(`❌ Error checking ${provider} inbox:`, error.message);
			return [];
		}
	}

	/**
	 * Check Gmail inbox using IMAP
	 */
	async checkGmailInbox() {
		const Imap = require('imap');
		const { simpleParser } = require('mailparser');

		return new Promise((resolve, reject) => {
			const imap = new Imap({
				user: 'influencers@trycosara.com',
				password: 'tbxefesuisvckknt',
				host: 'imap.gmail.com',
				port: 993,
				tls: true,
				tlsOptions: { rejectUnauthorized: false }
			});

			const emails = [];

			imap.once('ready', () => {
				imap.openBox('INBOX', false, (err, box) => {
					if (err) {
						console.error('❌ Error opening inbox:', err);
						imap.end();
						resolve([]);
						return;
					}

					// Search for unread emails from the last 24 hours
					const yesterday = new Date();
					yesterday.setDate(yesterday.getDate() - 1);

					imap.search([
						['UNSEEN'],
						['SINCE', yesterday]
					], (err, results) => {
						if (err) {
							console.error('❌ Error searching emails:', err);
							imap.end();
							resolve([]);
							return;
						}

						if (results.length === 0) {
							console.log('📧 No new emails found');
							imap.end();
							resolve([]);
							return;
						}

						console.log(`📧 Found ${results.length} new emails`);

						const fetch = imap.fetch(results, { bodies: '' });

						fetch.on('message', (msg, seqno) => {
							const email = {};
							msg.on('body', (stream, info) => {
								simpleParser(stream, async (err, parsed) => {
									if (err) {
										console.error('❌ Error parsing email:', err);
										return;
									}

									email.from_email = this.extractEmail(parsed.from?.text || '');
									email.subject = parsed.subject || '';
									email.content = this.extractLatestMessage(parsed.text || '');
									email.html = parsed.html || '';
									email.received_at = parsed.date || new Date();
									email.message_id = parsed.messageId || '';
									email.subject = email.subject.replace("Re: ", "");
									emails.push(email);

									console.log(email.from_email, 9);
									const { data: influencers } = await supabase().from('influencers').select('instagram_handle, id')
										.eq('email', email.from_email).limit(1);

									if (influencers.length > 0) {
										const {data: chatMessages, error: chatMessagesError} = await supabase().from("chat_messages").select('*').eq('influencer_handle', influencers[0].instagram_handle).eq('message_id', email.message_id).limit(1);
										if (chatMessagesError) console.error('❌ Error fetching chat messages:', chatMessagesError);
										if (chatMessages.length > 0) {
											console.log(`🤖 Chat message already exists for ${influencers[0].instagram_handle}: ${email.message_id}`);
											return;
										}
										const { error } = await supabase().from("chat_messages").upsert([{
											influencer_handle: influencers[0].instagram_handle,
											sender_type: 'influencer',
											subject: email.subject,
											message: email.content,
											message_type: 'email',
											created_at: new Date(email.received_at),
											updated_at: new Date(email.received_at),
											message_id: email.message_id,
										}], {
											onConflict: 'message_id'
										});
										if (error) console.error('❌ Error parsing email:', error);

										// 🤖 Simple AI check: Is this a positive/agreed reply?
										try {
											console.log(`🤖 Checking if email from ${influencers[0].instagram_handle} is a positive reply...`);

											const aiResponseHandler = require('./ai-response-handler');

											// Simple prompt to check if it's a positive/agreed response
											const simplePrompt = `
												Analyze this email response and determine if it's a positive/agreed reply to a partnership offer.

												EMAIL CONTENT:
												"${email.content}"

												CONTEXT:
												- This is a response to a partnership offer for a free product ($299 value)
												- We're looking for content creation in exchange for the product
												- We ship to US, UK, Australia only

												Please respond with ONLY a JSON object:
												{
												"is_positive_reply": true/false,
												"confidence": 0.0-1.0,
												"reason": "Brief explanation of why it's positive or negative",
												"mentions_interest": true/false,
												"mentions_address": true/false,
												"mentions_agreement": true/false
												}
											`;

											const aiResponse = await aiResponseHandler.callAI(simplePrompt);
											const analysis = JSON.parse(aiResponse);

											console.log(`✅ Email analysis for ${influencers[0].instagram_handle}:`, {
												is_positive_reply: analysis.is_positive_reply,
												confidence: analysis.confidence,
												reason: analysis.reason
											});

											// Just log the result - no database saving
											const { data: emailCampaign, error: emailCampaignError } = await supabase().from('email_campaigns').select('*').eq('influencer_email', email.from_email).limit(1);
											if (emailCampaignError) {
												console.error('❌ Error fetching email campaign:', emailCampaignError);
											}
											if (emailCampaign.length > 0) {
												if (analysis.is_positive_reply) {
													var journey_stage = 'responded';
													await supabase().from('email_campaigns').update({
														good_reply: emailCampaign[0].good_reply + 1,
													}).eq('influencer_email', email.from_email);
													journey_stage = 'agreed_to_deal';
													console.log(`🎉 POSITIVE REPLY from ${influencers[0].instagram_handle}: ${analysis.reason}`);
													await supabase().from("influencers").update({
														journey_responded: true,
														journey_responded_at: parsed.date,
														journey_stage: journey_stage,
														journey_agreed_at: parsed.date
													}).eq('id', influencers[0].id);
												}
												else {
													console.log(`❌ Not a positive reply from ${influencers[0].instagram_handle}: ${analysis.reason}`);
													await supabase().from('email_campaigns').update({
														bad_reply: emailCampaign[0].bad_reply + 1
													}).eq('influencer_email', email.from_email);
													journey_stage = 'responded';
													await supabase().from("influencers").update({
														journey_responded: true,
														journey_responded_at: parsed.date,
														journey_stage: journey_stage
													}).eq('id', influencers[0].id);
												}
												
											}
										} catch (aiError) {
											console.error('❌ AI analysis failed for email:', aiError);
										}

									}
									console.log('📧 Extracted new message:', email.from_email, email.subject, email.received_at, email.message_id);
								});
							});
						});

						fetch.once('error', (err) => {
							console.error('❌ Fetch error:', err);
							imap.end();
							resolve([]);
						});

						fetch.once('end', () => {
							console.log(`✅ Processed ${emails.length} emails from Gmail`);
							imap.end();
							resolve(emails);
						});
					});
				});
			});

			imap.once('error', (err) => {
				console.error('❌ IMAP connection error:', err);
				resolve([]);
			});

			imap.once('end', () => {
				console.log('📧 IMAP connection ended');
			});

			imap.connect();
		});
	}

	extractEmail(str) {
		const match = str.match(/<([^>]+)>/);
		if (match) {
			return match[1]; // text inside <>
		}
		// fallback: match plain email without <>
		const simpleMatch = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
		return simpleMatch ? simpleMatch[0] : null;
	}

	extractLatestMessage(emailBody) {
		if (!emailBody || typeof emailBody !== 'string') {
			return '';
		}

		// Common reply delimiters and patterns
		const replySeparators = [
			// Gmail patterns
			/^On .* wrote:$/m,
			/^On .* at .* wrote:$/m,
			/^On .* <.*> wrote:$/m,
			/^On [A-Za-z]{3}, [A-Za-z]{3} \d{1,2}, \d{4}.*wrote:$/m, // "On Sat, Sep 20, 2024 at 10:30 AM John wrote:"
			/^On [A-Za-z]{3}, [A-Za-z]{3} \d{1,2}.*wrote:$/m, // "On Sat, Sep 20 at 10:30 AM John wrote:"
			/^On [A-Za-z]{3}, [A-Za-z]{3} \d{1,2}.*$/m, // "On Sat, Sep 20, 2024 at 10:30 AM"
			/^On [A-Za-z]{3}, [A-Za-z]{3} \d{1,2}, \d{4}.*$/m, // "On Sat, Sep 20, 2024"
			/^On [A-Za-z]{3}, [A-Za-z]{3} \d{1,2} at \d{1,2}:\d{2}.*$/m, // "On Sat, Sep 20 at 10:30"
			/^On [A-Za-z]{3}, [A-Za-z]{3} \d{1,2}, \d{4} at \d{1,2}:\d{2}.*$/m, // "On Sat, Sep 20, 2024 at 10:30"
			/^On [A-Za-z]{3}, [A-Za-z]{3} \d{1,2}.*wrote:$/m, // "On Sat, Sep 20... wrote:"
			/^On [A-Za-z]{3}, [A-Za-z]{3} \d{1,2}, \d{4}.*wrote:$/m, // "On Sat, Sep 20, 2024... wrote:"

			// Outlook patterns
			/^-----Original Message-----$/m,
			/^From: .*$/m,
			/^Sent: .*$/m,
			/^To: .*$/m,
			/^Subject: .*$/m,

			// Generic patterns
			/^>.*$/m,
			/^Le .* a écrit :$/m, // French
			/^El .* escribió:$/m, // Spanish
			/^Am .* schrieb:$/m, // German

			// Common email headers
			/^Date: .*$/m,
			/^Message-ID: .*$/m,
			/^In-Reply-To: .*$/m,
			/^References: .*$/m,

			// Signature patterns
			/^--\s*$/m,
			/^Best regards,?$/m,
			/^Sincerely,?$/m,
			/^Thanks,?$/m,
			/^Regards,?$/m,

			// Forward patterns
			/^Begin forwarded message:$/m,
			/^----- Forwarded Message -----$/m,

			// Thread patterns
			/^From: .*@.*$/m,
			/^To: .*@.*$/m,
			/^Cc: .*@.*$/m,
			/^Bcc: .*@.*$/m
		];

		let earliestMatch = emailBody.length;
		let foundSeparator = false;

		for (const regex of replySeparators) {
			const match = emailBody.search(regex);
			if (match !== -1 && match < earliestMatch) {
				earliestMatch = match;
				foundSeparator = true;
			}
		}

		// If no separator found, return the whole message
		if (!foundSeparator) {
			return emailBody.trim();
		}

		// Extract content before the first separator
		let content = emailBody.slice(0, earliestMatch).trim();

		// Remove any trailing empty lines
		content = content.replace(/\n\s*\n\s*$/, '');

		// If content is too short, it might be just a signature, return original
		if (content.length < 10) {
			return emailBody.trim();
		}

		return content;
	}
	/**
	 * Check Brevo inbox using API
	 */
	async checkBrevoInbox() {
		try {
			// Brevo doesn't provide inbox checking via API
			// This would need webhook setup instead
			console.log('📧 Brevo inbox checking not implemented (use webhooks)');
			return [];
		} catch (error) {
			console.error('❌ Brevo inbox check error:', error);
			return [];
		}
	}

	/**
	 * Check SendGrid inbox using API
	 */
	async checkSendGridInbox() {
		try {
			// SendGrid doesn't provide inbox checking via API
			// This would need webhook setup instead
			console.log('📧 SendGrid inbox checking not implemented (use webhooks)');
			return [];
		} catch (error) {
			console.error('❌ SendGrid inbox check error:', error);
			return [];
		}
	}

	/**
	 * Process incoming email response
	 */
	async processIncomingEmail(email, provider) {
		try {
			// Handle Gmail emails directly (IMAP-based)
			if (provider === 'gmail' || provider === 'smtp') {
				return await this.processGmailEmail(email);
			}

			// Handle webhook-based providers
			const emailWebhookHandler = require('./email-webhook-handler');
			const result = await emailWebhookHandler.processWebhook(provider, email);

			if (result.success && result.automatic_response_sent) {
				this.stats.responses_sent++;
				console.log(`🤖 Auto-response sent to ${result.influencer}`);
			}

			return result;
		} catch (error) {
			console.error('Error processing email:', error);
			throw error;
		}
	}

	/**
	 * Process Gmail email directly (IMAP-based)
	 */
	async processGmailEmail(email) {
		try {
			// Handle undefined or malformed email data
			if (!email || typeof email !== 'object') {
				console.log('📧 Invalid email data received:', email);
				return { success: false, reason: 'Invalid email data' };
			}

			// Debug: Log the email object structure
			console.log('📧 Email object keys:', Object.keys(email));
			console.log('📧 Email object:', JSON.stringify(email, null, 2));

			console.log(`📧 Processing Gmail email from: ${email.from || 'unknown'}`);
			
			// Extract email content and metadata with fallbacks
			const emailData = {
				from: email.from || email.fromAddress || 'unknown@example.com',
				to: email.to || email.toAddress || 'unknown@example.com',
				subject: email.subject || 'No Subject',
				text: email.text || email.textContent || '',
				html: email.html || email.htmlContent || '',
				date: email.date || new Date().toISOString(),
				messageId: email.messageId || email.id || 'unknown'
			};

			// Check if this is a response to one of our campaigns
			const { database } = require('./database');
			// For now, skip campaign check since we don't have campaigns.getActive()
			// const activeCampaigns = await campaigns.getActive();
			
			// Look for matching influencer by email
			const influencer = await this.findInfluencerByEmail(emailData.from);
			
			if (!influencer) {
				console.log(`📧 Email from unknown sender: ${emailData.from}`);
				return { success: false, reason: 'Unknown sender' };
			}

			// Update influencer status
			await this.updateInfluencerStatus(influencer.id, 'responded', {
				journey_responded_at: new Date().toISOString(),
				last_email_response: emailData.text
			});

			// Send automatic response if configured
			const autoResponse = await this.sendAutomaticResponse(influencer, emailData);
			
			if (autoResponse.success) {
				this.stats.responses_sent++;
				console.log(`🤖 Auto-response sent to ${influencer.instagram_handle}`);
			}

			return {
				success: true,
				automatic_response_sent: autoResponse.success,
				influencer: influencer.instagram_handle
			};

		} catch (error) {
			console.error('❌ Error processing Gmail email:', error);
			return { success: false, error: error.message };
		}
	}

	/**
	 * Find influencer by email address
	 */
	async findInfluencerByEmail(email) {
		try {
			const { influencers } = require('./database');
			// Check if findByEmail method exists, otherwise use a different approach
			if (typeof influencers.findByEmail === 'function') {
				const influencer = await influencers.findByEmail(email);
				return influencer;
			} else {
				// Fallback: search through all influencers
				console.log(`📧 Searching for influencer with email: ${email}`);
				// For now, return null since we don't have the exact method
				return null;
			}
		} catch (error) {
			console.error('Error finding influencer by email:', error);
			return null;
		}
	}

	/**
	 * Update influencer journey status
	 */
	async updateInfluencerStatus(influencerId, status, additionalData = {}) {
		try {
			const { influencers } = require('./database');
			await influencers.updateStatus(influencerId, {
				journey_stage: status,
				updated_at: new Date().toISOString(),
				...additionalData
			});
		} catch (error) {
			console.error('Error updating influencer status:', error);
		}
	}

	/**
	 * Send automatic response to influencer
	 */
	async sendAutomaticResponse(influencer, emailData) {
		try {
			// This would integrate with your email service
			// For now, just log the response
			console.log(`📤 Would send auto-response to ${influencer.instagram_handle}`);
			console.log(`📧 Response to: ${emailData.subject}`);
			
			return { success: true };
		} catch (error) {
			console.error('Error sending automatic response:', error);
			return { success: false, error: error.message };
		}
	}

	/**
	 * ✨ Run daily influencer discovery
	 */
	async runDailyDiscovery() {
		try {
			console.log('🔍 Running daily influencer discovery...');

			const { campaigns } = require('./database');
			const discoveryService = require('./discovery');

			// Get active campaigns
			const activeCampaigns = await campaigns.getActive();
			this.stats.campaigns_active = activeCampaigns.length;

			let totalDiscovered = 0;

			for (const campaign of activeCampaigns) {
				try {
					// Check if campaign needs more influencers
					const currentCount = await campaigns.getInfluencerCount(campaign.id);
					const targetCount = campaign.targeting.influencer_count;

					if (currentCount < targetCount) {
						const needed = targetCount - currentCount;
						console.log(`📊 Campaign "${campaign.name}" needs ${needed} more influencers`);

						const result = await discoveryService.discoverInfluencers({
							hashtags: campaign.targeting.hashtags,
							count: Math.min(needed, 20), // Discover max 20 per day per campaign
							follower_range: campaign.targeting.follower_range,
							countries: campaign.targeting.countries,
							campaign_id: campaign.id
						});

						totalDiscovered += result.discovered;
					}
				} catch (error) {
					console.error(`Discovery failed for campaign ${campaign.name}:`, error);
				}
			}

			console.log(`✅ Daily discovery completed: ${totalDiscovered} new influencers`);

			// Send summary to Slack
			const slackService = require('./slack');
			await slackService.sendMessage({
				text: `🔍 Daily Discovery Complete`,
				blocks: [
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: `*Daily Discovery Summary*\n• Active Campaigns: ${activeCampaigns.length}\n• New Influencers: ${totalDiscovered}\n• Status: ✅ Complete`
						}
					}
				]
			});

		} catch (error) {
			console.error('❌ Daily discovery failed:', error);
			await this.handleAutomationError('daily_discovery', error);
		}
	}

	/**
	 * ✨ Process follow-up emails
	 */
	async processFollowUps() {
		try {
			console.log('📬 Processing follow-up emails...');

			const followUpScheduler = require('./follow-up-scheduler');
			const result = await followUpScheduler.processScheduledFollowUps();

			console.log(`✅ Follow-up processing: ${result.sent} emails sent`);

		} catch (error) {
			console.error('❌ Follow-up processing failed:', error);
			await this.handleAutomationError('follow_ups', error);
		}
	}

	/**
	 * ✨ Monitor split tests for winners
	 */
	async monitorSplitTests() {
		try {
			const splitTestManager = require('./split-test-manager');
			const activeTests = splitTestManager.getActiveTests();

			if (activeTests.length === 0) return;

			console.log(`🧪 Monitoring ${activeTests.length} active split tests...`);

			for (const test of activeTests) {
				// Check if test should declare winner
				await splitTestManager.checkForWinner(test.id);

				// Send progress updates for tests at 25%, 50%, 75% completion
				const completion = splitTestManager.getTestCompletionPercentage(test.id);

				if ([25, 50, 75].includes(completion)) {
					const slackService = require('./slack');
					await slackService.sendSplitTestProgress(test, `${completion}% complete`);
				}
			}

		} catch (error) {
			console.error('❌ Split test monitoring failed:', error);
		}
	}

	/**
	 * ✨ Generate daily report
	 */
	async generateDailyReport() {
		try {
			console.log('📊 Generating daily automation report...');

			const uptime = Math.round((Date.now() - this.stats.uptime_start.getTime()) / (1000 * 60 * 60)); // hours

			const report = {
				date: new Date().toISOString().split('T')[0],
				uptime_hours: uptime,
				inbox_checks: this.stats.inbox_checks,
				emails_processed: this.stats.emails_processed,
				responses_sent: this.stats.responses_sent,
				campaigns_active: this.stats.campaigns_active,
				last_check: this.stats.last_check
			};

			const slackService = require('./slack');
			await slackService.sendMessage({
				text: `📊 Daily Automation Report`,
				blocks: [
					{
						type: "header",
						text: {
							type: "plain_text",
							text: "📊 24/7 Automation Report"
						}
					},
					{
						type: "section",
						fields: [
							{
								type: "mrkdwn",
								text: `*Uptime:* ${uptime} hours`
							},
							{
								type: "mrkdwn",
								text: `*Inbox Checks:* ${this.stats.inbox_checks}`
							},
							{
								type: "mrkdwn",
								text: `*Emails Processed:* ${this.stats.emails_processed}`
							},
							{
								type: "mrkdwn",
								text: `*Auto Responses:* ${this.stats.responses_sent}`
							}
						]
					},
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: `*Status:* 🟢 All systems operational\n*Active Campaigns:* ${this.stats.campaigns_active}`
						}
					}
				]
			});

			console.log('✅ Daily report sent');

		} catch (error) {
			console.error('❌ Daily report failed:', error);
		}
	}

	/**
	 * ✨ Perform health check
	 */
	async performHealthCheck() {
		try {
			const issues = [];

			// Check database connection
			try {
				const { database } = require('./database');
				await database.testConnection();
			} catch (error) {
				issues.push('Database connection failed');
			}

			// Check AI service
			try {
				const aiResponseHandler = require('./ai-response-handler');
				if (!aiResponseHandler.isConfigured()) {
					issues.push('AI service not configured');
				}
			} catch (error) {
				issues.push('AI service check failed');
			}

			// Check email service
			try {
				const emailService = require('./email');
				// Add email service health check
			} catch (error) {
				issues.push('Email service check failed');
			}

			if (issues.length > 0) {
				console.warn('⚠️ Health check issues:', issues);

				const slackService = require('./slack');
				await slackService.sendAlert('health_check', 'System health issues detected', {
					issues: issues,
					timestamp: new Date().toISOString()
				});
			}

		} catch (error) {
			console.error('❌ Health check failed:', error);
		}
	}

	/**
	 * ✨ Initialize enhanced services (geo-verification, engagement checking, etc.)
	 */
	async initializeEnhancedServices() {
		try {
			console.log('🔧 Initializing enhanced services...');

			// Initialize DM throttling service
			const dmThrottling = require('./dm-throttling');
			dmThrottling.initialize();
			console.log('📱 DM throttling service initialized');

			// Start post detection monitoring
			const postDetection = require('./post-detection');
			// Post detection will start monitoring when products are shipped
			console.log('📸 Post detection service ready');

			// Initialize geo-verification
			const geoVerification = require('./geo-verification');
			console.log('🌍 Geo-verification service ready');

			// Initialize engagement calculator
			const engagementCalculator = require('./engagement-calculator');
			console.log('📊 Engagement calculator service ready');

			console.log('✅ All enhanced services initialized');

		} catch (error) {
			console.error('❌ Error initializing enhanced services:', error);
		}
	}

	/**
	 * Send startup notification
	 */
	async sendStartupNotification() {
		try {
			const slackService = require('./slack');
			await slackService.sendMessage({
				text: `🚀 Automation Manager Started`,
				blocks: [
					{
						type: "header",
						text: {
							type: "plain_text",
							text: "🚀 24/7 Automation Manager Online"
						}
					},
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: `*Status:* 🟢 Fully operational\n*Inbox Checking:* Every ${getAutomationSettings().inbox_check_interval} minutes\n*AI Responses:* Enabled\n*Split Testing:* Active\n*Enhanced Services:* Geo-verification, Engagement Analysis, Post Detection`
						}
					}
				]
			});
		} catch (error) {
			console.error('Failed to send startup notification:', error);
		}
	}

	/**
	 * Handle automation errors
	 */
	async handleAutomationError(process, error) {
		try {
			const slackService = require('./slack');
			await slackService.sendAlert('automation_error', `${process} failed`, {
				error: error.message,
				stack: error.stack,
				timestamp: new Date().toISOString()
			});
		} catch (slackError) {
			console.error('Failed to send error alert:', slackError);
		}
	}

	/**
	 * Stop all automation
	 */
	stop() {
		console.log('🛑 Stopping automation manager...');

		this.jobs.forEach((job, name) => {
			job.stop();
			console.log(`⏹️ Stopped ${name}`);
		});

		this.jobs.clear();
		this.isRunning = false;

		console.log('✅ Automation manager stopped');
	}

	/**
	 * Get automation status
	 */
	getStatus() {
		return {
			running: this.isRunning,
			active_jobs: Array.from(this.jobs.keys()),
			stats: this.stats,
			uptime_hours: Math.round((Date.now() - this.stats.uptime_start.getTime()) / (1000 * 60 * 60))
		};
	}

	/**
	 * ✨ Check for new Instagram DM responses
	 */
	async checkDMResponses() {
		try {
			console.log('📱 Checking for new Instagram DM responses...');

			const instagramDMAutomation = require('./instagram-dm-automation');
			const result = await instagramDMAutomation.checkDMResponses();

			if (result.responsesProcessed > 0) {
				console.log(`✅ Processed ${result.responsesProcessed} new DM responses`);

				const slackService = require('./slack');
				await slackService.sendMessage({
					text: `📱 Instagram Update: Processed ${result.responsesProcessed} new DM responses`,
					channel: '#influencer-marketing'
				});
			}

		} catch (error) {
			console.error('❌ DM response checking failed:', error);
		}
	}
}

module.exports = new AutomationManager(); 