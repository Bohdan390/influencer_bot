// ✨ Email Template Variants for Split Testing
// Different openers, conversation flows, and approaches

const emailVariants = {
  // 🎯 INITIAL OUTREACH VARIANTS (A/B Testing Different Openers)
  initial_outreach_variants: {
    
    // VARIANT A: Current approach - Brand Ambassador Test
    variant_a_brand_ambassador: {
      id: 'var_initial_a',
      name: 'Brand Ambassador Test (Current)',
      description: 'Frames as test opportunity with performance-based future',
      subject: 'Brand Ambassador Opportunity with Cosara',
      html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I'm reaching out on behalf of <strong>Cosara</strong> — a revolutionary beauty tech brand that's changing how people approach hair removal.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I came across your profile and was immediately drawn to your authentic content and engaged community. Your aesthetic and voice align perfectly with our brand values.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          🎯 <strong>Brand Ambassador Test:</strong> We're giving away one <strong>free IPL Hair Laser</strong> (retail value $299) in exchange for one authentic post about your experience.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          💡 <strong>If your content performs well</strong> and resonates with your audience, we'd love to discuss a long-term brand partnership with fixed payments + performance bonuses.
        </p>
        
        <p style="margin: 0 0 24px 0; line-height: 1.5;">
          Are you interested in this brand ambassador test? I'd love to share more details!
        </p>
        
        <p style="margin: 0 0 8px 0; line-height: 1.5;">Best regards,</p>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">The Cosara Partnership Team</p>
      </td></tr>
    </table>
  </body>
</html>`
    },

    // VARIANT B: Direct Gift Approach - No strings attached initially
    variant_b_gift_first: {
      id: 'var_initial_b',
      name: 'Gift-First Approach',
      description: 'Emphasizes free gift with softer content request',
      subject: 'Free IPL Hair Laser for {{first_name}} 🎁',
      html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hey {{first_name}}!</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I absolutely love your content on Instagram! Your style and authenticity really caught my attention.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I work with <strong>Cosara</strong>, and we'd love to send you our IPL Hair Laser device as a gift — no strings attached! It's worth $299 and we think you'd genuinely love the results.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          🎁 <strong>What's the catch?</strong> Honestly, there isn't one! We're confident in our product and would just love for you to try it.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          If you end up loving it and want to share your experience with your followers, that would be amazing — but there's absolutely no pressure.
        </p>
        
        <p style="margin: 0 0 24px 0; line-height: 1.5;">
          Interested in a free IPL laser? Just reply with your shipping address!
        </p>
        
        <p style="margin: 0 0 8px 0; line-height: 1.5;">Excited to connect!</p>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Sarah from Cosara ✨</p>
      </td></tr>
    </table>
  </body>
</html>`
    },

    // VARIANT C: Social Proof Approach - Focus on other creators
    variant_c_social_proof: {
      id: 'var_initial_c',
      name: 'Social Proof Focus',
      description: 'Emphasizes other successful creators and results',
      subject: 'Join our creator community ({{follower_count}} followers)',
      html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I've been following your content and you have exactly the authentic voice we're looking for at <strong>Cosara</strong>.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          We're working with 50+ creators right now who are loving our IPL Hair Laser technology. The results and content they're creating have been incredible — check out @cosara.official to see!
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <strong>What's working for our creators:</strong>
        </p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">Average 25% higher engagement on IPL content</li>
          <li style="margin-bottom: 8px;">Genuine results that followers actually want to see</li>
          <li style="margin-bottom: 8px;">Long-term partnerships for top performers</li>
        </ul>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          We'd love to send you a free device (worth $299) to try and potentially join our creator community.
        </p>
        
        <p style="margin: 0 0 24px 0; line-height: 1.5;">
          Want to see what all the buzz is about?
        </p>
        
        <p style="margin: 0 0 8px 0; line-height: 1.5;">Best,</p>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Cosara Creator Team</p>
      </td></tr>
    </table>
  </body>
</html>`
    },

    // VARIANT D: Problem-Solution Approach - Focus on hair removal pain
    variant_d_problem_solution: {
      id: 'var_initial_d',
      name: 'Problem-Solution Focus',
      description: 'Addresses hair removal frustrations first',
      subject: 'Tired of constant shaving? 🪒',
      html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hey {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Quick question — are you as tired of the constant shave-grow-repeat cycle as I was?
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I used to spend SO much time and money on:
        </p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">🪒 Razors and shaving cream (expensive!)</li>
          <li style="margin-bottom: 8px;">⏰ Daily shaving routines (time-consuming!)</li>
          <li style="margin-bottom: 8px;">😣 Razor burn and ingrown hairs (painful!)</li>
          <li style="margin-bottom: 8px;">💸 Salon laser sessions (SO expensive!)</li>
        </ul>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          That's exactly why I'm obsessed with <strong>Cosara's IPL technology</strong>. It's changed everything for me and thousands of others.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I love your content and think you'd have an amazing experience with IPL. Would you be interested in trying our device? We'd love to send you one free (worth $299) — no catch.
        </p>
        
        <p style="margin: 0 0 24px 0; line-height: 1.5;">
          Ready to ditch the razor for good?
        </p>
        
        <p style="margin: 0 0 8px 0; line-height: 1.5;">Talk soon,</p>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Emma from Cosara 💜</p>
      </td></tr>
    </table>
  </body>
</html>`
    }
  },

  // 🔄 FOLLOW-UP VARIANTS (For non-responders)
  follow_up_variants: {
    
    // VARIANT A: Gentle reminder with social proof
    variant_a_gentle_social: {
      id: 'var_followup_a',
      name: 'Gentle + Social Proof',
      subject: 'Quick follow-up (other creators loving this!)',
      html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I reached out last week about our IPL collaboration and wanted to share a quick update!
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          We've had amazing creators like @beautyby_sarah and @glowwith_emma joining our program this week, and their content has been performing incredibly well.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I'd still love to send you a free IPL device if you're interested. No pressure at all — just thought your audience would love seeing real results!
        </p>
        
        <p style="margin: 0 0 24px 0; line-height: 1.5;">
          Let me know if you'd like to learn more!
        </p>
        
        <p style="margin: 0 0 8px 0; line-height: 1.5;">Best,</p>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Cosara Team</p>
      </td></tr>
    </table>
  </body>
</html>`
    },

    // VARIANT B: Urgency/scarcity approach
    variant_b_urgency: {
      id: 'var_followup_b',
      name: 'Urgency/Limited Spots',
      subject: 'Only 5 spots left this month',
      html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hey {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I wanted to give you a heads up — we only have 5 spots left in our creator program for this month!
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I reached out because your content style is exactly what we're looking for, and I'd hate for you to miss out on this opportunity.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <strong>Quick reminder of what's included:</strong>
        </p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">Free IPL Hair Laser (worth $299)</li>
          <li style="margin-bottom: 8px;">Potential long-term partnership</li>
          <li style="margin-bottom: 8px;">Performance bonuses for great content</li>
        </ul>
        
        <p style="margin: 0 0 24px 0; line-height: 1.5;">
          Interested? Just reply with "YES" and I'll secure your spot!
        </p>
        
        <p style="margin: 0 0 8px 0; line-height: 1.5;">Best,</p>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Cosara Team</p>
      </td></tr>
    </table>
  </body>
</html>`
    }
  },

  // 💬 RESPONSE VARIANTS (Different ways to ask for address/consent)
  response_variants: {
    
    // VARIANT A: Enthusiastic/personal approach
    variant_a_enthusiastic: {
      id: 'var_response_a',
      name: 'Enthusiastic Personal',
      subject: 'SO excited to send your IPL! ✨',
      html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">{{first_name}}, yay!! 🎉</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I'm SO excited that you're interested! Your content is absolutely gorgeous and I can't wait to see what you create with our IPL device.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          To get your free device shipped ASAP, I just need:
        </p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">Your full shipping address</li>
          <li style="margin-bottom: 8px;">Quick confirmation you're happy to share your experience in a post</li>
        </ul>
        
        <p style="margin: 0 0 24px 0; line-height: 1.5;">
          This is going to be such an amazing collaboration! 💜
        </p>
        
        <p style="margin: 0 0 8px 0; line-height: 1.5;">Can't wait!</p>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Emma 🌟</p>
      </td></tr>
    </table>
  </body>
</html>`
    },

    // VARIANT B: Professional/straightforward approach
    variant_b_professional: {
      id: 'var_response_b',
      name: 'Professional Direct',
      subject: 'Next steps for your IPL collaboration',
      html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Great to hear you're interested in collaborating with Cosara! 
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          To process your free IPL Hair Laser (valued at $299), please provide:
        </p>
        
        <ol style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">Complete shipping address (including phone number)</li>
          <li style="margin-bottom: 8px;">Confirmation that you'll create one post featuring the device</li>
          <li style="margin-bottom: 8px;">Preferred content format (post, reel, story, etc.)</li>
        </ol>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Once received, your device will ship within 24-48 hours with tracking provided.
        </p>
        
        <p style="margin: 0 0 24px 0; line-height: 1.5;">
          Looking forward to working together!
        </p>
        
        <p style="margin: 0 0 8px 0; line-height: 1.5;">Best regards,</p>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Cosara Partnership Team</p>
      </td></tr>
    </table>
  </body>
</html>`
    }
  }
};

