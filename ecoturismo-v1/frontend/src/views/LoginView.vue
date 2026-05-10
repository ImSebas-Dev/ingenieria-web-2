<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Columna izquierda - Formulario -->
      <div class="login-form-wrapper">
        <div class="login-card">
          <!-- Logo y título -->
          <div class="brand-header">
            <router-link to="/" class="brand-link">
              <span class="brand-icon">🌿</span>
              <span class="brand-name">EcoTurismo</span>
            </router-link>
            <h1 class="login-title">Bienvenido de vuelta</h1>
            <p class="login-subtitle">Ingresa a tu cuenta para continuar</p>
          </div>

          <!-- Formulario -->
          <form @submit.prevent="handleLogin" class="login-form" novalidate>
            <!-- Campo Email -->
            <div class="form-group" :class="{ 'has-error': errors.email }">
              <label for="email" class="form-label">
                <span class="label-icon">📧</span>
                Correo electrónico
              </label>
              <div class="input-wrapper">
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  required
                  placeholder="tu@ejemplo.com"
                  :class="{ 'error': errors.email }"
                  aria-describedby="email-error"
                  @blur="validateEmail"
                  @input="clearError('email')"
                />
                <div class="input-focus-ring"></div>
              </div>
              <div v-if="errors.email" id="email-error" class="error-message">
                <span class="error-icon">⚠️</span>
                {{ errors.email }}
              </div>
            </div>

            <!-- Campo Contraseña -->
            <div class="form-group" :class="{ 'has-error': errors.password }">
              <label for="password" class="form-label">
                <span class="label-icon">🔒</span>
                Contraseña
              </label>
              <div class="input-wrapper">
                <input
                  :id="showPassword ? 'text' : 'password'"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  placeholder="Ingresa tu contraseña"
                  :class="{ 'error': errors.password }"
                  aria-describedby="password-error"
                  @blur="validatePassword"
                  @input="clearError('password')"
                />
                <button 
                  type="button"
                  class="toggle-password"
                  @click="togglePasswordVisibility"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
                <div class="input-focus-ring"></div>
              </div>
              <div v-if="errors.password" id="password-error" class="error-message">
                <span class="error-icon">⚠️</span>
                {{ errors.password }}
              </div>
            </div>

            <!-- Opciones adicionales -->
            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="rememberMe">
                <span class="checkmark"></span>
                <span class="checkbox-text">Recordarme</span>
              </label>
              <router-link to="/forgot-password" class="forgot-link">
                ¿Olvidaste tu contraseña?
              </router-link>
            </div>

            <!-- Mensaje de error general -->
            <div v-if="authStore.error" class="alert-error">
              <span class="alert-icon">❌</span>
              <span>{{ authStore.error }}</span>
            </div>

            <!-- Botón submit -->
            <button type="submit" class="btn-login" :disabled="authStore.loading">
              <span v-if="!authStore.loading" class="btn-text">
                Iniciar Sesión
                <span class="btn-arrow">→</span>
              </span>
              <span v-else class="btn-loader">
                <span class="spinner"></span>
                Iniciando sesión...
              </span>
            </button>

            <!-- Separador social -->
            <div class="divider">
              <span class="divider-line"></span>
              <span class="divider-text">o continúa con</span>
              <span class="divider-line"></span>
            </div>

            <!-- Botones sociales (opcional - para futura implementación) -->
            <div class="social-buttons">
              <button type="button" class="social-btn google" @click="socialLogin('google')" disabled>
                <span class="social-icon">G</span>
                <span>Google</span>
              </button>
              <button type="button" class="social-btn facebook" @click="socialLogin('facebook')" disabled>
                <span class="social-icon">f</span>
                <span>Facebook</span>
              </button>
            </div>
          </form>

          <!-- Link a registro -->
          <div class="register-prompt">
            <p>
              ¿No tienes cuenta?
              <router-link to="/register" class="register-link">
                Regístrate aquí
                <span class="link-arrow">→</span>
              </router-link>
            </p>
          </div>
        </div>
      </div>

      <!-- Columna derecha - Hero / Beneficios -->
      <div class="login-hero">
        <div class="hero-content">
          <div class="hero-badge">
            <span>🌿 Turismo Sostenible</span>
          </div>
          <h2 class="hero-title">Conecta con la naturaleza</h2>
          <p class="hero-text">
            Descubre alojamientos únicos, experiencias auténticas y comunidades locales comprometidas con el medio ambiente.
          </p>
          
          <div class="hero-features">
            <div class="hero-feature">
              <span class="feature-icon">🏡</span>
              <div>
                <strong>+500</strong>
                <span>Alojamientos rurales</span>
              </div>
            </div>
            <div class="hero-feature">
              <span class="feature-icon">⭐</span>
              <div>
                <strong>4.8</strong>
                <span>Calificación promedio</span>
              </div>
            </div>
            <div class="hero-feature">
              <span class="feature-icon">🌍</span>
              <div>
                <strong>+50</strong>
                <span>Destinos en Colombia</span>
              </div>
            </div>
          </div>

          <div class="hero-quote">
            <p>"La mejor plataforma para encontrar experiencias ecoturísticas auténticas"</p>
            <div class="quote-author">
              <span>— María Gómez</span>
              <span class="quote-rating">⭐⭐⭐⭐⭐</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Demo credentials toast -->
    <div v-if="showDemoToast" class="demo-toast">
      <span class="toast-icon">🔐</span>
      <div class="toast-content">
        <strong>Credenciales de demostración</strong>
        <p>Email: anfitrion@example.com / Contraseña: 123456</p>
      </div>
      <button class="toast-close" @click="showDemoToast = false">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Form fields
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);
const showDemoToast = ref(false);

