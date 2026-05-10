<template>
  <div class="host-dashboard">
    <!-- Header con bienvenida -->
    <div class="dashboard-header">
      <div>
        <h1>🏠 Dashboard de Anfitrión</h1>
        <p class="welcome-text">¡Bienvenido de vuelta, {{ userName }}! 👋</p>
      </div>
      <router-link to="/properties/create" class="btn-primary">
        <span>+</span> Publicar nueva propiedad
      </router-link>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🏠</div>
        <div class="stat-info">
          <h3>{{ myProperties.length }}</h3>
          <p>Propiedades</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <h3>{{ totalBookings }}</h3>
          <p>Reservas totales</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-info">
          <h3>{{ averageRating.toFixed(1) }}</h3>
          <p>Calificación promedio</p>
          <div class="rating-stars">
            <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(averageRating) }">★</span>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <h3>${{ formatPrice(totalEarnings) }}</h3>
          <p>Ganancias totales</p>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <div class="chart-card">
        <h3>📊 Reservas por mes</h3>
        <div class="bar-chart">
          <div 
            v-for="(data, index) in monthlyBookingsData" 
            :key="index" 
            class="bar-item"
          >
            <div class="bar-label">{{ data.month }}</div>
            <div class="bar-container">
              <div 
                class="bar-fill" 
                :style="{ height: `${data.percentage}%`, backgroundColor: getBarColor(index) }"
              >
                <span class="bar-value">{{ data.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>🏷️ Distribución por tipo</h3>
        <div class="pie-chart">
          <div 
            v-for="(type, index) in propertyTypesData" 
            :key="type.name" 
            class="pie-item"
          >
            <div class="pie-color" :style="{ backgroundColor: getPieColor(index) }"></div>
            <div class="pie-label">
              <span>{{ type.icon }} {{ type.name }}</span>
              <span class="pie-value">{{ type.count }} ({{ type.percentage }}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Properties Section -->
    <div class="properties-section">
      <div class="section-header">
        <h2>🏠 Mis Propiedades</h2>
        <div class="section-actions">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="🔍 Buscar propiedad..."
            class="search-input"
          >
          <select v-model="sortBy" class="sort-select">
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="rating">Mejor calificadas</option>
            <option value="bookings">Más reservadas</option>
          </select>
        </div>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>
      
      <div v-else-if="filteredProperties.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>No tienes propiedades publicadas aún</p>
        <router-link to="/properties/create" class="btn-primary">
          Publicar mi primera propiedad
        </router-link>
      </div>
      
      <div v-else class="properties-grid">
        <div v-for="property in filteredProperties" :key="property._id" class="property-card">
          <div class="card-image">
            <img :src="getMainImage(property)" :alt="property.title">
            <div class="card-badge" v-if="property.discountPercent">
              -{{ property.discountPercent }}%
            </div>
            <div class="card-overlay">
              <router-link :to="`/properties/${property._id}`" class="quick-view-btn">
                Ver detalles
              </router-link>
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
            
            <div class="card-stats">
              <div class="stat">
                <span class="stat-icon">👁️</span>
                <span>{{ property.views || 0 }} vistas</span>
              </div>
              <div class="stat">
                <span class="stat-icon">📅</span>
                <span>{{ getPropertyBookings(property._id) }} reservas</span>
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
          </div>
          
          <div class="card-actions">
            <router-link :to="`/properties/${property._id}`" class="btn-view" title="Ver propiedad">
              👁️
            </router-link>
            <router-link :to="`/properties/edit/${property._id}`" class="btn-edit" title="Editar propiedad">
              ✏️
            </router-link>
            <button @click="deleteProperty(property._id)" class="btn-delete" title="Eliminar propiedad">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePropertyStore } from '../stores/property';
import { useAuthStore } from '../stores/auth';
import { useBookingStore } from '../stores/booking';
import axiosInstance from '../utils/axios.config';

const router = useRouter();
const propertyStore = usePropertyStore();
const authStore = useAuthStore();
const bookingStore = useBookingStore();

// Estado
const myProperties = ref<any[]>([]);
const hostBookings = ref<any[]>([]);
const propertiesStats = ref<Map<string, { bookings: number; earnings: number }>>(new Map());
const loading = ref(false);
const searchQuery = ref('');
const sortBy = ref('newest');

// Estadísticas
const totalBookings = ref(0);
const totalEarnings = ref(0);

// Computed
const userName = computed(() => authStore.user?.name || 'Anfitrión');

const averageRating = computed(() => {
  if (myProperties.value.length === 0) return 0;
  const sum = myProperties.value.reduce((acc, p) => acc + (p.averageRating || 0), 0);
  return sum / myProperties.value.length;
});

const filteredProperties = computed(() => {
  let filtered = [...myProperties.value];
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(query) ||
      p.location.city.toLowerCase().includes(query) ||
      p.location.department.toLowerCase().includes(query)
    );
  }
  
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'price_asc':
        return a.pricePerNight - b.pricePerNight;
      case 'price_desc':
        return b.pricePerNight - a.pricePerNight;
      case 'rating':
        return (b.averageRating || 0) - (a.averageRating || 0);
      case 'bookings':
        return (getPropertyBookings(b._id) || 0) - (getPropertyBookings(a._id) || 0);
      default:
        return 0;
    }
  });
  
  return filtered;
});

