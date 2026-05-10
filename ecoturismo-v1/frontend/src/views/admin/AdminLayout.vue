<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">👑</span>
          <span v-if="!sidebarCollapsed" class="logo-text">Admin Panel</span>
        </div>
        <button class="toggle-sidebar" @click="toggleSidebar">
          {{ sidebarCollapsed ? '→' : '←' }}
        </button>
      </div>
      
      <nav class="sidebar-nav">
        <router-link to="/admin" class="nav-item" :class="{ active: $route.path === '/admin' }">
          <span class="nav-icon">📊</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Dashboard</span>
        </router-link>
        
        <router-link to="/admin/users" class="nav-item" :class="{ active: $route.path === '/admin/users' }">
          <span class="nav-icon">👥</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Usuarios</span>
        </router-link>
        
        <router-link to="/admin/properties" class="nav-item" :class="{ active: $route.path === '/admin/properties' }">
          <span class="nav-icon">🏠</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Propiedades</span>
        </router-link>
        
        <router-link to="/admin/bookings" class="nav-item" :class="{ active: $route.path === '/admin/bookings' }">
          <span class="nav-icon">📅</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Reservas</span>
        </router-link>
        
        <router-link to="/admin/reviews" class="nav-item" :class="{ active: $route.path === '/admin/reviews' }">
          <span class="nav-icon">⭐</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Reseñas</span>
        </router-link>
        
        <router-link to="/admin/reports" class="nav-item" :class="{ active: $route.path === '/admin/reports' }">
          <span class="nav-icon">📄</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Reportes</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <div class="admin-info" v-if="!sidebarCollapsed">
          <span class="admin-avatar">👑</span>
          <div class="admin-details">
            <strong>{{ adminName }}</strong>
            <span>Administrador</span>
          </div>
        </div>
        <button class="logout-btn" @click="logout" :title="sidebarCollapsed ? 'Cerrar sesión' : ''">
          <span class="nav-icon">🚪</span>
          <span v-if="!sidebarCollapsed" class="nav-text">Salir</span>
        </button>
      </div>
    </aside>
    
    <!-- Main Content - CORREGIDO -->
    <div class="admin-main" :class="{ expanded: sidebarCollapsed }">
      <header class="admin-header">
        <div class="header-left">
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <div class="notifications">
            <button class="notification-btn">
              🔔
              <span class="notification-badge" v-if="notificationCount > 0">{{ notificationCount }}</span>
            </button>
          </div>
          <div class="admin-user">
            <span class="admin-name">{{ adminName }}</span>
            <span class="admin-role">Admin</span>
          </div>
        </div>
      </header>
      
      <main class="admin-content">
        <!-- router-view corregido con la sintaxis moderna -->
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const sidebarCollapsed = ref(false);
const notificationCount = ref(3);

const adminName = computed(() => authStore.user?.name || 'Administrador');

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/users': 'Gestión de Usuarios',
    '/admin/properties': 'Gestión de Propiedades',
    '/admin/bookings': 'Gestión de Reservas',
    '/admin/reviews': 'Moderación de Reseñas',
    '/admin/reports': 'Reportes'
  };
  return titles[route.path] || 'Panel de Administración';
});

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  localStorage.setItem('adminSidebarCollapsed', JSON.stringify(sidebarCollapsed.value));
};

const logout = async () => {
  await authStore.logout();
  router.push('/');
};

onMounted(() => {
  const saved = localStorage.getItem('adminSidebarCollapsed');
  if (saved) {
    sidebarCollapsed.value = JSON.parse(saved);
  }
});
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

/* Sidebar */
.admin-sidebar {
  width: 280px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  z-index: 100;
}

.admin-sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  font-size: 1.8rem;
}

.logo-text {
  font-size: 1.2rem;
  font-weight: 600;
}

.toggle-sidebar {
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle-sidebar:hover {
  background: rgba(255,255,255,0.2);
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.nav-item.active {
  background: #2e7d32;
  color: white;
  border-left: 3px solid #ffc107;
}

.nav-icon {
  font-size: 1.2rem;
  min-width: 24px;
}

.nav-text {
  font-size: 0.9rem;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
}

.admin-avatar {
  font-size: 2rem;
}

.admin-details strong {
  display: block;
  font-size: 0.85rem;
}

.admin-details span {
  font-size: 0.7rem;
  opacity: 0.7;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(231, 76, 60, 0.2);
  border: none;
  border-radius: 12px;
  color: #e74c3c;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(231, 76, 60, 0.3);
}

/* Main Content */
.admin-main {
  flex: 1;
  margin-left: 280px;
  transition: margin-left 0.3s;
}

.admin-main.expanded {
  margin-left: 80px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 99;
}

.header-left h1 {
  font-size: 1.5rem;
  margin: 0;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.notification-btn {
  position: relative;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e74c3c;
  color: white;
  font-size: 0.7rem;
  padding: 2px 5px;
  border-radius: 10px;
}

.admin-user {
  text-align: right;
}

.admin-name {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
}

.admin-role {
  font-size: 0.7rem;
  color: #666;
}

.admin-content {
  padding: 2rem;
  min-height: calc(100vh - 73px);
}

/* Animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);
    position: fixed;
    z-index: 200;
  }
  
  .admin-sidebar.mobile-open {
    transform: translateX(0);
  }
  
  .admin-main {
    margin-left: 0;
  }
  
  .admin-header {
    padding: 1rem;
  }
  
  .admin-content {
    padding: 1rem;
  }
}
</style>