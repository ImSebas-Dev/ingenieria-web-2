<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>⭐ Califica tu experiencia</h2>
        <button class="modal-close" @click="close" aria-label="Cerrar">✕</button>
      </div>
      
      <form @submit.prevent="submitReview">
        <!-- Sección de calificación -->
        <div class="rating-section">
          <label class="rating-label">¿Cómo calificarías tu experiencia?</label>
          <div class="stars-container">
            <div class="stars-input">
              <span 
                v-for="i in 5" 
                :key="i"
                class="star-input"
                :class="{ active: rating >= i, 'animate': hoverRating >= i }"
                @click="rating = i"
                @mouseenter="hoverRating = i"
                @mouseleave="hoverRating = 0"
              >
                ★
              </span>
            </div>
            <span class="rating-text">{{ getRatingText(rating) }}</span>
          </div>
        </div>

        <!-- Sección de reseña -->
        <div class="review-section">
          <label for="review-comment" class="review-label">
            Tu reseña
            <span class="optional">(opcional pero recomendado)</span>
          </label>
          <div class="textarea-wrapper">
            <textarea
              id="review-comment"
              v-model="comment"
              rows="5"
              placeholder="Comparte los detalles de tu experiencia... ¿Qué te gustó más? ¿Cómo fue la atención? ¿Recomendarías este lugar?"
              :class="{ 'has-content': comment.length > 0 }"
            ></textarea>
            <div class="char-counter" :class="{ 'near-limit': comment.length > 1800 }">
              <span class="counter-current">{{ comment.length }}</span>
              <span class="counter-max">/ 2000</span>
            </div>
          </div>
          <div class="field-hint">
            <span>💡</span>
            <span>Tu opinión ayuda a otros viajeros a tomar mejores decisiones</span>
          </div>
        </div>

        <!-- Sugerencias de reseña -->
        <div class="suggestions-section" v-if="!comment">
          <p class="suggestions-title">✨ Ideas para tu reseña:</p>
          <div class="suggestions-list">
            <button type="button" v-for="suggestion in suggestions" :key="suggestion" @click="comment = suggestion" class="suggestion-chip">
              {{ suggestion }}
            </button>
          </div>
        </div>

        <!-- Preview del puntaje de ayuda -->
        <div class="helpfulness-preview">
          <div class="preview-item">
            <span class="preview-icon">👍</span>
            <span>¿Fue útil esta reseña para otros viajeros?</span>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="modal-actions">
          <button type="button" @click="close" class="btn-cancel">
            Cancelar
          </button>
          <button type="submit" :disabled="submitting || (!comment && rating === 5)" class="btn-submit">
            <span v-if="submitting" class="btn-loader"></span>
            {{ submitting ? 'Publicando...' : 'Publicar reseña' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useReviewStore } from '../stores/review';

const props = defineProps<{
  show: boolean;
  propertyId: string;
  bookingId: string;
}>();

const emit = defineEmits(['close', 'success']);

const reviewStore = useReviewStore();
const rating = ref(5);
const hoverRating = ref(0);
const comment = ref('');
const submitting = ref(false);

// Sugerencias de reseña
const suggestions = [
  "✨ La limpieza y comodidad fueron excelentes",
  "🌿 El entorno natural es increíble, muy tranquilo",
  "👨‍👩‍👧‍👦 El anfitrión fue muy amable y atento",
  "🍽️ La comida del lugar es deliciosa",
  "🚿 Las instalaciones están en perfecto estado",
  "📍 La ubicación es ideal, cerca de todo"
];

// Texto según la calificación
const getRatingText = (stars: number) => {
  const texts: Record<number, string> = {
    1: 'Muy malo',
    2: 'Malo',
    3: 'Regular',
    4: 'Bueno',
    5: 'Excelente'
  };
  return texts[stars] || '';
};

const submitReview = async () => {
  // Validar que la reseña tenga al menos 10 caracteres si se escribió algo
  if (comment.value.length > 0 && comment.value.length < 10) {
    alert('💡 Por favor escribe una reseña más detallada (mínimo 10 caracteres)');
    return;
  }
  
  submitting.value = true;
  try {
    await reviewStore.createReview({
      propertyId: props.propertyId,
      bookingId: props.bookingId,
      rating: rating.value,
      comment: comment.value || "Excelente experiencia, muy recomendado!"
    });
    
    emit('success');
    close();
  } catch (error: any) {
    console.error('Error submitting review:', error);
    const errorMsg = error.response?.data?.error || 'Error al publicar la reseña';
    alert(`❌ ${errorMsg}`);
  } finally {
    submitting.value = false;
  }
};

const close = () => {
  rating.value = 5;
  hoverRating.value = 0;
  comment.value = '';
  emit('close');
};

// Resetear estado cuando se abre el modal
watch(() => props.show, (newVal) => {
  if (newVal) {
    rating.value = 5;
    comment.value = '';
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 24px;
  max-width: 550px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

@keyframes slideUp {
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
  font-size: 1.5rem;
  background: linear-gradient(135deg, #2e7d32, #4caf50);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.modal-close {
  background: var(--bg-secondary);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #ffebee;
  color: #e74c3c;
  transform: scale(1.05);
}

/* Rating Section */
.rating-section {
  padding: 0 1.5rem;
  margin-bottom: 1.5rem;
}

.rating-label {
  display: block;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.stars-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.stars-input {
  display: flex;
  gap: 0.5rem;
}

.star-input {
  font-size: 2.5rem;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.star-input.active {
  color: #ffc107;
}

.star-input.animate {
  animation: starPulse 0.3s ease;
}

@keyframes starPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.star-input:hover {
  transform: scale(1.1);
}

.rating-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: #ffc107;
  background: #fff8e1;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

/* Review Section */
.review-section {
  padding: 0 1.5rem;
  margin-bottom: 1rem;
}

.review-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.optional {
  font-size: 0.7rem;
  font-weight: normal;
  color: var(--text-secondary);
  margin-left: 0.5rem;
}

.textarea-wrapper {
  position: relative;
}

textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 16px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s;
  line-height: 1.5;
}

textarea:focus {
  outline: none;
  border-color: #2e7d32;
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
}

textarea.has-content {
  border-color: #2e7d32;
}

.char-counter {
  position: absolute;
  bottom: 0.75rem;
  right: 1rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
  background: var(--bg-primary);
  padding: 0.2rem 0.4rem;
  border-radius: 20px;
}

.char-counter.near-limit {
  color: #e74c3c;
}

.counter-current {
  font-weight: 600;
}

.field-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
}

/* Suggestions Section */
.suggestions-section {
  padding: 0 1.5rem;
  margin-bottom: 1.5rem;
}

.suggestions-title {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.suggestion-chip {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  border-radius: 40px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}

.suggestion-chip:hover {
  background: #e8f5e9;
  border-color: #2e7d32;
  color: #2e7d32;
  transform: translateY(-2px);
}

/* Helpfulness Preview */
.helpfulness-preview {
  padding: 0 1.5rem;
  margin-bottom: 1rem;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  border-radius: 12px;
  font-size: 0.8rem;
  color: #2e7d32;
}

.preview-icon {
  font-size: 1.2rem;
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid var(--border-color);
  margin-top: 0.5rem;
}

.btn-cancel, .btn-submit {
  flex: 1;
  padding: 0.85rem;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: var(--border-color);
  transform: translateY(-2px);
}

.btn-submit {
  background: linear-gradient(135deg, #2e7d32, #4caf50);
  color: white;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-loader {
  width: 18px;
  height: 18px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Scrollbar styling */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #2e7d32;
  border-radius: 3px;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 85vh;
  }
  
  .stars-input {
    gap: 0.25rem;
  }
  
  .star-input {
    font-size: 2rem;
  }
  
  .stars-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .suggestions-list {
    flex-direction: column;
  }
  
  .suggestion-chip {
    text-align: center;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .rating-section, .review-section, .suggestions-section, .helpfulness-preview {
    padding: 0 1rem;
  }
}
</style>