// Datos para gráficos - versión corregida
const monthlyBookingsData = computed(() => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  // Contar reservas por mes
  const bookingsByMonth = new Array(12).fill(0);
  if (hostBookings.value && hostBookings.value.length > 0) {
    hostBookings.value.forEach(booking => {
      if (booking && booking.createdAt) {
        const date = new Date(booking.createdAt);
        const month = date.getMonth();
        bookingsByMonth[month]++;
      }
    });
  }
  
  const maxCount = Math.max(...bookingsByMonth, 1);
  
  return months.map((month, index) => ({
    month,
    count: bookingsByMonth[index],
    percentage: (bookingsByMonth[index] / maxCount) * 100
  }));
});

const propertyTypesData = computed(() => {
  const types: Record<string, { icon: string; name: string; count: number }> = {
    casa: { icon: '🏠', name: 'Casa', count: 0 },
    cabaña: { icon: '🌲', name: 'Cabaña', count: 0 },
    finca: { icon: '🏞️', name: 'Finca', count: 0 },
    glamping: { icon: '⛺', name: 'Glamping', count: 0 },
    hotel_rural: { icon: '🏨', name: 'Hotel Rural', count: 0 },
    eco_lodge: { icon: '🦜', name: 'Eco Lodge', count: 0 }
  };
  
  if (myProperties.value && myProperties.value.length > 0) {
    myProperties.value.forEach(prop => {
      if (prop && prop.type && types[prop.type]) {
        types[prop.type].count++;
      }
    });
  }
  
  const total = myProperties.value.length || 1;
  return Object.values(types)
    .filter(t => t.count > 0)
    .map(t => ({
      ...t,
      percentage: Math.round((t.count / total) * 100)
    }));
});

// Función para obtener reservas de una propiedad específica
const getPropertyBookings = (propertyId: string) => {
  const stats = propertiesStats.value.get(propertyId);
  return stats?.bookings || 0;
};

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

const getBarColor = (index: number) => {
  const colors = ['#2e7d32', '#4caf50', '#81c784', '#a5d6a7', '#c8e6c9'];
  return colors[index % colors.length];
};

const getPieColor = (index: number) => {
  const colors = ['#2e7d32', '#4caf50', '#81c784', '#a5d6a7', '#c8e6c9'];
  return colors[index % colors.length];
};

