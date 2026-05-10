<template>
  <div class="map-wrapper">
    <div class="map-header">
      <h3>🗺️ Mapa de ubicación</h3>
      <p class="map-subtitle">Explora la zona y descubre comercios cercanos</p>
    </div>

    <div class="map-container">
      <!-- Badge de recomendación mejorado -->
      <div class="recommendation-badge" v-if="recommendation" :class="recommendation.level">
        <div class="badge-icon">{{ recommendation.icon }}</div>
        <div class="badge-content">
          <div class="badge-title">Zona de actividad comercial</div>
          <div class="badge-message">{{ recommendation.message }}</div>
        </div>
      </div>
      
      <!-- Loading state -->
      <div v-if="isLoadingPlaces" class="map-loading">
        <div class="loading-spinner"></div>
        <span>Buscando comercios cercanos...</span>
      </div>
      
      <div id="property-map" class="map"></div>
      
      <!-- Controles mejorados -->
      <div class="map-controls">
        <button 
          @click="togglePlaces" 
          class="control-btn places-btn" 
          :class="{ active: showPlaces, 'has-places': placesCount > 0 }"
          :disabled="isLoadingPlaces"
        >
          <span class="btn-icon">{{ showPlaces ? '🏪' : '📍' }}</span>
          <span class="btn-text">{{ showPlaces ? 'Ocultar comercios' : 'Mostrar comercios' }}</span>
          <span class="btn-badge" v-if="placesCount > 0 && !showPlaces">{{ placesCount }}</span>
          <span class="loading-dots" v-if="isLoadingPlaces"></span>
        </button>
        
        <button 
          @click="centerMap" 
          class="control-btn center-btn"
          title="Centrar en la propiedad"
        >
          <span class="btn-icon">🎯</span>
        </button>
        
        <button 
          @click="zoomIn" 
          class="control-btn zoom-btn"
          title="Acercar"
        >
          <span class="btn-icon">+</span>
        </button>
        
        <button 
          @click="zoomOut" 
          class="control-btn zoom-btn"
          title="Alejar"
        >
          <span class="btn-icon">−</span>
        </button>
      </div>
      
      <!-- Leyenda mejorada -->
      <transition name="fade">
        <div class="legend" v-if="showPlaces && places.length > 0">
          <div class="legend-header">
            <span class="legend-title">📍 Comercios cercanos</span>
            <span class="legend-count">{{ places.length }} encontrados</span>
          </div>
          <div class="legend-items">
            <div class="legend-item">
              <span class="marker-icon restaurant">🍽️</span>
              <span>Restaurantes y cafés</span>
            </div>
            <div class="legend-item">
              <span class="marker-icon shopping">🛒</span>
              <span>Tiendas y supermercados</span>
            </div>
            <div class="legend-item">
              <span class="marker-icon service">🏧</span>
              <span>Servicios (bancos, farmacias)</span>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Información de zona -->
    <div class="zone-info" v-if="recommendation">
      <div class="zone-tip" :class="recommendation.level">
        <span class="tip-icon">💡</span>
        <div class="tip-content">
          <strong>Consejo del viajero</strong>
          <p>{{ getTravelTip() }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { usePlacesStore } from '../stores/places';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  propertyId: {
    type: String,
    required: true
  },
  initialLat: {
    type: Number,
    required: true
  },
  initialLng: {
    type: Number,
    required: true
  },
  propertyTitle: {
    type: String,
    default: 'Alojamiento'
  }
});

const placesStore = usePlacesStore();
const places = computed(() => placesStore.nearbyPlaces);
const recommendation = computed(() => placesStore.recommendation);
const isLoading = computed(() => placesStore.isLoading);
const placesCount = computed(() => places.value.length);

// Estado local
let map = null;
let propertyMarker = null;
let placeMarkers = [];
const showPlaces = ref(false);
const isLoadingPlaces = ref(false);

