// ============================================================
//  Sahaya — server.js (Deployment-Ready)
//  Fixes: .env config, HTTPS/WSS-ready, Driver PIN auth via JWT
// ============================================================
require("dotenv").config();

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ── Config ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const DRIVER_PIN = process.env.DRIVER_PIN || "1234";
const JWT_SECRET = process.env.JWT_SECRET || "sahaya_dev_secret";
const CLEANUP_INTERVAL_MS = 5000;
const USER_TIMEOUT_MS = 10000;

// ── Static file serving ──────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── REST: Driver PIN login → returns JWT ─────────────────────
app.post("/api/driver-login", (req, res) => {
  const { pin } = req.body;
  if (!pin || pin !== DRIVER_PIN) {
    return res.status(401).json({ error: "Invalid PIN" });
  }
  const token = jwt.sign({ role: "driver" }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token });
});

// ── REST: Verify driver token (used by frontend on page load) ─
app.post("/api/verify-driver", (req, res) => {
  const { token } = req.body;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "driver") throw new Error("Not a driver token");
    res.json({ valid: true });
  } catch {
    res.status(401).json({ valid: false });
  }
});

// ── In-memory stores ─────────────────────────────────────────
const activeUsers = new Map();    // userId → { lat, lng, ws, lastUpdate }
const trackers = new Set();       // WS connections viewing the map
const drivers = new Set();        // WS connections for ambulance drivers
const volunteers = new Set();     // WS connections for CFR volunteers
const pendingRequests = new Map();// requestId → { type, userId, lat, lng, timestamp, requesterWs }
const activeHazards = [];         // { lat, lng, description, timestamp }
const activeSessions = new Map(); // requestId → { userWs, driverWs }

