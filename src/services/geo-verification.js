/**
 * 🌍 Geo-Verification Service
 * Handles location verification, address validation, and shipping eligibility
 */

class GeoVerificationService {
  constructor() {
    this.targetCountries = ['US', 'UK', 'AU'];
    this.countryPatterns = {
      US: {
        keywords: ['usa', 'united states', 'america', 'us', 'california', 'texas', 'florida', 'new york', 'chicago', 'los angeles'],
        timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
        phonePattern: /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/,
        zipPattern: /^\d{5}(-\d{4})?$/
      },
      UK: {
        keywords: ['uk', 'united kingdom', 'england', 'scotland', 'wales', 'britain', 'london', 'manchester', 'birmingham'],
        timezones: ['Europe/London'],
        phonePattern: /^\+?44[-.\s]?[0-9]{4}[-.\s]?[0-9]{6}$/,
        zipPattern: /^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$/i
      },
      AU: {
        keywords: ['australia', 'au', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'canberra'],
        timezones: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth'],
        phonePattern: /^\+?61[-.\s]?[0-9]{1}[-.\s]?[0-9]{4}[-.\s]?[0-9]{4}$/,
        zipPattern: /^\d{4}$/
      }
    };
  }

  /**
   * 🔍 Verify influencer location from bio and profile data
   */
  async verifyInfluencerLocation(influencerData) {
    const verification = {
      country: null,
      confidence: 0,
      eligible: false,
      sources: [],
      flags: []
    };

    try {
      // Check bio for location keywords
      if (influencerData.bio) {
        const bioCheck = this.checkBioForLocation(influencerData.bio);
        if (bioCheck.country) {
          verification.country = bioCheck.country;
          verification.confidence += bioCheck.confidence;
          verification.sources.push('bio');
        }
      }

      // Check profile location field
      if (influencerData.location) {
        const locationCheck = this.checkLocationField(influencerData.location);
        if (locationCheck.country) {
          if (verification.country && verification.country !== locationCheck.country) {
            verification.flags.push('location_mismatch');
          } else {
            verification.country = locationCheck.country;
            verification.confidence += locationCheck.confidence;
            verification.sources.push('location_field');
          }
        }
      }

      // Check external URL for country-specific domains
      if (influencerData.external_url) {
        const urlCheck = this.checkUrlForLocation(influencerData.external_url);
        if (urlCheck.country) {
          verification.confidence += urlCheck.confidence;
          verification.sources.push('external_url');
        }
      }

      // Normalize confidence score
      verification.confidence = Math.min(verification.confidence, 1.0);
      verification.eligible = verification.country && this.targetCountries.includes(verification.country);

      return verification;

    } catch (error) {
      console.error('Error verifying location:', error);
      return {
        country: null,
        confidence: 0,
        eligible: false,
        sources: [],
        flags: ['verification_error']
      };
    }
  }

  /**
   * 📍 Check bio text for location indicators
   */
  checkBioForLocation(bio) {
    const bioLower = bio.toLowerCase();
    
    for (const [country, data] of Object.entries(this.countryPatterns)) {
      for (const keyword of data.keywords) {
        if (bioLower.includes(keyword)) {
          return {
            country,
            confidence: 0.7,
            keyword
          };
        }
      }
    }

    return { country: null, confidence: 0 };
  }

  /**
   * 🗺️ Check location field for country
   */
  checkLocationField(location) {
    const locationLower = location.toLowerCase();
    
    for (const [country, data] of Object.entries(this.countryPatterns)) {
      for (const keyword of data.keywords) {
        if (locationLower.includes(keyword)) {
          return {
            country,
            confidence: 0.8,
            keyword
          };
        }
      }
    }

    return { country: null, confidence: 0 };
  }

