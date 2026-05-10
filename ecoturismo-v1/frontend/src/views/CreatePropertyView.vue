<template>
  <div class="create-property">
    <div class="form-container">
      <!-- Header con progreso -->
      <div class="form-header">
        <h1>{{ isEdit ? '✏️ Editar Propiedad' : '🏠 Publicar Nueva Propiedad' }}</h1>
        <p class="subtitle">
          {{ isEdit ? 'Actualiza la información de tu alojamiento' : 'Completa los detalles para comenzar a recibir reservas' }}
        </p>
        
        <!-- Progress Steps -->
        <div class="progress-steps">
          <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
            <span class="step-number">1</span>
            <span class="step-label">Información</span>
          </div>
          <div class="step-line" :class="{ active: currentStep > 1 }"></div>
          <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
            <span class="step-number">2</span>
            <span class="step-label">Ubicación</span>
          </div>
          <div class="step-line" :class="{ active: currentStep > 2 }"></div>
          <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
            <span class="step-number">3</span>
            <span class="step-label">Espacios</span>
          </div>
          <div class="step-line" :class="{ active: currentStep > 3 }"></div>
          <div class="step" :class="{ active: currentStep >= 4 }">
            <span class="step-number">4</span>
            <span class="step-label">Finalizar</span>
          </div>
        </div>
      </div>

      <form @submit.prevent="submitForm">
        <!-- Paso 1: Información básica -->
        <div v-show="currentStep === 1" class="step-content">
          <section class="form-section">
            <h2>
              <span class="section-icon">📝</span>
              Información básica
            </h2>
            
            <div class="form-group">
              <label class="form-label required">Título de la propiedad</label>
              <div class="input-wrapper">
                <span class="input-icon">🏷️</span>
                <input 
                  v-model="form.title" 
                  type="text" 
                  required
                  placeholder="Ej: Hermosa cabaña en medio de la naturaleza"
                  :class="{ 'error': errors.title }"
                  @blur="validateTitle"
                />
              </div>
              <div class="field-hint">Elige un título descriptivo que atraiga a los viajeros</div>
              <div v-if="errors.title" class="error-message">{{ errors.title }}</div>
            </div>
            
            <div class="form-group">
              <label class="form-label required">Descripción</label>
              <div class="input-wrapper">
                <textarea 
                  v-model="form.description" 
                  rows="5" 
                  required
                  placeholder="Describe tu propiedad, los alrededores, actividades cercanas..."
                  :class="{ 'error': errors.description }"
                  @blur="validateDescription"
                ></textarea>
              </div>
              <div class="field-hint">{{ form.description.length }}/5000 caracteres</div>
              <div v-if="errors.description" class="error-message">{{ errors.description }}</div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">Tipo de propiedad</label>
                <div class="input-wrapper">
                  <select v-model="form.type" required>
                    <option value="">Selecciona...</option>
                    <option value="casa">🏠 Casa</option>
                    <option value="cabaña">🌲 Cabaña</option>
                    <option value="finca">🏞️ Finca</option>
                    <option value="glamping">⛺ Glamping</option>
                    <option value="hotel_rural">🏨 Hotel Rural</option>
                    <option value="eco_lodge">🦜 Eco Lodge</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label required">Precio por noche (COP)</label>
                <div class="input-wrapper">
                  <span class="input-icon">💰</span>
                  <input 
                    v-model.number="form.pricePerNight" 
                    type="number" 
                    required 
                    min="0"
                    :class="{ 'error': errors.price }"
                    @blur="validatePrice"
                  />
                </div>
                <div v-if="errors.price" class="error-message">{{ errors.price }}</div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Precio por semana (opcional)</label>
              <div class="input-wrapper">
                <span class="input-icon">📅</span>
                <input v-model.number="form.pricePerWeek" type="number" min="0" placeholder="Descuento para estadías semanales">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Descuento (%)</label>
              <div class="input-wrapper">
                <span class="input-icon">🔥</span>
                <input v-model.number="form.discountPercent" type="number" min="0" max="100" placeholder="Ej: 15">
              </div>
            </div>
          </section>
        </div>

        <!-- Paso 2: Ubicación -->
        <div v-show="currentStep === 2" class="step-content">
          <section class="form-section">
            <h2>
              <span class="section-icon">📍</span>
              Ubicación
            </h2>
            
            <div class="form-group">
              <label class="form-label required">Dirección</label>
              <div class="input-wrapper">
                <span class="input-icon">📌</span>
                <input v-model="form.location.address" type="text" required>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">Ciudad</label>
                <div class="input-wrapper">
                  <span class="input-icon">🏙️</span>
                  <input v-model="form.location.city" type="text" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label required">Departamento</label>
                <div class="input-wrapper">
                  <span class="input-icon">🗺️</span>
                  <input v-model="form.location.department" type="text" required>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label required">Ubicación en el mapa</label>
              <div id="map" class="map"></div>
              <div v-if="selectedLocation" class="location-info">
                📍 Lat: {{ selectedLocation.lat.toFixed(6) }}, Lng: {{ selectedLocation.lng.toFixed(6) }}
              </div>
              <div v-if="errors.location" class="error-message">{{ errors.location }}</div>
            </div>
          </section>
        </div>

        <!-- Paso 3: Capacidad y espacios -->
        <div v-show="currentStep === 3" class="step-content">
          <section class="form-section">
            <h2>
              <span class="section-icon">👥</span>
              Capacidad y espacios
            </h2>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">Habitaciones</label>
                <div class="input-wrapper">
                  <span class="input-icon">🛏️</span>
                  <input v-model.number="form.bedrooms" type="number" required min="1">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label required">Baños</label>
                <div class="input-wrapper">
                  <span class="input-icon">🚽</span>
                  <input v-model.number="form.bathrooms" type="number" required min="1">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label required">Área (m²)</label>
                <div class="input-wrapper">
                  <span class="input-icon">📏</span>
                  <input v-model.number="form.area" type="number" required min="10">
                </div>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">Adultos</label>
                <div class="input-wrapper">
                  <span class="input-icon">👨</span>
                  <input v-model.number="form.capacity.adults" type="number" required min="1">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Niños</label>
                <div class="input-wrapper">
                  <span class="input-icon">👧</span>
                  <input v-model.number="form.capacity.children" type="number" min="0">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Camas extra</label>
                <div class="input-wrapper">
                  <span class="input-icon">➕</span>
                  <input v-model.number="form.capacity.extraBeds" type="number" min="0">
                </div>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Check-in</label>
                <div class="input-wrapper">
                  <span class="input-icon">⏰</span>
                  <input v-model="form.checkInTime" type="time">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Check-out</label>
                <div class="input-wrapper">
                  <span class="input-icon">⏰</span>
                  <input v-model="form.checkOutTime" type="time">
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <h2>
              <span class="section-icon">✨</span>
              Amenidades
            </h2>
            
            <div class="checkbox-group">
              <label v-for="amenity in amenitiesList" :key="amenity.value" class="checkbox-card">
                <input type="checkbox" :value="amenity.value" v-model="form.amenities">
                <span class="checkbox-icon">{{ amenity.icon }}</span>
                <span class="checkbox-label">{{ amenity.label }}</span>
              </label>
            </div>
          </section>

          <section class="form-section">
            <h2>
              <span class="section-icon">📋</span>
              Reglas de la casa
            </h2>
            
            <div class="checkbox-group">
              <label v-for="rule in rulesList" :key="rule.value" class="checkbox-card">
                <input type="checkbox" :value="rule.value" v-model="form.rules">
                <span class="checkbox-icon">{{ rule.icon }}</span>
                <span class="checkbox-label">{{ rule.label }}</span>
              </label>
            </div>
          </section>
        </div>

        <!-- Paso 4: Imágenes y finalizar -->
        <div v-show="currentStep === 4" class="step-content">
          <section class="form-section">
            <h2>
              <span class="section-icon">🖼️</span>
              Imágenes
            </h2>
            
            <div class="image-upload">
              <div class="upload-area" @click="triggerFileInput" :class="{ 'has-images': uploadedImages.length > 0 }">
                <input 
                  ref="fileInput"
                  type="file" 
                  multiple 
                  accept="image/*"
                  @change="handleImageUpload"
                  style="display: none"
                >
                <div class="upload-placeholder">
                  <div class="upload-icon">📸</div>
                  <span>Click para seleccionar imágenes</span>
                  <small>Máximo 10 imágenes, 5MB cada una</small>
                </div>
              </div>
              
              <div class="image-preview">
                <div v-for="(img, index) in uploadedImages" :key="index" class="preview-item">
                  <img :src="img.preview" :alt="`Imagen ${index + 1}`">
                  <button type="button" class="remove-image" @click="removeImage(index)">✖</button>
                  <div class="main-badge" v-if="uploadedImages.length > 1">
                    <input 
                      type="radio" 
                      name="mainImage"
                      :checked="img.isMain"
                      @change="setMainImage(index)"
                    >
                    <span>Principal</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div class="form-summary">
            <h3>Resumen de la propiedad</h3>
            <ul>
              <li><strong>Título:</strong> {{ form.title || 'No especificado' }}</li>
              <li><strong>Tipo:</strong> {{ getTypeLabel(form.type) }}</li>
              <li><strong>Ubicación:</strong> {{ form.location.city }}, {{ form.location.department }}</li>
              <li><strong>Precio:</strong> ${{ formatPrice(form.pricePerNight) }}/noche</li>
              <li><strong>Habitaciones:</strong> {{ form.bedrooms }} | <strong>Baños:</strong> {{ form.bathrooms }}</li>
              <li><strong>Imágenes:</strong> {{ uploadedImages.length }} seleccionadas</li>
            </ul>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="form-navigation">
          <button 
            v-if="currentStep > 1" 
            type="button" 
            class="btn-prev" 
            @click="prevStep"
          >
            ← Anterior
          </button>
          <button 
            v-if="currentStep < 4" 
            type="button" 
            class="btn-next" 
            @click="nextStep"
            :disabled="!canProceed"
          >
            Siguiente →
          </button>
          <button 
            v-if="currentStep === 4" 
            type="submit" 
            class="btn-submit" 
            :disabled="loading || !isValid"
          >
            <span v-if="loading" class="loader"></span>
            {{ loading ? 'Publicando...' : (isEdit ? 'Actualizar propiedad' : 'Publicar propiedad') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePropertyStore } from '../stores/property';
import axiosInstance from '../utils/axios.config';
import L from 'leaflet';

const route = useRoute();
const router = useRouter();
const propertyStore = usePropertyStore();

const isEdit = ref(route.params.id !== undefined);
const loading = ref(false);
const currentStep = ref(1);
const fileInput = ref<HTMLInputElement>();

// Formulario
const form = reactive({
  title: '',
  description: '',
  type: '',
  pricePerNight: 0,
  pricePerWeek: null as number | null,
  discountPercent: null as number | null,
  location: {
    coordinates: [0, 0] as [number, number],
    address: '',
    city: '',
    department: '',
    country: 'Colombia'
  },
  bedrooms: 1,
  bathrooms: 1,
  area: 50,
  capacity: {
    adults: 2,
    children: 0,
    extraBeds: 0
  },
  amenities: [] as string[],
  rules: [] as string[],
  checkInTime: '15:00',
  checkOutTime: '11:00'
});

// Validaciones
const errors = reactive({
  title: '',
  description: '',
  price: '',
  location: ''
});

// Imágenes
const uploadedImages = ref<Array<{
  file: File;
  preview: string;
  isMain: boolean;
}>>([]);

// Computed
const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return form.title && form.description && form.type && form.pricePerNight > 0 && !errors.title && !errors.description;
  }
  if (currentStep.value === 2) {
    return form.location.address && form.location.city && form.location.department && selectedLocation.value && !errors.location;
  }
  if (currentStep.value === 3) {
    return form.bedrooms > 0 && form.bathrooms > 0 && form.area >= 10 && form.capacity.adults > 0;
  }
  return true;
});

