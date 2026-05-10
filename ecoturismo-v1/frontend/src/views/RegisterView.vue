<template>
  <div class="register-page">
    <div class="register-container">
      <!-- Columna izquierda - Formulario -->
      <div class="register-form-wrapper">
        <div class="register-card">
          <!-- Logo y título -->
          <div class="brand-header">
            <router-link to="/" class="brand-link">
              <span class="brand-icon">🌿</span>
              <span class="brand-name">EcoTurismo</span>
            </router-link>
            <h1 class="register-title">Crea tu cuenta</h1>
            <p class="register-subtitle">
              Únete a nuestra comunidad de viajeros y anfitriones
            </p>
          </div>

          <!-- Formulario -->
          <form @submit.prevent="handleRegister" class="register-form" novalidate>
            <!-- Nombre completo -->
            <div class="form-group" :class="{ 'has-error': errors.name }">
              <label for="name" class="form-label">
                <span class="label-icon">👤</span>
                Nombre completo
              </label>
              <div class="input-wrapper">
                <input
                  id="name"
                  v-model="name"
                  type="text"
                  required
                  placeholder="Juan Pérez"
                  :class="{ 'error': errors.name }"
                  aria-describedby="name-error"
                  @blur="validateName"
                  @input="clearError('name')"
                />
                <div class="input-focus-ring"></div>
              </div>
              <div v-if="errors.name" id="name-error" class="error-message">
                <span class="error-icon">⚠️</span>
                {{ errors.name }}
              </div>
            </div>

            <!-- Email -->
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

            <!-- Contraseña -->
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
                  placeholder="Crea una contraseña segura"
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
              
              <!-- Fortaleza de contraseña -->
              <div v-if="password" class="password-strength">
                <div class="strength-bars">
                  <div 
                    v-for="i in 4" 
                    :key="i"
                    class="strength-bar"
                    :class="{ active: i <= passwordStrength.level }"
                    :data-level="i"
                  ></div>
                </div>
                <span class="strength-text">{{ passwordStrength.text }}</span>
              </div>
            </div>

            <!-- Confirmar contraseña -->
            <div class="form-group" :class="{ 'has-error': errors.confirmPassword }">
              <label for="confirmPassword" class="form-label">
                <span class="label-icon">✓</span>
                Confirmar contraseña
              </label>
              <div class="input-wrapper">
                <input
                  :id="showConfirmPassword ? 'text' : 'password'"
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  required
                  placeholder="Repite tu contraseña"
                  :class="{ 'error': errors.confirmPassword }"
                  aria-describedby="confirm-error"
                  @blur="validateConfirmPassword"
                  @input="clearError('confirmPassword')"
                />
                <button 
                  type="button"
                  class="toggle-password"
                  @click="toggleConfirmPasswordVisibility"
                  :aria-label="showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
                <div class="input-focus-ring"></div>
              </div>
              <div v-if="errors.confirmPassword" id="confirm-error" class="error-message">
                <span class="error-icon">⚠️</span>
                {{ errors.confirmPassword }}
              </div>
            </div>

            <!-- Tipo de cuenta -->
            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">🏷️</span>
                Tipo de cuenta
              </label>
              <div class="role-selector">
                <div 
                  class="role-card"
                  :class="{ active: role === 'turista' }"
                  @click="role = 'turista'"
                >
                  <span class="role-icon">🌍</span>
                  <div class="role-info">
                    <strong>Turista</strong>
                    <small>Busco experiencias y alojamientos</small>
                  </div>
                  <span class="role-check" v-if="role === 'turista'">✓</span>
                </div>
                <div 
                  class="role-card"
                  :class="{ active: role === 'anfitrion' }"
                  @click="role = 'anfitrion'"
                >
                  <span class="role-icon">🏠</span>
                  <div class="role-info">
                    <strong>Anfitrión</strong>
                    <small>Ofrezco alojamiento o experiencias</small>
                  </div>
                  <span class="role-check" v-if="role === 'anfitrion'">✓</span>
                </div>
              </div>
            </div>

            <!-- Teléfono (opcional) -->
            <div class="form-group">
              <label for="phone" class="form-label">
                <span class="label-icon">📱</span>
                Teléfono
                <span class="optional">(Opcional)</span>
              </label>
              <div class="input-wrapper">
                <input
                  id="phone"
                  v-model="phone"
                  type="tel"
                  placeholder="+57 300 123 4567"
                  @input="formatPhone"
                />
                <div class="input-focus-ring"></div>
              </div>
              <small class="field-hint">
                Solo lo usaremos para contactarte sobre tus reservas
              </small>
            </div>

            <!-- Términos y condiciones -->
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="acceptTerms">
                <span class="checkmark"></span>
                <span class="checkbox-text">
                  Acepto los 
                  <a href="#" @click.prevent="showTerms = true">términos y condiciones</a>
                  y la 
                  <a href="#" @click.prevent="showPrivacy = true">política de privacidad</a>
                </span>
              </label>
              <div v-if="errors.terms" class="error-message">
                <span class="error-icon">⚠️</span>
                {{ errors.terms }}
              </div>
            </div>

            <!-- Mensaje de error general -->
            <div v-if="authStore.error" class="alert-error">
              <span class="alert-icon">❌</span>
              <span>{{ authStore.error }}</span>
            </div>

            <!-- Botón submit -->
            <button type="submit" class="btn-register" :disabled="authStore.loading || !acceptTerms">
              <span v-if="!authStore.loading" class="btn-text">
                Crear cuenta
                <span class="btn-arrow">→</span>
              </span>
              <span v-else class="btn-loader">
                <span class="spinner"></span>
                Creando cuenta...
              </span>
            </button>
          </form>

          <!-- Link a login -->
          <div class="login-prompt">
            <p>
              ¿Ya tienes cuenta?
              <router-link to="/login" class="login-link">
                Inicia sesión aquí
                <span class="link-arrow">→</span>
              </router-link>
            </p>
          </div>
        </div>
      </div>

      <!-- Columna derecha - Beneficios -->
      <div class="register-hero">
        <div class="hero-content">
          <div class="hero-badge">
            <span>✨ Beneficios exclusivos</span>
          </div>
          <h2 class="hero-title">Únete a la comunidad</h2>
          <p class="hero-text">
            Sé parte de una red que promueve el turismo sostenible y conecta viajeros con experiencias auténticas.
          </p>
          
          <div class="benefits-list">
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span>Acceso a alojamientos exclusivos</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span>Reservas seguras sin comisiones ocultas</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span>Soporte prioritario 24/7</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✓</span>
              <span>Programa de recompensas para viajeros frecuentes</span>
            </div>
          </div>

          <div class="hero-stat">
            <div class="stat-number">+500</div>
            <div class="stat-label">Alojamientos registrados</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de términos y condiciones -->
    <div v-if="showTerms" class="modal-overlay" @click.self="showTerms = false">
      <div class="modal-content">
        <h3>Términos y condiciones</h3>
        <div class="modal-body">
          <p>Al registrarte en EcoTurismo Experiencial, aceptas:</p>
          <ul>
            <li>Proporcionar información veraz y actualizada</li>
            <li>Ser responsable de la seguridad de tu cuenta</li>
            <li>Cumplir con las políticas de cancelación de cada propiedad</li>
            <li>Tratar con respeto a anfitriones y otros viajeros</li>
            <li>No utilizar la plataforma para fines ilegales</li>
          </ul>
          <p>EcoTurismo se reserva el derecho de suspender cuentas que violen estos términos.</p>
        </div>
        <button class="modal-close-btn" @click="showTerms = false">Entendido</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Form fields
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const role = ref('turista');
const phone = ref('');
const acceptTerms = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const showTerms = ref(false);
const showPrivacy = ref(false);

