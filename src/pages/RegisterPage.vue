<template>
  <div class="register-wrapper">
    <div class="register-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="register-card shadow-premium">
      <div class="card-header">
        <div class="brand-logo">H</div>
        <h1>Tạo Tài Khoản</h1>
        <p class="subtitle">Đăng kí để tham gia HiNET Management System</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form" novalidate>
        <!-- Full Name -->
        <div class="form-group" :class="{ 'has-error': fieldErrors.fullName }">
          <label for="fullName">Họ và Tên</label>
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <input
              id="fullName"
              v-model="fullName"
              type="text"
              placeholder="Nguyễn Văn A"
              autocomplete="name"
              @blur="validateFullName"
              @input="fieldErrors.fullName = ''"
            />
          </div>
          <span v-if="fieldErrors.fullName" class="field-error">{{ fieldErrors.fullName }}</span>
        </div>

        <!-- Email -->
        <div class="form-group" :class="{ 'has-error': fieldErrors.email }">
          <label for="reg-email">Email Công Việc</label>
          <div class="input-wrapper">
            <span class="input-icon">✉️</span>
            <input
              id="reg-email"
              v-model="email"
              type="email"
              placeholder="name@hinet.com"
              autocomplete="email"
              @blur="validateEmail"
              @input="fieldErrors.email = ''"
            />
          </div>
          <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>
        </div>

        <!-- Password -->
        <div class="form-group" :class="{ 'has-error': fieldErrors.password }">
          <label for="reg-password">Mật Khẩu</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              id="reg-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Tối thiểu 6 ký tự"
              autocomplete="new-password"
              @blur="validatePassword"
              @input="fieldErrors.password = ''; validateConfirmPassword()"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              :title="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <div class="password-strength" v-if="password">
            <div class="strength-bar">
              <div class="strength-fill" :class="passwordStrengthClass" :style="{ width: passwordStrengthWidth }"></div>
            </div>
            <span class="strength-label" :class="passwordStrengthClass">{{ passwordStrengthLabel }}</span>
          </div>
          <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
        </div>

        <!-- Confirm Password -->
        <div class="form-group" :class="{ 'has-error': fieldErrors.confirmPassword }">
          <label for="confirm-password">Xác Nhận Mật Khẩu</label>
          <div class="input-wrapper">
            <span class="input-icon">🔐</span>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Nhập lại mật khẩu"
              autocomplete="new-password"
              @blur="validateConfirmPassword"
              @input="fieldErrors.confirmPassword = ''"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showConfirmPassword = !showConfirmPassword"
              :title="showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
            >
              {{ showConfirmPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <span v-if="fieldErrors.confirmPassword" class="field-error">{{ fieldErrors.confirmPassword }}</span>
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          <span v-if="loading" class="loading-spinner">
            <span class="spinner"></span>
            Đang xử lý...
          </span>
          <span v-else>Tạo Tài Khoản</span>
        </button>

        <p v-if="globalError" class="error-message">{{ globalError }}</p>
        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
      </form>

      <div class="card-footer">
        <p>Đã có tài khoản? <router-link to="/login" class="link-primary">Đăng nhập ngay</router-link></p>
        <p class="copy">&copy; 2024 HiNET Project Management Systems</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/services/mockApiService';

const router = useRouter();

// Form fields
const fullName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// State
const loading = ref(false);
const globalError = ref('');
const successMessage = ref('');

// Field-level errors
const fieldErrors = ref<Record<string, string>>({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
});

// Password strength
const passwordStrengthScore = computed(() => {
  const p = password.value;
  if (!p) return 0;
  let score = 0;
  if (p.length >= 6) score++;
  if (p.length >= 10) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return score;
});

const passwordStrengthClass = computed(() => {
  const score = passwordStrengthScore.value;
  if (score <= 1) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
});

const passwordStrengthWidth = computed(() => {
  return `${(passwordStrengthScore.value / 5) * 100}%`;
});

const passwordStrengthLabel = computed(() => {
  const score = passwordStrengthScore.value;
  if (score <= 1) return 'Yếu';
  if (score <= 3) return 'Trung bình';
  return 'Mạnh';
});

// --- Validators ---
const validateFullName = () => {
  if (!fullName.value.trim()) {
    fieldErrors.value.fullName = 'Họ và tên là bắt buộc';
    return false;
  }
  if (fullName.value.trim().length < 2) {
    fieldErrors.value.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
    return false;
  }
  fieldErrors.value.fullName = '';
  return true;
};

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim()) {
    fieldErrors.value.email = 'Email là bắt buộc';
    return false;
  }
  if (!emailRegex.test(email.value.trim())) {
    fieldErrors.value.email = 'Email không đúng định dạng (vd: name@hinet.com)';
    return false;
  }
  fieldErrors.value.email = '';
  return true;
};

const validatePassword = () => {
  if (!password.value) {
    fieldErrors.value.password = 'Mật khẩu là bắt buộc';
    return false;
  }
  if (password.value.length < 6) {
    fieldErrors.value.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    return false;
  }
  fieldErrors.value.password = '';
  return true;
};

