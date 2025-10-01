/**
 * 📱 Instagram DM Templates and Variants
 * For A/B testing different DM approaches with personalization
 */

const instagramDMVariants = {
  // =====================================
  // 📤 INITIAL OUTREACH DM VARIANTS
  // =====================================
  initial_dm_variants: {
    variant_a_brand_focused: {
      id: 'dm_brand_focused',
      name: 'Brand Ambassador Focused',
      message: `Hey {{first_name}}! 👋

We think you're a great fit for our brand Dermao which is launching a new premium IPL hair laser next month! 

We'd love to send you our newly developed product for free in exchange for a post and the potential to become a brand ambassador if the content is up to par with our expectations.

Would you be interested in this partnership? 💜✨`,
      category: 'brand_ambassador',
      tone: 'professional',
      cta: 'partnership_interest'
    },

    variant_b_compliment_first: {
      id: 'dm_compliment_first', 
      name: 'Compliment-First Approach',
      message: `Hi {{first_name}}! 💜

Just came across your content and absolutely love your aesthetic! Your posts are stunning ✨

I'm reaching out from Dermao - we're launching a premium IPL hair laser next month and think you'd be perfect to showcase it. 

We'd love to send you the device (worth $299) for free in exchange for authentic content about your experience. Interested in becoming a brand partner? 🤍`,
      category: 'compliment_based',
      tone: 'friendly',
      cta: 'brand_partnership'
    },

    variant_c_story_reply: {
      id: 'dm_story_reply',
      name: 'Story Reply Style',
      message: `Hey {{first_name}}! 

Loved your recent story! 💫 

Quick question - have you ever tried IPL hair removal? We're Dermao and we're about to launch our new premium device next month.

We think you'd be an amazing fit to try it out and share your honest experience with your followers. The device is worth $299 but we'd send it completely free!

Would you be up for a potential brand collaboration? 🌟`,
      category: 'story_engagement',
      tone: 'casual',
      cta: 'collaboration_interest'
    },

    variant_d_value_proposition: {
      id: 'dm_value_focused',
      name: 'Value Proposition Focus',
      message: `Hi {{first_name}}! 👋

Hope you're doing amazing! I'm reaching out from Dermao about an exciting opportunity.

We're launching our new premium IPL hair laser device next month (retail value $299) and we think you'd be the perfect person to showcase the results! 

We'd love to send you the device completely free in exchange for one authentic post about your experience. Plus, if the content aligns with our brand standards, there's potential for an ongoing brand ambassador role.

Interested in learning more? 💜`,
      category: 'value_focused',
      tone: 'professional',
      cta: 'learn_more'
    }
  },

  // =====================================
  // 🤝 FOLLOW-UP DM VARIANTS
  // =====================================
  follow_up_dm_variants: {
    variant_gentle_follow_up: {
      id: 'dm_gentle_follow_up',
      name: 'Gentle Follow-up',
      message: `Hey {{first_name}}! 👋

Just wanted to follow up on my previous message about the Dermao IPL collaboration.

No pressure at all - I know you probably get tons of messages! But if you're interested in trying our premium hair laser device for free, I'd love to chat more about the details.

Let me know if this sounds like something you'd be into! 💜`,
      category: 'gentle_reminder',
      tone: 'friendly'
    },

    variant_urgency_follow_up: {
      id: 'dm_urgency_follow_up', 
      name: 'Urgency Follow-up',
      message: `Hi {{first_name}}! ✨

Hope you're having a great week! I wanted to reach out once more about the Dermao collaboration opportunity.

We're selecting our launch partners this week for our new IPL device, and I think you'd be perfect for our brand ambassador program.

Would you be interested in learning more about this opportunity? Happy to answer any questions! 💫`,
      category: 'urgency_based',
      tone: 'professional'
    }
  },

  // =====================================
  // 💬 RESPONSE DM VARIANTS  
  // =====================================
  response_dm_variants: {
    variant_a_excited: {
      id: 'dm_excited_response',
      name: 'Excited Response',
      message: `Amazing! So excited to work with you! 🎉

Here's what happens next:
• I'll need your shipping address and phone number
• We'll send you the Dermao IPL device (worth $299) for free
• Once you receive it, test it out for 2-3 weeks
• Create one authentic post about your experience
• Tag @dermao.official and use #DermaoPartner

The results are incredible - you're going to love it! Can you send me your shipping details? 📦💜`,
      category: 'positive_response',
      tone: 'enthusiastic'
    },

    variant_b_professional: {
      id: 'dm_professional_response',
      name: 'Professional Response', 
      message: `Wonderful! I'm thrilled you're interested in partnering with Dermao! ✨

To get your IPL device shipped out, I'll need:
📍 Full shipping address 
📱 Phone number for delivery

Once you receive the device:
• Test it for 2-3 weeks to see the amazing results
• Create authentic content about your experience  
• Tag @dermao.official and use #DermaoPartner
• If the content meets our standards, potential for ongoing collaboration

Sound good? Send over those shipping details when you're ready! 💜`,
      category: 'positive_response',
      tone: 'professional'
    }
  },

  // =====================================
  // 🤝 NEGOTIATION DM VARIANTS
  // =====================================
  negotiation_dm_variants: {
    variant_shipping_cost: {
      id: 'dm_shipping_response',
      name: 'Shipping Cost Response',
      message: `No worries about shipping! We cover all shipping costs - the device comes completely free to you including delivery! 📦

The Dermao IPL is worth $299 retail and we handle everything. You just need to:
• Provide shipping address
• Test the device for 2-3 weeks  
• Share one authentic post about your results

That's it! No hidden costs or fees. Sound good? 💜`,
      category: 'shipping_clarification',
      tone: 'reassuring'
    },

    variant_timing: {
      id: 'dm_timing_response',
      name: 'Timing Flexibility',
      message: `Totally understand! No rush at all ⏰

We're flexible with timing - you can post whenever feels natural for you after testing the device. Most people see amazing results within 2-3 weeks, but take all the time you need!

The important thing is authentic content about your real experience. When would work best for you to receive the device? 💜`,
      category: 'timing_flexibility',
      tone: 'understanding'
    },

    variant_payment_request: {
      id: 'dm_payment_clarification',
      name: 'Payment Clarification',
      message: `Just to clarify - this is a gifted collaboration! 🎁

You receive the Dermao IPL device (worth $299) completely free - no payment required from you. We're looking for authentic content in exchange for the free product.

If your content aligns with our brand standards, there could be opportunities for paid partnerships in the future!

Still interested? 💜✨`,
      category: 'payment_clarification', 
      tone: 'clarifying'
    }
  }
};

