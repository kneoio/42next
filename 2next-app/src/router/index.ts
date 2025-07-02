import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'
import DashboardView from '../views/DashboardView.vue'
import UsersView from '../views/UsersView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
      redirect: '/dashboard/users',
      children: [
        {
          path: 'users',
          name: 'users',
          component: UsersView,
          meta: { requiresAuth: true }
        },
        {
          path: 'roles',
          name: 'roles',
          component: () => import('../views/RolesView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'modules',
          name: 'modules',
          component: () => import('../views/ModulesView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'languages',
          name: 'languages',
          component: () => import('../views/LanguagesView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/ProfileView.vue'),
          meta: { requiresAuth: true }
        }
      ]
    }
  ],
})

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Initialize auth if not already done
  if (authStore.isLoading) {
    await authStore.initializeAuth()
  }
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to home page if not authenticated
    next('/')
  } else if (!requiresAuth && authStore.isAuthenticated && to.path === '/') {
    // Redirect to dashboard if already authenticated and trying to access home
    next('/dashboard')
  } else {
    next()
  }
})

export default router