const isValid = computed(() => {
  return form.title && form.description && form.type && form.pricePerNight > 0 && selectedLocation.value;
});

// Listas de opciones
const amenitiesList = [
  { value: 'wifi', label: 'WiFi', icon: '📶' },
  { value: 'parking', label: 'Parqueadero', icon: '🅿️' },
  { value: 'piscina', label: 'Piscina', icon: '🏊' },
  { value: 'cocina', label: 'Cocina', icon: '🍳' },
  { value: 'aire_acondicionado', label: 'Aire acondicionado', icon: '❄️' },
  { value: 'calefaccion', label: 'Calefacción', icon: '🔥' },
  { value: 'tv', label: 'TV', icon: '📺' },
  { value: 'jacuzzi', label: 'Jacuzzi', icon: '🛁' },
  { value: 'barbacoa', label: 'Barbacoa', icon: '🔥' },
  { value: 'mascotas_permitidas', label: 'Mascotas permitidas', icon: '🐕' },
  { value: 'vista_montana', label: 'Vista a la montaña', icon: '🏔️' },
  { value: 'chimenea', label: 'Chimenea', icon: '🪵' },
  { value: 'hamaca', label: 'Hamaca', icon: '🌴' },
  { value: 'senderismo', label: 'Senderismo', icon: '🥾' },
  { value: 'desayuno_incluido', label: 'Desayuno incluido', icon: '🍳' }
];

