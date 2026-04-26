const bloodBanks = [
  {
    name: "District Blood Bank, Ganjam",
    location: "Brahmapur",
    phone: "9437000000",
    groups: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    status: "Available"
  },
  {
    name: "Red Cross Blood Bank",
    location: "Brahmapur",
    phone: "9438000000",
    groups: ["A+", "B+", "O+", "AB+"],
    status: "Limited"
  },
  {
    name: "MKCG Medical College Blood Bank",
    location: "Brahmapur",
    phone: "6802221234",
    groups: ["A+", "A-", "B+", "O+", "O-", "AB+", "AB-"],
    status: "Available"
  },
  {
    name: "City Hospital Blood Bank",
    location: "Brahmapur",
    phone: "6802225678",
    groups: ["B+", "B-", "O+", "AB+"],
    status: "Limited"
  },
  {
    name: "Life Care Blood Centre",
    location: "Brahmapur",
    phone: "6802234567",
    groups: ["A+", "O+", "O-", "AB-"],
    status: "Available"
  }
];
// ---------- COMMON FUNCTION ----------
function callNumber(number) {
  window.location.href = "tel:" + number;
}

// ---------- HOSPITAL DATA ----------
const hospitals = [
  {
    name: "MKCG Medical College & Hospital",
    type: "Government",
    address: "Brahmapur, Odisha",
    lat: 19.314,    // Add actual latitude
    lng: 84.791,    // Add actual longitude
    hospitalPhone: "06802221111",
    ambulancePhone: "108",
    beds: "Available",
    doctors: "Available",
    rating: 4.6
  },
  {
    name: "District Headquarters Hospital (DHH)",
    type: "Government",
    address: "Brahmapur, Odisha",
    lat: 19.316,
    lng: 84.790,
    hospitalPhone: "06802224444",
    ambulancePhone: "108",
    beds: "Limited",
    doctors: "Available",
    rating: 4.0
  },
  {
    name: "Astha Hospital",
    type: "Private",
    address: "Brahmapur, Odisha",
    hospitalPhone: "06802233344",
    ambulancePhone: "9439005555",
    beds: "Available",
    doctors: "Available",
    rating: 4.2,
    lat: 19.3150,
    lng: 84.7930
  },
  {
    name: "Ayush Hospital",
    type: "Private",
    address: "Brahmapur, Odisha",
    hospitalPhone: "06802233355",
    ambulancePhone: "9439006666",
    beds: "Limited",
    doctors: "Available",
    rating: 4.0,
    lat: 19.3160,
    lng: 84.7940
  },
  

  {
    name: "City Hospital",
    type: "Government",
    address: "Brahmapur, Odisha",
    lat: 19.312,
    lng: 84.788,
    hospitalPhone: "06802222222",
    ambulancePhone: "9439001111",
    beds: "Limited",
    doctors: "Available",
    rating: 4.1
  },
  {
    name: "Apollo Hospital",
    type: "Private",
    address: "Brahmapur, Odisha",
    lat: 19.318,
    lng: 84.792,
    hospitalPhone: "06802233333",
    ambulancePhone: "9439002222",
    beds: "Available",
    doctors: "Limited",
    rating: 4.3
  }
  // Add more hospitals here
];

// ---------- HELPER FUNCTIONS ----------
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2); // distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// ---------- SHOW HOSPITALS ----------
let currentHospitalsList = hospitals; // Initialize with default static list

async function findNearestHospitals() {
  const container = document.getElementById('hospitalList');
  if (!container) return;
  
  container.innerHTML = '<p style="text-align:center; padding: 20px;">📍 Locating you...</p>';
  
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }
  
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    
    // Update iframe map to user's location
    const mapShell = document.querySelector('.map-shell iframe');
    if (mapShell) mapShell.src = `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
    
    container.innerHTML = '<p style="text-align:center; padding: 20px;">🏥 Finding best nearest hospitals...</p>';
    await fetchAndDisplayHospitals(lat, lng, "Your Location");
  }, (err) => {
    alert("Unable to get location. Please search by city name instead.");
    container.innerHTML = '';
  });
}

async function searchCityHospitals() {
  const city = document.getElementById('citySearch').value.trim();
  if (!city) return alert("Please enter a city name");
  
  const container = document.getElementById('hospitalList');
  if (!container) return;
  
  container.innerHTML = `<p style="text-align:center; padding: 20px;">🔍 Searching for hospitals in ${city}...</p>`;
  
  try {
    // Geocode city using Nominatim API
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)},India`);
    const geoData = await geoRes.json();
    
    if (!geoData || geoData.length === 0) {
      container.innerHTML = `<p style="text-align:center; color: red;">City not found. Please check spelling.</p>`;
      return;
    }
    
    const lat = geoData[0].lat;
    const lng = geoData[0].lon;
    
    // Update iframe map
    const mapShell = document.querySelector('.map-shell iframe');
    if (mapShell) mapShell.src = `https://www.google.com/maps?q=${encodeURIComponent(city)}+Hospitals&output=embed`;
    
    await fetchAndDisplayHospitals(lat, lng, city);
    
  } catch (err) {
    container.innerHTML = `<p style="text-align:center; color: red;">Network error while searching city.</p>`;
  }
}

async function fetchAndDisplayHospitals(lat, lng, locationName) {
  // Overpass API Query: Find hospitals (nodes, ways, relations) within 25km
  const query = `[out:json][timeout:30];nwr(around:25000,${lat},${lng})["amenity"="hospital"];out center 25;`;
  
  try {
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const data = await res.json();
    
    if (!data.elements || data.elements.length === 0) {
       if (locationName === "Your Location") {
         currentHospitalsList = hospitals; 
         applyFilters();
         document.getElementById('hospitalList').insertAdjacentHTML('afterbegin', `<p style="text-align:center; padding-bottom: 10px; font-weight: bold; color: #e53e3e;">No live data found nearby. Showing default list.</p>`);
       } else {
         currentHospitalsList = [];
         applyFilters();
         document.getElementById('hospitalList').innerHTML = `<p style="text-align:center; padding: 20px; font-weight: bold; color: #e53e3e;">No hospitals found in ${locationName}.</p>`;
       }
       return;
    }
    
    currentHospitalsList = data.elements.map(e => {
        let tags = e.tags || {};
        let name = tags.name || "General Hospital";
        let nameLower = name.toLowerCase();
        let typeStr = [tags.operator_type, tags.operator, tags.healthcare].filter(Boolean).join(" ").toLowerCase();
        
        let isGovt = nameLower.includes('govt') || 
                     nameLower.includes('government') || 
                     nameLower.includes('district') || 
                     nameLower.includes('civil') || 
                     /\bphc\b/.test(nameLower) || 
                     /\bchc\b/.test(nameLower) || 
                     /\bgh\b/.test(nameLower) || 
                     nameLower.includes('primary health') || 
                     nameLower.includes('community health') || 
                     nameLower.includes('municipal') || 
                     nameLower.includes('sub divisional') || 
                     nameLower.includes('sub-divisional') || 
                     typeStr.includes('government') || 
                     typeStr.includes('public') || 
                     typeStr.includes('gov');
                     
        let type = isGovt ? 'Government' : 'Private';
        
        return {
            name: name,
            type: type,
            address: tags['addr:full'] || tags['addr:street'] || locationName,
            lat: e.lat || (e.center && e.center.lat) || lat,
            lng: e.lon || (e.center && e.center.lon) || lng,
            hospitalPhone: tags.phone || "Not Available",
            ambulancePhone: "108",
            beds: "Available",
            doctors: "Available",
            rating: (3.8 + (e.id % 12) / 10).toFixed(1) // Pseudo-random consistent rating 3.8 - 4.9
        };
    });
    
    // Sort to prioritize closest and highest rated
    currentHospitalsList.sort((a, b) => {
      const distA = getDistance(lat, lng, a.lat, a.lng);
      const distB = getDistance(lat, lng, b.lat, b.lng);
      // Weight rating slightly so a highly rated hospital slightly further away ranks well
      return (distA - parseFloat(a.rating)) - (distB - parseFloat(b.rating));
    });

    applyFilters();
  } catch (err) {
    console.error("OSM Fetch Error:", err);
    if (locationName === "Your Location") {
      currentHospitalsList = hospitals;
      applyFilters();
      document.getElementById('hospitalList').insertAdjacentHTML('afterbegin', `<p style="text-align:center; padding-bottom: 10px; font-weight: bold; color: #e53e3e;">Database temporarily unavailable. Showing default list.</p>`);
    } else {
      currentHospitalsList = [];
      applyFilters();
      document.getElementById('hospitalList').innerHTML = `<p style="text-align:center; padding: 20px; font-weight: bold; color: #e53e3e;">Database temporarily unavailable. Could not fetch hospitals for ${locationName}.</p>`;
    }
  }
}

