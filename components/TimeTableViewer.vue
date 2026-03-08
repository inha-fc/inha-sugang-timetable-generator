<template>
  <div id="timetable-viewer" v-if="result && result.length >= 0">
    <div v-if="result.length == 0" class="notification is-warning is-light has-text-centered border-radius-8">
      <span class="icon is-large mb-2">
        <i class="fas fa-exclamation-triangle fa-2x"></i>
      </span>
      <p class="is-size-5 font-weight-600 mb-2">{{string_resources.NO_RESULT_OF_CONDITION_TIMETABLE_VIEW}}</p>
      <p class="is-size-7">{{string_resources.PLEASE_CONFIRM}}</p>
    </div>
    
    <div v-else-if="timetables && timetables.get(index)">
      <!-- Controls and Stats -->
      <div class="is-flex is-vcentered is-justify-content-space-between mb-5 flex-wrap-mobile">
        <div class="control">
          <div class="buttons has-addons">
            <button class="button is-white border-light" @click="index = Math.max(0, index - 1)" :disabled="index == 0">
              <span class="icon is-small"><i class="fas fa-chevron-left"></i></span>
              <span>이전</span>
            </button>
            <span class="button is-white border-light font-weight-600 px-5">{{index + 1}} / {{result.length}}</span>
            <button class="button is-white border-light" @click="index = Math.min(result.length - 1, index + 1)" :disabled="index == result.length - 1">
              <span>다음</span>
              <span class="icon is-small"><i class="fas fa-chevron-right"></i></span>
            </button>
          </div>
        </div>
        <div class="control mt-mobile-3">
          <div class="is-flex is-vcentered">
            <span class="is-size-7 mr-2 has-text-grey">정렬 기준:</span>
            <div class="select is-small">
              <select v-model="sortBy" @change="sort">
                <option v-for="field in sortFields" :key="field" :value="field">{{string_resources['SUM_' + field] || field}}순</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="info-grid mb-5">
        <div class="columns is-mobile is-multiline is-variable is-1">
          <div class="column is-6-mobile is-3-tablet">
            <div class="stat-card shadow-sm">
              <p class="stat-label">총 학점</p>
              <p class="stat-value has-text-inha-blue">{{timetables.get(index).총학점}}</p>
            </div>
          </div>
          <div class="column is-6-mobile is-3-tablet">
            <div class="stat-card shadow-sm">
              <p class="stat-label">수업 시간</p>
              <p class="stat-value has-text-success">{{Math.floor(timetables.get(index).수업시간/4)}}h {{15*timetables.get(index).수업시간%60}}m</p>
            </div>
          </div>
          <div class="column is-6-mobile is-3-tablet">
            <div class="stat-card shadow-sm">
              <p class="stat-label">최장 연강</p>
              <p class="stat-value has-text-warning-dark">{{Math.floor(timetables.get(index).최장연강/4)}}h {{15*timetables.get(index).최장연강%60}}m</p>
            </div>
          </div>
          <div class="column is-6-mobile is-3-tablet">
            <div class="stat-card shadow-sm">
              <p class="stat-label">수업 일수</p>
              <p class="stat-value has-text-danger">{{timetables.get(index).수업일수}}일</p>
            </div>
          </div>
        </div>
      </div>

      <div class="table-container shadow-sm border-radius-8 bg-white">
        <div class="timetable-grid">
          <div class="day-column time-column">
            <div class="day-header">시간</div>
            <CellViewer v-for="t in 30" :key="'time-'+t" :time="t" :height="2.0" />
          </div>
          <div v-for="(day, i) in days" :key="day" class="day-column">
            <div class="day-header" :class="{'is-saturday': day === '토'}">{{day}}</div>
            <CellViewer 
              v-for="(cell, j) in timetables.get(index).get()[i]" 
              :key="day + '-' + j" 
              :data="cell" 
              :height="cell.연강 * 2.0" 
            />
          </div>
        </div>
      </div>
      
      <div class="mt-5 py-3">
        <p class="is-size-7 has-text-grey has-text-centered">
          <i class="fas fa-mouse-pointer mr-1"></i> {{string_resources.MORE_INFO}}<br>
          <i class="fas fa-search-plus mr-1"></i> {{string_resources.CANNOT_SEE_ONE_VIEW}} | {{string_resources.TOO_MANY_TIMETABLES}}
        </p>
      </div>
    </div>
    
    <div v-else class="has-text-centered py-6">
      <div class="custom-loader mb-4"></div>
      <p class="has-text-grey">시간표를 시각화하는 중...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import CellViewer from './CellViewer.vue'
import { TimeTables, TimeTable } from '~/utils/timetable'
import { string_resources } from '~/utils/stringResources'

const props = defineProps(['result'])

const index = ref(0)
const days = ["월", "화", "수", "목", "금", "토"]
const sortBy = ref('수업일수')
const sortFields = ['총학점', '수업시간', '최장연강', '수업일수']
const timetables = ref(null)

const convertCells = () => {
  if (!props.result || props.result.length === 0) {
    timetables.value = null;
    return;
  }
  const tts = new TimeTables()
  props.result.forEach(x => {
    tts.push(new TimeTable(x))
  })
  tts.sort(sortBy.value)
  timetables.value = tts
}

onMounted(() => {
  convertCells()
})

watch(() => props.result, () => {
  index.value = 0
  convertCells()
}, { deep: true })

const sort = () => {
  index.value = 0
  if (timetables.value) {
    timetables.value.sort(sortBy.value)
  }
}
</script>

<style scoped>
.timetable-grid {
  display: flex;
  justify-content: center;
  background: white;
  width: 100%;
  border: 1px solid #e2e8f0;
  border-bottom: none;
}
.day-column {
  flex: 1;
  min-width: 0;
  border-right: 1px solid #edf2f7;
  display: flex;
  flex-direction: column;
}
.day-column:last-child {
  border-right: none;
}
.time-column {
  flex: 0 0 65px;
  background: #f8fafc;
}
.day-header {
  height: 3.5em;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  background: #f1f5f9;
  border-bottom: 2px solid #e2e8f0;
  font-size: 0.8rem;
  color: #475569;
}
.day-header.is-saturday {
  color: #3182ce;
}
.stat-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  height: 100%;
  border: 1px solid #edf2f7;
}
.stat-label {
  font-size: 0.7rem;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}
.stat-value {
  font-size: 1.25rem;
  font-weight: 800;
}
.table-container {
  overflow: hidden;
  border-radius: 8px;
  border-bottom: 2px solid #e2e8f0;
}
.flex-wrap-mobile {
  display: flex;
}
@media screen and (max-width: 768px) {
  .timetable-grid {
    min-width: 600px;
  }
  .table-container {
    overflow-x: auto;
  }
  .flex-wrap-mobile {
    flex-direction: column;
    align-items: center;
  }
  .mt-mobile-3 {
    margin-top: 0.75rem;
  }
}
.custom-loader {
  width: 32px;
  height: 32px;
  border: 4px solid #edf2f7;
  border-bottom-color: #004898;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}
@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