const rulesList = [
  { value: 'no_fumar', label: '🚭 No fumar', icon: '🚭' },
  { value: 'no_mascotas', label: '🐕 No mascotas', icon: '🐕' },
  { value: 'no_fiestas', label: '🎉 No fiestas', icon: '🎉' },
  { value: 'horario_silencio', label: '🔇 Horario de silencio', icon: '🔇' },
  { value: 'cuidar_agua', label: '💧 Cuidar el agua', icon: '💧' },
  { value: 'reciclar', label: '♻️ Reciclar', icon: '♻️' }
];

let map: L.Map;
let marker: L.Marker;
const selectedLocation = ref<{ lat: number; lng: number } | null>(null);

// Validaciones
const validateTitle = () => {
  if (!form.title) {
    errors.title = 'El título es requerido';
  } else if (form.title.length < 5) {
    errors.title = 'El título debe tener al menos 5 caracteres';
  } else if (form.title.length > 100) {
    errors.title = 'El título no puede exceder 100 caracteres';
  } else {
    errors.title = '';
  }
};

const validateDescription = () => {
  if (!form.description) {
    errors.description = 'La descripción es requerida';
  } else if (form.description.length < 20) {
    errors.description = 'La descripción debe tener al menos 20 caracteres';
  } else {
    errors.description = '';
  }
};

