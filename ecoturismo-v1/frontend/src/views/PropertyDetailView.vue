<template>
  <div v-if="loading" class="loading-state">
    <div class="spinner"></div>
    <p>Cargando detalles de la propiedad...</p>
  </div>
  
  <div v-else-if="property" class="property-detail">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <router-link to="/">Inicio</router-link>
      <span>/</span>
      <router-link to="/properties">Alojamientos</router-link>
      <span>/</span>
      <span class="current">{{ property.title }}</span>
    </div>

    <!-- Galería de imágenes mejorada -->
    <div class="gallery-section">
      <div class="gallery">
        <div class="main-image">
          <img :src="getImageUrl(property.images[currentImageIndex])" :alt="property.title">
          <button v-if="property.images.length > 1" class="nav prev" @click="prevImage">‹</button>
          <button v-if="property.images.length > 1" class="nav next" @click="nextImage">›</button>
          <div class="image-counter" v-if="property.images.length > 1">
            {{ currentImageIndex + 1 }} / {{ property.images.length }}
          </div>
        </div>
        <div v-if="property.images.length > 1" class="thumbnail-list">
          <div 
            v-for="(image, index) in property.images" 
            :key="index"
            class="thumbnail"
            :class="{ active: currentImageIndex === index }"
            @click="currentImageIndex = index"
          >
            <img :src="getImageUrl(image)" :alt="`Imagen ${index + 1}`">
          </div>
        </div>
      </div>
    </div>

    <div class="detail-container">
      <div class="main-info">
        <!-- Header con título y calificación -->
        <div class="header">
          <div>
            <h1>{{ property.title }}</h1>
            <div class="header-meta">
              <div class="rating">
                <div class="stars">
                  <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(property.averageRating) }">★</span>
                </div>
                <span class="rating-value">{{ property.averageRating.toFixed(1) }}</span>
                <span class="reviews-count">({{ property.totalReviews }} reseñas)</span>
              </div>
              <div class="type-badge">{{ getTypeLabel(property.type) }}</div>
            </div>
          </div>
          <div class="share-buttons">
            <button class="share-btn" @click="shareProperty" title="Compartir">
              📤
            </button>
            <button class="favorite-btn" @click="toggleFavorite" :class="{ active: isFavorite }" title="Guardar en favoritos">
              {{ isFavorite ? '❤️' : '🤍' }}
            </button>
          </div>
        </div>

        <!-- Anfitrión -->
        <div class="host-card">
          <div class="host-info">
            <img :src="property.hostId.avatar" :alt="property.hostId.name" class="host-avatar">
            <div>
              <strong>Anfitrión: {{ property.hostId.name }}</strong>
              <p>Miembro desde {{ formatDate(property.createdAt) }}</p>
            </div>
          </div>
          <button class="contact-host-btn" @click="contactHost">
            💬 Contactar anfitrión
          </button>
        </div>

        <!-- Descripción -->
        <div class="description-card">
          <h3>📝 Acerca de este alojamiento</h3>
          <p class="description-text">{{ property.description }}</p>
        </div>

        <!-- Características principales -->
        <div class="features-grid">
          <div class="feature-item">
            <span class="feature-icon">🛏️</span>
            <div>
              <strong>{{ property.bedrooms }} habitaciones</strong>
              <small>{{ property.capacity.adults }} adultos + {{ property.capacity.children }} niños</small>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🚽</span>
            <div>
              <strong>{{ property.bathrooms }} baños</strong>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📏</span>
            <div>
              <strong>{{ property.area }} m²</strong>
              <small>de espacio</small>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">⏰</span>
            <div>
              <strong>Check-in: {{ property.checkInTime }}</strong>
              <small>Check-out: {{ property.checkOutTime }}</small>
            </div>
          </div>
        </div>

        <!-- Amenidades -->
        <div class="amenities-card">
          <h3>✨ Servicios y Amenidades</h3>
          <div class="amenities-grid">
            <div v-for="amenity in property.amenities" :key="amenity" class="amenity-item">
              <span class="amenity-icon">{{ getAmenityIcon(amenity) }}</span>
              <span>{{ getAmenityName(amenity) }}</span>
            </div>
          </div>
        </div>

        <!-- Reglas -->
        <div class="rules-card">
          <h3>📋 Reglas de la casa</h3>
          <div class="rules-list">
            <div v-for="rule in property.rules" :key="rule" class="rule-item">
              <span class="rule-icon">{{ getRuleIcon(rule) }}</span>
              <span>{{ getRuleName(rule) }}</span>
            </div>
          </div>
        </div>

        <!-- Ubicación mejorada -->
        <div class="location-card">
          <h3>📍 Ubicación</h3>
          <div class="location-info">
            <p class="address">{{ property.location.address }}</p>
            <p class="city">{{ property.location.city }}, {{ property.location.department }}, {{ property.location.country }}</p>
          </div>
          <div id="map" class="map"></div>
        </div>

        <!-- Sección de reseñas -->
        <ReviewsSection :property-id="property._id" :host-id="property.hostId._id" />
      </div>

      <!-- Booking Card mejorada -->
      <div class="booking-sidebar">
        <div class="booking-card">
          <div class="price-section">
            <div class="price">
              <span class="price-amount">${{ formatPrice(property.pricePerNight) }}</span>
              <span class="price-period">/ noche</span>
            </div>
            <div v-if="property.discountPercent" class="discount-badge">
              🔥 {{ property.discountPercent }}% de descuento
            </div>
          </div>

          <!-- Calendario de fechas -->
          <div class="date-section">
            <div class="date-input-group">
              <label>📅 Llegada</label>
              <input 
                type="date" 
                v-model="checkInDate" 
                :min="today"
                :max="maxDate"
                @change="updateCheckIn"
                class="date-input"
              />
            </div>
            <div class="date-input-group">
              <label>📅 Salida</label>
              <input 
                type="date" 
                v-model="checkOutDate" 
                :min="checkInDate || today"
                :max="maxDate"
                @change="updateCheckOut"
                :disabled="!checkInDate"
                class="date-input"
              />
            </div>
          </div>

          <!-- Resumen de fechas -->
          <div v-if="checkInDate && checkOutDate && !dateError" class="date-summary-card">
            <div class="summary-item">
              <span>📅 Fechas</span>
              <strong>{{ formatDateShort(checkInDate) }} - {{ formatDateShort(checkOutDate) }}</strong>
            </div>
            <div class="summary-item">
              <span>🌙 Noches</span>
              <strong>{{ nights }} {{ nights === 1 ? 'noche' : 'noches' }}</strong>
            </div>
          </div>

          <div v-if="dateError" class="error-card">
            <span class="error-icon">⚠️</span>
            <span>{{ dateError }}</span>
          </div>

          <!-- Selector de huéspedes -->
          <div class="guests-section" v-if="checkInDate && checkOutDate && !dateError">
            <label>👥 Huéspedes</label>
            <select v-model="guests" class="guests-select">
              <option v-for="n in maxGuests" :key="n" :value="n">
                {{ n }} {{ n === 1 ? 'huésped' : 'huéspedes' }}
              </option>
            </select>
          </div>

          <!-- Desglose de precios -->
          <div class="price-breakdown" v-if="nights > 0 && !dateError">
            <div class="breakdown-item">
              <span>${{ formatPrice(property.pricePerNight) }} x {{ nights }} noches</span>
              <span>${{ formatPrice(property.pricePerNight * nights) }}</span>
            </div>
            <div v-if="property.discountPercent" class="breakdown-item discount">
              <span>Descuento {{ property.discountPercent }}%</span>
              <span class="discount-amount">-${{ formatPrice(Math.round(property.pricePerNight * nights * property.discountPercent / 100)) }}</span>
            </div>
            <div class="breakdown-item total">
              <strong>Total</strong>
              <strong class="total-amount">${{ formatPrice(totalPrice) }}</strong>
            </div>
          </div>

          <!-- Botón de reserva -->
          <button 
            class="btn-reserve" 
            @click="createReservation"
            :disabled="!canReserve || reserving"
          >
            <span v-if="reserving" class="btn-loader"></span>
            {{ reserving ? 'Procesando...' : 'Reservar ahora' }}
          </button>

          <!-- Mensajes de advertencia -->
          <div v-if="!authStore.isAuthenticated" class="warning-message login-warning">
            <span>🔐</span>
            <router-link to="/login">Inicia sesión</router-link> para realizar una reserva
          </div>
          <div v-if="authStore.user?._id === property.hostId._id" class="warning-message host-warning">
            <span>⚠️</span>
            No puedes reservar tu propia propiedad
          </div>

          <!-- Información adicional -->
          <div class="info-note">
            <div class="note-item">
              <span>✅</span>
              <span>No se cobrará hasta que confirmes</span>
            </div>
            <div class="note-item">
              <span>🆓</span>
              <span>Cancelación gratuita hasta 24 horas antes</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mapa de comercios cercanos -->
    <PropertyMap
      :property-id="property._id"
      :initial-lat="property.location.coordinates[1]"
      :initial-lng="property.location.coordinates[0]"
      :property-title="property.title"
    />

    <!-- Modal de pago mejorado -->
    <div v-if="showPaymentModal" class="modal-overlay" @click.self="closePaymentModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>💳 Confirmar reserva</h2>
          <button class="modal-close" @click="closePaymentModal">✕</button>
        </div>
        
        <div class="booking-summary-modal">
          <div class="property-summary">
            <img :src="getMainImage(property)" :alt="property.title" class="summary-image">
            <div>
              <h4>{{ property?.title }}</h4>
              <p class="summary-location">📍 {{ property?.location.city }}, {{ property?.location.department }}</p>
            </div>
          </div>
          
          <div class="dates-summary">
            <div class="date-box">
              <span>📅 Llegada</span>
              <strong>{{ formatDisplayDate(bookingCreated?.checkIn) }}</strong>
            </div>
            <div class="date-arrow">→</div>
            <div class="date-box">
              <span>📅 Salida</span>
              <strong>{{ formatDisplayDate(bookingCreated?.checkOut) }}</strong>
            </div>
          </div>
          
          <div class="price-summary">
            <div class="price-row">
              <span>Precio total</span>
              <strong>${{ formatPrice(bookingCreated?.totalPrice) }}</strong>
            </div>
            <div class="price-row">
              <span>Comisión de servicio</span>
              <span>$0 (sin comisiones)</span>
            </div>
            <div class="price-row total">
              <span>Total a pagar</span>
              <strong class="total-price">${{ formatPrice(bookingCreated?.totalPrice) }}</strong>
            </div>
          </div>
          
          <div class="payment-info">
            <p>💰 Modo de pago: <strong>Simulado</strong></p>
            <small>🔒 Tus datos están seguros. En producción se integrará con Stripe o Wompi.</small>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closePaymentModal" class="btn-cancel">Cancelar</button>
          <button @click="simulatePayment" class="btn-confirm">
            Confirmar pago
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PropertyMap from '../components/PropertyMap.vue';
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePropertyStore } from '../stores/property';
import { useBookingStore } from '../stores/booking';
import { useAuthStore } from '../stores/auth';
import ReviewsSection from '../components/ReviewsSection.vue';
import L from 'leaflet';

