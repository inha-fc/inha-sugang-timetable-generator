<template>
  <div id="subject-selector">
    <div v-if="modelValue.length > 0" class="selected-subjects mb-4">
      <h3 class="title is-6">선택된 과목/분반</h3>
      <table class="table is-narrow is-fullwidth is-bordered">
        <thead>
          <tr class="is-selected">
            <th>{{string_resources.SNO}}</th>
            <th>{{string_resources.SUBJECT}}</th>
            <th>{{string_resources.DEPARTMENT}}</th>
            <th>{{string_resources.GRADE}}</th>
            <th>{{string_resources.CREDIT}}</th>
            <th>{{string_resources.CATEGORY}}</th>
            <th>기타 정보</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(cell, i) in modelValue" :key="i" class="is-selected">
            <template v-if="cell.code.indexOf('-') == -1">
              <td>{{cell.code}}</td>
              <td>{{cell.detail.subject}}</td>
              <td>{{cell.detail.deptName}}</td>
              <td>{{cell.detail.grade}}</td>
              <td>{{cell.detail.credit}}</td>
              <td>{{cell.detail.category}}</td>
              <td></td>
              <td>
                <div class="buttons has-addons">
                  <button class="button is-small is-danger is-inverted" @click="희망과목_삭제(cell.code)">해제</button>
                  <button
                    @click="필수과목_토글(cell.code)"
                    class="button is-small"
                    :class="{'is-link': cell.important}"
                  >{{string_resources.IS_REQUIRED}}({{cell.important?'O':'X'}})</button>
                </div>
              </td>
            </template>
            <template v-else>
              <td>{{cell.code}}</td>
              <td>{{cell.detail.subject}}</td>
              <td>{{cell.detail.deptName}}</td>
              <td>{{cell.detail.grade}}</td>
              <td>{{cell.detail.credit}}</td>
              <td>{{cell.detail.category}}</td>
              <td>{{cell.detail.time}} / {{cell.detail.name_pf}}</td>
              <td>
                <div class="buttons has-addons">
                  <button class="button is-small is-danger is-inverted" @click="희망분반_삭제(cell.code)">해제</button>
                  <button
                    @click="필수과목_토글(cell.code)"
                    class="button is-small"
                    :class="{'is-link': cell.important}"
                  >{{string_resources.IS_REQUIRED}}({{cell.important?'O':'X'}})</button>
                </div>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 class="title is-6">검색 결과</h3>
    <table class="table is-narrow is-hoverable is-fullwidth">
      <thead>
        <tr>
          <th>{{string_resources.SNO}}</th>
          <th>{{string_resources.SUBJECT}}</th>
          <th>{{string_resources.DEPARTMENT}}</th>
          <th>{{string_resources.GRADE}}</th>
          <th>{{string_resources.CREDIT}}</th>
          <th>{{string_resources.CATEGORY}}</th>
          <th>{{string_resources.TIME}}</th>
          <th>{{string_resources.PLACE}}</th>
          <th>{{string_resources.PROFESSOR}}</th>
          <th>{{string_resources.RATE}}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="list_page.length == 0">
          <td colspan="11" class="has-text-centered">{{string_resources.NO_RESULT_OF_CONDITION}}</td>
        </tr>

        <tr v-else v-for="(cell, i) in list_page" :key="i">
          <td>{{cell.sno}}</td>
          <td>{{cell.subject}}</td>
          <td>{{cell.deptName}}</td>
          <td>{{cell.grade}}</td>
          <td>{{cell.credit}}</td>
          <td>{{cell.category}}</td>
          <td>{{cell.time}}</td>
          <td>{{cell.place}}</td>
          <td>{{cell.name_pf}}</td>
          <td>{{cell.rate}}</td>
          <td>
            <div class="buttons has-addons">
              <button
                :disabled="modelValue.map(x=>x.code).indexOf(cell.sno.substring(0,7)) != -1"
                class="button is-small is-primary is-outlined"
                @click="희망과목_추가(cell)"
              >{{string_resources.SELECT_SUBJECT}}</button>
              <button
                :disabled="modelValue.map(x=>x.code).indexOf(cell.sno) != -1"
                class="button is-small is-info is-outlined"
                @click="희망분반_추가(cell)"
              >{{string_resources.SELECT_THE_CLASS}}</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="field is-grouped is-grouped-centered">
      <button class="button is-small" @click="previous_page" :disabled="index == 0">이전 페이지</button>
      <span class="button is-small">{{index+1}} / {{max_page+1}}</span>
      <button class="button is-small" @click="next_page" :disabled="index == max_page">다음 페이지</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { 초성찾기 } from "../utils.js";
import { useData } from "../composables/useData.js";
import string_resources from "../resources/stringresources.js"

const props = defineProps(["category", "search", "modelValue", "subject"])
const emit = defineEmits(["update:modelValue"])

const { getSubjects } = useData()
const list = ref([])
const index = ref(0)
const pagination = 12

onMounted(async () => {
  try {
    list.value = await getSubjects()
  } catch (e) {
    console.error("Data loading failed", e)
  }
})

watch(() => props.category, () => { index.value = 0 })
watch(() => props.search, () => { index.value = 0 })

const filtered_list = computed(() => {
  let result = 초성찾기(list.value, props.search || "");
  if (props.category && props.category !== "전체") {
    result = result.filter(x => x.category === props.category);
  }
  if (props.subject) {
    result = result.filter(x => x.deptName === undefined || x.deptName.indexOf(props.subject) !== -1);
  }
  return result;
})

const list_size = computed(() => filtered_list.value.length)
const max_page = computed(() => Math.max(0, Math.floor((list_size.value - 1) / pagination)))

const list_page = computed(() => {
  if (list_size.value < pagination) return filtered_list.value;
  return filtered_list.value.slice(index.value * pagination, (index.value + 1) * pagination);
})

const next_page = () => { index.value = Math.min(index.value + 1, max_page.value) }
const previous_page = () => { index.value = Math.max(0, index.value - 1) }

const 필수과목_토글 = (코드) => {
  const newValue = [...props.modelValue]
  const targetIndex = newValue.map(x => x.code).indexOf(코드)
  if (targetIndex !== -1) {
    newValue[targetIndex].important = !newValue[targetIndex].important
    emit("update:modelValue", newValue)
  }
}

const 희망과목_삭제 = (과목코드) => {
  const newValue = props.modelValue.filter(x => x.code !== 과목코드)
  emit("update:modelValue", newValue)
}

const 희망분반_삭제 = (분반코드) => {
  const newValue = props.modelValue.filter(x => x.code !== 분반코드)
  emit("update:modelValue", newValue)
}

const 희망과목_추가 = (코드) => {
  const 과목코드 = 코드.sno.match(/(.*)-(.*)/)[1]
  if (!props.modelValue.map(x => x.code).includes(과목코드)) {
    const newValue = [...props.modelValue, {
      code: 과목코드,
      detail: 코드,
      important: true
    }]
    emit("update:modelValue", newValue)
  }
}

const 희망분반_추가 = (코드) => {
  const 과목코드 = 코드.sno.match(/(.*)-(.*)/)[1]
  const 분반코드 = 코드.sno
  if (!props.modelValue.map(x => x.code).includes(분반코드) && 
      !props.modelValue.map(x => x.code).includes(과목코드)) {
    const newValue = [...props.modelValue, {
      code: 분반코드,
      detail: 코드,
      important: true
    }]
    emit("update:modelValue", newValue)
  }
}
</script>

<style scoped>
#subject-selector {
  font-size: 0.8em;
}
</style>
