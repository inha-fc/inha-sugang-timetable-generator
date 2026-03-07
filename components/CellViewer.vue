<template>
  <div ref="cellRef" :style="`height: ${height}em; background-color: ${computedColor};`" class="cell">
    <span v-if="data" class="item-parent">
      <span v-if="data.공강"></span>
      <span v-else class="item">
        {{data.상세.getSubject()}}({{data.상세.getPf()}})
        <span class="item-hover">
          <div>
            {{data.상세.getSnoCode()}}<br>
            {{data.시작시간}} ~ {{data.종료시간}} <br>
            {{data.상세.getDetailPlace()}} <br>
            {{data.상세.getBigo()}}
          </div>
        </span>
      </span>
    </span>
    <span v-else class="item-parent">
      <span v-if="time" class="item">
        {{time}}교시
        <span class="item-hover-time">
          <span v-if="time % 2 == 1">
            {{`${Math.floor(time/2)+8}:30 ~ ${Math.floor(time/2)+9}:15`}}
          </span>
          <span v-else>
            {{`${Math.floor(time/2)+8}:15 ~ ${Math.floor(time/2)+8}:45`}}
          </span>
        </span>
      </span>
      <span v-if="text">{{text}}</span>
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps(['data', 'height', 'time', 'text'])

const colors = ['#FFB2A3', '#FFE0A3', '#EFFFA3', '#C1FFA3', '#A3FFB2', '#A3FFE0', '#A3EFFF', '#A3C1FF', '#B2A3FF']

const computedColor = computed(() => {
  if (props.data && !props.data.공강) {
    const i = props.data.index
    return colors[i < colors.length ? i : colors.length - 1]
  }
  return '#FFFFFF'
})

const cellRef = ref(null)
</script>

<style scoped>
.cell {
  border: 0.1px solid white;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}
.item-parent {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.item-hover {
  width: 300px;
  position: absolute;
  display: none; 
  background: rgba(0,0,0,0.8);
  color:white;
  z-index: 100;
  border-radius: 5px;
  padding: 10px;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
}

.item-hover-time {
  width: 130px;
  position: absolute;
  display: none; 
  background: rgba(0,0,0,0.8);
  color:white;
  z-index: 100;
  border-radius: 5px;
  padding: 5px;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
}
.item-parent:hover .item-hover{
  display: block;
}

.item-parent:hover .item-hover-time{
  display: block;
}
</style>