const route = useRoute();
const router = useRouter();
const propertyStore = usePropertyStore();
const bookingStore = useBookingStore();
const authStore = useAuthStore();

// Estado
const property = computed(() => propertyStore.currentProperty);
const loading = computed(() => propertyStore.loading);
const reserving = ref(false);
const isFavorite = ref(false);

// Galería
const currentImageIndex = ref(0);

// Fechas
const today = new Date().toISOString().split('T')[0];
const maxDateObj = new Date();
maxDateObj.setFullYear(maxDateObj.getFullYear() + 1);
const maxDate = maxDateObj.toISOString().split('T')[0];

const checkInDate = ref('');
const checkOutDate = ref('');
const guests = ref(1);
const dateError = ref('');
const showPaymentModal = ref(false);
const bookingCreated = ref<any>(null);

const maxGuests = computed(() => {
  if (!property.value) return 1;
  return property.value.capacity.adults + property.value.capacity.children;
});

// Funciones de fechas
const parseLocalDateToUTC = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

const formatDisplayDate = (dateString?: string): string => {
  if (!dateString) return 'Fecha no disponible';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
};

const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  });
};

const nights = computed(() => {
  if (!checkInDate.value || !checkOutDate.value) return 0;
  const start = parseLocalDateToUTC(checkInDate.value);
  const end = parseLocalDateToUTC(checkOutDate.value);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const totalPrice = computed(() => {
  if (!property.value || nights.value === 0) return 0;
  let price = property.value.pricePerNight * nights.value;
  
  if (nights.value >= 7 && property.value.pricePerWeek) {
    price = property.value.pricePerWeek * Math.floor(nights.value / 7) + 
           (property.value.pricePerNight * (nights.value % 7));
  }
  
  if (property.value.discountPercent && property.value.discountPercent > 0) {
    price = price * (1 - property.value.discountPercent / 100);
  }
  
  return Math.round(price);
});

const canReserve = computed(() => {
  return checkInDate.value && 
         checkOutDate.value && 
         nights.value > 0 && 
         authStore.isAuthenticated &&
         authStore.user?._id !== property.value?.hostId._id &&
         !dateError.value;
});

// Métodos de fechas
const updateCheckIn = async () => {
  dateError.value = '';
  checkOutDate.value = '';
  
  if (checkInDate.value && property.value) {
    const checkInUTC = parseLocalDateToUTC(checkInDate.value);
    const nextDay = new Date(checkInUTC);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    
    const available = await bookingStore.checkAvailability(
      property.value._id,
      checkInUTC.toISOString(),
      nextDay.toISOString()
    );
    
    if (!available) {
      dateError.value = 'La fecha seleccionada no está disponible';
      checkInDate.value = '';
    }
  }
};

const updateCheckOut = async () => {
  dateError.value = '';
  
  if (checkInDate.value && checkOutDate.value && property.value) {
    const checkInUTC = parseLocalDateToUTC(checkInDate.value);
    const checkOutUTC = parseLocalDateToUTC(checkOutDate.value);
    
    if (checkOutUTC <= checkInUTC) {
      dateError.value = 'La fecha de salida debe ser posterior a la llegada';
      checkOutDate.value = '';
      return;
    }
    
    const available = await bookingStore.checkAvailability(
      property.value._id,
      checkInUTC.toISOString(),
      checkOutUTC.toISOString()
    );
    
    if (!available) {
      dateError.value = 'Las fechas seleccionadas no están disponibles';
      checkInDate.value = '';
      checkOutDate.value = '';
    }
  }
};

// Reserva
const createReservation = async () => {
  if (!canReserve.value || !property.value) return;
  
  reserving.value = true;
  dateError.value = '';
  
  try {
    const checkInUTC = parseLocalDateToUTC(checkInDate.value);
    const checkOutUTC = parseLocalDateToUTC(checkOutDate.value);
    
    const response = await bookingStore.createBooking({
      propertyId: property.value._id,
      checkIn: checkInUTC.toISOString(),
      checkOut: checkOutUTC.toISOString(),
      guests: guests.value,
      specialRequests: ''
    });
    
    bookingCreated.value = response.booking;
    showPaymentModal.value = true;
  } catch (error: any) {
    console.error('Error creating booking:', error);
    if (error.response?.status === 409) {
      dateError.value = error.response?.data?.error || 'Las fechas ya no están disponibles';
      checkInDate.value = '';
      checkOutDate.value = '';
    } else {
      alert(error.response?.data?.error || 'Error al crear la reserva');
    }
  } finally {
    reserving.value = false;
  }
};

const simulatePayment = async () => {
  if (!bookingCreated.value) return;
  
  reserving.value = true;
  
  try {
    await bookingStore.confirmBooking(
      bookingCreated.value._id, 
      'simulated_payment_' + Date.now()
    );
    
    showPaymentModal.value = false;
    alert('✅ ¡Reserva confirmada exitosamente!');
    router.push('/my-bookings');
  } catch (error: any) {
    console.error('Error al confirmar pago:', error);
    if (error.response?.status === 409) {
      alert('La reserva expiró o las fechas ya no están disponibles. Por favor intenta de nuevo.');
      window.location.reload();
    } else {
      alert('Error al confirmar el pago: ' + (error.response?.data?.error || 'Intenta de nuevo'));
    }
  } finally {
    reserving.value = false;
  }
};

const closePaymentModal = () => {
  showPaymentModal.value = false;
  bookingCreated.value = null;
};

// Utilidades
const getTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    casa: 'Casa',
    cabaña: 'Cabaña',
    finca: 'Finca',
    glamping: 'Glamping',
    hotel_rural: 'Hotel Rural',
    eco_lodge: 'Eco Lodge'
  };
  return types[type] || type;
};

