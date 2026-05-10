<template>
  <div class="home-view">
    <!-- Hero Section con animación -->
    <section class="hero-section">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-icon">🌿</span>
          <span>Turismo sostenible</span>
        </div>
        <h1 class="hero-title">
          Descubre experiencias<br>
          <span class="gradient-text">auténticas en la naturaleza</span>
        </h1>
        <p class="hero-subtitle">
          Conectamos viajeros con alojamientos rurales, actividades ecológicas 
          y experiencias locales únicas en Colombia.
        </p>
        
        <!-- Búsqueda principal -->
        <div class="search-container">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              v-model="searchQuery" 
              type="text"
              placeholder="¿Dónde quieres ir? (Ej: Cartagena, Eje Cafetero, Sierra Nevada)"
              @keyup.enter="search"
              aria-label="Buscar destinos"
            />
            <button @click="search" class="search-btn" :disabled="!searchQuery.trim()">
              Explorar
              <span class="btn-arrow">→</span>
            </button>
          </div>
          
          <!-- Sugerencias rápidas -->
          <div class="search-suggestions">
            <span class="suggestion-label">Destinos populares:</span>
            <button 
              v-for="destino in destinosPopulares" 
              :key="destino"
              @click="searchQuery = destino; search()"
              class="suggestion-chip"
            >
              {{ destino }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Beneficios / Características -->
    <section class="features-section">
      <div class="section-container">
        <h2 class="section-title">
          Por qué elegir <span class="highlight">EcoTurismo</span>
        </h2>
        <div class="features-grid">
          <div v-for="feature in features" :key="feature.title" class="feature-card">
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Propiedades destacadas -->
    <section class="featured-section" v-if="featuredProperties.length > 0">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">
            Alojamientos <span class="highlight">destacados</span>
          </h2>
          <router-link to="/properties" class="view-all-link">
            Ver todos
            <span>→</span>
          </router-link>
        </div>
        
        <div class="properties-carousel">
          <button 
            class="carousel-btn prev" 
            @click="scrollCarousel(-1)"
            :disabled="carouselScroll === 0"
            aria-label="Anterior"
          >
            ‹
          </button>
          
          <div class="properties-grid" ref="carouselRef">
            <div 
              v-for="property in featuredProperties" 
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
          
          <button 
            class="carousel-btn next" 
            @click="scrollCarousel(1)"
            :disabled="carouselScroll >= maxScroll"
            aria-label="Siguiente"
          >
            ›
          </button>
        </div>
      </div>
    </section>

    <!-- Categorías -->
    <section class="categories-section">
      <div class="section-container">
        <h2 class="section-title">
          Explora por <span class="highlight">categoría</span>
        </h2>
        <div class="categories-grid">
          <div 
            v-for="categoria in categorias" 
            :key="categoria.name"
            class="category-card"
            @click="filterByCategory(categoria.type)"
          >
            <div class="category-icon">{{ categoria.icon }}</div>
            <h3>{{ categoria.name }}</h3>
            <p>{{ categoria.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonios -->
    <section class="testimonials-section">
      <div class="section-container">
        <h2 class="section-title">
          Lo que dicen nuestros <span class="highlight">viajeros</span>
        </h2>
        <div class="testimonials-grid">
          <div v-for="testimonio in testimonios" :key="testimonio.name" class="testimonial-card">
            <div class="testimonial-quote">"</div>
            <p class="testimonial-text">{{ testimonio.text }}</p>
            <div class="testimonial-author">
              <div class="author-avatar">{{ testimonio.avatar }}</div>
              <div>
                <div class="author-name">{{ testimonio.name }}</div>
                <div class="author-location">{{ testimonio.location }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Final -->
    <section class="cta-section">
      <div class="cta-container">
        <h2>¿Tienes un alojamiento rural?</h2>
        <p>Únete a nuestra comunidad y comparte la belleza de tu región con viajeros de todo el mundo.</p>
        <div class="cta-buttons">
          <router-link to="/register?role=anfitrion" class="btn btn-primary btn-large">
            Comienza a ganar
            <span>→</span>
          </router-link>
          <router-link to="/properties" class="btn btn-outline btn-large">
            Explorar alojamientos
          </router-link>
        </div>
      </div>
    </section>

    <!-- Modal vista rápida -->
    <div v-if="showQuickView" class="modal-overlay" @click.self="closeQuickView">
      <div class="modal-content">
        <button class="modal-close" @click="closeQuickView">✕</button>
        <div class="quick-view-container" v-if="selectedProperty">
          <img :src="getPropertyImage(selectedProperty)" :alt="selectedProperty.title" class="quick-view-image">
          <div class="quick-view-info">
            <h2>{{ selectedProperty.title }}</h2>
            <p class="quick-view-location">📍 {{ selectedProperty.location?.city }}, {{ selectedProperty.location?.department }}</p>
            <div class="quick-view-price">
              <span class="price-amount">${{ formatPrice(selectedProperty.pricePerNight) }}</span>
              <span class="price-period">/ noche</span>
            </div>
            <p class="quick-view-description">{{ selectedProperty.description?.substring(0, 150) }}...</p>
            <div class="quick-view-actions">
              <button @click="goToProperty(selectedProperty._id)" class="btn btn-primary">
                Ver detalles
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loadingFeatured" class="loading-skeleton">
      <div class="skeleton-card" v-for="i in 4" :key="i">
        <div class="skeleton-image"></div>
        <div class="skeleton-text"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { usePropertyStore } from '../stores/property';

const router = useRouter();
const propertyStore = usePropertyStore();

// Estado
const searchQuery = ref('');
const featuredProperties = ref<any[]>([]);
const loadingFeatured = ref(true);
const showQuickView = ref(false);
const selectedProperty = ref<any>(null);
const carouselRef = ref<HTMLElement | null>(null);
const carouselScroll = ref(0);
const maxScroll = ref(0);

// Datos estáticos
const destinosPopulares = [
  'Cartagena', 'Santa Marta', 'Medellín', 'Eje Cafetero', 'Villa de Leyva', 'Guatapé'
];

const features = [
  {
    icon: '🌿',
    title: 'Turismo Sostenible',
    description: 'Apoyamos prácticas responsables con el medio ambiente y las comunidades locales.'
  },
  {
    icon: '🏡',
    title: 'Experiencias Auténticas',
    description: 'Alojamientos únicos gestionados por anfitriones locales apasionados.'
  },
  {
    icon: '🔒',
    title: 'Reservas Seguras',
    description: 'Sistema de pagos protegido y atención al cliente 24/7.'
  },
  {
    icon: '⭐',
    title: 'Garantía de Calidad',
    description: 'Propiedades verificadas y reseñas de viajeros reales.'
  }
];

const categorias = [
  { icon: '🏠', name: 'Casa Rural', type: 'casa', description: 'Hogares acogedores en entornos naturales' },
  { icon: '🌲', name: 'Cabaña', type: 'cabaña', description: 'Refugios de madera rodeados de naturaleza' },
  { icon: '🏞️', name: 'Finca', type: 'finca', description: 'Grandes extensiones para reconectar con la tierra' },
  { icon: '⛺', name: 'Glamping', type: 'glamping', description: 'Lujo y comodidad en medio de la aventura' },
  { icon: '🏨', name: 'Hotel Rural', type: 'hotel_rural', description: 'Comodidad tradicional en entornos rurales' },
  { icon: '🦜', name: 'Eco Lodge', type: 'eco_lodge', description: 'Alojamiento sostenible con alto impacto ambiental' }
];

const testimonios = [
  {
    name: 'María González',
    location: 'Bogotá',
    avatar: '👩',
    text: 'Encontré una cabaña increíble en medio de la montaña. La experiencia fue mágica y el anfitrión muy atento.'
  },
  {
    name: 'Carlos López',
    location: 'Medellín',
    avatar: '👨',
    text: 'Plataforma fácil de usar, reservé una finca para celebrar mi cumpleaños con amigos. Todo perfecto.'
  },
  {
    name: 'Ana Rodríguez',
    location: 'Cali',
    avatar: '👩',
    text: 'Me encanta la variedad de opciones sostenibles. El sistema de reservas es seguro y sin complicaciones.'
  }
];

// Métodos
const search = () => {
  if (searchQuery.value.trim()) {
    router.push(`/properties?search=${encodeURIComponent(searchQuery.value)}`);
  }
};

const formatPrice = (price: number) => {
  return price.toLocaleString('es-CO');
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

// Configuración de URL base para imágenes
const API_BASE_URL = 'http://localhost:5000';

const getPropertyImage = (prop: any) => {
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

const goToProperty = (id: string) => {
  router.push(`/properties/${id}`);
};

const filterByCategory = (type: string) => {
  router.push(`/properties?type=${type}`);
};

const quickView = (property: any) => {
  selectedProperty.value = property;
  showQuickView.value = true;
};

const closeQuickView = () => {
  showQuickView.value = false;
  selectedProperty.value = null;
};

const scrollCarousel = (direction: number) => {
  if (carouselRef.value) {
    const cardWidth = carouselRef.value.children[0]?.clientWidth || 320;
    const scrollAmount = cardWidth + 24;
    const newScroll = carouselScroll.value + (direction * scrollAmount);
    
    carouselRef.value.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
    carouselScroll.value = newScroll;
  }
};

const updateScrollPosition = () => {
  if (carouselRef.value) {
    carouselScroll.value = carouselRef.value.scrollLeft;
    const max = carouselRef.value.scrollWidth - carouselRef.value.clientWidth;
    maxScroll.value = max;
  }
};

// Cargar propiedades destacadas
const loadFeaturedProperties = async () => {
  loadingFeatured.value = true;
  try {
    await propertyStore.fetchProperties({ limit: 8, sort: '-averageRating' });
    featuredProperties.value = propertyStore.properties.slice(0, 8);
  } catch (error) {
    console.error('Error loading featured properties:', error);
  } finally {
    loadingFeatured.value = false;
  }
};

onMounted(() => {
  loadFeaturedProperties();
  
  // Escuchar scroll del carousel
  nextTick(() => {
    if (carouselRef.value) {
      carouselRef.value.addEventListener('scroll', updateScrollPosition);
    }
  });
});
</script>

<style scoped>
.home-view {
  overflow-x: hidden;
}

/* Hero Section */
.hero-section {
  position: relative;
  background: linear-gradient(135deg, #1a5f2a 0%, #0d3b1a 100%);
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  overflow: hidden;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(0,0,0,0.2)" fill-opacity="0.3" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path></svg>') bottom no-repeat;
  background-size: cover;
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 900px;
  padding: 4rem 2rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 0.875rem;
  margin-bottom: 2rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

.gradient-text {
  background: linear-gradient(135deg, #fff, #a5d6a7);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 2.5rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* Search Box */
.search-container {
  max-width: 700px;
  margin: 0 auto;
}

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 60px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}

.search-box:focus-within {
  transform: scale(1.02);
  box-shadow: 0 12px 40px rgba(0,0,0,0.3);
}

.search-icon {
  padding: 0 1rem;
  font-size: 1.2rem;
  color: #666;
}

.search-box input {
  flex: 1;
  border: none;
  padding: 1rem 0;
  font-size: 1rem;
  outline: none;
  background: transparent;
  color: #333;
}

.search-box input::placeholder {
  color: #999;
}

.search-btn {
  background: #2e7d32;
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-btn:hover:not(:disabled) {
  background: #1b5e20;
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-arrow {
  transition: transform 0.2s;
}

.search-btn:hover .btn-arrow {
  transform: translateX(4px);
}

/* Search Suggestions */
.search-suggestions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.suggestion-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

.suggestion-chip {
  background: rgba(255,255,255,0.15);
  border: none;
  padding: 6px 14px;
  border-radius: 100px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.suggestion-chip:hover {
  background: rgba(255,255,255,0.3);
  transform: translateY(-2px);
}

/* Section Container */
.section-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 4rem 2rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  color: var(--text-primary);
}

.highlight {
  color: #2e7d32;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.view-all-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2e7d32;
  text-decoration: none;
  font-weight: 500;
  transition: gap 0.2s;
}

.view-all-link:hover {
  gap: 12px;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  background: var(--bg-primary);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.feature-card p {
  color: var(--text-secondary);
  line-height: 1.5;
}

/* Properties Carousel */
.properties-carousel {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.carousel-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e0e0e0;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.carousel-btn:hover:not(:disabled) {
  background: #2e7d32;
  color: white;
  border-color: #2e7d32;
}

.carousel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.properties-grid {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  padding: 0.5rem 0;
  flex: 1;
}

.properties-grid::-webkit-scrollbar {
  height: 6px;
}

.properties-grid::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 10px;
}

.properties-grid::-webkit-scrollbar-thumb {
  background: #2e7d32;
  border-radius: 10px;
}

.property-card {
  min-width: 300px;
  flex-shrink: 0;
  background: var(--bg-primary);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
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
  background: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  width: 100%;
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
  font-size: 0.875rem;
}

.card-location {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-amount {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2e7d32;
}

.price-period {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.card-type {
  font-size: 0.75rem;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 20px;
}

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
}

.category-card {
  text-align: center;
  padding: 1.5rem;
  background: var(--bg-primary);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-card:hover {
  transform: translateY(-4px);
  background: #2e7d32;
  color: white;
}

.category-card:hover .category-icon {
  transform: scale(1.1);
}

.category-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  transition: transform 0.2s;
}

.category-card h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.category-card p {
  font-size: 0.8rem;
  opacity: 0.8;
}

/* Testimonials */
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.testimonial-card {
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 2rem;
  position: relative;
}

.testimonial-quote {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 4rem;
  color: #2e7d32;
  opacity: 0.2;
  font-family: serif;
}

.testimonial-text {
  font-style: italic;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  width: 48px;
  height: 48px;
  background: #e8f5e9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.author-name {
  font-weight: 600;
  color: var(--text-primary);
}

.author-location {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* CTA Section */
.cta-section {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  margin: 4rem 2rem;
  border-radius: 32px;
  color: white;
}

.cta-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 4rem 2rem;
  text-align: center;
}

.cta-container h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.cta-container p {
  margin-bottom: 2rem;
  opacity: 0.9;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.75rem 1.5rem;
  border-radius: 40px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: white;
  color: #2e7d32;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}

.btn-outline {
  border: 2px solid white;
  color: white;
  background: transparent;
}

.btn-outline:hover {
  background: white;
  color: #2e7d32;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
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

.quick-view-location {
  color: var(--text-secondary);
  margin: 0.5rem 0;
}

.quick-view-price {
  margin: 1rem 0;
}

.quick-view-description {
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 1rem 0;
}

/* Loading Skeleton */
.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 4rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.skeleton-card {
  background: var(--bg-primary);
  border-radius: 16px;
  overflow: hidden;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-image {
  height: 220px;
  background: #e0e0e0;
}

.skeleton-text {
  height: 80px;
  background: #e0e0e0;
  margin: 1rem;
  border-radius: 8px;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .search-box {
    flex-direction: column;
    border-radius: 20px;
  }
  
  .search-icon {
    display: none;
  }
  
  .search-box input {
    padding: 1rem;
    width: 100%;
  }
  
  .search-btn {
    justify-content: center;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .cta-section {
    margin: 2rem 1rem;
  }
  
  .cta-container {
    padding: 2rem 1rem;
  }
  
  .cta-container h2 {
    font-size: 1.5rem;
  }
}
</style>