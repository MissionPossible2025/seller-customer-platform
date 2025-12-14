# Mobile Image Loading - Debug Guide

## Changes Made

### 1. Enhanced `resolveImageUrl()` function
- Now replaces `localhost` and `127.0.0.1` in URLs with your actual IP address
- Handles both absolute URLs (from database) and relative paths
- Logs URL transformations to console for debugging

### 2. Server Configuration
- Server now listens on `0.0.0.0` (all network interfaces) instead of just `localhost`
- This allows mobile devices on the same network to access the server

### 3. Error Handling
- Added `handleImageError()` helper function for better image error recovery

## Required Environment Variables

### Backend `.env`:
```env
PUBLIC_BASE_URL=http://YOUR_IP:5000
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

### Customer App `.env`:
```env
VITE_API_URL=http://YOUR_IP:5000/api
```

**Replace `YOUR_IP` with your actual IP address (e.g., `192.168.0.228`)**

## Testing Steps

### 1. Find Your IP Address
**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.0.228`)

**Mac/Linux:**
```bash
ifconfig
```
Look for your network interface IP

### 2. Update Environment Variables
- Set `PUBLIC_BASE_URL` in `backend/.env`
- Set `VITE_API_URL` in `customer-app/.env`
- **Restart both servers** after updating

### 3. Verify Server is Accessible
On your mobile device, open browser and go to:
```
http://YOUR_IP:5000
```
You should see: "Server is running"

### 4. Test Image Access
On mobile device, try accessing an image directly:
```
http://YOUR_IP:5000/uploads/photos-1761465041464-792540758.png
```
(Replace with an actual filename from your uploads folder)

### 5. Check Browser Console
On mobile device:
1. Open the customer app
2. Open browser developer tools (if available) or use remote debugging
3. Check console for `[resolveImageUrl]` logs
4. Check Network tab to see if image requests are being made

## Common Issues & Solutions

### Issue: Images still not loading
**Solution:**
1. Verify `PUBLIC_BASE_URL` and `VITE_API_URL` use the same IP address
2. Ensure both use `http://` (not `https://`) unless you have SSL
3. Check firewall allows connections on port 5000
4. Verify mobile device is on the same network
5. Check browser console for errors

### Issue: "Network request failed" on mobile
**Solution:**
- Server might not be listening on all interfaces
- Restart backend server after changes
- Verify server shows: "Server running on port 5000" and "Accessible at: http://localhost:5000"

### Issue: Images load on desktop but not mobile
**Solution:**
- Desktop might be using `localhost` which works locally
- Mobile needs the actual IP address
- Check that `VITE_API_URL` is set correctly in `customer-app/.env`
- Clear browser cache on mobile device

### Issue: Console shows localhost URLs
**Solution:**
- Old products in database might have localhost URLs
- The `resolveImageUrl()` function should replace them automatically
- Check console logs to see if replacement is happening
- If not, verify `VITE_API_URL` is set correctly

## Debugging Commands

### Check if server is accessible from mobile:
```bash
# On your computer, test if server responds
curl http://YOUR_IP:5000
```

### Check environment variables are loaded:
```javascript
// In browser console on mobile device
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
```

### Test image URL resolution:
```javascript
// In browser console
import resolveImageUrl from './utils/imageUtils';
console.log(resolveImageUrl('/uploads/photo-123.jpg'));
console.log(resolveImageUrl('http://localhost:5000/uploads/photo-123.jpg'));
```

## Expected Behavior

1. **Desktop (localhost):** Images should load using `http://localhost:5000/uploads/...`
2. **Mobile (same network):** Images should load using `http://YOUR_IP:5000/uploads/...`
3. **Console logs:** You should see `[resolveImageUrl]` messages showing URL transformations

## Next Steps

If images still don't load:
1. Share the console logs from mobile device
2. Share the Network tab showing failed image requests
3. Verify the exact error message
4. Check if `PUBLIC_BASE_URL` is set in backend `.env`


