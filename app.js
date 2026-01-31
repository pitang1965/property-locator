/**
 * Property Location Estimator
 * 物件位置推定マップ
 */

const STORAGE_KEY = 'propertyLocator_facilities';

// Initial facility data (example: Tokyo Station area)
const initialFacilities = [
  { name: "東京駅", distance: 800, enabled: true, lat: 35.6812, lng: 139.7671 },
  { name: "日本橋駅", distance: 400, enabled: true, lat: 35.6818, lng: 139.7744 },
  { name: "三越前駅", distance: 480, enabled: true, lat: 35.6858, lng: 139.7734 },
];

let facilities = loadFacilities();

/**
 * Save facilities to localStorage
 */
function saveFacilities() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(facilities));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

/**
 * Load facilities from localStorage
 */
function loadFacilities() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
  }
  return [...initialFacilities];
}

/**
 * Reset all data
 */
function resetAllData() {
  if (confirm('すべてのデータをリセットしますか？')) {
    facilities = [...initialFacilities];
    saveFacilities();
    clearMap();
    renderFacilityList();
  }
}
let map;
let circles = [];
let markers = [];
let estimatedMarker = null;
let settingLocationFor = null; // Index of facility being set manually

// Color palette
const colors = [
  '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00',
  '#ffff33', '#a65628', '#f781bf', '#999999', '#66c2a5'
];

/**
 * Extract coordinates from Google Maps URL or coordinate string
 */
function extractCoordinates(input) {
  if (!input) return null;

  // Pin location (!3d and !4d)
  const pinCoords = input.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (pinCoords) {
    return {
      lat: parseFloat(pinCoords[1]),
      lng: parseFloat(pinCoords[2]),
    };
  }

  // Simple lat,lng format: "34.1948618,132.2084567"
  const simpleCoords = input.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (simpleCoords) {
    return {
      lat: parseFloat(simpleCoords[1]),
      lng: parseFloat(simpleCoords[2]),
    };
  }

  // Map center (/@lat,lng)
  const centerCoords = input.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (centerCoords) {
    return {
      lat: parseFloat(centerCoords[1]),
      lng: parseFloat(centerCoords[2]),
    };
  }

  // place/Name/@lat,lng format
  const placeCoords = input.match(/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (placeCoords) {
    return {
      lat: parseFloat(placeCoords[1]),
      lng: parseFloat(placeCoords[2]),
    };
  }

  return null;
}

/**
 * Initialize the map
 */
function initMap() {
  // Start with a view of Japan
  map = L.map('map').setView([36.0, 138.0], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Map click handler for manual location setting
  map.on('click', function(e) {
    if (settingLocationFor !== null) {
      setFacilityLocation(settingLocationFor, e.latlng.lat, e.latlng.lng);
      settingLocationFor = null;
      map.getContainer().style.cursor = '';
      document.getElementById('mapInstruction').style.display = 'none';
    }
  });

  // Legend control
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = '<h4>凡例</h4><div id="legendContent"></div>';
    return div;
  };
  legend.addTo(map);

  renderFacilityList();
}

/**
 * Set facility location manually
 */
function setFacilityLocation(index, lat, lng) {
  facilities[index].lat = lat;
  facilities[index].lng = lng;
  saveFacilities();
  renderFacilityList();
}

/**
 * Start setting location by map click
 */
function startSettingLocation(index) {
  settingLocationFor = index;
  map.getContainer().style.cursor = 'crosshair';
  document.getElementById('mapInstruction').style.display = 'block';
  document.getElementById('mapInstruction').textContent = `「${facilities[index].name || '施設' + (index + 1)}」の位置を地図上でクリックしてください`;
}

/**
 * Set location from clipboard/paste
 */
function setLocationFromInput(index) {
  const input = prompt('Google MapsのURLまたは座標（緯度,経度）を貼り付けてください:');
  if (!input) return;

  const coords = extractCoordinates(input.trim());
  if (coords) {
    setFacilityLocation(index, coords.lat, coords.lng);
    // Center map on the new location
    map.setView([coords.lat, coords.lng], 15);
  } else {
    alert('座標を読み取れませんでした。\n\n対応形式:\n・Google Maps URL\n・緯度,経度（例: 35.123,139.456）');
  }
}

/**
 * Clear facility location
 */
function clearFacilityLocation(index) {
  facilities[index].lat = null;
  facilities[index].lng = null;
  saveFacilities();
  renderFacilityList();
}

/**
 * Render facility list in sidebar
 */
function renderFacilityList() {
  const container = document.getElementById('facilityList');
  container.innerHTML = '';

  facilities.forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'facility-item';
    item.id = `facility-${i}`;

    const hasLocation = f.lat !== null && f.lng !== null;
    const locationStatus = hasLocation
      ? `<span class="location-set">位置設定済</span>`
      : `<span class="location-unset">位置未設定</span>`;

    const locationButtons = hasLocation
      ? `<button class="btn-location btn-clear-location" onclick="clearFacilityLocation(${i})" title="位置をクリア">✕</button>`
      : `<button class="btn-location" onclick="startSettingLocation(${i})" title="地図をクリックして設定">📍</button>
         <button class="btn-location" onclick="setLocationFromInput(${i})" title="URL/座標を貼り付け">📋</button>`;

    item.innerHTML = `
      <div class="facility-header">
        <input type="checkbox" ${f.enabled ? 'checked' : ''}
               onchange="toggleFacility(${i}, this.checked)"
               aria-label="施設を有効化">
        <input type="text" class="facility-name"
               onchange="updateFacilityName(${i}, this.value)"
               placeholder="施設名を入力">
        <button class="btn-remove" onclick="removeFacility(${i})" aria-label="削除">✕</button>
      </div>
      <div class="facility-details">
        <label>距離:</label>
        <input type="number" value="${f.distance}"
               onchange="updateFacilityDistance(${i}, this.value)"
               min="0" step="10"> m
        <span class="facility-status" id="status-${i}"></span>
      </div>
      <div class="facility-location">
        ${locationStatus}
        ${locationButtons}
      </div>
    `;

    // Set value via DOM API to avoid HTML escaping issues
    item.querySelector('.facility-name').value = f.name;
    container.appendChild(item);
  });
}