// Validation errors
const errors = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  terms: ''
});

// Password strength
const passwordStrength = computed(() => {
  const pwd = password.value;
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

// Validations
const validateName = () => {
  if (!name.value) {
    errors.value.name = 'El nombre es requerido';
  } else if (name.value.length < 2) {
    errors.value.name = 'Ingresa al menos 2 caracteres';
  } else if (name.value.length > 50) {
    errors.value.name = 'El nombre es demasiado largo';
  } else {
    errors.value.name = '';
  }
};

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
  } else if (!/[A-Za-z]/.test(password.value)) {
    errors.value.password = 'Debe contener al menos una letra';
  } else if (!/\d/.test(password.value)) {
    errors.value.password = 'Debe contener al menos un número';
  } else {
    errors.value.password = '';
  }
};

const validateConfirmPassword = () => {
  if (!confirmPassword.value) {
    errors.value.confirmPassword = 'Confirma tu contraseña';
  } else if (confirmPassword.value !== password.value) {
    errors.value.confirmPassword = 'Las contraseñas no coinciden';
  } else {
    errors.value.confirmPassword = '';
  }
};

const validateTerms = () => {
  if (!acceptTerms.value) {
    errors.value.terms = 'Debes aceptar los términos y condiciones';
  } else {
    errors.value.terms = '';
  }
};