// Iconos personalizados mejorados
const getMarkerIcon = (category) => {
  const icons = {
    shopping: L.divIcon({
      html: '<div class="custom-marker shopping-marker">🛒<span class="marker-pulse"></span></div>',
      className: 'custom-marker-wrapper',
      iconSize: [40, 40],
      popupAnchor: [0, -20]
    }),
    restaurant: L.divIcon({
      html: '<div class="custom-marker restaurant-marker">🍽️<span class="marker-pulse"></span></div>',
      className: 'custom-marker-wrapper',
      iconSize: [40, 40],
      popupAnchor: [0, -20]
    }),
    service: L.divIcon({
      html: '<div class="custom-marker service-marker">🏧<span class="marker-pulse"></span></div>',
      className: 'custom-marker-wrapper',
      iconSize: [40, 40],
      popupAnchor: [0, -20]
    }),
    default: L.divIcon({
      html: '<div class="custom-marker default-marker">📍<span class="marker-pulse"></span></div>',
      className: 'custom-marker-wrapper',
      iconSize: [40, 40],
      popupAnchor: [0, -20]
    })
  };
  
  return icons[category] || icons.default;
};

// Inicializar mapa
const initMap = () => {
  if (!map) {
    map = L.map('property-map').setView([props.initialLat, props.initialLng], 15);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      className: 'map-tiles'
    }).addTo(map);
  }
  
  // Marcador de la propiedad con animación
  if (propertyMarker) {
    propertyMarker.remove();
  }
  
  const propertyIcon = L.divIcon({
    html: `
      <div class="property-marker">
        <span class="marker-icon">🏠</span>
        <span class="marker-label">${props.propertyTitle}</span>
        <span class="marker-ripple"></span>
      </div>
    `,
    className: 'property-marker-wrapper',
    iconSize: [80, 50],
    popupAnchor: [0, -25]
  });
  
  propertyMarker = L.marker([props.initialLat, props.initialLng], {
    icon: propertyIcon,
    riseOnHover: true
  }).addTo(map);
  
  propertyMarker.bindPopup(`
    <div class="custom-popup">
      <strong>${props.propertyTitle}</strong>
      <p>📍 Ubicación del alojamiento</p>
      <small>Haz clic en "Mostrar comercios" para ver lugares cercanos</small>
    </div>
  `);
};

// Cargar comercios cercanos
const loadNearbyPlaces = async () => {
  isLoadingPlaces.value = true;
  try {
    await placesStore.fetchNearbyPlaces(props.propertyId);
  } catch (error) {
    console.error('Error loading places:', error);
  } finally {
    isLoadingPlaces.value = false;
  }
};

// Toggle comercios
const togglePlaces = async () => {
  if (!showPlaces.value) {
    if (placesStore.nearbyPlaces.length === 0) {
      await loadNearbyPlaces();
    }
    showPlaces.value = true;
    addPlaceMarkers();
  } else {
    showPlaces.value = false;
    clearPlaceMarkers();
  }
};

// Agregar marcadores de comercios
const addPlaceMarkers = () => {
  clearPlaceMarkers();
  
  places.value.forEach((place, index) => {
    const marker = L.marker([place.lat, place.lon], {
      icon: getMarkerIcon(place.category),
      riseOnHover: true
    }).addTo(map);
    
    const distanceText = place.distance < 1000 
      ? `${Math.round(place.distance)} metros` 
      : `${(place.distance / 1000).toFixed(1)} km`;
    
    const categoryText = {
      restaurant: '🍽️ Restaurante/Café',
      shopping: '🛒 Tienda/Supermercado',
      service: '🏧 Servicio'
    }[place.category] || '📍 Comercio local';
    
    marker.bindPopup(`
      <div class="custom-popup place-popup">
        <strong>${place.name}</strong>
        <div class="popup-category">${categoryText}</div>
        <div class="popup-distance">📏 Distancia: ${distanceText}</div>
        <div class="popup-action">
          <small>${index === 0 ? '⭐ Más cercano' : ''}</small>
        </div>
      </div>
    `);
    
    // Animación escalonada para los marcadores
    setTimeout(() => {
      marker.openPopup();
      setTimeout(() => marker.closePopup(), 2000);
    }, index * 200);
    
    placeMarkers.push(marker);
  });
  
  // Ajustar vista si hay marcadores
  if (placeMarkers.length > 0 && map) {
    const allPoints = [propertyMarker.getLatLng(), ...placeMarkers.map(m => m.getLatLng())];
    const bounds = L.latLngBounds(allPoints);
    map.fitBounds(bounds, { padding: [50, 50] });
  }
};

