<template>
  <div class="admin-dashboard">
    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon users">👥</div>
        <div class="stat-info">
          <h3>{{ formatNumber(stats?.totalUsers || 0) }}</h3>
          <p>Usuarios registrados</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon properties">🏠</div>
        <div class="stat-info">
          <h3>{{ formatNumber(stats?.totalProperties || 0) }}</h3>
          <p>Propiedades</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon bookings">📅</div>
        <div class="stat-info">
          <h3>{{ formatNumber(stats?.totalBookings || 0) }}</h3>
          <p>Reservas totales</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon revenue">💰</div>
        <div class="stat-info">
          <h3>${{ formatPrice(stats?.totalRevenue || 0) }}</h3>
          <p>Ingresos totales</p>
        </div>
      </div>
    </div>

    <!-- Charts Row - Versión simplificada sin librerías -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-header">
          <h3>📊 Reservas por mes</h3>
        </div>
        <div class="simple-bar-chart">
          <div 
            v-for="(data, index) in monthlyBookingsData" 
            :key="index" 
            class="bar-item"
          >
            <div class="bar-label">{{ data.label }}</div>
            <div class="bar-container">
              <div 
                class="bar-fill" 
                :style="{ height: `${data.percentage}%`, backgroundColor: getBarColor(index) }"
              >
                <span class="bar-value">{{ data.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="chart-card">
        <div class="chart-header">
          <h3>💰 Ingresos por mes</h3>
        </div>
        <div class="simple-line-chart">
          <div class="line-chart-container">
            <div class="line-chart-bars">
              <div 
                v-for="(data, index) in monthlyRevenueData" 
                :key="index" 
                class="line-bar-item"
              >
                <div 
                  class="line-bar-fill"
                  :style="{ height: `${data.percentage}%`, backgroundColor: '#ffc107' }"
                ></div>
                <div class="line-bar-label">{{ data.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Cards -->
    <div class="status-row">
      <div class="status-card pending">
        <div class="status-header">
          <span class="status-icon">⏳</span>
          <span class="status-title">Propiedades pendientes</span>
        </div>
        <div class="status-value">{{ stats?.pendingProperties || 0 }}</div>
        <router-link to="/admin/properties?status=pending" class="status-link">Revisar →</router-link>
      </div>
      
      <div class="status-card active">
        <div class="status-header">
          <span class="status-icon">✅</span>
          <span class="status-title">Propiedades activas</span>
        </div>
        <div class="status-value">{{ stats?.activeProperties || 0 }}</div>
        <router-link to="/admin/properties?status=active" class="status-link">Ver todas →</router-link>
      </div>
      
      <div class="status-card confirmed">
        <div class="status-header">
          <span class="status-icon">✅</span>
          <span class="status-title">Reservas confirmadas</span>
        </div>
        <div class="status-value">{{ stats?.confirmedBookings || 0 }}</div>
        <router-link to="/admin/bookings?status=confirmed" class="status-link">Ver reservas →</router-link>
      </div>
      
      <div class="status-card completed">
        <div class="status-header">
          <span class="status-icon">✨</span>
          <span class="status-title">Reservas completadas</span>
        </div>
        <div class="status-value">{{ stats?.completedBookings || 0 }}</div>
        <router-link to="/admin/bookings?status=completed" class="status-link">Ver historial →</router-link>
      </div>
    </div>

    <!-- Recent Sections -->
    <div class="recent-row">
      <div class="recent-card">
        <div class="recent-header">
          <h3>📋 Últimos usuarios</h3>
          <router-link to="/admin/users" class="view-all">Ver todos →</router-link>
        </div>
        <div class="recent-list">
          <div v-for="user in stats?.recentUsers?.slice(0, 5)" :key="user._id" class="recent-item">
            <div class="item-avatar">
              {{ user.name?.charAt(0) || '👤' }}
            </div>
            <div class="item-info">
              <span class="item-name">{{ user.name }}</span>
              <span class="item-email">{{ user.email }}</span>
            </div>
            <div class="item-role" :class="user.role">
              {{ getRoleLabel(user.role) }}
            </div>
            <span class="item-date">{{ formatRelativeDate(user.createdAt) }}</span>
          </div>
        </div>
      </div>
      
      <div class="recent-card">
        <div class="recent-header">
          <h3>📅 Reservas recientes</h3>
          <router-link to="/admin/bookings" class="view-all">Ver todas →</router-link>
        </div>
        <div class="recent-list">
          <div v-for="booking in stats?.recentBookings?.slice(0, 5)" :key="booking._id" class="recent-item">
            <div class="item-icon">🏠</div>
            <div class="item-info">
              <span class="item-name">{{ booking.propertyId?.title }}</span>
              <span class="item-email">Huésped: {{ booking.turistaId?.name }}</span>
            </div>
            <div class="item-amount">${{ formatPrice(booking.totalPrice) }}</div>
            <div class="item-status" :class="booking.status">
              {{ getBookingStatusLabel(booking.status) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h3>⚡ Acciones rápidas</h3>
      <div class="actions-grid">
        <button @click="exportReport" class="action-btn">
          <span class="action-icon">📊</span>
          <span>Exportar reporte mensual</span>
        </button>
        <router-link to="/admin/properties?status=pending" class="action-btn">
          <span class="action-icon">🏠</span>
          <span>Revisar propiedades nuevas</span>
        </router-link>
        <router-link to="/admin/reviews?filter=reported" class="action-btn">
          <span class="action-icon">⭐</span>
          <span>Moderar reseñas reportadas</span>
        </router-link>
        <button @click="sendNewsletter" class="action-btn">
          <span class="action-icon">📧</span>
          <span>Enviar newsletter</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '../../stores/admin';

const adminStore = useAdminStore();

const stats = computed(() => adminStore.stats);
const loading = computed(() => adminStore.loading);

const monthlyBookingsData = computed(() => {
  if (!stats.value?.monthlyStats) return [];
  const max = Math.max(...stats.value.monthlyStats.map(s => s.bookings), 1);
  return stats.value.monthlyStats.map(stat => ({
    label: stat.month,
    value: stat.bookings,
    percentage: (stat.bookings / max) * 100
  }));
});

const monthlyRevenueData = computed(() => {
  if (!stats.value?.monthlyStats) return [];
  const max = Math.max(...stats.value.monthlyStats.map(s => s.revenue), 1);
  return stats.value.monthlyStats.map(stat => ({
    label: stat.month,
    value: stat.revenue,
    percentage: (stat.revenue / max) * 100
  }));
});

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatPrice = (price: number) => {
  return price?.toLocaleString('es-CO') || 0;
};

const formatRelativeDate = (date: string) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) return `Hace ${diff} días`;
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const getRoleLabel = (role: string) => {
  const roles: Record<string, string> = {
    turista: 'Viajero',
    anfitrion: 'Anfitrión',
    admin: 'Admin',
    negocio_local: 'Negocio'
  };
  return roles[role] || role;
};

const getBookingStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada'
  };
  return labels[status] || status;
};

const getBarColor = (index: number) => {
  const colors = ['#2e7d32', '#4caf50', '#81c784', '#a5d6a7', '#c8e6c9'];
  return colors[index % colors.length];
};

const exportReport = () => {
  alert('Funcionalidad de exportación próximamente disponible');
};

const sendNewsletter = () => {
  alert('Funcionalidad de newsletter próximamente disponible');
};

onMounted(async () => {
  await adminStore.fetchDashboardStats();
});
</script>

<style scoped>
.admin-dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.stat-icon.users { background: #e3f2fd; }
.stat-icon.properties { background: #e8f5e9; }
.stat-icon.bookings { background: #fff3e0; }
.stat-icon.revenue { background: #e8f5e9; }

.stat-info h3 {
  margin: 0;
  font-size: 1.8rem;
  color: #333;
}

.stat-info p {
  margin: 0.25rem 0 0;
  color: #666;
  font-size: 0.85rem;
}

/* Simple Bar Chart */
.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h3 {
  margin: 0;
  font-size: 1rem;
}

.simple-bar-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 250px;
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
  color: #666;
}

.bar-container {
  width: 100%;
  height: 180px;
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

/* Simple Line Chart */
.simple-line-chart {
  height: 250px;
  display: flex;
  align-items: flex-end;
}

.line-chart-container {
  width: 100%;
}

.line-chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 220px;
  gap: 1rem;
}

.line-bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.line-bar-fill {
  width: 60%;
  min-height: 4px;
  border-radius: 8px;
  transition: height 0.3s;
}

.line-bar-label {
  font-size: 0.7rem;
  color: #666;
}

/* Status Row */
.status-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.status-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.status-value {
  font-size: 2rem;
  font-weight: bold;
  margin: 0.5rem 0;
}

.status-card.pending .status-value { color: #ff9800; }
.status-card.active .status-value { color: #4caf50; }
.status-card.confirmed .status-value { color: #2196f3; }
.status-card.completed .status-value { color: #9c27b0; }

.status-link {
  font-size: 0.8rem;
  color: #2e7d32;
  text-decoration: none;
}

/* Recent Sections */
.recent-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.recent-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.view-all {
  font-size: 0.8rem;
  color: #2e7d32;
  text-decoration: none;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-radius: 12px;
}

.recent-item:hover {
  background: #f5f5f5;
}

.item-avatar {
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

.item-info {
  flex: 1;
}

.item-name {
  display: block;
  font-weight: 500;
  font-size: 0.9rem;
}

.item-email {
  font-size: 0.7rem;
  color: #999;
}

.item-role, .item-status {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
}

.item-role.turista { background: #e3f2fd; color: #1565c0; }
.item-role.anfitrion { background: #e8f5e9; color: #2e7d32; }
.item-status.pending { background: #fff3cd; color: #856404; }
.item-status.confirmed { background: #d4edda; color: #155724; }
.item-status.completed { background: #d1ecf1; color: #0c5460; }

.item-amount {
  font-weight: 600;
  color: #2e7d32;
  font-size: 0.8rem;
}

.item-date {
  font-size: 0.7rem;
  color: #999;
}

/* Quick Actions */
.quick-actions {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f5f5f5;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  text-decoration: none;
  color: #333;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.action-btn:hover {
  background: #e8f5e9;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
  
  .recent-row {
    grid-template-columns: 1fr;
  }
  
  .simple-bar-chart {
    height: 200px;
  }
  
  .bar-container {
    height: 130px;
  }
}
</style>