function applyFilters() {
  const type = document.getElementById("typeFilter") ? document.getElementById("typeFilter").value : "all";
  let filtered = currentHospitalsList;
  
  if (type !== "all") {
    filtered = currentHospitalsList.filter(h => h.type === type);
  }
  
  renderHospitals(filtered);
}

function renderHospitals(list) {
  const container = document.getElementById("hospitalList");
  if (!container) return;
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<p style='text-align:center;'>No hospitals found matching criteria.</p>";
    return;
  }

  // Determine user location for routing
  let userLat = localStorage.getItem("userLat");
  let userLng = localStorage.getItem("userLon");

  // If localStorage doesn't have it but geolocation is available, we can grab it quickly
  if (!userLat && navigator.geolocation) {
     navigator.geolocation.getCurrentPosition(pos => {
        localStorage.setItem("userLat", pos.coords.latitude);
        localStorage.setItem("userLon", pos.coords.longitude);
        renderHospitals(list); // Re-render once we have it
     });
  }

  list.forEach(h => {
    let distanceStr = "";
    let routeLink = `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`;
    
    if (userLat && userLng) {
      const distance = getDistance(userLat, userLng, h.lat, h.lng);
      distanceStr = `<p style="margin-bottom: 5px;">📏 Distance: <b>${distance} km</b></p>`;
      routeLink = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${h.lat},${h.lng}`;
    }

    container.innerHTML += `
      <div class="card" style="border-left: 4px solid ${h.type === 'Government' ? '#4299e1' : '#ed8936'}; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <h3 style="margin-bottom: 8px; font-size: 18px;">${h.name}</h3>
        <span style="background: ${h.type === 'Government' ? '#ebf8ff' : '#feebc8'}; color: ${h.type === 'Government' ? '#2b6cb0' : '#c05621'}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 10px;">🏥 ${h.type}</span>
        <p style="margin-bottom: 5px;">📍 ${h.address}</p>
        <p style="margin-bottom: 5px;">⭐ Rating: <b style="color: #d69e2e;">${h.rating} / 5.0</b> (Best Match)</p>
        ${distanceStr}
        <p>📞 Contact: ${h.hospitalPhone !== "Not Available" ? `<a href="tel:${h.hospitalPhone}" style="color: #3182ce; text-decoration: none; font-weight: 600;">${h.hospitalPhone}</a>` : "Not Available"}</p>
        
        <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
          <a href="${routeLink}" target="_blank" style="flex: 1; text-align: center; background: #3182ce; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 5px; box-shadow: 0 4px 6px rgba(49, 130, 206, 0.3); transition: all 0.2s;">
            🗺️ View Route
          </a>
          <button onclick="callNumber('${h.ambulancePhone}')" style="flex: 1; background: #e53e3e; color: white; padding: 12px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(229, 62, 62, 0.3); transition: all 0.2s;">
            🚑 Call Ambulance
          </button>
        </div>
      </div>
    `;
  });
}

// ---------- INIT ----------
if (document.getElementById("hospitalList")) {
  applyFilters(); // Initialize with default array if on hospital page
}

// Build a Google Maps link from stored location
function getCurrentLocationLink() {
  const lat = localStorage.getItem("userLat");
  const lon = localStorage.getItem("userLon");

  if (!lat || !lon) {
    alert("Location not ready yet. Please allow location access and try again.");
    return null;
  }

  const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
  return { lat, lon, mapsUrl };
}

// Open SMS composer with emergency text + location
function sendEmergencyAlert(number) {
  const data = getCurrentLocationLink();
  if (!data) return;

  const { lat, lon, mapsUrl } = data;

  const message =
    `EMERGENCY ALERT: I need help. My current location is ` +
    `Latitude: ${lat}, Longitude: ${lon}. ` +
    `Map: ${mapsUrl}`;

  // Most phones support sms:NUMBER?body=...
  const smsUrl = `sms:${number}?&body=${encodeURIComponent(message)}`;
  window.location.href = smsUrl;
}

// Let user pick which emergency number to alert
function openEmergencyAlertOptions() {
  const choice = prompt(
    "Send emergency alert to:\n" +
    "1 - 108 (Ambulance)\n" +
    "2 - 100 (Police)\n" +
    "3 - 112 (National Emergency)\n\n" +
    "Type 1, 2, or 3"
  );

  if (!choice) return;

  let number;
  if (choice === "1") number = "108";
  else if (choice === "2") number = "100";
  else if (choice === "3") number = "112";
  else {
    alert("Invalid choice. Please try again.");
    return;
  }

  sendEmergencyAlert(number);
}

let currentBloodBanksList = bloodBanks; // Fallback to offline list

async function findNearestBloodBanks() {
  const container = document.getElementById('bloodList');
  if (!container) return;
  
  container.innerHTML = '<p style="text-align:center; padding: 20px;">📍 Locating you...</p>';
  if (!navigator.geolocation) return alert("Geolocation not supported");
  
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude, lng = pos.coords.longitude;
    const mapShell = document.querySelector('.map-shell iframe');
    if (mapShell) mapShell.src = `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
    
    container.innerHTML = '<p style="text-align:center; padding: 20px;">🩸 Finding best nearest blood banks...</p>';
    await fetchAndDisplayBloodBanks(lat, lng, "Your Location");
  }, () => {
    alert("Unable to get location.");
    container.innerHTML = '';
  });
}

