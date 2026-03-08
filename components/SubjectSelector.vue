<template>
  <div id="subject-selector">
    <!-- Selected Subjects Card -->
    <div v-if="modelValue.length > 0" class="selected-container mb-6">
      <div class="is-flex is-vcentered mb-3">
        <span class="icon has-text-inha-blue mr-2">
          <i class="fas fa-check-circle"></i>
        </span>
        <h3 class="title is-5 mb-0">선택된 과목/분반</h3>
        <span class="tag is-inha-blue is-rounded ml-3">{{modelValue.length}}</span>
      </div>
      
      <div class="table-container shadow-sm border-radius-8 bg-white">
        <table class="table is-fullwidth is-narrow is-hoverable mb-0">
          <thead>
            <tr class="bg-light-blue">
              <th class="py-3 px-4">학수번호</th>
              <th class="py-3">과목명</th>
              <th class="py-3">학과</th>
              <th class="py-3 has-text-centered">학점</th>
              <th class="py-3">기타 정보</th>
              <th class="py-3 has-text-centered">작업</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in modelValue" :key="'selected-' + i">
              <td class="px-4 font-weight-600">{{item.code}}</td>
              <td class="has-text-inha-blue font-weight-600">{{item.detail.subject}}</td>
              <td><span class="tag is-light">{{item.detail.deptName}}</span></td>
              <td class="has-text-centered">{{item.detail.credit}}</td>
              <td class="is-size-7">
                <div v-if="item.code.indexOf('-') !== -1">
                  <span class="has-text-grey">{{item.detail.time}}</span><br>
                  <span class="has-text-grey-light">{{item.detail.name_pf}}</span>
                </div>
                <span v-else class="has-text-grey-light">전체 분반 후보</span>
              </td>
              <td class="has-text-centered">
                <div class="buttons is-centered">
                  <button 
                    @click="toggleImportant(item.code)" 
                    class="button is-small is-rounded px-3"
                    :class="item.important ? 'is-inha-blue' : 'is-white border-light'"
                    :title="item.important ? '필수 해제' : '필수로 설정'"
                  >
                    <span class="icon is-small">
                      <i class="fas" :class="item.important ? 'fa-lock' : 'fa-lock-open'"></i>
                    </span>
                    <span>{{item.important ? '필수' : '선택'}}</span>
                  </button>
                  <button @click="removeSubject(item.code)" class="button is-small is-danger is-light is-rounded">
                    <span class="icon is-small"><i class="fas fa-trash-alt"></i></span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Search Results Card -->
    <div class="results-container">
      <div class="is-flex is-vcentered is-justify-content-space-between mb-3">
        <div class="is-flex is-vcentered">
          <span class="icon has-text-grey mr-2">
            <i class="fas fa-list-ul"></i>
          </span>
          <h3 class="title is-5 mb-0">검색 결과</h3>
        </div>
        <div class="pagination-info is-size-7 has-text-grey">
          총 <strong>{{list_size}}</strong>개 중 {{currentPage * pagination + 1}} - {{Math.min((currentPage + 1) * pagination, list_size)}}
        </div>
      </div>

      <div class="table-container shadow-sm border-radius-8 bg-white">
        <table class="table is-fullwidth is-hoverable mb-0">
          <thead>
            <tr>
              <th class="py-3 px-4">학수번호</th>
              <th class="py-3">과목명</th>
              <th class="py-3">학과/학년</th>
              <th class="py-3 has-text-centered">학점</th>
              <th class="py-3">교수/시간/장소</th>
              <th class="py-3 has-text-centered">선택</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="list_page.length == 0">
              <td colspan="6" class="has-text-centered py-6 has-text-grey">
                <i class="fas fa-search mb-3 is-size-3"></i><br>
                {{string_resources.NO_RESULT_OF_CONDITION}}
              </td>
            </tr>
            <tr v-else v-for="(item, i) in list_page" :key="'result-' + i">
              <td class="px-4 is-size-7">{{item.sno}}</td>
              <td>
                <strong class="is-size-6">{{item.subject}}</strong>
                <div class="tags mt-1">
                  <span class="tag is-info is-light is-size-7">{{item.category}}</span>
                </div>
              </td>
              <td class="is-size-7">
                {{item.deptName}}<br>
                <span class="has-text-grey">{{item.grade}}학년</span>
              </td>
              <td class="has-text-centered font-weight-600">{{item.credit}}</td>
              <td class="is-size-7">
                <div class="mb-1"><i class="fas fa-user-tie mr-1 has-text-grey-light"></i> {{item.name_pf}}</div>
                <div class="mb-1"><i class="fas fa-clock mr-1 has-text-grey-light"></i> {{item.time}}</div>
                <div><i class="fas fa-map-marker-alt mr-1 has-text-grey-light"></i> {{item.place}}</div>
              </td>
              <td class="has-text-centered">
                <div class="buttons is-centered">
                  <button 
                    :disabled="modelValue.map(x=>x.code).indexOf(item.sno.split('-')[0]) != -1"
                    class="button is-small is-inha-blue is-outlined is-rounded"
                    @click="addSubject(item)"
                  >과목</button>
                  <button 
                    :disabled="modelValue.map(x=>x.code).indexOf(item.sno) != -1"
                    class="button is-small is-info is-outlined is-rounded"
                    @click="addClass(item)"
                  >분반</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <nav class="pagination is-centered is-small mt-5" role="navigation" aria-label="pagination">
        <button class="pagination-previous button is-white border-light" @click="previous_page" :disabled="currentPage == 0">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="pagination-next button is-white border-light" @click="next_page" :disabled="currentPage == max_page">
          <i class="fas fa-chevron-right"></i>
        </button>
        <ul class="pagination-list">
          <li><span class="pagination-link is-current is-inha-blue">{{currentPage + 1}} / {{max_page + 1}}</span></li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { findChosung as 초성찾기 } from '~/utils/timetable'
