import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService from '@/services/api'

export interface Genre {
  id: string
  identifier: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string | null
  localizedName: {
    [languageCode: string]: string
  }
  rank: number
  color?: string
  fontColor?: string
  parent?: string | null
}

export const useGenresStore = defineStore('genres', () => {
  const genres = ref<Genre[]>([])
  const loading = ref(false)
  const selectedGenreIds = ref<string[]>([])
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)

  const selectedGenres = computed(() =>
    genres.value.filter(genre => selectedGenreIds.value.includes(genre.identifier))
  )

  async function loadGenres(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await apiService.getPagedDictionary<Genre>('/genres', page, size)
      genres.value = result.entries
      totalCount.value = result.count
      pageNum.value = result.pageNum
      pageSize.value = result.pageSize
      maxPage.value = result.maxPage
    } catch (error) {
      console.error('Failed to load genres:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchGenre(id: string) {
    try {
      return await apiService.getDocument<Genre>('/genres', id)
    } catch (error) {
      console.error('Failed to fetch genre:', error)
      throw error
    }
  }

  async function createGenre(genreData: Partial<Genre>) {
    try {
      // Backend generates identifier and manages audit fields; do not send them from the client
      const {
        id: _id,
        identifier: _identifier,
        author: _author,
        regDate: _regDate,
        lastModifier: _lastModifier,
        lastModifiedDate: _lastModifiedDate,
        ...payload
      } = genreData as Partial<Genre>

      const newGenre = await apiService.createDictionaryItem<Genre>('/genres', payload)
      genres.value.push(newGenre)
      return newGenre
    } catch (error) {
      console.error('Failed to create genre:', error)
      throw error
    }
  }

  async function updateGenre(id: string, genreData: Partial<Genre>) {
    try {
      // Do not send audit fields; backend owns them
      const {
        id: _id,
        identifier: _identifier,
        author: _author,
        regDate: _regDate,
        lastModifier: _lastModifier,
        lastModifiedDate: _lastModifiedDate,
        ...payload
      } = genreData as Partial<Genre>

      const updatedGenre = await apiService.updateDictionaryItem<Genre>('/genres', id, payload)
      const index = genres.value.findIndex(genre => genre.id === id)
      if (index !== -1) {
        genres.value[index] = updatedGenre
      }
      return updatedGenre
    } catch (error) {
      console.error('Failed to update genre:', error)
      throw error
    }
  }

  async function deleteGenre(identifier: string) {
    try {
      const genre = genres.value.find(genre => genre.identifier === identifier)
      const idToDelete = genre ? genre.id : identifier

      await apiService.deleteDictionaryItem('/genres', idToDelete)
      genres.value = genres.value.filter(genre => genre.identifier !== identifier)
    } catch (error) {
      console.error('Failed to delete genre:', error)
      throw error
    }
  }

  async function archiveGenres(identifiers: string[]) {
    try {
      const idsToArchive = identifiers.map(identifier => {
        const genre = genres.value.find(genre => genre.identifier === identifier)
        return genre ? genre.id : identifier
      })

      await apiService.archiveDictionaryItems('/genres', idsToArchive)
      // Remove archived genres from the list (by identifier, UI-facing key)
      genres.value = genres.value.filter(genre => !identifiers.includes(genre.identifier))
    } catch (error) {
      console.error('Failed to archive genres:', error)
      throw error
    }
  }

  function selectGenre(identifier: string) {
    if (!selectedGenreIds.value.includes(identifier)) {
      selectedGenreIds.value.push(identifier)
    }
  }

  function deselectGenre(identifier: string) {
    selectedGenreIds.value = selectedGenreIds.value.filter(id => id !== identifier)
  }

  function toggleGenreSelection(identifier: string) {
    if (selectedGenreIds.value.includes(identifier)) {
      deselectGenre(identifier)
    } else {
      selectGenre(identifier)
    }
  }

  function clearSelection() {
    selectedGenreIds.value = []
  }

  function selectAll() {
    selectedGenreIds.value = genres.value.map(genre => genre.identifier)
  }

  function getGenreByIdentifier(identifier: string) {
    return genres.value.find(genre => genre.identifier === identifier)
  }

  return {
    // State
    genres,
    loading,
    selectedGenreIds,
    totalCount,
    pageNum,
    pageSize,
    maxPage,
    selectedGenres,

    // Actions
    loadGenres,
    fetchGenre,
    createGenre,
    updateGenre,
    deleteGenre,
    archiveGenres,
    selectGenre,
    deselectGenre,
    toggleGenreSelection,
    clearSelection,
    selectAll,
    getGenreByIdentifier
  }
})
