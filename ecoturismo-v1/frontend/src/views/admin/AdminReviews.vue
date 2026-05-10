<template>
  <div class="admin-reviews">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>⭐ Moderación de Reseñas</h1>
        <p class="subtitle">Administra y modera las reseñas de los usuarios</p>
      </div>
      <button class="btn-export" @click="exportReviews">
        📊 Exportar reseñas
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value">{{ totalReviews }}</div>
        <div class="stat-label">Total reseñas</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">{{ reportedCount }}</div>
        <div class="stat-label">Reportadas</div>
      </div>
      <div class="stat-card success">
        <div class="stat-value">{{ activeCount }}</div>
        <div class="stat-label">Activas</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-value">{{ removedCount }}</div>
        <div class="stat-label">Eliminadas</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="filters.search" 
          type="text" 
          placeholder="Buscar por propiedad o usuario..."
          @input="applyFilters"
        >
      </div>
      
      <select v-model="filters.status" class="filter-select" @change="applyFilters">
        <option value="">Todos los estados</option>
        <option value="active">✅ Activas</option>
        <option value="flagged">⚠️ Reportadas</option>
        <option value="removed">🗑️ Eliminadas</option>
      </select>
      
      <select v-model="filters.rating" class="filter-select" @change="applyFilters">
        <option value="">Todas las calificaciones</option>
        <option value="5">⭐⭐⭐⭐⭐ 5 estrellas</option>
        <option value="4">⭐⭐⭐⭐ 4 estrellas</option>
        <option value="3">⭐⭐⭐ 3 estrellas</option>
        <option value="2">⭐⭐ 2 estrellas</option>
        <option value="1">⭐ 1 estrella</option>
      </select>
      
      <select v-model="filters.sort" class="filter-select" @change="applyFilters">
        <option value="-createdAt">Más recientes</option>
        <option value="createdAt">Más antiguas</option>
        <option value="-helpful">Más útiles</option>
        <option value="-rating">Mejor calificadas</option>
      </select>
    </div>

    <!-- Reviews List -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando reseñas...</p>
    </div>

    <div v-else-if="reviews.length === 0" class="empty-state">
      <div class="empty-icon">⭐</div>
      <h3>No hay reseñas</h3>
      <p>No se encontraron reseñas con los filtros seleccionados</p>
    </div>

    <div v-else class="reviews-list">
      <div v-for="review in reviews" :key="review._id" class="review-card" :class="{ flagged: review.status === 'flagged' }">
        <div class="review-header">
          <div class="reviewer-info">
            <div class="reviewer-avatar">
              {{ review.userId?.name?.charAt(0) || '👤' }}
            </div>
            <div>
              <div class="reviewer-name">
                {{ review.userId?.name }}
                <span class="reviewer-email">{{ review.userId?.email }}</span>
              </div>
              <div class="review-meta">
                <div class="stars">
                  <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= review.rating }">★</span>
                </div>
                <span class="date">{{ formatDate(review.createdAt) }}</span>
              </div>
            </div>
          </div>
          <div class="review-status">
            <span class="status-badge" :class="review.status">
              {{ getStatusLabel(review.status) }}
            </span>
            <span v-if="review.reported" class="reported-badge">
              ⚠️ Reportada
            </span>
          </div>
        </div>

        <div class="review-property">
          <span class="property-icon">🏠</span>
          <strong>{{ review.propertyId?.title }}</strong>
          <span class="property-host">por {{ review.propertyId?.hostId?.name }}</span>
        </div>

        <p class="review-comment">{{ review.comment }}</p>

        <div class="review-footer">
          <div class="review-stats">
            <span class="helpful-count">👍 {{ review.helpful || 0 }} personas encontraron útil</span>
          </div>
          <div class="action-buttons">
            <button 
              v-if="review.status === 'flagged'"
              @click="approveReview(review._id)"
              class="btn-approve"
              title="Aprobar reseña"
            >
              ✅ Aprobar
            </button>
            <button 
              v-if="review.status !== 'removed'"
              @click="removeReview(review._id)"
              class="btn-remove"
              title="Eliminar reseña"
            >
              🗑️ Eliminar
            </button>
            <button 
              @click="viewReviewDetails(review)"
              class="btn-view"
              title="Ver detalles"
            >
              👁️ Ver
            </button>
          </div>
        </div>
      </div>
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

    <!-- Review Details Modal -->
    <div v-if="showReviewModal" class="modal-overlay" @click.self="closeReviewModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Detalles de la reseña</h2>
          <button class="modal-close" @click="closeReviewModal">✕</button>
        </div>
        <div class="review-details" v-if="selectedReview">
          <div class="detail-section">
            <h4>⭐ Calificación</h4>
            <div class="stars-big">
              <span v-for="i in 5" :key="i" class="star big" :class="{ filled: i <= selectedReview.rating }">★</span>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>📝 Reseña</h4>
            <p class="detail-comment">{{ selectedReview.comment }}</p>
          </div>
          
          <div class="detail-section">
            <h4>👤 Autor</h4>
            <p><strong>{{ selectedReview.userId?.name }}</strong></p>
            <p class="detail-sub">📧 {{ selectedReview.userId?.email }}</p>
            <p class="detail-sub" v-if="selectedReview.userId?.phone">📱 {{ selectedReview.userId?.phone }}</p>
          </div>
          
          <div class="detail-section">
            <h4>🏠 Propiedad</h4>
            <p><strong>{{ selectedReview.propertyId?.title }}</strong></p>
            <p class="detail-sub">📍 {{ selectedReview.propertyId?.location?.city }}, {{ selectedReview.propertyId?.location?.department }}</p>
            <p class="detail-sub">👤 Anfitrión: {{ selectedReview.propertyId?.hostId?.name }}</p>
          </div>
          
          <div class="detail-section" v-if="selectedReview.hostResponse">
            <h4>💬 Respuesta del anfitrión</h4>
            <div class="host-response-detail">
              <p>{{ selectedReview.hostResponse.comment }}</p>
              <span class="response-date">{{ formatFullDate(selectedReview.hostResponse.createdAt) }}</span>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>📊 Estadísticas</h4>
            <div class="stats-row-detail">
              <div class="stat-detail">
                <span class="stat-icon">👍</span>
                <span>{{ selectedReview.helpful || 0 }} útiles</span>
              </div>
              <div class="stat-detail">
                <span class="stat-icon">📅</span>
                <span>{{ formatFullDate(selectedReview.createdAt) }}</span>
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button 
              v-if="selectedReview.status === 'flagged'"
              @click="approveReview(selectedReview._id)"
              class="btn-approve-full"
            >
              ✅ Aprobar reseña
            </button>
            <button 
              v-if="selectedReview.status !== 'removed'"
              @click="removeReview(selectedReview._id)"
              class="btn-remove-full"
            >
              🗑️ Eliminar reseña
            </button>
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
  rating: '',
  sort: '-createdAt'
});
const showReviewModal = ref(false);
const selectedReview = ref<any>(null);
const loading = ref(false);

