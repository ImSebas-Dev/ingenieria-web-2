<template>
  <div class="admin-properties">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>🏠 Gestión de Propiedades</h1>
        <p class="subtitle">Administra y modera todas las propiedades de la plataforma</p>
      </div>
      <button class="btn-export" @click="exportProperties">
        📊 Exportar propiedades
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="filters.search" 
          type="text" 
          placeholder="Buscar por título o ubicación..."
          @input="applyFilters"
        >
      </div>
      
      <select v-model="filters.type" class="filter-select" @change="applyFilters">
        <option value="">Todos los tipos</option>
        <option value="casa">🏠 Casa</option>
        <option value="cabaña">🌲 Cabaña</option>
        <option value="finca">🏞️ Finca</option>
        <option value="glamping">⛺ Glamping</option>
        <option value="hotel_rural">🏨 Hotel Rural</option>
        <option value="eco_lodge">🦜 Eco Lodge</option>
      </select>
      
      <select v-model="filters.status" class="filter-select" @change="applyFilters">
        <option value="">Todos los estados</option>
        <option value="active">Activas</option>
        <option value="inactive">Inactivas</option>
        <option value="pending">Pendientes de verificación</option>
      </select>
      
      <select v-model="filters.sort" class="filter-select" @change="applyFilters">
        <option value="-createdAt">Más recientes</option>
        <option value="createdAt">Más antiguas</option>
        <option value="-averageRating">Mejor calificadas</option>
        <option value="-pricePerNight">Precio: mayor a menor</option>
        <option value="pricePerNight">Precio: menor a mayor</option>
      </select>
    </div>

    <!-- Properties Grid -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando propiedades...</p>
    </div>

    <div v-else-if="properties.length === 0" class="empty-state">
      <div class="empty-icon">🏠</div>
      <h3>No hay propiedades</h3>
      <p>No se encontraron propiedades con los filtros seleccionados</p>
    </div>

    <div v-else class="properties-grid">
      <div v-for="property in properties" :key="property._id" class="property-card">
        <div class="card-image">
          <img :src="getMainImage(property)" :alt="property.title">
          <div class="card-badges">
            <span v-if="!property.isVerified" class="badge pending">Pendiente</span>
            <span v-if="!property.isActive" class="badge inactive">Inactiva</span>
            <span v-if="property.discountPercent" class="badge discount">-{{ property.discountPercent }}%</span>
          </div>
        </div>
        
        <div class="card-content">
          <div class="card-header">
            <h3>{{ property.title }}</h3>
            <div class="rating">
              <span class="stars">⭐</span>
              <span>{{ property.averageRating?.toFixed(1) || 'Nuevo' }}</span>
            </div>
          </div>
          
          <p class="card-location">
            📍 {{ property.location.city }}, {{ property.location.department }}
          </p>
          
          <div class="card-host">
            <span class="host-icon">👤</span>
            <span>{{ property.hostId?.name || 'Usuario eliminado' }}</span>
            <span class="host-email">{{ property.hostId?.email }}</span>
          </div>
          
          <div class="card-stats">
            <div class="stat">
              <span class="stat-icon">🛏️</span>
              <span>{{ property.bedrooms }} hab</span>
            </div>
            <div class="stat">
              <span class="stat-icon">🚽</span>
              <span>{{ property.bathrooms }} baños</span>
            </div>
            <div class="stat">
              <span class="stat-icon">👥</span>
              <span>{{ property.capacity?.adults }} pers</span>
            </div>
            <div class="stat">
              <span class="stat-icon">⭐</span>
              <span>{{ property.totalReviews || 0 }} reseñas</span>
            </div>
          </div>
          
          <div class="card-price">
            <span class="price-amount">${{ formatPrice(property.pricePerNight) }}</span>
            <span class="price-period">/ noche</span>
          </div>
          
          <div class="card-date">
            📅 Publicada: {{ formatDate(property.createdAt) }}
          </div>
        </div>
        
        <div class="card-actions">
          <button 
            v-if="!property.isVerified"
            @click="verifyProperty(property._id)"
            class="btn-verify"
            title="Verificar propiedad"
          >
            ✅ Verificar
          </button>
          <button 
            @click="toggleStatus(property._id, !property.isActive)"
            class="btn-toggle"
            :class="{ active: property.isActive, inactive: !property.isActive }"
            :title="property.isActive ? 'Desactivar' : 'Activar'"
          >
            {{ property.isActive ? '🔴 Desactivar' : '🟢 Activar' }}
          </button>
          <button 
            @click="viewPropertyDetails(property)"
            class="btn-view"
            title="Ver detalles"
          >
            👁️ Ver
          </button>
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

    <!-- Property Details Modal -->
    <div v-if="showPropertyModal" class="modal-overlay" @click.self="closePropertyModal">
      <div class="modal-content large">
        <div class="modal-header">
          <h2>Detalles de la propiedad</h2>
          <button class="modal-close" @click="closePropertyModal">✕</button>
        </div>
        <div class="property-details" v-if="selectedProperty">
          <div class="detail-gallery">
            <img :src="getMainImage(selectedProperty)" :alt="selectedProperty.title" class="detail-image">
          </div>
          <div class="detail-info">
            <h3>{{ selectedProperty.title }}</h3>
            <p class="detail-location">📍 {{ selectedProperty.location.address }}, {{ selectedProperty.location.city }}</p>
            <div class="detail-row">
              <strong>Anfitrión:</strong> {{ selectedProperty.hostId?.name }} ({{ selectedProperty.hostId?.email }})
            </div>
            <div class="detail-row">
              <strong>Tipo:</strong> {{ getTypeLabel(selectedProperty.type) }}
            </div>
            <div class="detail-row">
              <strong>Precio:</strong> ${{ formatPrice(selectedProperty.pricePerNight) }}/noche
            </div>
            <div class="detail-row">
              <strong>Descripción:</strong> 
              <p class="detail-description">{{ selectedProperty.description }}</p>
            </div>
            <div class="detail-row">
              <strong>Amenidades:</strong>
              <div class="detail-amenities">
                <span v-for="a in selectedProperty.amenities" :key="a" class="amenity-tag">
                  {{ getAmenityIcon(a) }} {{ getAmenityName(a) }}
                </span>
              </div>
            </div>
            <div class="detail-actions">
              <button @click="verifyProperty(selectedProperty._id)" v-if="!selectedProperty.isVerified" class="btn-verify-full">
                ✅ Verificar propiedad
              </button>
              <button @click="toggleStatus(selectedProperty._id, !selectedProperty.isActive)" class="btn-toggle-full">
                {{ selectedProperty.isActive ? '🔴 Desactivar propiedad' : '🟢 Activar propiedad' }}
              </button>
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
  type: '',
  status: '',
  sort: '-createdAt'
});
const showPropertyModal = ref(false);
const selectedProperty = ref<any>(null);
const loading = ref(false);

