# Sahaya Project - AI Developer Prompt & Description

Here is a comprehensive description of the "Sahaya" project, containing every pinch of detail required for another AI to understand, debug, or further develop the application.

---

## 📋 Copy-Paste Prompt for Other AI Assistants

Copy and paste the text below into any AI chat to give it full context of the Sahaya project:

```text
Act as an Expert Full-Stack Web Developer. I am working on a project named **Sahaya**, a local help and emergency services web application specifically tailored for rural and semi-urban users (currently localized with data for Brahmapur, Odisha). 

Here is the complete context and "every pinch of detail" about the project's current state, architecture, and features. Please read this carefully as I will ask you to help me develop it further or debug issues.

### 1. Project Overview
- **Name**: Sahaya (meaning "Help")
- **Purpose**: Quick access to emergency services (ambulance, police, fire), nearby hospitals, blood banks, and government health schemes.
- **Tech Stack**:
  - **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (Vanilla ES6), Leaflet.js (for map rendering).
  - **Backend**: Node.js, Express.js, WebSocket (`ws` library).
  - **Authentication**: JWT (JSON Web Tokens) for Ambulance Driver Login.
- **Languages Supported**: English, Hindi, and Odia (via a custom dictionary and SpeechSynthesis API for voice instructions).

### 2. File Structure & Primary Files
- `index.html`: The main landing page. Features hero section, language toggle, immediate emergency buttons (108, 100, 101), "Send Emergency" with live location via WebSocket, Child Lock toggle, and a Voice Assistant toggle.
- `server.js`: Node.js Express & WebSocket server. Handles serving static files, driver authentication (`/api/driver-login`), and real-time WebSocket communication for tracking users, assigning drivers to emergencies, and broadcasting locations.
- `script.js`: Contains all the frontend logic:
  - Mock data arrays (`hospitals`, `bloodBanks`, `healthSchemes`).
  - Geolocation operations (distance calculation using Haversine formula).
  - UI population (generating HTML cards for hospitals/blood banks).
  - SpeechSynthesis logic (`speakText`).
  - The local Dispatch System fallback (using localStorage and BroadcastChannel).
  - Firebase fallback logic (if `firebase-config.js` is provided).
- `package.json`: Dependencies include `express`, `ws`, `jsonwebtoken`, `dotenv`, and `cors`.
- `style.css`: Contains the UI styling (modern, cards, responsive grids).
- `manifest.json` & `sw.js`: Setup for PWA (Progressive Web App) to allow offline caching or installation to home screen.
- Other Pages: `hospital.html`, `blood.html`, `emergency.html`, `schemes.html`, `driver.html`, `user.html`, `share.html`, `track.html`

### 3. Core Features & Data Flow
1. **Real-time Emergency & Ambulance Tracking**:
   - Uses WebSockets in `server.js`.
   - Users open the app, it grabs their GPS via `navigator.geolocation`.
   - Pressing "Send Emergency" sends a JSON message via WebSocket to the server: `{ type: "emergency", lat: ..., lng: ... }`.
   - Drivers (connected via `driver.html` and authenticated as `role: "driver"`) receive the "newRequest" broadcast.
   - Driver accepts (`acceptRequest`), and their location is broadcasted to the tracking map.
2. **Hospital & Blood Bank Finders**:
   - `script.js` holds static JSON-like arrays for `hospitals` and `bloodBanks`.
   - Evaluates user's GPS coords against hospital coords to calculate distance in KM.
   - UI provides "Call Hospital", "Call Ambulance", and Google Maps Directions links.
3. **Voice Assistant**:
   - Pressing "Listen instructions" reads the localized `translations` object text via the browser's `SpeechSynthesis API`.
4. **Child Lock**:
   - Implemented via `localStorage.getItem("childLockPassword")`. Protects emergency buttons from accidental clicks by requiring a PIN to unlock.

### 4. Important Implementation Quirks to Know
- **Map Library**: We use Leaflet map with OpenStreetMap tiles (`L.tileLayer`).
- **Ping/Pong keepalive**: `server.js` sends a keepalive ping every 30s to prevent WebSocket connection timeouts on deployments (like Railway or Render).
- **Hardcoded Coordinates**: Hospital data in `script.js` has preset `lat` and `lng` for distance calculations. Default map view is set near 20.2961, 85.8245 (Bhubaneswar/Odisha region).
- **Environment Variables**: Server uses `.env` for `PORT`, `DRIVER_PIN` (default: "1234"), and `JWT_SECRET`.

### Goal
Keep this architecture and behavior in mind. Any changes should maintain Vanilla JS simplicity on the frontend, preserve localization files, and ensure the WebSocket logic remains robust. I will now ask you specific questions or request specific features based on this context. Let me know if you are ready!
```

---

## 🛠️ Detailed Breakdown of Code (For Your Reference)

### **Backend (`server.js`)**
- **Express App**: Serves the root directory files as static assets.
- **REST APIs**: 
  - `POST /api/driver-login`: Accepts a `{ pin }`. If it matches `DRIVER_PIN`, generates a JWT token for "8h".
  - `POST /api/verify-driver`: Validates the JWT token.
- **WebSocket System**:
  - `wss.on("connection")` handles different socket logic pathways.
  - `activeUsers`, `trackers`, `drivers`, `pendingRequests` are stored in-memory using JS `Map` and `Set`.
  - Recognizes types of messages: `location`, `tracker`, `driver`, `emergency`, `shareRequest`, `acceptRequest`, `rejectRequest`, `locationUpdate`.

### **Frontend (`script.js`)**
- **Data Layers**: Contains `bloodBanks`, `hospitals`, and `healthSchemes` arrays with localized data.
- **Location Math**: Uses the `getDistance()` function incorporating `deg2rad` to perform the Haversine formula calculation.
- **UI Renderers**: `showHospitals()`, `showBloodBanks()`, `showSchemes()` programmatically generate innerHTML templates.
- **Translations Object**: Stores strings in `en` (English), `hi` (Hindi), and `or` (Odia). The `setLanguage(lang)` updates elements across the DOM automatically based on their context or tag logic.
- **Event Listeners**: Initiates PWA service worker (`sw.js`). Initializes Google Maps iFrame or Leaflet maps. Hooks up emergency dispatch request mockups locally or remotely via WS.

### **Frontend (`index.html`)**
- Uses Semantic HTML for Navigation layout.
- Hero layout offers clear, chunky, accessible buttons for various routes.
- Inline JS script at the bottom establishes Leaflet Maps (`initMap`) and the primary WebSocket (`initWebSocket`), overriding the fallback tools defined in `script.js`. All WebSockets point directly to the host relative URL.

### **Future Improvements to Prompt AI about:**
1. Moving hardcoded arrays from `script.js` to a real Database (MongoDB / PostgreSQL) using Mongoose/Prisma.
2. Expanding the Leaflet maps to route multiple drivers.
3. Adding complete Authentication for normal users (User Accounts).
