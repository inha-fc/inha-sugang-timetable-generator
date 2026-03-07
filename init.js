import axios from 'axios'
import * as cheerio from 'cheerio'
import iconv from 'iconv-lite'
import fs from 'fs-extra'
import path from 'path'

// 인하대 수강신청 시스템에서 추출한 최신 코드
const deptData = {
  "전기전자공학부": "1601284",
  "컴퓨터공학과": "1430217"
}

const getTime = (str) => {
  if (str.indexOf('/') != -1) return str.split('/').map(x => getTime(x)).join(',')
  return getFullTime((str.match(/.*(?=\()/)||[''])[0])
}

const getFullTime = (str) => {
  let day = '월'
  return str.split(',').map(x => {
    if (isNaN(x)) {
      const match = x.match(/(.)(\d+)/)
      if (match) day = match[1]
      return x
    }
    return day + x
  }).join(',')
}

const getPlace = (str) => {
  if (str.indexOf('/') != -1) return str.split('/').map(x => getPlace(x)).join(',')
  if (str.indexOf('(') == -1) return ''
  return (str.match(/\((.*)\)/)||[''])[1]
}

async function getInitialValues() {
  const url = 'http://sugang.inha.ac.kr/sugang/SU_51001/Lec_Time_Search.aspx'
  const response = await axios.get(url, { responseType: 'arraybuffer' })
  const html = response.data.toString('utf-8')
  const $ = cheerio.load(html)
  
  return {
    '__VIEWSTATE': $('#__VIEWSTATE').val(),
    '__VIEWSTATEGENERATOR': $('#__VIEWSTATEGENERATOR').val(),
    '__EVENTVALIDATION': $('#__EVENTVALIDATION').val()
  }
}

async function fetchTimeTable(deptCode, type) {
  const url = 'http://sugang.inha.ac.kr/sugang/SU_51001/Lec_Time_Search.aspx'
  const baseValues = await getInitialValues()
  
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

  const response = await axios.post(url, formData.toString(), {
    responseType: 'arraybuffer',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
  })

  // 인하대 서버가 최근 UTF-8로 전환된 것으로 보임
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
      item.deptName = Object.keys(deptData).find(key => deptData[key] === deptCode)
    }
    datas.push(item)
  })

  return datas
}

async function init() {
  const 과들 = ['전기전자공학부', '컴퓨터공학과']
  const dataPath = 'public/data'

  console.log('** 일반교양, 영어, 핵심교양 =>')
  const [일반, 영어, 핵심] = await Promise.all([
    fetchTimeTable(deptData['컴퓨터공학과'], '일반교양'),
    fetchTimeTable(deptData['컴퓨터공학과'], '영어'),
    fetchTimeTable(deptData['컴퓨터공학과'], '핵심교양')
  ])
  
  await fs.writeJson(path.join(dataPath, '일반교양.json'), 일반, { spaces: 2 })
  await fs.writeJson(path.join(dataPath, '영어.json'), 영어, { spaces: 2 })
  await fs.writeJson(path.join(dataPath, '핵심교양.json'), 핵심, { spaces: 2 })

  console.log('** 교양필수 =>')
  let 교양필수 = []
  for (let 과 of 과들) {
    교양필수 = [...교양필수, ...await fetchTimeTable(deptData[과], '교양필수')]
  }
  await fs.writeJson(path.join(dataPath, '교양필수.json'), 교양필수, { spaces: 2 })

  console.log('** 전공 =>')
  let 전공 = []
  for (let 과 of 과들) {
    전공 = [...전공, ...await fetchTimeTable(deptData[과], '전공')]
  }
  await fs.writeJson(path.join(dataPath, '전공.json'), 전공, { spaces: 2 })

  const metadata = { date: new Date().toISOString().substring(0, 10) }
  await fs.writeJson(path.join(dataPath, 'metadata.json'), metadata, { spaces: 2 })
  console.log('성공!')
}

init().catch(e => {
  console.error('에러발생!', e)
  process.exit(1)
})