// 🎯 Predefined Split Test Configurations
const splitTestConfigs = {
  
  // Test different initial outreach approaches
  opener_strategy_test: {
    name: 'Initial Outreach Opener Strategy Test',
    description: 'Testing 4 different approaches to first contact',
    type: 'opener',
    target_count: 100, // 100 emails per variant = 400 total
    variants: [
      emailVariants.initial_outreach_variants.variant_a_brand_ambassador,
      emailVariants.initial_outreach_variants.variant_b_gift_first,
      emailVariants.initial_outreach_variants.variant_c_social_proof,
      emailVariants.initial_outreach_variants.variant_d_problem_solution
    ],
    success_metrics: ['response_rate', 'positive_sentiment_rate', 'conversion_to_shipping']
  },

  // Test follow-up approaches
  follow_up_strategy_test: {
    name: 'Follow-up Strategy Test',
    description: 'Testing gentle vs urgent follow-up approaches',
    type: 'follow_up',
    target_count: 100,
    variants: [
      emailVariants.follow_up_variants.variant_a_gentle_social,
      emailVariants.follow_up_variants.variant_b_urgency
    ],
    success_metrics: ['response_rate', 'positive_sentiment_rate']
  },

  // Test response handling approaches
  response_handling_test: {
    name: 'Response Handling Test',
    description: 'Testing enthusiastic vs professional response styles',
    type: 'response',
    target_count: 100,
    variants: [
      emailVariants.response_variants.variant_a_enthusiastic,
      emailVariants.response_variants.variant_b_professional
    ],
    success_metrics: ['address_provided_rate', 'consent_given_rate', 'time_to_conversion']
  },

  // Unified contact tests (email-first, DM fallback)
  unified_opener_test: {
    name: 'Unified Contact Opener Test',
    description: 'Testing unified contact approach (email-first, DM fallback)',
    type: 'unified_opener',
    target_count: 100,
    variants: [
      emailVariants.initial_outreach_variants.variant_a_brand_ambassador,
      emailVariants.initial_outreach_variants.variant_b_gift_first,
      emailVariants.initial_outreach_variants.variant_c_social_proof
    ],
    success_metrics: ['response_rate', 'positive_sentiment_rate', 'conversion_to_shipping']
  },

  unified_follow_up_test: {
    name: 'Unified Follow-up Test',
    description: 'Testing unified follow-up approach (email-first, DM fallback)',
    type: 'unified_follow_up',
    target_count: 100,
    variants: [
      emailVariants.follow_up_variants.variant_a_gentle_social,
      emailVariants.follow_up_variants.variant_b_urgency
    ],
    success_metrics: ['response_rate', 'positive_sentiment_rate']
  },

  unified_response_test: {
    name: 'Unified Response Test',
    description: 'Testing unified response handling (email-first, DM fallback)',
    type: 'unified_response',
    target_count: 100,
    variants: [
      emailVariants.response_variants.variant_a_enthusiastic,
      emailVariants.response_variants.variant_b_professional
    ],
    success_metrics: ['address_provided_rate', 'consent_given_rate', 'time_to_conversion']
  }
};

module.exports = {
  emailVariants,
  splitTestConfigs
}; 