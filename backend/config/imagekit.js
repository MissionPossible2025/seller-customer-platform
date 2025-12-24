// config/imagekit.js
// ImageKit configuration using environment variables
// All sensitive keys are loaded from .env and never exposed to the frontend

import ImageKit from 'imagekit';
import dotenv from 'dotenv';

dotenv.config();

// Validate that all required environment variables are present
const requiredEnvVars = [
  'IMAGEKIT_PUBLIC_KEY',
  'IMAGEKIT_PRIVATE_KEY',
  'IMAGEKIT_URL_ENDPOINT'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`⚠️  Warning: Missing ImageKit environment variables: ${missingVars.join(', ')}`);
  console.warn('ImageKit uploads will fail until these are set in .env file');
}

// Initialize ImageKit instance with credentials from environment variables
// This instance is used for server-side operations (upload, generate signed URLs, etc.)
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ''
});

// Export the configured ImageKit instance
export default imagekit;

// Export a function to get authentication parameters for client-side uploads
// This allows frontend to upload directly to ImageKit without exposing private key
export const getImageKitAuth = () => {
  if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY) {
    throw new Error('ImageKit credentials not configured');
  }

  // Generate authentication parameters for client-side uploads
  // This uses the private key server-side but only returns safe parameters
  const authenticationParameters = imagekit.getAuthenticationParameters();
  
  return {
    token: authenticationParameters.token,
    signature: authenticationParameters.signature,
    expire: authenticationParameters.expire,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
  };
};

