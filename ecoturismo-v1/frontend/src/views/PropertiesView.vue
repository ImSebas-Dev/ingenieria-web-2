<template>
  <div class="properties-page">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1>🌿 Descubre alojamientos <span class="highlight">únicos</span></h1>
        <p>Encuentra el lugar perfecto para conectar con la naturaleza y vivir experiencias auténticas</p>
      </div>
    </div>

    <div class="properties-container">
      <!-- Header con acciones -->
      <div class="page-header">
        <div class="header-left">
          <h2>Alojamientos disponibles</h2>
          <span class="result-count">{{ pagination.total }} resultados</span>
        </div>
        <router-link v-if="isAnfitrion" to="/properties/create" class="btn-primary">
          <span>+</span> Publicar Alojamiento
        </router-link>
      </div>

      <!-- Filtros y ordenamiento -->
      <div class="filters-bar">
        <div class="filters-row">
          <div class="filter-group">
            <span class="filter-icon">🏠</span>
            <select v-model="filters.type" @change="applyFilters" class="filter-select">
              <option value="">Todos los tipos</option>
              <option value="casa">Casa</option>
              <option value="cabaña">Cabaña</option>
              <option value="finca">Finca</option>
              <option value="glamping">Glamping</option>
              <option value="hotel_rural">Hotel Rural</option>
              <option value="eco_lodge">Eco Lodge</option>
            </select>
          </div>

          <div class="filter-group">
            <span class="filter-icon">🛏️</span>
            <select v-model="filters.bedrooms" @change="applyFilters" class="filter-select">
              <option value="">Habitaciones</option>
              <option value="1">1+ hab</option>
              <option value="2">2+ hab</option>
              <option value="3">3+ hab</option>
              <option value="4">4+ hab</option>
              <option value="5">5+ hab</option>
            </select>
          </div>

          <div class="filter-group price-range">
            <span class="filter-icon">💰</span>
            <input 
              type="number" 
              v-model="filters.minPrice" 
              placeholder="Mínimo"
              @change="applyFilters"
              class="price-input"
            />
            <span class="price-sep">-</span>
            <input 
              type="number" 
              v-model="filters.maxPrice" 
              placeholder="Máximo"
              @change="applyFilters"
              class="price-input"
            />
          </div>
        </div>

        <div class="sort-group">
          <span class="sort-label">Ordenar por:</span>
          <select v-model="filters.sort" @change="applyFilters" class="sort-select">
            <option value="-createdAt">Más recientes</option>
            <option value="-averageRating">Mejor calificados</option>
            <option value="pricePerNight">Precio: menor a mayor</option>
            <option value="-pricePerNight">Precio: mayor a menor</option>
          </select>
          
          <div class="view-toggle">
            <button 
              @click="viewMode = 'grid'" 
              class="view-btn" 
              :class="{ active: viewMode === 'grid' }"
              aria-label="Vista en cuadrícula"
            >
              ⊞
            </button>
            <button 
              @click="viewMode = 'list'" 
              class="view-btn" 
              :class="{ active: viewMode === 'list' }"
              aria-label="Vista en lista"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <!-- Filtros activos -->
      <div v-if="hasActiveFilters" class="active-filters">
        <span class="active-filters-label">Filtros activos:</span>
        <div class="filter-tags">
          <span v-if="filters.type" class="filter-tag">
            {{ getTypeLabel(filters.type) }}
            <button @click="clearFilter('type')">✕</button>
          </span>
          <span v-if="filters.bedrooms" class="filter-tag">
            {{ filters.bedrooms }}+ habitaciones
            <button @click="clearFilter('bedrooms')">✕</button>
          </span>
          <span v-if="filters.minPrice || filters.maxPrice" class="filter-tag">
            ${{ formatPrice(filters.minPrice || 0) }} - ${{ formatPrice(filters.maxPrice || 999999) }}
            <button @click="clearFilter('price')">✕</button>
          </span>
          <button v-if="hasActiveFilters" class="clear-all" @click="clearAllFilters">
            Limpiar todos
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Buscando alojamientos...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="properties.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No encontramos resultados</h3>
        <p>Intenta con otros filtros o palabras clave diferentes</p>
        <button class="btn-clear" @click="clearAllFilters">Ver todas las propiedades</button>
      </div>

      <!-- Properties Grid/List -->
      <div v-else class="properties-grid" :class="{ 'list-view': viewMode === 'list' }">
        <div 
          v-for="property in properties" 
          :key="property._id"
          class="property-card"
          @click="goToProperty(property._id)"
        >
          <div class="card-image">
            <img 
              :src="getMainImage(property)" 
              :alt="property.title"
              loading="lazy"
            />
            <div class="card-badge" v-if="property.discountPercent">
              -{{ property.discountPercent }}%
            </div>
            <div class="card-overlay">
              <button class="quick-view-btn" @click.stop="quickView(property)">
                Vista rápida
              </button>
            </div>
          </div>
          
          <div class="card-content">
            <div class="card-header">
              <h3>{{ property.title }}</h3>
              <div class="rating">
                <span class="stars">⭐</span>
                <span class="rating-value">{{ property.averageRating?.toFixed(1) || 'Nuevo' }}</span>
              </div>
            </div>
            
            <p class="card-location">
              📍 {{ property.location?.city }}, {{ property.location?.department }}
            </p>
            
            <div class="card-details" v-if="viewMode === 'list'">
              <span>🛏️ {{ property.bedrooms }} hab</span>
              <span>🚽 {{ property.bathrooms }} baños</span>
              <span>👥 {{ property.capacity?.adults }} pers</span>
              <span v-if="property.amenities?.length" class="amenities-preview">
                ✨ {{ property.amenities.slice(0, 3).join(', ') }}{{ property.amenities.length > 3 ? '...' : '' }}
              </span>
            </div>
            
            <div class="card-footer">
              <div class="price">
                <span class="price-amount">${{ formatPrice(property.pricePerNight) }}</span>
                <span class="price-period">/ noche</span>
              </div>
              <div class="card-type">
                {{ getTypeLabel(property.type) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="pagination">
        <button 
          @click="changePage(pagination.page - 1)"
          :disabled="pagination.page === 1"
          class="page-btn prev"
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
          class="page-btn next"
        >
          Siguiente →
        </button>
      </div>
    </div>

    <!-- Modal vista rápida -->
    <div v-if="showQuickView" class="modal-overlay" @click.self="closeQuickView">
      <div class="modal-content">
        <button class="modal-close" @click="closeQuickView">✕</button>
        <div class="quick-view-container" v-if="selectedProperty">
          <img :src="getMainImage(selectedProperty)" :alt="selectedProperty.title" class="quick-view-image">
          <div class="quick-view-info">
            <h2>{{ selectedProperty.title }}</h2>
            <p class="quick-view-location">📍 {{ selectedProperty.location?.city }}, {{ selectedProperty.location?.department }}</p>
            <div class="quick-view-stats">
              <span>⭐ {{ selectedProperty.averageRating?.toFixed(1) || 'Nuevo' }}</span>
              <span>🛏️ {{ selectedProperty.bedrooms }} hab</span>
              <span>🚽 {{ selectedProperty.bathrooms }} baños</span>
              <span>👥 {{ selectedProperty.capacity?.adults }} pers</span>
            </div>
            <div class="quick-view-price">
              <span class="price-amount">${{ formatPrice(selectedProperty.pricePerNight) }}</span>
              <span class="price-period">/ noche</span>
            </div>
            <p class="quick-view-description">{{ selectedProperty.description?.substring(0, 150) }}...</p>
            <div class="quick-view-actions">
              <button @click="goToProperty(selectedProperty._id)" class="btn-primary">
                Ver detalles
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePropertyStore } from '../stores/property';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const propertyStore = usePropertyStore();
const authStore = useAuthStore();

// Estado
const viewMode = ref<'grid' | 'list'>('grid');
const showQuickView = ref(false);
const selectedProperty = ref<any>(null);
const loadingMore = ref(false);

// Filtros
const filters = ref({
  type: '',
  bedrooms: '',
  minPrice: '',
  maxPrice: '',
  sort: '-createdAt',
  page: 1,
  limit: 12
});

// Computed
const isAnfitrion = computed(() => authStore.isAnfitrion);
const properties = computed(() => propertyStore.properties);
const loading = computed(() => propertyStore.loading);
const pagination = computed(() => propertyStore.pagination);

const hasActiveFilters = computed(() => {
  return filters.value.type || 
         filters.value.bedrooms || 
         filters.value.minPrice || 
         filters.value.maxPrice;
});

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

const applyFilters = async () => {
  filters.value.page = 1;
  await propertyStore.fetchProperties(filters.value);
  
  // Actualizar URL con parámetros
  const query: any = {};
  if (filters.value.type) query.type = filters.value.type;
  if (filters.value.bedrooms) query.bedrooms = filters.value.bedrooms;
  if (filters.value.minPrice) query.minPrice = filters.value.minPrice;
  if (filters.value.maxPrice) query.maxPrice = filters.value.maxPrice;
  if (filters.value.sort !== '-createdAt') query.sort = filters.value.sort;
  
  router.replace({ query });
};

const changePage = async (page: number) => {
  filters.value.page = page;
  await propertyStore.fetchProperties(filters.value);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const clearFilter = (filter: string) => {
  if (filter === 'type') filters.value.type = '';
  if (filter === 'bedrooms') filters.value.bedrooms = '';
  if (filter === 'price') {
    filters.value.minPrice = '';
    filters.value.maxPrice = '';
  }
  applyFilters();
};

const clearAllFilters = () => {
  filters.value.type = '';
  filters.value.bedrooms = '';
  filters.value.minPrice = '';
  filters.value.maxPrice = '';
  filters.value.sort = '-createdAt';
  applyFilters();
};

const goToProperty = (id: string) => {
  router.push(`/properties/${id}`);
};

const quickView = (property: any) => {
  selectedProperty.value = property;
  showQuickView.value = true;
  document.body.style.overflow = 'hidden';
};

const closeQuickView = () => {
  showQuickView.value = false;
  selectedProperty.value = null;
  document.body.style.overflow = '';
};

// Cargar parámetros de URL al montar
onMounted(async () => {
  if (route.query.type) filters.value.type = route.query.type as string;
  if (route.query.bedrooms) filters.value.bedrooms = route.query.bedrooms as string;
  if (route.query.minPrice) filters.value.minPrice = route.query.minPrice as string;
  if (route.query.maxPrice) filters.value.maxPrice = route.query.maxPrice as string;
  if (route.query.sort) filters.value.sort = route.query.sort as string;
  if (route.query.search) filters.value.search = route.query.search as string;
  
  await propertyStore.fetchProperties(filters.value);
});
</script>

<style scoped>
.properties-page {
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #1a5f2a 0%, #0d3b1a 100%);
  padding: 4rem 2rem;
  text-align: center;
  color: white;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-section h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero-section .highlight {
  color: #ffc107;
}

.hero-section p {
  font-size: 1.1rem;
  opacity: 0.9;
}

/* Properties Container */
.properties-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 2rem;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h2 {
  margin-bottom: 0.25rem;
}

.result-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #2e7d32;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 40px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #1b5e20;
  transform: translateY(-2px);
}

/* Filters Bar */
.filters-bar {
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.filters-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-secondary);
  padding: 0.25rem 1rem;
  border-radius: 40px;
}

.filter-icon {
  font-size: 1rem;
}

.filter-select {
  padding: 0.5rem 0;
  border: none;
  background: none;
  font-size: 0.9rem;
  cursor: pointer;
  outline: none;
}

.price-range {
  gap: 0.25rem;
}

.price-input {
  width: 100px;
  padding: 0.5rem;
  border: none;
  background: none;
  font-size: 0.9rem;
  outline: none;
}

.price-input::placeholder {
  color: var(--text-secondary);
}

.price-sep {
  color: var(--text-secondary);
}

/* Sort Group */
.sort-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sort-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.sort-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 40px;
  background: var(--bg-primary);
  cursor: pointer;
  font-size: 0.85rem;
}