const validatePrice = () => {
  if (form.pricePerNight <= 0) {
    errors.price = 'El precio debe ser mayor a 0';
  } else {
    errors.price = '';
  }
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

const nextStep = () => {
  if (canProceed.value && currentStep.value < 4) {
    currentStep.value++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Mapa
const initMap = () => {
  map = L.map('map').setView([4.5709, -74.2973], 6);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
  }).addTo(map);
  
  map.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    selectedLocation.value = { lat, lng };
    form.location.coordinates = [lng, lat];
    errors.location = '';
    
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`📍 ${form.location.city || 'Ubicación seleccionada'}`).openPopup();
  });
};

// Imágenes
const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  
  if (uploadedImages.value.length + files.length > 10) {
    alert('Máximo 10 imágenes');
    return;
  }
  
  files.forEach(file => {
    if (file.size > 5 * 1024 * 1024) {
      alert(`La imagen ${file.name} excede 5MB`);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImages.value.push({
        file,
        preview: e.target?.result as string,
        isMain: uploadedImages.value.length === 0
      });
    };
    reader.readAsDataURL(file);
  });
  
  input.value = '';
};

const removeImage = (index: number) => {
  uploadedImages.value.splice(index, 1);
  if (uploadedImages.value.length > 0 && !uploadedImages.value.some(img => img.isMain)) {
    uploadedImages.value[0].isMain = true;
  }
};

const setMainImage = (index: number) => {
  uploadedImages.value.forEach((img, i) => {
    img.isMain = i === index;
  });
};

const loadPropertyData = async () => {
  const id = route.params.id as string;
  await propertyStore.fetchPropertyById(id);
  const property = propertyStore.currentProperty;
  
  if (property) {
    form.title = property.title;
    form.description = property.description;
    form.type = property.type;
    form.pricePerNight = property.pricePerNight;
    form.location = property.location;
    form.bedrooms = property.bedrooms;
    form.bathrooms = property.bathrooms;
    form.area = property.area;
    form.capacity = property.capacity;
    form.amenities = property.amenities;
    form.rules = property.rules;
    form.checkInTime = property.checkInTime;
    form.checkOutTime = property.checkOutTime;
    
    selectedLocation.value = {
      lat: property.location.coordinates[1],
      lng: property.location.coordinates[0]
    };
    
    if (marker && map) {
      marker.setLatLng([selectedLocation.value.lat, selectedLocation.value.lng]);
      map.setView([selectedLocation.value.lat, selectedLocation.value.lng], 13);
      marker.bindPopup(`📍 ${form.location.city || 'Ubicación seleccionada'}`).openPopup();
    }
  }
};