// Limpiar marcadores de comercios
const clearPlaceMarkers = () => {
  placeMarkers.forEach(marker => marker.remove());
  placeMarkers = [];
};

// Controles del mapa
const centerMap = () => {
  if (map && propertyMarker) {
    map.setView([props.initialLat, props.initialLng], 15);
    propertyMarker.openPopup();
    setTimeout(() => propertyMarker.closePopup(), 3000);
  }
};

const zoomIn = () => {
  if (map) {
    map.zoomIn();
  }
};

const zoomOut = () => {
  if (map) {
    map.zoomOut();
  }
};

// Consejos según la zona
const getTravelTip = () => {
  if (!recommendation.value) return '';
  
  const tips = {
    high: '🚗 Puedes moverte fácilmente caminando, todo está cerca. ¡Aprovecha para conocer los comercios locales!',
    medium: '🚶‍♂️ Hay varias opciones a poca distancia. Te recomendamos explorar a pie o en bicicleta.',
    low: '🚕 Zona residencial tranquila. Considera llevar provisiones o usar transporte local.',
    very_low: '🌿 Perfecto para desconectar. Planifica tus compras y actividades con anticipación.'
  };
  return tips[recommendation.value.level] || 'Disfruta de tu estancia y explora los alrededores.';
};

// Actualizar mapa si cambian las coordenadas
watch([() => props.initialLat, () => props.initialLng], () => {
  if (map && propertyMarker) {
    map.setView([props.initialLat, props.initialLng], 15);
    propertyMarker.setLatLng([props.initialLat, props.initialLng]);
  }
});

// Cargar comercios cuando se activa el toggle
watch(showPlaces, (newVal) => {
  if (newVal && places.value.length === 0 && !isLoading.value && !isLoadingPlaces.value) {
    loadNearbyPlaces();
  }
});