async function searchCityBloodBanks() {
  const cityInput = document.getElementById('citySearchBlood') || document.getElementById('citySearch');
  const city = cityInput ? cityInput.value.trim() : "";
  if (!city) return alert("Please enter a city name");
  
  const container = document.getElementById('bloodList');
  if (!container) return;
  
  container.innerHTML = `<p style="text-align:center; padding: 20px;">🔍 Searching for blood banks in ${city}...</p>`;
  
  try {
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)},India`);
    const geoData = await geoRes.json();
    
    if (!geoData || geoData.length === 0) {
      container.innerHTML = `<p style="text-align:center; color: red;">City not found. Please check spelling.</p>`;
      return;
    }
    
    const lat = geoData[0].lat;
    const lng = geoData[0].lon;
    
    const mapShell = document.querySelector('.map-shell iframe');
    if (mapShell) mapShell.src = `https://www.google.com/maps?q=${encodeURIComponent(city)}+Blood+Bank&output=embed`;
    
    await fetchAndDisplayBloodBanks(lat, lng, city);
    
  } catch (err) {
    container.innerHTML = `<p style="text-align:center; color: red;">Network error while searching city.</p>`;
  }
}

async function fetchAndDisplayBloodBanks(lat, lng, locationName) {
  // Overpass API Query: Find blood banks within 25km, broadly catching "Blood Centre", "Blood Center", etc.
  const query = `[out:json][timeout:30];(nwr(around:25000,${lat},${lng})["healthcare"="blood_bank"];nwr(around:25000,${lat},${lng})["amenity"="blood_bank"];nwr(around:25000,${lat},${lng})["name"~"blood",i];);out center 25;`;
  
  try {
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const data = await res.json();
    
    if (!data.elements || data.elements.length === 0) {
       if (locationName === "Your Location") {
         currentBloodBanksList = bloodBanks; 
         filterBlood();
         document.getElementById('bloodList').insertAdjacentHTML('afterbegin', `<p style="text-align:center; padding-bottom: 10px; font-weight: bold; color: #e53e3e;">No live data found nearby. Showing default list.</p>`);
       } else {
         currentBloodBanksList = [];
         filterBlood();
         document.getElementById('bloodList').innerHTML = `<p style="text-align:center; padding: 20px; font-weight: bold; color: #e53e3e;">No blood banks found in ${locationName}.</p>`;
       }
       return;
    }
    
    currentBloodBanksList = data.elements.map(e => {
        let tags = e.tags || {};
        let name = tags.name || "General Blood Bank";
        
        return {
            name: name,
            location: tags['addr:full'] || tags['addr:street'] || locationName,
            lat: e.lat || (e.center && e.center.lat) || lat,
            lng: e.lon || (e.center && e.center.lon) || lng,
            phone: tags.phone || "Not Available",
            groups: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"], // OSM doesn't have live stock
            status: "Available"
        };
    });
    
    // Sort to prioritize closest
    currentBloodBanksList.sort((a, b) => {
      return getDistance(lat, lng, a.lat, a.lng) - getDistance(lat, lng, b.lat, b.lng);
    });

    filterBlood();
  } catch (err) {
    console.error("OSM Fetch Error:", err);
    if (locationName === "Your Location") {
      currentBloodBanksList = bloodBanks;
      filterBlood();
      document.getElementById('bloodList').insertAdjacentHTML('afterbegin', `<p style="text-align:center; padding-bottom: 10px; font-weight: bold; color: #e53e3e;">Database temporarily unavailable. Showing default list.</p>`);
    } else {
      currentBloodBanksList = [];
      filterBlood();
      document.getElementById('bloodList').innerHTML = `<p style="text-align:center; padding: 20px; font-weight: bold; color: #e53e3e;">Database temporarily unavailable for ${locationName}.</p>`;
    }
  }
}

