# LiveShare - Setup Guide for 2 Phones

## Quick Start

### Step 1: Install Dependencies
```bash
npm install ws express cors
```

### Step 2: Start the Server
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

**IMPORTANT:** Note the Network IP address (e.g., `192.168.1.100`)

### Step 3: Connect Both Phones to Same WiFi

Make sure both phones are connected to the same WiFi network as your computer.

### Step 4: On Phone 1 (Sharer)

1. Open browser on Phone 1
2. Go to: `http://192.168.1.100:3000/share` (use the IP from Step 2)
3. Enter a name (e.g., "Alice")
4. Click "Start Live Sharing"
5. Allow location permissions when prompted
6. You should see "● Sharing" in green

**Check Console:**
- Open browser developer tools (if possible)
- You should see: `[SHARE] ✅ WebSocket connected`
- You should see: `[SHARE] 📍 Sending location: ...`

### Step 5: On Phone 2 (Tracker)

1. Open browser on Phone 2
2. Go to: `http://192.168.1.100:3000/track` (use the IP from Step 2)
3. You should see the map load
4. Wait a few seconds
5. You should see Phone 1's location appear as a marker on the map

**Check Console:**
- Open browser developer tools (if possible)
- You should see: `[TRACK] ✅ WebSocket connected`
- You should see: `[TRACK] 📊 Registered as tracker`
- You should see: `[TRACK] 📍 Location update from Alice: ...`

### Step 6: Verify It's Working

**On Phone 1 (Sharer):**
- Move around
- Watch the coordinates update
- Status should show "● Sharing" (green)

**On Phone 2 (Tracker):**
- You should see Phone 1's marker moving on the map
- Sidebar should show Phone 1's name
- Distance and ETA should update
- Click "Show Route" to see the route from your location to Phone 1

## Troubleshooting

### Problem: Phone 2 doesn't see Phone 1

**Check Server Console:**
- You should see: `[SERVER] 📍 Location update from Alice: ...`
- You should see: `[SERVER] 📤 Broadcasted to 1 tracker(s)`

**If you see "Broadcasted to 0 tracker(s)":**
- Phone 2's WebSocket is not connected
- Check Phone 2's browser console for errors
- Make sure Phone 2 is using the correct IP address

**Check Phone 2 Browser Console:**
- Should see: `[TRACK] ✅ WebSocket connected`
- Should see: `[TRACK] 📨 Received message type: location`

### Problem: WebSocket Connection Failed

**On Phone:**
- Make sure you're using the Network IP (not localhost)
- Check firewall settings on your computer
- Try accessing `http://192.168.1.100:3000/share` first to verify connection

**On Computer:**
- Check Windows Firewall allows port 3000
- Make sure server is running
- Check server console for connection logs

### Problem: Location Not Updating

**On Phone 1:**
- Check browser location permissions
- Make sure GPS is enabled
- Check browser console for errors
- Try refreshing the page

**On Server:**
- Check console for: `[SERVER] 📍 Location update from ...`
- If you don't see this, Phone 1 is not sending data

### Problem: Map Not Loading

- Check internet connection (needed for OpenStreetMap tiles)
- Try refreshing the page
- Check browser console for errors

## Testing Checklist

- [ ] Server starts without errors
- [ ] Phone 1 can access share.html
- [ ] Phone 1 can start sharing (green status)
- [ ] Phone 2 can access track.html
- [ ] Phone 2 sees Phone 1's marker on map
- [ ] Phone 1's marker moves when Phone 1 moves
- [ ] Route calculation works on Phone 2
- [ ] Distance and ETA update correctly

## Console Logs to Watch

### Server Console:
```
[SERVER] New WebSocket connection from ...
[SERVER] 📍 Location update from Alice: ...
[SERVER] 📤 Broadcasted to 1 tracker(s)
[SERVER] 📊 Tracker registered
```

### Phone 1 (Share) Console:
```
[SHARE] ✅ WebSocket connected
[SHARE] 📍 Sending location: ...
```

### Phone 2 (Track) Console:
```
[TRACK] ✅ WebSocket connected
[TRACK] 📊 Registered as tracker
[TRACK] 📍 Location update from Alice: ...
[TRACK] 🎯 Creating new marker for Alice
```

## Common Issues

1. **"Connection refused"** - Server not running or wrong IP
2. **"WebSocket closed"** - Network issue or server restart
3. **No markers appear** - Check WebSocket connection and server logs
4. **Marker doesn't move** - Check if location updates are being sent

## Success Indicators

✅ **Server:** Shows location updates and broadcasts  
✅ **Phone 1:** Shows "● Sharing" in green, coordinates updating  
✅ **Phone 2:** Shows marker on map, sidebar shows user, route works  

---

**Need Help?** Check the browser console and server console for detailed logs!
