# LiveShare - Real-Time Location Tracking System

A professional, Uber-style real-time location tracking web application built with Node.js, Express, WebSocket, Leaflet.js, and OpenStreetMap. **No API keys required!**

## 🚀 Features

- **Real-time GPS Tracking** - Multiple users can share their location simultaneously
- **Live Dashboard** - Professional tracking interface with Leaflet maps
- **Route Calculation** - Real road routing using OSRM public API (free, no API key)
- **Mobile-Friendly** - Fully responsive design optimized for mobile devices
- **Modern UI** - Beautiful gradient design with glassmorphism effects
- **Auto-Reconnect** - Automatic WebSocket reconnection on disconnect
- **Smooth Animations** - Animated marker movements with rotation based on direction
- **Dark Mode** - Toggle between light and dark themes
- **No API Keys** - Completely free, works without any API keys

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Two or more devices on the same WiFi network (for testing)

## 🛠️ Installation

1. **Install Dependencies**
   ```bash
   npm install ws express cors
   ```

2. **That's it!** No API keys needed. The app uses:
   - OpenStreetMap tiles (free, no API key)
   - OSRM public routing API (free, no API key)

## 🏃 Running the Application Locally

1. **Environment Variables**
   Create a `.env` file in the root directory (this is already in `.gitignore`):
   ```env
   PORT=5500
   DRIVER_PIN=1234
   JWT_SECRET=sahaya_super_secret_change_this_in_prod
   NODE_ENV=development
   ```

2. **Start the Server**
   Use the `dev` script to automatically restart the server on file changes:
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - The server resolves your local IP address automatically.
   - Open your browser and navigate to:
     - **Homepage**: `http://localhost:5000/`
     - **Share Page**: `http://localhost:5500/share.html`
     - **Track Page**: `http://localhost:5500/track.html`
     - **Driver Dashboard**: `http://localhost:5500/driver.html` (Requires PIN: `1234`)

4. **For Same WiFi Testing**
   - Use the network IP address (e.g., `http://192.168.1.100:5000/`)
   - Use the network IP address (e.g., `http://192.168.1.100:5500/`)

## � Deployment (Railway & Render)

Sahaya comes pre-configured for free-tier deployments!

### Deploying to Railway
1. Push your code to GitHub.
2. Go to [Railway](https://railway.app), create a New Project from GitHub.
3. Railway automatically detects `railway.toml`.
4. Add these Environment Variables in your Railway dashboard:
   - `DRIVER_PIN`: Your chosen PIN for ambulance drivers.
   - `JWT_SECRET`: A secure, random string for authentication.
   - `NODE_ENV`: `production`
5. Railway assigns a secure `https://` domain, and WebSockets (`wss://`) will work automatically over the single port 443!

### Deploying to Render
1. Push your code to GitHub.
2. Go to [Render](https://render.com), create a New Web Service.
3. Render automatically detects `render.yaml`.
4. Fill out the environment variables in the dashboard during setup.
5. Render also handles WebSockets and HTTPS automatically.

## � Roles & Usage

### Driver Dashboard (`driver.html`)
- Requires PIN Authentication (default: `1234`).
- Secure JWT-based auth session (persists for 8 hours in `sessionStorage`).
- Alerts pop up instantly when someone requests an emergency ambulance.
- Drivers can accept/reject requests, and the dispatcher automatically routes them.

### Share Page (`share.html`)
- Enter your name and click "Start Live Sharing"
- Location is sent securely over WebSockets every 2 seconds

### Track Page (`track.html`)
- Real-time Leaflet map displaying multiple location-sharing active users.
- Click a user to automatically calculate driving route (Free OSRM API).

## 🔒 Security & Archtiecture
- **Driver Auth**: PIN -> JWT (8h expiry). The server rejects rogue WebSockets trying to register as a driver without a valid JWT token.
- **WebSocket Keepalive**: Prevents Render/Railway free-tier timeouts.
- **Smart URLs**: Frontend dynamically resolves `ws://` vs `wss://` based on `window.location.protocol`. No hardcoded localhost logic!

---
**Built with ❤️ using Node.js, Express, WebSocket, Leaflet.js, and OpenStreetMap**
