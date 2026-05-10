<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <!-- Skip to main content - Accesibilidad WCAG -->
    <a href="#main-content" class="skip-to-content">
      Saltar al contenido principal
    </a>

    <!-- Header con navegación moderna -->
    <header class="app-header">
      <div class="header-container">
        <!-- Logo y marca -->
        <div class="logo-section">
          <router-link to="/" class="logo-link" aria-label="Inicio">
            <span class="logo-icon">🌿</span>
            <span class="logo-text">EcoTurismo</span>
            <span class="logo-badge">Experiencial</span>
          </router-link>
        </div>

        <!-- Navegación principal - Desktop -->
        <nav class="main-nav desktop-nav" aria-label="Navegación principal">
          <router-link to="/" class="nav-link">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Inicio</span>
          </router-link>
          <router-link to="/properties" class="nav-link">
            <span class="nav-icon">🔍</span>
            <span class="nav-text">Buscar</span>
          </router-link>

          <template v-if="isAuthenticated">
            <router-link v-if="!isAnfitrion" to="/my-bookings" class="nav-link">
              <span class="nav-icon">📋</span>
              <span class="nav-text">Mis Reservas</span>
            </router-link>
            <router-link v-if="isAnfitrion" to="/dashboard" class="nav-link">
              <span class="nav-icon">📊</span>
              <span class="nav-text">Dashboard</span>
            </router-link>
            <router-link v-if="isAnfitrion" to="/host-bookings" class="nav-link">
              <span class="nav-icon">📅</span>
              <span class="nav-text">Reservas</span>
            </router-link>
            <router-link to="/my-reviews" class="nav-link">
              <span class="nav-icon">⭐</span>
              <span class="nav-text">Mis Reseñas</span>
            </router-link>
            <router-link to="/profile" class="nav-link">
              <span class="nav-icon">👤</span>
              <span class="nav-text">Perfil</span>
            </router-link>
            <router-link v-if="isAdmin" to="/admin" class="nav-link admin-link">
              <span class="nav-icon">👑</span>
              <span class="nav-text">Admin Panel</span>
            </router-link>
          </template>
        </nav>

        <!-- Acciones derecha: Modo oscuro + Auth -->
        <div class="header-actions">
          <!-- Botón modo oscuro/claro -->
          <button 
            @click="toggleDarkMode" 
            class="dark-mode-toggle"
            :aria-label="isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'"
            :title="isDarkMode ? 'Modo claro' : 'Modo oscuro'"
          >
            <span v-if="isDarkMode">☀️</span>
            <span v-else>🌙</span>
          </button>

          <!-- Auth buttons -->
          <template v-if="isAuthenticated">
            <div class="user-menu" @click="toggleUserMenu" ref="userMenuRef">
              <button class="user-avatar-btn" :aria-label="`Menú de usuario: ${userName}`">
                <div class="user-avatar">
                  {{ userInitial }}
                </div>
                <span class="avatar-badge"></span>
              </button>
              
              <transition name="dropdown">
                <div v-if="showUserMenu" class="user-dropdown">
                  <div class="dropdown-header">
                    <strong>{{ userName }}</strong>
                    <span class="user-role">{{ userRoleText }}</span>
                  </div>
                  <div class="dropdown-divider"></div>
                  <router-link to="/profile" class="dropdown-item" @click="closeUserMenu">
                    <span>👤</span> Mi Perfil
                  </router-link>
                  <router-link to="/my-bookings" class="dropdown-item" @click="closeUserMenu" v-if="!isAnfitrion">
                    <span>📋</span> Mis Reservas
                  </router-link>
                  <router-link to="/dashboard" class="dropdown-item" @click="closeUserMenu" v-if="isAnfitrion">
                    <span>📊</span> Dashboard
                  </router-link>
                  <router-link to="/host-bookings" class="dropdown-item" @click="closeUserMenu" v-if="isAnfitrion">
                    <span>📅</span> Reservas Recibidas
                  </router-link>
                  <router-link to="/my-reviews" class="dropdown-item" @click="closeUserMenu">
                    <span>⭐</span> Mis Reseñas
                  </router-link>
                  <router-link v-if="isAdmin" to="/admin" class="dropdown-item" @click="closeUserMenu">
                    <span>👑</span> Admin Panel
                  </router-link>
                  <div class="dropdown-divider"></div>
                  <button @click="handleLogout" class="dropdown-item logout-item">
                    <span>🚪</span> Cerrar Sesión
                  </button>
                </div>
              </transition>
            </div>
          </template>
          
          <template v-else>
            <div class="auth-buttons">
              <router-link to="/login" class="btn btn-outline">
                <span>🔐</span> Iniciar Sesión
              </router-link>
              <router-link to="/register" class="btn btn-primary">
                <span>📝</span> Registrarse
              </router-link>
            </div>
          </template>
        </div>

        <!-- Botón menú hamburguesa (mobile) -->
        <button 
          class="mobile-menu-btn" 
          @click="toggleMobileMenu"
          :aria-label="mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
        >
          <span class="hamburger-icon" :class="{ open: mobileMenuOpen }">
            <span></span><span></span><span></span>
          </span>
        </button>
      </div>

      <!-- Menú mobile desplegable -->
      <transition name="mobile-slide">
        <div v-if="mobileMenuOpen" class="mobile-nav">
          <div class="mobile-nav-header">
            <span class="mobile-logo">🌿 EcoTurismo</span>
            <button @click="toggleMobileMenu" class="close-mobile-menu" aria-label="Cerrar">✕</button>
          </div>
          <nav class="mobile-nav-links" aria-label="Menú móvil">
            <router-link to="/" @click="closeMobileMenu" class="mobile-nav-link">
              <span>🏠</span> Inicio
            </router-link>
            <router-link to="/properties" @click="closeMobileMenu" class="mobile-nav-link">
              <span>🔍</span> Buscar
            </router-link>
            <template v-if="isAuthenticated">
              <router-link v-if="!isAnfitrion" to="/my-bookings" @click="closeMobileMenu" class="mobile-nav-link">
                <span>📋</span> Mis Reservas
              </router-link>
              <router-link v-if="isAnfitrion" to="/dashboard" @click="closeMobileMenu" class="mobile-nav-link">
                <span>📊</span> Dashboard
              </router-link>
              <router-link v-if="isAnfitrion" to="/host-bookings" @click="closeMobileMenu" class="mobile-nav-link">
                <span>📅</span> Reservas Recibidas
              </router-link>
              <router-link to="/my-reviews" @click="closeMobileMenu" class="mobile-nav-link">
                <span>⭐</span> Mis Reseñas
              </router-link>
              <router-link to="/profile" @click="closeMobileMenu" class="mobile-nav-link">
                <span>👤</span> Mi Perfil
              </router-link>
              <router-link v-if="isAdmin" to="/admin" @click="closeMobileMenu" class="mobile-nav-link">
                <span>👑</span> Admin Panel
              </router-link>
              <div class="mobile-divider"></div>
              <button @click="handleLogout" class="mobile-nav-link logout">
                <span>🚪</span> Cerrar Sesión
              </button>
            </template>
            <template v-else>
              <router-link to="/login" @click="closeMobileMenu" class="mobile-nav-link">
                <span>🔐</span> Iniciar Sesión
              </router-link>
              <router-link to="/register" @click="closeMobileMenu" class="mobile-nav-link">
                <span>📝</span> Registrarse
              </router-link>
            </template>
          </nav>
        </div>
      </transition>
    </header>

    <!-- Main content - CORREGIDO con sintaxis moderna de Vue Router -->
    <main id="main-content" class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-container">
        <div class="footer-section">
          <h4>🌿 EcoTurismo Experiencial</h4>
          <p>Conectando viajeros con experiencias auténticas en la naturaleza.</p>
        </div>
        <div class="footer-section">
          <h4>Enlaces rápidos</h4>
          <ul>
            <li><router-link to="/properties">Buscar alojamientos</router-link></li>
            <li><router-link to="/register" v-if="!isAuthenticated">Únete como anfitrión</router-link></li>
            <li><a href="#" @click.prevent="showContactModal = true">Contacto</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Términos y condiciones</a></li>
            <li><a href="#">Política de privacidad</a></li>
            <li><a href="#">Política de cookies</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Síguenos</h4>
          <div class="social-links">
            <a href="#" aria-label="Instagram">📷</a>
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="Twitter">🐦</a>
            <a href="#" aria-label="WhatsApp">💬</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 EcoTurismo Experiencial. Todos los derechos reservados.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Estado