// ── Helpers ──────────────────────────────────────────────────
function broadcast(clients, payload) {
  const msg = JSON.stringify(payload);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

function broadcastToAll(payload) {
  const msg = JSON.stringify(payload);
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

function getUsersSnapshot() {
  const users = [];
  activeUsers.forEach((data, userId) => {
    users.push({ userId, lat: data.lat, lng: data.lng });
  });
  return users;
}

// ── Helper to reliably find the correct WebSocket for chat ──
function getTargetWs(session, senderRole) {
  if (senderRole === "user") {
    if (session.driverWs && session.driverWs.readyState === WebSocket.OPEN) return session.driverWs;
    // Fallback search: find driver's active socket
    for (const dws of drivers) {
      if (dws.driverId === session.driverId && dws.readyState === WebSocket.OPEN) {
        session.driverWs = dws; // Heal
        return dws;
      }
    }
  } else {
    if (session.userWs && session.userWs.readyState === WebSocket.OPEN) return session.userWs;
    // Fallback search: find user's active socket
    const userData = activeUsers.get(session.userId);
    if (userData && userData.ws && userData.ws.readyState === WebSocket.OPEN) {
      session.userWs = userData.ws; // Heal
      return userData.ws;
    }
  }
  return null;
}

// ── WebSocket handler ─────────────────────────────────────────
wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; }); // keepalive

  ws.on("message", (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    switch (data.type) {

      // ── User broadcasts their location ──────────────────────
      case "location": {
        const { userId, lat, lng } = data;
        if (!userId || lat == null || lng == null) break;
        activeUsers.set(userId, { lat, lng, ws, lastUpdate: Date.now() });
        
        // Auto-heal User Session if their WebSocket reconnected
        activeSessions.forEach((session) => {
          if (session.userId === userId) session.userWs = ws;
        });

        const update = { type: "locationUpdate", userId, lat, lng };
        broadcast(trackers, update);
        broadcast(drivers, update);
        break;
      }

      // ── Register as a map tracker ───────────────────────────
      case "tracker": {
        trackers.add(ws);
        ws.send(JSON.stringify({ type: "allUsers", users: getUsersSnapshot() }));
        activeHazards.forEach(hazard => ws.send(JSON.stringify({ type: "hazardReported", ...hazard })));
        ws.on("close", () => trackers.delete(ws));
        break;
      }

      // ── Register as an ambulance driver ─────────────────────
      case "driver": {
        // Verify JWT token sent with the driver registration
        try {
          jwt.verify(data.token, JWT_SECRET);
        } catch {
          ws.send(JSON.stringify({ type: "error", message: "Unauthorized: invalid driver token" }));
          ws.close();
          break;
        }
        ws.driverId = data.driverId; // Attach driver ID to active socket
        drivers.add(ws);
        
        // Auto-heal Driver Session if their WebSocket reconnected
        activeSessions.forEach((session) => {
          if (session.driverId === data.driverId) session.driverWs = ws;
        });

        ws.send(JSON.stringify({ type: "allUsers", users: getUsersSnapshot() }));
        activeHazards.forEach(hazard => ws.send(JSON.stringify({ type: "hazardReported", ...hazard })));
        // Also send any pending requests
        pendingRequests.forEach((req, requestId) => {
          ws.send(JSON.stringify({ type: "newRequest", requestId, ...req }));
        });
        ws.on("close", () => drivers.delete(ws));
        break;
      }

      // ── Register as a Community First Responder (Volunteer) ──
      case "volunteer": {
        ws.volunteerId = data.volunteerId;
        volunteers.add(ws);
        ws.send(JSON.stringify({ type: "allUsers", users: getUsersSnapshot() }));
        activeHazards.forEach(hazard => ws.send(JSON.stringify({ type: "hazardReported", ...hazard })));
        pendingRequests.forEach((req, requestId) => {
          ws.send(JSON.stringify({ type: "newRequest", requestId, ...req }));
        });
        ws.on("close", () => volunteers.delete(ws));
        break;
      }

      // ── User sends emergency / share request ────────────────
      case "emergency":
      case "shareRequest": {
        const requestId = data.requestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const requestData = {
          type: data.type,
          userId: data.userId,
          lat: data.lat,
          lng: data.lng,
          triageInfo: data.triageInfo || "No triage data",
          profile: data.profile || null,
          timestamp: Date.now(),
          requesterWs: ws,
        };
        pendingRequests.set(requestId, requestData);
        const reqPayload = {
          type: "newRequest",
          requestId,
          requestType: data.type,
          userId: data.userId,
          lat: data.lat,
          lng: data.lng,
          triageInfo: requestData.triageInfo,
          profile: data.profile,
          timestamp: requestData.timestamp,
        };
        broadcast(drivers, reqPayload);
        broadcast(volunteers, reqPayload);
        ws.send(JSON.stringify({ type: "requestSent", requestId }));
        break;
      }

      // ── Driver accepts a request ─────────────────────────────
      case "acceptRequest": {
        const req = pendingRequests.get(data.requestId);
        if (!req) break;
        
        // Save active session for direct Voice Chat
        activeSessions.set(data.requestId, {
          userId: req.userId,
          userWs: req.requesterWs,
          driverId: data.driverId || data.volunteerId,
          driverWs: ws
        });

        pendingRequests.delete(data.requestId);
        const driverInfo = { driverId: data.driverId, lat: data.lat, lng: data.lng };
        // Notify the original user
        if (req.requesterWs && req.requesterWs.readyState === WebSocket.OPEN) {
          req.requesterWs.send(JSON.stringify({
            type: "requestAccepted",
            requestId: data.requestId,
            ...driverInfo,
          }));
        }
        // Tell all trackers to link this driver + user
        broadcast(trackers, {
          type: "linkDriverUser",
          requestId: data.requestId,
          userId: req.userId,
          ...driverInfo,
        });
        // Tell other drivers the request is taken
        broadcast(drivers, { type: "requestTaken", requestId: data.requestId });
        broadcast(volunteers, { type: "requestTaken", requestId: data.requestId });
        break;
      }

      // ── Driver rejects a request ─────────────────────────────
      case "rejectRequest": {
        const req = pendingRequests.get(data.requestId);
        if (!req) break;
        if (req.requesterWs && req.requesterWs.readyState === WebSocket.OPEN) {
          req.requesterWs.send(JSON.stringify({
            type: "requestRejected",
            requestId: data.requestId,
          }));
        }
        break;
      }

      // ── Voice Triage Info Update ─────────────────────────────
      case "updateTriage": {
        const req = pendingRequests.get(data.requestId);
        if (req) {
          req.triageInfo = data.triageInfo;
        }
        // Always broadcast so drivers see updates even if they already accepted the request
        broadcast(drivers, { type: "triageUpdated", requestId: data.requestId, triageInfo: data.triageInfo });
        broadcast(volunteers, { type: "triageUpdated", requestId: data.requestId, triageInfo: data.triageInfo });
        break;
      }

      // ── Live Image Chat Message (Visual Triage) ──────────────
      case "imageMessage": {
        const session = activeSessions.get(data.requestId);
        if (session) {
          // Auto-heal socket reference on message send
          if (data.senderRole === "user") session.userWs = ws;
          else session.driverWs = ws;

          const targetWs = getTargetWs(session, data.senderRole);
          if (targetWs) {
            targetWs.send(JSON.stringify({
              type: "imageMessage",
              requestId: data.requestId,
              senderRole: data.senderRole,
              imageData: data.imageData
            }));
          }
        }
        break;
      }

      // ── Live Text Chat Message ──────────────────────────────
      case "textMessage": {
        const session = activeSessions.get(data.requestId);
        if (session) {
          // Auto-heal socket reference on message send
          if (data.senderRole === "user") session.userWs = ws;
          else session.driverWs = ws;

          const targetWs = getTargetWs(session, data.senderRole);
          if (targetWs) {
            targetWs.send(JSON.stringify({
              type: "textMessage",
              requestId: data.requestId,
              senderRole: data.senderRole,
              text: data.text
            }));
          }
        }
        break;
      }

      // ── Context-Aware Hazard Engine ──────────────────────────
      case "reportHazard": {
        const hazard = { lat: data.lat, lng: data.lng, description: data.description, timestamp: Date.now() };
        activeHazards.push(hazard);
        broadcastToAll({ type: "hazardReported", ...hazard });
        break;
      }

      // ── Driver broadcasts their live location ────────────────
      case "locationUpdate": {
        // Auto-heal Driver Session if their WebSocket reconnected
        activeSessions.forEach((session) => {
          if (session.driverId === data.driverId) session.driverWs = ws;
        });

        broadcast(trackers, {
          type: "driverLocation",
          driverId: data.driverId,
          lat: data.lat,
          lng: data.lng,
        });
        // Also notify any active users tracking this driver
        activeUsers.forEach((userData) => {
          if (userData.ws && userData.ws.readyState === WebSocket.OPEN) {
            userData.ws.send(JSON.stringify({
              type: "driverLocation",
              driverId: data.driverId,
              lat: data.lat,
              lng: data.lng,
            }));
          }
        });
        break;
      }
    }
  });

  ws.on("close", () => {
    trackers.delete(ws);
    drivers.delete(ws);
    volunteers.delete(ws);
    activeUsers.forEach((val, key) => {
      if (val.ws === ws) activeUsers.delete(key);
    });
  });
});

// ── Keepalive ping every 30s (prevents Railway/Render timeout) ─
const keepAliveInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) { ws.terminate(); return; }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", () => clearInterval(keepAliveInterval));

// ── Dead connection cleanup every 5s ─────────────────────────
setInterval(() => {
  const now = Date.now();
  activeUsers.forEach((data, userId) => {
    if (now - data.lastUpdate > USER_TIMEOUT_MS) {
      activeUsers.delete(userId);
      broadcast(trackers, { type: "userLeft", userId });
    }
  });

  // Cleanup hazards older than 2 hours (7200000 ms)
  for (let i = activeHazards.length - 1; i >= 0; i--) {
    if (now - activeHazards[i].timestamp > 7200000) {
      activeHazards.splice(i, 1);
    }
  }
}, CLEANUP_INTERVAL_MS);

// ── Start ─────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`✅ Sahaya server running on port ${PORT}`);
});
