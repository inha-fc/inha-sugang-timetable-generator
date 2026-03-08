<template>
  <div id="app-container">
    <!-- Header Section -->
    <header class="header-section">
      <div class="hero is-inha-blue">
        <div class="hero-body py-6"> <!-- 패딩 증가 -->
          <div class="container is-max-widescreen">
            <div class="columns is-vcentered is-mobile flex-wrap-mobile">
              <div class="column is-12-mobile is-8-tablet">
                <h1 class="title is-3-desktop is-4-tablet is-5-mobile has-text-white mb-4 line-height-1-4">
                  <i class="fa-regular fa-clock mr-3"></i>인하대학교 시간표 생성기
                </h1>
                <h2 class="subtitle is-6-desktop is-7-tablet is-7-mobile has-text-white-bis opacity-90 line-height-1-6">
                  인하대학교 전 학과 시간표 생성을 지원합니다. ({{date}}일자 시간표)
                </h2>
              </div>
              <div class="column is-12-mobile is-4-tablet has-text-right-tablet has-text-left-mobile">
                <a href="https://sugang.inha.ac.kr" target="_blank" class="button is-white is-outlined is-small border-radius-8">
                  <span class="icon is-small">
                    <i class="fas fa-external-link-alt"></i>
                  </span>
                  <span>수강신청 홈페이지</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <main>
      <!-- Filter Section -->
      <section class="section py-5">
        <div class="container is-max-widescreen">
          <div class="card shadow-sm border-light">
            <div class="card-content p-5">
              <div class="columns is-multiline">
                <!-- Search Filters -->
                <div class="column is-12-mobile is-6-tablet is-4-desktop">
                  <div class="field">
                    <label class="label is-size-7">과목이름 / 초성 검색</label>
                    <div class="control has-icons-left">
                      <input class="input is-hovered" v-model="search" placeholder="예) ㅈㄺㅈㄹ, 자료구조론">
                      <span class="icon is-small is-left">
                        <i class="fas fa-search"></i>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="column is-12-mobile is-6-tablet is-4-desktop">
                  <div class="field">
                    <label class="label is-size-7">학과 검색</label>
                    <div class="control has-icons-left">
                      <input class="input is-hovered" v-model="subject" placeholder="예) 정보통신, 컴퓨터">
                      <span class="icon is-small is-left">
                        <i class="fas fa-university"></i>
                      </span>
                    </div>
                  </div>
                </div>

                <div class="column is-12-mobile is-6-tablet is-4-desktop">
                  <div class="field">
                    <label class="label is-size-7">학점 범위 (최소 ~ 최대)</label>
                    <div class="field has-addons">
                      <p class="control is-expanded">
                        <input class="input is-hovered" type="number" v-model.number="minCredit" placeholder="최소">
                      </p>
                      <p class="control">
                        <a class="button is-static is-small">~</a>
                      </p>
                      <p class="control is-expanded">
                        <input class="input is-hovered" type="number" v-model.number="maxCredit" placeholder="최대">
                      </p>
                    </div>
                  </div>
                </div>

                <div class="column is-12 mt-2">
                  <div class="field">
                    <label class="label is-size-7 mb-3">카테고리 분류</label>
                    <div class="control">
                      <div class="buttons are-small mb-0">
                        <button 
                          v-for="c in categoryList" 
                          :key="c"
                          @click="category = c"
                          class="button is-rounded px-4"
                          :class="category === c ? 'is-inha-blue has-text-white is-selected' : 'is-white border-light'"
                        >
                          {{c}}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>  
      </section>

      <!-- Selection Notification -->
      <section class="section py-0">
        <div class="container is-max-widescreen">
          <div class="notification is-info is-light py-3 px-5 border-radius-8">
            <div class="level is-mobile mb-0">
              <div class="level-left">
                <div class="level-item mr-3">
                  <span class="icon is-medium has-text-info">
                    <i class="fas fa-info-circle fa-lg"></i>
                  </span>
                </div>
                <div class="level-item">
                  <p class="is-size-7-mobile is-size-6-tablet">
                    원하는 과목을 선택하고 <strong>필수여부</strong>를 체크한 뒤 하단의 버튼을 눌러주세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Subject Selector Section (배경 투명화 적용) -->
      <section class="section py-5">
        <div class="container is-max-widescreen">
          <div class="transparent-container">
            <SubjectSelector :search="search" :subject="subject" :category="category" v-model="과목" />
          </div>
        </div>
      </section>

      <!-- Calculation Button Section -->
      <section class="section py-6">
        <div class="container is-max-widescreen has-text-centered">
          <div class="calculation-box">
            <button 
              @click="getResult()" 
              class="button is-inha-blue is-large is-fullwidth-mobile shadow-lg px-6" 
              :class="{'is-loading':isProgress}"
              :disabled="isProgress"
            >
              <span class="icon is-medium mr-2" v-if="!isProgress">
                <i class="fas fa-magic"></i>
              </span>
              <strong class="has-text-white is-size-5">최적의 시간표 생성하기</strong>
            </button>
            <p class="help is-grey mt-3" v-if="과목.length > 0">
              현재 {{과목.length}}개의 항목이 선택되었습니다.
            </p>
          </div>
          
          <!-- Loading Placeholder -->
          <div v-if="isProgress" class="mt-6 py-6 fade-in">
            <div class="loader-wrapper is-flex is-flex-direction-column is-align-items-center">
              <div class="custom-loader mb-4"></div>
              <p class="has-text-inha-blue font-weight-600">수만 개의 조합을 분석 중입니다...</p>
              <p class="is-size-7 has-text-grey mt-2">잠시만 기다려 주세요.</p>
            </div>
          </div>

          <!-- Results Viewer -->
          <div id="result-anchor" class="result-area mt-6" v-if="result">
            <TimeTableViewer :result="result" />
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="footer mt-6 py-6 border-top-light bg-white">
      <div class="container is-max-widescreen">
        <div class="content has-text-centered">
          <div class="columns is-centered">
            <div class="column is-10-desktop">
              <div class="footer-logo mb-4">
                <span class="icon is-large has-text-inha-blue">
                  <i class="fa-solid fa-calendar-check fa-2x"></i>
                </span>
              </div>
              <p class="title is-5 mb-2"><strong>인하대 시간표 생성기</strong></p>
              <p class="is-size-7 has-text-grey-dark mb-5 max-w-600 mx-auto">
                본 서비스는 학생들의 편의를 위해 개발된 비공식 도구입니다.<br>
                <strong>사용자가 제공하는 시간표 데이터 활용 결과에 대해 어떠한 법적 책임도 지지 않습니다.</strong><br>
                최종 수강신청 전 반드시 포털 시스템의 공지사항과 시간표를 대조하시기 바랍니다.
              </p>
              <hr class="footer-divider my-5">
              <div class="attribution is-size-7">
                <p class="mb-1">
                  Original Concept by <a href="https://github.com/agrajak/my-inha-sugang" target="_blank" class="has-text-inha-blue font-weight-600">Suhyun Jeon</a>
                </p>
                <p>
                  Refactored & Optimized by <a href="https://github.com/leejongyoung" target="_blank" class="has-text-inha-blue font-weight-600">Lee Jongyoung</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useData } from '~/composables/useData'