const isDarkMode = ref(false);
const showUserMenu = ref(false);
const mobileMenuOpen = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);
const showContactModal = ref(false);

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated);
const isAnfitrion = computed(() => authStore.isAnfitrion);
const isAdmin = computed(() => authStore.user?.role === 'admin');
const userName = computed(() => authStore.user?.name || 'Usuario');
const userInitial = computed(() => userName.value.charAt(0).toUpperCase());
const userRoleText = computed(() => {
  const role = authStore.user?.role;
  const roles: Record<string, string> = {
    turista: 'Viajero',
    anfitrion: 'Anfitrión',
    admin: 'Administrador',
    negocio_local: 'Negocio Local'
  };
  return roles[role as keyof typeof roles] || 'Usuario';
});

// Funciones
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', JSON.stringify(isDarkMode.value));
  document.documentElement.style.colorScheme = isDarkMode.value ? 'dark' : 'light';
};

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

const closeUserMenu = () => {
  showUserMenu.value = false;
};

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  document.body.style.overflow = mobileMenuOpen.value ? 'hidden' : '';
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
  document.body.style.overflow = '';
};

const handleLogout = async () => {
  closeUserMenu();
  closeMobileMenu();
  await authStore.logout();
  router.push('/');
};

// Cerrar menú al hacer click fuera
const handleClickOutside = (event: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    showUserMenu.value = false;
  }
};

