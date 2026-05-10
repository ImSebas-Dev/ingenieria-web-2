import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axiosInstance from '../utils/axios.config';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'turista' | 'anfitrion' | 'admin' | 'negocio_local';
  avatar?: string;
  phone?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value);
  const isAnfitrion = computed(() => user.value?.role === 'anfitrion');
  const isAdmin = computed(() => user.value?.role === 'admin');

  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;

    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const { user: userData, tokens } = response.data;

      user.value = userData;
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);

      return true;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Error al iniciar sesión';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function register(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
    phone?: string;
  }) {
    loading.value = true;
    error.value = null;

    try {
      const response = await axiosInstance.post('/auth/register', userData);
      const { user: newUser, tokens } = response.data;

      user.value = newUser;
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);

      // Configurar el header de axios para futuras peticiones
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;

      return true;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Error al registrarse';
      console.error('Error en registro:', err.response?.data);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (err) {
      console.error('Error en logout:', err);
    } finally {
      user.value = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  async function fetchProfile() {
    if (!localStorage.getItem('access_token')) return;

    loading.value = true;
    try {
      const response = await axiosInstance.get('/auth/profile');
      user.value = response.data.user;
    } catch (err) {
      console.error('Error fetching profile:', err);
      logout();
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(profileData: Partial<User>) {
    loading.value = true;
    try {
      const response = await axiosInstance.put('/auth/profile', profileData);
      user.value = response.data.user;
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Error al actualizar perfil';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    loading.value = true;
    try {
      await axiosInstance.put('/auth/change-password', { currentPassword, newPassword });
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Error al cambiar contraseña';
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Cargar perfil al iniciar
  fetchProfile();

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAnfitrion,
    isAdmin,
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
    changePassword
  };
});