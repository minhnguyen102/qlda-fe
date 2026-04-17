<template>
  <div class="login-wrapper">
    <div class="login-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>
    
    <div class="login-card shadow-premium">
      <div class="card-header">
        <div class="brand-logo">H</div>
        <h1>HiNET Management</h1>
        <p class="subtitle">Số hóa & Thông minh hóa quy trình dự án</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email Công Việc</label>
          <div class="input-wrapper">
            <span class="input-icon">✉️</span>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="name@hinet.com"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Mật Khẩu</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          <span v-if="loading">Đang xác thực...</span>
          <span v-else>Đăng Nhập Hệ Thống</span>
        </button>

        <p v-if="error" class="error-message">{{ error }}</p>
      </form>

      <div class="demo-section">
        <p class="demo-label">Tài khoản trải nghiệm:</p>
        <div class="demo-grid">
          <div class="demo-item" title="Click to copy" @click="fillDemo('admin@hineet.com')">
            <span class="d-role">Admin:</span> admin@hineet.com
          </div>
          <div class="demo-item" title="Click to copy" @click="fillDemo('pm@hineet.com')">
            <span class="d-role">PM:</span> pm@hineet.com
          </div>
        </div>
      </div>
      
      <div class="card-footer">
        <p>&copy; 2024 HiNET Project Management Systems</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/services/mockApiService';

const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const fillDemo = (demoEmail: string) => {
  email.value = demoEmail;
  password.value = 'password123';
};

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  try {
    const response = await authService.login(email.value, password.value);
    
    // Store token, user and role in localStorage
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('userRole', response.user.role);
    localStorage.setItem('userId', response.user.id);
    
    router.push('/dashboard');
  } catch (err: any) {
    error.value = 'Thông tin đăng nhập không chính xác. Vui lòng thử lại.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-wrapper {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  overflow: hidden;
  padding: 24px;
}

.login-background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.blob {
  position: absolute;
  filter: blur(80px);
  border-radius: 50%;
  opacity: 0.4;
}

.blob-1 {
  width: 400px;
  height: 400px;
  background: var(--primary);
  top: -100px;
  left: -100px;
}

.blob-2 {
  width: 300px;
  height: 300px;
  background: var(--secondary);
  bottom: -50px;
  right: -50px;
}

.login-card {
  position: relative;
  z-index: 10;
  background: white;
  width: 100%;
  max-width: 440px;
  padding: 48px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
}

.card-header {
  text-align: center;
  margin-bottom: 40px;
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

.login-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
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
}

.input-wrapper input {
  width: 100%;
  padding: 12px 12px 12px 42px;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.2s;
  background: #f1f5f9;
}

.input-wrapper input:focus {
  outline: none;
  background: white;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.btn-block {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 700;
  margin-top: 12px;
}

.error-message {
  color: var(--danger);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  margin-top: 16px;
  padding: 8px;
  background: #FEF2F2;
  border-radius: 8px;
}

.demo-section {
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.demo-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.demo-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-item {
  font-size: 13px;
  color: var(--text-main);
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.demo-item:hover {
  background: #eff6ff;
  border-color: var(--primary);
  color: var(--primary);
}

.d-role {
  font-weight: 700;
  color: var(--text-muted);
  margin-right: 4px;
}

.card-footer {
  margin-top: 40px;
  text-align: center;
}

.card-footer p {
  font-size: 11px;
  color: var(--text-muted);
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }
}
</style>