const validateConfirmPassword = () => {
  if (!confirmPassword.value) {
    // Only show error if field has been interacted with
    return false;
  }
  if (confirmPassword.value !== password.value) {
    fieldErrors.value.confirmPassword = 'Mật khẩu xác nhận không khớp';
    return false;
  }
  fieldErrors.value.confirmPassword = '';
  return true;
};

const validateAll = () => {
  const v1 = validateFullName();
  const v2 = validateEmail();
  const v3 = validatePassword();
  // Validate confirm password separately to always check it on submit
  if (!confirmPassword.value) {
    fieldErrors.value.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    return v1 && v2 && v3 && false;
  }
  const v4 = validateConfirmPassword();
  return v1 && v2 && v3 && v4;
};

// --- Submit ---
const handleRegister = async () => {
  globalError.value = '';
  successMessage.value = '';

  if (!validateAll()) return;

  loading.value = true;
  try {
    const response = await authService.register(
      fullName.value.trim(),
      email.value.trim(),
      password.value,
      confirmPassword.value
    );

    // Auto-login after register
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('userRole', response.user.role);
    localStorage.setItem('userId', response.user.id);

    successMessage.value = 'Đăng kí thành công! Đang chuyển hướng...';
    setTimeout(() => router.push('/dashboard'), 1200);
  } catch (err: any) {
    // Check for field-level errors from BE
    const serverErrors = err?.response?.data?.errors || (err as any)?.errors;
    if (serverErrors) {
      if (serverErrors.fullName) fieldErrors.value.fullName = serverErrors.fullName;
      if (serverErrors.email) fieldErrors.value.email = serverErrors.email;
      if (serverErrors.password) fieldErrors.value.password = serverErrors.password;
      if (serverErrors.confirmPassword) fieldErrors.value.confirmPassword = serverErrors.confirmPassword;
    } else {
      globalError.value = err?.message || 'Đăng kí thất bại. Vui lòng thử lại.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-wrapper {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  overflow: hidden;
  padding: 24px;
}

.register-background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.blob {
  position: absolute;
  filter: blur(80px);
  border-radius: 50%;
  opacity: 0.35;
  animation: blobFloat 8s ease-in-out infinite alternate;
}

.blob-1 {
  width: 400px;
  height: 400px;
  background: var(--primary);
  top: -120px;
  left: -100px;
  animation-delay: 0s;
}

.blob-2 {
  width: 300px;
  height: 300px;
  background: var(--secondary);
  bottom: -60px;
  right: -60px;
  animation-delay: 2s;
}

.blob-3 {
  width: 200px;
  height: 200px;
  background: #a855f7;
  bottom: 30%;
  left: 10%;
  animation-delay: 4s;
}

@keyframes blobFloat {
  from { transform: translateY(0) scale(1); }
  to   { transform: translateY(-20px) scale(1.05); }
}

.register-card {
  position: relative;
  z-index: 10;
  background: white;
  width: 100%;
  max-width: 460px;
  padding: 48px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
}

.card-header {
  text-align: center;
  margin-bottom: 36px;
}

.brand-logo {
  width: 48px;
  height: 48px;
  background: var(--primary);
  color: white;
  font-size: 24px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin: 0 auto 16px;
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
}

h1 {
  font-size: 24px;
  font-family: 'Outfit', sans-serif;
  color: var(--text-main);
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.register-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 18px;
  position: relative;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
  font-size: 16px;
  pointer-events: none;
  z-index: 1;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 42px 12px 42px;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.2s;
  background: #f1f5f9;
  outline: none;
}

.input-wrapper input:focus {
  background: white;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.has-error .input-wrapper input {
  border-color: var(--danger, #ef4444);
  background: #fff5f5;
}

.has-error .input-wrapper input:focus {
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  z-index: 1;
}

.toggle-password:hover {
  transform: scale(1.15);
}

.field-error {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--danger, #ef4444);
  font-weight: 500;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Password Strength */
.password-strength {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease, background-color 0.3s ease;
}

.strength-fill.weak   { background-color: #ef4444; }
.strength-fill.medium { background-color: #f59e0b; }
.strength-fill.strong { background-color: #22c55e; }

.strength-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 60px;
  text-align: right;
}
.strength-label.weak   { color: #ef4444; }
.strength-label.medium { color: #f59e0b; }
.strength-label.strong { color: #22c55e; }

.btn-block {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 700;
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: var(--danger, #ef4444);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  margin-top: 16px;
  padding: 10px;
  background: #FEF2F2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.success-message {
  color: #15803d;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  margin-top: 16px;
  padding: 10px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.card-footer {
  margin-top: 8px;
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.card-footer p {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.card-footer .copy {
  font-size: 11px;
  margin-top: 12px;
}

.link-primary {
  color: var(--primary);
  font-weight: 700;
  text-decoration: none;
  transition: opacity 0.2s;
}

.link-primary:hover {
  opacity: 0.8;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .register-card {
    padding: 32px 24px;
  }
}
</style>