  /**
   * 🔗 Check external URL for country indicators
   */
  checkUrlForLocation(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      // Check for country-specific TLDs
      if (domain.endsWith('.co.uk') || domain.endsWith('.uk')) {
        return { country: 'UK', confidence: 0.6 };
      }
      if (domain.endsWith('.com.au') || domain.endsWith('.au')) {
        return { country: 'AU', confidence: 0.6 };
      }
      if (domain.endsWith('.us')) {
        return { country: 'US', confidence: 0.6 };
      }

      return { country: null, confidence: 0 };
    } catch (error) {
      return { country: null, confidence: 0 };
    }
  }

  /**
   * 📮 Validate shipping address before product shipment
   */
  async validateShippingAddress(addressText) {
    const validation = {
      valid: false,
      country: null,
      confidence: 0,
      components: {},
      flags: []
    };

    try {
      const addressLower = addressText.toLowerCase();
      
      // Extract potential components
      validation.components = this.extractAddressComponents(addressText);
      
      // Determine country from address
      for (const [country, data] of Object.entries(this.countryPatterns)) {
        // Check for country keywords
        for (const keyword of data.keywords) {
          if (addressLower.includes(keyword)) {
            validation.country = country;
            validation.confidence += 0.5;
            break;
          }
        }
        
        // Check postal code pattern
        if (validation.components.postalCode && data.zipPattern.test(validation.components.postalCode)) {
          if (validation.country && validation.country !== country) {
            validation.flags.push('postal_code_mismatch');
          } else {
            validation.country = country;
            validation.confidence += 0.3;
          }
        }
        
        // Check phone pattern if provided
        if (validation.components.phone && data.phonePattern.test(validation.components.phone)) {
          validation.confidence += 0.2;
        }
      }

      // Validate completeness
      const requiredFields = ['name', 'street', 'city'];
      const missingFields = requiredFields.filter(field => !validation.components[field]);
      
      if (missingFields.length > 0) {
        validation.flags.push(`missing_${missingFields.join('_')}`);
      }

      validation.valid = validation.country && 
                        this.targetCountries.includes(validation.country) && 
                        missingFields.length === 0;
      
      validation.confidence = Math.min(validation.confidence, 1.0);

      return validation;

    } catch (error) {
      console.error('Error validating address:', error);
      return {
        valid: false,
        country: null,
        confidence: 0,
        components: {},
        flags: ['validation_error']
      };
    }
  }

  /**
   * 🏠 Extract address components from text
   */
  extractAddressComponents(addressText) {
    const components = {};
    const lines = addressText.split('\n').map(line => line.trim()).filter(line => line);
    
    // Try to extract name (usually first line)
    if (lines.length > 0) {
      components.name = lines[0];
    }
    
    // Try to extract postal code
    const postalCodeMatch = addressText.match(/\b(\d{5}(-\d{4})?|\d{4}|[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2})\b/i);
    if (postalCodeMatch) {
      components.postalCode = postalCodeMatch[1];
    }
    
    // Try to extract phone number
    const phoneMatch = addressText.match(/(\+?[\d\s\-\(\)\.]{10,})/);
    if (phoneMatch) {
      components.phone = phoneMatch[1].trim();
    }
    
    // Extract street (lines that aren't name, city, or contain postal code)
    components.street = lines.slice(1).find(line => 
      !this.looksLikeCity(line) && 
      !line.includes(components.postalCode || 'NOMATCHES')
    ) || '';
    
    // Extract city (line that looks like city/state/country)
    components.city = lines.find(line => this.looksLikeCity(line)) || '';
    
    return components;
  }

  /**
   * 🏙️ Check if a line looks like a city/state/country
   */
  looksLikeCity(line) {
    const cityPatterns = [
      /^[A-Za-z\s]+,\s*[A-Za-z\s]+$/, // City, State
      /^[A-Za-z\s]+,\s*[A-Z]{2}$/, // City, ST
      /\b(city|state|province|country)\b/i,
    ];
    
    return cityPatterns.some(pattern => pattern.test(line)) ||
           Object.values(this.countryPatterns).some(data => 
             data.keywords.some(keyword => line.toLowerCase().includes(keyword))
           );
  }

  /**
   * 🚚 Pre-shipment verification workflow
   */
  async preShipmentVerification(influencerData, shippingAddress) {
    const verification = {
      approved: false,
      country: null,
      confidence: 0,
      checks: {},
      flags: [],
      recommendation: 'manual_review'
    };

    try {
      // 1. Verify influencer location
      verification.checks.influencer_location = await this.verifyInfluencerLocation(influencerData);
      
      // 2. Validate shipping address
      verification.checks.shipping_address = await this.validateShippingAddress(shippingAddress);
      
      // 3. Cross-check consistency
      if (verification.checks.influencer_location.country && 
          verification.checks.shipping_address.country &&
          verification.checks.influencer_location.country !== verification.checks.shipping_address.country) {
        verification.flags.push('location_address_mismatch');
      }
      
      // 4. Determine final country and confidence
      const addressCountry = verification.checks.shipping_address.country;
      const profileCountry = verification.checks.influencer_location.country;
      
      if (addressCountry && this.targetCountries.includes(addressCountry)) {
        verification.country = addressCountry;
        verification.confidence = verification.checks.shipping_address.confidence;
        
        if (profileCountry === addressCountry) {
          verification.confidence += 0.2; // Bonus for consistency
        }
      }
      
      // 5. Make recommendation
      if (verification.confidence >= 0.8 && verification.flags.length === 0) {
        verification.recommendation = 'auto_approve';
        verification.approved = true;
      } else if (verification.confidence >= 0.6 && verification.flags.length <= 1) {
        verification.recommendation = 'conditional_approve';
        verification.approved = true;
      } else if (verification.confidence < 0.3 || verification.flags.includes('location_address_mismatch')) {
        verification.recommendation = 'reject';
        verification.approved = false;
      } else {
        verification.recommendation = 'manual_review';
        verification.approved = false;
      }

      return verification;

    } catch (error) {
      console.error('Error in pre-shipment verification:', error);
      return {
        approved: false,
        country: null,
        confidence: 0,
        checks: {},
        flags: ['verification_error'],
        recommendation: 'manual_review'
      };
    }
  }

  /**
   * 📊 Get geo-verification statistics
   */
  async getVerificationStats() {
    try {
      const { getDb } = require('./database');
      const db = getDb();
      
      const snapshot = await db.collection('influencers').get();
      
      const stats = {
        total_verified: 0,
        by_country: {},
        confidence_distribution: {
          high: 0,    // > 0.8
          medium: 0,  // 0.5-0.8
          low: 0      // < 0.5
        },
        flags: {}
      };
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const geoData = data.geo_verification;
        
        if (geoData) {
          stats.total_verified++;
          
          if (geoData.country) {
            stats.by_country[geoData.country] = (stats.by_country[geoData.country] || 0) + 1;
          }
          
          if (geoData.confidence > 0.8) {
            stats.confidence_distribution.high++;
          } else if (geoData.confidence > 0.5) {
            stats.confidence_distribution.medium++;
          } else {
            stats.confidence_distribution.low++;
          }
          
          if (geoData.flags) {
            geoData.flags.forEach(flag => {
              stats.flags[flag] = (stats.flags[flag] || 0) + 1;
            });
          }
        }
      });
      
      return stats;
      
    } catch (error) {
      console.error('Error getting verification stats:', error);
      return null;
    }
  }
}

module.exports = new GeoVerificationService(); 