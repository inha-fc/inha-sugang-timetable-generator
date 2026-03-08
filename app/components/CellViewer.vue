<template>
  <div 
    ref="cellRef" 
    :style="`height: ${height}em; background-color: ${computedColor};`" 
    class="cell"
    :class="{'has-data': data && !data.공강, 'is-time-label': time, 'is-last-period': time === 30}"
  >
    <span v-if="data" class="item-parent">
      <span v-if="data.공강"></span>
      <span v-else class="item-content">
        <div class="subject-title">{{data.상세.getSubject()}}</div>
        <div class="subject-pf">{{data.상세.getPf()}}</div>
        
        <!-- Tooltip (Maintain for subjects) -->
        <div class="custom-tooltip">
          <div class="tooltip-header">{{data.상세.getSnoCode()}}</div>
          <div class="tooltip-body">
            <p><i class="fas fa-clock mr-1"></i> {{data.시작시간}} ~ {{data.종료시간}}</p>
            <p><i class="fas fa-map-marker-alt mr-1"></i> {{data.상세.getDetailPlace()}}</p>
            <p v-if="data.상세.getBigo()" class="tooltip-bigo mt-1">{{data.상세.getBigo()}}</p>
          </div>
        </div>
      </span>
    </span>
    
    <span v-else-if="time" class="time-label-container">
      <span class="period-num">{{time}}</span>
      <span class="real-time">{{getFormattedTime(time)}}</span>
    </span>
    
    <span v-else-if="text" class="text-label">{{text}}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps(["data", "height", "time", "text"])

const colors = [
  "#EBF8FF", "#BEE3F8", "#90CDF4", "#63B3ED", 
  "#EBF4FF", "#C3DAFE", "#A3BFFA", "#7F9CF5",
  "#F0FFF4", "#C6F6D5", "#9AE6B4", "#68D391"
]

const computedColor = computed(() => {
  if (props.time || props.text) return 'transparent';
  if (!props.data || props.data.공강) return '#FFFFFF';
  
  const idx = props.data.index % colors.length;
  return colors[idx];
})

const getFormattedTime = (t) => {
  const h = Math.floor((t - 1) / 2) + 9
  const m = t % 2 == 0 ? '30' : '00'
  return `${h}:${m}`
}
</script>

<style scoped>
.cell {
  box-sizing: border-box;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  width: 100%;
}
/* 30교시가 마지막이므로 바닥 선 강조 또는 유지 */
.cell.is-last-period {
  border-bottom: 2px solid #e2e8f0;
}

.cell.has-data {
  border: 1px solid rgba(0, 72, 152, 0.1);
  border-radius: 4px;
  padding: 1px; 
}

.time-label-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
}

.period-num {
  font-size: 0.75rem;
  color: #1e293b;
  font-weight: 700;
}

.real-time {
  font-size: 0.6rem;
  color: #94a3b8;
  font-weight: 400;
}

.is-time-label {
  border-right: 1px solid #f1f5f9;
}

.item-parent {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2px;
  cursor: pointer;
  overflow: hidden;
}

.item-content {
  text-align: center;
  width: 100%;
}

.subject-title {
  font-size: 0.7rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.1;
  word-break: keep-all;
}

.subject-pf {
  font-size: 0.6rem;
  color: #64748b;
  margin-top: 1px;
}

/* Tooltip Styles (Subjects only) */
.custom-tooltip {
  visibility: hidden;
  position: absolute;
  z-index: 100;
  background: #1e293b;
  color: white;
  padding: 10px;
  border-radius: 8px;
  width: 240px;
  bottom: 110%;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.item-parent:hover .custom-tooltip {
  visibility: visible;
  opacity: 1;
}

.tooltip-header {
  border-bottom: 1px solid #334155;
  padding-bottom: 5px;
  margin-bottom: 5px;
  font-weight: 700;
  font-size: 0.8rem;
  color: #38bdf8;
}

.tooltip-body {
  font-size: 0.75rem;
  text-align: left;
}

.tooltip-body p {
  margin-bottom: 3px;
}

.tooltip-bigo {
  font-style: italic;
  color: #cbd5e1;
  border-top: 1px dashed #475569;
  padding-top: 5px;
}
</style>
