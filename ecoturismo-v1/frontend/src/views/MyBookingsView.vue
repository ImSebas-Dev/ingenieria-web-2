<template>
  <div class="my-bookings">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>📋 Mis Reservas</h1>
        <p class="subtitle">Gestiona tus reservas y deja reseñas de tus experiencias</p>
      </div>
      <div class="header-stats">
        <div class="stat-chip active">
          <span class="stat-number">{{ activeBookings }}</span>
          <span class="stat-label">Activas</span>
        </div>
        <div class="stat-chip completed">
          <span class="stat-number">{{ completedBookings }}</span>
          <span class="stat-label">Completadas</span>
        </div>
        <div class="stat-chip cancelled">
          <span class="stat-number">{{ cancelledBookings }}</span>
          <span class="stat-label">Canceladas</span>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <div class="filter-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.value"
          @click="activeTab = tab.value"
          class="tab-btn"
          :class="{ active: activeTab === tab.value }"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
          <span class="tab-count" v-if="tab.count > 0">{{ tab.count }}</span>
        </button>
      </div>
      
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar por propiedad..."
          @input="filterBookings"
        >
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando tus reservas...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredBookings.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>No tienes reservas</h3>
      <p>Explora nuestros alojamientos y comienza tu próxima aventura</p>
      <router-link to="/properties" class="btn-primary">Explorar alojamientos</router-link>
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
            <div class="meta-item" v-if="booking.paymentStatus === 'paid'">
              <span class="meta-icon">💳</span>
              <span>Pago confirmado</span>
            </div>
          </div>

          <div class="countdown-timer" v-if="booking.status === 'confirmed' && canShowCountdown(booking)">
            <span class="timer-icon">⏰</span>
            <span>Tu estadía comienza en</span>
            <span class="timer-value">{{ getCountdown(booking.checkIn) }}</span>
          </div>
        </div>

        <div class="booking-actions">
          <button 
            v-if="booking.status === 'completed' && !hasReview(booking._id)"
            @click="openReviewModal(booking)"
            class="btn-review"
          >
            <span>⭐</span> Dejar reseña
          </button>
          
          <button 
            v-if="booking.status === 'confirmed' && canCancel(booking)"
            @click="cancelBooking(booking._id)"
            class="btn-cancel"
          >
            <span>❌</span> Cancelar reserva
          </button>
          
          <button 
            v-if="booking.status === 'confirmed'"
            @click="viewDetails(booking)"
            class="btn-details"
          >
            <span>📋</span> Ver detalles
          </button>
          
          <router-link 
            :to="`/properties/${booking.propertyId._id}`"
            class="btn-view"
          >
            <span>🏠</span> Ver propiedad
          </router-link>
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
        <div class="page-numbers">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            @click="currentPage = page"
            class="page-number"
            :class="{ active: page === currentPage }"
          >
            {{ page }}
          </button>
        </div>
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Siguiente →
        </button>
      </div>
    </div>

    <!-- Modal para crear reseña -->
    <CreateReviewModal
      :show="showReviewModal"
      :property-id="selectedPropertyId"
      :booking-id="selectedBookingId"
      @close="closeReviewModal"
      @success="onReviewSuccess"
    />

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
            <strong>Ubicación:</strong> {{ selectedBooking.propertyId.location?.city }}, {{ selectedBooking.propertyId.location?.department }}
          </div>
          <div class="detail-row">
            <strong>Dirección:</strong> {{ selectedBooking.propertyId.location?.address }}
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
            <strong>Estado de pago:</strong> 
            <span :class="selectedBooking.paymentStatus === 'paid' ? 'paid' : 'pending'">
              {{ selectedBooking.paymentStatus === 'paid' ? '✅ Pagado' : '⏳ Pendiente' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useBookingStore } from '../stores/booking';
import { useReviewStore } from '../stores/review';
import CreateReviewModal from '../components/CreateReviewModal.vue';

const bookingStore = useBookingStore();
const reviewStore = useReviewStore();

// Estado
const activeTab = ref('all');
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(5);
const showDetailsModal = ref(false);
const selectedBooking = ref<any>(null);

// Estado para el modal de reseña
const showReviewModal = ref(false);
const selectedPropertyId = ref('');
const selectedBookingId = ref('');
const existingReviews = ref<Set<string>>(new Set());

// Computed
const myBookings = computed(() => bookingStore.myBookings);
const loading = computed(() => bookingStore.loading);

const activeBookings = computed(() => {
  return myBookings.value.filter(b => b.status === 'confirmed').length;
});

const completedBookings = computed(() => {
  return myBookings.value.filter(b => b.status === 'completed').length;
});

const cancelledBookings = computed(() => {
  return myBookings.value.filter(b => b.status === 'cancelled').length;
});

const tabs = computed(() => [
  { value: 'all', label: 'Todas', icon: '📋', count: myBookings.value.length },
  { value: 'confirmed', label: 'Activas', icon: '✅', count: activeBookings.value },
  { value: 'completed', label: 'Completadas', icon: '✨', count: completedBookings.value },
  { value: 'cancelled', label: 'Canceladas', icon: '❌', count: cancelledBookings.value }
]);

const filteredBookings = computed(() => {
  let filtered = [...myBookings.value];
  
  // Filtrar por estado
  if (activeTab.value !== 'all') {
    filtered = filtered.filter(b => b.status === activeTab.value);
  }
  
  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(b => 
      b.propertyId?.title?.toLowerCase().includes(query)
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

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 2;
  const range = [];
  
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }
  
  if (current - delta > 2) range.unshift('...');
  if (current + delta < total - 1) range.push('...');
  range.unshift(1);
  if (total !== 1) range.push(total);
  
  return range;
});

// Configuración de URL base para imágenes
const API_BASE_URL = 'http://localhost:5000';

const getMainImage = (prop: any) => {
  if (!prop) {
    return `${API_BASE_URL}/uploads/properties/default.jpg`;
  }
  
  if (!prop.images || prop.images.length === 0) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e0e0e0"/%3E%3Ctext x="200" y="160" font-family="Arial" font-size="16" fill="%23999" text-anchor="middle"%3E🏠 Sin imagen%3C/text%3E%3C/svg%3E';
  }
  
  const mainImage = prop.images.find((img: any) => img.isMain);
  let imageUrl = '';
  
  if (mainImage && mainImage.url) {
    imageUrl = mainImage.url;
  } else if (prop.images[0] && prop.images[0].url) {
    imageUrl = prop.images[0].url;
  }
  
  if (!imageUrl) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e0e0e0"/%3E%3Ctext x="200" y="160" font-family="Arial" font-size="16" fill="%23999" text-anchor="middle"%3E🏠 Sin imagen%3C/text%3E%3C/svg%3E';
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
  return new Date(date).toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric'
  });
};

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('es-ES');
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'Pendiente de pago',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada',
    refunded: 'Reembolsada'
  };
  return statusMap[status] || status;
};

