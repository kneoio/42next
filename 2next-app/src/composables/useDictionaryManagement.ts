import { ref } from 'vue'
import { useMessage } from 'naive-ui'

export interface DictionaryEntity {
  id?: number
  name?: string
  active?: boolean
}

export function useDictionaryManagement<T extends DictionaryEntity>() {
  const showModal = ref(false)
  const editingItem = ref<T | null>(null)
  const isEditing = ref(false)
  const message = useMessage()

  const formData = ref<Partial<T>>({})





  function handleCancel() {
    showModal.value = false
    formData.value = {}
  }

  return {
    // State
    showModal,
    editingItem,
    isEditing,
    formData,
    message,
    
    // Actions
    handleCancel
  }
}
