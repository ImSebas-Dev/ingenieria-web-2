<template>
  <div class="my-reviews">
    <!-- Header con estadísticas -->
    <div class="page-header">
      <div>
        <h1>⭐ Mis Reseñas</h1>
        <p class="subtitle">Las reseñas que has escrito sobre las propiedades que visitaste</p>
      </div>
      <div class="header-stats">
        <div class="stat-card-mini">
          <span class="stat-value">{{ totalReviews }}</span>
          <span class="stat-label">Total reseñas</span>
        </div>
        <div class="stat-card-mini">
          <span class="stat-value">{{ helpfulCount }}</span>
          <span class="stat-label">👍 Útiles recibidos</span>
        </div>
        <div class="stat-card-mini">
          <span class="stat-value">{{ averageRating.toFixed(1) }}</span>
          <span class="stat-label">⭐ Promedio</span>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <div class="filter-tabs">
        <button 
          v-for="tab in filterTabs" 
          :key="tab.value"
          @click="activeFilter = tab.value"
          class="tab-btn"
          :class="{ active: activeFilter === tab.value }"
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
        >
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando tus reseñas...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredReviews.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>Aún no has escrito ninguna reseña</h3>
      <p>Después de completar tu estadía en una propiedad, podrás calificar y comentar tu experiencia.</p>
      <router-link to="/properties" class="btn-primary">Explorar propiedades</router-link>
    </div>

    <!-- Reviews List -->
    <div v-else class="reviews-list">
      <div v-for="review in paginatedReviews" :key="review._id" class="review-card">
        <div class="review-header">
          <router-link :to="`/properties/${review.propertyId._id}`" class="property-link">
            <img 
              :src="getMainImage(review.propertyId)" 
              :alt="review.propertyId.title"
              class="property-image"
            >
            <div class="property-info">
              <h3>{{ review.propertyId.title }}</h3>
              <p class="location">
                📍 {{ review.propertyId.location?.city }}, {{ review.propertyId.location?.department }}
              </p>
            </div>
          </router-link>
          
          <div class="review-meta">
            <div class="rating-badge">
              <div class="stars">
                <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= review.rating }">★</span>
              </div>
              <span class="rating-value">{{ review.rating }}.0</span>
            </div>
            <span class="review-date">{{ formatDate(review.createdAt) }}</span>
          </div>
        </div>

        <div class="review-content">
          <p class="comment">{{ review.comment }}</p>
          
          <div v-if="review.images && review.images.length > 0" class="review-images">
            <div 
              v-for="(img, idx) in review.images.slice(0, 4)" 
              :key="idx"
              class="review-image-wrapper"
              @click="viewImage(img)"
            >
              <img :src="img" alt="Review image" class="review-image">
              <div class="image-overlay">
                <span>🔍</span>
              </div>
            </div>
            <div v-if="review.images.length > 4" class="more-images">
              +{{ review.images.length - 4 }}
            </div>
          </div>
        </div>

        <div v-if="review.hostResponse" class="host-response">
          <div class="response-header">
            <div class="response-icon">🏠</div>
            <div>
              <strong>Respuesta del anfitrión</strong>
              <span class="response-date">{{ formatDate(review.hostResponse.createdAt) }}</span>
            </div>
          </div>
          <p class="response-text">{{ review.hostResponse.comment }}</p>
        </div>

        <div class="review-footer">
          <div class="review-stats">
            <div class="helpful-count" :class="{ active: review.helpful > 0 }">
              👍 <span>{{ review.helpful }}</span> persona{{ review.helpful !== 1 ? 's' : '' }} encontró útil esta reseña
            </div>
            <div v-if="review.isEdited" class="edited-badge">
              ✏️ Editada • {{ formatDate(review.editedAt) }}
            </div>
          </div>
          
          <div class="action-buttons">
            <button 
              v-if="canEdit(review)"
              @click="openEditModal(review)" 
              class="btn-edit"
              title="Editar reseña"
            >
              ✏️ Editar
            </button>
            <button 
              v-if="canEdit(review)"
              @click="confirmDelete(review._id)" 
              class="btn-delete"
              title="Eliminar reseña"
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredReviews.length > itemsPerPage" class="pagination">
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

    <!-- Modal de edición -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>✏️ Editar reseña</h2>
          <button class="modal-close" @click="closeEditModal">✕</button>
        </div>
        
        <form @submit.prevent="updateReview">
          <div class="rating-selector">
            <label>Tu calificación</label>
            <div class="stars-input">
              <span 
                v-for="i in 5" 
                :key="i"
                class="star-input"
                :class="{ active: editRating >= i }"
                @click="editRating = i"
              >
                ★
              </span>
            </div>
          </div>

          <div class="form-group">
            <label>Tu reseña</label>
            <textarea
              v-model="editComment"
              rows="5"
              required
              minlength="10"
              maxlength="2000"
              placeholder="Cuéntanos más sobre tu experiencia..."
            ></textarea>
            <div class="char-counter">
              <span :class="{ 'near-limit': editComment.length > 1800 }">{{ editComment.length }}</span>
              <span>/ 2000 caracteres</span>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeEditModal" class="btn-cancel">Cancelar</button>
            <button type="submit" :disabled="updating" class="btn-submit">
              <span v-if="updating" class="btn-loader"></span>
              {{ updating ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de confirmación de eliminación -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="closeDeleteConfirm">
      <div class="modal-content small">
        <div class="modal-header">
          <h2>🗑️ Eliminar reseña</h2>
          <button class="modal-close" @click="closeDeleteConfirm">✕</button>
        </div>
        <div class="delete-warning">
          <span class="warning-icon">⚠️</span>
          <p>¿Estás seguro de que quieres eliminar esta reseña?</p>
          <p class="warning-text">Esta acción no se puede deshacer y tu calificación será removida de la propiedad.</p>
        </div>
        <div class="modal-actions">
          <button @click="closeDeleteConfirm" class="btn-cancel">Cancelar</button>
          <button @click="deleteReview" class="btn-delete-confirm">Sí, eliminar</button>
        </div>
      </div>
    </div>

    <!-- Modal de vista de imagen -->
    <div v-if="showImageViewer" class="modal-overlay" @click.self="closeImageViewer">
      <div class="image-viewer">
        <img :src="selectedImage" alt="Imagen ampliada">
        <button @click="closeImageViewer" class="close-viewer">✕</button>
        <div class="viewer-controls">
          <span class="zoom-hint">🔍 Click para cerrar</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useReviewStore } from '../stores/review';

const reviewStore = useReviewStore();

// Estado
const activeFilter = ref('all');
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(5);

// Estado para modales
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);
const showImageViewer = ref(false);
const selectedImage = ref('');
const editingReview = ref<any>(null);
const editRating = ref(5);
const editComment = ref('');
const updating = ref(false);
const deletingId = ref('');