.view-toggle {
  display: flex;
  gap: 0.25rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 0.25rem;
}

.view-btn {
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.view-btn.active {
  background: var(--bg-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* Active Filters */
.active-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 0;
}

.active-filters-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.filter-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem 0.25rem 1rem;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 40px;
  font-size: 0.8rem;
}

.filter-tag button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  color: #2e7d32;
  padding: 0 4px;
}

.clear-all {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 0.8rem;
  text-decoration: underline;
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

.btn-clear {
  padding: 0.75rem 1.5rem;
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
}

/* Properties Grid */
.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.properties-grid.list-view {
  grid-template-columns: 1fr;
}

.properties-grid.list-view .property-card {
  display: flex;
  flex-direction: row;
}

.properties-grid.list-view .card-image {
  width: 280px;
  height: auto;
}

.properties-grid.list-view .card-content {
  flex: 1;
}

/* Property Card */
.property-card {
  background: var(--bg-primary);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.property-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.12);
}

.card-image {
  position: relative;
  height: 220px;
  overflow: hidden;
  background: var(--bg-secondary);
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.property-card:hover .card-image img {
  transform: scale(1.05);
}

.card-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #ff9800;
  color: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: bold;
}

.card-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  padding: 1rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.property-card:hover .card-overlay {
  opacity: 1;
}

