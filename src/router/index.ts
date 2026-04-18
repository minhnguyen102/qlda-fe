import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/pages/LoginPage.vue'
import RegisterPage from '@/pages/RegisterPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import ProjectsPage from '@/pages/ProjectsPage.vue'
import ProjectDetailPage from '@/pages/ProjectDetailPage.vue'
import TasksPage from '@/pages/TasksPage.vue'
import RiskAlertPage from '@/pages/RiskAlertPage.vue'
import ReportsPage from '@/pages/ReportsPage.vue'
import ProfilePage from '@/pages/ProfilePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'Login', component: LoginPage, meta: { requiresAuth: false, layout: 'blank' } },
    { path: '/register', name: 'Register', component: RegisterPage, meta: { requiresAuth: false, layout: 'blank' } },
    { path: '/dashboard', name: 'Dashboard', component: DashboardPage, meta: { requiresAuth: true } },
    { path: '/projects', name: 'Projects', component: ProjectsPage, meta: { requiresAuth: true } },
    { path: '/projects/:id', name: 'ProjectDetail', component: ProjectDetailPage, meta: { requiresAuth: true } },
    { path: '/tasks', name: 'Tasks', component: TasksPage, meta: { requiresAuth: true } },
    { path: '/alerts', name: 'RiskAlerts', component: RiskAlertPage, meta: { requiresAuth: true } },
    { path: '/reports', name: 'Reports', component: ReportsPage, meta: { requiresAuth: true } },
    { path: '/profile', name: 'Profile', component: ProfilePage, meta: { requiresAuth: true } },
    { path: '/', redirect: '/dashboard' },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth && !token) next('/login')
  else if (to.path === '/login' && token) next('/dashboard')
  else if (to.path === '/register' && token) next('/dashboard')
  else next()
})

export default router
