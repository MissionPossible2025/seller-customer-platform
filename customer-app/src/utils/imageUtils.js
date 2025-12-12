// Utility to build image URLs that work on mobile and desktop
// Handles absolute URLs, API base hosts, and relative upload paths
// Replaces localhost with mobile-accessible IP address
export const resolveImageUrl = (url) => {
  if (!url) return null;
  
  // Get the API base URL and clean it
  const apiBase = import.meta.env.VITE_API_URL || "";
  const cleanApi = apiBase.replace(/\/$/, "").replace(/\/api$/, "");
  
  // If already full http/https URL, check if it contains localhost
  if (/^https?:\/\//i.test(url)) {
    // Replace localhost/127.0.0.1 with the actual server IP for mobile compatibility
    if (cleanApi) {
      // Extract the protocol and host from cleanApi (e.g., http://192.168.0.228:5000)
      const apiMatch = cleanApi.match(/^(https?:\/\/[^\/]+)/i);
      if (apiMatch) {
        const apiHost = apiMatch[1]; // e.g., "http://192.168.0.228:5000"
        // Replace localhost or 127.0.0.1 in the URL with the actual IP
        const mobileUrl = url.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, apiHost);
        // Only return modified URL if it was actually changed (to avoid unnecessary replacements)
        if (mobileUrl !== url) {
          if (import.meta.env.DEV) {
            console.log('[resolveImageUrl] Replaced localhost:', url, '->', mobileUrl);
          }
          return mobileUrl;
        }
      }
    }
    return url;
  }

  // For relative paths, build full URL
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
  
  return url;
}

// Helper function to handle image load errors and retry with corrected URL
export const handleImageError = (event, originalUrl) => {
  const img = event.target;
  if (!img) return;
  
  // Prevent infinite loop
  if (img.dataset.retried === 'true') {
    img.src = 'https://via.placeholder.com/400x300?text=No+Image';
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
    img.src = 'https://via.placeholder.com/400x300?text=No+Image';
  }
}

export default resolveImageUrl

