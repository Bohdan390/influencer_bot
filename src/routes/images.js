const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * Image proxy endpoint to handle cross-origin issues
 * GET /api/images/proxy?url=<encoded_image_url>
 */
router.get('/proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    // Decode the URL
    const imageUrl = decodeURIComponent(url);
    
    // Validate that it's a valid image URL
    if (!isValidImageUrl(imageUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image URL'
      });
    }

    console.log(`🖼️ Proxying image: ${imageUrl}`);

    // Fetch the image with proper headers
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'Referer': 'https://www.instagram.com/'
      },
      maxRedirects: 5
    });

    // Set appropriate headers for the response
    res.set({
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Content-Length': response.headers['content-length'],
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    // Pipe the image data to the response
    response.data.pipe(res);

  } catch (error) {
    console.error('❌ Error proxying image:', error.message);
    
    // Return a 1x1 transparent pixel as fallback
    const transparentPixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': transparentPixel.length,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    
    res.send(transparentPixel);
  }
});

/**
 * Validate if the URL is a valid image URL
 */
function isValidImageUrl(url) {
  try {
    const parsedUrl = new URL(url);
    
    // Check if it's a valid protocol
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Check if it's from a trusted domain (Instagram, etc.)
    const trustedDomains = [
      'instagram.com',
      'cdninstagram.com',
      'fbcdn.net',
      'scontent.cdninstagram.com',
      'scontent-*.cdninstagram.com',
      'unsplash.com',
      'images.unsplash.com'
    ];
    
    const hostname = parsedUrl.hostname.toLowerCase();
    
    return trustedDomains.some(domain => {
      if (domain.includes('*')) {
        const pattern = domain.replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(hostname);
      }
      return hostname === domain || hostname.endsWith('.' + domain);
    });
    
  } catch (error) {
    return false;
  }
}

/**
 * Get image info without downloading the full image
 * GET /api/images/info?url=<encoded_image_url>
 */
router.get('/info', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    const imageUrl = decodeURIComponent(url);
    
    if (!isValidImageUrl(imageUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image URL'
      });
    }

    // Make a HEAD request to get image info
    const response = await axios.head(imageUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });

    res.json({
      success: true,
      info: {
        url: imageUrl,
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length'],
        lastModified: response.headers['last-modified'],
        etag: response.headers['etag']
      }
    });

  } catch (error) {
    console.error('❌ Error getting image info:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get image info'
    });
  }
});

module.exports = router;
