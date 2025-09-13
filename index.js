const express = require('express');
const { createCanvas, loadImage } = require('canvas');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

/**
 * Crop image based on specifications:
 * - Target size: 2.620x3.620 inches
 * - Remove 0.12 inches from all borders
 * @param {Buffer} imageBuffer - The image buffer to crop
 * @returns {Buffer} - The cropped image buffer
 */
async function cropImage(imageBuffer) {
  try {
    // Load the image
    const image = await loadImage(imageBuffer);
    
    // Calculate DPI based on target size of 2.620x3.620 inches
    const targetWidthInches = 2.620;
    const targetHeightInches = 3.620;
    
    // Calculate DPI from original image dimensions
    const dpiX = image.width / targetWidthInches;
    const dpiY = image.height / targetHeightInches;
    
    // Use average DPI for consistent cropping
    const avgDPI = (dpiX + dpiY) / 2;
    
    // Calculate pixels to remove (0.12 inches from each side)
    const borderInches = 0.12;
    const borderPixels = Math.round(borderInches * avgDPI);
    
    // Calculate new dimensions after cropping
    const newWidth = image.width - (borderPixels * 2);
    const newHeight = image.height - (borderPixels * 2);
    
    // Ensure we don't crop more than the image size
    if (newWidth <= 0 || newHeight <= 0) {
      throw new Error('Image too small to crop with specified border');
    }
    
    // Create canvas with new dimensions
    const canvas = createCanvas(newWidth, newHeight);
    const ctx = canvas.getContext('2d');
    
    // Draw the cropped image
    ctx.drawImage(
      image,
      borderPixels, borderPixels, newWidth, newHeight, // Source rectangle
      0, 0, newWidth, newHeight // Destination rectangle
    );
    
    // Return the cropped image as buffer
    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error cropping image:', error);
    throw error;
  }
}

/**
 * Endpoint to proxy and crop images from img.mpcautofill.com
 * Route: GET /image/:id
 * @param {string} id - The image ID to fetch
 */
app.get('/image/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Image ID is required' });
    }
    
    // Construct the URL for the original image
    const imageUrl = `https://img.mpcautofill.com/${id}-large-google_drive`;
    
    console.log(`Fetching image from: ${imageUrl}`);
    
    // Fetch the image from the external API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'mpcfill-cropper/1.0.0'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    
    // Check if we got a valid image response
    if (response.status !== 200) {
      return res.status(response.status).json({ 
        error: `Failed to fetch image: ${response.statusText}` 
      });
    }
    
    // Convert to buffer
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    
    // Crop the image
    const croppedImageBuffer = await cropImage(imageBuffer);
    
    // Set appropriate headers
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': croppedImageBuffer.length,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'X-Original-URL': imageUrl
    });
    
    // Send the cropped image
    res.send(croppedImageBuffer);
    
  } catch (error) {
    console.error('Error processing image:', error);
    
    // Handle AbortController timeout
    if (error.name === 'AbortError') {
      return res.status(504).json({ 
        error: 'Request timeout while fetching image' 
      });
    }
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.cause?.code === 'ENOTFOUND') {
      return res.status(502).json({ 
        error: 'Unable to reach image server' 
      });
    }
    
    // Handle fetch errors (network issues)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return res.status(502).json({ 
        error: 'Network error while fetching image' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to process image',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'mpcfill-cropper'
  });
});

// Root endpoint with API info
app.get('/', (req, res) => {
  res.json({
    name: 'MPC Fill Cropper API',
    version: '1.0.0',
    description: 'API to crop images from img.mpcautofill.com',
    endpoints: {
      'GET /image/:id': 'Fetch and crop image by ID',
      'GET /health': 'Health check',
      'GET /': 'API information'
    },
    usage: {
      example: '/image/your-image-id',
      description: 'Fetches image from img.mpcautofill.com/{id}-large-google_drive and crops it'
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 MPC Fill Cropper API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API info: http://localhost:${PORT}/`);
  console.log(`🖼️  Image endpoint: http://localhost:${PORT}/image/{id}`);
});

module.exports = app;