function showBloodBanks(list) {
  const container = document.getElementById("bloodList");
  if (!container) return;

  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<p style='text-align:center;'>No blood banks found matching criteria.</p>";
    return;
  }

  let userLat = localStorage.getItem("userLat");
  let userLng = localStorage.getItem("userLon");

  if (!userLat && navigator.geolocation) {
     navigator.geolocation.getCurrentPosition(pos => {
        localStorage.setItem("userLat", pos.coords.latitude);
        localStorage.setItem("userLon", pos.coords.longitude);
        showBloodBanks(list); 
     });
  }

  list.forEach(bank => {
    let distanceStr = "";
    let routeLink = "";
    
    if (bank.lat && bank.lng) {
        routeLink = `https://www.google.com/maps/dir/?api=1&destination=${bank.lat},${bank.lng}`;
        if (userLat && userLng) {
          const distance = getDistance(userLat, userLng, bank.lat, bank.lng);
          distanceStr = `<p style="margin-bottom: 5px;">📏 Distance: <b>${distance} km</b></p>`;
          routeLink = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${bank.lat},${bank.lng}`;
        }
    }

    container.innerHTML += `
      <div class="card" style="border-left: 4px solid #e53e3e; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <h3 style="margin-bottom: 8px; font-size: 18px;">${bank.name}</h3>
        <p style="margin-bottom: 5px;">📍 ${bank.location}</p>
        <p style="margin-bottom: 5px;">🩸 ${bank.groups.join(", ")}</p>
        <p style="margin-bottom: 5px;">Status: <b>${bank.status}</b></p>
        ${distanceStr}
        <p>📞 Contact: ${bank.phone !== "Not Available" ? `<a href="tel:${bank.phone}" style="color: #3182ce; text-decoration: none; font-weight: 600;">${bank.phone}</a>` : "Not Available"}</p>
        
        <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
          ${routeLink ? `<a href="${routeLink}" target="_blank" style="flex: 1; text-align: center; background: #3182ce; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 5px; box-shadow: 0 4px 6px rgba(49, 130, 206, 0.3); transition: all 0.2s;">🗺️ View Route</a>` : ''}
          <button onclick="callNumber('${bank.phone}')" style="flex: 1; background: #e53e3e; color: white; padding: 12px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(229, 62, 62, 0.3); transition: all 0.2s;">📞 Call</button>
        </div>
      </div>
    `;
  });
}

function filterBlood() {
  const group = document.getElementById("groupFilter") ? document.getElementById("groupFilter").value : "all";
  if (group === "all") {
    showBloodBanks(currentBloodBanksList);
  } else {
    showBloodBanks(
      currentBloodBanksList.filter(b => b.groups.includes(group))
    );
  }
}

// VOICE ASSISTANT
function speakText(text, lang="en-US") {
  if (!('speechSynthesis' in window)) {
    alert("Sorry, your browser does not support voice.");
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang; // "en-US" for English, "hi-IN" for Hindi, "or-IN" for Odia
  utterance.rate = 1;     // speed
  utterance.pitch = 1;    // pitch
  window.speechSynthesis.speak(utterance);
}

// show initial blood banks on blood page (if present)
if (document.getElementById("bloodList")) {
  filterBlood();
}

// Text for each page in different languages
const translations = {
  home: {
    en: {
      title: "SAHAYA",
      subtitle: "Local Help & Emergency Services",
      voice:
        "Welcome to Sahaya. Tap Ambulance, Police, or Fire buttons for emergency help. You can also open Blood Banks, Hospitals, Emergency Numbers, and Government Health Schemes."
    },
    hi: {
      title: "सहाय",
      subtitle: "स्थानीय सहायता और आपातकालीन सेवाएँ",
      voice:
        "सहाय ऐप में आपका स्वागत है। आपातकाल के लिए एम्बुलेंस, पुलिस या फायर बटन पर टैप करें। आप रक्त बैंक, अस्पताल, आपातकालीन नंबर और सरकारी स्वास्थ्य योजनाएँ भी देख सकते हैं।"
    },
    or: {
      title: "ସାହାୟା",
      subtitle: "ସ୍ଥାନୀୟ ସହାୟତା ଏବଂ ଆପତ୍କାଳୀନ ସେବା",
      voice:
        "ସାହାୟା ଆପ୍‌କୁ ସ୍ୱାଗତ। ଆପତ୍କାଳୀନ ସହାୟତା ପାଇଁ ଏମ୍ବୁଲାନ୍ସ, ପୁଲିସ୍ କିମ୍ବା ଫାୟାର ବଟନ୍ ଦବାନ୍ତୁ। ରକ୍ତ ବ୍ୟାଙ୍କ, ହସ୍ପିଟାଲ, ଆପତ୍କାଳୀନ ନମ୍ବର ଏବଂ ସରକାରୀ ସ୍ୱାସ୍ଥ୍ୟ ଯୋଜନା ବିଷୟରେ ମଧ୍ୟ ଦେଖିପାରିବେ।"
    }
  },
  emergency: {
    en: {
      title: "Emergency Numbers",
      subtitle: "Tap a card and then call on your phone",
      voice:
        "This page lists important emergency numbers like ambulance, police, fire, women and child helplines. Tap a card and then press call on your phone."
    },
    hi: {
      title: "आपातकालीन नंबर",
      subtitle: "कार्ड पर टैप करें और कॉल दबाएँ",
      voice:
        "इस पेज पर एम्बुलेंस, पुलिस, फायर, महिला और बाल हेल्पलाइन जैसे ज़रूरी आपातकालीन नंबर दिए गए हैं। किसी कार्ड पर टैप करें और फिर अपने फ़ोन पर कॉल दबाएँ।"
    },
    or: {
      title: "ଆପତ୍କାଳୀନ ନମ୍ବର",
      subtitle: "କାର୍ଡରେ ଟାପ୍ କରି କଲ୍ କରନ୍ତୁ",
      voice:
        "ଏହି ପୃଷ୍ଠାରେ ଏମ୍ବୁଲାନ୍ସ, ପୁଲିସ୍, ଫାୟାର, ମହିଳା ଏବଂ ଶିଶୁ ହେଲ୍ପଲାଇନ୍ ଭଳି ଦରକାରୀ ଆପତ୍କାଳୀନ ନମ୍ବର ଦିଆଯାଇଛି। କୌଣସି କାର୍ଡରେ ଟାପ୍ କରନ୍ତୁ ଏବଂ ତାପରେ ଫୋନରେ କଲ୍ ଦବାନ୍ତୁ।"
    }
  },
  hospital: {
    en: {
      title: "Hospitals",
      subtitle: "Government and private care near you",
      voice:
        "Here you can see important hospitals in Brahmapur. Use the filter to see government or private hospitals and tap the buttons to call for help."
    },
    hi: {
      title: "अस्पताल",
      subtitle: "आपके आसपास सरकारी और प्राइवेट अस्पताल",
      voice:
        "यहाँ आप ब्रह्मपुर के ज़रूरी अस्पताल देख सकते हैं। फ़िल्टर से सरकारी या प्राइवेट अस्पताल चुनें और मदद के लिए कॉल बटन दबाएँ।"
    },
    or: {
      title: "ହସ୍ପିଟାଲ",
      subtitle: "ଆପଣଙ୍କ ନିକଟରେ ସରକାରୀ ଏବଂ ପ୍ରାଇଭେଟ୍ ହସ୍ପିଟାଲ",
      voice:
        "ଏଠାରେ ଆପଣ ବ୍ରହ୍ମପୁରର ଦରକାରୀ ହସ୍ପିଟାଲଗୁଡ଼ିକୁ ଦେଖିପାରିବେ। ଫିଲ୍ଟର ଦ୍ୱାରା ସରକାରୀ କିମ୍ବା ପ୍ରାଇଭେଟ୍ ହସ୍ପିଟାଲ ଚୟନ କରନ୍ତୁ ଏବଂ ସହାୟତା ପାଇଁ କଲ୍ ବଟନ୍ ଦବାନ୍ତୁ।"
    }
  },
  blood: {
    en: {
      title: "Blood Banks",
      subtitle: "Nearby centres and availability",
      voice:
        "Use this page to find blood banks in Brahmapur. Choose a blood group from the list and then call the centre to confirm availability."
    },
    hi: {
      title: "ब्लड बैंक",
      subtitle: "नज़दीकी केंद्र और उपलब्धता",
      voice:
        "इस पेज से आप ब्रह्मपुर के ब्लड बैंक देख सकते हैं। अपनी ज़रूरत का ब्लड ग्रुप चुनें और उपलब्धता की पुष्टि के लिए केंद्र पर कॉल करें।"
    },
    or: {
      title: "ବ୍ଲଡ୍ ବ୍ୟାଙ୍କ",
      subtitle: "ନିକଟସ୍ଥ କେନ୍ଦ୍ର ଏବଂ ଉପଲବ୍ଧତା",
      voice:
        "ଏହି ପୃଷ୍ଠାରେ ଆପଣ ବ୍ରହ୍ମପୁରର ବ୍ଲଡ୍ ବ୍ୟାଙ୍କ ଦେଖିପାରିବେ। ତାଲିକାରୁ ଆବଶ୍ୟକ ବ୍ଲଡ୍ ଗ୍ରୁପ୍ ବାଛନ୍ତୁ ଏବଂ ଉପଲବ୍ଧତା ନିଶ୍ଚିତ ପାଇଁ କେନ୍ଦ୍ରକୁ କଲ୍ କରନ୍ତୁ।"
    }
  },
  "health-schemes": {
    en: {
      title: "Health Schemes",
      subtitle: "Government support for medical care",
      voice:
        "Here you can see important government health schemes like Ayushman Bharat and others. Read the details and tap Apply to visit the official website."
    },
    hi: {
      title: "स्वास्थ्य योजनाएँ",
      subtitle: "सरकारी मदद और बीमा योजना",
      voice:
        "यहाँ आप आयुष्मान भारत जैसी महत्वपूर्ण सरकारी स्वास्थ्य योजनाएँ देख सकते हैं। विवरण पढ़ें और आधिकारिक वेबसाइट खोलने के लिए Apply बटन दबाएँ।"
    },
    or: {
      title: "ସ୍ୱାସ୍ଥ୍ୟ ଯୋଜନା",
      subtitle: "ଚିକିତ୍ସା ପାଇଁ ସରକାରୀ ସହାୟତା",
      voice:
        "ଏଠାରେ ଆପଣ ଆୟୁଷ୍ମାନ୍ ଭାରତ ଭଳି ଦରକାରୀ ସରକାରୀ ସ୍ୱାସ୍ଥ୍ୟ ଯୋଜନାଗୁଡ଼ିକୁ ଦେଖିପାରିବେ। ବିବରଣୀ ପଢ଼ନ୍ତୁ ଏବଂ ଅଧିକାରିକ ୱେବସାଇଟ ପାଇଁ Apply ବଟନ୍ ଦବାନ୍ତୁ।"
    }
  }
};

let currentLang = "en"; // default language

function setLanguage(lang) {
  currentLang = lang;

  const pageKey = document.body.dataset.page || "home";
  const pageTranslations = translations[pageKey];
  const t = pageTranslations && pageTranslations[lang];

  // Update app title + subtitle if present
  const titleEl = document.querySelector(".app-title");
  if (titleEl && t) {
    titleEl.innerHTML = `
      ${t.title}
      <span>${t.subtitle}</span>
    `;
  }

  // Update aria-pressed state on language buttons
  const langButtons = document.querySelectorAll(".language-buttons button");
  langButtons.forEach((btn) => {
    const isActive = btn.getAttribute("onclick")?.includes(`'${lang}'`);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  // Wire up voice instructions for this page + language
  const voiceBtnEl = document.getElementById("voiceBtn");
  if (voiceBtnEl && t) {
    voiceBtnEl.onclick = function () {
      const voiceCode = lang === "en" ? "en-US" : lang === "hi" ? "hi-IN" : "or-IN";
      speakText(t.voice, voiceCode);
    };
  }

  // Update other visible text on the page (fallback when .app-title not present)
  if (t) {
    // Document title
    try { document.title = `${t.title} — Sahaya`; } catch (e) {}

    // Hero title / subtitle (home page)
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroTitle && heroSubtitle) {
      heroTitle.innerHTML = t.title || heroTitle.innerHTML;
      heroSubtitle.textContent = t.subtitle || heroSubtitle.textContent;
    }

    // Localized voice button label mapping
    const voiceLabel = {
      en: '🔊 Listen instructions',
      hi: '🔊 निर्देश सुनें',
      or: '🔊 ନିର୍ଦ୍ଦେଶ ଶୁଣନ୍ତୁ'
    };
    if (voiceBtnEl) voiceBtnEl.textContent = voiceLabel[lang] || voiceLabel.en;
  }
}
// Ensure UI and voice button are initialized with the default language
setLanguage(currentLang);
/* ---------- GOVERNMENT SCHEMES DATA ---------- */
const healthSchemes = [
  {
    name: "Ayushman Bharat",
    facility: "Health insurance coverage up to ₹5 Lakh per family",
    eligibility: "All BPL and EWS families",
    documents: "Aadhaar Card, Ration Card",
    office: "District Health Office, Brahmapur",
    contact: "0680-2223333",
    applyLink: "https://www.ayushmanbharat.gov.in/"
  },
  {
    name: "National Health Mission (NHM)",
    facility: "Free maternal and child health services",
    eligibility: "All pregnant women & children",
    documents: "Aadhaar Card / Health ID",
    office: "District Health Office, Brahmapur",
    contact: "0680-2224444",
    applyLink: "https://nhm.gov.in/"
  },
  {
    name: "Pradhan Mantri Jan Arogya Yojana (PMJAY)",
    facility: "Cashless hospitalization for serious illnesses",
    eligibility: "Eligible families under SECC list",
    documents: "Aadhaar Card, SECC Certificate",
    office: "District Hospital, Brahmapur",
    contact: "0680-2225555",
    applyLink: "https://pmjay.gov.in/"
  },
  {
    name: "Rashtriya Bal Swasthya Karyakram (RBSK)",
    facility: "Free health screening for children",
    eligibility: "Children aged 0–18 years",
    documents: "Birth certificate / Aadhaar",
    office: "District Hospital, Brahmapur",
    contact: "0680-2226666",
    applyLink: "https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=1133&lid=176"
  },
  {
    name: "Janani Suraksha Yojana (JSY)",
    facility: "Cash incentive for institutional deliveries",
    eligibility: "Pregnant women below poverty line",
    documents: "Pregnancy Card, Aadhaar",
    office: "PHC / CHC, Brahmapur",
    contact: "0680-2227777",
    applyLink: "https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=1132&lid=175"
  }
];

/* ---------- SHOW SCHEMES ---------- */
function showSchemes(list) {
  const container = document.getElementById("schemeList");
  if (!container) return;

  container.innerHTML = "";

  list.forEach(s => {
    container.innerHTML += `
      <div class="card">
        <h3>${s.name}</h3>
        <p>🏥 Facility: ${s.facility}</p>
        <p>✅ Eligibility: ${s.eligibility}</p>
        <p>📄 Documents: ${s.documents}</p>
        <p>📍 Office: ${s.office}</p>
        <p>📞 Contact: <a href="tel:${s.contact}">${s.contact}</a></p>
        <a href="${s.applyLink}" target="_blank">
          <button style="background:#ff9800;color:white;padding:8px 12px;border-radius:5px;margin-top:5px;">
            📝 Apply
          </button>
        </a>
      </div>
    `;
  });
}

/* ---------- LOAD SCHEMES ---------- */

// GET USER LOCATION
function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        console.log("Latitude:", lat, "Longitude:", lon);

        // Save location for use in maps or services
        localStorage.setItem("userLat", lat);
        localStorage.setItem("userLon", lon);

        // Optional: Show a Google Map centered on user location
        showUserMap(lat, lon);
      },
      function(error) {
        alert("Unable to get your location. Please allow location access.");
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}

// CALL THIS ON PAGE LOAD
document.addEventListener("DOMContentLoaded", function() {
  getUserLocation();
});
function showUserMap(lat, lon) {
  const mapContainer = document.getElementById("userMap");
  if (!mapContainer) return;

  mapContainer.innerHTML = `
    <iframe
      width="100%" height="220"
      style="border:0;"
      loading="lazy"
      allowfullscreen
      src="https://www.google.com/maps?q=${lat},${lon}&hl=es;z=15&output=embed">
    </iframe>
  `;
}

// Navigation helper for quick feature buttons
function navigateTo(path) {
  window.location.href = path;
}

// Copy current map link to clipboard
function copyLocation() {
  const data = getCurrentLocationLink();
  if (!data) return;
  const { mapsUrl } = data;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(mapsUrl).then(() => {
      alert('Map link copied to clipboard');
    }).catch(() => {
      prompt('Copy this link:', mapsUrl);
    });
  } else {
    prompt('Copy this link:', mapsUrl);
  }
}

/* ---------- Dispatch system (local demo + optional Firebase) ---------- */
// Utility: generate a simple id
function genId(prefix='dispatch'){
  return prefix + '-' + Math.random().toString(36).slice(2,9);
}

// Distance (km) between two lat/lon (haversine)
function distanceKm(lat1,lon1,lat2,lon2){
  function toRad(v){return v*Math.PI/180}
  const R=6371;
  const dLat=toRad(lat2-lat1); const dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
  const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  return R*c;
}

// Local backend using localStorage + BroadcastChannel for same-origin tabs
const bc = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('sahaya-dispatch') : null;

function saveDispatchLocal(id, obj){
  localStorage.setItem('dispatch:'+id, JSON.stringify(obj));
  bc?.postMessage({id, obj});
}

function readDispatchLocal(id){
  const raw = localStorage.getItem('dispatch:'+id);
  return raw ? JSON.parse(raw) : null;
}

function createDispatch(service){
  const id = genId(service);
  const userLoc = { lat: localStorage.getItem('userLat')||null, lon: localStorage.getItem('userLon')||null };
  const obj = { id, service, status: 'requested', created: Date.now(), userLat: userLoc.lat, userLon: userLoc.lon };
  saveDispatchLocal(id, obj);
  return obj;
}

function updateDispatch(id, updates){
  const cur = readDispatchLocal(id) || {};
  const merged = Object.assign({}, cur, updates, { updated: Date.now() });
  saveDispatchLocal(id, merged);
}

// subscribe to updates for a dispatch id; callback receives object
function subscribeDispatch(id, cb){
  // initial
  cb(readDispatchLocal(id));
  // listen to BroadcastChannel
  if (bc){
    const handler = (ev)=>{ if (ev.data && ev.data.id===id) cb(ev.data.obj); };
    bc.addEventListener('message', handler);
    return ()=> bc.removeEventListener('message', handler);
  }
  // fallback: poll every 3s
  const i = setInterval(()=> cb(readDispatchLocal(id)), 3000);
  return ()=> clearInterval(i);
}

/* ---------- Optional Firebase Realtime integration (client) ---------- */
let firebaseEnabled = false;
let firebaseDb = null;

function loadScript(src){
  return new Promise((res, rej)=>{
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
}

async function initFirebaseIfConfigured(){
  // User should place a `firebase-config.js` defining `window.firebaseConfig` (see firebase-config.example.js)
  if (!window.firebaseConfig) return;
  try {
    // load compat SDKs
    await loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js');
    firebase.initializeApp(window.firebaseConfig);
    firebaseDb = firebase.database();
    firebaseEnabled = true;
    console.log('Firebase initialized for realtime dispatches');
  } catch (e){
    console.warn('Failed to load Firebase SDKs', e);
  }
}

function firebaseWriteDispatch(id, obj){
  if (!firebaseEnabled || !firebaseDb) return;
  try { firebaseDb.ref('dispatches/' + id).set(obj); } catch (e){ console.warn(e); }
}

function firebaseSubscribeDispatch(id, cb){
  if (!firebaseEnabled || !firebaseDb) return null;
  const ref = firebaseDb.ref('dispatches/' + id);
  const listener = ref.on('value', snap => cb(snap.val()));
  return ()=> ref.off('value', listener);
}

// Show a browser notification if permission is granted (fallback to alert)
function showBrowserNotification(title, body){
  if (Notification && Notification.permission === 'granted'){
    try { new Notification(title, { body }); return; } catch(e){}
  }
  // fallback in-page alert
  try { alert(title + '\n' + body); } catch(e){}
}

// Request notification permission once on page load for emergency UI
document.addEventListener('DOMContentLoaded', function(){
  if ('Notification' in window && Notification.permission === 'default'){
    // don't spam — ask only on emergency page
    if (document.body.dataset.page === 'emergency'){
      try { Notification.requestPermission(); } catch(e){}
    }
  }
  // init firebase if user added config
  initFirebaseIfConfigured().then(()=>{
    // if firebase enabled, rewrite local create/update to also push
    if (firebaseEnabled){
      // override saveDispatchLocal to also write to firebase
      const oldSave = saveDispatchLocal;
      saveDispatchLocal = function(id,obj){ oldSave(id,obj); firebaseWriteDispatch(id,obj); };
    }
  });
});

// Enhance subscribeDispatch to use Firebase if available for cross-device updates
const _subscribeDispatch = subscribeDispatch;
subscribeDispatch = function(id, cb){
  if (firebaseEnabled){
    // initial read then subscribe
    const unsubFirebase = firebaseSubscribeDispatch(id, (obj)=> cb(obj));
    // also return a function to clean up
    return ()=> { if (typeof unsubFirebase === 'function') unsubFirebase(); };
  }
  return _subscribeDispatch(id, cb);
};

// wrap showDispatchTracker to show notifications when status changes
const _showDispatchTracker = showDispatchTracker;
showDispatchTracker = function(id){
  let lastStatus = null;
  const tracker = document.getElementById('dispatchTracker');
  _showDispatchTracker(id);
  // monitor updates and notify
  const unsub = subscribeDispatch(id, (obj)=>{
    if (!obj) return;
    if (obj.status && obj.status !== lastStatus){
      if (obj.status === 'enroute') showBrowserNotification('Responder on the way', `Responder is ${obj.service || ''}`);
      if (obj.status === 'arrived') showBrowserNotification('Responder arrived', 'Responder has reached the location');
      if (obj.status === 'cancelled') showBrowserNotification('Dispatch cancelled', 'The dispatch was cancelled');
      lastStatus = obj.status;
    }
  });
  // automatically unsubscribe when tracker hidden
  const observer = new MutationObserver(()=>{
    if (tracker.hidden){ unsub(); observer.disconnect(); }
  });
  observer.observe(tracker, { attributes: true, attributeFilter: ['hidden'] });
  return;
};

// UI helpers on emergency page
function initDispatchUI(){
  const cards = document.querySelectorAll('.emergency-card button');
  cards.forEach(btn => {
    btn.addEventListener('click', (e)=>{
      const card = e.target.closest('.emergency-card');
      const service = card?.querySelector('h2')?.textContent || 'service';
      // create dispatch
      const d = createDispatch(service.replace(/[^a-zA-Z ]/g,'').trim().toLowerCase());
      showDispatchTracker(d.id);
      alert('Dispatch requested. Share this link with the responder:\n' + window.location.origin + '/driver.html?dispatch=' + d.id);
    });
  });

  // tracker controls
  const copyBtn = document.getElementById('copyDispatchLink');
  const cancelBtn = document.getElementById('cancelDispatch');
  if (copyBtn){ copyBtn.addEventListener('click', ()=>{ const id = document.getElementById('dispatchInfo')?.dataset?.id; if (!id) return; const link = window.location.origin + '/driver.html?dispatch=' + id; navigator.clipboard?.writeText(link).then(()=>alert('Link copied')); }); }
  if (cancelBtn){ cancelBtn.addEventListener('click', ()=>{ const id = document.getElementById('dispatchInfo')?.dataset?.id; if (!id) return; updateDispatch(id, { status:'cancelled' }); }); }
}

let currentUnsub = null;
function showDispatchTracker(id){
  const tracker = document.getElementById('dispatchTracker');
  const info = document.getElementById('dispatchInfo');
  const statusEl = document.getElementById('dispatchStatus');
  const distEl = document.getElementById('dispatchDistance');
  const etaEl = document.getElementById('dispatchETA');
  tracker.hidden = false;
  info.textContent = 'Dispatch ID: ' + id;
  info.dataset.id = id;

  if (currentUnsub) currentUnsub();
  currentUnsub = subscribeDispatch(id, (obj)=>{
    if (!obj){ statusEl.textContent = 'No updates yet.'; return; }
    statusEl.textContent = 'Status: ' + (obj.status||'n/a');
    if (obj.driverLat && obj.driverLon && obj.userLat && obj.userLon){
      const d = distanceKm(Number(obj.driverLat), Number(obj.driverLon), Number(obj.userLat), Number(obj.userLon));
      distEl.textContent = 'Distance: ' + d.toFixed(2) + ' km';
      // assume avg speed 40 km/h -> ETA in minutes
      const etaMin = (d / 40) * 60;
      etaEl.textContent = obj.status==='arrived' ? 'Arrived' : 'ETA: ~' + Math.max(1, Math.round(etaMin)) + ' min';
    } else {
      distEl.textContent = '';
      etaEl.textContent = '';
    }
    if (obj.status==='arrived'){
      // auto-hide after short delay
      setTimeout(()=>{ tracker.hidden = true; }, 8000);
    }
  });
}

// local driver join helper used by driver.html
function localJoinDispatch(id){
  // mark responder joined
  updateDispatch(id, { responderJoined: true, status: 'enroute' });
}

// expose functions globally used by driver.html
window.createDispatch = createDispatch;
window.updateDispatch = updateDispatch;
window.subscribeDispatch = subscribeDispatch;
window.showDispatchTracker = showDispatchTracker;
window.localJoinDispatch = localJoinDispatch;

// init dispatch UI on emergency page
document.addEventListener('DOMContentLoaded', function(){
  initDispatchUI();
});

// First-aid tips: show a random tip and optionally speak it
const firstAidTips = [
  'If someone is bleeding, apply firm pressure with a clean cloth to control bleeding.',
  'For burns, cool the area with running water for at least 10 minutes; do not apply ice.',
  'If a person is unresponsive and not breathing normally, start CPR and call emergency services.',
  'For choking, perform abdominal thrusts (Heimlich maneuver) on conscious adults.'
];

function showFirstAidTip() {
  const el = document.getElementById('firstAidTip');
  if (!el) return;
  const tip = firstAidTips[Math.floor(Math.random() * firstAidTips.length)];
  el.textContent = tip;
  try {
    const voiceCode = currentLang === 'hi' ? 'hi-IN' : currentLang === 'or' ? 'or-IN' : 'en-US';
    speakText(tip, voiceCode);
  } catch (e) {}
}

// Replace missing images with a lightweight SVG placeholder
document.addEventListener('DOMContentLoaded', function () {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600">
      <rect width="100%" height="100%" fill="#e6eefc"/>
      <g fill="#374151" font-family="Segoe UI, Arial, sans-serif" font-weight="700">
        <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="36">Image not available</text>
        <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-size="20">Add the image file to the project or replace the URL</text>
      </g>
    </svg>
  `;

  const dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);

  document.querySelectorAll('img').forEach(img => {
    // if image already failed to load, set placeholder
    img.addEventListener('error', function () {
      if (this.src !== dataUrl) {
        this.src = dataUrl;
        this.classList.add('placeholder');
      }
    });

    // If img has empty/invalid src at load time, force placeholder
    if (!img.complete || img.naturalWidth === 0) {
      // allow normal loading first, then fallback after a short delay
      setTimeout(() => {
        if (img.naturalWidth === 0) {
          img.src = dataUrl;
          img.classList.add('placeholder');
        }
      }, 250);
    }
  });
});

/* ---------- Local Voice Assistant (basic, offline) ---------- */
let recognition = null;
let assistantListening = false;

function initAssistant() {
  const toggle = document.getElementById('assistantToggle');
  const panel = document.getElementById('assistantPanel');
  const closeBtn = document.getElementById('assistantClose');
  const micBtn = document.getElementById('assistantMic');
  const stopBtn = document.getElementById('assistantStop');
  const status = document.getElementById('assistantStatus');
  const transcriptEl = document.getElementById('assistantTranscript');
  const responseEl = document.getElementById('assistantResponse');

  if (!toggle || !panel) return;

  toggle.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute('aria-pressed', open ? 'true' : 'false');
  });

  closeBtn?.addEventListener('click', () => { panel.hidden = true; toggle.setAttribute('aria-pressed','false'); });

  // Setup SpeechRecognition (if available)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  function setStatus(text) { if (status) status.textContent = text; }

  if (!SpeechRecognition) {
    setStatus('Speech recognition not supported in this browser.');
    micBtn.disabled = true;
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = currentLang === 'hi' ? 'hi-IN' : currentLang === 'or' ? 'or-IN' : 'en-US';
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.addEventListener('start', () => {
    assistantListening = true;
    setStatus('Listening...');
    micBtn.hidden = true;
    stopBtn.hidden = false;
  });

  recognition.addEventListener('end', () => {
    assistantListening = false;
    setStatus('Tap the mic and speak');
    micBtn.hidden = false;
    stopBtn.hidden = true;
  });

  recognition.addEventListener('error', (e) => {
    setStatus('Recognition error: ' + (e.error || e.message));
    assistantListening = false;
    micBtn.hidden = false;
    stopBtn.hidden = true;
  });

  recognition.addEventListener('result', (ev) => {
    const results = ev.results;
    let interim = '';
    let final = '';
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.isFinal) final += r[0].transcript;
      else interim += r[0].transcript;
    }
    transcriptEl.textContent = final || interim;
    if (final) {
      handleAssistantQuery(final.trim(), responseEl);
    }
  });

  micBtn.addEventListener('click', () => {
    try {
      recognition.lang = currentLang === 'hi' ? 'hi-IN' : currentLang === 'or' ? 'or-IN' : 'en-US';
      recognition.start();
    } catch (e) {
      setStatus('Could not start recognition');
    }
  });

  stopBtn.addEventListener('click', () => { try { recognition.stop(); } catch (e) {} });
}


