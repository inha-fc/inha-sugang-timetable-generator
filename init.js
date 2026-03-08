import axios from 'axios'
import * as cheerio from 'cheerio'
import iconv from 'iconv-lite'
import fs from 'fs-extra'
import path from 'path'

const getTime = (str) => {
  if (str.indexOf('/') != -1) return str.split('/').map(x => getTime(x)).join(',')
  const match = str.match(/.*(?=\()/);
  const timePart = match ? match[0] : str;
  return getFullTime(timePart)
}

const getFullTime = (str) => {
  let day = '월'
  return str.split(',').map(x => {
    const trimmed = x.trim();
    if (isNaN(trimmed)) {
      const match = trimmed.match(/([월화수목금])(\d+)/)
      if (match) day = match[1]
      return trimmed
    }
    return day + trimmed
  }).join(',')
}

const getPlace = (str) => {
  if (str.indexOf('/') != -1) return str.split('/').map(x => getPlace(x)).join(',')
  if (str.indexOf('(') == -1) return ''
  const match = str.match(/\((.*)\)/);
  return match ? match[1] : ''
}

async function getInitialValues() {
  const url = 'http://sugang.inha.ac.kr/sugang/SU_51001/Lec_Time_Search.aspx'
  const response = await axios.get(url, { responseType: 'arraybuffer' })
  const html = response.data.toString('utf-8')
  const $ = cheerio.load(html)
  
  const depts = {}
  $('#ddlDept option').each((i, el) => {
    const val = $(el).val()
    const text = $(el).text().trim()
    // 학과 코드 필터링 (D로 시작하는 시간 코드 제외)
    if (val && val.length > 0 && !val.startsWith('D')) {
      depts[text] = val
    }
  })

  return {
    baseValues: {
      '__VIEWSTATE': $('#__VIEWSTATE').val(),
      '__VIEWSTATEGENERATOR': $('#__VIEWSTATEGENERATOR').val(),
      '__EVENTVALIDATION': $('#__EVENTVALIDATION').val()
    },
    depts
  }
}

async function fetchTimeTable(deptCode, deptName, type, baseValues) {
  const url = 'http://sugang.inha.ac.kr/sugang/SU_51001/Lec_Time_Search.aspx'
  
  const types = {
    "전공": { 'hhdSrchGubun': 'search1', 'ibtnSearch1': '조회' },
    "교양필수": { 'hhdSrchGubun': 'search1', 'ibtnSearch1': '조회' },
    "영어": { 'ddlKita': 1, 'hhdSrchGubun': 'search2', 'ibtnSearch2': 1 },
    "핵심교양": { 'ddlKita': 7, 'hhdSrchGubun': 'search2', 'ibtnSearch2': 7 },
    "일반교양": { 'ddlKita': 9, 'hhdSrchGubun': 'search2', 'ibtnSearch2': 9 }
  }

  const formData = new URLSearchParams()
  for (const key in baseValues) {
    formData.append(key, baseValues[key])
  }
  formData.append('ddlDept', deptCode)
  
  for (const key in types[type]) {
    formData.append(key, types[type][key])
  }

  try {
    const response = await axios.post(url, formData.toString(), {
      responseType: 'arraybuffer',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    })

    const html = response.data.toString('utf-8')
    const $ = cheerio.load(html)
    const datas = []

    $('tbody tr').each((i, el) => {
      const tds = $(el).find('td.Center')
      if (tds.length === 0) return

      const str = $(tds[6]).text().trim()
      const category = type === '핵심교양' ? '핵심교양' : $(tds[5]).text().trim()
      
      if (type === '전공' && category === '교양필수') return
      if (type === '교양필수' && category.indexOf('전공') !== -1) return

      const item = {
        sno: $(tds[0]).text().trim(),
        subject: $(tds[2]).text().trim(),
        grade: $(tds[3]).text().trim(),
        credit: $(tds[4]).text().trim(),
        category: category,
        time: getTime(str),
        place: getPlace(str),
        detail_place: str,
        name_pf: $(tds[7]).text().trim(),
        rate: $(tds[8]).text().trim(),
        isWeb: str.indexOf('웹') !== -1,
        bigo: $(tds[9]).text().trim().replace(/&nbsp;/g, '')
      }

      if (type === '전공' || type === '교양필수') {
        item.dept = deptCode
        item.deptName = deptName.split('/')[0].trim()
      }
      datas.push(item)
    })
    return datas
  } catch (e) {
    console.error(`Failed to fetch ${deptName} (${type}):`, e.message)
    return []
  }
}

async function init() {
  const dataPath = 'public/data'
  const { baseValues, depts } = await getInitialValues()
  const deptList = Object.keys(depts)
  
  console.log(`** 전체 학과 수: ${deptList.length}`)

  console.log('** 일반교양, 영어, 핵심교양 수집 중...')
  // 공통 과목은 아무 학과 코드나 사용해도 동일함
  const commonDept = depts[deptList[0]]
  const [일반, 영어, 핵심] = await Promise.all([
    fetchTimeTable(commonDept, 'COMMON', '일반교양', baseValues),
    fetchTimeTable(commonDept, 'COMMON', '영어', baseValues),
    fetchTimeTable(commonDept, 'COMMON', '핵심교양', baseValues)
  ])
  
  await fs.writeJson(path.join(dataPath, '일반교양.json'), 일반, { spaces: 2 })
  await fs.writeJson(path.join(dataPath, '영어.json'), 영어, { spaces: 2 })
  await fs.writeJson(path.join(dataPath, '핵심교양.json'), 핵심, { spaces: 2 })

  console.log('** 전공 및 교양필수 전체 수집 중 (시간이 다소 소요됩니다)...')
  let 전공 = []
  let 교양필수 = []
  
  // 서버 부하 방지를 위해 순차적 수집
  for (let i = 0; i < deptList.length; i++) {
    const name = deptList[i]
    const code = depts[name]
    process.stdout.write(`[${i+1}/${deptList.length}] ${name} 수집 중... \r`)
    
    const [deptMajor, deptReq] = await Promise.all([
      fetchTimeTable(code, name, '전공', baseValues),
      fetchTimeTable(code, name, '교양필수', baseValues)
    ])
    
    전공 = [...전공, ...deptMajor]
    교양필수 = [...교양필수, ...deptReq]
    
    // 0.1초 대기
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  console.log('\n** 데이터 정리 중...')

  // 중복 제거 (학수번호 기준)
  const uniqueSno = (arr) => Array.from(new Map(arr.map(item => [item.sno, item])).values())
  
  await fs.writeJson(path.join(dataPath, '교양필수.json'), uniqueSno(교양필수), { spaces: 2 })
  await fs.writeJson(path.join(dataPath, '전공.json'), uniqueSno(전공), { spaces: 2 })

  const metadata = { date: new Date().toISOString().substring(0, 10) }
  await fs.writeJson(path.join(dataPath, 'metadata.json'), metadata, { spaces: 2 })
  console.log('전체 데이터 수집 성공!')
}

init().catch(e => {
  console.error('에러발생!', e)
  process.exit(1)
})