// Computed
const properties = computed(() => adminStore.properties);
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

// Configuración de URL base para imágenes
const API_BASE_URL = 'http://localhost:5000';

const getMainImage = (prop: any) => {
  if (!prop) return `${API_BASE_URL}/uploads/properties/default.jpg`;
  if (!prop.images || prop.images.length === 0) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e0e0e0"/%3E%3Ctext x="200" y="160" font-family="Arial" font-size="16" fill="%23999" text-anchor="middle"%3E🏠 Sin imagen%3C/text%3E%3C/svg%3E';
  }
  const mainImage = prop.images.find((img: any) => img.isMain);
  let imageUrl = mainImage?.url || prop.images[0]?.url;
  if (!imageUrl) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e0e0e0"/%3E%3Ctext x="200" y="160" font-family="Arial" font-size="16" fill="%23999" text-anchor="middle"%3E🏠 Sin imagen%3C/text%3E%3C/svg%3E';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_BASE_URL}${imageUrl}`;
};

const formatPrice = (price: number) => {
  return price?.toLocaleString('es-CO') || 0;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
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

const applyFilters = async () => {
  await adminStore.fetchProperties(1, 12, filters.value);
};

const changePage = async (page: number) => {
  await adminStore.fetchProperties(page, 12, filters.value);
};

const verifyProperty = async (propertyId: string) => {
  if (confirm('¿Marcar esta propiedad como verificada?')) {
    await adminStore.togglePropertyVerification(propertyId, true);
  }
};

const toggleStatus = async (propertyId: string, isActive: boolean) => {
  const action = isActive ? 'Activar' : 'Desactivar';
  if (confirm(`¿${action} esta propiedad?`)) {
    await adminStore.togglePropertyStatus(propertyId, isActive);
  }
};

const viewPropertyDetails = (property: any) => {
  selectedProperty.value = property;
  showPropertyModal.value = true;
};

const closePropertyModal = () => {
  showPropertyModal.value = false;
  selectedProperty.value = null;
};

const exportProperties = async () => {
  try {
    const response = await axiosInstance.get('/admin/properties/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'propiedades.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    alert('Error al exportar propiedades');
  }
};

onMounted(() => {
  adminStore.fetchProperties();
});
</script>

<style scoped>
.admin-properties {
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

.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.property-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: all 0.2s;
}

.property-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

.card-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-badges {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
}

.badge.pending {
  background: #ff9800;
  color: white;
}

.badge.inactive {
  background: #e74c3c;
  color: white;
}

.badge.discount {
  background: #e74c3c;
  color: white;
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
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
}

.card-location {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.card-host {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.host-email {
  font-size: 0.65rem;
  color: #999;
}

.card-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
  padding: 0.5rem 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-price {
  margin-bottom: 0.5rem;
}

.price-amount {
  font-size: 1.1rem;
  font-weight: bold;
  color: #2e7d32;
}

.card-date {
  font-size: 0.65rem;
  color: #999;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.btn-verify, .btn-toggle, .btn-view {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.75rem;
  text-align: center;
  transition: all 0.2s;
}

.btn-verify {
  background: #ff9800;
  color: white;
}

.btn-verify:hover {
  background: #f57c00;
}

.btn-toggle.active {
  background: #e74c3c;
  color: white;
}

.btn-toggle.inactive {
  background: #2e7d32;
  color: white;
}

.btn-view {
  background: #3498db;
  color: white;
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
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 900px;
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

.property-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
}

.detail-gallery {
  border-radius: 16px;
  overflow: hidden;
}

.detail-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.detail-info h3 {
  margin-bottom: 0.5rem;
}

.detail-location {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.detail-row {
  margin-bottom: 1rem;
}

.detail-description {
  margin-top: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.5;
}

.detail-amenities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.amenity-tag {
  background: var(--bg-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  font-size: 0.7rem;
}

.detail-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.btn-verify-full, .btn-toggle-full {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
}

.btn-verify-full {
  background: #ff9800;
  color: white;
}

.btn-toggle-full {
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
  
  .properties-grid {
    grid-template-columns: 1fr;
  }
  
  .property-details {
    grid-template-columns: 1fr;
  }
  
  .card-actions {
    flex-wrap: wrap;
  }
}
</style>