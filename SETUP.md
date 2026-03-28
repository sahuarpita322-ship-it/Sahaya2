# Quick Setup Guide - LiveShare (No API Keys!)

## Step 1: Install Dependencies
```bash
npm install ws express cors
```

## Step 2: Start the Server

```bash
node server.js
```

You'll see output like:
```
==================================================
🚀 Location Tracking Server Running
==================================================
📱 Local:   http://localhost:3000
🌐 Network: http://192.168.1.100:3000
🔌 WebSocket: ws://192.168.1.100:3000
==================================================
```

**That's it! No API keys needed!** 🎉

## Step 3: Access the Application

### On Your Computer:
- Share Page: http://localhost:3000/share
- Track Page: http://localhost:3000/track

### On Other Devices (Same WiFi):
- Share Page: http://192.168.1.100:3000/share (use the IP shown in console)
- Track Page: http://192.168.1.100:3000/track

## Testing with Multiple Devices

1. **Device 1**: Open `share.html`, enter name "Alice", click "Start Live Sharing"
2. **Device 2**: Open `share.html`, enter name "Bob", click "Start Live Sharing"
3. **Device 3** (or same device): Open `track.html` to see both users on the map

## Features

✅ **No API Keys Required** - Uses free OpenStreetMap and OSRM  
✅ **Real-time Tracking** - Updates every 2 seconds  
✅ **Route Calculation** - Click "Show Route" to see driving directions  
✅ **Marker Rotation** - Markers rotate based on movement direction  
✅ **Dark Mode** - Toggle in the sidebar header  
✅ **Mobile Friendly** - Works great on phones  

## Troubleshooting

### "WebSocket connection failed"
- Make sure server is running
- Use the network IP (not localhost) for other devices
- Check firewall allows port 3000

### "Map not loading"
- Check internet connection (needed for map tiles)
- Verify Leaflet.js is loading (check browser console)

### "Location not updating"
- Allow location permissions in browser
- Use HTTPS or localhost (some browsers require this)
- Check browser console for errors

### "Route not calculating"
- Check internet connection (OSRM is a public API)
- Ensure location permissions are granted
- Try again after a few seconds

## Notes

- The server automatically detects your local IP address
- WebSocket reconnects automatically if connection drops
- Users are automatically removed after 10 seconds of inactivity
- All location data is sent in real-time via WebSocket
- Map tiles are loaded from OpenStreetMap (free, no API key)
- Routes are calculated using OSRM public API (free, no API key)

## What Makes This Different?

Unlike other tracking apps that require Google Maps API keys:
- ✅ **100% Free** - No API keys, no costs
- ✅ **Open Source** - Uses open-source technologies
- ✅ **Privacy Friendly** - No tracking by Google
- ✅ **Easy Setup** - Just install and run

Enjoy tracking! 🚀
