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
          path: 'modules/new',
          name: 'module-new',
          component: () => import('../components/forms/ModuleForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'modules/:id',
          name: 'module-edit',
          component: () => import('../components/forms/ModuleForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'languages',
          name: 'languages',
          component: () => import('../views/LanguagesView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'languages/new',
          name: 'language-new',
          component: () => import('../components/forms/LanguageForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'languages/:id',
          name: 'language-edit',
          component: () => import('../components/forms/LanguageForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'labels',
          name: 'labels',
          component: () => import('../views/LabelsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'labels/new',
          name: 'label-new',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'labels/:id',
          name: 'label-edit',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'roles/new',
          name: 'role-new',
          component: () => import('../components/forms/RoleForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'roles/:id',
          name: 'role-edit',
          component: () => import('../components/forms/RoleForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'tags/new',
          name: 'tag-new',
          component: () => import('../components/forms/TagForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'tags/:id',
          name: 'tag-edit',
          component: () => import('../components/forms/TagForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'users/new',
          name: 'user-new',
          component: () => import('../components/forms/UserForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'users/:id',
          name: 'user-edit',
          component: () => import('../components/forms/UserForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'genres',
          name: 'genres',
          component: () => import('../views/GenresView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'genres/new',
          name: 'genre-new',
          component: () => import('../components/forms/GenreForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'genres/:id',
          name: 'genre-edit',
          component: () => import('../components/forms/GenreForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'agreements',
          name: 'agreements',
          component: () => import('../views/AgreementsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'agreements/new',
          name: 'agreement-new',
          component: () => import('../components/forms/AgreementForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'agreements/:id',
          name: 'agreement-edit',
          component: () => import('../components/forms/AgreementForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'consents',
          name: 'consents',
          component: () => import('../views/ConsentsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'consents/new',
          name: 'consent-new',
          component: () => import('../components/forms/ConsentForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'consents/:id',
          name: 'consent-edit',
          component: () => import('../components/forms/ConsentForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'billings',
          name: 'billings',
          component: () => import('../views/BillingsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'billings/new',
          name: 'billing-new',
          component: () => import('../components/forms/BillingForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'billings/:id',
          name: 'billing-edit',
          component: () => import('../components/forms/BillingForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'subscriptions',
          name: 'subscriptions',
          component: () => import('../views/SubscriptionsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'subscriptions/new',
          name: 'subscription-new',
          component: () => import('../components/forms/SubscriptionForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'subscriptions/:id',
          name: 'subscription-edit',
          component: () => import('../components/forms/SubscriptionForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'subscription-products',
          name: 'subscription-products',
          component: () => import('../views/SubscriptionProductsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'subscription-products/new',
          name: 'subscription-product-new',
          component: () => import('../components/forms/SubscriptionProductForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'subscription-products/:id',
          name: 'subscription-product-edit',
          component: () => import('../components/forms/SubscriptionProductForm.vue'),
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