// Cerrar menú con Escape
const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showUserMenu.value = false;
    mobileMenuOpen.value = false;
    document.body.style.overflow = '';
  }
};

onMounted(() => {
  // Cargar preferencia de modo oscuro
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode !== null) {
    isDarkMode.value = JSON.parse(savedDarkMode);
    document.documentElement.style.colorScheme = isDarkMode.value ? 'dark' : 'light';
  }
  
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
  document.body.style.overflow = '';
});
</script>

<style>
/* Variables globales CSS */
:root {
  --primary-color: #2e7d32;
  --primary-dark: #1b5e20;
  --primary-light: #4caf50;
  --secondary-color: #ff9800;
  --text-primary: #202124;
  --text-secondary: #5f6368;
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --border-color: #dadce0;
  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}

.dark-mode {
  --text-primary: #e8eaed;
  --text-secondary: #9aa0a6;
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --border-color: #3c4043;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  transition: background-color var(--transition-normal);
}

/* Skip to content - Accesibilidad */
.skip-to-content {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--primary-color);
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 0 0 var(--radius-sm) 0;
  z-index: 1000;
  transition: top var(--transition-fast);
}

.skip-to-content:focus {
  top: 0;
}

/* App Header */
.app-header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.75rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

/* Logo */
.logo-link {
  display: flex;
  align-items: baseline;
  gap: 8px;
  text-decoration: none;
  transition: transform var(--transition-fast);
}

.logo-link:hover {
  transform: scale(1.02);
}

