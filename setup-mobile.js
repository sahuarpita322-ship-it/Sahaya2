const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("=========================================");
console.log("🚀 Starting Sahaya Mobile App Setup...");
console.log("=========================================\n");

try {
  // 1. Create Expo app
  console.log("📦 1/4 Creating Expo project 'sahaya-mobile'...");
  console.log("   (This will download the React Native template and may take a minute or two)");
  execSync('npx create-expo-app sahaya-mobile --template blank', { stdio: 'inherit' });

  const mobilePath = path.join(__dirname, 'sahaya-mobile');

  // 2. Install dependencies
  console.log("\n📥 2/4 Installing Maps and Location dependencies...");
  execSync('npx expo install react-native-maps expo-location', { cwd: mobilePath, stdio: 'inherit' });

  // 3. Write App.js
  console.log("\n✍️  3/4 Writing React Native App.js logic...");
  const appJsCode = `import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, TextInput } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function App() {
  const [location, setLocation] = useState(null);
  const [ws, setWs] = useState(null);
  const [serverIp, setServerIp] = useState("192.168.1.x"); 
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please enable location permissions');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      setLocation(loc.coords);
    })();
  }, []);

  const connectToServer = () => {
    if (ws) ws.close();
    const socket = new WebSocket(\`ws://\${serverIp}:5500\`);
    
    socket.onopen = () => {
      setIsConnected(true);
      Alert.alert('Connected', 'Successfully connected to Sahaya server!');
      socket.send(JSON.stringify({ type: 'tracker' }));
    };

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'requestAccepted') {
        Alert.alert('Ambulance on the way!', 'A driver has accepted your request.');
      }
    };

    socket.onerror = () => {
      setIsConnected(false);
      Alert.alert('Connection Error', 'Could not connect. Ensure your PC and phone are on the same Wi-Fi and the IP is correct.');
    };

    socket.onclose = () => setIsConnected(false);

    setWs(socket);
  };

  const sendEmergency = () => {
    if (!isConnected) {
      Alert.alert("Not Connected", "Please connect to the server first.");
      return;
    }
    if (ws && location) {
      ws.send(JSON.stringify({
        type: 'emergency',
        userId: 'RN_User_' + Math.floor(Math.random() * 10000),
        lat: location.latitude,
        lng: location.longitude
      }));
      Alert.alert("SOS Sent!", "Broadcasting your location to nearby drivers.");
    } else {
      Alert.alert("Waiting for GPS...", "Please wait a moment for location lock.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Sahaya Emergency</Text>
      </View>

      <View style={styles.networkConfig}>
        <TextInput 
          style={styles.input} 
          value={serverIp} 
          onChangeText={setServerIp} 
          placeholder="Enter PC Local IP" 
        />
        <TouchableOpacity style={styles.connectBtn} onPress={connectToServer}>
          <Text style={styles.connectText}>{isConnected ? "Connected" : "Connect"}</Text>
        </TouchableOpacity>
      </View>

      {location ? (
        <MapView 
          style={styles.map} 
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          <Marker 
            coordinate={{ latitude: location.latitude, longitude: location.longitude }} 
            title="You are here" 
          />
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text>Finding your location...</Text>
        </View>
      )}
      
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.sosButton, !isConnected && {backgroundColor: '#ccc'}]} 
          onPress={sendEmergency}
        >
          <Text style={styles.sosText}>🚑 REQUEST AMBULANCE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  header: { paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', alignItems: 'center', elevation: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#e53e3e' },
  networkConfig: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  input: { flex: 2, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginRight: 10 },
  connectBtn: { flex: 1, backgroundColor: '#4299e1', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  connectText: { color: 'white', fontWeight: 'bold' },
  map: { flex: 2 },
  loadingContainer: { flex: 2, justifyContent: 'center', alignItems: 'center' },
  controls: { padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sosButton: { 
    backgroundColor: '#f56565', 
    padding: 20, 
    borderRadius: 15, 
    alignItems: 'center',
    elevation: 8,
  },
  sosText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
`;

  fs.writeFileSync(path.join(mobilePath, 'App.js'), appJsCode);
  
  // 4. Update app.json permissions for Android
  console.log("⚙️  4/4 Configuring Android permissions...");
  const appJsonPath = path.join(mobilePath, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    let appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    if (!appJson.expo.android) appJson.expo.android = {};
    appJson.expo.android.permissions = ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"];
    appJson.expo.android.package = "com.sahaya.mobile";
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  }

  console.log("\n=========================================");
  console.log("✅ SETUP COMPLETE! ");
  console.log("=========================================");
  console.log("To launch the app on your phone:");
  console.log("  1. Open your terminal");
  console.log("  2. Type: cd sahaya-mobile");
  console.log("  3. Type: npx expo start");
  console.log("  4. Download 'Expo Go' on your phone and scan the QR code!");

} catch (error) {
  console.error("\n❌ Setup failed:", error.message);
}
