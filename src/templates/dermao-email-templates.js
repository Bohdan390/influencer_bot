// Email Templates for Cosara IPL Hair Laser Campaign
// Adapted for brand ambassador test approach

const emailTemplates = {
  
  // 1) INITIAL OUTREACH - Brand Ambassador Test Invitation
  initial_outreach: {
    subject: "Brand Ambassador Opportunity with Cosara",
    html: `
<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I'm reaching out on behalf of <strong>Cosara</strong> — a revolutionary beauty tech brand that's changing how people approach hair removal. We help people everywhere achieve smooth, confident skin without the hassle of constant shaving or expensive salon visits.
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
        <p style="margin: 0 0 16px 0; line-height: 1.5;">The Cosara Partnership Team</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Cosara</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://cosara.com" target="_blank" style="color: #000000; text-decoration: underline;">cosara.com</a> | 
              <a href="https://instagram.com/cosara.official" target="_blank" style="color: #000000; text-decoration: underline;">@cosara.official</a>
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
    html: `
<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Amazing! I'm thrilled that you're interested in becoming a Cosara brand ambassador. I can't wait to see your authentic content featuring our IPL technology!
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
          <li style="margin-bottom: 8px;">Please tag us: <strong>@cosara.official</strong> so we can see and share your content!</li>
        </ul>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Remember, if your content gets great engagement, we'll be reaching out to discuss that long-term partnership with fixed payments + performance bonuses!
        </p>

        <p style="margin: 0 0 24px 0; line-height: 1.5;">Looking forward to your shipping details!</p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Cosara Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://cosara.com" target="_blank" style="color: #000000; text-decoration: underline;">cosara.com</a> | 
              <a href="https://instagram.com/cosara.official" target="_blank" style="color: #000000; text-decoration: underline;">@cosara.official</a>
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
    html: `
<!DOCTYPE html>
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
          <li style="margin-bottom: 8px;">Tag us <strong>@cosara.official</strong> so we can see and share your content</li>
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
              <strong>Cosara Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://cosara.com" target="_blank" style="color: #000000; text-decoration: underline;">cosara.com</a> | 
              <a href="https://instagram.com/cosara.official" target="_blank" style="color: #000000; text-decoration: underline;">@cosara.official</a>
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
    subject: "Your Cosara Brand Ambassador Test Details",
    html: `
<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Thanks for your interest in collaborating with Cosara! We're excited about the possibility of working together.
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
              <strong>Cosara Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://cosara.com" target="_blank" style="color: #000000; text-decoration: underline;">cosara.com</a> | 
              <a href="https://instagram.com/cosara.official" target="_blank" style="color: #000000; text-decoration: underline;">@cosara.official</a>
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
    html: `
<!DOCTYPE html>
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
          <li style="margin-bottom: 8px;">Please tag us <strong>@cosara.official</strong> so we can share your amazing content!</li>
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
              <strong>Cosara Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://cosara.com" target="_blank" style="color: #000000; text-decoration: underline;">cosara.com</a> | 
              <a href="https://instagram.com/cosara.official" target="_blank" style="color: #000000; text-decoration: underline;">@cosara.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  },

  // 6) ORDER SHIPPED NOTIFICATION
  order_shipped: {
    subject: "Your IPL device is on its way! 🚚",
    html: `
<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Exciting news! Your <strong>IPL Hair Laser</strong> has been shipped and is on its way to you!
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <strong>Tracking Information:</strong><br>
          Tracking Number: {{tracking_number}}<br>
          Estimated Delivery: {{estimated_delivery}}
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Once you receive your device, take your time to unbox it, set it up, and try it out. We can't wait to see your authentic experience!
        </p>

        <p style="margin: 0 0 8px 0; line-height: 1.5;">
          <strong>Content Ideas:</strong>
        </p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">Unboxing and first impressions</li>
          <li style="margin-bottom: 8px;">Setup process and ease of use</li>
          <li style="margin-bottom: 8px;">Before/during/after your treatment</li>
          <li style="margin-bottom: 8px;">Your honest results and thoughts</li>
        </ul>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Remember to tag us <strong>@cosara.official</strong> when you post so we can see your content and share it with our community!
        </p>

        <p style="margin: 0 0 24px 0; line-height: 1.5;">Thank you for being part of our brand ambassador program. We're excited to see what you create! 🌟</p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Cosara Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://cosara.com" target="_blank" style="color: #000000; text-decoration: underline;">cosara.com</a> | 
              <a href="https://instagram.com/cosara.official" target="_blank" style="color: #000000; text-decoration: underline;">@cosara.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  },

  // 7) PAYMENT INQUIRY RESPONSE - When they ask about upfront payment
  payment_inquiry: {
    subject: "About our Brand Ambassador Program",
    html: `
<!DOCTYPE html>
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
              <strong>Cosara Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://cosara.com" target="_blank" style="color: #000000; text-decoration: underline;">cosara.com</a> | 
              <a href="https://instagram.com/cosara.official" target="_blank" style="color: #000000; text-decoration: underline;">@cosara.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  },

  // 8) NON-TARGET COUNTRY RESPONSE
  non_target_country: {
    subject: "Thank you for your interest in Cosara",
    html: `
<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Thank you so much for your interest in becoming a Cosara brand ambassador! I really appreciate you reaching out to us and I love your content.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Unfortunately, our current Brand Ambassador Test program is only available in the United States, United Kingdom, and Australia as these are our primary markets for the IPL device launch.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          We're actively working on expanding to more regions throughout 2025, and we'll definitely keep your information on file for when we begin partnerships in your area. Your content style and engagement are exactly what we love to work with!
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          In the meantime, please feel free to follow us at <a href="https://instagram.com/cosara.official" target="_blank" style="color: #263376; text-decoration: underline;">@cosara.official</a> to stay updated on our product launches, expansion plans, and future collaboration opportunities.
        </p>

        <p style="margin: 0 0 24px 0; line-height: 1.5;">Thank you again for your interest, and I hope we can work together when we expand to your region!</p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Cosara Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://cosara.com" target="_blank" style="color: #000000; text-decoration: underline;">cosara.com</a> | 
              <a href="https://instagram.com/cosara.official" target="_blank" style="color: #000000; text-decoration: underline;">@cosara.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  },

  // 9) FOLLOW UP 1 - First follow-up after initial outreach
  follow_up_1: {
    subject: "Following up on our brand ambassador opportunity",
    html: `
<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Just following up on my previous message about our Cosara brand ambassador test opportunity!
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I know you probably get a lot of collaboration requests, but I genuinely think you'd be perfect for showcasing our IPL technology. Your content style and authentic voice are exactly what we're looking for.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <strong>Quick reminder of what's on the table:</strong>
        </p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">Free IPL Hair Laser (worth $299) - yours to keep</li>
          <li style="margin-bottom: 8px;">One authentic post showcasing your experience</li>
          <li style="margin-bottom: 8px;">Potential long-term paid partnership if content performs well</li>
        </ul>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Spots in our brand ambassador test program are filling up quickly, so I wanted to check if this sounds interesting to you?
        </p>

        <p style="margin: 0 0 24px 0; line-height: 1.5;">Let me know if you have any questions! 😊</p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Cosara Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://cosara.com" target="_blank" style="color: #000000; text-decoration: underline;">cosara.com</a> | 
              <a href="https://instagram.com/cosara.official" target="_blank" style="color: #000000; text-decoration: underline;">@cosara.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  },

  // 10) FOLLOW UP 2 - Final follow-up
  follow_up_2: {
    subject: "Last call for our IPL brand ambassador test",
    html: `
<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Following up one last time about our brand ambassador test opportunity with Cosara!
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Do you have any content ideas for featuring our IPL Hair Laser? I'd love to hear your creative approach and see how you'd authentically showcase the technology to your audience.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          The free device (worth $299) is still available if you're interested in trying it out and sharing your honest experience.
        </p>

        <p style="margin: 0 0 24px 0; line-height: 1.5;">No worries if it's not a fit at the moment – I completely understand! 😊</p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Cosara Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://cosara.com" target="_blank" style="color: #000000; text-decoration: underline;">cosara.com</a> | 
              <a href="https://instagram.com/cosara.official" target="_blank" style="color: #000000; text-decoration: underline;">@cosara.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  },

  // 9) CONTENT FOLLOW-UP TEMPLATES (for post-shipping)
  follow_up_content_reminder: {
    subject: "How are you enjoying your Cosara IPL device?",
    html: `
<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I hope you're loving your Cosara IPL Hair Laser! It's been {{days_since_shipped}} days since we shipped it your way, and I'd love to hear about your experience.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          Have you had a chance to try it out yet? I'm excited to see how it's working for you! As we discussed, we'd be thrilled if you could share your honest experience with your followers.
        </p>

        <p style="margin: 0 0 8px 0; line-height: 1.5;">
          <strong>Quick reminder of what we're looking for:</strong>
        </p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">An authentic post or Reel showing your experience</li>
          <li style="margin-bottom: 8px;">Tag us @cosara.official so we can see and share</li>
          <li style="margin-bottom: 8px;">Be honest about your results - authenticity is what we value most!</li>
        </ul>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <strong>Remember:</strong> If your content performs well, we'll definitely reach out about that long-term partnership opportunity with regular compensation + performance bonuses!
        </p>

        <p style="margin: 0 0 24px 0; line-height: 1.5;">No pressure at all - just excited to see what you create! Let me know if you have any questions about the device or need any tips for getting the best results.</p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Cosara Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://cosara.com" target="_blank" style="color: #000000; text-decoration: underline;">cosara.com</a> | 
              <a href="https://instagram.com/cosara.official" target="_blank" style="color: #000000; text-decoration: underline;">@cosara.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
    `
  },

  follow_up_content_urgent: {
    subject: "Quick check-in about your Cosara content collaboration",
    html: `
<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I wanted to follow up about your Cosara IPL device that we sent {{days_since_shipped}} days ago. I hope everything arrived safely and you've had a chance to try it!
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I know life gets busy, but I wanted to gently remind you about creating that piece of content we discussed. Your authentic experience would mean so much to us and could really help other people considering IPL hair removal.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <strong>Just to refresh your memory:</strong> One post or Reel featuring your honest experience with the device, tagging @cosara.official. That's it!
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          If you've been using it and getting good results, now would be a perfect time to share. And if you haven't tried it yet, no worries - even an unboxing or first impressions would be amazing.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <strong>Still interested in that long-term partnership?</strong> This content piece would be the perfect way to show us how well you connect with our brand. We're actively looking for creators to join our ongoing program with monthly compensation!
        </p>

        <p style="margin: 0 0 24px 0; line-height: 1.5;">Let me know if you have any questions or if there's anything I can help with. Looking forward to seeing what you create!</p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Cosara Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://cosara.com" target="_blank" style="color: #000000; text-decoration: underline;">cosara.com</a> | 
              <a href="https://instagram.com/cosara.official" target="_blank" style="color: #000000; text-decoration: underline;">@cosara.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
    `
  },

  follow_up_final_request: {
    subject: "Final check-in about your Cosara collaboration",
    html: `
<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I hope you're well! This is my final follow-up about the Cosara IPL device we sent you {{days_since_shipped}} days ago.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I completely understand that things come up and plans change. If you're no longer able to create content featuring the device, that's totally fine - no judgment here! Life happens, and I appreciate your honesty.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          However, if you are still planning to create something, I'd love to know so I can keep an eye out for it. Even something simple would be wonderful - your followers trust your opinion, and that's exactly what makes partnerships like this valuable.
        </p>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <strong>Either way, please just let me know:</strong>
        </p>
        
        <ul style="margin: 0 0 16px 20px; padding: 0; line-height: 1.5;">
          <li style="margin-bottom: 8px;">✅ "Yes, I'll create content soon" - and when you might post</li>
          <li style="margin-bottom: 8px;">❌ "Sorry, I can't create content" - and I'll note that in our system</li>
        </ul>

        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I really appreciate your time, and regardless of your decision, I hope you enjoy the IPL device! It's yours to keep either way.
        </p>

        <p style="margin: 0 0 24px 0; line-height: 1.5;">Thanks again for considering our collaboration, and I hope we can work together in the future!</p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 16px;">
          <tr><td>
            <p style="margin: 0; line-height: 1.5;">
              <strong>Cosara Partnership Team</strong><br>
              Beauty Technology Innovation<br>
              <a href="https://cosara.com" target="_blank" style="color: #000000; text-decoration: underline;">cosara.com</a> | 
              <a href="https://instagram.com/cosara.official" target="_blank" style="color: #000000; text-decoration: underline;">@cosara.official</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
    `
  }
};

module.exports = emailTemplates; 