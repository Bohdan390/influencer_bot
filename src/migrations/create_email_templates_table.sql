-- Create email_templates table for storing custom email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    html TEXT NOT NULL,
    text TEXT,
    description TEXT,
    category VARCHAR(50) DEFAULT 'outreach',
    is_active BOOLEAN DEFAULT true,
    variables JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_at ON email_templates(created_at);

-- Insert default templates
INSERT INTO email_templates (id, name, subject, html, text, description, category, is_active) VALUES
(
    'initial_outreach',
    'Initial Outreach',
    'Brand Ambassador Opportunity with Cosara',
    '<!DOCTYPE html>
<html>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; color: #000000; background-color: #ffffff;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr><td>
        <p style="margin: 0 0 16px 0; line-height: 1.5;">Hi {{first_name}},</p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I''m reaching out on behalf of <strong>Cosara</strong> — a revolutionary beauty tech brand that''s changing how people approach hair removal. We help people everywhere achieve smooth, confident skin without the hassle of constant shaving or expensive salon visits.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          I came across your profile and was immediately drawn to your authentic content and engaged community. Your aesthetic and voice align perfectly with our brand values — exactly the kind of creator we''re looking for to showcase our innovative IPL technology.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          <strong>Here''s what I''d love to offer you:</strong>
        </p>
        
        <p style="margin: 0 0 8px 0; line-height: 1.5;">
          🎯 <strong>Brand Ambassador Test:</strong> We''re giving away one <strong>free IPL Hair Laser</strong> (retail value $299) in exchange for one authentic post about your experience.
        </p>
        
        <p style="margin: 0 0 16px 0; line-height: 1.5;">
          💡 <strong>If your content performs well</strong> and resonates with your audience, we''d love to discuss a long-term brand partnership where you create weekly content for our branded Instagram and TikTok accounts with:
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
          Are you interested in this brand ambassador test? I''d love to share more details about the collaboration!
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
</html>',
    'Hi {{first_name}},

I''m reaching out on behalf of Cosara — a revolutionary beauty tech brand that''s changing how people approach hair removal. We help people everywhere achieve smooth, confident skin without the hassle of constant shaving or expensive salon visits.

I came across your profile and was immediately drawn to your authentic content and engaged community. Your aesthetic and voice align perfectly with our brand values — exactly the kind of creator we''re looking for to showcase our innovative IPL technology.

Here''s what I''d love to offer you:

🎯 Brand Ambassador Test: We''re giving away one free IPL Hair Laser (retail value $299) in exchange for one authentic post about your experience.

💡 If your content performs well and resonates with your audience, we''d love to discuss a long-term brand partnership where you create weekly content for our branded Instagram and TikTok accounts with:
• Fixed payment per piece of content
• Performance bonus based on views ($0.50 CPM)
• Long-term collaboration opportunities
• Early access to new products

This is your chance to be at the forefront of beauty tech innovation and join our community of brand ambassadors who are reshaping the hair removal industry.

Are you interested in this brand ambassador test? I''d love to share more details about the collaboration!

Best regards,
The Cosara Partnership Team

Cosara
Beauty Technology Innovation
cosara.com | @cosara.official',
    'Initial outreach email for brand ambassador opportunities',
    'outreach',
    true
) ON CONFLICT (id) DO NOTHING;