const shareProperty = () => {
  if (navigator.share) {
    navigator.share({
      title: property.value?.title,
      text: `Mira este alojamiento en EcoTurismo: ${property.value?.title}`,
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Enlace copiado al portapapeles');
  }
};

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value;
  // Aquí se implementaría la lógica de favoritos
};

const contactHost = () => {
  // Aquí se implementaría el chat o email
  alert('Funcionalidad de contacto próximamente disponible');
};

// Configuración de imágenes
const API_BASE_URL = 'http://localhost:5000';

const getMainImage = (prop: any) => {
  if (!prop) return `${API_BASE_URL}/uploads/properties/default.jpg`;
  if (!prop.images || prop.images.length === 0) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"%3E%3Crect width="800" height="500" fill="%23e0e0e0"/%3E%3Ctext x="400" y="250" font-family="Arial" font-size="20" fill="%23999" text-anchor="middle"%3E🏠 Sin imagen%3C/text%3E%3C/svg%3E';
  }
  const mainImage = prop.images.find((img: any) => img.isMain);
  let imageUrl = mainImage?.url || prop.images[0]?.url;
  if (!imageUrl) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"%3E%3Crect width="800" height="500" fill="%23e0e0e0"/%3E%3Ctext x="400" y="250" font-family="Arial" font-size="20" fill="%23999" text-anchor="middle"%3E🏠 Sin imagen%3C/text%3E%3C/svg%3E';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_BASE_URL}${imageUrl}`;
};