const submitForm = async () => {
  if (!selectedLocation.value) {
    errors.location = 'Por favor selecciona una ubicación en el mapa';
    currentStep.value = 2;
    return;
  }
  
  loading.value = true;
  
  try {
    let propertyId: string;
    
    if (isEdit.value) {
      const id = route.params.id as string;
      await propertyStore.updateProperty(id, form);
      propertyId = id;
    } else {
      const response = await propertyStore.createProperty(form);
      propertyId = response.property._id;
    }
    
    if (uploadedImages.value.length > 0) {
      const formData = new FormData();
      const sortedImages = [...uploadedImages.value].sort((a, b) => {
        if (a.isMain && !b.isMain) return -1;
        if (!a.isMain && b.isMain) return 1;
        return 0;
      });
      
      sortedImages.forEach(img => {
        formData.append('images', img.file);
      });
      
      await axiosInstance.post(`/properties/${propertyId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    
    router.push(`/properties/${propertyId}`);
  } catch (error: any) {
    console.error('Error al guardar:', error);
    alert(error.response?.data?.error || 'Error al guardar la propiedad');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  initMap();
  if (isEdit.value) {
    loadPropertyData();
  }
});

onUnmounted(() => {
  if (map) map.remove();
});
</script>

<style scoped>
.create-property {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.form-container {
  background: var(--bg-primary);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

/* Header */
.form-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.form-header h1 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.subtitle {
  color: var(--text-secondary);
}

/* Progress Steps */
.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.step-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.3s;
}

.step.active .step-number {
  background: #2e7d32;
  color: white;
}

.step.completed .step-number {
  background: #2e7d32;
  color: white;
  position: relative;
}

.step.completed .step-number::after {
  content: '✓';
  position: absolute;
}

.step-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.step.active .step-label {
  color: #2e7d32;
  font-weight: 600;
}

.step-line {
  width: 60px;
  height: 2px;
  background: var(--bg-secondary);
  margin: 0 0.5rem;
  margin-bottom: 1.5rem;
}

.step-line.active {
  background: #2e7d32;
}

/* Section */
.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.form-section h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.section-icon {
  font-size: 1.3rem;
}

/* Form Groups */
.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.form-label.required::after {
  content: '*';
  color: #e74c3c;
  margin-left: 4px;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
}

.input-wrapper input, 
.input-wrapper select, 
.input-wrapper textarea {
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 2.5rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.2s;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.input-wrapper textarea {
  padding-top: 0.8rem;
  resize: vertical;
}

.input-wrapper input:focus, 
.input-wrapper select:focus, 
.input-wrapper textarea:focus {
  outline: none;
  border-color: #2e7d32;
}

.input-wrapper input.error, 
.input-wrapper textarea.error {
  border-color: #e74c3c;
}

.field-hint {
  margin-top: 0.25rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.error-message {
  margin-top: 0.25rem;
  font-size: 0.7rem;
  color: #e74c3c;
}

/* Form Row */
.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

/* Checkbox Group */
.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}

.checkbox-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.checkbox-card:hover {
  background: #e8f5e9;
}

.checkbox-card input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-icon {
  font-size: 1.1rem;
}

.checkbox-label {
  font-size: 0.85rem;
  color: var(--text-primary);
}

/* Map */
.map {
  height: 400px;
  border-radius: 12px;
  margin-top: 0.5rem;
  cursor: crosshair;
  z-index: 1;
}

.location-info {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #e8f5e9;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #2e7d32;
}

/* Image Upload */
.image-upload {
  margin-top: 1rem;
}

.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #2e7d32;
  background: #e8f5e9;
}

.upload-area.has-images {
  padding: 1rem;
}

.upload-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.upload-placeholder small {
  color: var(--text-secondary);
}

.image-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-secondary);
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-badge {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Form Summary */
.form-summary {
  background: #e8f5e9;
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.form-summary h3 {
  margin-bottom: 1rem;
  color: #2e7d32;
}

.form-summary ul {
  list-style: none;
  padding: 0;
}

.form-summary li {
  padding: 0.25rem 0;
  font-size: 0.85rem;
}

/* Navigation Buttons */
.form-navigation {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn-prev, .btn-next, .btn-submit {
  padding: 0.75rem 2rem;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-prev {
  background: var(--bg-secondary);
  border: none;
  color: var(--text-primary);
}

.btn-prev:hover {
  background: var(--border-color);
}

.btn-next, .btn-submit {
  background: #2e7d32;
  border: none;
  color: white;
}

.btn-next:hover, .btn-submit:hover:not(:disabled) {
  background: #1b5e20;
  transform: translateY(-2px);
}

.btn-next:disabled, .btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loader {
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .form-container {
    padding: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .progress-steps {
    display: none;
  }
  
  .checkbox-group {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .form-navigation {
    flex-direction: column;
  }
  
  .btn-prev, .btn-next, .btn-submit {
    width: 100%;
  }
}
</style>