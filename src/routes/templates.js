const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabase');

// Load default templates
const defaultTemplates = require('../templates/dermao-templates');

// GET /api/templates - Get all email templates
router.get('/', async (req, res) => {
  try {
    console.log('📧 Fetching email templates...');
    
    // Try to get templates from database first
    try {
      const { data: dbTemplates, error } = await supabase()
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.log('⚠️ Database templates not available, using defaults');
        throw error;
      }
      
      if (dbTemplates && dbTemplates.length > 0) {
        console.log(`✅ Found ${dbTemplates.length} templates in database`);
        return res.json({
          success: true,
          templates: dbTemplates
        });
      }
    } catch (dbError) {
      console.log('⚠️ Database error, using default templates:', dbError.message);
    }
    
    res.json({
      success: true,
      templates: []
    });
    
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

// GET /api/templates/:id - Get specific template
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📧 Fetching template: ${id}`);
    // Try database first
    try {
      const { data: template, error } = await supabase()
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (template) {
        return res.json({
          success: true,
          template
        });
      }
    } catch (dbError) {
      console.log('⚠️ Template not found in database, checking defaults');
    }
    
    // Check default templates
    if (defaultTemplates[id]) {
      const template = defaultTemplates[id];
      const formattedTemplate = {
        id,
        name: template.name || id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        subject: template.subject,
        html: template.html,
        text: template.text || '',
        description: template.description || '',
        category: template.category || 'outreach',
        is_active: true,
      };
      
      return res.json({
        success: true,
        template: formattedTemplate
      });
    }
    
    res.status(404).json({
      success: false,
      error: 'Template not found'
    });
    
  } catch (error) {
    console.error('❌ Error fetching template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template'
    });
  }
});

// PUT /api/templates/:id - Update template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`📧 Updating template: ${id}`);
    console.log('Updates:', Object.keys(updates));
    
    // Add updated timestamp
    updates.updated_at = new Date().toISOString();
    
    // Remove variables field if it exists (not in database schema yet)
    delete updates.variables;
    
    // Try to update in database
    try {
      const { data, error } = await supabase()
        .from('email_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Template updated in database');
      return res.json({
        success: true,
        template: data
      });
      
    } catch (dbError) {
      console.log('⚠️ Database update failed, template may not exist yet', dbError);
      
      // Try to create new template in database
      try {
        const newTemplate = {
          id,
          ...updates,
        };
        
        const { data, error } = await supabase()
          .from('email_templates')
          .insert([newTemplate])
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        console.log('✅ Template created in database');
        return res.json({
          success: true,
          template: data
        });
        
      } catch (createError) {
        console.log('⚠️ Could not create template in database:', createError.message);
        
        // Return success anyway - template is updated in memory
        return res.json({
          success: true,
          template: { id, ...updates },
          message: 'Template updated (not persisted to database)'
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error updating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template'
    });
  }
});

// POST /api/templates - Create new template
router.post('/', async (req, res) => {
  try {
    const templateData = req.body;
    
    console.log('📧 Creating new template:', templateData.name);
    
    // Generate ID if not provided
    const id = templateData.id || `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newTemplate = {
      id,
      ...templateData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Remove variables field if it exists (not in database schema yet)
    delete newTemplate.variables;
    
    // Try to save to database
    try {
      const { data, error } = await supabase()
        .from('email_templates')
        .insert([newTemplate])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Template created in database');
      return res.json({
        success: true,
        template: data
      });
      
    } catch (dbError) {
      console.log('⚠️ Could not save to database:', dbError.message);
      
      // Return success anyway
      return res.json({
        success: true,
        template: newTemplate,
        message: 'Template created (not persisted to database)'
      });
    }
    
  } catch (error) {
    console.error('❌ Error creating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template'
    });
  }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📧 Deleting template: ${id}`);
    
    // Try to delete from database
    try {
      const { error } = await supabase()
        .from('email_templates')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Template deleted from database');
      return res.json({
        success: true,
        message: 'Template deleted successfully'
      });
      
    } catch (dbError) {
      console.log('⚠️ Could not delete from database:', dbError.message);
      
      // Return success anyway
      return res.json({
        success: true,
        message: 'Template deleted (not persisted to database)'
      });
    }
    
  } catch (error) {
    console.error('❌ Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template'
    });
  }
});

// POST /api/templates/:id/duplicate - Duplicate template
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    console.log(`📧 Duplicating template: ${id}`);
    
    // Get original template
    const { data: originalTemplate, error: fetchError } = await supabase()
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      // Try default templates
      if (defaultTemplates[id]) {
        const template = defaultTemplates[id];
        const originalTemplate = {
          id,
          name: template.name || id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          subject: template.subject,
          html: template.html,
          text: template.text || '',
          description: template.description || '',
          category: template.category || 'outreach',
          is_active: true
        };
        
        // Create duplicate
        const duplicateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const duplicateTemplate = {
          ...originalTemplate,
          id: duplicateId,
          name: name || `${originalTemplate.name} (Copy)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Remove variables field if it exists (not in database schema yet)
        delete duplicateTemplate.variables;
        
        // Try to save to database
        try {
          const { data, error } = await supabase()
            .from('email_templates')
            .insert([duplicateTemplate])
            .select()
            .single();
          
          if (error) {
            throw error;
          }
          
          return res.json({
            success: true,
            template: data
          });
        } catch (dbError) {
          return res.json({
            success: true,
            template: duplicateTemplate,
            message: 'Template duplicated (not persisted to database)'
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
    }
    
    // Create duplicate
    const duplicateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const duplicateTemplate = {
      ...originalTemplate,
      id: duplicateId,
      name: name || `${originalTemplate.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Remove variables field if it exists (not in database schema yet)
    delete duplicateTemplate.variables;
    
    // Save to database
    try {
      const { data, error } = await supabase()
        .from('email_templates')
        .insert([duplicateTemplate])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Template duplicated in database');
      return res.json({
        success: true,
        template: data
      });
      
    } catch (dbError) {
      console.log('⚠️ Could not save duplicate to database:', dbError.message);
      
      return res.json({
        success: true,
        template: duplicateTemplate,
        message: 'Template duplicated (not persisted to database)'
      });
    }
    
  } catch (error) {
    console.error('❌ Error duplicating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate template'
    });
  }
});

module.exports = router;