const getImageUrl = (image: any) => {
  if (!image || !image.url) return '';
  if (image.url.startsWith('http')) return image.url;
  return `${API_BASE_URL}${image.url}`;
};

const formatPrice = (price: number) => {
  return price?.toLocaleString('es-CO') || 0;
};

const formatDate = (date?: string) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
};

const getAmenityName = (amenity: string) => {
  const names: Record<string, string> = {
    wifi: 'WiFi', parking: 'Parqueadero', piscina: 'Piscina', cocina: 'Cocina',
    aire_acondicionado: 'Aire acondicionado', calefaccion: 'Calefacción', tv: 'TV',
    jacuzzi: 'Jacuzzi', barbacoa: 'Barbacoa', mascotas_permitidas: 'Mascotas permitidas',
    vista_montana: 'Vista a la montaña', vista_rio: 'Vista al río', chimenea: 'Chimenea',
    hamaca: 'Hamaca', senderismo: 'Senderismo', bicicletas: 'Bicicletas', kayak: 'Kayak',
    desayuno_incluido: 'Desayuno incluido', restaurante: 'Restaurante'
  };
  return names[amenity] || amenity;
};

const getAmenityIcon = (amenity: string) => {
  const icons: Record<string, string> = {
    wifi: '📶', parking: '🅿️', piscina: '🏊', cocina: '🍳', aire_acondicionado: '❄️',
    calefaccion: '🔥', tv: '📺', jacuzzi: '🛁', barbacoa: '🔥', mascotas_permitidas: '🐕',
    vista_montana: '🏔️', vista_rio: '🏞️', chimenea: '🪵', hamaca: '🌴', senderismo: '🥾',
    bicicletas: '🚲', kayak: '🛶', desayuno_incluido: '🍳', restaurante: '🍽️'
  };
  return icons[amenity] || '✨';
};

