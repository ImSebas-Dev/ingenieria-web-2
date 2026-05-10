<template>
  <div class="admin-users">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>👥 Gestión de Usuarios</h1>
        <p class="subtitle">Administra los usuarios registrados en la plataforma</p>
      </div>
      <button class="btn-export" @click="exportUsers">
        📊 Exportar usuarios
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="filters.search" 
          type="text" 
          placeholder="Buscar por nombre o email..."
          @input="applyFilters"
        >
      </div>
      
      <select v-model="filters.role" class="filter-select" @change="applyFilters">
        <option value="">Todos los roles</option>
        <option value="turista">Viajeros</option>
        <option value="anfitrion">Anfitriones</option>
        <option value="negocio_local">Negocios locales</option>
        <option value="admin">Administradores</option>
      </select>
      
      <select v-model="filters.status" class="filter-select" @change="applyFilters">
        <option value="">Todos los estados</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
      </select>
    </div>

    <!-- Users Table -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Fecha registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user._id">
            <td class="user-cell">
              <div class="user-avatar">
                {{ user.name?.charAt(0) || '👤' }}
              </div>
              <div class="user-info">
                <strong>{{ user.name }}</strong>
                <span class="user-id">ID: {{ user._id?.slice(-8) }}</span>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <select 
                v-model="user.role" 
                class="role-select"
                :class="user.role"
                @change="updateRole(user._id, user.role)"
                :disabled="user._id === currentUserId"
              >
                <option value="turista">🌍 Viajero</option>
                <option value="anfitrion">🏠 Anfitrión</option>
                <option value="negocio_local">🏪 Negocio local</option>
                <option value="admin">👑 Administrador</option>
              </select>
            </td>
            <td>
              <button 
                @click="toggleStatus(user._id, !user.isActive)"
                class="status-badge"
                :class="{ active: user.isActive, inactive: !user.isActive }"
              >
                {{ user.isActive ? 'Activo' : 'Inactivo' }}
              </button>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button @click="viewUserDetails(user)" class="btn-view" title="Ver detalles">
                  👁️
                </button>
                <button @click="sendMessage(user)" class="btn-message" title="Enviar mensaje">
                  💬
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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

    <!-- User Details Modal -->
    <div v-if="showUserModal" class="modal-overlay" @click.self="closeUserModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Detalles del usuario</h2>
          <button class="modal-close" @click="closeUserModal">✕</button>
        </div>
        <div class="user-details" v-if="selectedUser">
          <div class="detail-avatar">
            {{ selectedUser.name?.charAt(0) || '👤' }}
          </div>
          <div class="detail-row">
            <strong>Nombre:</strong> {{ selectedUser.name }}
          </div>
          <div class="detail-row">
            <strong>Email:</strong> {{ selectedUser.email }}
          </div>
          <div class="detail-row">
            <strong>Teléfono:</strong> {{ selectedUser.phone || 'No especificado' }}
          </div>
          <div class="detail-row">
            <strong>Rol:</strong> {{ getRoleLabel(selectedUser.role) }}
          </div>
          <div class="detail-row">
            <strong>Estado:</strong> {{ selectedUser.isActive ? 'Activo' : 'Inactivo' }}
          </div>
          <div class="detail-row">
            <strong>Fecha registro:</strong> {{ formatFullDate(selectedUser.createdAt) }}
          </div>
          <div class="detail-row">
            <strong>Último acceso:</strong> {{ selectedUser.lastLogin ? formatFullDate(selectedUser.lastLogin) : 'Nunca' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '../../stores/admin';
import { useAuthStore } from '../../stores/auth';
import axiosInstance from '../../utils/axios.config';

const adminStore = useAdminStore();
const authStore = useAuthStore();

// Estado
const filters = ref({
  search: '',
  role: '',
  status: ''
});
const showUserModal = ref(false);
const selectedUser = ref<any>(null);
const loading = ref(false);

// Computed
const users = computed(() => adminStore.users);
const pagination = computed(() => adminStore.pagination);
const currentUserId = computed(() => authStore.user?._id);

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

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES');
};

const formatFullDate = (date: string) => {
  return new Date(date).toLocaleString('es-ES');
};

const getRoleLabel = (role: string) => {
  const roles: Record<string, string> = {
    turista: '🌍 Viajero',
    anfitrion: '🏠 Anfitrión',
    admin: '👑 Administrador',
    negocio_local: '🏪 Negocio Local'
  };
  return roles[role] || role;
};

const applyFilters = async () => {
  await adminStore.fetchUsers(1, 20, filters.value);
};

const changePage = async (page: number) => {
  await adminStore.fetchUsers(page, 20, filters.value);
};

const updateRole = async (userId: string, newRole: string) => {
  if (confirm(`¿Cambiar el rol de este usuario a "${getRoleLabel(newRole)}"?`)) {
    await adminStore.updateUserRole(userId, newRole);
  }
};

const toggleStatus = async (userId: string, isActive: boolean) => {
  const action = isActive ? 'activar' : 'desactivar';
  if (confirm(`¿Estás seguro de ${action} este usuario?`)) {
    await adminStore.toggleUserStatus(userId, isActive);
  }
};

const viewUserDetails = (user: any) => {
  selectedUser.value = user;
  showUserModal.value = true;
};

const closeUserModal = () => {
  showUserModal.value = false;
  selectedUser.value = null;
};

const sendMessage = (user: any) => {
  alert(`Funcionalidad de mensajería próximamente disponible para: ${user.name}`);
};

const exportUsers = async () => {
  try {
    const response = await axiosInstance.get('/admin/users/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'usuarios.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    alert('Error al exportar usuarios');
  }
};

onMounted(() => {
  adminStore.fetchUsers();
});
</script>

<style scoped>
.admin-users {
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
  margin-bottom: 1.5rem;
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

.table-container {
  background: white;
  border-radius: 16px;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 1rem;
  background: #f8f9fa;
  font-weight: 600;
  font-size: 0.85rem;
  color: #666;
  border-bottom: 1px solid #eee;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #2e7d32, #4caf50);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.user-info strong {
  display: block;
  font-size: 0.9rem;
}

.user-id {
  font-size: 0.7rem;
  color: #999;
}

.role-select {
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
}

.role-select.turista { background: #e3f2fd; color: #1565c0; }
.role-select.anfitrion { background: #e8f5e9; color: #2e7d32; }
.role-select.admin { background: #fff3e0; color: #f57c00; }

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-view, .btn-message {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.25rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.btn-view:hover { background: #e3f2fd; }
.btn-message:hover { background: #e8f5e9; }

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

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
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

.user-details {
  padding: 1.5rem;
}

.detail-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #2e7d32, #4caf50);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  margin: 0 auto 1rem;
}

.detail-row {
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.detail-row:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
  }
  
  .search-box {
    max-width: none;
  }
  
  .data-table th:nth-child(5),
  .data-table td:nth-child(5) {
    display: none;
  }
}
</style>