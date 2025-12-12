# Environment Variables Setup Guide

## For Mobile Image Loading to Work

You need to configure environment variables in **3 locations**:

---

## 1. **customer-app/.env** (Customer Frontend)

**Required Variable:**
```env
VITE_API_URL=http://192.168.0.228:5000/api
```

**Important Notes:**
- Replace `192.168.0.228` with your actual server IP address (the IP that mobile devices can access)
- Use `http://` (not `https://`) unless you have SSL configured
- Include `/api` at the end
- This is used by `resolveImageUrl()` to build full image URLs like: `http://192.168.0.228:5000/uploads/...`

**Example:**
```env
# For local development (desktop only)
VITE_API_URL=http://localhost:5000/api

# For mobile access (use your computer's IP address)
VITE_API_URL=http://192.168.0.228:5000/api
```

---

## 2. **backend/.env** (Backend Server)

**Required Variables:**
```env
PUBLIC_BASE_URL=http://192.168.0.228:5000
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

**Important Notes:**
- `PUBLIC_BASE_URL` should be the **same IP address** as `VITE_API_URL` (without `/api`)
- This is used when products are created/updated to generate image URLs in the database
- Replace `192.168.0.228` with your actual server IP address
- `PORT` defaults to 5000 if not set

**Example:**
```env
PUBLIC_BASE_URL=http://192.168.0.228:5000
PORT=5000
MONGODB_URI=mongodb://localhost:27017/your-database-name
```

---

## 3. **seller-app/.env** (Seller Frontend)

**Required Variable:**
```env
VITE_API_URL=http://192.168.0.228:5000/api
```

**Important Notes:**
- Same as customer-app - use the IP address that mobile devices can access
- Include `/api` at the end

**Example:**
```env
VITE_API_URL=http://192.168.0.228:5000/api
```

---

## How to Find Your IP Address

### Windows:
1. Open Command Prompt
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter
4. Example: `192.168.0.228`

### Mac/Linux:
1. Open Terminal
2. Type: `ifconfig` or `ip addr`
3. Look for your network interface (usually `en0` or `wlan0`)
4. Find the `inet` address (e.g., `192.168.0.228`)

---

## Quick Setup Checklist

- [ ] Create `customer-app/.env` with `VITE_API_URL=http://YOUR_IP:5000/api`
- [ ] Create `backend/.env` with `PUBLIC_BASE_URL=http://YOUR_IP:5000`
- [ ] Create `seller-app/.env` with `VITE_API_URL=http://YOUR_IP:5000/api`
- [ ] Replace `YOUR_IP` with your actual IP address (e.g., `192.168.0.228`)
- [ ] Restart all servers after creating/updating .env files
- [ ] Ensure your firewall allows connections on port 5000
- [ ] Test on mobile device using the same network

---

## Testing

After setting up:
1. Start backend server: `cd backend && npm start`
2. Start customer app: `cd customer-app && npm run dev`
3. On mobile device, open browser and go to: `http://YOUR_IP:5173` (or your Vite port)
4. Images should now load correctly!

---

## Troubleshooting

**Images still not loading on mobile?**
- Verify `VITE_API_URL` matches your server IP
- Verify `PUBLIC_BASE_URL` matches your server IP (without `/api`)
- Check that backend server is accessible from mobile: `http://YOUR_IP:5000`
- Check firewall settings
- Ensure mobile device is on the same network
- Check browser console on mobile for errors


