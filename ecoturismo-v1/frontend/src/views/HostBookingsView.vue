<template>
  <div class="host-bookings">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>📊 Reservas de mis propiedades</h1>
        <p class="subtitle">Gestiona las reservas y el estado de tus alojamientos</p>
      </div>
      <div class="header-stats">
        <div class="stat-badge confirmed">
          <span class="stat-number">{{ confirmedCount }}</span>
          <span class="stat-label">Confirmadas</span>
        </div>
        <div class="stat-badge pending">
          <span class="stat-number">{{ pendingCount }}</span>
          <span class="stat-label">Pendientes</span>
        </div>
        <div class="stat-badge completed">
          <span class="stat-number">{{ completedCount }}</span>
          <span class="stat-label">Completadas</span>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar por huésped o propiedad..."
          @input="filterBookings"
        >
      </div>
      
      <div class="filter-group">
        <select v-model="statusFilter" class="filter-select" @change="filterBookings">
          <option value="all">Todos los estados</option>
          <option value="pending">⏳ Pendientes</option>
          <option value="confirmed">✅ Confirmadas</option>
          <option value="completed">✨ Completadas</option>
          <option value="cancelled">❌ Canceladas</option>
        </select>
        
        <select v-model="propertyFilter" class="filter-select" @change="filterBookings">
          <option value="all">Todas las propiedades</option>
          <option v-for="prop in uniqueProperties" :key="prop.id" :value="prop.id">
            {{ prop.title }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando reservas...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredBookings.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>No hay reservas</h3>
      <p>Aún no has recibido reservas en tus propiedades</p>
      <router-link to="/properties/create" class="btn-primary">Publicar nueva propiedad</router-link>
    </div>

    <!-- Bookings List -->
    <div v-else class="bookings-list">
      <div 
        v-for="booking in paginatedBookings" 
        :key="booking._id" 
        class="booking-card"
        :class="booking.status"
      >
        <div class="booking-header">
          <div class="property-info">
            <img :src="getMainImage(booking.propertyId)" :alt="booking.propertyId.title" class="property-image">
            <div>
              <h3>{{ booking.propertyId.title }}</h3>
              <p class="property-location">📍 {{ booking.propertyId.location?.city }}, {{ booking.propertyId.location?.department }}</p>
            </div>
          </div>
          <div class="booking-status-badge" :class="getStatusClass(booking.status)">
            <span class="status-icon">{{ getStatusIcon(booking.status) }}</span>
            <span>{{ getStatusText(booking.status) }}</span>
          </div>
        </div>

        <div class="booking-details">
          <div class="guest-info">
            <div class="guest-avatar">
              {{ booking.turistaId.name?.charAt(0) || '👤' }}
            </div>
            <div>
              <p class="guest-name"><strong>{{ booking.turistaId.name }}</strong></p>
              <p class="guest-contact">📧 {{ booking.turistaId.email }}</p>
              <p class="guest-contact" v-if="booking.turistaId.phone">📱 {{ booking.turistaId.phone }}</p>
            </div>
          </div>

          <div class="booking-dates">
            <div class="date-item">
              <span class="date-label">Check-in</span>
              <span class="date-value">{{ formatDate(booking.checkIn) }}</span>
              <span class="date-time">⏰ {{ booking.propertyId.checkInTime || '15:00' }}</span>
            </div>
            <div class="date-arrow">→</div>
            <div class="date-item">
              <span class="date-label">Check-out</span>
              <span class="date-value">{{ formatDate(booking.checkOut) }}</span>
              <span class="date-time">⏰ {{ booking.propertyId.checkOutTime || '11:00' }}</span>
            </div>
          </div>

          <div class="booking-meta">
            <div class="meta-item">
              <span class="meta-icon">👥</span>
              <span>{{ booking.guests }} {{ booking.guests === 1 ? 'huésped' : 'huéspedes' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">💰</span>
              <span class="price-amount">${{ formatPrice(booking.totalPrice) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">📅</span>
              <span>Reservado el {{ formatShortDate(booking.createdAt) }}</span>
            </div>
          </div>

          <div v-if="booking.specialRequests" class="special-requests">
            <span class="request-icon">💬</span>
            <span>{{ booking.specialRequests }}</span>
          </div>
        </div>

        <div class="booking-actions">
          <button 
            v-if="booking.status === 'confirmed' && canComplete(booking)"
            @click="completeBooking(booking._id)"
            class="btn-complete"
          >
            ✨ Marcar como completada
          </button>
          <button 
            v-if="booking.status === 'pending'"
            @click="contactGuest(booking)"
            class="btn-contact"
          >
            💬 Contactar huésped
          </button>
          <button 
            v-if="booking.status === 'confirmed'"
            @click="viewDetails(booking)"
            class="btn-details"
          >
            📋 Ver detalles
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredBookings.length > itemsPerPage" class="pagination">
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          ← Anterior
        </button>
        <span class="page-info">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Siguiente →
        </button>
      </div>
    </div>

    <!-- Modal de detalles -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <button class="modal-close" @click="closeModal">✕</button>
        <h2>Detalles de la reserva</h2>
        <div class="modal-body" v-if="selectedBooking">
          <div class="detail-row">
            <strong>Propiedad:</strong> {{ selectedBooking.propertyId.title }}
          </div>
          <div class="detail-row">
            <strong>Huésped:</strong> {{ selectedBooking.turistaId.name }}
          </div>
          <div class="detail-row">
            <strong>Email:</strong> {{ selectedBooking.turistaId.email }}
          </div>
          <div class="detail-row">
            <strong>Teléfono:</strong> {{ selectedBooking.turistaId.phone || 'No especificado' }}
          </div>
          <div class="detail-row">
            <strong>Check-in:</strong> {{ formatDateTime(selectedBooking.checkIn) }}
          </div>
          <div class="detail-row">
            <strong>Check-out:</strong> {{ formatDateTime(selectedBooking.checkOut) }}
          </div>
          <div class="detail-row">
            <strong>Huéspedes:</strong> {{ selectedBooking.guests }}
          </div>
          <div class="detail-row">
            <strong>Total pagado:</strong> ${{ formatPrice(selectedBooking.totalPrice) }}
          </div>
          <div class="detail-row" v-if="selectedBooking.specialRequests">
            <strong>Solicitudes especiales:</strong> {{ selectedBooking.specialRequests }}
          </div>
          <div class="detail-row">
            <strong>Reservado el:</strong> {{ formatDateTime(selectedBooking.createdAt) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useBookingStore } from '../stores/booking';

const bookingStore = useBookingStore();

// Estado
const searchQuery = ref('');
const statusFilter = ref('all');
const propertyFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showDetailsModal = ref(false);
const selectedBooking = ref<any>(null);

// Computed
const hostBookings = computed(() => bookingStore.hostBookings);
const loading = computed(() => bookingStore.loading);

const uniqueProperties = computed(() => {
  const props = new Map();
  hostBookings.value.forEach(booking => {
    if (booking.propertyId && !props.has(booking.propertyId._id)) {
      props.set(booking.propertyId._id, {
        id: booking.propertyId._id,
        title: booking.propertyId.title
      });
    }
  });
  return Array.from(props.values());
});

const confirmedCount = computed(() => {
  return hostBookings.value.filter(b => b.status === 'confirmed').length;
});

const pendingCount = computed(() => {
  return hostBookings.value.filter(b => b.status === 'pending').length;
});

const completedCount = computed(() => {
  return hostBookings.value.filter(b => b.status === 'completed').length;
});

const filteredBookings = computed(() => {
  let filtered = [...hostBookings.value];
  
  // Filtro por estado
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(b => b.status === statusFilter.value);
  }
  
  // Filtro por propiedad
  if (propertyFilter.value !== 'all') {
    filtered = filtered.filter(b => b.propertyId?._id === propertyFilter.value);
  }
  
  // Filtro por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(b => 
      b.propertyId?.title?.toLowerCase().includes(query) ||
      b.turistaId?.name?.toLowerCase().includes(query) ||
      b.turistaId?.email?.toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

const paginatedBookings = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredBookings.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredBookings.value.length / itemsPerPage.value);
});

// Configuración de URL base para imágenes
const API_BASE_URL = 'http://localhost:5000';

const getMainImage = (prop: any) => {
  if (!prop) {
    return `${API_BASE_URL}/uploads/properties/default.jpg`;
  }
  
  if (!prop.images || prop.images.length === 0) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"%3E%3Crect width="800" height="500" fill="%23e0e0e0"/%3E%3Ctext x="400" y="250" font-family="Arial" font-size="20" fill="%23999" text-anchor="middle"%3E🏠 Sin imagen%3C/text%3E%3C/svg%3E';
  }
  
  const mainImage = prop.images.find((img: any) => img.isMain);
  let imageUrl = '';
  
  if (mainImage && mainImage.url) {
    imageUrl = mainImage.url;
  } else if (prop.images[0] && prop.images[0].url) {
    imageUrl = prop.images[0].url;
  }
  
  if (!imageUrl) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"%3E%3Crect width="800" height="500" fill="%23e0e0e0"/%3E%3Ctext x="400" y="250" font-family="Arial" font-size="20" fill="%23999" text-anchor="middle"%3E🏠 Sin imagen%3C/text%3E%3C/svg%3E';
  }
  
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  return `${API_BASE_URL}${imageUrl}`;
};

const formatPrice = (price: number) => {
  return price?.toLocaleString('es-CO') || 0;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatShortDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES');
};

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('es-ES');
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'Pendiente de pago',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada'
  };
  return statusMap[status] || status;
};

