<script setup lang="ts">
import { ref, onMounted, watch, computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NDataTable,
  NButton,
  NSpace,
  NPopconfirm,
  NForm,
  NFormItem,
  NInput,
  NSwitch,
  NPagination,
  NTabPane,
  NTabs,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import apiService, { type SubscriptionProductDTO } from '@/services/api'
import { useLanguagesStore } from '@/stores/languages'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const languagesStore = useLanguagesStore()

const products = ref<SubscriptionProductDTO[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(10)
const maxPage = ref(1)
const totalCount = ref(0)

const formProduct = ref<SubscriptionProductDTO | null>(null)
const formLoading = ref(false)
const metaText = ref('')
const activeTab = ref('en')

const currentId = computed(() => route.params.id as string | undefined)
const isFormRoute = computed(() => !!currentId.value)
const isNew = computed(() => currentId.value === 'new')

const availableLanguages = computed(() => {
  if (languagesStore.languages.length > 0) {
    return languagesStore.languages.map((l) => l.code)
  }
  return ['en']
})

function getLocalizedName(row: SubscriptionProductDTO): string {
  const localized = row.localizedName || {}
  return localized['en'] || Object.values(localized)[0] || row.identifier
}

const columns: DataTableColumns<SubscriptionProductDTO> = [
  {
    title: 'Identifier',
    key: 'identifier',
    width: 200,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Name (en)',
    key: 'localizedName',
    width: 220,
    ellipsis: {
      tooltip: true
    },
    render: (row) => getLocalizedName(row)
  },
  {
    title: 'Active',
    key: 'active',
    width: 80,
    render: (row) => (row.active ? 'Yes' : 'No')
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 220,
    render(row) {
      return h(
        NSpace,
        null,
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                type: 'primary',
                onClick: () => handleEdit(row),
              },
              { default: () => 'Edit' }
            ),
            h(
              NPopconfirm,
              {
                onPositiveClick: () => handleDelete(row.id),
              },
              {
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: 'small',
                      type: 'error',
                    },
                    { default: () => 'Delete' }
                  ),
                default: () => 'Are you sure you want to delete this product?',
              }
            ),
          ],
        }
      )
    }
  }
]

function initLocalizedMaps() {
  if (!formProduct.value) return
  const langs = availableLanguages.value
  const nameMap: Record<string, string> = { ...(formProduct.value.localizedName || {}) }
  const descMap: Record<string, string> = { ...(formProduct.value.localizedDescription || {}) }
  for (const code of langs) {
    if (!(code in nameMap)) nameMap[code] = ''
    if (!(code in descMap)) descMap[code] = ''
  }
  formProduct.value.localizedName = nameMap
  formProduct.value.localizedDescription = descMap
  if (!langs.includes(activeTab.value)) {
    activeTab.value = langs[0]
  }
}

async function loadProducts() {
  loading.value = true
  try {
    const result = await apiService.getSubscriptionProducts(page.value, size.value)
    products.value = result.entries
    totalCount.value = result.count
    maxPage.value = result.maxPage
  } catch (error) {
    console.error('Failed to load products:', error)
    message.error((error as Error).message || 'Failed to load products')
  } finally {
    loading.value = false
  }
}

async function loadProductDocument(id: string) {
  formLoading.value = true
  try {
    const dto = await apiService.getSubscriptionProductDocument(id)
    formProduct.value = dto
    initLocalizedMaps()
    metaText.value = dto.meta ? JSON.stringify(dto.meta, null, 2) : ''
  } catch (error) {
    console.error('Failed to load subscription product document:', error)
    message.error((error as Error).message || 'Failed to load product')
    router.push('/dashboard/subscription-products')
  } finally {
    formLoading.value = false
  }
}

function handleCreate() {
  router.push('/dashboard/subscription-products/new')
}

function handleEdit(row: SubscriptionProductDTO) {
  router.push(`/dashboard/subscription-products/${row.id}`)
}

async function handleDelete(id: string) {
  try {
    await apiService.deleteSubscriptionProduct(id)
    message.success('Product deleted')
    await loadProducts()
  } catch (error) {
    console.error('Failed to delete product:', error)
    const msg = (error as Error).message
    if (msg.includes('Not found') || msg.includes('404')) {
      message.error('Not found')
    } else {
      message.error(msg || 'Failed to delete product')
    }
  }
}