const getRuleName = (rule: string) => {
  const rules: Record<string, string> = {
    no_fumar: 'No fumar', no_mascotas: 'No mascotas', no_fiestas: 'No fiestas',
    checkout_limpieza: 'Limpieza al check-out', horario_silencio: 'Horario de silencio',
    cuidar_agua: 'Cuidar el agua', reciclar: 'Reciclar'
  };
  return rules[rule] || rule;
};

const getRuleIcon = (rule: string) => {
  const icons: Record<string, string> = {
    no_fumar: '🚭', no_mascotas: '🐕', no_fiestas: '🎉',
    checkout_limpieza: '🧹', horario_silencio: '🔇',
    cuidar_agua: '💧', reciclar: '♻️'
  };
  return icons[rule] || '📋';
};

// Galería
const prevImage = () => {
  if (property.value && currentImageIndex.value > 0) {
    currentImageIndex.value--;
  }
};

const nextImage = () => {
  if (property.value && currentImageIndex.value < property.value.images.length - 1) {
    currentImageIndex.value++;
  }
};

// Mapa
let map: L.Map | null = null;
let isMapInitialized = false;

const initMap = () => {
  if (!property.value) return;
  if (isMapInitialized && map) return;
  if (map) {
    map.remove();
    map = null;
  }
  
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;
  
  map = L.map('map').setView(
    [property.value.location.coordinates[1], property.value.location.coordinates[0]], 
    13
  );
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
  }).addTo(map);
  
  L.marker([property.value.location.coordinates[1], property.value.location.coordinates[0]])
    .bindPopup(`<strong>${property.value.title}</strong><br>📍 ${property.value.location.address}`)
    .addTo(map);
  
  isMapInitialized = true;
};