// =====================================
// 🛠️ HELPER FUNCTIONS
// =====================================
const dmHelpers = {
  /**
   * Personalize DM with influencer data
   */
  personalizeDM: (template, influencerData) => {
    let personalizedMessage = template.message;
    
    // Replace placeholders
    personalizedMessage = personalizedMessage.replace(/\{\{first_name\}\}/g, influencerData.first_name || 'there');
    personalizedMessage = personalizedMessage.replace(/\{\{instagram_handle\}\}/g, influencerData.instagram_handle || '');
    personalizedMessage = personalizedMessage.replace(/\{\{follower_count\}\}/g, influencerData.follower_count || '');
    personalizedMessage = personalizedMessage.replace(/\{\{recent_post_type\}\}/g, influencerData.recent_post_type || 'content');
    
    return personalizedMessage;
  },

  /**
   * Validate DM before sending
   */
  validateDM: (message, influencer) => {
    const validation = {
      isValid: true,
      issues: [],
      recommendations: []
    };

    // Check message length (Instagram DM limit is ~1000 characters)
    if (message.length > 900) {
      validation.isValid = false;
      validation.issues.push('Message too long');
      validation.recommendations.push('Shorten message to under 900 characters');
    }

    // Check for personalization
    if (!message.includes(influencer.first_name) && !message.includes('there')) {
      validation.recommendations.push('Consider adding personalization');
    }

    // Check for emojis (good for engagement)
    if (!/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(message)) {
      validation.recommendations.push('Consider adding emojis for better engagement');
    }

    return validation;
  },

  /**
   * Get random variant for split testing
   */
  getRandomVariant: (variantGroup) => {
    const variants = Object.values(variantGroup);
    return variants[Math.floor(Math.random() * variants.length)];
  },

  /**
   * Analyze DM performance metrics
   */
  analyzeDMPerformance: (variant, responses, conversions) => {
    return {
      variant_id: variant.id,
      variant_name: variant.name,
      response_rate: responses > 0 ? (responses / conversions * 100).toFixed(2) : 0,
      category: variant.category,
      tone: variant.tone,
      cta: variant.cta
    };
  }
};

// =====================================
// 🧪 SPLIT TEST CONFIGURATIONS
// =====================================
const instagramSplitTestConfigs = {
  dermao_launch_campaign: {
    name: 'Dermao IPL Launch - Instagram DM Test',
    variants: [
      'dm_brand_focused',
      'dm_compliment_first', 
      'dm_story_reply',
      'dm_value_focused'
    ],
    traffic_split: [25, 25, 25, 25], // Equal distribution
    success_metrics: ['response_rate', 'positive_sentiment', 'shipping_info_provided'],
    minimum_sample_size: 20,
    confidence_level: 0.95
  },

  follow_up_optimization: {
    name: 'Follow-up Message Optimization',
    variants: [
      'dm_gentle_follow_up',
      'dm_urgency_follow_up'
    ],
    traffic_split: [50, 50],
    success_metrics: ['response_rate', 'conversion_rate'],
    minimum_sample_size: 10,
    confidence_level: 0.90
  },

  // Unified contact tests (email-first, DM fallback)
  unified_opener_test: {
    name: 'Unified Contact Opener Test',
    description: 'Testing unified contact approach (email-first, DM fallback)',
    type: 'unified_opener',
    target_count: 100,
    variants: [
      instagramDMVariants.initial_dm_variants.variant_a_brand_focused,
      instagramDMVariants.initial_dm_variants.variant_b_compliment_first,
      instagramDMVariants.initial_dm_variants.variant_c_story_reply
    ],
    success_metrics: ['response_rate', 'positive_sentiment_rate', 'conversion_to_shipping']
  },

  unified_follow_up_test: {
    name: 'Unified Follow-up Test',
    description: 'Testing unified follow-up approach (email-first, DM fallback)',
    type: 'unified_follow_up',
    target_count: 100,
    variants: [
      instagramDMVariants.follow_up_dm_variants.variant_gentle_follow_up,
      instagramDMVariants.follow_up_dm_variants.variant_urgency_follow_up
    ],
    success_metrics: ['response_rate', 'positive_sentiment_rate']
  },

  unified_response_test: {
    name: 'Unified Response Test',
    description: 'Testing unified response handling (email-first, DM fallback)',
    type: 'unified_response',
    target_count: 100,
    variants: [
      instagramDMVariants.initial_dm_variants.variant_a_brand_focused,
      instagramDMVariants.initial_dm_variants.variant_b_compliment_first
    ],
    success_metrics: ['address_provided_rate', 'consent_given_rate', 'time_to_conversion']
  }
};

module.exports = {
  instagramDMVariants,
  dmHelpers,
  instagramSplitTestConfigs
}; 