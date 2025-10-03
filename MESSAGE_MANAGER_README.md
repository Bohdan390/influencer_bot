# 📧 Message Manager

A comprehensive email template management system for influencer outreach campaigns.

## ✨ Features

### 🎯 **Template Management**
- **Create** new email templates from scratch
- **Edit** existing templates with live preview
- **Duplicate** templates for quick variations
- **Delete** unused templates
- **Search** and filter templates by category

### 🤖 **AI-Powered Generation**
- **AI Template Generator** using OpenAI/Gemini
- **Customizable Parameters** (brand, tone, audience, etc.)
- **Professional Quality** templates generated instantly
- **Fallback System** ensures templates are always created
- **Easy Customization** after generation

### 📝 **Template Editor**
- **Rich HTML Editor** for email content
- **Plain Text Version** for better deliverability
- **Subject Line** editing
- **Template Description** for organization
- **Category System** (Outreach, Follow-up, Reminder, Custom)

### 👀 **Live Preview**
- **Real-time Preview** of how emails will look
- **HTML Rendering** with proper styling
- **Template Switching** without losing changes

### 🔧 **Integration**
- **Campaign Launcher** integration for template selection
- **Database Storage** with Supabase
- **API Endpoints** for template management
- **Fallback System** to default templates

## 🚀 Usage

### 1. **Access Message Manager**
- Navigate to the **"Messages"** tab in the main interface
- View all available email templates

### 2. **Create New Template**
- **Option A: AI Generation**
  - Click **"AI Generate"** button
  - Fill in generation parameters:
    - Template type (outreach, follow-up, etc.)
    - Brand name
    - Product description
    - Target audience
    - Tone (professional, casual, etc.)
    - Call to action
    - Additional requirements
  - Click **"Generate Template"**
  - AI creates professional template instantly
  - Edit and customize as needed

- **Option B: Manual Creation**
  - Click **"New Template"** button
  - Fill in template details:
    - Name
    - Subject line
    - HTML content
    - Plain text version
    - Description
    - Category

### 3. **Edit Existing Template**
- Click the **Edit** button on any template
- Modify content in the editor
- Use **"Save"** to persist changes

### 4. **Preview Templates**
- Click the **Eye** icon to preview
- See exactly how the email will look to recipients

### 5. **Use in Campaigns**
- Templates are automatically available in Campaign Launcher
- Select from dropdown when creating campaigns

## 🛠️ Technical Details

### **API Endpoints**
```
GET    /api/templates          - List all templates
GET    /api/templates/:id      - Get specific template
POST   /api/templates          - Create new template
PUT    /api/templates/:id      - Update template
DELETE /api/templates/:id      - Delete template
POST   /api/templates/:id/duplicate - Duplicate template
```

### **Database Schema**
```sql
CREATE TABLE email_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    html TEXT NOT NULL,
    text TEXT,
    description TEXT,
    category VARCHAR(50) DEFAULT 'outreach',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Template Variables**
Templates support dynamic variables:
- `{{first_name}}` - Influencer's first name
- `{{last_name}}` - Influencer's last name
- `{{instagram_handle}}` - Instagram username
- `{{follower_count}}` - Number of followers
- `{{engagement_rate}}` - Engagement percentage

## 🎨 Template Categories

### **Outreach** (Blue)
- Initial contact emails
- Brand ambassador invitations
- Collaboration proposals

### **Follow-up** (Green)
- Reminder emails
- Check-in messages
- Status updates

### **Reminder** (Yellow)
- Deadline reminders
- Action required notices
- Urgent communications

### **Custom** (Purple)
- User-created templates
- Specialized messages
- Brand-specific content

## 🔄 Workflow Integration

1. **Create Templates** in Message Manager
2. **Test Templates** with preview functionality
3. **Select Templates** in Campaign Launcher
4. **Launch Campaigns** with chosen templates
5. **Monitor Performance** in Campaign Manager

## 📊 Benefits

- **Consistency** - Standardized messaging across campaigns
- **Efficiency** - Reusable templates save time
- **Quality** - Professional, tested email content
- **Flexibility** - Easy to modify and customize
- **Organization** - Categorized template library

## 🚨 Important Notes

- **HTML Validation** - Ensure proper HTML structure
- **Mobile Responsive** - Test on different devices
- **Spam Compliance** - Follow email best practices
- **Variable Testing** - Verify dynamic content works
- **Backup Templates** - Keep copies of important templates

---

**Ready to create amazing email campaigns? Start with the Message Manager! 🚀**