.logo-icon {
  font-size: 1.75rem;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.logo-badge {
  font-size: 0.7rem;
  background: var(--secondary-color);
  color: white;
  padding: 2px 6px;
  border-radius: 20px;
  font-weight: 500;
}

/* Navegación Desktop */
.desktop-nav {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.6rem 1rem;
  text-decoration: none;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  font-weight: 500;
}

.nav-link:hover {
  background: var(--bg-secondary);
  color: var(--primary-color);
}

.nav-link.router-link-active {
  background: var(--primary-color);
  color: white;
}

.admin-link {
  background: rgba(46, 125, 50, 0.1);
}

.admin-link:hover {
  background: rgba(46, 125, 50, 0.2);
}

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dark-mode-toggle {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all var(--transition-fast);
}

.dark-mode-toggle:hover {
  transform: scale(1.05);
  background: var(--primary-light);
}

/* User Menu */
.user-menu {
  position: relative;
}

.user-avatar-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  position: relative;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  transition: transform var(--transition-fast);
}

.user-avatar-btn:hover .user-avatar {
  transform: scale(1.05);
}

.avatar-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: var(--secondary-color);
  border: 2px solid var(--bg-primary);
  border-radius: 50%;
}

.user-dropdown {
  position: absolute;
  top: 50px;
  right: 0;
  min-width: 240px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 1000;
}

.dropdown-header {
  padding: 1rem;
  background: var(--bg-secondary);
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0.25rem 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: var(--text-primary);
  transition: background var(--transition-fast);
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: 0.9rem;
  font-family: inherit;
}

.dropdown-item:hover {
  background: var(--bg-secondary);
}

.logout-item {
  color: #e74c3c;
}

/* Botones auth */
.auth-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.6rem 1.2rem;
  border-radius: 40px;
  text-decoration: none;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-outline {
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  background: transparent;
}

.btn-outline:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

/* Botón menú móvil */
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 24px;
}

.hamburger-icon span {
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all var(--transition-fast);
}

.hamburger-icon.open span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.hamburger-icon.open span:nth-child(2) {
  opacity: 0;
}

.hamburger-icon.open span:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

/* Menú móvil */
.mobile-nav {
  position: fixed;
  top: 0;
  right: 0;
  width: 80%;
  max-width: 320px;
  height: 100vh;
  background: var(--bg-primary);
  box-shadow: var(--shadow-lg);
  z-index: 200;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.mobile-nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.mobile-logo {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary-color);
}

.close-mobile-menu {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  text-decoration: none;
  color: var(--text-primary);
  transition: background var(--transition-fast);
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  text-align: left;
}

.mobile-nav-link:hover {
  background: var(--bg-secondary);
}

.mobile-nav-link.logout {
  color: #e74c3c;
}

.mobile-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0.5rem 0;
}

/* Animaciones */
.dropdown-enter-active, .dropdown-leave-active {
  transition: all var(--transition-fast);
}

.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.mobile-slide-enter-active, .mobile-slide-leave-active {
  transition: transform var(--transition-normal);
}

.mobile-slide-enter-from, .mobile-slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Main Content */
.main-content {
  min-height: calc(100vh - 280px);
}

/* Footer */
.app-footer {
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
  margin-top: 4rem;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 3rem 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.footer-section h4 {
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.footer-section ul {
  list-style: none;
}

.footer-section ul li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  text-decoration: none;
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.footer-section a:hover {
  color: var(--primary-color);
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-links a {
  font-size: 1.5rem;
}

.footer-bottom {
  text-align: center;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 0.8rem;
}

/* Responsive */
@media (max-width: 968px) {
  .desktop-nav {
    display: none;
  }
  
  .mobile-menu-btn {
    display: block;
  }
  
  .header-container {
    padding: 0.75rem 1rem;
  }
  
  .logo-text {
    font-size: 1.2rem;
  }
  
  .logo-badge {
    display: none;
  }
  
  .auth-buttons {
    display: none;
  }
  
  .footer-container {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .social-links {
    justify-content: center;
  }
}
</style>