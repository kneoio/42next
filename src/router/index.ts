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
          redirect: '/dashboard/labels/sound-fragment',
          meta: { requiresAuth: true }
        },
        {
          path: 'labels/sound-fragment',
          name: 'labels-sound-fragment',
          component: () => import('../views/labels/SoundFragmentLabelsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'labels/sound-fragment/new',
          name: 'label-sound-fragment-new',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'labels/sound-fragment/:id',
          name: 'label-sound-fragment-edit',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'labels/script',
          name: 'labels-script',
          component: () => import('../views/labels/ScriptLabelsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'labels/script/new',
          name: 'label-script-new',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'labels/script/:id',
          name: 'label-script-edit',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'labels/ai-agent',
          name: 'labels-ai-agent',
          component: () => import('../views/labels/AiAgentLabelsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'labels/ai-agent/new',
          name: 'label-ai-agent-new',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'labels/ai-agent/:id',
          name: 'label-ai-agent-edit',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'labels/brand',
          name: 'labels-brand',
          component: () => import('../views/labels/BrandLabelsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'labels/brand/new',
          name: 'label-brand-new',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'labels/brand/:id',
          name: 'label-brand-edit',
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
          path: 'drafts',
          name: 'drafts',
          component: () => import('../views/DraftsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'drafts/new',
          name: 'draft-new',
          component: () => import('../components/forms/DraftForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'drafts/:id',
          name: 'draft-edit',
          component: () => import('../components/forms/DraftForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'prompts',
          name: 'prompts',
          component: () => import('../views/PromptsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'prompts/new',
          name: 'prompt-new',
          component: () => import('../components/forms/PromptForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'prompts/:id',
          name: 'prompt-edit',
          component: () => import('../components/forms/PromptForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'scripts',
          name: 'scripts',
          component: () => import('../views/ScriptsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'scenes',
          name: 'scenes',
          component: () => import('../views/ScenesView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'scripts/new',
          name: 'script-new',
          component: () => import('../components/forms/ScriptForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'scripts/:id',
          name: 'script-edit',
          component: () => import('../components/forms/ScriptForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'ai-agents',
          name: 'ai-agents',
          component: () => import('../views/AiAgentsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'ai-agents/new',
          name: 'ai-agent-new',
          component: () => import('../components/forms/AiAgentForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'ai-agents/:id',
          name: 'ai-agent-edit',
          component: () => import('../components/forms/AiAgentForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'events',
          name: 'events',
          component: () => import('../views/EventsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'events/new',
          name: 'event-new',
          component: () => import('../components/forms/EventForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'events/:id',
          name: 'event-edit',
          component: () => import('../components/forms/EventForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'environment-profiles',
          name: 'environment-profiles',
          component: () => import('../views/EnvironmentProfilesView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'environment-profiles/new',
          name: 'environment-profile-new',
          component: () => import('../components/forms/EnvironmentProfileForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'environment-profiles/:id',
          name: 'environment-profile-edit',
          component: () => import('../components/forms/EnvironmentProfileForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'sound-fragments',
          name: 'sound-fragments',
          component: () => import('../views/SoundFragmentsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'sound-fragments/new',
          name: 'sound-fragment-new',
          component: () => import('../components/forms/SoundFragmentForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'sound-fragments/:id',
          name: 'sound-fragment-edit',
          component: () => import('../components/forms/SoundFragmentForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'listeners',
          name: 'listeners',
          component: () => import('../views/ListenersView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'listeners/new',
          name: 'listener-new',
          component: () => import('../components/forms/ListenerForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'listeners/:id',
          name: 'listener-edit',
          component: () => import('../components/forms/ListenerForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'brands',
          name: 'brands',
          component: () => import('../views/BrandsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'brands/new',
          name: 'brand-new',
          component: () => import('../components/forms/BrandForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'brands/:id',
          name: 'brand-edit',
          component: () => import('../components/forms/BrandForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/ProfileView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'raquel/users',
          name: 'raquel-users',
          component: () => import('../views/UsersView.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/users/new',
          name: 'raquel-user-new',
          component: () => import('../components/forms/UserForm.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/users/:id',
          name: 'raquel-user-edit',
          component: () => import('../components/forms/UserForm.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/labels',
          name: 'raquel-labels',
          redirect: '/dashboard/raquel/labels/sound-fragment',
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/labels/sound-fragment',
          name: 'raquel-labels-sound-fragment',
          component: () => import('../views/labels/SoundFragmentLabelsView.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/labels/sound-fragment/new',
          name: 'raquel-label-sound-fragment-new',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/labels/sound-fragment/:id',
          name: 'raquel-label-sound-fragment-edit',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/labels/script',
          name: 'raquel-labels-script',
          component: () => import('../views/labels/ScriptLabelsView.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/labels/script/new',
          name: 'raquel-label-script-new',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/labels/script/:id',
          name: 'raquel-label-script-edit',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/labels/ai-agent',
          name: 'raquel-labels-ai-agent',
          component: () => import('../views/labels/AiAgentLabelsView.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/labels/ai-agent/new',
          name: 'raquel-label-ai-agent-new',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/labels/ai-agent/:id',
          name: 'raquel-label-ai-agent-edit',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/labels/brand',
          name: 'raquel-labels-brand',
          component: () => import('../views/labels/BrandLabelsView.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/labels/brand/new',
          name: 'raquel-label-brand-new',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/labels/brand/:id',
          name: 'raquel-label-brand-edit',
          component: () => import('../components/forms/LabelForm.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/languages',
          name: 'raquel-languages',
          component: () => import('../views/LanguagesView.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/languages/new',
          name: 'raquel-language-new',
          component: () => import('../components/forms/LanguageForm.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/languages/:id',
          name: 'raquel-language-edit',
          component: () => import('../components/forms/LanguageForm.vue'),
          meta: { requiresAuth: true, api: 'raquel' }
        },
        {
          path: 'raquel/drafts',
          name: 'raquel-drafts',
          component: () => import('../views/raquel/DraftsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'raquel/drafts/new',
          name: 'raquel-draft-new',
          component: () => import('../components/forms/raquel/DraftForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'raquel/drafts/:id',
          name: 'raquel-draft-edit',
          component: () => import('../components/forms/raquel/DraftForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'raquel/prompts',
          name: 'raquel-prompts',
          component: () => import('../views/raquel/PromptsView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'raquel/prompts/new',
          name: 'raquel-prompt-new',
          component: () => import('../components/forms/raquel/PromptForm.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'raquel/prompts/:id',
          name: 'raquel-prompt-edit',
          component: () => import('../components/forms/raquel/PromptForm.vue'),
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
