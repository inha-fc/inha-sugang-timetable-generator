function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (obj.constructor && obj.constructor.name === 'Cell') {
    return new Cell(JSON.parse(JSON.stringify(obj.data)));
  }

  const newObj = JSON.parse(JSON.stringify(obj))
  return newObj
}

const getStartTime = (period) => {
  const h = Math.floor((period - 1) / 2) + 9
  if (period % 2 == 0) {
    return `${h}시 30분`
  }
  return `${h}시`
}
const getEndTime = (period) => {
  const h = Math.floor((period - 1) / 2) + 9
  if (period % 2 == 0) {
    return `${h}시 15분`
  }
  return `${h}시 45분`
}

class Cell {
  constructor(obj) {
    this.data = {}
    if (obj instanceof Cell) {
      this.data = JSON.parse(JSON.stringify(obj.data))
    } else {
      this.data = JSON.parse(JSON.stringify(obj || {}))
    }
    return this
  }
  get() {
    return this.data
  }
  getSubject() { return this.data.subject || '' }
  getPf() { return this.data.name_pf || '' }
  getTime() { return this.data.time || '' }
  getPlace() { return this.data.place || '' }
  getDetailPlace() { return this.data.detail_place || '' }
  getCredit() { return Number(this.data.credit || 0) }
  getBigo() { return this.data.bigo || '' }
  getSnoCode() { return this.data.sno || '' }
  getBunBan() { 
    const sno = this.getSnoCode()
    const parts = sno.split('-')
    return parts.length > 1 ? parts[1] : ''
  }
  getSno() { 
    const sno = this.getSnoCode()
    return sno.split('-')[0]
  }
}

class Cells {
  constructor(obj, isStrict = false) {
    this.arr = []
    this.isStrict = isStrict
    this.times = []
    this.subjects = []
    this.credit = 0
    
    if (obj instanceof Cells) {
      this.arr = obj.arr.map(c => new Cell(c.data))
      this.times = [...obj.times]
      this.subjects = [...obj.subjects]
      this.isStrict = obj.isStrict
      this.credit = obj.credit
    }
    return this
  }

  getTimes() { return this.times }
  getCredit() { return this.credit }
  getSubjects() { return this.subjects }
  get(ind) {
    return this.arr[ind]
  }
  size() {
    return this.arr.length
  }
  add(cell) {
    const newCells = new Cells(this, this.isStrict)
    newCells.merge(cell)
    return newCells
  }
  merge(cell) {
    const targetCell = (cell instanceof Cell) ? cell : new Cell(cell);
    
    if (this.isStrict) {
      if (!this.isAvailable(targetCell)) throw new Error('cell is not compatible')
    }
    
    this.arr.push(new Cell(targetCell.data))
    const timeStr = targetCell.getTime()
    if (timeStr) {
      timeStr.split(',').forEach(x => { if(x) this.times.push(x) })
    }
    this.times.sort()
    this.credit += targetCell.getCredit()
    this.subjects.push(targetCell.getSno())
  }

  isAvailable(cell) {
    const targetCell = (cell instanceof Cell) ? cell : new Cell(cell);
    const b = targetCell.getTime().split(',').filter(x => x)
    if (this.subjects.includes(targetCell.getSno())) return false
    
    let i = 0, j = 0;
    const sortedTimes = [...this.times].sort();
    const sortedNewTimes = [...b].sort();
    
    while (i < sortedTimes.length && j < sortedNewTimes.length) {
      if (sortedTimes[i] == sortedNewTimes[j]) return false
      else if (sortedTimes[i] < sortedNewTimes[j]) i++;
      else j++;
    }
    return true
  }
  print() {
    const MAX_PERIOD = 30;
    const DAYS_COUNT = 6;
    let grid = [];
    for (let i = 0; i < MAX_PERIOD; i++) {
      const a = [];
      for (let j = 0; j < DAYS_COUNT; j++) a.push(-1)
      grid.push(a)
    }
    
    this.arr.forEach((cell, i) => {
      const target = (cell instanceof Cell) ? cell : new Cell(cell);
      const timeStr = target.getTime()
      if (!timeStr) return
      timeStr.split(',').forEach(t => {
        const match = t.match(/([월화수목금토])(\d+)/)
        if (!match) return
        const day = match[1]
        const num = parseInt(match[2])
        const dayIdx = ["월", "화", "수", "목", "금", "토"].indexOf(day)
        if (dayIdx !== -1 && num > 0 && num <= MAX_PERIOD) {
          grid[num - 1][dayIdx] = i
        }
      })
    })
    return grid
  }
}