onMounted(async () => {
  const id = route.params.id as string;
  await propertyStore.fetchPropertyById(id);
  if (property.value) {
    await nextTick();
    setTimeout(initMap, 100);
  }
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
    isMapInitialized = false;
  }
});

watch(property, async () => {
  if (property.value) {
    await nextTick();
    setTimeout(initMap, 100);
  }
});
</script>

<style scoped>
/* Variables y estilos base */
.property-detail {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.breadcrumb a {
  color: #2e7d32;
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.breadcrumb .current {
  color: var(--text-primary);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--border-color);
  border-top-color: #2e7d32;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Gallery */
.gallery-section {
  margin-bottom: 2rem;
}

.gallery {
  position: relative;
}

.main-image {
  position: relative;
  height: 500px;
  border-radius: 20px;
  overflow: hidden;
  background: var(--bg-secondary);
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  font-size: 2rem;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
  z-index: 2;
}

.nav:hover {
  background: rgba(0,0,0,0.8);
}

.prev { left: 1rem; border-radius: 50px; }
.next { right: 1rem; border-radius: 50px; }

.image-counter {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  z-index: 2;
}

.thumbnail-list {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.thumbnail {
  width: 80px;
  height: 60px;
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.thumbnail.active {
  opacity: 1;
  border: 2px solid #2e7d32;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Detail Container */
.detail-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #ddd;
  font-size: 1rem;
}

.star.filled {
  color: #ffc107;
}

.rating-value {
  font-weight: 600;
  color: #ffc107;
}

.reviews-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.type-badge {
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary);
  border-radius: 20px;
  font-size: 0.8rem;
}

.share-buttons {
  display: flex;
  gap: 0.5rem;
}

.share-btn, .favorite-btn {
  background: var(--bg-secondary);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.share-btn:hover, .favorite-btn:hover {
  background: #e8f5e9;
  transform: scale(1.05);
}

.favorite-btn.active {
  background: #ffebee;
}

/* Host Card */
.host-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.host-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.host-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.contact-host-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #2e7d32;
  color: #2e7d32;
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.2s;
}

.contact-host-btn:hover {
  background: #2e7d32;
  color: white;
}

/* Description Card */
.description-card {
  margin-bottom: 1.5rem;
}

.description-card h3 {
  margin-bottom: 0.75rem;
}

.description-text {
  line-height: 1.6;
  color: var(--text-secondary);
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
}

.feature-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.feature-icon {
  font-size: 1.5rem;
}

.feature-item strong {
  display: block;
  font-size: 0.9rem;
}

.feature-item small {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

/* Amenities Card */
.amenities-card {
  margin-bottom: 1.5rem;
}

.amenities-card h3 {
  margin-bottom: 0.75rem;
}

.amenities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}

.amenity-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  font-size: 0.85rem;
}

/* Rules Card */
.rules-card {
  margin-bottom: 1.5rem;
}

.rules-card h3 {
  margin-bottom: 0.75rem;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  font-size: 0.85rem;
}

/* Location Card */
.location-card {
  margin-bottom: 1.5rem;
}

.location-card h3 {
  margin-bottom: 0.75rem;
}

.location-info {
  margin-bottom: 1rem;
}

.address, .city {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.map {
  height: 300px;
  border-radius: 16px;
  overflow: hidden;
}

/* Booking Sidebar */
.booking-sidebar {
  position: relative;
}

.booking-card {
  position: sticky;
  top: 2rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.price-section {
  text-align: center;
  margin-bottom: 1.5rem;
}

.price-amount {
  font-size: 2rem;
  font-weight: bold;
  color: #2e7d32;
}

.price-period {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.discount-badge {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: #ff9800;
  color: white;
  border-radius: 20px;
  font-size: 0.75rem;
}

/* Date Section */
.date-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.date-input-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.date-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 0.9rem;
  background: var(--bg-primary);
}

.date-summary-card {
  background: #e8f5e9;
  border-radius: 12px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.error-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

/* Guests Section */
.guests-section {
  margin-bottom: 1rem;
}

.guests-section label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.guests-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-primary);
  cursor: pointer;
}

/* Price Breakdown */
.price-breakdown {
  margin: 1rem 0;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.breakdown-item.discount {
  color: #2e7d32;
}

.breakdown-item.total {
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
  font-size: 1rem;
  margin-top: 0.5rem;
}

.total-amount {
  font-size: 1.2rem;
  color: #2e7d32;
}

/* Reserve Button */
.btn-reserve {
  width: 100%;
  background: #2e7d32;
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 40px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-reserve:hover:not(:disabled) {
  background: #1b5e20;
  transform: translateY(-2px);
}

.btn-reserve:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-loader {
  width: 18px;
  height: 18px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Warning Messages */
.warning-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
}

.login-warning {
  background: #e3f2fd;
  color: #1565c0;
}

.login-warning a {
  color: #1565c0;
  font-weight: bold;
}

.host-warning {
  background: #fff3cd;
  color: #856404;
}

.info-note {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.note-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 24px;
  max-width: 550px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalFadeIn 0.3s ease;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.modal-header h2 {
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.booking-summary-modal {
  padding: 1rem 1.5rem;
}

.property-summary {
  display: flex;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;
}

.summary-image {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
}

.summary-location {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.dates-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.date-box {
  text-align: center;
}

.date-box span {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.date-box strong {
  font-size: 0.9rem;
}

.date-arrow {
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.price-summary {
  margin-bottom: 1rem;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.price-row.total {
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
  font-size: 1.1rem;
}

.total-price {
  color: #2e7d32;
  font-size: 1.2rem;
}

.payment-info {
  background: #e8f5e9;
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
}

.payment-info p {
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.payment-info small {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem 1.5rem;
}

.btn-confirm, .btn-cancel {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-confirm {
  background: #2e7d32;
  color: white;
}

.btn-confirm:hover {
  background: #1b5e20;
  transform: translateY(-1px);
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: var(--border-color);
}

/* Responsive */
@media (max-width: 968px) {
  .detail-container {
    grid-template-columns: 1fr;
  }
  
  .main-image {
    height: 400px;
  }
  
  .booking-sidebar {
    order: 2;
  }
  
  .main-info {
    order: 1;
  }
}

@media (max-width: 768px) {
  .property-detail {
    padding: 0 1rem;
  }
  
  .main-image {
    height: 300px;
  }
  
  .header {
    flex-direction: column;
  }
  
  .features-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .date-section {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .dates-summary {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .date-arrow {
    transform: rotate(90deg);
  }
  
  .host-card {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
}
</style>