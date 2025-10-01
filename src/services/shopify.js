const axios = require('axios');

class ShopifyService {
  constructor() {
    this.shopName = process.env.SHOPIFY_SHOP_NAME;
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    this.apiKey = process.env.SHOPIFY_API_KEY;
    this.apiSecret = process.env.SHOPIFY_API_SECRET;
    
    this.baseUrl = `https://${this.shopName}.myshopify.com/admin/api/2023-10`;
    
    // Configure axios instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    
    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🛒 Shopify API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('🛒 Shopify Request Error:', error);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`🛒 Shopify API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('🛒 Shopify API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }
  
  // Check if Shopify is properly configured
  isConfigured() {
    return !!(this.shopName && this.accessToken && this.apiKey && this.apiSecret);
  }
  
  // Test connection to Shopify
  async testConnection() {
    try {
      const response = await this.client.get('/shop.json');
      return {
        success: true,
        shop: response.data.shop,
        message: `Connected to ${response.data.shop.name}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Create a discount code for influencers
  async createDiscountCode(influencerHandle, discountPercentage = 15) {
    try {
      const discountCode = `${influencerHandle.replace('@', '').toUpperCase()}${discountPercentage}`;
      
      const discountData = {
        price_rule: {
          title: `Influencer Discount - ${influencerHandle}`,
          target_type: 'line_item',
          target_selection: 'all',
          allocation_method: 'across',
          value_type: 'percentage',
          value: `-${discountPercentage}`,
          customer_selection: 'all',
          starts_at: new Date().toISOString(),
          usage_limit: 100, // Limit uses per code
          once_per_customer: true
        }
      };
      
      // Create price rule first
      const priceRuleResponse = await this.client.post('/price_rules.json', discountData);
      const priceRuleId = priceRuleResponse.data.price_rule.id;
      
      // Create discount code for the price rule
      const discountCodeData = {
        discount_code: {
          code: discountCode,
          usage_count: 0
        }
      };
      
      const discountResponse = await this.client.post(
        `/price_rules/${priceRuleId}/discount_codes.json`,
        discountCodeData
      );
      
      return {
        success: true,
        discount_code: discountCode,
        price_rule_id: priceRuleId,
        discount_id: discountResponse.data.discount_code.id,
        usage_limit: 100,
        percentage: discountPercentage
      };
      
    } catch (error) {
      console.error('Failed to create discount code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Create a customer record for an influencer
  async createCustomer(influencerData) {
    try {
      const customerData = {
        customer: {
          first_name: influencerData.first_name || influencerData.full_name?.split(' ')[0] || 'Influencer',
          last_name: influencerData.last_name || influencerData.full_name?.split(' ').slice(1).join(' ') || '',
          email: influencerData.email,
          phone: influencerData.phone || null,
          tags: `influencer,${influencerData.instagram_handle},partner`,
          note: `Influencer partner: ${influencerData.instagram_handle}\nFollowers: ${influencerData.follower_count || 'N/A'}\nEngagement Rate: ${influencerData.engagement_rate || 'N/A'}%`,
          verified_email: false,
          marketing_opt_in_level: 'single_opt_in',
          accepts_marketing: true
        }
      };
      
      const response = await this.client.post('/customers.json', customerData);
      
      return {
        success: true,
        customer: response.data.customer,
        customer_id: response.data.customer.id
      };
      
    } catch (error) {
      // Check if customer already exists
      if (error.response?.status === 422) {
        // Try to find existing customer by email
        try {
          const searchResponse = await this.client.get(`/customers/search.json?query=email:${influencerData.email}`);
          if (searchResponse.data.customers.length > 0) {
            return {
              success: true,
              customer: searchResponse.data.customers[0],
              customer_id: searchResponse.data.customers[0].id,
              existing: true
            };
          }
        } catch (searchError) {
          console.error('Failed to search for existing customer:', searchError);
        }
      }
      
      console.error('Failed to create customer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Create a draft order for product shipping
  async createDraftOrder(customerData, productData) {
    try {
      const draftOrderData = {
        draft_order: {
          customer: {
            id: customerData.customer_id
          },
          line_items: [
            {
              title: productData.title || 'Dermao IPL Hair Laser Device',
              price: '0.00', // Free for influencers
              quantity: 1,
              requires_shipping: true,
              taxable: false,
              gift_card: false
            }
          ],
          shipping_address: productData.shipping_address,
          billing_address: productData.billing_address || productData.shipping_address,
          note: `Influencer collaboration shipment for ${customerData.instagram_handle}`,
          tags: 'influencer,collaboration,free-product',
          tax_exempt: true,
          shipping_line: {
            title: 'Free Shipping',
            price: '0.00'
          }
        }
      };
      
      const response = await this.client.post('/draft_orders.json', draftOrderData);
      
      return {
        success: true,
        draft_order: response.data.draft_order,
        order_id: response.data.draft_order.id,
        order_number: response.data.draft_order.name
      };
      
    } catch (error) {
      console.error('Failed to create draft order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Complete a draft order (convert to real order)
  async completeDraftOrder(draftOrderId) {
    try {
      const response = await this.client.put(`/draft_orders/${draftOrderId}/complete.json`);
      
      return {
        success: true,
        order: response.data.draft_order,
        order_id: response.data.draft_order.order_id
      };
      
    } catch (error) {
      console.error('Failed to complete draft order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get order details
  async getOrder(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}.json`);
      
      return {
        success: true,
        order: response.data.order
      };
      
    } catch (error) {
      console.error('Failed to get order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get order fulfillment status
  async getOrderFulfillments(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}/fulfillments.json`);
      
      return {
        success: true,
        fulfillments: response.data.fulfillments
      };
      
    } catch (error) {
      console.error('Failed to get fulfillments:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get products (for dropdown/selection in dashboard)
  async getProducts(limit = 50) {
    try {
      const response = await this.client.get(`/products.json?limit=${limit}`);
      
      return {
        success: true,
        products: response.data.products
      };
      
    } catch (error) {
      console.error('Failed to get products:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get discount code usage stats
  async getDiscountCodeUsage(priceRuleId, discountCodeId) {
    try {
      const response = await this.client.get(
        `/price_rules/${priceRuleId}/discount_codes/${discountCodeId}.json`
      );
      
      return {
        success: true,
        usage_count: response.data.discount_code.usage_count,
        code: response.data.discount_code.code
      };
      
    } catch (error) {
      console.error('Failed to get discount code usage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Create fulfillment (mark as shipped)
  async createFulfillment(orderId, lineItems, trackingNumber = null, trackingCompany = null) {
    try {
      const fulfillmentData = {
        fulfillment: {
          location_id: null, // Will use default location
          tracking_number: trackingNumber,
          tracking_company: trackingCompany,
          tracking_urls: trackingNumber ? [`https://track.aftership.com/${trackingNumber}`] : [],
          notify_customer: true,
          line_items: lineItems.map(item => ({
            id: item.id,
            quantity: item.quantity
          }))
        }
      };
      
      const response = await this.client.post(`/orders/${orderId}/fulfillments.json`, fulfillmentData);
      
      return {
        success: true,
        fulfillment: response.data.fulfillment,
        tracking_number: trackingNumber
      };
      
    } catch (error) {
      console.error('Failed to create fulfillment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const shopifyService = new ShopifyService();

module.exports = shopifyService; 