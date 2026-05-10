import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import ProfileView from '../views/ProfileView.vue';
import SearchView from '../views/SearchView.vue';
import PropertiesView from '../views/PropertiesView.vue';
import PropertyDetailView from '../views/PropertyDetailView.vue';
import CreatePropertyView from '../views/CreatePropertyView.vue';
import HostDashboardView from '../views/HostDashboardView.vue';
import MyBookingsView from '../views/MyBookingsView.vue';
import HostBookingsView from '../views/HostBookingsView.vue';
import MyReviewsView from '../views/MyReviewsView.vue';
import AdminLayout from '../views/admin/AdminLayout.vue';
import AdminDashboard from '../views/admin/AdminDashboard.vue';
import AdminUsers from '../views/admin/AdminUsers.vue';
import AdminProperties from '../views/admin/AdminProperties.vue';
import AdminBookings from '../views/admin/AdminBookings.vue';
import AdminReviews from '../views/admin/AdminReviews.vue';
import AdminReports from '../views/admin/AdminReports.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { public: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true, guestOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { public: true, guestOnly: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/search',
    name: 'search',
    component: SearchView,
    meta: { public: true }
  },
  {
    path: '/properties',
    name: 'properties',
    component: PropertiesView,
    meta: { public: true }
  },
  {
    path: '/properties/:id',
    name: 'property-detail',
    component: PropertyDetailView,
    meta: { public: true }
  },
  {
    path: '/properties/create',
    name: 'create-property',
    component: CreatePropertyView,
    meta: { requiresAuth: true, role: 'anfitrion' }
  },
  {
    path: '/properties/edit/:id',
    name: 'edit-property',
    component: CreatePropertyView,
    meta: { requiresAuth: true, role: 'anfitrion' }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: HostDashboardView,
    meta: { requiresAuth: true, role: 'anfitrion' }
  },
  {
    path: '/my-bookings',
    name: 'my-bookings',
    component: MyBookingsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/host-bookings',
    name: 'host-bookings',
    component: HostBookingsView,
    meta: { requiresAuth: true, role: 'anfitrion' }
  },
  {
    path: '/my-reviews',
    name: 'my-reviews',
    component: MyReviewsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: AdminDashboard,
        meta: { title: 'Dashboard' }
      },
      {
        path: 'users',
        name: 'admin-users',
        component: AdminUsers,
        meta: { title: 'Usuarios' }
      },
      {
        path: 'properties',
        name: 'admin-properties',
        component: AdminProperties,
        meta: { title: 'Propiedades' }
      },
      {
        path: 'bookings',
        name: 'admin-bookings',
        component: AdminBookings,
        meta: { title: 'Reservas' }
      },
      {
        path: 'reviews',
        name: 'admin-reviews',
        component: AdminReviews,
        meta: { title: 'Reseñas' }
      },
      {
        path: 'reports',
        name: 'admin-reports',
        component: AdminReports,
        meta: { title: 'Reportes' }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Guard de navegación
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Esperar a que se cargue el perfil si hay token
  if (localStorage.getItem('access_token') && !authStore.user) {
    await authStore.fetchProfile();
  }
  
  // Verificar autenticación
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } 
  // Verificar rol específico
  if (to.meta.role && authStore.user?.role !== to.meta.role) {
    next('/');
    return;
  }
  // Verificar si la ruta es solo para invitados
  else if (to.meta.guestOnly && authStore.isAuthenticated) {
    // Redirigir según el rol
    const role = authStore.user?.role;
    if (role === 'anfitrion') {
      next('/dashboard');
    } else if (role === 'admin') {
      next('/admin');
    } else {
      next('/');
    }
  }
  else {
    next();
  }
});

export default router;