const getStatusIcon = (status: string) => {
  const iconMap: Record<string, string> = {
    pending: '⏳',
    confirmed: '✅',
    cancelled: '❌',
    completed: '✨'
  };
  return iconMap[status] || '📋';
};

const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    cancelled: 'status-cancelled',
    completed: 'status-completed'
  };
  return classMap[status] || '';
};

const canComplete = (booking: any) => {
  const checkOut = new Date(booking.checkOut);
  const today = new Date();
  return checkOut < today;
};

const filterBookings = () => {
  currentPage.value = 1;
};

const completeBooking = async (id: string) => {
  if (confirm('¿Estás seguro de marcar esta reserva como completada? Esta acción no se puede deshacer.')) {
    await bookingStore.completeBooking(id);
    await bookingStore.fetchHostBookings();
  }
};

const contactGuest = (booking: any) => {
  window.location.href = `mailto:${booking.turistaId.email}`;
};

const viewDetails = (booking: any) => {
  selectedBooking.value = booking;
  showDetailsModal.value = true;
};

const closeModal = () => {
  showDetailsModal.value = false;
  selectedBooking.value = null;
};

onMounted(() => {
  bookingStore.fetchHostBookings();
});
</script>

<style scoped>
.host-bookings {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.subtitle {
  color: var(--text-secondary);
}

.header-stats {
  display: flex;
  gap: 1rem;
}

.stat-badge {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  text-align: center;
  min-width: 80px;
}

.stat-badge.confirmed {
  background: #d4edda;
}

.stat-badge.pending {
  background: #fff3cd;
}

.stat-badge.completed {
  background: #d1ecf1;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.7rem;
  color: #666;
}

/* Filters */
.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  background: var(--bg-primary);
  padding: 1rem;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border-radius: 40px;
  padding: 0.5rem 1rem;
  max-width: 300px;
}