// Computed
const reviews = computed(() => adminStore.reviews);
const pagination = computed(() => adminStore.pagination);

const totalReviews = computed(() => reviews.value.length);
const reportedCount = computed(() => reviews.value.filter(r => r.reported).length);
const activeCount = computed(() => reviews.value.filter(r => r.status === 'active').length);
const removedCount = computed(() => reviews.value.filter(r => r.status === 'removed').length);

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

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: 'Activa',
    flagged: 'Reportada',
    removed: 'Eliminada'
  };
  return labels[status] || status;
};

const applyFilters = async () => {
  await adminStore.fetchReviews(1, 10, filters.value);
};

const changePage = async (page: number) => {
  await adminStore.fetchReviews(page, 10, filters.value);
};

const approveReview = async (reviewId: string) => {
  if (confirm('¿Aprobar esta reseña? Volverá a ser visible para todos.')) {
    await adminStore.moderateReview(reviewId, 'approve');
    await adminStore.fetchReviews(1, 10, filters.value);
  }
};

const removeReview = async (reviewId: string) => {
  if (confirm('¿Eliminar esta reseña? Esta acción no se puede deshacer.')) {
    await adminStore.moderateReview(reviewId, 'remove');
    await adminStore.fetchReviews(1, 10, filters.value);
  }
};

