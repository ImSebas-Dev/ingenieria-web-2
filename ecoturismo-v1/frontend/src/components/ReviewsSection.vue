<template>
  <div class="reviews-section">
    <div class="reviews-header">
      <div class="header-left">
        <h3>⭐ Reseñas de viajeros</h3>
        <p class="subtitle">Lo que otros huéspedes opinan sobre este alojamiento</p>
      </div>
      <div class="header-right" v-if="stats.totalReviews > 0">
        <div class="score-circle">
          <span class="score">{{ stats.averageRating.toFixed(1) }}</span>
          <span class="score-max">/5</span>
        </div>
      </div>
    </div>

    <!-- Stats Summary mejorado -->
    <div class="stats-summary" v-if="stats.totalReviews > 0">
      <div class="average-rating">
        <div class="stars-big">
          <span v-for="i in 5" :key="i" class="star big" :class="{ filled: i <= Math.round(stats.averageRating) }">★</span>
        </div>
        <span class="total-reviews">{{ stats.totalReviews }} reseñas verificadas</span>
      </div>
      
      <div class="rating-distribution">
        <div v-for="rating in [5,4,3,2,1]" :key="rating" class="distribution-bar">
          <span class="rating-label">{{ rating }} estrella{{ rating !== 1 ? 's' : '' }}</span>
          <div class="bar-container">
            <div 
              class="bar-fill" 
              :style="{ width: getPercentage(rating) + '%' }"
              :class="getBarClass(rating)"
            ></div>
          </div>
          <span class="rating-count">{{ stats.distribution[rating] || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-reviews">
      <div class="spinner-small"></div>
      <p>Cargando reseñas...</p>
    </div>

    <!-- No reviews -->
    <div v-else-if="reviews.length === 0" class="no-reviews">
      <div class="no-reviews-icon">📭</div>
      <h4>Aún no hay reseñas</h4>
      <p>Sé el primero en compartir tu experiencia después de tu estadía</p>
      <div class="no-reviews-decoration"></div>
    </div>

    <!-- Reviews List -->
    <div v-else class="reviews-list">
      <transition-group name="review-list" tag="div">
        <div v-for="review in reviews" :key="review._id" class="review-card">
          <div class="review-header">
            <div class="user-info">
              <img :src="review.userId.avatar || getDefaultAvatar(review.userId.name)" :alt="review.userId.name" class="user-avatar">
              <div>
                <strong class="user-name">{{ review.userId.name }}</strong>
                <div class="review-meta">
                  <div class="stars">
                    <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= review.rating }">★</span>
                  </div>
                  <span class="date">· {{ formatDate(review.createdAt) }}</span>
                  <span v-if="review.isVerified" class="verified-badge" title="Estancia verificada">✓ Verificada</span>
                </div>
              </div>
            </div>
            
            <button 
              v-if="!isOwnReview(review) && isAuthenticated"
              @click="toggleHelpful(review._id)" 
              class="helpful-btn"
              :class="{ active: isHelpful(review._id) }"
              :disabled="helpfulLoading === review._id"
            >
              <span class="helpful-icon">👍</span>
              <span class="helpful-count">{{ review.helpful || 0 }}</span>
            </button>
          </div>
          
          <p class="review-comment">{{ review.comment }}</p>
          
          <!-- Imágenes de reseña -->
          <div v-if="review.images && review.images.length > 0" class="review-images">
            <div 
              v-for="(img, idx) in review.images.slice(0, 4)" 
              :key="idx"
              class="review-image-wrapper"
              @click="openImageViewer(img)"
            >
              <img :src="img" :alt="`Imagen ${idx + 1}`" class="review-image">
              <div class="image-overlay">
                <span>🔍</span>
              </div>
            </div>
            <div v-if="review.images.length > 4" class="more-images">
              +{{ review.images.length - 4 }}
            </div>
          </div>
          
          <!-- Respuesta del anfitrión -->
          <div v-if="review.hostResponse && review.hostResponse.comment" class="host-response">
            <div class="response-avatar">🏠</div>
            <div class="response-content">
              <div class="response-header">
                <strong>Respuesta del anfitrión</strong>
                <span class="response-date">{{ formatDate(review.hostResponse.createdAt) }}</span>
              </div>
              <p class="response-text">{{ review.hostResponse.comment }}</p>
            </div>
          </div>
          
          <!-- Botón para responder (solo anfitrión) -->
          <div v-if="isPropertyOwner && (!review.hostResponse || !review.hostResponse.comment)" class="respond-section">
            <button @click="openRespondModal(review)" class="btn-respond">
              <span class="btn-icon">💬</span>
              Responder a esta reseña
            </button>
          </div>
          
          <div v-if="review.isEdited" class="edited-note">
            <span class="edit-icon">✏️</span>
            <small>Editada el {{ formatDate(review.editedAt) }}</small>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.pages > 1" class="pagination-reviews">
      <button 
        @click="loadPage(pagination.page - 1)"
        :disabled="pagination.page === 1"
        class="page-btn prev"
      >
        ← Anterior
      </button>
      <div class="page-numbers">
        <button 
          v-for="page in visiblePages" 
          :key="page"
          @click="loadPage(page)"
          class="page-number"
          :class="{ active: page === pagination.page }"
        >
          {{ page }}
        </button>
      </div>
      <button 
        @click="loadPage(pagination.page + 1)"
        :disabled="pagination.page === pagination.pages"
        class="page-btn next"
      >
        Siguiente →
      </button>
    </div>

    <!-- Modal para responder reseña -->
    <div v-if="showRespondModal" class="modal-overlay" @click.self="closeRespondModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>💬 Responder a la reseña</h2>
          <button class="modal-close" @click="closeRespondModal">✕</button>
        </div>
        
        <div class="responding-to">
          <div class="responder-avatar">👤</div>
          <div>
            <span class="responder-label">Respondiendo a:</span>
            <strong>{{ respondingReview?.userId?.name }}</strong>
          </div>
        </div>
        
        <div class="original-review">
          <div class="original-rating">
            <span class="small-label">Calificación:</span>
            <div class="stars small">
              <span v-for="i in respondingReview?.rating" :key="i" class="star filled">★</span>
              <span v-for="i in (5 - (respondingReview?.rating || 0))" :key="i" class="star">★</span>
            </div>
          </div>
          <p class="original-comment">"{{ respondingReview?.comment?.substring(0, 100) }}..."</p>
        </div>
        
        <div class="form-group">
          <label>Tu respuesta</label>
          <textarea
            v-model="responseText"
            rows="4"
            placeholder="Agradece al huésped por su reseña y comparte tu perspectiva..."
            maxlength="1000"
            class="response-textarea"
            :class="{ 'has-content': responseText.length > 0 }"
          ></textarea>
          <div class="char-counter" :class="{ 'near-limit': responseText.length > 800 }">
            <span>{{ responseText.length }}</span>/1000 caracteres
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeRespondModal" class="btn-cancel">Cancelar</button>
          <button @click="submitResponse" :disabled="submittingResponse || !responseText.trim()" class="btn-submit">
            <span v-if="submittingResponse" class="btn-loader"></span>
            {{ submittingResponse ? 'Publicando...' : 'Publicar respuesta' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de vista de imagen -->
    <div v-if="showImageViewer" class="modal-overlay" @click.self="closeImageViewer">
      <div class="image-viewer">
        <img :src="selectedImage" alt="Imagen ampliada">
        <button class="close-viewer" @click="closeImageViewer">✕</button>
        <div class="viewer-controls">
          <span class="zoom-hint">🔍 Click fuera para cerrar</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useReviewStore } from '../stores/review';
import { useAuthStore } from '../stores/auth';
import axiosInstance from '../utils/axios.config';

const props = defineProps<{
  propertyId: string;
  hostId: string;
}>();

const reviewStore = useReviewStore();
const authStore = useAuthStore();

// Computed
const reviews = computed(() => reviewStore.reviews);
const loading = computed(() => reviewStore.loading);
const stats = computed(() => reviewStore.stats);
const pagination = computed(() => reviewStore.pagination);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const currentUser = computed(() => authStore.user);

// Estado
const helpfulStatus = ref<Record<string, boolean>>({});
const helpfulLoading = ref<string | null>(null);
const showRespondModal = ref(false);
const showImageViewer = ref(false);
const selectedImage = ref('');
const respondingReview = ref<any>(null);
const responseText = ref('');
const submittingResponse = ref(false);

// Computed adicionales
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

const isPropertyOwner = computed(() => {
  if (!currentUser.value || !props.hostId) return false;
  return currentUser.value._id === props.hostId || currentUser.value.role === 'admin';
});

// Métodos
const getPercentage = (rating: number) => {
  if (stats.value.totalReviews === 0) return 0;
  return (stats.value.distribution[rating] / stats.value.totalReviews) * 100;
};

const getBarClass = (rating: number) => {
  if (rating >= 4) return 'high';
  if (rating >= 3) return 'medium';
  return 'low';
};

const getDefaultAvatar = (name: string) => {
  return `https://ui-avatars.com/api/?background=2e7d32&color=fff&name=${name.charAt(0)}`;
};

const formatDate = (date: string) => {
  if (!date) return 'Fecha desconocida';
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const isOwnReview = (review: any) => {
  return currentUser.value?._id === review.userId._id;
};

const isHelpful = (reviewId: string) => {
  return helpfulStatus.value[reviewId] || false;
};

const toggleHelpful = async (reviewId: string) => {
  if (!isAuthenticated.value) {
    alert('Inicia sesión para marcar reseñas como útiles');
    return;
  }
  
  if (helpfulLoading.value === reviewId) return;
  
  helpfulLoading.value = reviewId;
  
  try {
    await reviewStore.markHelpful(reviewId);
    
    if (helpfulStatus.value[reviewId]) {
      helpfulStatus.value[reviewId] = false;
      const review = reviews.value.find(r => r._id === reviewId);
      if (review) {
        review.helpful = Math.max(0, (review.helpful || 0) - 1);
      }
    } else {
      helpfulStatus.value[reviewId] = true;
      const review = reviews.value.find(r => r._id === reviewId);
      if (review) {
        review.helpful = (review.helpful || 0) + 1;
      }
    }
  } catch (error) {
    console.error('Error marking helpful:', error);
    alert('Error al marcar como útil');
  } finally {
    helpfulLoading.value = null;
  }
};

const openRespondModal = (review: any) => {
  respondingReview.value = review;
  responseText.value = '';
  showRespondModal.value = true;
  document.body.style.overflow = 'hidden';
};

const closeRespondModal = () => {
  showRespondModal.value = false;
  respondingReview.value = null;
  responseText.value = '';
  document.body.style.overflow = '';
};

const submitResponse = async () => {
  if (!responseText.value.trim()) {
    alert('Por favor escribe una respuesta');
    return;
  }
  
  if (responseText.value.length > 1000) {
    alert('La respuesta no puede exceder los 1000 caracteres');
    return;
  }
  
  submittingResponse.value = true;
  
  try {
    const response = await axiosInstance.post(`/reviews/${respondingReview.value._id}/respond`, {
      response: responseText.value.trim()
    });
    
    const index = reviews.value.findIndex(r => r._id === respondingReview.value._id);
    if (index !== -1) {
      reviews.value[index].hostResponse = {
        comment: responseText.value.trim(),
        createdAt: new Date().toISOString()
      };
    }
    
    closeRespondModal();
    alert('✅ ¡Respuesta publicada exitosamente!');
  } catch (error: any) {
    console.error('Error submitting response:', error);
    const errorMsg = error.response?.data?.error || 'Error al publicar la respuesta';
    alert(errorMsg);
  } finally {
    submittingResponse.value = false;
  }
};

const openImageViewer = (imageUrl: string) => {
  selectedImage.value = imageUrl;
  showImageViewer.value = true;
  document.body.style.overflow = 'hidden';
};

const closeImageViewer = () => {
  showImageViewer.value = false;
  selectedImage.value = '';
  document.body.style.overflow = '';
};

const loadPage = async (page: number) => {
  await reviewStore.fetchPropertyReviews(props.propertyId, page);
  window.scrollTo({ top: document.querySelector('.reviews-section')?.getBoundingClientRect().top! + window.scrollY - 100, behavior: 'smooth' });
};

onMounted(async () => {
  await reviewStore.fetchPropertyReviews(props.propertyId);
});
</script>

<style scoped>
.reviews-section {
  margin-top: 2.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

/* Header */
.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h3 {
  margin-bottom: 0.25rem;
  font-size: 1.2rem;
}

.subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.score-circle {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #2e7d32, #4caf50);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(46,125,50,0.3);
}

.score {
  font-size: 1.8rem;
  font-weight: bold;
  line-height: 1;
}

.score-max {
  font-size: 0.7rem;
  opacity: 0.8;
}

/* Stats Summary */
.stats-summary {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2rem;
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 20px;
  margin-bottom: 2rem;
}

.average-rating {
  text-align: center;
  min-width: 160px;
}

.stars-big {
  margin-bottom: 0.5rem;
}

.star.big {
  font-size: 1.5rem;
  color: #e0e0e0;
}

.star.big.filled {
  color: #ffc107;
}

.total-reviews {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.rating-distribution {
  flex: 1;
}

.distribution-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.rating-label {
  width: 85px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.bar-container {
  flex: 1;
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.bar-fill.high { background: #4caf50; }
.bar-fill.medium { background: #ff9800; }
.bar-fill.low { background: #f44336; }

.rating-count {
  width: 40px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: right;
}

/* Loading */
.loading-reviews {
  text-align: center;
  padding: 3rem;
}

.spinner-small {
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

/* No Reviews */
.no-reviews {
  text-align: center;
  padding: 3rem;
  background: var(--bg-secondary);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.no-reviews-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-reviews h4 {
  margin-bottom: 0.5rem;
}

.no-reviews p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.no-reviews-decoration {
  position: absolute;
  bottom: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(46,125,50,0.05) 0%, transparent 70%);
  border-radius: 50%;
}

/* Reviews List */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-list-enter-active, .review-list-leave-active {
  transition: all 0.3s;
}

.review-list-enter-from, .review-list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.review-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.review-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.review-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.user-info {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-size: 0.95rem;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
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
  color: var(--text-secondary);
}

.verified-badge {
  font-size: 0.65rem;
  background: #e8f5e9;
  color: #2e7d32;
  padding: 2px 6px;
  border-radius: 20px;
}

.helpful-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 40px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.helpful-btn:hover:not(:disabled) {
  background: #e8f5e9;
  border-color: #2e7d32;
}

.helpful-btn.active {
  background: #2e7d32;
  border-color: #2e7d32;
  color: white;
}

.helpful-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.helpful-icon {
  font-size: 0.8rem;
}

.helpful-count {
  font-weight: 500;
}

.review-comment {
  line-height: 1.6;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.review-images {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.review-image-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.review-image {
  width: 100%;
  height: 100%;
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
  transition: opacity 0.2s;
  color: white;
  font-size: 1.2rem;
}

.review-image-wrapper:hover .image-overlay {
  opacity: 1;
}

.more-images {
  width: 80px;
  height: 80px;
  background: var(--bg-secondary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
}

/* Host Response */
.host-response {
  display: flex;
  gap: 1rem;
  background: #e8f5e9;
  border-radius: 16px;
  padding: 1rem;
  margin-top: 1rem;
}

.response-avatar {
  font-size: 2rem;
}

.response-content {
  flex: 1;
}

.response-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.response-date {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.response-text {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-primary);
}

/* Respond Section */
.respond-section {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.btn-respond {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 40px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-respond:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1rem;
}

.edited-note {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.7rem;
}

/* Pagination */
.pagination-reviews {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
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

/* Modal de respuesta */
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
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 24px;
  max-width: 550px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideUp 0.3s ease;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

.responding-to {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 1.5rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 16px;
}

.responder-avatar {
  font-size: 2rem;
}

.responder-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  display: block;
}

.original-review {
  margin: 0 1.5rem 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 16px;
  border-left: 3px solid #ffc107;
}

.original-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.small-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.stars.small .star {
  font-size: 0.7rem;
}

.original-comment {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
}

.form-group {
  padding: 0 1.5rem;
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.response-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 16px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
}

.response-textarea:focus {
  outline: none;
  border-color: #2e7d32;
}

.response-textarea.has-content {
  border-color: #2e7d32;
}

.char-counter {
  text-align: right;
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.char-counter.near-limit {
  color: #e74c3c;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn-cancel, .btn-submit {
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

.btn-submit:disabled {
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
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
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
  .stats-summary {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .average-rating {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  
  .stars-big {
    margin-bottom: 0;
  }
  
  .review-header {
    flex-direction: column;
  }
  
  .helpful-btn {
    align-self: flex-start;
  }
  
  .user-info {
    width: 100%;
  }
  
  .review-images {
    justify-content: center;
  }
  
  .host-response {
    flex-direction: column;
    text-align: center;
  }
  
  .response-avatar {
    margin: 0 auto;
  }
  
  .response-header {
    flex-direction: column;
    text-align: center;
  }
  
  .pagination-reviews {
    flex-wrap: wrap;
  }
  
  .page-numbers {
    order: 3;
    width: 100%;
    justify-content: center;
  }
  
  .modal-content {
    width: 95%;
  }
  
  .responding-to {
    flex-direction: column;
    text-align: center;
  }
}
</style>