// Calcular estadísticas desde las reservas
const calculateStats = () => {
  // Limpiar el mapa
  const statsMap = new Map<string, { bookings: number; earnings: number }>();
  
  // Agrupar reservas por propiedad
  if (hostBookings.value && hostBookings.value.length > 0) {
    hostBookings.value.forEach(booking => {
      if (booking && booking.propertyId && booking.propertyId._id) {
        const propertyId = booking.propertyId._id;
        const current = statsMap.get(propertyId) || { bookings: 0, earnings: 0 };
        current.bookings++;
        if (booking.status === 'confirmed' || booking.status === 'completed') {
          current.earnings += booking.totalPrice || 0;
        }
        statsMap.set(propertyId, current);
      }
    });
  }
  
  propertiesStats.value = statsMap;
  
  // Calcular totales
  totalBookings.value = hostBookings.value?.length || 0;
  totalEarnings.value = hostBookings.value?.reduce((sum, booking) => {
    if (booking && (booking.status === 'confirmed' || booking.status === 'completed')) {
      return sum + (booking.totalPrice || 0);
    }
    return sum;
  }, 0) || 0;
};

const fetchMyProperties = async () => {
  loading.value = true;
  try {
    const response = await axiosInstance.get('/properties/my/properties');
    myProperties.value = response.data || [];
  } catch (error) {
    console.error('Error fetching my properties:', error);
    myProperties.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchHostBookings = async () => {
  try {
    await bookingStore.fetchHostBookings();
    hostBookings.value = bookingStore.hostBookings || [];
    calculateStats();
  } catch (error) {
    console.error('Error fetching host bookings:', error);
    hostBookings.value = [];
  }
};

const deleteProperty = async (id: string) => {
  if (confirm('¿Estás seguro de eliminar esta propiedad? Esta acción no se puede deshacer.')) {
    await propertyStore.deleteProperty(id);
    await fetchMyProperties();
    await fetchHostBookings();
  }
};

onMounted(() => {
  fetchMyProperties();
  fetchHostBookings();
});
</script>

<style scoped>
/* Estilos existentes - mantener los mismos */
.host-dashboard {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-header h1 {
  margin: 0;
  color: var(--text-primary);
}

.welcome-text {
  color: var(--text-secondary);
  margin-top: 0.25rem;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info h3 {
  margin: 0;
  font-size: 1.8rem;
  color: #2e7d32;
}

.stat-info p {
  margin: 0.25rem 0 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.rating-stars {
  margin-top: 0.5rem;
}

.star {
  color: #e0e0e0;
  font-size: 0.7rem;
}

.star.filled {
  color: #ffc107;
}

/* Charts Section */
.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.chart-card h3 {
  margin-bottom: 1rem;
  font-size: 1rem;
}

.bar-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  gap: 0.5rem;
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.bar-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.bar-container {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar-fill {
  width: 80%;
  min-height: 4px;
  border-radius: 8px;
  position: relative;
  transition: height 0.3s;
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  font-weight: 600;
}

.pie-chart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pie-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-radius: 8px;
}

.pie-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.pie-label {
  flex: 1;
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.pie-value {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

/* Properties Section */
.properties-section {
  margin-top: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  font-size: 1.2rem;
  margin: 0;
}

.section-actions {
  display: flex;
  gap: 1rem;
}

.search-input {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 40px;
  background: var(--bg-primary);
  width: 200px;
}

.sort-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 40px;
  background: var(--bg-primary);
  cursor: pointer;
}

/* Properties Grid */
.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.property-card {
  background: var(--bg-primary);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
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
  font-size: 0.7rem;
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
  text-decoration: none;
  display: inline-block;
  text-align: center;
  color: #2e7d32;
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

.card-location {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
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

.stat-icon {
  font-size: 0.8rem;
}

.card-price {
  margin-top: 0.5rem;
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

.card-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.btn-view, .btn-edit, .btn-delete {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  font-size: 1rem;
  transition: all 0.2s;
  text-decoration: none;
}

.btn-view {
  background: #3498db;
  color: white;
}

.btn-edit {
  background: #f39c12;
  color: white;
}

.btn-delete {
  background: #e74c3c;
  color: white;
}

.btn-view:hover, .btn-edit:hover, .btn-delete:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--border-color);
  border-top-color: #2e7d32;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: var(--bg-primary);
  border-radius: 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .host-dashboard {
    padding: 1rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .section-actions {
    flex-direction: column;
  }
  
  .search-input, .sort-select {
    width: 100%;
  }
  
  .properties-grid {
    grid-template-columns: 1fr;
  }
}
</style>