function handleAssistantQuery(text, responseEl) {
  const t = text.toLowerCase();
  let reply = '';

  if (t.includes('ambulance') || t.includes('108') || t.includes('call ambulance')) {
    reply = 'I can call the ambulance for you. Tap confirm to call 108.';
    // Offer immediate call via prompt
    if (confirm('Call ambulance (108) now?')) {
      callNumber('108');
      reply = 'Calling ambulance now.';
    }
  } else if (t.includes('police') || t.includes('100')) {
    if (confirm('Call police (100) now?')) { callNumber('100'); reply = 'Calling police now.'; }
    else reply = 'Okay, I will wait.';
  } else if (t.includes('where') && t.includes('i')) {
    const data = getCurrentLocationLink();
    if (data) { reply = `Your location: ${data.mapsUrl}`; }
    else { reply = 'I cannot find your location yet. Please allow location access.'; }
  } else if (t.includes('blood') || t.includes('blood bank')) {
    reply = 'Opening blood banks list.';
    navigateTo('blood.html');
  } else if (t.includes('hospital') || t.includes('hospitals')) {
    reply = 'Opening nearby hospitals.';
    navigateTo('hospital.html');
  } else if (t.includes('first aid') || t.includes('first-aid') || t.includes('help me')) {
    const tip = firstAidTips[Math.floor(Math.random() * firstAidTips.length)];
    reply = `First-aid tip: ${tip}`;
  } else if (t.includes('help') || t.includes('what can you do')) {
    reply = 'I can call emergency numbers, share your location, open hospitals or blood banks, and give first-aid tips. Say "call ambulance", "where am I", or "first aid".';
  } else {
    reply = "Sorry, I didn't understand. Try 'call ambulance', 'where am I', 'first aid', or 'open hospitals'.";
  }

  if (responseEl) responseEl.textContent = reply;
  try { speakText(reply, currentLang === 'hi' ? 'hi-IN' : currentLang === 'or' ? 'or-IN' : 'en-US'); } catch (e) {}
}