// Crear estilos CSS dinámicos para los marcadores
const addDynamicStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .custom-marker {
      position: relative;
      font-size: 24px;
      filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3));
      transition: transform 0.2s;
      cursor: pointer;
    }
    
    .custom-marker:hover {
      transform: scale(1.2);
    }
    
    .marker-pulse {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 30px;
      height: 30px;
      margin: -15px 0 0 -15px;
      border-radius: 50%;
      background: rgba(255,255,255,0.4);
      animation: markerPulse 1.5s ease-out infinite;
      pointer-events: none;
    }
    
    @keyframes markerPulse {
      0% {
        transform: scale(0.5);
        opacity: 1;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }
    
    .property-marker {
      position: relative;
      text-align: center;
    }
    
    .marker-icon {
      font-size: 32px;
      filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3));
    }
    
    .marker-label {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      background: #2e7d32;
      color: white;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 10px;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
    }
    
    .property-marker:hover .marker-label {
      opacity: 1;
    }
    
    .marker-ripple {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 60px;
      height: 60px;
      margin: -30px 0 0 -30px;
      border-radius: 50%;
      background: rgba(46,125,50,0.3);
      animation: ripple 2s ease-out infinite;
      pointer-events: none;
    }
    
    @keyframes ripple {
      0% {
        transform: scale(0.5);
        opacity: 0.8;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }
    
    .custom-popup {
      min-width: 180px;
    }
    
    .custom-popup strong {
      font-size: 14px;
      color: #2e7d32;
    }
    
    .custom-popup p {
      margin: 4px 0;
      font-size: 12px;
      color: #666;
    }
    
    .place-popup .popup-category {
      font-size: 12px;
      color: #ff9800;
      margin: 4px 0;
    }
    
    .place-popup .popup-distance {
      font-size: 11px;
      color: #666;
    }
    
    .place-popup .popup-action {
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1px solid #eee;
      font-size: 10px;
      color: #2e7d32;
    }
  `;
  document.head.appendChild(style);
};

onMounted(() => {
  initMap();
  addDynamicStyles();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
.map-wrapper {
  margin: 1.5rem 0;
  background: var(--bg-primary);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.map-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.map-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.map-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.map-container {
  position: relative;
  min-height: 450px;
}

.map {
  height: 450px;
  width: 100%;
  z-index: 1;
}

/* Recommendation Badge */
.recommendation-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  background: white;
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  max-width: 300px;
  display: flex;
  gap: 12px;
  backdrop-filter: blur(8px);
  background: rgba(255,255,255,0.95);
  cursor: pointer;
  transition: transform 0.2s;
}

.recommendation-badge:hover {
  transform: translateY(-2px);
}

.badge-icon {
  font-size: 28px;
}

.badge-title {
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.badge-message {
  font-size: 12px;
  line-height: 1.4;
}

.recommendation-badge.high { 
  border-left: 3px solid #27ae60; 
}
.recommendation-badge.medium { 
  border-left: 3px solid #ff9800; 
}
.recommendation-badge.low { 
  border-left: 3px solid #2196f3; 
}
.recommendation-badge.very_low { 
  border-left: 3px solid #9e9e9e; 
}

/* Map Controls */
.map-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-btn {
  width: 44px;
  height: 44px;
  background: white;
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 1.2rem;
}

.control-btn:hover {
  background: #2e7d32;
  color: white;
  transform: scale(1.05);
}

.places-btn {
  width: auto;
  padding: 0 16px;
  gap: 8px;
  background: #2c3e50;
  color: white;
}

.places-btn.active {
  background: #1abc9c;
}

.places-btn.has-places {
  background: #27ae60;
}

.places-btn .btn-badge {
  background: rgba(255,255,255,0.3);
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 11px;
}

.places-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Legend */
.legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 10;
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  padding: 12px 16px;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  min-width: 180px;
}

.legend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.legend-title {
  font-weight: 600;
  font-size: 12px;
  color: #2c3e50;
}

.legend-count {
  font-size: 10px;
  color: #27ae60;
  background: #e8f5e9;
  padding: 2px 8px;
  border-radius: 12px;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: #555;
}

.marker-icon {
  font-size: 18px;
  min-width: 28px;
}

/* Map Loading */
.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 12px 24px;
  border-radius: 40px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Zone Info */
.zone-info {
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.zone-tip {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
}

.zone-tip.high {
  background: #e8f5e9;
}

.zone-tip.medium {
  background: #fff3e0;
}

.zone-tip.low {
  background: #e3f2fd;
}

.zone-tip.very_low {
  background: #f5f5f5;
}

.tip-icon {
  font-size: 24px;
}

.tip-content strong {
  display: block;
  font-size: 13px;
  margin-bottom: 4px;
}

.tip-content p {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .map {
    height: 350px;
  }
  
  .recommendation-badge {
    top: 8px;
    left: 8px;
    right: 8px;
    max-width: none;
    padding: 8px 12px;
  }
  
  .badge-icon {
    font-size: 20px;
  }
  
  .badge-message {
    font-size: 10px;
  }
  
  .legend {
    bottom: 8px;
    left: 8px;
    right: 8px;
    min-width: auto;
  }
  
  .legend-items {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .map-controls {
    bottom: 8px;
    right: 8px;
  }
  
  .control-btn {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
  
  .places-btn {
    width: auto;
    padding: 0 12px;
  }
  
  .zone-tip {
    flex-direction: column;
    text-align: center;
  }
  
  .tip-icon {
    margin: 0 auto;
  }
}
</style>