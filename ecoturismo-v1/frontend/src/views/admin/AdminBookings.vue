<template>
  <div class="admin-bookings">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>📅 Gestión de Reservas</h1>
        <p class="subtitle">Visualiza y administra todas las reservas de la plataforma</p>
      </div>
      <button class="btn-export" @click="exportBookings">
        📊 Exportar reservas
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="filters.search" 
          type="text" 
          placeholder="Buscar por propiedad o huésped..."
          @input="applyFilters"
        >
      </div>
      
      <select v-model="filters.status" class="filter-select" @change="applyFilters">
        <option value="">Todos los estados</option>
        <option value="pending">⏳ Pendientes</option>
        <option value="confirmed">✅ Confirmadas</option>
        <option value="completed">✨ Completadas</option>
        <option value="cancelled">❌ Canceladas</option>
      </select>
      
      <select v-model="filters.sort" class="filter-select" @change="applyFilters">
        <option value="-createdAt">Más recientes</option>
        <option value="createdAt">Más antiguas</option>
        <option value="-checkIn">Próximas check-in</option>
        <option value="checkIn">Check-in pasado</option>
      </select>
    </div>

    <!-- Bookings Table -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Propiedad</th>
            <th>Huésped</th>
            <th>Fechas</th>
            <th>Huéspedes</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="booking in bookings" :key="booking._id">
            <td class="property-cell">
              <strong>{{ booking.propertyId?.title }}</strong>
              <span class="property-host">Anfitrión: {{ booking.propertyId?.hostId?.name }}</span>
            </td>
            <td class="guest-cell">
              <strong>{{ booking.turistaId?.name }}</strong>
              <span class="guest-email">{{ booking.turistaId?.email }}</span>
            </td>
            <td class="dates-cell">
              <div class="date-range">
                <span>📅 {{ formatDate(booking.checkIn) }}</span>
                <span>→</span>
                <span>📅 {{ formatDate(booking.checkOut) }}</span>
              </div>
              <span class="nights">{{ getNights(booking.checkIn, booking.checkOut) }} noches</span>
            </td>
            <td class="guests-cell">
              👥 {{ booking.guests }} {{ booking.guests === 1 ? 'persona' : 'personas' }}
            </td>
            <td class="price-cell">
              <strong>${{ formatPrice(booking.totalPrice) }}</strong>
            </td>
            <td class="status-cell">
              <div class="status-badge" :class="booking.status">
                {{ getStatusLabel(booking.status) }}
              </div>
            </td>
            <td class="actions-cell">
              <button @click="viewBookingDetails(booking)" class="btn-view" title="Ver detalles">
                👁️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.pages > 1" class="pagination">
      <button 
        @click="changePage(pagination.page - 1)"
        :disabled="pagination.page === 1"
        class="page-btn"
      >
        ← Anterior
      </button>
      <div class="page-numbers">
        <button 
          v-for="page in visiblePages" 
          :key="page"
          @click="changePage(page)"
          class="page-number"
          :class="{ active: page === pagination.page }"
        >
          {{ page }}
        </button>
      </div>
      <button 
        @click="changePage(pagination.page + 1)"
        :disabled="pagination.page === pagination.pages"
        class="page-btn"
      >
        Siguiente →
      </button>
    </div>

    <!-- Booking Details Modal -->
    <div v-if="showBookingModal" class="modal-overlay" @click.self="closeBookingModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Detalles de la reserva</h2>
          <button class="modal-close" @click="closeBookingModal">✕</button>
        </div>
        <div class="booking-details" v-if="selectedBooking">
          <div class="detail-section">
            <h4>🏠 Propiedad</h4>
            <p><strong>{{ selectedBooking.propertyId?.title }}</strong></p>
            <p class="detail-sub">📍 {{ selectedBooking.propertyId?.location?.city }}, {{ selectedBooking.propertyId?.location?.department }}</p>
            <p class="detail-sub">👤 Anfitrión: {{ selectedBooking.propertyId?.hostId?.name }} ({{ selectedBooking.propertyId?.hostId?.email }})</p>
          </div>
          
          <div class="detail-section">
            <h4>👤 Huésped</h4>
            <p><strong>{{ selectedBooking.turistaId?.name }}</strong></p>
            <p class="detail-sub">📧 {{ selectedBooking.turistaId?.email }}</p>
            <p class="detail-sub" v-if="selectedBooking.turistaId?.phone">📱 {{ selectedBooking.turistaId?.phone }}</p>
          </div>
          
          <div class="detail-section">
            <h4>📅 Detalles de la estadía</h4>
            <div class="detail-row">
              <span>Check-in:</span>
              <strong>{{ formatFullDate(selectedBooking.checkIn) }}</strong>
            </div>
            <div class="detail-row">
              <span>Check-out:</span>
              <strong>{{ formatFullDate(selectedBooking.checkOut) }}</strong>
            </div>
            <div class="detail-row">
              <span>Noches:</span>
              <strong>{{ getNights(selectedBooking.checkIn, selectedBooking.checkOut) }}</strong>
            </div>
            <div class="detail-row">
              <span>Huéspedes:</span>
              <strong>{{ selectedBooking.guests }}</strong>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>💰 Información de pago</h4>
            <div class="detail-row">
              <span>Total:</span>
              <strong class="total-amount">${{ formatPrice(selectedBooking.totalPrice) }}</strong>
            </div>
            <div class="detail-row">
              <span>Estado de pago:</span>
              <div class="payment-status" :class="selectedBooking.paymentStatus">
                {{ getPaymentStatusLabel(selectedBooking.paymentStatus) }}
              </div>
            </div>
          </div>
          
          <div class="detail-section" v-if="selectedBooking.specialRequests">
            <h4>💬 Solicitudes especiales</h4>
            <p class="special-requests">{{ selectedBooking.specialRequests }}</p>
          </div>
          
          <div class="detail-section">
            <h4>📅 Información de la reserva</h4>
            <div class="detail-row">
              <span>Reservado el:</span>
              <span>{{ formatFullDate(selectedBooking.createdAt) }}</span>
            </div>
            <div class="detail-row">
              <span>Estado:</span>
              <div class="status-badge" :class="selectedBooking.status">
                {{ getStatusLabel(selectedBooking.status) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '../../stores/admin';
import axiosInstance from '../../utils/axios.config';

const adminStore = useAdminStore();

// Estado
const filters = ref({
  search: '',
  status: '',
  sort: '-createdAt'
});
const showBookingModal = ref(false);
const selectedBooking = ref<any>(null);
const loading = ref(false);

// Computed
const bookings = computed(() => adminStore.bookings);
const pagination = computed(() => adminStore.pagination);

const visiblePages = computed(() => {
  const total = pagination.value.pages;
  const current = pagination.value.page;
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

const formatPrice = (price: number) => {
  return price?.toLocaleString('es-CO') || 0;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  });
};

const formatFullDate = (date: string) => {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getNights = (checkIn: string, checkOut: string) => {
  const diff = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada'
  };
  return labels[status] || status;
};

const getPaymentStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    paid: 'Pagado',
    failed: 'Fallido',
    refunded: 'Reembolsado'
  };
  return labels[status] || status;
};