document.addEventListener('DOMContentLoaded', function () {
  initAssistant();
}
);
/* ===============================
   SAHAYA Health Voice Extension
   Extended Version (Safe Add-on)
================================ */

(function () {
  if (!window.handleAssistantQuery) {
    console.warn("Voice assistant base function not found");
    return;
  }

  const originalHandler = window.handleAssistantQuery;

  window.handleAssistantQuery = function (text, responseEl) {
    let reply = "";
    const t = text.toLowerCase();

    // 🤢 Vomiting / nausea
    if (t.includes("vomit") || t.includes("vomiting") || t.includes("nausea")) {
      reply =
        "Vomiting can be caused by infection or food issues. Take small sips of water or ORS. Avoid oily food. If vomiting continues or blood appears, consult a doctor.";
    }

    // 💩 Loose motion / diarrhea
    else if (
      t.includes("loose motion") ||
      t.includes("diarrhea") ||
      t.includes("diarrhoea")
    ) {
      reply =
        "Loose motion can cause dehydration. Drink ORS frequently and eat light food like rice or banana. If it lasts more than one day or there is weakness, please see a doctor.";
    }

    // 🤒 Fever
    else if (t.includes("fever") || t.includes("temperature")) {
      reply =
        "Fever indicates infection. Take rest, drink plenty of fluids, and you may take paracetamol. If fever is high or lasts more than two days, consult a doctor.";
    }

    // 🤧 Cold / cough
    else if (t.includes("cold") || t.includes("cough")) {
      reply =
        "For cold or cough, drink warm fluids and take proper rest. Steam inhalation may help. If cough persists or breathing becomes difficult, consult a doctor.";
    }

    // 🤕 Headache
    else if (t.includes("headache") || t.includes("migraine")) {
      reply =
        "Headache may be due to stress or dehydration. Rest in a quiet place and drink water. If headache is severe or frequent, consult a doctor.";
    }

    // 😷 Infection
    else if (t.includes("infection")) {
      reply =
        "Infections may require medical evaluation. Keep the area clean and avoid self-medication with antibiotics. Please consult a doctor for proper treatment.";
    }

    // 🩹 Skin allergy / itching / rashes
    else if (
      t.includes("skin") ||
      t.includes("allergy") ||
      t.includes("itching") ||
      t.includes("rashes")
    ) {
      reply =
        "Skin allergy can be caused by dust, food, or chemicals. Avoid scratching and keep the area clean. If redness or itching increases, please consult a dermatologist.";
    }

    // 😮‍💨 Breathing problem
    else if (
      t.includes("breathing") ||
      t.includes("shortness of breath")
    ) {
      reply =
        "Breathing difficulty can be serious. Please sit upright and seek medical help immediately. I can help you find nearby hospitals.";
    }

    // ❤️ Chest pain
    else if (t.includes("chest pain")) {
      reply =
        "Chest pain can be serious. Please seek immediate medical attention. I can help you call an ambulance or locate the nearest hospital.";
    }

    // 🤕 Injury / bleeding
    else if (t.includes("injury") || t.includes("bleeding")) {
      reply =
        "For injury, apply pressure to stop bleeding and keep the area clean. If bleeding does not stop or pain is severe, visit a hospital immediately.";
    }
    // 🤢 Stomach pain
else if (
  t.includes("stomach pain") ||
  t.includes("abdominal pain") ||
  t.includes("stomach ache")
) {
  reply =
    "Stomach pain may be due to indigestion, gas, or infection. Avoid oily food, drink warm water, and rest. If pain is severe, continuous, or with vomiting or fever, consult a doctor.";
}

// 🤕 Body pain
else if (
  t.includes("body pain") ||
  t.includes("body ache") ||
  t.includes("muscle pain")
) {
  reply =
    "Body pain can be caused by tiredness, fever, or infection. Take proper rest, drink fluids, and gentle stretching may help. If pain lasts long or is severe, consult a doctor.";
}

    // ❓ Help
    else if (t.includes("help") || t.includes("what can you do")) {
      reply =
        "I can help with health advice, emergency services, hospital search, and first aid guidance. Just tell me your problem.";
    }

    // If nothing matches → old assistant logic
    else {
      return originalHandler(text, responseEl);
    }

    // Show response
    if (responseEl) responseEl.textContent = reply;

    // Speak response
    try {
      const utter = new SpeechSynthesisUtterance(reply);
      utter.lang = "en-IN";
      speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("Speech synthesis error", e);
    }
  };
})
();
document.addEventListener("DOMContentLoaded", () => {

  const cancelBtn = document.getElementById("cancelDispatchBtn");

  if (!cancelBtn) {
    console.error("Cancel Dispatch button not found");
    return;
  }

  cancelBtn.addEventListener("click", () => {

    const confirmCancel = confirm(
      "Are you sure you want to cancel the emergency dispatch?"
    );

    if (!confirmCancel) return;

    // Clear dispatch data
    localStorage.removeItem("dispatchId");
    localStorage.removeItem("selectedService");

    // Optional UI feedback
    alert("Dispatch has been cancelled successfully.");

    // Reload or redirect
    window.location.reload(); 
    // OR use: window.location.href = "index.html";
  });
  
});
/************************
   CHILD LOCK SYSTEM
************************/

