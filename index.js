import { Cell, Cells } from './utils.js'

let 전공, 일반교양, 핵심교양, 영어, 교양필수, metadata;

async function loadData(baseUrl) {
  if (전공) return;
  // SSR 환경 (Nitro)
  if (import.meta.server) {
    const fs = await import('fs-extra').then(m => m.default || m);
    const path = await import('path').then(m => m.default || m);
    const dataDir = path.resolve(process.cwd(), 'public/data');
    전공 = await fs.readJson(path.join(dataDir, '전공.json'))
    일반교양 = await fs.readJson(path.join(dataDir, '일반교양.json'))
    핵심교양 = await fs.readJson(path.join(dataDir, '핵심교양.json'))
    영어 = await fs.readJson(path.join(dataDir, '영어.json'))
    교양필수 = await fs.readJson(path.join(dataDir, '교양필수.json'))
    metadata = await fs.readJson(path.join(dataDir, 'metadata.json'))
  } else {
    // CSR 환경
    await loadDataBrowser(baseUrl);
  }
}

async function loadDataBrowser(baseUrl = '/my-inha-sugang/') {
  if (전공) return;
  const fetchJson = (path) => fetch(`${baseUrl}data/${path}`).then(res => res.json());
  const data = await Promise.all([
    fetchJson('전공.json'),
    fetchJson('일반교양.json'),
    fetchJson('핵심교양.json'),
    fetchJson('영어.json'),
    fetchJson('교양필수.json'),
    fetchJson('metadata.json')
  ]);
  [전공, 일반교양, 핵심교양, 영어, 교양필수, metadata] = data;
}

async function getUpdatedDate(baseUrl) {
  await loadData(baseUrl);
  return metadata?.date || 'NO DATE!'
}

async function 희망과목_고르기(희망과목 = [], 필수과목 = [], baseUrl) {
  await loadData(baseUrl);
  const list = new Cells()
  const 시간표 = [...전공, ...영어, ...일반교양, ...교양필수, ...핵심교양]
  
  희망과목.forEach(s => {
    if (s.indexOf('-') == -1) {
      시간표.filter(x => x.sno.match(/(.*)-(.*)/)[1] == s).forEach(x => list.merge(new Cell(x)))
    } else {
      시간표.filter(x => x.sno == s).forEach(x => list.merge(new Cell(x)))
    }
  })
  
  const criteria = new Cells()
  for (let i = 0; i < 필수과목.length; i++) {
    if (필수과목[i].indexOf('-') != -1) {
      시간표.filter(x => x.sno == 필수과목[i]).forEach(x => criteria.merge(new Cell(x)))
      필수과목.splice(i, 1)
      i--;
    } else {
      시간표.filter(x => x.sno.match(/(.*)-(.*)/)[1] == 필수과목[i]).forEach(x => list.merge(new Cell(x)))
    }
  }

  return {
    list, criteria, important: 필수과목
  }
}

async function run(희망과목, 필수과목, maxCredit = 19, minCredit = 1, baseUrl) {
  await loadData(baseUrl);
  const { list, criteria, important } = await 희망과목_고르기(희망과목, 필수과목, baseUrl)
  
  const t = []
  for (let i = 0, size = list.size(); i <= size; i++) {
    const c = []
    for (let j = 0; j <= maxCredit; j++) {
      c.push([])
    }
    t.push(c)
  }
  
  for (let i = 0, size = list.size(); i <= size; i++) {
    t[i][0].push(new Cells(criteria, true))
  }
  for (let i = 0; i <= maxCredit; i++) {
    t[0][i].push(new Cells(criteria, true))
  }
  
  for (let i = 1, size = list.size(); i <= size; i++) {
    for (let j = 1; j <= maxCredit; j++) {
      const cellsList = t[i][j]
      for (let cells of t[i - 1][j]) {
        cellsList.push(new Cells(cells, true))
      }
      const lastOne = list.get(i - 1)

      if (lastOne.getCredit() <= j) {
        for (let cells of t[i - 1][j - lastOne.getCredit()]) {
          if (cells.isAvailable(lastOne)) {
            cellsList.push(cells.add(lastOne))
          }
        }
      }
    }
  }
  
  let result = t[list.size()][maxCredit]
  result = result.filter(x => x.getCredit() >= minCredit && x.getCredit() <= maxCredit)
  result = result.filter(x => {
    for (const c of important) {
      if (!x.getSubjects().includes(c)) return false
    }
    return true
  })
  
  return result
}

async function getAllSubjects(baseUrl) {
  await loadData(baseUrl);
  return [...전공, ...영어, ...일반교양, ...교양필수, ...핵심교양]
}

export { run, getUpdatedDate, getAllSubjects }