import TimeTableViewer from '../components/TimeTableViewer.vue'
import SubjectSelector from '../components/SubjectSelector.vue'

const { date, fetchDate, run } = useData()
const config = useRuntimeConfig()
const baseUrl = config.app.baseURL || '/inha-sugang-timetable-generator/'

const result = ref(undefined)
const 과목 = ref([])
const categoryList = ['전체', '전공선택', '전공필수', '핵심교양', '교양선택', '교양필수']
const search = ref('')
const subject = ref('')
const maxCredit = ref(19)
const minCredit = ref(1)
const category = ref('전체')
const isProgress = ref(false)

onMounted(async () => {
  await fetchDate()
})

const getResult = async () => {
  if (과목.value.length === 0) {
    alert('과목을 먼저 선택해주세요.');
    return;
  }
  
  isProgress.value = true
  result.value = null
  
  const wishList = 과목.value.filter(x => !x.important).map(x => x.code)
  const mustList = 과목.value.filter(x => x.important).map(x => x.code)

  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    const r = await run(wishList, mustList, maxCredit.value, minCredit.value, baseUrl)
    result.value = r
    
    if (!r || r.length === 0) {
      alert('조건에 맞는 시간표 조합이 없습니다. 학점 범위를 조절하거나 필수 과목을 확인해주세요.');
    } else if (r.length > 0) {
      setTimeout(() => {
        const viewer = document.getElementById('result-anchor');
        if (viewer) viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  } catch (e) {
    console.error('시간표 계산 중 에러 발생:', e)
    alert('시간표 계산 중 오류가 발생했습니다.');
  } finally {
    isProgress.value = false
  }
}
</script>

<style>
/* Reset & Base */
body {
  background-color: #fcfdfe;
  color: #363636;
  line-height: 1.6;
}

/* Color Variables */
.is-inha-blue { background-color: #004898 !important; color: white !important; }
.has-text-inha-blue { color: #004898 !important; }
.border-light { border: 1px solid #edf2f7 !important; }
.border-top-light { border-top: 1px solid #edf2f7 !important; }
.bg-white { background-color: #ffffff !important; }

/* Utilities */
.opacity-90 { opacity: 0.9; }
.font-weight-600 { font-weight: 600; }
.mx-auto { margin-left: auto; margin-right: auto; }
.max-w-600 { max-width: 600px; }
.border-radius-8 { border-radius: 8px !important; }
.overflow-hidden { overflow: hidden !important; }
.line-height-1-4 { line-height: 1.4 !important; }
.line-height-1-6 { line-height: 1.6 !important; }

/* Custom Shadows */
.shadow-sm { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important; }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 72, 152, 0.2), 0 4px 6px -2px rgba(0, 72, 152, 0.1) !important; }

/* Container */
.container.is-max-widescreen {
  max-width: 1100px !important;
  width: 95% !important;
}

/* Form Inputs */
.input {
  border-radius: 6px;
  border-color: #e2e8f0;
  transition: all 0.2s ease;
}
.input:focus, .input.is-hovered:hover {
  border-color: #004898;
  box-shadow: 0 0 0 0.125em rgba(0, 72, 152, 0.1);
}

/* Category Buttons */
.buttons .button.is-white {
  background-color: white;
  border: 1px solid #e2e8f0;
}
.buttons .button.is-inha-blue.is-selected {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

/* Main Button */
.button.is-large {
  height: 3.5rem;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.button.is-large:hover:not(:disabled) {
  transform: translateY(-2px);
  background-color: #00367a !important;
}

/* Custom Loader */
.custom-loader {
  width: 48px;
  height: 48px;
  border: 5px solid #edf2f7;
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

.fade-in {
  animation: fadeIn 0.5s ease-in;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Transparent Container for Results */
.transparent-container {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* Responsive Fixes for PC Text Overlap */
@media screen and (min-width: 769px) {
  .field-label {
    flex-grow: 0 !important;
    margin-right: 1.5rem !important;
    text-align: left !important;
    min-width: 120px;
  }
}

@media screen and (max-width: 768px) {
  .flex-wrap-mobile {
    flex-wrap: wrap !important;
  }
  .hero-body { padding: 3rem 1.25rem !important; }
  .section { padding: 1.5rem 0.75rem !important; }
  .card-content { padding: 1.25rem !important; }
  .button.is-large { font-size: 1.1rem !important; }
  .title.is-5-mobile { font-size: 1.25rem !important; }
}

/* Footer Divider */
.footer-divider {
  height: 1px;
  background-color: #f0f4f8;
  width: 50%;
  margin-left: auto;
  margin-right: auto;
}
</style>