.quick-view-btn {
  width: 100%;
  background: white;
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.card-content {
  padding: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.card-header h3 {
  font-size: 1rem;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
}

.stars {
  color: #ffc107;
}

.card-location {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.card-details {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  padding: 0.5rem 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.amenities-preview {
  color: #2e7d32;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-amount {
  font-size: 1.1rem;
  font-weight: bold;
  color: #2e7d32;
}

.price-period {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.card-type {
  font-size: 0.7rem;
  padding: 4px 8px;
  background: var(--bg-secondary);
  border-radius: 20px;
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
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 24px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0,0,0,0.5);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  z-index: 10;
  transition: background 0.2s;
}

.modal-close:hover {
  background: rgba(0,0,0,0.7);
}

.quick-view-container {
  display: flex;
  flex-direction: column;
}

.quick-view-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.quick-view-info {
  padding: 1.5rem;
}

.quick-view-location {
  color: var(--text-secondary);
  margin: 0.5rem 0;
}

.quick-view-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin: 1rem 0;
  padding: 0.75rem 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.quick-view-price {
  margin: 1rem 0;
}

.quick-view-description {
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 1rem 0;
}

.quick-view-actions .btn-primary {
  width: 100%;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .properties-container {
    padding: 1rem;
  }
  
  .hero-section h1 {
    font-size: 1.8rem;
  }
  
  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters-row {
    flex-direction: column;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .price-range {
    justify-content: space-between;
  }
  
  .price-input {
    flex: 1;
  }
  
  .sort-group {
    justify-content: space-between;
  }
  
  .properties-grid.list-view .property-card {
    flex-direction: column;
  }
  
  .properties-grid.list-view .card-image {
    width: 100%;
    height: 200px;
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