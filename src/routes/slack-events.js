const express = require('express');
const router = express.Router();
const slackService = require('../services/slack');
const { influencers } = require('../services/database');

// Helper: get influencer by handle (case-insensitive)
async function getByHandle(instagram_handle) {
  if (!instagram_handle) return null;
  const all = await influencers.getAll();
  return all.find(
    inf =>
      inf.instagram_handle &&
      inf.instagram_handle.replace('@', '').toLowerCase() === instagram_handle.replace('@', '').toLowerCase()
  );
}

router.post('/slack/events', async (req, res) => {
  // Slack URL verification challenge
  if (req.body.type === 'url_verification') {
    return res.send({ challenge: req.body.challenge });
  }

  // Only handle message events
  const event = req.body.event;
  if (event && event.type === 'message' && event.text && event.channel) {
    // Check if message is from Archive.com (simple keyword check)
    if (event.text.includes('Powered by archive.com')) {
      // Extract influencer handle (e.g. @idermato) and post link
      const handleMatch = event.text.match(/@([a-zA-Z0-9_]+)/);
      const linkMatch = event.text.match(/https?:\/\/[\S]+/);

      if (handleMatch) {
        const instagram_handle = handleMatch[1];
        const post_url = linkMatch ? linkMatch[0] : null;

        // Update CRM/database
        try {
          // Find influencer by handle and update status
          const influencer = await influencers.getByHandleInsensitive(instagram_handle);
          if (influencer) {
            await influencers.update(influencer.id, {
              status: 'content_posted',
              latest_post: { url: post_url, timestamp: new Date() }
            });

            // Send confirmation message in channel
            await slackService.sendMessageToChannel({
              text: `✅ CRM updated: @${instagram_handle} marked as posted for <${post_url || 'the new post'}>.`
            }, event.channel);
          } else {
            await slackService.sendMessageToChannel({
              text: `⚠️ CRM update failed: Could not find influencer @${instagram_handle} in database.`
            }, event.channel);
          }
        } catch (err) {
          await slackService.sendMessageToChannel({
            text: `❌ CRM update error for @${instagram_handle}: ${err.message}`
          }, event.channel);
        }
      }
    }
  }

  res.sendStatus(200);
});

module.exports = router; 