async function handleSave() {
  if (!formProduct.value) return

  let parsedMeta: Record<string, unknown> | null = null
  if (metaText.value.trim()) {
    try {
      parsedMeta = JSON.parse(metaText.value)
    } catch {
      message.error('Invalid JSON payload')
      return
    }
  }

  const payload: Partial<SubscriptionProductDTO> = {
    ...formProduct.value,
    meta: parsedMeta
  }

  try {
    if (isNew.value) {
      await apiService.createSubscriptionProduct(payload)
    } else {
      await apiService.updateSubscriptionProduct(formProduct.value.id, payload)
    }
    message.success('Product saved')
    await loadProducts()
    router.push('/dashboard/subscription-products')
  } catch (error) {
    console.error('Failed to save product:', error)
    message.error((error as Error).message || 'Failed to save product')
  }
}

function handleCancel() {
  router.push('/dashboard/subscription-products')
}

function handlePageChange(newPage: number) {
  page.value = newPage
  loadProducts()
}

onMounted(async () => {
  try {
    await languagesStore.loadLanguages()
  } catch (error) {
    console.error('Failed to load languages:', error)
  }

  if (isFormRoute.value && currentId.value) {
    await loadProductDocument(currentId.value)
  } else {
    await loadProducts()
  }
})

watch(
  () => route.params.id,
  async (newId) => {
    if (typeof newId === 'string') {
      await loadProductDocument(newId)
    } else {
      formProduct.value = null
      metaText.value = ''
      await loadProducts()
    }
  }
)

watch(
  () => languagesStore.languages,
  () => {
    if (formProduct.value) {
      initLocalizedMaps()
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="subscription-products-view">
    <div v-if="!isFormRoute">
      <div class="mb-4">
        <NSpace>
          <NButton type="primary" @click="handleCreate">
            Create Subscription Product
          </NButton>
        </NSpace>
      </div>

      <NDataTable
        :columns="columns"
        :data="products"
        :loading="loading"
        :row-key="(row: SubscriptionProductDTO) => row.id"
      />

      <div class="mt-4 flex justify-end">
        <NPagination
          :page="page"
          :page-count="maxPage"
          :page-size="size"
          :item-count="totalCount"
          @update:page="handlePageChange"
        />
      </div>
    </div>

    <div v-else class="form-view">
      <div class="form-header mb-4 flex justify-between items-center">
        <h2 class="text-xl font-semibold">
          {{ isNew ? 'Create Subscription Product' : 'Edit Subscription Product' }}
        </h2>
        <NSpace>
          <NButton @click="handleCancel">Cancel</NButton>
          <NButton type="primary" :loading="formLoading" @click="handleSave">Save</NButton>
        </NSpace>
      </div>

      <div v-if="formProduct" class="form-content max-w-3xl">
        <NForm :model="formProduct" label-placement="left" label-width="200">
          <NFormItem label="Identifier" required>
            <NInput v-model:value="formProduct.identifier" />
          </NFormItem>

          <NFormItem label="Stripe Price ID" required>
            <NInput v-model:value="formProduct.stripePriceId" />
          </NFormItem>

          <NFormItem label="Stripe Product ID" required>
            <NInput v-model:value="formProduct.stripeProductId" />
          </NFormItem>

          <NFormItem label="Active">
            <NSwitch v-model:value="formProduct.active" />
          </NFormItem>

          <NFormItem label="Localized Names">
            <NTabs v-model:value="activeTab" type="segment">
              <NTabPane
                v-for="code in availableLanguages"
                :key="code"
                :name="code"
                :tab="code.toUpperCase()"
              >
                <NInput
                  v-model:value="formProduct.localizedName[code]"
                  placeholder="Name"
                />
              </NTabPane>
            </NTabs>
          </NFormItem>

          <NFormItem label="Localized Descriptions">
            <NTabs v-model:value="activeTab" type="segment">
              <NTabPane
                v-for="code in availableLanguages"
                :key="code + '-desc'"
                :name="code + '-desc'"
                :tab="code.toUpperCase()"
              >
                <NInput
                  v-model:value="formProduct.localizedDescription[code]"
                  type="textarea"
                  :rows="3"
                  placeholder="Description"
                />
            </NTabPane>
          </NTabs>
        </NFormItem>

          <NFormItem label="Meta (JSON)">
            <NInput
              v-model:value="metaText"
              type="textarea"
              :rows="6"
              placeholder="Enter JSON object or leave empty"
            />
          </NFormItem>
        </NForm>
      </div>
    </div>
  </div>
</template>