const viewReviewDetails = (review: any) => {
  selectedReview.value = review;
  showReviewModal.value = true;
};

const closeReviewModal = () => {
  showReviewModal.value = false;
  selectedReview.value = null;
};

const exportReviews = async () => {
  try {
    const response = await axiosInstance.get('/admin/reviews/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reseñas.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    alert('Error al exportar reseñas');
  }
};

onMounted(() => {
  adminStore.fetchReviews();
});
</script>

<style scoped>
.admin-reviews {
  max-width: 1200px;
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

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2e7d32;
}

.stat-card.warning .stat-value { color: #ff9800; }
.stat-card.success .stat-value { color: #4caf50; }
.stat-card.danger .stat-value { color: #e74c3c; }

.stat-label {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

/* Filters */
.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
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

/* Reviews List */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: all 0.2s;
  border-left: 4px solid transparent;
}

.review-card.flagged {
  border-left-color: #ff9800;
  background: #fff8e1;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.reviewer-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #2e7d32, #4caf50);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
}

.reviewer-name {
  font-weight: 600;
}

.reviewer-email {
  font-size: 0.7rem;
  color: #999;
  margin-left: 0.5rem;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.25rem;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #e0e0e0;
  font-size: 0.8rem;
}

.star.filled {
  color: #ffc107;
}

.date {
  font-size: 0.7rem;
  color: #999;
}

.review-status {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
}

.status-badge.active { background: #d4edda; color: #155724; }
.status-badge.flagged { background: #fff3cd; color: #856404; }
.status-badge.removed { background: #f8d7da; color: #721c24; }

.reported-badge {
  background: #ff9800;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  font-size: 0.65rem;
}

.review-property {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  flex-wrap: wrap;
}

.property-icon {
  font-size: 1rem;
}

.property-host {
  font-size: 0.7rem;
  color: #999;
  margin-left: 0.5rem;
}

.review-comment {
  line-height: 1.5;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: 1rem;
}

.review-stats {
  font-size: 0.8rem;
  color: #666;
}

.helpful-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-approve, .btn-remove, .btn-view {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-approve {
  background: #4caf50;
  color: white;
}

.btn-approve:hover {
  background: #45a049;
}

.btn-remove {
  background: #e74c3c;
  color: white;
}

.btn-remove:hover {
  background: #c0392b;
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
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
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
  max-width: 600px;
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

.review-details {
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

.stars-big {
  display: flex;
  gap: 4px;
}

.star.big {
  font-size: 1.5rem;
  color: #e0e0e0;
}

.star.big.filled {
  color: #ffc107;
}

.detail-comment {
  line-height: 1.6;
  color: var(--text-primary);
}

.detail-sub {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.25rem;
}

.host-response-detail {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 12px;
}

.response-date {
  display: block;
  font-size: 0.7rem;
  color: #999;
  margin-top: 0.5rem;
}

.stats-row-detail {
  display: flex;
  gap: 1.5rem;
}

.stat-detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-approve-full, .btn-remove-full {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
}

.btn-approve-full {
  background: #4caf50;
  color: white;
}

.btn-remove-full {
  background: #e74c3c;
  color: white;
}

@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
  }
  
  .search-box {
    max-width: none;
  }
  
  .review-header {
    flex-direction: column;
  }
  
  .review-footer {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .stats-row-detail {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>