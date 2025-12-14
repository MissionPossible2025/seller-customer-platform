// Utility to build image URLs that work on mobile and desktop
// Handles absolute URLs, API base hosts, and relative upload paths
// Replaces localhost with mobile-accessible IP address
export const resolveImageUrl = (url) => {
  if (!url) return null;
  
  // Validate URL - reject invalid URLs like "linklink" or non-URL strings
  // Check if it's a valid URL pattern (starts with http/https or is a valid path)
  const isValidUrlPattern = /^https?:\/\/|^\/uploads\/|^\/[^\/]/.test(url);
  if (!isValidUrlPattern) {
    // If it's not a valid URL pattern, it might be a placeholder or invalid data
    if (import.meta.env.DEV) {
      console.warn('[resolveImageUrl] Invalid URL pattern:', url);
    }
    return null; // Return null for invalid URLs
  }
  
  // Get the API base URL and clean it
  const apiBase = import.meta.env.VITE_API_URL || "";
  const cleanApi = apiBase.replace(/\/$/, "").replace(/\/api$/, "");
  
  // If already full http/https URL, check if it contains localhost
  if (/^https?:\/\//i.test(url)) {
    // Validate the URL structure
    try {
      new URL(url); // This will throw if URL is invalid
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[resolveImageUrl] Invalid URL format:', url);
      }
      return null;
    }
    
    // Replace localhost/127.0.0.1 or hardcoded IPs with the actual server IP for mobile compatibility
    if (cleanApi) {
      // Extract the protocol and host from cleanApi (e.g., http://192.168.0.228:5000)
      const apiMatch = cleanApi.match(/^(https?:\/\/[^\/]+)/i);
      if (apiMatch) {
        const apiHost = apiMatch[1]; // e.g., "http://192.168.0.228:5000"
        
        // Extract the hostname from the current URL to check if it needs replacement
        let urlObj;
        try {
          urlObj = new URL(url);
        } catch (e) {
          return url; // Return as-is if URL parsing fails
        }
        
        const currentHost = urlObj.hostname;
        const apiHostname = new URL(apiHost).hostname;
        
        // Replace if URL contains localhost, 127.0.0.1, or a different IP than the current API
        // This handles both old localhost URLs and hardcoded IPs like 10.253.19.114
        if (currentHost === 'localhost' || 
            currentHost === '127.0.0.1' || 
            (currentHost !== apiHostname && /^\d+\.\d+\.\d+\.\d+$/.test(currentHost))) {
          // Replace the entire origin (protocol + host + port) with the API host
          const mobileUrl = url.replace(/^https?:\/\/[^\/]+/i, apiHost);
          if (import.meta.env.DEV) {
            console.log('[resolveImageUrl] Replaced host:', url, '->', mobileUrl);
          }
          return mobileUrl;
        }
      }
    }
    return url;
  }

  // For relative paths starting with /uploads/, build full URL
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    
    // If we have an API base, use it
    if (cleanApi) {
      const fullUrl = `${cleanApi}${cleanPath}`;
      if (import.meta.env.DEV) {
        console.log('[resolveImageUrl] Built URL from relative path:', url, '->', fullUrl);
      }
      return fullUrl;
    }
    
    // Fallback: use current origin (works for same-device, but not ideal for mobile)
    if (typeof window !== 'undefined') {
      const origin = window.location.origin.replace(/\/+$/, '');
      return `${origin}${cleanPath}`;
    }
  }
  
  // If it's not a valid path, return null
  if (import.meta.env.DEV) {
    console.warn('[resolveImageUrl] Unrecognized URL format:', url);
  }
  return null;
}

// Generate a data URI for placeholder image (works offline and doesn't require external service)
const generatePlaceholderImage = () => {
  // Create a simple SVG placeholder as data URI
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">No Image</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Helper function to handle image load errors and retry with corrected URL
export const handleImageError = (event, originalUrl) => {
  const img = event.target;
  if (!img) return;
  
  // Prevent infinite loop
  if (img.dataset.retried === 'true') {
    img.src = generatePlaceholderImage();
    return;
  }
  
  // Try to resolve the URL again (in case VITE_API_URL was updated)
  const resolvedUrl = resolveImageUrl(originalUrl);
  if (resolvedUrl && resolvedUrl !== img.src) {
    img.dataset.retried = 'true';
    if (import.meta.env.DEV) {
      console.log('[handleImageError] Retrying with resolved URL:', resolvedUrl);
    }
    img.src = resolvedUrl;
  } else {
    img.src = generatePlaceholderImage();
  }
}

// Export placeholder generator for direct use
export const getPlaceholderImage = generatePlaceholderImage;

export default resolveImageUrl

