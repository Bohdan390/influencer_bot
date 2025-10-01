const express = require('express');
const router = express.Router();
const emailWebhookHandler = require('../services/email-webhook-handler');
const { emails } = require('../services/database');
const {supabase} = require('../services/supabase');

// Email response webhooks (inbound) - AI-powered
router.post('/brevo/inbound', async (req, res) => {
  console.log("Brevo webhook payload:", req.body);
  const {email} = req.body
  const {error} = await supabase().from('email_campaigns').update({
    message_id: req.body['message-id'] || null
  }).eq('influencer_email', email);

  if (error) {
    console.error('❌ Error updating email campaign:', error);
  }
  res.status(200).send("Webhook received");
});

router.post('/sendgrid/inbound', async (req, res) => {
  try {
    console.log('📧 SendGrid inbound email webhook received');
    const result = await emailWebhookHandler.processWebhook('sendgrid', req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('SendGrid inbound webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/mailgun/inbound', async (req, res) => {
  try {
    console.log('📧 Mailgun inbound email webhook received');
    const result = await emailWebhookHandler.processWebhook('mailgun', req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Mailgun inbound webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Email tracking webhooks (outbound)
router.post('/email/opened', async (req, res) => {
  try {
    console.log('👀 Email opened webhook received');
    await updateEmailStatus(req.body, 'opened');
    res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('Email opened webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/email/clicked', async (req, res) => {
  try {
    console.log('🖱️ Email clicked webhook received');
    await updateEmailStatus(req.body, 'clicked');
    res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('Email clicked webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/email/bounced', async (req, res) => {
  try {
    console.log('❌ Email bounced webhook received');
    await updateEmailStatus(req.body, 'bounced');
    res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('Email bounced webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test AI response processing
router.post('/test/ai-response', async (req, res) => {
  try {
    console.log('🧪 Testing AI response processing');
    const result = await emailWebhookHandler.testWebhookProcessing(req.body.provider || 'brevo');
    res.json(result);
  } catch (error) {
    console.error('AI response test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Shopify webhooks
router.post('/shopify/order/fulfilled', async (req, res) => {
  try {
    console.log('📦 Shopify order fulfilled webhook received');
    // TODO: Update order status and trigger follow-up email
    res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('Shopify webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to update email status
async function updateEmailStatus(data, status) {
  try {
    const emailId = data.email_id || data.message_id || data.id;
    
    if (emailId && emails.updateStatus) {
      await emails.updateStatus(emailId, status, {
        timestamp: new Date(),
        webhook_data: data
      });
      console.log(`✅ Updated email ${emailId} status to ${status}`);
    }
  } catch (error) {
    console.error('Failed to update email status:', error);
  }
}

module.exports = router; 