class TimeTable {
  constructor(cells) {
    const cellsObj = (cells instanceof Cells) ? cells : new Cells(cells);
    this.학점 = 0
    this.수업시간 = 0
    this.총학점 = cellsObj.getCredit()
    this.최장연강 = 0
    this.수업일수 = 0
    this.arr = []
    this.obj = cellsObj
    
    const MAX_PERIOD = 30;
    const DAYS_COUNT = 6;
    const gridResult = cellsObj.print()
    const finalArr = []
    
    for (let i = 0; i < DAYS_COUNT; i++) {
      const dayData = []
      let isPrevEmpty = false
      for (let j = 0; j < MAX_PERIOD;) {
        const isEmpty = (gridResult[j][i] == -1)
        let k = j + 1
        for (; k < MAX_PERIOD; k++) {
          if (gridResult[k][i] != gridResult[j][i]) break;
        }
        
        if (isPrevEmpty && isEmpty) {
          dayData[dayData.length - 1].연강 += (k - j)
          dayData[dayData.length - 1].시간 += (k - j) * 2
        } else {
          dayData.push({
            index: gridResult[j][i],
            상세: isEmpty ? null : cellsObj.get(gridResult[j][i]),
            연강: k - j,
            시간: isEmpty ? (k - j) * 2 : (k - j) * 2 - 1,
            공강: isEmpty,
            시작시간: getStartTime(j + 1),
            종료시간: getEndTime(k + 1)
          })
        }
        
        if (!isEmpty) {
          dayData.push({
            index: -1,
            상세: null,
            연강: 0,
            시간: 1,
            공강: true
          })
          isPrevEmpty = true
        } else {
          isPrevEmpty = false
        }
        j = k;
      }
      finalArr.push(dayData)
    }
    this.arr = finalArr

    for (let i = 0; i < DAYS_COUNT; i++) {
      let hasClass = false
      let continuous = 0
      for (let cell of finalArr[i]) {
        if (cell.index != -1) {
          hasClass = true
          this.수업시간 += cell.시간
          continuous += cell.시간
          if (this.최장연강 < continuous) this.최장연강 = continuous
        } else if (cell.시간 != 1) {
          continuous = 0
        }
      }
      this.수업일수 += (hasClass ? 1 : 0)
    }
  }
  get() { return this.arr }
  getCells() { return this.obj }
}

class TimeTables {
  constructor() { this.arr = [] }
  push(obj) {
    this.arr.push(obj)
  }
  get(index) { return this.arr[index] }
  sort(field) {
    const fields = ['총학점', '수업시간', '최장연강', '수업일수']
    if (!(fields.includes(field))) return
    this.arr = this.arr.sort((a, b) => (a[field] - b[field]))
  }
}

function findChosung(list, search) {
  if (!search) return list;
  function isKorean(str) { return /[ㄱ-ㅎ|ㄳ-ㅄ|가-힝]/.test(str) }
  function getChosung(str) {
    if (!str) return '';
    if (isKorean(str)) {
      const base = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
      const complex = { "ㄳ": "ㄱㅅ", "ㄵ": "ㄴㅈ", "ㄶ": "ㄴㅎ", "ㄺ": "ㄹㄱ", "ㄻ": "ㄹㅁ", "ㄼ": "ㄹㅂ", "ㄽ": "ㄹㅅ", "ㄿ": "ㄹㅍ", "ㅀ": "ㄹㅎ", "ㅄ": "ㅂㅅ" }
      let result = "";
      for (let i = 0; i < str.length; i++) {
        const c = str.charAt(i)
        const code = str.charCodeAt(i) - 44032
        if (complex[c]) result += complex[c]
        else if (base.indexOf(c) !== -1) result += c
        else if (code > -1 && code < 11172) result += base[Math.floor(code / 588)];
      }
      return result;
    }
    return str
  }
  const searchChosung = getChosung(search);
  return list.filter(x => x.subject && getChosung(x.subject).indexOf(searchChosung) != -1)
}

export { Cell, Cells, TimeTable, TimeTables, findChosung }
