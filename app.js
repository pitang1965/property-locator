/**
 * Property Location Estimator
 * 物件位置推定マップ
 */

// Initial facility data
const initialFacilities = [
  { name: "江戸川区立東篠崎保育園", distance: 730, enabled: true },
  { name: "江戸川区立篠崎第三小学校", distance: 660, enabled: true },
  { name: "江戸川区立篠崎第二中学校", distance: 380, enabled: true },
  { name: "東京さくら病院", distance: 270, enabled: true },
  { name: "Olympic 下篠崎店", distance: 690, enabled: true },
  { name: "ファミリーマート 篠崎町三丁目店", distance: 370, enabled: true },
  { name: "テン・ドラッグ 篠崎店", distance: 650, enabled: true },
  { name: "江戸川篠崎郵便局", distance: 190, enabled: true },
  { name: "篠崎六丁目第2広場", distance: 1190, enabled: true },
];

let facilities = [...initialFacilities];
let map;
let circles = [];
let markers = [];
let estimatedMarker = null;

// Color palette
const colors = [
  '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00',
  '#ffff33', '#a65628', '#f781bf', '#999999', '#66c2a5'
];

/**
 * Initialize the map
 */
function initMap() {
  map = L.map('map').setView([35.6762, 139.8547], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

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
 * Render facility list in sidebar
 */
function renderFacilityList() {
  const container = document.getElementById('facilityList');
  container.innerHTML = '';

  facilities.forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'facility-item';
    item.id = `facility-${i}`;

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
}

/**
 * Update facility name
 */
function updateFacilityName(index, name) {
  facilities[index].name = name;
}

/**
 * Update facility distance
 */
function updateFacilityDistance(index, distance) {
  facilities[index].distance = parseInt(distance) || 0;
}

/**
 * Add new facility
 */
function addFacility() {
  facilities.push({ name: "", distance: 500, enabled: true });
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
  renderFacilityList();
}

/**
 * Geocode facility name using Nominatim API
 */
async function geocode(name) {
  const query = encodeURIComponent(name + " 東京都江戸川区");
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=jp`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'PropertyLocator/1.0' }
    });
    const data = await response.json();

    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
  } catch (e) {
    console.error('Geocoding error:', e);
  }
  return null;
}

/**
 * Main search and draw function
 */
async function searchAndDraw() {
  document.getElementById('loading').style.display = 'block';
  clearMap();

  const ratio = parseFloat(document.getElementById('distanceRatio').value) || 0.75;
  const enabledFacilities = facilities.filter(f => f.enabled && f.name);
  const results = [];
  let legendHTML = '';

  for (let i = 0; i < enabledFacilities.length; i++) {
    const f = enabledFacilities[i];
    const originalIndex = facilities.indexOf(f);
    const color = colors[i % colors.length];

    // Wait between API calls to respect rate limits
    if (i > 0) await new Promise(r => setTimeout(r, 1100));

    const result = await geocode(f.name);
    const statusEl = document.getElementById(`status-${originalIndex}`);
    const itemEl = document.getElementById(`facility-${originalIndex}`);

    if (result) {
      statusEl.textContent = '検出';
      statusEl.className = 'facility-status status-found';
      itemEl.className = 'facility-item found';

      // Convert walking distance to straight-line distance
      const radius = f.distance * ratio;

      // Add marker
      const marker = L.marker([result.lat, result.lng]).addTo(map);
      marker.bindPopup(`<b>${escapeHtml(f.name)}</b><br>徒歩距離: ${f.distance}m<br>推定直線: ${Math.round(radius)}m`);
      markers.push(marker);

      // Add circle
      const circle = L.circle([result.lat, result.lng], {
        radius: radius,
        color: color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 2
      }).addTo(map);
      circles.push(circle);

      results.push({ ...f, lat: result.lat, lng: result.lng, radius });

      const displayName = f.name.length > 15 ? f.name.substring(0, 15) + '...' : f.name;
      legendHTML += `<div class="legend-item">
        <div class="legend-color" style="background:${color}"></div>
        ${escapeHtml(displayName)}
      </div>`;
    } else {
      statusEl.textContent = '未検出';
      statusEl.className = 'facility-status status-not-found';
      itemEl.className = 'facility-item not-found';
    }
  }

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

      map.setView([estimated.lat, estimated.lng], 16);
    }
  }

  // Fit bounds to show all elements
  if (circles.length > 0) {
    const group = L.featureGroup([...circles, ...markers]);
    map.fitBounds(group.getBounds().pad(0.1));
  }

  document.getElementById('loading').style.display = 'none';
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

  // Reset status indicators
  facilities.forEach((_, i) => {
    const statusEl = document.getElementById(`status-${i}`);
    const itemEl = document.getElementById(`facility-${i}`);
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.className = 'facility-status';
    }
    if (itemEl) {
      itemEl.className = 'facility-item';
    }
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initMap);