import { string_resources } from '~/utils/stringResources'
import { useData } from '~/composables/useData'

const props = defineProps(["category", "search", "modelValue", "subject"])
const emit = defineEmits(["update:modelValue"])

const { getSubjects } = useData()
const list = ref([])
const currentPage = ref(0)
const pagination = 10

onMounted(async () => {
  try {
    list.value = await getSubjects()
  } catch (e) {
    console.error("Data loading failed", e)
  }
})

watch(() => props.category, () => { currentPage.value = 0 })
watch(() => props.search, () => { currentPage.value = 0 })
watch(() => props.subject, () => { currentPage.value = 0 })

const filtered_list = computed(() => {
  let result = 초성찾기(list.value, props.search || "");
  if (props.category && props.category !== "전체") {
    result = result.filter(x => x.category === props.category);
  }
  if (props.subject) {
    const searchSub = props.subject.toLowerCase();
    result = result.filter(x => x.deptName && x.deptName.toLowerCase().indexOf(searchSub) !== -1);
  }
  return result;
})

const list_size = computed(() => filtered_list.value.length)
const max_page = computed(() => Math.max(0, Math.floor((list_size.value - 1) / pagination)))

const list_page = computed(() => {
  return filtered_list.value.slice(currentPage.value * pagination, (currentPage.value + 1) * pagination);
})

const next_page = () => { currentPage.value = Math.min(currentPage.value + 1, max_page.value) }
const previous_page = () => { currentPage.value = Math.max(0, currentPage.value - 1) }

const toggleImportant = (code) => {
  const newValue = [...props.modelValue]
  const targetIndex = newValue.map(x => x.code).indexOf(code)
  if (targetIndex !== -1) {
    newValue[targetIndex].important = !newValue[targetIndex].important
    emit("update:modelValue", newValue)
  }
}

const removeSubject = (code) => {
  const newValue = props.modelValue.filter(x => x.code !== code)
  emit("update:modelValue", newValue)
}

const addSubject = (item) => {
  const code = item.sno.split('-')[0]
  if (!props.modelValue.map(x => x.code).includes(code)) {
    const newValue = [...props.modelValue, {
      code: code,
      detail: item,
      important: true
    }]
    emit("update:modelValue", newValue)
  }
}

const addClass = (item) => {
  const subjectCode = item.sno.split('-')[0]
  const classCode = item.sno
  if (!props.modelValue.map(x => x.code).includes(classCode) && 
      !props.modelValue.map(x => x.code).includes(subjectCode)) {
    const newValue = [...props.modelValue, {
      code: classCode,
      detail: item,
      important: true
    }]
    emit("update:modelValue", newValue)
  }
}
</script>

<style scoped>
#subject-selector {
  font-size: 0.9em;
}
.bg-light-blue {
  background-color: #f0f7ff !important;
}
.table thead th {
  border-bottom-width: 1px;
  color: #4a5568;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}
.table tbody td {
  vertical-align: middle;
  padding: 0.75rem 0.5rem;
}
.pagination-link.is-current {
  border-color: #004898;
}
.border-light {
  border: 1px solid #edf2f7 !important;
}
.font-weight-600 {
  font-weight: 600;
}
</style>
