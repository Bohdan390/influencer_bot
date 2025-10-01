// Email Templates for Dermao IPL Hair Laser Campaign
// Adapted for brand ambassador test approach

const emailTemplates = {
  
  // 1) INITIAL OUTREACH - Brand Ambassador Test Invitation
  initial_outreach: {
    subject: "Brand Ambassador Opportunity with Dermao",
    html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I'm reaching out on behalf of <strong>Dermao</strong> — a revolutionary beauty tech brand that's changing how people approach hair removal. We help people everywhere achieve smooth, confident skin without the hassle of constant shaving or expensive salon visits.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I came across your profile and was immediately drawn to your authentic content and engaged community. Your aesthetic and voice align perfectly with our brand values — exactly the kind of creator we're looking for to showcase our innovative IPL technology.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <strong>Here's what I'd love to offer you:</strong>
        </p>
        
        <p style="margin: 0 0 8px 0; line-height: 1.5;">
          🎯 <strong>Brand Ambassador Test:</strong> We're giving away one <strong>free IPL Hair Laser</strong> (retail value $299) in exchange for one authentic post about your experience.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          💡 <strong>If your content performs well</strong> and resonates with your audience, we'd love to discuss a long-term brand partnership where you create weekly content for our branded Instagram and TikTok accounts with:
        </p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">Fixed payment per piece of content</li>
          <li style="margin-bottom: 8px;">Performance bonus based on views ($0.50 CPM)</li>
          <li style="margin-bottom: 8px;">Long-term collaboration opportunities</li>
          <li style="margin-bottom: 8px;">Early access to new products</li>
        </ul>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          This is your chance to be at the forefront of beauty tech innovation and join our community of brand ambassadors who are reshaping the hair removal industry.
        </p>
        
        <p style="margin: 0 0 24px 0; line-height: 1.5;">
          Are you interested in this brand ambassador test? I'd love to share more details about the collaboration!
        </p>
        
        <p style="margin: 0 0 8px 0; line-height: 1.5;">Best regards,</p>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">The Dermao Partnership Team</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Dermao</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://dermao.com" target="_blank" style="color: #000000; text-decoration: underline;">dermao.com</a> | 
              <a href="https://instagram.com/dermao.official" target="_blank" style="color: #000000; text-decoration: underline;">@dermao.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  },

  // 2) ASK FOR ADDRESS - When they agree but no address provided
  ask_for_address: {
    subject: "Let's get your free IPL device shipped!",
    html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Amazing! I'm thrilled that you're interested in becoming a Dermao brand ambassador. I can't wait to see your authentic content featuring our IPL technology!
        </p>

        <p style="margin: 0 0 8px 0; line-height: 1.5;">To get your <strong>free IPL Hair Laser</strong> (worth $299) shipped to you, I just need your shipping details:</p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">Your full name (first and last)</li>
          <li style="margin-bottom: 8px;">Complete shipping address (including city, state/province, ZIP/postal code, and country)</li>
          <li style="margin-bottom: 8px;">Phone number (for shipping updates)</li>
        </ul>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <em>We currently ship to US, UK, and Australia for our brand ambassador program.</em>
        </p>

        <p style="margin: 0 0 8px 0; line-height: 1.5;">Once I have your address, I'll get your IPL device shipped out right away so you can start creating your content showcasing:</p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">Your unboxing experience</li>
          <li style="margin-bottom: 8px;">First impressions and setup</li>
          <li style="margin-bottom: 8px;">Your honest results after use</li>
          <li style="margin-bottom: 8px;">Please tag us: <strong>@dermao.official</strong> so we can see and share your content!</li>
        </ul>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Remember, if your content gets great engagement, we'll be reaching out to discuss that long-term partnership with fixed payments + performance bonuses!
        </p>

        <p style="margin: 0 0 24px 0; line-height: 1.5;">Looking forward to your shipping details!</p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Dermao Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://dermao.com" target="_blank" style="color: #000000; text-decoration: underline;">dermao.com</a> | 
              <a href="https://instagram.com/dermao.official" target="_blank" style="color: #000000; text-decoration: underline;">@dermao.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  },

  // 3) ASK FOR CONSENT - When they provide address but no agreement
  ask_for_consent: {
    subject: "Ready to create amazing content with your free IPL?",
    html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Perfect! Thanks for sending over your shipping details. I'm excited to get your <strong>free IPL Hair Laser</strong> on its way to you!
        </p>

        <p style="margin: 0 0 8px 0; line-height: 1.5;">Quick question: would you be open to creating some authentic content featuring the device in return? We'd love if you could:</p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">Share an Instagram post or Reel showcasing your experience with the IPL device</li>
          <li style="margin-bottom: 8px;">Tag us <strong>@dermao.official</strong> so we can see and share your content</li>
          <li style="margin-bottom: 8px;">Be honest about your experience — authenticity is what we value most!</li>
        </ul>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Of course, if you have other creative ideas for showcasing the device that would resonate better with your audience, I'm totally open to hearing them!
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <strong>Remember:</strong> If your content performs well and gets great engagement, we'll be in touch about that long-term brand partnership opportunity with fixed payments plus performance bonuses ($0.50 CPM).
        </p>

        <p style="margin: 0 0 24px 0; line-height: 1.5;">Does this sound good to you? Let me know and I'll get your IPL device shipped out immediately!</p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Dermao Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://dermao.com" target="_blank" style="color: #000000; text-decoration: underline;">dermao.com</a> | 
              <a href="https://instagram.com/dermao.official" target="_blank" style="color: #000000; text-decoration: underline;">@dermao.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  },

  // 4) ASK FOR BOTH - Initial response when neither address nor consent provided
  ask_for_both: {
    subject: "Your Dermao Brand Ambassador Test Details",
    html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Thanks for your interest in collaborating with Dermao! We're excited about the possibility of working together.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Would you be interested in participating in our <strong>Brand Ambassador Test</strong>? Here's how it works:
        </p>

        <p style="margin: 0 0 8px 0; line-height: 1.5;">
          <strong>🎁 What you get:</strong> One free IPL Hair Laser (retail value $299) shipped directly to you
        </p>
        
        <p style="margin: 0 0 8px 0; line-height: 1.5;">
          <strong>📱 What we'd love in return:</strong> One authentic post or Reel sharing your honest experience with the device
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <strong>🚀 The big opportunity:</strong> If your content gets great traction and engagement, we'll reach out to discuss a long-term paid partnership for weekly content creation with fixed payments + performance bonuses!
        </p>

        <p style="margin: 0 0 8px 0; line-height: 1.5;">If this sounds interesting, I'd need:</p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">Your full shipping address (we ship to US, UK, & Australia)</li>
          <li style="margin-bottom: 8px;">Confirmation that you're open to creating one piece of content featuring the device</li>
          <li style="margin-bottom: 8px;">Your preferred content format (post, Reel, Story, etc.)</li>
        </ul>

        <p style="margin: 0 0 24px 0; line-height: 1.5;">Let me know if this brand ambassador test sounds good to you, and I'll get your free IPL device shipped ASAP!</p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Dermao Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://dermao.com" target="_blank" style="color: #000000; text-decoration: underline;">dermao.com</a> | 
              <a href="https://instagram.com/dermao.official" target="_blank" style="color: #000000; text-decoration: underline;">@dermao.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  },

  // 5) SHIP ORDER CONFIRMATION - When both address and consent confirmed
  ship_order: {
    subject: "Your IPL device is being processed! 📦",
    html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hey {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Awesome! I'm thrilled to get your <strong>IPL Hair Laser</strong> processed and shipped to you. This is going to be an amazing collaboration!
        </p>

        <p style="margin: 0 0 8px 0; line-height: 1.5;">Just to confirm, here's what we're looking forward to:</p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">1x authentic post or Reel featuring your IPL experience</li>
          <li style="margin-bottom: 8px;">Your honest thoughts on the device and results</li>
          <li style="margin-bottom: 8px;">Please tag us <strong>@dermao.official</strong> so we can share your amazing content!</li>
        </ul>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          You'll receive a shipping confirmation email with tracking details within 24-48 hours. The device typically arrives within 5-7 business days.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <strong>Important:</strong> Once your post goes live, please send me the link or tag us so we can see it! If it gets great engagement and performance, we'll be in touch about that long-term paid partnership opportunity.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Feel free to reach out if you have any questions about the device, content ideas, or anything else. I'm here to support you!
        </p>

        <p style="margin: 0 0 24px 0; line-height: 1.5;">Can't wait to see your content! 🎉</p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Dermao Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://dermao.com" target="_blank" style="color: #000000; text-decoration: underline;">dermao.com</a> | 
              <a href="https://instagram.com/dermao.official" target="_blank" style="color: #000000; text-decoration: underline;">@dermao.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  },

  // 6) PAYMENT INQUIRY RESPONSE - When they ask about upfront payment
  payment_inquiry: {
    subject: "About our Brand Ambassador Program",
    html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Thanks for your interest in our collaboration! I appreciate you asking about the compensation structure.
        </p>

        <p style="margin: 0 0 8px 0; line-height: 1.5;">
          Our Brand Ambassador Test program works differently than traditional flat-fee partnerships. Here's how it works:
        </p>

        <p style="margin: 0 0 8px 0; line-height: 1.5;">
          <strong>Phase 1 - Brand Ambassador Test:</strong>
        </p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">Free IPL Hair Laser device (retail value $299)</li>
          <li style="margin-bottom: 8px;">One authentic post/Reel featuring your experience</li>
          <li style="margin-bottom: 8px;">No upfront payment, but you keep the device worth $299</li>
        </ul>

        <p style="margin: 0 0 8px 0; line-height: 1.5;">
          <strong>Phase 2 - Long-term Partnership (based on performance):</strong>
        </p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">Fixed payment per piece of content</li>
          <li style="margin-bottom: 8px;">Performance bonus at $0.50 CPM based on views</li>
          <li style="margin-bottom: 8px;">Weekly content creation opportunities</li>
          <li style="margin-bottom: 8px;">Early access to new product launches</li>
        </ul>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          This approach allows us to see how well your content resonates with our target audience before moving into a paid partnership. Many of our top creators find this model more lucrative than one-time flat fees, especially with the performance bonuses.
        </p>

        <p style="margin: 0 0 24px 0; line-height: 1.5;">Would this structure work for you? I'd love to discuss how we can make this collaboration beneficial for both of us!</p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Dermao Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://dermao.com" target="_blank" style="color: #000000; text-decoration: underline;">dermao.com</a> | 
              <a href="https://instagram.com/dermao.official" target="_blank" style="color: #000000; text-decoration: underline;">@dermao.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  },

  // 7) NON-TARGET COUNTRY RESPONSE
  non_target_country: {
    subject: "Thank you for your interest in Dermao",
    html: `<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Thank you so much for your interest in becoming a Dermao brand ambassador! I really appreciate you reaching out to us and I love your content.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Unfortunately, our current Brand Ambassador Test program is only available in the United States, United Kingdom, and Australia as these are our primary markets for the IPL device launch.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          We're actively working on expanding to more regions throughout 2025, and we'll definitely keep your information on file for when we begin partnerships in your area. Your content style and engagement are exactly what we love to work with!
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          In the meantime, please feel free to follow us at <a href="https://instagram.com/dermao.official" target="_blank" style="color: #263376; text-decoration: underline;">@dermao.official</a> to stay updated on our product launches, expansion plans, and future collaboration opportunities.
        </p>

        <p style="margin: 0 0 24px 0; line-height: 1.5;">Thank you again for your interest, and I hope we can work together when we expand to your region!</p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Dermao Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://dermao.com" target="_blank" style="color: #000000; text-decoration: underline;">dermao.com</a> | 
              <a href="https://instagram.com/dermao.official" target="_blank" style="color: #000000; text-decoration: underline;">@dermao.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  }
};

module.exports = emailTemplates; 