<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- Header con información principal -->
      <div class="profile-header">
        <div class="profile-avatar-section">
          <div class="avatar-wrapper">
            <img :src="userAvatar" :alt="authStore.user?.name" class="avatar">
            <button class="avatar-edit-btn" @click="openAvatarModal" title="Cambiar foto de perfil">
              📷
            </button>
          </div>
          <h1>{{ authStore.user?.name }}</h1>
          <div class="user-badge" :class="userRoleClass">
            <span class="role-icon">{{ userRoleIcon }}</span>
            <span>{{ userRoleName }}</span>
          </div>
          <p class="member-since">Miembro desde {{ formatDate(authStore.user?.createdAt) }}</p>
        </div>
      </div>

      <!-- Tabs de navegación -->
      <div class="profile-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Contenido de los tabs -->
      <div class="profile-content">
        <!-- Tab: Información personal -->
        <div v-show="activeTab === 'info'" class="tab-pane">
          <div class="info-card">
            <div class="card-header">
              <h3>📋 Información personal</h3>
              <button @click="openEditModal" class="edit-btn">
                ✏️ Editar perfil
              </button>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">📧 Correo electrónico</span>
                <span class="info-value">{{ authStore.user?.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📱 Teléfono</span>
                <span class="info-value">{{ authStore.user?.phone || 'No especificado' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">👤 Nombre completo</span>
                <span class="info-value">{{ authStore.user?.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">🏷️ Tipo de cuenta</span>
                <span class="info-value">{{ userRoleName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📅 Fecha de registro</span>
                <span class="info-value">{{ formatFullDate(authStore.user?.createdAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">🆔 ID de usuario</span>
                <span class="info-value">{{ authStore.user?._id?.slice(-8) }}</span>
              </div>
            </div>
          </div>

          <div class="stats-card">
            <h3>📊 Estadísticas de actividad</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">{{ userStats.reviews }}</span>
                <span class="stat-label">Reseñas escritas</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ userStats.bookings }}</span>
                <span class="stat-label">Reservas realizadas</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ userStats.helpful }}</span>
                <span class="stat-label">👍 Útiles recibidos</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ userStats.properties }}</span>
                <span class="stat-label">Propiedades</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Seguridad -->
        <div v-show="activeTab === 'security'" class="tab-pane">
          <div class="security-card">
            <h3>🔒 Cambiar contraseña</h3>
            <form @submit.prevent="changePassword" class="password-form">
              <div class="form-group">
                <label>Contraseña actual</label>
                <div class="password-input-wrapper">
                  <input 
                    :type="showCurrentPassword ? 'text' : 'password'"
                    v-model="passwordForm.currentPassword"
                    required
                    placeholder="Ingresa tu contraseña actual"
                  >
                  <button type="button" class="toggle-password" @click="showCurrentPassword = !showCurrentPassword">
                    {{ showCurrentPassword ? '👁️' : '👁️‍🗨️' }}
                  </button>
                </div>
              </div>
              
              <div class="form-group">
                <label>Nueva contraseña</label>
                <div class="password-input-wrapper">
                  <input 
                    :type="showNewPassword ? 'text' : 'password'"
                    v-model="passwordForm.newPassword"
                    required
                    placeholder="Mínimo 6 caracteres"
                    @input="validateNewPassword"
                  >
                  <button type="button" class="toggle-password" @click="showNewPassword = !showNewPassword">
                    {{ showNewPassword ? '👁️' : '👁️‍🗨️' }}
                  </button>
                </div>
                <div class="password-strength" v-if="passwordForm.newPassword">
                  <div class="strength-bars">
                    <div 
                      v-for="i in 4" 
                      :key="i"
                      class="strength-bar"
                      :class="{ active: i <= passwordStrength.level }"
                    ></div>
                  </div>
                  <span class="strength-text">{{ passwordStrength.text }}</span>
                </div>
              </div>
              
              <div class="form-group">
                <label>Confirmar nueva contraseña</label>
                <div class="password-input-wrapper">
                  <input 
                    :type="showConfirmPassword ? 'text' : 'password'"
                    v-model="passwordForm.confirmPassword"
                    required
                    placeholder="Repite tu nueva contraseña"
                  >
                  <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
                    {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
                  </button>
                </div>
                <div v-if="passwordError" class="error-message">
                  {{ passwordError }}
                </div>
              </div>
              
              <button type="submit" class="btn-change-password" :disabled="changingPassword">
                {{ changingPassword ? 'Actualizando...' : 'Actualizar contraseña' }}
              </button>
            </form>
          </div>

          <div class="session-card">
            <h3>🌐 Sesiones activas</h3>
            <div class="session-info">
              <div class="session-item">
                <span class="session-icon">💻</span>
                <div>
                  <strong>Esta sesión</strong>
                  <span class="session-detail">Dispositivo actual</span>
                </div>
                <span class="session-badge active">Activa</span>
              </div>
            </div>
            <button class="btn-logout-all" @click="logoutAllDevices">
              Cerrar sesión en todos los dispositivos
            </button>
          </div>
        </div>

        <!-- Tab: Preferencias -->
        <div v-show="activeTab === 'preferences'" class="tab-pane">
          <div class="preferences-card">
            <h3>🎨 Apariencia</h3>
            <div class="preference-item">
              <span>🌙 Modo oscuro</span>
              <label class="toggle-switch">
                <input type="checkbox" v-model="darkModePreference" @change="toggleDarkMode">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="preferences-card">
            <h3>🔔 Notificaciones</h3>
            <div class="preference-item">
              <span>📧 Notificaciones por email</span>
              <label class="toggle-switch">
                <input type="checkbox" v-model="emailNotifications">
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="preference-item">
              <span>💬 Recordatorios de reservas</span>
              <label class="toggle-switch">
                <input type="checkbox" v-model="bookingReminders">
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="preference-item">
              <span>⭐ Ofertas y promociones</span>
              <label class="toggle-switch">
                <input type="checkbox" v-model="promotions">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de edición de perfil -->
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>✏️ Editar perfil</h2>
            <button class="modal-close" @click="closeEditModal">✕</button>
          </div>
          
          <form @submit.prevent="updateProfile">
            <div class="form-group">
              <label>Nombre completo</label>
              <input v-model="editForm.name" type="text" required>
            </div>
            
            <div class="form-group">
              <label>Teléfono</label>
              <input v-model="editForm.phone" type="tel" placeholder="+57 300 123 4567">
            </div>
            
            <div class="form-group">
              <label>Email</label>
              <input v-model="editForm.email" type="email" required disabled>
              <small class="field-hint">El email no se puede cambiar</small>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeEditModal" class="btn-cancel">Cancelar</button>
              <button type="submit" :disabled="updatingProfile" class="btn-submit">
                {{ updatingProfile ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de cambio de avatar -->
      <div v-if="showAvatarModal" class="modal-overlay" @click.self="closeAvatarModal">
        <div class="modal-content avatar-modal">
          <div class="modal-header">
            <h2>📷 Cambiar foto de perfil</h2>
            <button class="modal-close" @click="closeAvatarModal">✕</button>
          </div>
          
          <div class="avatar-preview">
            <img :src="avatarPreview" alt="Preview" class="preview-image">
          </div>
          
          <div class="avatar-options">
            <div class="avatar-option" @click="generateRandomAvatar">
              <span class="option-icon">🎲</span>
              <span>Aleatorio</span>
            </div>
            <div class="avatar-option" @click="uploadAvatar">
              <span class="option-icon">📁</span>
              <span>Subir foto</span>
            </div>
            <input type="file" ref="avatarInput" accept="image/*" style="display: none" @change="handleAvatarUpload">
          </div>
          
          <div class="modal-actions">
            <button @click="closeAvatarModal" class="btn-cancel">Cancelar</button>
            <button @click="saveAvatar" class="btn-submit">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useBookingStore } from '../stores/booking';
import { useReviewStore } from '../stores/review';
import { usePropertyStore } from '../stores/property';

const router = useRouter();
const authStore = useAuthStore();
const bookingStore = useBookingStore();
const reviewStore = useReviewStore();
const propertyStore = usePropertyStore();

// Estado del tab
const activeTab = ref('info');

// Estado de edición
const showEditModal = ref(false);
const showAvatarModal = ref(false);
const updatingProfile = ref(false);
const changingPassword = ref(false);

// Estado de contraseña
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const passwordError = ref('');

// Formularios
const editForm = ref({
  name: '',
  phone: '',
  email: ''
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// Avatar
const avatarInput = ref<HTMLInputElement>();
const avatarPreview = ref('');
const newAvatar = ref<File | null>(null);

// Preferencias
const darkModePreference = ref(false);
const emailNotifications = ref(true);
const bookingReminders = ref(true);
const promotions = ref(false);

// Estadísticas del usuario
const userStats = ref({
  reviews: 0,
  bookings: 0,
  helpful: 0,
  properties: 0
});

// Computed
const userRoleName = computed(() => {
  const roles: Record<string, string> = {
    turista: 'Viajero',
    anfitrion: 'Anfitrión',
    admin: 'Administrador',
    negocio_local: 'Negocio Local'
  };
  return roles[authStore.user?.role || 'turista'];
});

const userRoleIcon = computed(() => {
  const icons: Record<string, string> = {
    turista: '🌍',
    anfitrion: '🏠',
    admin: '👑',
    negocio_local: '🏪'
  };
  return icons[authStore.user?.role || 'turista'];
});

const userRoleClass = computed(() => {
  return authStore.user?.role || 'turista';
});

const userAvatar = computed(() => {
  return authStore.user?.avatar || `https://ui-avatars.com/api/?background=2e7d32&color=fff&name=${authStore.user?.name?.charAt(0) || 'U'}`;
});

const passwordStrength = computed(() => {
  const pwd = passwordForm.value.newPassword;
  if (!pwd) return { level: 0, text: '' };
  
  let strength = 0;
  if (pwd.length >= 8) strength++;
  if (pwd.match(/[a-z]/) && pwd.match(/[A-Z]/)) strength++;
  if (pwd.match(/\d/)) strength++;
  if (pwd.match(/[^a-zA-Z\d]/)) strength++;
  
  const levels = ['', 'Débil', 'Básica', 'Buena', 'Fuerte'];
  const texts = ['', 'Agrega más caracteres', 'Añade números y mayúsculas', 'Muy bien', 'Excelente'];
  
  return { level: strength, text: texts[strength] || '' };
});

const tabs = [
  { id: 'info', label: 'Información', icon: '👤' },
  { id: 'security', label: 'Seguridad', icon: '🔒' },
  { id: 'preferences', label: 'Preferencias', icon: '⚙️' }
];

// Métodos
const formatDate = (date?: string) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
};

const formatFullDate = (date?: string) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const loadUserStats = async () => {
  await Promise.all([
    reviewStore.fetchMyReviews(),
    bookingStore.fetchMyBookings(),
    propertyStore.fetchProperties({})
  ]);
  
  userStats.value.reviews = reviewStore.reviews.length;
  userStats.value.bookings = bookingStore.myBookings.length;
  userStats.value.helpful = reviewStore.reviews.reduce((sum, r) => sum + (r.helpful || 0), 0);
  userStats.value.properties = propertyStore.properties.filter(p => p.hostId?._id === authStore.user?._id).length;
};

const openEditModal = () => {
  editForm.value = {
    name: authStore.user?.name || '',
    phone: authStore.user?.phone || '',
    email: authStore.user?.email || ''
  };
  showEditModal.value = true;
  document.body.style.overflow = 'hidden';
};

const closeEditModal = () => {
  showEditModal.value = false;
  document.body.style.overflow = '';
};

const updateProfile = async () => {
  updatingProfile.value = true;
  try {
    await authStore.updateProfile({
      name: editForm.value.name,
      phone: editForm.value.phone
    });
    closeEditModal();
    alert('✅ Perfil actualizado exitosamente');
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Error al actualizar el perfil');
  } finally {
    updatingProfile.value = false;
  }
};

const validateNewPassword = () => {
  if (passwordForm.value.newPassword && passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'La contraseña debe tener al menos 6 caracteres';
  } else if (passwordForm.value.newPassword && !/[A-Za-z]/.test(passwordForm.value.newPassword)) {
    passwordError.value = 'Debe contener al menos una letra';
  } else if (passwordForm.value.newPassword && !/\d/.test(passwordForm.value.newPassword)) {
    passwordError.value = 'Debe contener al menos un número';
  } else {
    passwordError.value = '';
  }
};

const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Las contraseñas no coinciden';
    return;
  }
  
  if (passwordError.value) return;
  
  changingPassword.value = true;
  try {
    await authStore.changePassword(
      passwordForm.value.currentPassword,
      passwordForm.value.newPassword
    );
    
    // Reset form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    
    alert('✅ Contraseña actualizada exitosamente');
  } catch (error: any) {
    alert(error.response?.data?.error || 'Error al cambiar la contraseña');
  } finally {
    changingPassword.value = false;
  }
};

const openAvatarModal = () => {
  avatarPreview.value = userAvatar.value;
  newAvatar.value = null;
  showAvatarModal.value = true;
  document.body.style.overflow = 'hidden';
};

const closeAvatarModal = () => {
  showAvatarModal.value = false;
  document.body.style.overflow = '';
};

const generateRandomAvatar = () => {
  const colors = ['2e7d32', '4caf50', '2196f3', 'ff9800', 'e74c3c', '9c27b0'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomSeed = Math.random().toString(36).substring(7);
  avatarPreview.value = `https://ui-avatars.com/api/?background=${randomColor}&color=fff&name=${randomSeed.charAt(0)}&size=200`;
  newAvatar.value = null;
};

const uploadAvatar = () => {
  avatarInput.value?.click();
};

const handleAvatarUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string;
      newAvatar.value = file;
    };
    reader.readAsDataURL(file);
  }
};

const saveAvatar = async () => {
  // Aquí se implementaría la subida del avatar al backend
  alert('Funcionalidad de avatar próximamente disponible');
  closeAvatarModal();
};

const toggleDarkMode = () => {
  // Implementar toggle de modo oscuro
  localStorage.setItem('darkMode', JSON.stringify(darkModePreference.value));
  document.documentElement.style.colorScheme = darkModePreference.value ? 'dark' : 'light';
};

const logout = async () => {
  await authStore.logout();
  router.push('/');
};

const logoutAllDevices = async () => {
  if (confirm('¿Estás seguro de cerrar sesión en todos los dispositivos?')) {
    // Aquí se implementaría el logout de todos los dispositivos
    alert('Funcionalidad próximamente disponible');
  }
};

// Cargar datos
onMounted(() => {
  loadUserStats();
  
  // Cargar preferencia de modo oscuro
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode !== null) {
    darkModePreference.value = JSON.parse(savedDarkMode);
  }
});
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--bg-secondary);
}

.profile-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* Profile Header */
.profile-header {
  text-align: center;
  margin-bottom: 2rem;
}

.profile-avatar-section {
  position: relative;
  display: inline-block;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  object-fit: cover;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2e7d32;
  border: 3px solid white;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.avatar-edit-btn:hover {
  background: #1b5e20;
  transform: scale(1.05);
}

.user-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 40px;
  font-size: 0.85rem;
  font-weight: 500;
  margin: 1rem 0 0.5rem;
}

.user-badge.turista { background: #e3f2fd; color: #1976d2; }
.user-badge.anfitrion { background: #e8f5e9; color: #2e7d32; }
.user-badge.admin { background: #fff3e0; color: #f57c00; }
.user-badge.negocio_local { background: #f3e5f5; color: #7b1fa2; }

.member-since {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

/* Profile Tabs */
.profile-tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-secondary);
  transition: all 0.2s;
  position: relative;
}

.tab-btn:hover {
  color: #2e7d32;
}

.tab-btn.active {
  color: #2e7d32;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #2e7d32;
}

/* Tab Content */
.tab-pane {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Info Card */
.info-card {
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-header h3 {
  margin: 0;
}

.edit-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: none;
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #e8f5e9;
  color: #2e7d32;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-item {
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.info-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 0.9rem;
  font-weight: 500;
}

/* Stats Card */
.stats-card {
  background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
  border-radius: 20px;
  padding: 1.5rem;
  color: white;
}

.stats-card h3 {
  margin-bottom: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.7rem;
  opacity: 0.9;
}

/* Security Card */
.security-card, .session-card, .preferences-card {
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.password-form {
  margin-top: 1rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.85rem;
}

.password-input-wrapper {
  position: relative;
}

.password-input-wrapper input {
  width: 100%;
  padding: 0.75rem;
  padding-right: 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 0.9rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.password-input-wrapper input:focus {
  outline: none;
  border-color: #2e7d32;
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.6;
}

.password-strength {
  margin-top: 0.5rem;
}

.strength-bars {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
}

.strength-bar.active[data-level="1"] { background: #e74c3c; }
.strength-bar.active[data-level="2"] { background: #ff9800; }
.strength-bar.active[data-level="3"] { background: #2196f3; }
.strength-bar.active[data-level="4"] { background: #4caf50; }

.strength-text {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.error-message {
  color: #e74c3c;
  font-size: 0.7rem;
  margin-top: 0.25rem;
}

.btn-change-password {
  width: 100%;
  padding: 0.75rem;
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-change-password:hover:not(:disabled) {
  background: #1b5e20;
  transform: translateY(-1px);
}

.btn-change-password:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Session Card */
.session-info {
  margin: 1rem 0;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.session-icon {
  font-size: 1.5rem;
}

.session-detail {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.session-badge {
  margin-left: auto;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
}

.session-badge.active {
  background: #d4edda;
  color: #155724;
}

.btn-logout-all {
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border: 1px solid #e74c3c;
  color: #e74c3c;
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout-all:hover {
  background: #e74c3c;
  color: white;
}

/* Preferences */
.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.preference-item:last-child {
  border-bottom: none;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #2e7d32;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
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
  background: var(--bg-primary);
  border-radius: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
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

.modal-actions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn-cancel, .btn-submit {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-submit {
  background: #2e7d32;
  color: white;
}

.field-hint {
  display: block;
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Avatar Modal */
.avatar-modal {
  max-width: 400px;
}

.avatar-preview {
  text-align: center;
  padding: 1.5rem;
}

.preview-image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #2e7d32;
}

.avatar-options {
  display: flex;
  gap: 1rem;
  padding: 0 1.5rem;
}

.avatar-option {
  flex: 1;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.avatar-option:hover {
  background: #e8f5e9;
}

.option-icon {
  display: block;
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-container {
    padding: 1rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .profile-tabs {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    flex: 1;
    justify-content: center;
  }
  
  .avatar-options {
    flex-direction: column;
  }
}
</style>