let childLockEnabled = false;
let childLockPIN = localStorage.getItem("childLockPIN");

// Buttons
const childLockBtn = document.getElementById("childLockBtn");
const setPasswordBtn = document.getElementById("setPasswordBtn");

/* SET / CHANGE CHILD LOCK PASSWORD */
setPasswordBtn.addEventListener("click", () => {
  const pin = prompt("Set Child Lock Password (min 4 digits):");

  if (!pin || pin.length < 4) {
    alert("❌ Password must be at least 4 digits");
    return;
  }

  localStorage.setItem("childLockPIN", pin);
  childLockPIN = pin;
  alert("✅ Child Lock Password Set Successfully");
});

/* TOGGLE CHILD LOCK */
childLockBtn.addEventListener("click", () => {
  if (!childLockPIN) {
    alert("⚠️ Please set Child Lock Password first");
    return;
  }

  childLockEnabled = !childLockEnabled;
  childLockBtn.innerText = childLockEnabled
    ? "🔒 Child Lock ON"
    : "🔓 Child Lock OFF";
});

/* EMERGENCY CALL FUNCTION (USED BY HTML) */
function callNumber(number) {

  if (childLockEnabled) {
    const enteredPIN = prompt("🔒 Child Lock is ON\nEnter password to continue:");

    if (enteredPIN !== childLockPIN) {
      alert("❌ Wrong Password. Call blocked.");
      return;
    }
  }

  // Defer the call slightly so WebSockets have time to send the emergency request
  setTimeout(() => {
    window.location.href = "tel:" + number;
  }, 1000);
}