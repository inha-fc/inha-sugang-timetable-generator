import { Cell, Cells } from './timetable'

let major = [], general = [], core = [], english = [], required = [], metadata = {};
let isDataLoaded = false;

async function loadData(baseUrl) {
  if (isDataLoaded) return;
  
  if (import.meta.server) {
    try {
      const fs = await import('fs-extra').then(m => m.default || m);
      const path = await import('path').then(m => m.default || m);
      const dataDir = path.resolve(process.cwd(), 'public/data');
      major = await fs.readJson(path.join(dataDir, '전공.json'))
      general = await fs.readJson(path.join(dataDir, '일반교양.json'))
      core = await fs.readJson(path.join(dataDir, '핵심교양.json'))
      english = await fs.readJson(path.join(dataDir, '영어.json'))
      required = await fs.readJson(path.join(dataDir, '교양필수.json'))
      metadata = await fs.readJson(path.join(dataDir, 'metadata.json'))
      isDataLoaded = true;
    } catch (e) {
      console.error("Server-side data loading failed", e);
    }
  } else {
    await loadDataBrowser(baseUrl);
  }
}

async function loadDataBrowser(baseUrl) {
  if (isDataLoaded) return;
  const effectiveBaseUrl = baseUrl || '/inha-sugang-timetable-generator/';
  const safeBaseUrl = effectiveBaseUrl.endsWith('/') ? effectiveBaseUrl : `${effectiveBaseUrl}/`;
  const fetchJson = (path) => fetch(`${safeBaseUrl}data/${path}`).then(res => {
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  });
  
  try {
    const data = await Promise.all([
      fetchJson('전공.json'),
      fetchJson('일반교양.json'),
      fetchJson('핵심교양.json'),
      fetchJson('영어.json'),
      fetchJson('교양필수.json'),
      fetchJson('metadata.json')
    ]);
    [major, general, core, english, required, metadata] = data;
    isDataLoaded = true;
  } catch (e) {
    console.error("Browser-side data loading failed", e);
    major = general = core = english = required = [];
    metadata = { date: 'LOADING FAILED' };
  }
}

async function getUpdatedDate(baseUrl) {
  await loadData(baseUrl);
  return metadata?.date || 'NO DATE!'
}

async function filterDesiredSubjects(wishList = [], mustList = [], baseUrl) {
  await loadData(baseUrl);
  const list = new Cells()
  const timetable = [...major, ...english, ...general, ...required, ...core]
  
  // 빠른 조회를 위해 Map 생성
  const subjectMap = new Map();
  timetable.forEach(item => {
    if (!item.sno) return;
    const sCode = item.sno.split('-')[0];
    
    // 학수번호 기준 리스트 저장
    if (!subjectMap.has(sCode)) subjectMap.set(sCode, []);
    subjectMap.get(sCode).push(item);
    
    // 분반코드 기준 저장
    subjectMap.set(item.sno, [item]);
  });
  
  wishList.forEach(s => {
    const items = subjectMap.get(s);
    if (items) {
      items.forEach(item => list.merge(new Cell(item)));
    }
  });
  
  const criteria = new Cells()
  const filteredMustList = [];
  
  mustList.forEach(s => {
    const items = subjectMap.get(s);
    if (!items) return;

    if (s.indexOf('-') != -1) {
      // 분반 필수
      items.forEach(item => criteria.merge(new Cell(item)));
    } else {
      // 과목 필수 (모든 분반을 후보군에 넣고 과목명만 기록)
      items.forEach(item => list.merge(new Cell(item)));
      filteredMustList.push(s);
    }
  });

  return {
    list, criteria, important: filteredMustList
  }
}

async function run(wishList = [], mustList = [], maxCredit = 19, minCredit = 1, baseUrl) {
  await loadData(baseUrl);
  const { list, criteria, important } = await filterDesiredSubjects(wishList, mustList, baseUrl)
  
  if (list.size() === 0 && criteria.size() === 0) return [];

  const t = []
  const listSize = list.size()
  for (let i = 0; i <= listSize; i++) {
    const c = []
    for (let j = 0; j <= maxCredit; j++) {
      c.push([])
    }
    t.push(c)
  }
  
  for (let i = 0; i <= listSize; i++) {
    t[i][0].push(new Cells(criteria, true))
  }
  for (let i = 0; i <= maxCredit; i++) {
    t[0][i].push(new Cells(criteria, true))
  }
  
  for (let i = 1; i <= listSize; i++) {
    const currentCell = list.get(i - 1);
    const currentCredit = currentCell.getCredit();
    
    for (let j = 1; j <= maxCredit; j++) {
      const cellsList = t[i][j]
      
      // 이전 조합들 그대로 복사
      for (let cells of t[i - 1][j]) {
        cellsList.push(new Cells(cells, true))
      }
      
      // 현재 과목을 추가할 수 있는 경우
      if (currentCredit <= j) {
        for (let cells of t[i - 1][j - currentCredit]) {
          if (cells.isAvailable(currentCell)) {
            cellsList.push(cells.add(currentCell))
          }
        }
      }
      
      // 메모리 절약을 위해 가지치기 (선택사항)
      if (cellsList.length > 5000) {
        t[i][j] = cellsList.slice(0, 5000);
      }
    }
  }
  
  let finalResult = t[listSize][maxCredit] || []
  
  // 학점 필터링
  finalResult = finalResult.filter(x => x.getCredit() >= minCredit && x.getCredit() <= maxCredit)
  
  // 필수 과목 포함 여부 확인
  if (important.length > 0) {
    finalResult = finalResult.filter(x => {
      const subjects = x.getSubjects()
      return important.every(must => subjects.includes(must))
    })
  }
  
  // 중복 조합 제거 (시간 구성이 같은 경우)
  const uniqueResults = [];
  const resultSet = new Set();
  
  finalResult.forEach(res => {
    const key = res.getTimes().sort().join('|');
    if (!resultSet.has(key)) {
      resultSet.add(key);
      uniqueResults.push(res);
    }
  });
  
  return uniqueResults;
}

async function getAllSubjects(baseUrl) {
  await loadData(baseUrl);
  return [...major, ...english, ...general, ...required, ...core]
}

export { run, getUpdatedDate, getAllSubjects }
