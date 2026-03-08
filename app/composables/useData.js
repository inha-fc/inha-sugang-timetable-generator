import { ref } from 'vue'
import { getUpdatedDate, run, getAllSubjects } from '~/utils/logic'
import { useRuntimeConfig } from '#app'

export const useData = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.app.baseURL
  const date = ref('...')
  const loading = ref(false)

  const fetchDate = async () => {
    date.value = await getUpdatedDate(baseUrl)
  }

  const getSubjects = async () => {
    return await getAllSubjects(baseUrl)
  }

  return {
    date,
    loading,
    fetchDate,
    getSubjects,
    run
  }
}