/**
 * Escape HTML special characters for attributes
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Toggle facility enabled state
 */
function toggleFacility(index, enabled) {
  facilities[index].enabled = enabled;
  saveFacilities();
}

/**
 * Update facility name
 */
function updateFacilityName(index, name) {
  facilities[index].name = name;
  saveFacilities();
}

/**
 * Update facility distance
 */
function updateFacilityDistance(index, distance) {
  facilities[index].distance = parseInt(distance) || 0;
  saveFacilities();
}

/**
 * Add new facility
 */
function addFacility() {
  facilities.push({ name: "", distance: 500, enabled: true, lat: null, lng: null });
  saveFacilities();
  renderFacilityList();
  // Focus on the new facility's name input
  const inputs = document.querySelectorAll('.facility-name');
  if (inputs.length > 0) {
    inputs[inputs.length - 1].focus();
  }
}

/**
 * Remove facility
 */
function removeFacility(index) {
  facilities.splice(index, 1);
  saveFacilities();
  renderFacilityList();
}

/**
 * Main draw function - uses manually set locations
 */
function searchAndDraw() {
  clearMap();

  const ratio = parseFloat(document.getElementById('distanceRatio').value) || 0.75;
  const enabledFacilities = facilities.filter(f => f.enabled && f.lat !== null && f.lng !== null);

  if (enabledFacilities.length === 0) {
    alert('位置が設定された施設がありません。\n\n📍ボタンで地図をクリック、または📋ボタンでGoogle Maps URLを貼り付けて位置を設定してください。');
    return;
  }

  const results = [];
  let legendHTML = '';

  enabledFacilities.forEach((f, i) => {
    const color = colors[i % colors.length];
    const radius = f.distance * ratio;

    // Add marker
    const marker = L.marker([f.lat, f.lng]).addTo(map);
    marker.bindPopup(`<b>${escapeHtml(f.name || '施設' + (i + 1))}</b><br>徒歩距離: ${f.distance}m<br>推定直線: ${Math.round(radius)}m`);
    markers.push(marker);

    // Add circle
    const circle = L.circle([f.lat, f.lng], {
      radius: radius,
      color: color,
      fillColor: color,
      fillOpacity: 0.15,
      weight: 2
    }).addTo(map);
    circles.push(circle);

    results.push({ ...f, radius });

    const displayName = (f.name || '施設' + (i + 1));
    const shortName = displayName.length > 15 ? displayName.substring(0, 15) + '...' : displayName;
    legendHTML += `<div class="legend-item">
      <div class="legend-color" style="background:${color}"></div>
      ${escapeHtml(shortName)}
    </div>`;
  });

  document.getElementById('legendContent').innerHTML = legendHTML;

  // Calculate estimated position
  if (results.length >= 2) {
    const estimated = estimatePosition(results);
    if (estimated) {
      estimatedMarker = L.marker([estimated.lat, estimated.lng], {
        icon: L.divIcon({
          className: 'estimated-marker',
          html: '<div style="background:#ff0000;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(0,0,0,0.5);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(map);
      estimatedMarker.bindPopup('<b>推定物件位置</b>').openPopup();
    }
  }

  // Fit bounds to show all elements
  if (circles.length > 0) {
    const group = L.featureGroup([...circles, ...markers]);
    map.fitBounds(group.getBounds().pad(0.1));
  }
}

/**
 * Estimate position using weighted centroid
 */
function estimatePosition(results) {
  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;

  results.forEach(r => {
    // Shorter distance = higher weight (higher precision)
    const weight = 1 / (r.radius * r.radius);
    totalWeight += weight;
    weightedLat += r.lat * weight;
    weightedLng += r.lng * weight;
  });

  if (totalWeight > 0) {
    return {
      lat: weightedLat / totalWeight,
      lng: weightedLng / totalWeight
    };
  }
  return null;
}

/**
 * Clear all map elements
 */
function clearMap() {
  circles.forEach(c => map.removeLayer(c));
  markers.forEach(m => map.removeLayer(m));
  if (estimatedMarker) map.removeLayer(estimatedMarker);
  circles = [];
  markers = [];
  estimatedMarker = null;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initMap);
