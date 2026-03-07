<template>
  <div id="timetable-viewer" v-if="result">
    <div v-if="result.length == 0">
      {{string_resources.NO_RESULT_OF_CONDITION_TIMETABLE_VIEW}}. <br>
      {{string_resources.PLEASE_CONFIRM}}
    </div>
    <div v-else>
      <div v-if="result.length > 0">
        <div class="container">
          <div class="field is-grouped is-grouped-centered">
            <button class="button is-small" @click="index = Math.max(0, index - 1)" :disabled="index == 0">이전 페이지</button>
            <span class="button is-small">{{index + 1}} / {{result.length}}</span>
            <button class="button is-small" @click="index = Math.min(result.length - 1, index + 1)" :disabled="index == result.length - 1">다음 페이지</button>
          </div>
          <div>
            <div class="container">
              <nav class="level box" v-if="timetable">
                <div class="level-item has-text-centered">
                  <div>
                    <p class="heading">{{string_resources.SORT_CONDITION}}</p>
                    <div class="select">
                      <select v-model="sortBy">
                        <option v-for="(field, i) in sortFields" :key="i" :value="field">{{field}}</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="level-item has-text-centered">
                  <div>
                    <p class="heading">{{string_resources.SUM_CREDIT}}</p>
                    <p class="title">{{timetable.총학점}}</p>
                  </div>
                </div>
                <div class="level-item has-text-centered">
                  <div>
                    <p class="heading">{{string_resources.SUM_TIME}}</p>
                    <p class="title">{{Math.floor(timetable.수업시간/4)}}시간 {{(timetable.수업시간*15)%60}}분</p>
                  </div>
                </div>
                <div class="level-item has-text-centered">
                  <div>
                    <p class="heading">{{string_resources.LONGEST_CONTINUOUS_CLASS}}</p>
                    <p class="title">{{Math.floor(timetable.최장연강/4)}}시간 {{(timetable.최장연강*15)%60}}분</p>
                  </div>
                </div>
                <div class="level-item has-text-centered">
                  <div>
                    <p class="heading">{{string_resources.DAY}}</p>
                    <p class="title">{{timetable.수업일수}}/5</p>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <div class="section column is-10 is-offset-1" v-if="timetable">
        <div class="tile is-ancestor">
          <div class="tile is-parent is-1">
            <div class="tile is-child day cell">
              <CellViewer text="시간" :height="2" />
            </div>
          </div>
          <div class="tile is-parent is-2" v-for="(day, i) in timetable.get()" :key="i+30">
            <div class="tile is-child day cell">
              <CellViewer :text="days[i]" :height="2" />
            </div>
          </div>
        </div>
        <div class="tile is-ancestor is-hidden-mobile is-text-centered">
          <div class="tile is-parent is-vertical is-1">
            <div class="tile is-child cell" v-for="(time, i) in (new Array(25))" :key="i"> 
              <CellViewer :time="i+1" :height="2" />
            </div>
          </div>
          <div class="tile is-parent is-vertical is-2" v-for="(day, i) in timetable.get()" :key="i+30">
            <div class="tile is-child cell" v-for="(cell, j) in day" :key="j+52">
              <CellViewer :data="cell" :height="cell.시간" />
            </div>
          </div>
        </div>
      </div>
      <p class="has-text-centered">
        {{string_resources.MORE_INFO}}<br>
        {{string_resources.CANNOT_SEE_ONE_VIEW}} <br>
        {{string_resources.TOO_MANY_TIMETABLES}}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import CellViewer from './CellViewer.vue'
import { TimeTables, TimeTable } from '../utils.js'
import string_resources from "../resources/stringresources.js"

const props = defineProps(['result'])

const index = ref(0)
const days = ["월", "화", "수", "목", "금"]
const sortBy = ref('수업일수')
const sortFields = ['총학점', '수업시간', '최장연강', '수업일수']
const timetables = ref(null)

const convertCells = () => {
  timetables.value = new TimeTables()
  if (props.result) {
    props.result.map(x => (new TimeTable(x))).forEach(x => timetables.value.push(x))
  }
  timetables.value.sort(sortBy.value)
}

watch(() => props.result, () => {
  index.value = 0
  convertCells()
}, { immediate: true })

watch(sortBy, () => {
  index.value = 0
  if (timetables.value) {
    timetables.value.sort(sortBy.value)
  }
})

const timetable = computed(() => {
  if (timetables.value) {
    return timetables.value.get(index.value)
  }
  return null
})
</script>

<style scoped>
#timetable-viewer {
  font-size: 0.8em;
}
.tile.is-vertical > .tile.is-child:not(:last-child) {
  margin: 0 !important;
}
.tile.is-parent {
  padding: 0 !important;
}
.tile {
  flex-shrink: 0 !important;
  flex-grow: 1 !important;
  flex-basis: auto !important;
  box-sizing: border-box;
}
.day {
  font-size: 1.2em;
  margin: 0.4em;
  text-align: center;
}
.is-text-centered {
  text-align: center;
}
</style>