.search-icon {
  margin-right: 0.5rem;
  color: var(--text-secondary);
}

.search-box input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 0.9rem;
}

.filter-group {
  display: flex;
  gap: 0.5rem;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 40px;
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 0.85rem;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: #2e7d32;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem;
  background: var(--bg-primary);
  border-radius: 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #2e7d32;
  color: white;
  text-decoration: none;
  border-radius: 40px;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1b5e20;
}

/* Bookings List */
.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.booking-card {
  background: var(--bg-primary);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.booking-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.property-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.property-image {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  object-fit: cover;
}

.property-info h3 {
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.property-location {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.booking-status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 40px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-confirmed {
  background: #d4edda;
  color: #155724;
}

.status-cancelled {
  background: #f8d7da;
  color: #721c24;
}

.status-completed {
  background: #d1ecf1;
  color: #0c5460;
}

/* Booking Details */
.booking-details {
  padding: 1.5rem;
}

.guest-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.guest-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #2e7d32, #4caf50);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
}

.guest-name {
  margin-bottom: 0.25rem;
}

.guest-contact {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Booking Dates */
.booking-dates {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 16px;
}

.date-item {
  flex: 1;
  text-align: center;
}

.date-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.date-value {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.date-time {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.date-arrow {
  font-size: 1.2rem;
  color: var(--text-secondary);
}

/* Booking Meta */
.booking-meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.meta-icon {
  font-size: 1rem;
}

.price-amount {
  font-weight: 700;
  color: #2e7d32;
}

/* Special Requests */
.special-requests {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.request-icon {
  font-size: 1rem;
}

/* Booking Actions */
.booking-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.btn-complete, .btn-contact, .btn-details {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-complete {
  background: #2e7d32;
  color: white;
}

.btn-complete:hover {
  background: #1b5e20;
  transform: translateY(-1px);
}

.btn-contact {
  background: #2196f3;
  color: white;
}

.btn-contact:hover {
  background: #1976d2;
}

.btn-details {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.btn-details:hover {
  border-color: #2e7d32;
  color: #2e7d32;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #2e7d32;
  color: #2e7d32;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 24px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  margin-top: 1rem;
}

.detail-row {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.detail-row:last-child {
  border-bottom: none;
}

/* Responsive */
@media (max-width: 768px) {
  .host-bookings {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
  }
  
  .filters-bar {
    flex-direction: column;
  }
  
  .search-box {
    max-width: none;
  }
  
  .filter-group {
    width: 100%;
    flex-direction: column;
  }
  
  .booking-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .booking-dates {
    flex-direction: column;
  }
  
  .date-arrow {
    transform: rotate(90deg);
  }
  
  .booking-actions {
    flex-direction: column;
  }
  
  .booking-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>