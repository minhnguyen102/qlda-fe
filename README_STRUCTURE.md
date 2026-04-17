# HiNET Project Management System - Frontend Structure

## 📁 Folder Organization

```
src/
├── components/          # Reusable UI components
├── pages/              # Page/container components (routed)
│   ├── LoginPage.vue
│   ├── DashboardPage.vue
│   ├── ProjectsPage.vue
│   ├── TasksPage.vue
│   └── RiskAlertPage.vue
├── services/           # API & business logic
│   └── mockApiService.ts
├── types/              # TypeScript interfaces
│   └── index.ts
├── mocks/              # Mock data for development
│   └── mockData.ts
├── router/             # Vue Router configuration
│   └── index.ts
├── stores/             # Pinia stores (state management)
├── utils/              # Utility functions
├── App.vue             # Root component with sidebar
├── main.ts             # Application entry point
└── index.html
```

## 🗂️ Folder Descriptions

### `/pages` - Page Components
- **LoginPage.vue** - Authentication entry point (blank layout)
- **DashboardPage.vue** - Dashboard with stats & overview
- **ProjectsPage.vue** - Manage Projects with CRUD & AI classification
- **TasksPage.vue** - Manage Tasks with filtering & status updates
- **RiskAlertPage.vue** - Risk alerts & project risk assessment

### `/services` - API Services
- **mockApiService.ts** - Mock API with simulated delays
  - `authService` - Login/Logout
  - `projectService` - Project CRUD + AI classification
  - `taskService` - Task CRUD
  - `dashboardService` - Dashboard stats
  - `riskAlertService` - Risk alerts & evaluation
  - `userService` - User management

### `/types` - TypeScript Definitions
- **index.ts** - All interfaces:
  - `User`, `AuthResponse`
  - `Project`, `Task`
  - `DashboardStats`, `RiskAlert`

### `/mocks` - Mock Data
- **mockData.ts** - Sample data for development
  - 5 Mock Users (Admin, PM, 3 Members)
  - 3 Mock Projects with AI classification
  - 5 Mock Tasks with various statuses
  - Mock Risk Alerts
  - Mock Dashboard Stats

## 🚀 Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Demo Credentials

Mật khẩu chung cho mọi tài khoản seed: `password123`

| Role              | Email                | Tên hiển thị     | Quyền chính                                                                 |
| ----------------- | -------------------- | ---------------- | --------------------------------------------------------------------------- |
| ADMIN             | `admin@hineet.com`   | Nguyễn Văn A     | Toàn quyền: CRUD user/project/task, xoá project, xem báo cáo                |
| PROJECT_MANAGER   | `pm@hineet.com`      | Trần Thị B       | Tạo/sửa project & task, xem báo cáo, giải quyết cảnh báo (không xoá project)|
| MEMBER            | `dev1@hineet.com`    | Lê Văn C         | Xem project/task, cập nhật tiến độ task được giao (không tạo/xoá)           |
| MEMBER            | `dev2@hineet.com`    | Phạm Thị D       | Như trên                                                                    |
| MEMBER            | `dev3@hineet.com`    | Hoàng Văn E      | Như trên                                                                    |

> Chạy `node seed.js` trong thư mục `backend/` để tạo lại các tài khoản trên.

## 🎨 Key Features

### 1. **Authentication**
- Login page with demo credentials
- JWT token storage (mock)
- Route protection via navigation guards

### 2. **Dashboard**
- Project statistics
- Recent tasks & risks
- Quick overview

### 3. **Project Management**
- Create/Edit projects
- **AI Classification** (scale, complexity → category)
- **Risk Scoring** (AI-powered prediction)
- Progress tracking

### 4. **Task Management**
- CRUD operations
- Status workflow (TODO → IN_PROGRESS → REVIEW → DONE)
- Progress percentage tracking
- Filter by status/project

### 5. **Risk Alerts**
- High/Medium/Low severity levels
- Risk score visualization
- Recommendations based on progress
- Mark as resolved

## 📊 Mock API Delays
All API calls include simulated delays (500ms default, 1000ms for AI operations) to simulate real backend behavior.

## 🔐 Security Notes
- Mock tokens using UUID format
- Passwords are NOT validated (demo only)
- Token stored in localStorage (production should use HttpOnly cookies)

## 🎯 Next Steps for Backend Integration
1. Replace `mockApiService.ts` with real API calls
2. Implement JWT algorithm for token generation
3. Add real database operations
4. Integrate AI classification model
5. Add real risk evaluation algorithm

## 📝 Component Naming Convention
- Pages: `{Feature}Page.vue`
- Components: `{ComponentName}.vue`
- Services: `{domain}Service.ts`
- Types: Use interfaces in `/types/index.ts`

---

**Version**: 1.0.0 (MVP)
**Last Updated**: 2024