const clearError = (field: string) => {
  errors.value[field as keyof typeof errors.value] = '';
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

const formatPhone = () => {
  // Limpiar y formatear número de teléfono
  let cleaned = phone.value.replace(/\D/g, '');
  if (cleaned.length > 10) {
    cleaned = cleaned.slice(0, 10);
  }
  phone.value = cleaned;
};

const handleRegister = async () => {
  // Validate all fields
  validateName();
  validateEmail();
  validatePassword();
  validateConfirmPassword();
  validateTerms();

  // Check if any errors
  if (Object.values(errors.value).some(error => error)) {
    return;
  }

  const success = await authStore.register({
    name: name.value,
    email: email.value,
    password: password.value,
    role: role.value,
    phone: phone.value
  });
  
  if (success) {
    const userRole = authStore.user?.role;
    if (userRole === 'anfitrion') {
      router.push('/properties/create');
    } else {
      router.push('/');
    }
  }
};

// Auto-fill demo (solo desarrollo)
if (import.meta.env.DEV) {
  name.value = 'Usuario Demo';
  email.value = 'demo@example.com';
  password.value = 'demo123';
  confirmPassword.value = 'demo123';
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.register-container {
  max-width: 1200px;
  width: 100%;
  display: flex;
  background: white;
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  min-height: 700px;
}

/* Columna del formulario */
.register-form-wrapper {
  flex: 1;
  padding: 3rem;
  background: white;
  overflow-y: auto;
}

.register-card {
  max-width: 480px;
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
  margin-bottom: 1rem;
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

.register-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #202124;
  margin-bottom: 0.5rem;
}

.register-subtitle {
  color: #5f6368;
  font-size: 0.9rem;
}

/* Formulario */
.register-form {
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

.optional {
  font-weight: normal;
  font-size: 0.7rem;
  color: #9e9e9e;
  margin-left: 4px;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input, .input-wrapper select {
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

.field-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: #9e9e9e;
}

/* Password strength */
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
  background: #e0e0e0;
  border-radius: 2px;
  transition: all 0.2s;
}

.strength-bar.active[data-level="1"] { background: #e74c3c; }
.strength-bar.active[data-level="2"] { background: #ff9800; }
.strength-bar.active[data-level="3"] { background: #2196f3; }
.strength-bar.active[data-level="4"] { background: #4caf50; }

.strength-text {
  font-size: 0.7rem;
  color: #9e9e9e;
}

/* Role selector */
.role-selector {
  display: flex;
  gap: 1rem;
}

.role-card {
  flex: 1;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.role-card:hover {
  border-color: #2e7d32;
  background: #f1f8e9;
}

.role-card.active {
  border-color: #2e7d32;
  background: #e8f5e9;
}

.role-icon {
  font-size: 2rem;
}

.role-info strong {
  display: block;
  font-size: 0.9rem;
}

.role-info small {
  font-size: 0.7rem;
  color: #9e9e9e;
}

.role-check {
  position: absolute;
  top: 8px;
  right: 12px;
  color: #2e7d32;
  font-weight: bold;
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #dadce0;
  border-radius: 6px;
  display: inline-block;
  position: relative;
  flex-shrink: 0;
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
  font-size: 12px;
}

.checkbox-text {
  font-size: 0.8rem;
  color: #5f6368;
}

.checkbox-text a {
  color: #2e7d32;
  text-decoration: none;
}

.checkbox-text a:hover {
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

/* Botón registro */
.btn-register {
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
  margin-top: 1rem;
}

.btn-register:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46,125,50,0.3);
}

.btn-register:disabled {
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

.btn-register:hover .btn-arrow {
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

/* Login prompt */
.login-prompt {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
  color: #5f6368;
  font-size: 0.9rem;
}

.login-link {
  color: #2e7d32;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: gap 0.2s;
}

.login-link:hover {
  gap: 8px;
}

.link-arrow {
  transition: transform 0.2s;
}

.login-link:hover .link-arrow {
  transform: translateX(4px);
}

/* Columna hero - Lado derecho */
.register-hero {
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

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.benefit-icon {
  width: 24px;
  height: 24px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.hero-stat {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.2);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffc107;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.9;
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
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 1rem;
}

.modal-body {
  margin-bottom: 1.5rem;
}

.modal-body ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.modal-body li {
  margin: 0.5rem 0;
}

.modal-close-btn {
  width: 100%;
  padding: 0.75rem;
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 968px) {
  .register-container {
    flex-direction: column;
    max-width: 550px;
    margin: 1rem;
  }

  .register-form-wrapper {
    padding: 2rem;
  }

  .register-hero {
    display: none;
  }

  .role-selector {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .register-form-wrapper {
    padding: 1.5rem;
  }

  .register-title {
    font-size: 1.5rem;
  }

  .register-subtitle {
    font-size: 0.8rem;
  }
}
</style>