const applyFilters = async () => {
  await adminStore.fetchBookings(1, 20, filters.value);
};

const changePage = async (page: number) => {
  await adminStore.fetchBookings(page, 20, filters.value);
};

const viewBookingDetails = (booking: any) => {
  selectedBooking.value = booking;
  showBookingModal.value = true;
};

const closeBookingModal = () => {
  showBookingModal.value = false;
  selectedBooking.value = null;
};

const exportBookings = async () => {
  try {
    const response = await axiosInstance.get('/admin/bookings/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reservas.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    alert('Error al exportar reservas');
  }
};

onMounted(() => {
  adminStore.fetchBookings();
});
</script>

<style scoped>
.admin-bookings {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1 {
  margin-bottom: 0.25rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.btn-export {
  background: #2e7d32;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border-radius: 40px;
  padding: 0.5rem 1rem;
  flex: 1;
  max-width: 300px;
}

.search-icon {
  margin-right: 0.5rem;
}

.search-box input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 40px;
  background: var(--bg-primary);
  cursor: pointer;
}

.table-container {
  background: white;
  border-radius: 16px;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 1rem;
  background: #f8f9fa;
  font-weight: 600;
  font-size: 0.85rem;
  color: #666;
  border-bottom: 1px solid #eee;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  vertical-align: top;
}

.property-cell, .guest-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.property-host, .guest-email {
  font-size: 0.7rem;
  color: #999;
}

.dates-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.nights {
  font-size: 0.7rem;
  color: #999;
}

.price-cell strong {
  color: #2e7d32;
  font-size: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
}

.status-badge.pending { background: #fff3cd; color: #856404; }
.status-badge.confirmed { background: #d4edda; color: #155724; }
.status-badge.completed { background: #d1ecf1; color: #0c5460; }
.status-badge.cancelled { background: #f8d7da; color: #721c24; }

.btn-view {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.btn-view:hover {
  background: #e3f2fd;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--bg-secondary);
  cursor: pointer;
}

.page-number.active {
  background: #2e7d32;
  color: white;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 40px;
  cursor: pointer;
}

.loading-state {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #2e7d32;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
  background: white;
  border-radius: 24px;
  max-width: 550px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.booking-details {
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.detail-section h4 {
  margin-bottom: 0.75rem;
  color: #2e7d32;
}

.detail-sub {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.25rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.detail-row span:first-child {
  color: #666;
  font-size: 0.85rem;
}

.total-amount {
  color: #2e7d32;
  font-size: 1.2rem;
}

.payment-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
}

.payment-status.pending { background: #fff3cd; color: #856404; }
.payment-status.paid { background: #d4edda; color: #155724; }
.payment-status.failed { background: #f8d7da; color: #721c24; }
.payment-status.refunded { background: #d1ecf1; color: #0c5460; }

.special-requests {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
  }
  
  .search-box {
    max-width: none;
  }
  
  .data-table th:nth-child(3),
  .data-table td:nth-child(3),
  .data-table th:nth-child(4),
  .data-table td:nth-child(4) {
    display: none;
  }
}
</style>