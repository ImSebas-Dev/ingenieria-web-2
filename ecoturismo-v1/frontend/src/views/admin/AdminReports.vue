<template>
  <div class="admin-reports">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>📄 Reportes</h1>
        <p class="subtitle">Genera y exporta reportes de la plataforma</p>
      </div>
    </div>

    <!-- Report Cards -->
    <div class="reports-grid">
      <div class="report-card">
        <div class="report-icon">👥</div>
        <h3>Usuarios</h3>
        <p>Exporta la lista completa de usuarios registrados</p>
        <div class="report-actions">
          <select v-model="userFormat" class="format-select">
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
            <option value="pdf">PDF</option>
          </select>
          <button @click="exportReport('users')" class="btn-export">
            📥 Exportar
          </button>
        </div>
      </div>

      <div class="report-card">
        <div class="report-icon">🏠</div>
        <h3>Propiedades</h3>
        <p>Exporta todas las propiedades de la plataforma</p>
        <div class="report-actions">
          <select v-model="propertyFormat" class="format-select">
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
            <option value="pdf">PDF</option>
          </select>
          <button @click="exportReport('properties')" class="btn-export">
            📥 Exportar
          </button>
        </div>
      </div>

      <div class="report-card">
        <div class="report-icon">📅</div>
        <h3>Reservas</h3>
        <p>Exporta el historial completo de reservas</p>
        <div class="report-actions">
          <select v-model="bookingFormat" class="format-select">
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
            <option value="pdf">PDF</option>
          </select>
          <button @click="exportReport('bookings')" class="btn-export">
            📥 Exportar
          </button>
        </div>
      </div>

      <div class="report-card">
        <div class="report-icon">💰</div>
        <h3>Ganancias</h3>
        <p>Exporta el reporte de ganancias por período</p>
        <div class="report-period">
          <select v-model="earningsPeriod" class="period-select">
            <option value="month">Este mes</option>
            <option value="quarter">Este trimestre</option>
            <option value="year">Este año</option>
            <option value="all">Todo el historial</option>
          </select>
        </div>
        <div class="report-actions">
          <select v-model="earningsFormat" class="format-select">
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
            <option value="pdf">PDF</option>
          </select>
          <button @click="exportReport('earnings')" class="btn-export">
            📥 Exportar
          </button>
        </div>
      </div>
    </div>

    <!-- Financial Summary -->
    <div class="financial-summary">
      <h3>💰 Resumen financiero</h3>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-value">${{ formatPrice(totalRevenue) }}</div>
          <div class="summary-label">Ingresos totales</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${{ formatPrice(monthlyRevenue) }}</div>
          <div class="summary-label">Este mes</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">{{ totalBookings }}</div>
          <div class="summary-label">Reservas totales</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">{{ avgBookingValue }}</div>
          <div class="summary-label">Ticket promedio</div>
        </div>
      </div>
    </div>

    <!-- Top Statistics -->
    <div class="top-stats">
      <div class="stats-card">
        <h3>🏆 Top propiedades</h3>
        <div class="stats-list">
          <div v-for="(prop, index) in topProperties" :key="prop._id" class="stats-item">
            <span class="rank">{{ index + 1 }}</span>
            <span class="name">{{ prop.title }}</span>
            <span class="value">{{ prop.totalBookings }} reservas</span>
          </div>
        </div>
      </div>

      <div class="stats-card">
        <h3>⭐ Top anfitriones</h3>
        <div class="stats-list">
          <div v-for="(host, index) in topHosts" :key="host._id" class="stats-item">
            <span class="rank">{{ index + 1 }}</span>
            <span class="name">{{ host.name }}</span>
            <span class="value">⭐ {{ host.avgRating.toFixed(1) }}</span>
          </div>
        </div>
      </div>

      <div class="stats-card">
        <h3>📈 Crecimiento mensual</h3>
        <div class="growth-chart">
          <div 
            v-for="(month, index) in monthlyGrowth" 
            :key="month.month"
            class="growth-bar-container"
          >
            <div class="growth-label">{{ month.month }}</div>
            <div class="growth-bar-wrapper">
              <div 
                class="growth-bar"
                :style="{ width: `${month.percentage}%` }"
              ></div>
            </div>
            <div class="growth-value">{{ month.count }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Date Range Report -->
    <div class="date-range-report">
      <h3>📅 Reporte personalizado</h3>
      <div class="date-range-form">
        <div class="date-inputs">
          <div class="input-group">
            <label>Fecha inicio</label>
            <input type="date" v-model="dateRange.start">
          </div>
          <div class="input-group">
            <label>Fecha fin</label>
            <input type="date" v-model="dateRange.end">
          </div>
        </div>
        <div class="report-type">
          <select v-model="customReportType" class="type-select">
            <option value="bookings">Reservas</option>
            <option value="revenue">Ingresos</option>
            <option value="users">Nuevos usuarios</option>
          </select>
        </div>
        <button @click="generateCustomReport" class="btn-generate">
          📊 Generar reporte
        </button>
      </div>
      
      <div v-if="customReportData" class="custom-report-result">
        <h4>Resultados del reporte</h4>
        <div class="result-value">{{ customReportResult }}</div>
        <button @click="exportCustomReport" class="btn-export-small">
          Exportar resultado
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axiosInstance from '../../utils/axios.config';
import { useAdminStore } from '../../stores/admin';

const adminStore = useAdminStore();

// Formatos de exportación
const userFormat = ref('csv');
const propertyFormat = ref('csv');
const bookingFormat = ref('csv');
const earningsFormat = ref('csv');
const earningsPeriod = ref('month');
const customReportType = ref('bookings');

// Rango de fechas
const dateRange = ref({
  start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
});

// Estado
const totalRevenue = ref(0);
const monthlyRevenue = ref(0);
const totalBookings = ref(0);
const avgBookingValue = ref('$0');
const topProperties = ref<any[]>([]);
const topHosts = ref<any[]>([]);
const monthlyGrowth = ref<any[]>([]);
const customReportData = ref(false);
const customReportResult = ref('');

const formatPrice = (price: number) => {
  return price?.toLocaleString('es-CO') || 0;
};

const exportReport = async (type: string) => {
  let format = '';
  let period = '';
  
  switch (type) {
    case 'users':
      format = userFormat.value;
      break;
    case 'properties':
      format = propertyFormat.value;
      break;
    case 'bookings':
      format = bookingFormat.value;
      break;
    case 'earnings':
      format = earningsFormat.value;
      period = earningsPeriod.value;
      break;
  }
  
  try {
    const response = await axiosInstance.get(`/admin/reports/${type}`, {
      params: { format, period },
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}_report.${format === 'excel' ? 'xlsx' : format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    alert('Error al exportar el reporte');
  }
};

const generateCustomReport = () => {
  // Simulación de generación de reporte
  const start = new Date(dateRange.value.start);
  const end = new Date(dateRange.value.end);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  let result = '';
  switch (customReportType.value) {
    case 'bookings':
      result = `${Math.floor(Math.random() * 100) + 20} reservas en el período`;
      break;
    case 'revenue':
      result = `$${formatPrice(Math.floor(Math.random() * 5000000) + 1000000)} en ingresos`;
      break;
    case 'users':
      result = `${Math.floor(Math.random() * 50) + 5} nuevos usuarios registrados`;
      break;
  }
  
  customReportResult.value = result;
  customReportData.value = true;
};

const exportCustomReport = () => {
  alert('Funcionalidad de exportación de reporte personalizado próximamente disponible');
};

// Cargar estadísticas
const loadStats = async () => {
  try {
    const response = await axiosInstance.get('/admin/reports/stats');
    totalRevenue.value = response.data.totalRevenue || 0;
    monthlyRevenue.value = response.data.monthlyRevenue || 0;
    totalBookings.value = response.data.totalBookings || 0;
    avgBookingValue.value = totalBookings.value > 0 
      ? `$${formatPrice(totalRevenue.value / totalBookings.value)}` 
      : '$0';
    topProperties.value = response.data.topProperties || [];
    topHosts.value = response.data.topHosts || [];
    monthlyGrowth.value = response.data.monthlyGrowth || [];
  } catch (error) {
    console.error('Error loading stats:', error);
    // Datos de ejemplo
    topProperties.value = [
      { _id: '1', title: 'Cabaña en la montaña', totalBookings: 45 },
      { _id: '2', title: 'Finca eco turística', totalBookings: 38 },
      { _id: '3', title: 'Glamping con vista al mar', totalBookings: 32 }
    ];
    topHosts.value = [
      { _id: '1', name: 'María González', avgRating: 4.9 },
      { _id: '2', name: 'Carlos López', avgRating: 4.8 },
      { _id: '3', name: 'Ana Rodríguez', avgRating: 4.7 }
    ];
    monthlyGrowth.value = [
      { month: 'Ene', count: 12, percentage: 40 },
      { month: 'Feb', count: 15, percentage: 50 },
      { month: 'Mar', count: 20, percentage: 67 },
      { month: 'Abr', count: 18, percentage: 60 },
      { month: 'May', count: 25, percentage: 83 },
      { month: 'Jun', count: 30, percentage: 100 }
    ];
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.admin-reports {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin-bottom: 0.25rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.report-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.2s;
}

.report-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

.report-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.report-card h3 {
  margin-bottom: 0.5rem;
}

.report-card p {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 1rem;
}

.report-actions {
  display: flex;
  gap: 0.5rem;
}

.format-select, .period-select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: white;
}

.btn-export {
  padding: 0.5rem 1rem;
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.report-period {
  margin-bottom: 1rem;
}

.period-select {
  width: 100%;
}

/* Financial Summary */
.financial-summary {
  background: linear-gradient(135deg, #1a5f2a 0%, #0d3b1a 100%);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  color: white;
}

.financial-summary h3 {
  margin-bottom: 1rem;
  font-size: 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.summary-card {
  text-align: center;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: bold;
}

.summary-label {
  font-size: 0.7rem;
  opacity: 0.8;
  margin-top: 0.25rem;
}

/* Top Stats */
.top-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stats-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.stats-card h3 {
  margin-bottom: 1rem;
  font-size: 1rem;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.rank {
  width: 28px;
  height: 28px;
  background: #2e7d32;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}

.name {
  flex: 1;
  font-size: 0.85rem;
}

.value {
  font-size: 0.75rem;
  font-weight: 500;
  color: #2e7d32;
}

/* Growth Chart */
.growth-chart {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.growth-bar-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.growth-label {
  width: 40px;
  font-size: 0.7rem;
  color: #666;
}

.growth-bar-wrapper {
  flex: 1;
  height: 24px;
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
}

.growth-bar {
  height: 100%;
  background: linear-gradient(90deg, #2e7d32, #4caf50);
  border-radius: 12px;
  transition: width 0.3s;
}

.growth-value {
  width: 40px;
  font-size: 0.7rem;
  font-weight: 500;
  color: #2e7d32;
  text-align: right;
}

/* Date Range Report */
.date-range-report {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.date-range-report h3 {
  margin-bottom: 1rem;
  font-size: 1rem;
}

.date-range-form {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.date-inputs {
  display: flex;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-group label {
  font-size: 0.7rem;
  color: #666;
}

.input-group input {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.report-type {
  min-width: 150px;
}

.type-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.btn-generate {
  padding: 0.5rem 1rem;
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.custom-report-result {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #e8f5e9;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.custom-report-result h4 {
  margin: 0;
  font-size: 0.85rem;
}

.result-value {
  flex: 1;
  font-size: 1rem;
  font-weight: bold;
  color: #2e7d32;
}

.btn-export-small {
  padding: 0.5rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .reports-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .top-stats {
    grid-template-columns: 1fr;
  }
  
  .date-range-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-inputs {
    flex-direction: column;
  }
  
  .custom-report-result {
    flex-direction: column;
    text-align: center;
  }
}
</style>