// Computed
const reviews = computed(() => reviewStore.reviews);
const loading = computed(() => reviewStore.loading);

const totalReviews = computed(() => reviews.value.length);

const helpfulCount = computed(() => {
  return reviews.value.reduce((sum, review) => sum + (review.helpful || 0), 0);
});

const averageRating = computed(() => {
  if (reviews.value.length === 0) return 0;
  const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0);
  return sum / reviews.value.length;
});

const filterTabs = computed(() => [
  { value: 'all', label: 'Todas', icon: '⭐', count: reviews.value.length },
  { value: '5', label: '5 estrellas', icon: '🌟🌟🌟🌟🌟', count: reviews.value.filter(r => r.rating === 5).length },
  { value: '4', label: '4 estrellas', icon: '🌟🌟🌟🌟', count: reviews.value.filter(r => r.rating === 4).length },
  { value: '3', label: '3 estrellas', icon: '🌟🌟🌟', count: reviews.value.filter(r => r.rating === 3).length },
  { value: 'with_response', label: 'Con respuesta', icon: '💬', count: reviews.value.filter(r => r.hostResponse).length }
]);

const filteredReviews = computed(() => {
  let filtered = [...reviews.value];
  
  // Filtrar por calificación
  if (activeFilter.value === 'with_response') {
    filtered = filtered.filter(r => r.hostResponse);
  } else if (activeFilter.value !== 'all') {
    const rating = parseInt(activeFilter.value);
    filtered = filtered.filter(r => r.rating === rating);
  }
  
  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(r => 
      r.propertyId?.title?.toLowerCase().includes(query) ||
      r.comment?.toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredReviews.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredReviews.value.length / itemsPerPage.value);
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

const formatDate = (date: string) => {
  if (!date) return 'Fecha desconocida';
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const canEdit = (review: any) => {
  const daysSinceCreation = (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceCreation <= 30;
};

const openEditModal = (review: any) => {
  editingReview.value = review;
  editRating.value = review.rating;
  editComment.value = review.comment;
  showEditModal.value = true;
  document.body.style.overflow = 'hidden';
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingReview.value = null;
  editRating.value = 5;
  editComment.value = '';
  document.body.style.overflow = '';
};

const updateReview = async () => {
  if (!editingReview.value) return;
  
  if (editComment.value.length < 10) {
    alert('La reseña debe tener al menos 10 caracteres');
    return;
  }
  
  updating.value = true;
  try {
    await reviewStore.updateReview(editingReview.value._id, {
      rating: editRating.value,
      comment: editComment.value
    });
    await reviewStore.fetchMyReviews();
    closeEditModal();
    alert('✨ Reseña actualizada exitosamente');
  } catch (error) {
    console.error('Error updating review:', error);
    alert('Error al actualizar la reseña. Por favor intenta de nuevo.');
  } finally {
    updating.value = false;
  }
};

const confirmDelete = (id: string) => {
  deletingId.value = id;
  showDeleteConfirm.value = true;
  document.body.style.overflow = 'hidden';
};

const closeDeleteConfirm = () => {
  showDeleteConfirm.value = false;
  deletingId.value = '';
  document.body.style.overflow = '';
};

const deleteReview = async () => {
  try {
    await reviewStore.deleteReview(deletingId.value);
    await reviewStore.fetchMyReviews();
    closeDeleteConfirm();
    alert('✅ Reseña eliminada exitosamente');
  } catch (error) {
    console.error('Error deleting review:', error);
    alert('Error al eliminar la reseña');
  }
};

const viewImage = (imageUrl: string) => {
  selectedImage.value = imageUrl;
  showImageViewer.value = true;
  document.body.style.overflow = 'hidden';
};

const closeImageViewer = () => {
  showImageViewer.value = false;
  selectedImage.value = '';
  document.body.style.overflow = '';
};

// Resetear página cuando cambian los filtros
const resetPagination = () => {
  currentPage.value = 1;
};

// Watchers
import { watch } from 'vue';
watch([activeFilter, searchQuery], () => {
  resetPagination();
});

onMounted(() => {
  reviewStore.fetchMyReviews();
});
</script>

<style scoped>
.my-reviews {
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

.stat-card-mini {
  text-align: center;
  padding: 0.75rem 1.25rem;
  background: var(--bg-secondary);
  border-radius: 16px;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #2e7d32;
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
  gap: 0.5rem;
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

/* Reviews List */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-card {
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.review-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.property-link {
  display: flex;
  gap: 1rem;
  text-decoration: none;
  color: inherit;
  flex: 1;
}

.property-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 12px;
}

.property-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.location {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin: 0;
}

.review-meta {
  text-align: right;
}

.rating-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #e0e0e0;
  font-size: 1rem;
}

.star.filled {
  color: #ffc107;
}

.rating-value {
  font-weight: 600;
  color: #ffc107;
}

.review-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.review-content {
  margin-bottom: 1rem;
}

.comment {
  line-height: 1.6;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.review-images {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.review-image-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
}

.review-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  transition: transform 0.3s;
}

.review-image-wrapper:hover .review-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.review-image-wrapper:hover .image-overlay {
  opacity: 1;
}

.more-images {
  width: 100px;
  height: 100px;
  background: var(--bg-secondary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-secondary);
}

/* Host Response */
.host-response {
  background: #e8f5e9;
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.response-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.response-icon {
  font-size: 1.5rem;
}

.response-header strong {
  display: block;
  font-size: 0.85rem;
}

.response-date {
  font-size: 0.7rem;
  color: #666;
  margin-left: 0.5rem;
}

.response-text {
  font-size: 0.85rem;
  color: var(--text-primary);
  margin-left: 2.25rem;
}

/* Review Footer */
.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: 1rem;
}

.review-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.helpful-count {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.helpful-count.active {
  color: #2e7d32;
}

.edited-badge {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-edit, .btn-delete {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-edit {
  background: #3498db;
  color: white;
}

.btn-edit:hover {
  background: #2980b9;
  transform: translateY(-1px);
}

.btn-delete {
  background: #e74c3c;
  color: white;
}

.btn-delete:hover {
  background: #c0392b;
  transform: translateY(-1px);
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

/* Modals */
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
  max-width: 500px;
  width: 90%;
  position: relative;
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

.modal-content.small {
  max-width: 400px;
}

.rating-selector {
  padding: 1rem 1.5rem;
}

.rating-selector label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stars-input {
  display: flex;
  gap: 0.5rem;
}

.star-input {
  font-size: 2rem;
  color: #ddd;
  cursor: pointer;
  transition: color 0.2s;
}

.star-input.active {
  color: #ffc107;
}

.form-group {
  padding: 0 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  background: var(--bg-primary);
  color: var(--text-primary);
}

textarea:focus {
  outline: none;
  border-color: #2e7d32;
}

.char-counter {
  text-align: right;
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.char-counter .near-limit {
  color: #e74c3c;
}

.delete-warning {
  text-align: center;
  padding: 1.5rem;
}

.warning-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.warning-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem 1.5rem;
}

.btn-cancel, .btn-submit, .btn-delete-confirm {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-submit {
  background: #2e7d32;
  color: white;
}

.btn-delete-confirm {
  background: #e74c3c;
  color: white;
}

.btn-submit:disabled, .btn-delete-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-loader {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

/* Image Viewer */
.image-viewer {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.image-viewer img {
  max-width: 100%;
  max-height: 90vh;
  border-radius: 12px;
}

.close-viewer {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background 0.2s;
}

.close-viewer:hover {
  background: rgba(0,0,0,0.8);
}

.viewer-controls {
  position: absolute;
  bottom: -40px;
  left: 0;
  right: 0;
  text-align: center;
}

.zoom-hint {
  font-size: 0.7rem;
  color: white;
  background: rgba(0,0,0,0.6);
  padding: 4px 12px;
  border-radius: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .my-reviews {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
  }
  
  .filters-bar {
    flex-direction: column;
  }
  
  .filter-tabs {
    justify-content: center;
  }
  
  .search-box {
    width: 100%;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .review-header {
    flex-direction: column;
  }
  
  .review-meta {
    text-align: left;
  }
  
  .property-link {
    flex-direction: column;
  }
  
  .property-image {
    width: 100%;
    height: 150px;
  }
  
  .review-footer {
    flex-direction: column;
  }
  
  .action-buttons {
    width: 100%;
  }
  
  .btn-edit, .btn-delete {
    flex: 1;
    text-align: center;
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