// Validation errors
const errors = ref({
  email: '',
  password: ''
});

// Validation functions
const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value) {
    errors.value.email = 'El correo electrónico es requerido';
  } else if (!emailRegex.test(email.value)) {
    errors.value.email = 'Ingresa un correo electrónico válido';
  } else {
    errors.value.email = '';
  }
};

const validatePassword = () => {
  if (!password.value) {
    errors.value.password = 'La contraseña es requerida';
  } else if (password.value.length < 6) {
    errors.value.password = 'La contraseña debe tener al menos 6 caracteres';
  } else {
    errors.value.password = '';
  }
};

const clearError = (field: string) => {
  errors.value[field as keyof typeof errors.value] = '';
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const handleLogin = async () => {
  // Validate all fields
  validateEmail();
  validatePassword();

  // Check if any errors
  if (errors.value.email || errors.value.password) {
    return;
  }

  const success = await authStore.login(email.value, password.value);
  
  if (success) {
    // Redirigir según el rol del usuario
    const role = authStore.user?.role;
    if (role === 'anfitrion') {
      router.push('/dashboard');
    } else if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  }
};

const socialLogin = (provider: string) => {
  console.log(`Login con ${provider} - Próximamente disponible`);
};

// Mostrar toast de demo después de unos segundos
onMounted(() => {
  setTimeout(() => {
    showDemoToast.value = true;
  }, 3000);

  // Auto-fill demo credentials (solo en desarrollo)
  if (import.meta.env.DEV) {
    email.value = 'anfitrion@example.com';
    password.value = '123456';
  }
});
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-container {
  max-width: 1200px;
  width: 100%;
  display: flex;
  background: white;
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  min-height: 600px;
}

/* Columna del formulario */
.login-form-wrapper {
  flex: 1;
  padding: 3rem;
  background: white;
}

.login-card {
  max-width: 400px;
  margin: 0 auto;
}

/* Brand header */
.brand-header {
  text-align: center;
  margin-bottom: 2rem;
}

.brand-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.brand-icon {
  font-size: 2rem;
}

.brand-name {
  background: linear-gradient(135deg, #2e7d32, #4caf50);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.login-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #202124;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: #5f6368;
  font-size: 0.9rem;
}

/* Formulario */
.login-form {
  margin-top: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #202124;
  font-size: 0.875rem;
}

.label-icon {
  font-size: 1rem;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  background: white;
  outline: none;
}

.input-wrapper input:focus {
  border-color: #2e7d32;
}

.input-wrapper input.error {
  border-color: #e74c3c;
}

.input-focus-ring {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: #2e7d32;
  transition: all 0.2s;
}

.input-wrapper input:focus ~ .input-focus-ring {
  width: 100%;
  left: 0;
}

.toggle-password {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.toggle-password:hover {
  opacity: 1;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #e74c3c;
}

.error-icon {
  font-size: 0.75rem;
}

/* Form options */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  user-select: none;
}

.checkbox-label input {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #dadce0;
  border-radius: 4px;
  display: inline-block;
  position: relative;
  transition: all 0.2s;
}

.checkbox-label input:checked + .checkmark {
  background-color: #2e7d32;
  border-color: #2e7d32;
}

.checkbox-label input:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 11px;
}

.checkbox-text {
  color: #5f6368;
}

.forgot-link {
  color: #2e7d32;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.forgot-link:hover {
  text-decoration: underline;
}

/* Alert error */
.alert-error {
  background: #fee;
  border-left: 4px solid #e74c3c;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #c0392b;
}

.alert-icon {
  font-size: 1rem;
}

/* Botón login */
.btn-login {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #2e7d32, #4caf50);
  color: white;
  border: none;
  border-radius: 40px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 1.5rem;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46,125,50,0.3);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-text {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-arrow {
  transition: transform 0.2s;
}

.btn-login:hover .btn-arrow {
  transform: translateX(4px);
}

.btn-loader {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}

.divider-text {
  padding: 0 1rem;
  font-size: 0.75rem;
  color: #9e9e9e;
}

/* Social buttons */
.social-buttons {
  display: flex;
  gap: 1rem;
}

.social-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 40px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.6;
}

.social-btn:hover:not(:disabled) {
  background: #f5f5f5;
  transform: translateY(-2px);
}

.social-btn:disabled {
  cursor: not-allowed;
}

.social-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.social-btn.google .social-icon {
  color: #ea4335;
}

.social-btn.facebook .social-icon {
  color: #1877f2;
}

/* Register prompt */
.register-prompt {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
  color: #5f6368;
  font-size: 0.9rem;
}

.register-link {
  color: #2e7d32;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: gap 0.2s;
}

.register-link:hover {
  gap: 8px;
}

.link-arrow {
  transition: transform 0.2s;
}

.register-link:hover .link-arrow {
  transform: translateX(4px);
}

/* Columna hero - Lado derecho */
.login-hero {
  flex: 1;
  background: linear-gradient(135deg, #1a5f2a 0%, #0d3b1a 100%);
  color: white;
  padding: 3rem;
  display: flex;
  align-items: center;
}

.hero-content {
  max-width: 400px;
}

.hero-badge {
  display: inline-block;
  padding: 6px 12px;
  background: rgba(255,255,255,0.2);
  border-radius: 40px;
  font-size: 0.75rem;
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-text {
  font-size: 0.95rem;
  opacity: 0.9;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.hero-features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.hero-feature {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255,255,255,0.1);
  border-radius: 16px;
}

.hero-feature .feature-icon {
  font-size: 1.5rem;
}

.hero-feature strong {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
}

.hero-feature span {
  font-size: 0.8rem;
  opacity: 0.9;
}

.hero-quote {
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.2);
}

.hero-quote p {
  font-style: italic;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.quote-author {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  opacity: 0.8;
}

.quote-rating {
  color: #ffc107;
}

/* Demo toast */
.demo-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 320px;
  animation: slideIn 0.3s ease-out;
  z-index: 1000;
  border-left: 4px solid #2e7d32;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-icon {
  font-size: 1.5rem;
}

.toast-content strong {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 4px;
}

.toast-content p {
  font-size: 0.7rem;
  color: #666;
}

.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #999;
}

/* Responsive */
@media (max-width: 968px) {
  .login-container {
    flex-direction: column;
    max-width: 500px;
    margin: 1rem;
  }

  .login-form-wrapper {
    padding: 2rem;
  }

  .login-hero {
    display: none;
  }

  .demo-toast {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .login-form-wrapper {
    padding: 1.5rem;
  }

  .login-title {
    font-size: 1.5rem;
  }

  .form-options {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .social-buttons {
    flex-direction: column;
  }
}
</style>