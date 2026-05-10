<template>
  <div class="search-view">
    <!-- Header de búsqueda -->
    <div class="search-header">
      <div class="search-header-content">
        <h1>Encuentra tu próxima <span class="highlight">aventura</span></h1>
        <p>Descubre alojamientos únicos y experiencias auténticas en Colombia</p>
        
        <!-- Barra de búsqueda principal -->
        <div class="main-search-bar">
          <div class="search-input-group">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchParams.search"
              type="text"
              placeholder="¿Dónde quieres ir? (Ej: Cartagena, Eje Cafetero, Sierra Nevada)"
              @keyup.enter="performSearch"
            />
          </div>
          <button class="search-button" @click="performSearch">
            Buscar
          </button>
        </div>
      </div>
    </div>

    <div class="search-container">
      <!-- Sidebar con filtros -->
      <aside class="filters-sidebar" :class="{ 'mobile-open': mobileFiltersOpen }">
        <div class="filters-header">
          <h3>Filtros</h3>
          <button class="close-filters" @click="closeMobileFilters">✕</button>
        </div>

        <!-- Tipo de propiedad -->
        <div class="filter-section">
          <h4 @click="toggleSection('type')">
            <span>🏠 Tipo de alojamiento</span>
            <span class="toggle-icon">{{ expandedSections.type ? '−' : '+' }}</span>
          </h4>
          <div v-show="expandedSections.type" class="filter-options">
            <label v-for="type in propertyTypes" :key="type.value" class="filter-checkbox">
              <input type="checkbox" :value="type.value" v-model="searchParams.type">
              <span>{{ type.icon }} {{ type.label }}</span>
            </label>
          </div>
        </div>

        <!-- Rango de precio -->
        <div class="filter-section">
          <h4 @click="toggleSection('price')">
            <span>💰 Rango de precio</span>
            <span class="toggle-icon">{{ expandedSections.price ? '−' : '+' }}</span>
          </h4>
          <div v-show="expandedSections.price" class="filter-options price-range">
            <div class="price-inputs">
              <div class="price-input">
                <label>Mínimo</label>
                <input type="number" v-model.number="searchParams.minPrice" placeholder="$0" min="0">
              </div>
              <span class="price-separator">-</span>
              <div class="price-input">
                <label>Máximo</label>
                <input type="number" v-model.number="searchParams.maxPrice" placeholder="Ilimitado" min="0">
              </div>
            </div>
            <input 
              type="range" 
              v-model.number="searchParams.maxPrice" 
              :max="1000000"
              :min="searchParams.minPrice || 0"
              class="price-slider"
            >
          </div>
        </div>

        <!-- Capacidad -->
        <div class="filter-section">
          <h4 @click="toggleSection('capacity')">
            <span>👥 Capacidad</span>
            <span class="toggle-icon">{{ expandedSections.capacity ? '−' : '+' }}</span>
          </h4>
          <div v-show="expandedSections.capacity" class="filter-options">
            <div class="capacity-input">
              <label>Huéspedes</label>
              <input type="number" v-model.number="searchParams.guests" placeholder="1" min="1" max="20">
            </div>
            <div class="capacity-input">
              <label>Habitaciones</label>
              <input type="number" v-model.number="searchParams.bedrooms" placeholder="Cualquiera" min="1">
            </div>
          </div>
        </div>

        <!-- Amenidades -->
        <div class="filter-section">
          <h4 @click="toggleSection('amenities')">
            <span>✨ Amenidades</span>
            <span class="toggle-icon">{{ expandedSections.amenities ? '−' : '+' }}</span>
          </h4>
          <div v-show="expandedSections.amenities" class="filter-options amenities-grid">
            <label v-for="amenity in amenitiesList" :key="amenity.value" class="filter-checkbox">
              <input type="checkbox" :value="amenity.value" v-model="searchParams.amenities">
              <span>{{ amenity.icon }} {{ amenity.label }}</span>
            </label>
          </div>
        </div>

        <!-- Calificación -->
        <div class="filter-section">
          <h4 @click="toggleSection('rating')">
            <span>⭐ Calificación</span>
            <span class="toggle-icon">{{ expandedSections.rating ? '−' : '+' }}</span>
          </h4>
          <div v-show="expandedSections.rating" class="filter-options">
            <div class="rating-options">
              <label v-for="rating in [5,4,3,2,1]" :key="rating" class="rating-option">
                <input type="radio" :value="rating" v-model="searchParams.minRating">
                <span>{{ '⭐'.repeat(rating) }} ({{ rating }}+)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="filter-actions">
          <button class="btn-clear" @click="clearFilters">Limpiar filtros</button>
          <button class="btn-apply" @click="applyFilters">Aplicar</button>
        </div>
      </aside>

      <!-- Resultados -->
      <main class="results-container">
        <!-- Vista toggle y ordenamiento -->
        <div class="results-header">
          <div class="results-count">
            <span class="count-number">{{ pagination.total }}</span>
            <span class="count-text">alojamientos encontrados</span>
          </div>
          <div class="results-controls">
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
            <select v-model="searchParams.sort" @change="performSearch" class="sort-select">
              <option value="-createdAt">Más recientes</option>
              <option value="-averageRating">Mejor calificados</option>
              <option value="pricePerNight">Precio: menor a mayor</option>
              <option value="-pricePerNight">Precio: mayor a menor</option>
            </select>
          </div>
        </div>

        <!-- Botón móvil para abrir filtros -->
        <button class="mobile-filter-btn" @click="openMobileFilters">
          🔍 Filtrar
          <span class="active-filters-badge" v-if="activeFiltersCount > 0">{{ activeFiltersCount }}</span>
        </button>

        <!-- Loading skeleton -->
        <div v-if="loading" class="results-grid">
          <div v-for="i in 6" :key="i" class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
          </div>
        </div>

        <!-- Resultados vacíos -->
        <div v-else-if="properties.length === 0" class="empty-results">
          <div class="empty-icon">🔍</div>
          <h3>No encontramos resultados</h3>
          <p>Intenta con otros filtros o palabras clave diferentes</p>
          <button class="btn-clear" @click="clearFilters">Limpiar filtros</button>
        </div>

        <!-- Resultados en grid -->
        <div v-else class="results-grid" :class="{ 'list-view': viewMode === 'list' }">
          <div 
            v-for="property in properties" 
            :key="property._id"
            class="property-card"
            @click="goToProperty(property._id)"
          >
            <div class="card-image">
              <img :src="getPropertyImage(property)" :alt="property.title" loading="lazy">
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
              </div>
              <p class="card-description" v-if="viewMode === 'list'">
                {{ property.description?.substring(0, 120) }}...
              </p>
              <div class="card-footer">
                <div class="price">
                  <span class="price-amount">${{ formatPrice(property.pricePerNight) }}</span>
                  <span class="price-period">/ noche</span>
                </div>
                <div class="card-type">
                  {{ getPropertyTypeLabel(property.type) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Paginación -->
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
      </main>
    </div>

    <!-- Modal vista rápida -->
    <div v-if="showQuickView" class="modal-overlay" @click.self="closeQuickView">
      <div class="modal-content">
        <button class="modal-close" @click="closeQuickView">✕</button>
        <div class="quick-view-container" v-if="selectedProperty">
          <img :src="getPropertyImage(selectedProperty)" :alt="selectedProperty.title" class="quick-view-image">
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
            <p class="quick-view-description">{{ selectedProperty.description?.substring(0, 200) }}...</p>
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePropertyStore } from '../stores/property';

const route = useRoute();
const router = useRouter();
const propertyStore = usePropertyStore();

// Estado
const properties = computed(() => propertyStore.properties);
const loading = computed(() => propertyStore.loading);
const pagination = computed(() => propertyStore.pagination);
const viewMode = ref<'grid' | 'list'>('grid');
const mobileFiltersOpen = ref(false);
const showQuickView = ref(false);
const selectedProperty = ref<any>(null);

// Parámetros de búsqueda
const searchParams = reactive({
  search: '',
  type: [] as string[],
  minPrice: null as number | null,
  maxPrice: null as number | null,
  guests: null as number | null,
  bedrooms: null as number | null,
  amenities: [] as string[],
  minRating: null as number | null,
  sort: '-createdAt',
  page: 1,
  limit: 12
});

// Secciones expandidas del filtro
const expandedSections = ref({
  type: true,
  price: true,
  capacity: false,
  amenities: false,
  rating: false
});

// Listas de opciones
const propertyTypes = [
  { value: 'casa', label: 'Casa', icon: '🏠' },
  { value: 'cabaña', label: 'Cabaña', icon: '🌲' },
  { value: 'finca', label: 'Finca', icon: '🏞️' },
  { value: 'glamping', label: 'Glamping', icon: '⛺' },
  { value: 'hotel_rural', label: 'Hotel Rural', icon: '🏨' },
  { value: 'eco_lodge', label: 'Eco Lodge', icon: '🦜' }
];

const amenitiesList = [
  { value: 'wifi', label: 'WiFi', icon: '📶' },
  { value: 'parking', label: 'Parqueadero', icon: '🅿️' },
  { value: 'piscina', label: 'Piscina', icon: '🏊' },
  { value: 'cocina', label: 'Cocina', icon: '🍳' },
  { value: 'jacuzzi', label: 'Jacuzzi', icon: '🛁' },
  { value: 'mascotas_permitidas', label: 'Mascotas permitidas', icon: '🐕' },
  { value: 'chimenea', label: 'Chimenea', icon: '🪵' },
  { value: 'senderismo', label: 'Senderismo', icon: '🥾' }
];

// Computed
const activeFiltersCount = computed(() => {
  let count = 0;
  if (searchParams.type.length > 0) count++;
  if (searchParams.minPrice || searchParams.maxPrice) count++;
  if (searchParams.guests) count++;
  if (searchParams.bedrooms) count++;
  if (searchParams.amenities.length > 0) count++;
  if (searchParams.minRating) count++;
  return count;
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

// Métodos
const formatPrice = (price: number) => {
  return price?.toLocaleString('es-CO') || 0;
};

const getPropertyTypeLabel = (type: string) => {
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

const getPropertyImage = (property: any) => {
  const mainImage = property.images?.find((img: any) => img.isMain);
  if (mainImage?.url) return mainImage.url;
  if (property.images?.[0]?.url) return property.images[0].url;
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e0e0e0"/%3E%3Ctext x="200" y="160" font-family="Arial" font-size="16" fill="%23999" text-anchor="middle"%3E🏠 Sin imagen%3C/text%3E%3C/svg%3E';
};

const performSearch = async () => {
  const params: any = {
    page: searchParams.page,
    limit: searchParams.limit,
    sort: searchParams.sort
  };
  
  if (searchParams.search) params.search = searchParams.search;
  if (searchParams.type.length > 0) params.type = searchParams.type.join(',');
  if (searchParams.minPrice) params.minPrice = searchParams.minPrice;
  if (searchParams.maxPrice) params.maxPrice = searchParams.maxPrice;
  if (searchParams.guests) params.guests = searchParams.guests;
  if (searchParams.bedrooms) params.bedrooms = searchParams.bedrooms;
  if (searchParams.amenities.length > 0) params.amenities = searchParams.amenities.join(',');
  if (searchParams.minRating) params.minRating = searchParams.minRating;
  
  await propertyStore.fetchProperties(params);
  
  // Actualizar URL con parámetros de búsqueda
  router.replace({ query: { ...params, page: undefined } });
};

const applyFilters = () => {
  searchParams.page = 1;
  performSearch();
  closeMobileFilters();
};

const clearFilters = () => {
  searchParams.type = [];
  searchParams.minPrice = null;
  searchParams.maxPrice = null;
  searchParams.guests = null;
  searchParams.bedrooms = null;
  searchParams.amenities = [];
  searchParams.minRating = null;
  searchParams.search = '';
  searchParams.page = 1;
  performSearch();
};

const changePage = (page: number) => {
  searchParams.page = page;
  performSearch();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const toggleSection = (section: keyof typeof expandedSections.value) => {
  expandedSections.value[section] = !expandedSections.value[section];
};

const goToProperty = (id: string) => {
  router.push(`/properties/${id}`);
};

const quickView = (property: any) => {
  selectedProperty.value = property;
  showQuickView.value = true;
};

const closeQuickView = () => {
  showQuickView.value = false;
  selectedProperty.value = null;
};

const openMobileFilters = () => {
  mobileFiltersOpen.value = true;
  document.body.style.overflow = 'hidden';
};

const closeMobileFilters = () => {
  mobileFiltersOpen.value = false;
  document.body.style.overflow = '';
};

// Cargar parámetros de URL al montar
onMounted(async () => {
  if (route.query.search) searchParams.search = route.query.search as string;
  if (route.query.type) searchParams.type = (route.query.type as string).split(',');
  if (route.query.minPrice) searchParams.minPrice = Number(route.query.minPrice);
  if (route.query.maxPrice) searchParams.maxPrice = Number(route.query.maxPrice);
  if (route.query.sort) searchParams.sort = route.query.sort as string;
  
  await performSearch();
});
</script>

<style scoped>
.search-view {
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* Search Header */
.search-header {
  background: linear-gradient(135deg, #1a5f2a 0%, #0d3b1a 100%);
  padding: 3rem 2rem;
  color: white;
  text-align: center;
}

.search-header-content {
  max-width: 800px;
  margin: 0 auto;
}

.search-header h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.search-header .highlight {
  color: #ffc107;
}

.search-header p {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

/* Main Search Bar */
.main-search-bar {
  display: flex;
  gap: 1rem;
  background: white;
  border-radius: 60px;
  padding: 0.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.search-input-group {
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 60px;
  padding: 0 1rem;
}

.search-icon {
  font-size: 1.2rem;
  color: #666;
}

.search-input-group input {
  flex: 1;
  border: none;
  padding: 1rem;
  font-size: 1rem;
  outline: none;
  background: transparent;
}

.search-button {
  background: #2e7d32;
  color: white;
  border: none;
  padding: 0 2rem;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.search-button:hover {
  background: #1b5e20;
  transform: scale(1.02);
}

/* Search Container */
.search-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  gap: 2rem;
}

/* Filters Sidebar */
.filters-sidebar {
  width: 300px;
  flex-shrink: 0;
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 1.5rem;
  position: sticky;
  top: 2rem;
  height: fit-content;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.filters-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-filters {
  display: none;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.filter-section {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.filter-section h4 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-size: 0.95rem;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.toggle-icon {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.filter-options {
  margin-top: 0.75rem;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
}

.filter-checkbox input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* Price Range */
.price-inputs {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}

.price-input {
  flex: 1;
}

.price-input label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 0.25rem;
}

.price-input input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.85rem;
}

.price-separator {
  color: var(--text-secondary);
}

.price-slider {
  width: 100%;
  margin-top: 0.5rem;
}

/* Capacity Input */
.capacity-input {
  margin-bottom: 0.75rem;
}

.capacity-input label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.capacity-input input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.85rem;
}

/* Amenities Grid */
.amenities-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

/* Rating Options */
.rating-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rating-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
}

/* Filter Actions */
.filter-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.btn-clear, .btn-apply {
  flex: 1;
  padding: 0.6rem;
  border-radius: 40px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.btn-clear:hover {
  background: var(--bg-secondary);
}

.btn-apply {
  background: #2e7d32;
  border: none;
  color: white;
}

.btn-apply:hover {
  background: #1b5e20;
}

/* Results Container */
.results-container {
  flex: 1;
  min-width: 0;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.results-count {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.count-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2e7d32;
}

.count-text {
  color: var(--text-secondary);
}

.results-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
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

.sort-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-primary);
  cursor: pointer;
}

/* Mobile Filter Button */
.mobile-filter-btn {
  display: none;
  width: 100%;
  padding: 0.75rem;
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 40px;
  font-weight: 600;
  margin-bottom: 1rem;
  cursor: pointer;
  position: relative;
}

.active-filters-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff9800;
  color: white;
  border-radius: 20px;
  padding: 2px 6px;
  font-size: 0.7rem;
}

/* Results Grid */
.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.results-grid.list-view {
  grid-template-columns: 1fr;
}

.results-grid.list-view .property-card {
  display: flex;
  flex-direction: row;
}

.results-grid.list-view .card-image {
  width: 280px;
  height: auto;
}

.results-grid.list-view .card-content {
  flex: 1;
}

/* Property Card */
.property-card {
  background: var(--bg-primary);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.property-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.12);
}

.card-image {
  position: relative;
  height: 220px;
  overflow: hidden;
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

.card-location {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.card-details {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.card-description {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 0.75rem;
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

/* Empty Results */
.empty-results {
  text-align: center;
  padding: 4rem;
  background: var(--bg-primary);
  border-radius: 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-results h3 {
  margin-bottom: 0.5rem;
}

.empty-results p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
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
  flex-wrap: wrap;
  justify-content: center;
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

/* Skeleton */
.skeleton-card {
  background: var(--bg-primary);
  border-radius: 16px;
  overflow: hidden;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-image {
  height: 220px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text {
  height: 16px;
  background: #e0e0e0;
  margin: 1rem;
  border-radius: 4px;
}

.skeleton-text.short {
  width: 60%;
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
  top: 16px;
  right: 16px;
  background: rgba(0,0,0,0.5);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  z-index: 10;
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

.quick-view-stats {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.quick-view-price {
  margin: 1rem 0;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

/* Responsive */
@media (max-width: 968px) {
  .search-container {
    flex-direction: column;
  }
  
  .filters-sidebar {
    position: fixed;
    top: 0;
    left: -100%;
    width: 85%;
    max-width: 320px;
    height: 100vh;
    z-index: 1000;
    transition: left 0.3s;
    border-radius: 0;
    overflow-y: auto;
  }
  
  .filters-sidebar.mobile-open {
    left: 0;
  }
  
  .close-filters {
    display: block;
  }
  
  .mobile-filter-btn {
    display: block;
  }
  
  .results-grid.list-view .property-card {
    flex-direction: column;
  }
  
  .results-grid.list-view .card-image {
    width: 100%;
    height: 200px;
  }
  
  .search-header h1 {
    font-size: 1.8rem;
  }
  
  .main-search-bar {
    flex-direction: column;
    border-radius: 20px;
  }
  
  .search-button {
    padding: 0.75rem;
  }
}
</style>