const getStatusIcon = (status: string) => {
  const iconMap: Record<string, string> = {
    pending: '⏳',
    confirmed: '✅',
    cancelled: '❌',
    completed: '✨',
    refunded: '💰'
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

const canCancel = (booking: any) => {
  const checkIn = new Date(booking.checkIn);
  const now = new Date();
  const hoursBefore = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursBefore > 24;
};

const canShowCountdown = (booking: any) => {
  const checkIn = new Date(booking.checkIn);
  const now = new Date();
  const diffDays = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7 && diffDays > 0;
};

const getCountdown = (checkInDate: string) => {
  const checkIn = new Date(checkInDate);
  const now = new Date();
  const diffDays = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'mañana';
  if (diffDays === 0) return 'hoy';
  return `${diffDays} días`;
};

const cancelBooking = async (id: string) => {
  if (confirm('¿Estás seguro de cancelar esta reserva? Recibirás un reembolso según la política de cancelación.')) {
    await bookingStore.cancelBooking(id, 'Cancelado por el usuario');
    await bookingStore.fetchMyBookings();
  }
};

const filterBookings = () => {
  currentPage.value = 1;
};

const viewDetails = (booking: any) => {
  selectedBooking.value = booking;
  showDetailsModal.value = true;
};

const closeModal = () => {
  showDetailsModal.value = false;
  selectedBooking.value = null;
};

// Funciones para reseñas
const hasReview = (bookingId: string) => {
  return existingReviews.value.has(bookingId);
};

const loadExistingReviews = async () => {
  await reviewStore.fetchMyReviews();
  existingReviews.value.clear();
  reviewStore.reviews.forEach(review => {
    existingReviews.value.add(review.bookingId);
  });
};

const openReviewModal = (booking: any) => {
  selectedPropertyId.value = booking.propertyId._id;
  selectedBookingId.value = booking._id;
  showReviewModal.value = true;
};

const closeReviewModal = () => {
  showReviewModal.value = false;
  selectedPropertyId.value = '';
  selectedBookingId.value = '';
};

const onReviewSuccess = async () => {
  await loadExistingReviews();
  await bookingStore.fetchMyBookings();
  alert('¡Gracias por tu reseña! Ayudas a otros viajeros a tomar mejores decisiones.');
};

onMounted(async () => {
  await bookingStore.fetchMyBookings();
  await loadExistingReviews();
});
</script>

<style scoped>
.my-bookings {
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

.stat-chip {
  padding: 0.5rem 1rem;
  border-radius: 40px;
  text-align: center;
  background: var(--bg-secondary);
}

.stat-chip.active .stat-number { color: #2e7d32; }
.stat-chip.completed .stat-number { color: #2196f3; }
.stat-chip.cancelled .stat-number { color: #e74c3c; }

.stat-number {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

/* Filters */
.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border: none;
  background: var(--bg-secondary);
  border-radius: 40px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #2e7d32;
  color: white;
}

.tab-count {
  background: rgba(0,0,0,0.1);
  border-radius: 20px;
  padding: 0 6px;
  font-size: 0.7rem;
}

.tab-btn.active .tab-count {
  background: rgba(255,255,255,0.2);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-radius: 40px;
}

.search-icon {
  font-size: 0.9rem;
}

.search-box input {
  border: none;
  background: none;
  outline: none;
  width: 200px;
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

.status-pending { background: #fff3cd; color: #856404; }
.status-confirmed { background: #d4edda; color: #155724; }
.status-cancelled { background: #f8d7da; color: #721c24; }
.status-completed { background: #d1ecf1; color: #0c5460; }

/* Booking Details */
.booking-details {
  padding: 1rem 1.5rem;
}

.booking-dates {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
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
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.date-time {
  font-size: 0.65rem;
  color: var(--text-secondary);
}

.date-arrow {
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.booking-meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
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

.countdown-timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #e8f5e9;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #2e7d32;
}

.timer-value {
  font-weight: 700;
  margin-left: auto;
}

/* Booking Actions */
.booking-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.btn-review, .btn-cancel, .btn-details, .btn-view {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-review {
  background: #ff9800;
  color: white;
}

.btn-review:hover {
  background: #f57c00;
  transform: translateY(-1px);
}

.btn-cancel {
  background: #e74c3c;
  color: white;
}

.btn-cancel:hover {
  background: #c0392b;
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

.btn-view {
  background: #3498db;
  color: white;
}

.btn-view:hover {
  background: #2980b9;
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

.page-numbers {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.page-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.page-number.active {
  background: #2e7d32;
  color: white;
}

.page-number:hover:not(.active) {
  background: var(--bg-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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

.paid {
  color: #2e7d32;
}

/* Responsive */
@media (max-width: 768px) {
  .my-bookings {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
  }
  
  .filters-bar {
    flex-direction: column;
  }
  
  .filter-tabs {
    width: 100%;
    justify-content: center;
  }
  
  .search-box {
    width: 100%;
  }
  
  .search-box input {
    width: 100%;
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
  
  .pagination {
    flex-wrap: wrap;
  }
  
  .page-numbers {
    order: 3;
    width: 100%;
    justify-content: center;
  }
}
</style>