const API =
"https://opensheet.elk.sh/16IveyFW68vwyVHRIVH9MU0Jblh6HjUQ3PQU_QiE2C8c/videos"

let videos=[]
let currentWeekOffset = 0
let selectedDate = null
let minWeekOffset = -1
let maxWeekOffset = 1
let currentDate = new Date()
let weekIndex = 0
let weeks = []

async function loadVideos(){
  try{
    const res = await fetch(API)
    const data = await res.json()

    videos = data
    generateWeeks()
    const today = new Date()
    const todayStr =
    today.getFullYear() + "-" +
    String(today.getMonth()+1).padStart(2,"0") + "-" +
    String(today.getDate()).padStart(2,"0")

    selectedDate = todayStr
    if(document.getElementById("highlightCarousel"))
    renderHighlights()
    
    if(document.getElementById("calendarMini"))
    renderCalendarMini()

    renderSelectedEvents()

    if(document.getElementById("liveGrid"))
    renderLiveGrid()
      
    if(document.getElementById("categoryRow"))
    renderCategories()

    if(document.getElementById("homeGrid"))
      renderHome()

    if(document.getElementById("mediaGrid")){
      const params = new URLSearchParams(window.location.search)
      const cat = params.get("cat")
    
      if(cat){
        const filtered = videos.filter(v => v.type === cat)
        renderMedia(filtered)
      }else{
        renderMedia()
      }
      handleMemberPage()
    }

  if(document.getElementById("categoryGrid")){
  const params = new URLSearchParams(window.location.search)
  const cat = params.get("cat")

  if(cat){

    const titleEl = document.getElementById("categoryTitle")
    if(titleEl) titleEl.innerText = cat

    const filtered = videos.filter(v => 
  v.type?.trim().toLowerCase() === cat.trim().toLowerCase()
)

    renderCategoryPage(filtered, cat)
  }
}

  }catch(err){
    console.error("ERROR FETCH:", err)
  }
}

const channels = {

"Pandavva Official": {
avatar: "https://unavatar.io/youtube/@PANDAVVA",
url: "https://youtube.com/@PANDAVVA"
},

"Sadewa Sagara": {
avatar: "https://unavatar.io/youtube/@Sadewa_Sagara",
url: "https://youtube.com/@sadewa_sagara"
},

"Nakula Nalendra": {
avatar: "https://unavatar.io/youtube/@Nakula_Nalendra",
url: "https://youtube.com/@Nakula_Nalendra"
},

"Arjuna Arkana": {
avatar: "https://unavatar.io/youtube/@Arjuna.Arkana",
url: "https://youtube.com/@Arjuna.Arkana"
},

"Bima Bayusena": {
avatar: "https://unavatar.io/youtube/@BimaBayusena",
url: "https://youtube.com/@BimaBayusena"
},

"Yudistira Yogendra": {
avatar: "https://unavatar.io/youtube/@YudistiraYogendra",
url: "https://youtube.com/@YudistiraYogendra"
}

}

/* VIDEO CARD */
function card(v){
  const id = getVideoId(v.url)
  const thumb = id
    ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    : ""

  const ch =
    Object.entries(channels)
    .find(([name]) => v.channel && v.channel.includes(name))?.[1] || {}

  const scheduleText = formatSchedule(v.schedule_date, v.time)

  // 🔴 kalau ada URL → normal video
  if(v.url){
    return `
    <a class="video" href="${v.url}" target="_blank">
      <div class="thumb">
        ${thumb ? `<img loading="lazy" src="${thumb}">` : ""}
      </div>

      <h3>${v.title || ""}</h3>

      ${scheduleText ? `<p class="meta">${scheduleText}</p>` : ""}

      <p class="channel">
        ${ch.avatar ? `<img class="avatar" src="${ch.avatar}">` : ""}
        <span>${v.channel || ""}</span>
      </p>
    </a>
    `
  }

  // 🟡 kalau gak ada URL → card info
  return `
  <div class="video">
    <div class="thumb" style="display:flex;align-items:center;justify-content:center;">
      <span style="opacity:.6;">UPCOMING</span>
    </div>

    <h3>${v.title || ""}</h3>

    ${scheduleText ? `<p class="meta">${scheduleText}</p>` : ""}

    <p class="channel">
      ${ch.avatar ? `<img class="avatar" src="${ch.avatar}">` : ""}
      <span>${v.channel || ""}</span>
    </p>
  </div>
  `
}

/* HOME GRID */
function renderHome(){

const grid=document.getElementById("homeGrid")

const filtered =
videos.filter(v=>v.duration)

const sorted=[...filtered].sort((a,b)=>
new Date(b.date) - new Date(a.date)
)

grid.innerHTML=
sorted
.slice(0,8)
.map(card)
.join("")

}

/* CATEGORY ROW */

function renderCategories(){

const row = document.getElementById("categoryRow")
if(!row) return

const cats = [...new Set(videos.map(v=>v.type))]

if(row.classList.contains("category-scroll")){

  row.innerHTML =
    '<button onclick="renderMedia()">All</button>' +
    cats.map(cat =>
      `<button onclick="filterCat('${cat}')">${cat}</button>`
    ).join("")

  return
}

row.innerHTML = cats.map(cat => {

const count = videos.filter(v=>v.type===cat).length

return `
<div class="categoryCard" onclick="goToCategory('${cat}')">

<div class="catBox">
<h3>${cat}</h3>
<p>${count} videos</p>
</div>

</div>
`

}).join("")

}

function goToCategory(cat){
  window.location.href = `category.html?cat=${encodeURIComponent(cat)}`
}

/*SCHEDULE*/
function formatSchedule(date, time){
  if(!date) return ""

  const d = new Date(date)
  const options = { day: "numeric", month: "short" }
  const formattedDate = d.toLocaleDateString("id-ID", options)

  return time 
    ? `${formattedDate} • ${time}` 
    : formattedDate
}

/*LIVE NOW*/
function getLiveEvents(){
  const now = new Date()

  return videos.filter(v => {
    if(!v.schedule_date || !v.time || !v.url) return false

    const start = parseDateTime(v.schedule_date, v.time)
    if(!start) return false
    const before30 = new Date(start.getTime() - 30*60000)
    const end = new Date(start.getTime() + (v.duration || 120)*60000)

    return now >= before30 && now <= end
  })
}

function renderLiveGrid(){
  const section = document.getElementById("liveSection")
  const container = document.getElementById("liveGrid")
  if(!container || !section) return

  const live = getLiveEvents()

  // ❌ kalau kosong → tetap hidden
  if(live.length === 0){
    section.style.display = "none"
    return
  }

  // ✅ kalau ada → munculin
  section.style.display = "block"

  // 🔥 SORT: live dulu
  live.sort((a,b)=>{
    const aLive = isNowLive(a)
    const bLive = isNowLive(b)

    if(aLive && !bLive) return -1
    if(!aLive && bLive) return 1

    return parseDateTime(a.schedule_date, a.time) - parseDateTime(b.schedule_date, b.time)
  })

  container.innerHTML = live.map(v => {
    const isLive = isNowLive(v)

    return `
    <a class="live-item ${isLive ? "is-live" : "is-soon"}" href="${v.url}" target="_blank">
      
      <div class="live-info">
        <p class="live-title">${v.title || ""}</p>
        <span class="live-channel">${v.channel || ""}</span>
      </div>

      <span class="live-status">
        ${isLive ? "LIVE" : "SOON"}
      </span>

    </a>
    `
  }).join("")
}

function isNowLive(v){
  const now = new Date()
  const start = parseDateTime(v.schedule_date, v.time)
  if(!start) return false

  const end = new Date(start.getTime() + (v.duration || 120)*60000)

  return now >= start && now <= end
}

function parseDateTime(dateStr, timeStr){
  if(!dateStr || !timeStr) return null

  // 🔥 pastiin string
  timeStr = String(timeStr)

  const [year, month, day] = dateStr.split("-").map(Number)

  let hour, minute

  if(timeStr.includes(":")){
    [hour, minute] = timeStr.split(":").map(Number)
  } 
  else if(timeStr.includes(".")){
    [hour, minute] = timeStr.split(".").map(Number)
  } 
  else {
    // fallback kalau format aneh (misal 945)
    if(timeStr.length === 3){
      hour = Number(timeStr[0])
      minute = Number(timeStr.slice(1))
    } else if(timeStr.length === 4){
      hour = Number(timeStr.slice(0,2))
      minute = Number(timeStr.slice(2))
    } else {
      return null
    }
  }

  return new Date(year, month - 1, day, hour, minute)
}

console.log("LIVE EVENTS:", getLiveEvents())

/*CATEGORY*/
function renderCategoryPage(list, cat){

  const grid = document.getElementById("categoryGrid")

  if(!grid) return

  const sorted = [...list].sort((a,b)=>
    new Date(b.date) - new Date(a.date)
  )

  grid.innerHTML = sorted.map(card).join("")
}

/*Media*/
function renderMedia(list=videos, targetId="mediaGrid"){
  const grid = document.getElementById(targetId)
  if(!grid) return

  const sorted = [...list].sort((a,b)=>
    new Date(b.date) - new Date(a.date)
  )

  grid.innerHTML = sorted.map(card).join("")
}

/* FILTER */
function filterCat(cat){

const filtered =
videos.filter(v=>v.type===cat)

renderMedia(filtered)

}

/* SIDEBAR */
document.addEventListener("DOMContentLoaded",()=>{

const menuBtn = document.getElementById("menuBtn")
const sidebar = document.getElementById("sidebar")

if(menuBtn && sidebar){

menuBtn.addEventListener("click",()=>{
sidebar.classList.toggle("open")
})

document.addEventListener("click",(e)=>{
if(
sidebar.classList.contains("open") &&
!sidebar.contains(e.target) &&
!menuBtn.contains(e.target)
){
sidebar.classList.remove("open")
}
})

}

})

/*thumbnail*/
function getVideoId(url){

if(!url) return null

const reg =
/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([^?&]+)/

const match = url.match(reg)

return match ? match[1] : null

}

/*home button*/
const homeBtn = document.querySelector(".homeBtn")

if(homeBtn){

homeBtn.onclick = () => {

window.location.href = "index.html"

}

}

function goToMember(name){
  window.location.href = `member.html?member=${encodeURIComponent(name)}`
}

function handleMemberPage(){
  const params = new URLSearchParams(window.location.search)
  const member = params.get("member")

  if(member && document.getElementById("memberGrid")){
    const filtered = videos.filter(v =>
      v.channel && v.channel.includes(member)
    )

    document.getElementById("memberTitle").innerText = member

    const grid = document.getElementById("memberGrid")

    const sorted = [...filtered].sort((a,b)=>
      new Date(b.date) - new Date(a.date)
    )

    grid.innerHTML = sorted.map(card).join("")
  }
}

function generateWeeks(){
  const base = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  // cari senin pertama sebelum/di bulan ini
  const start = new Date(base)
  const day = start.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  start.setDate(start.getDate() + diff)

  weeks = []

  for(let w=0; w<6; w++){
    const week = []

    for(let d=0; d<7; d++){
      const date = new Date(start)
      date.setDate(start.getDate() + w*7 + d)
      week.push(date)
    }

    weeks.push(week)
  }

  // 👉 default: cari minggu yang ada hari ini
  const todayStr = new Date().toDateString()

  const foundIndex = weeks.findIndex(week =>
    week.some(d => d.toDateString() === todayStr)
  )

  weekIndex = foundIndex !== -1 ? foundIndex : 0
}

/*SCHEDULE*/
function renderCalendarMini(){
  const container = document.getElementById("calendarMini")
if(!container) return

const week = weeks[weekIndex]

const currentMonth = currentDate.getMonth()

// 🔥 SET BULAN
const monthEl = document.getElementById("calendarMonth")
if(monthEl){
  monthEl.innerText = currentDate.toLocaleDateString("id-ID", {
    month:"long",
    year:"numeric"
  })
}

const dayNames = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"]
const days = week.map(d => {

  const dateStr =
    d.getFullYear() + "-" +
    String(d.getMonth()+1).padStart(2,"0") + "-" +
    String(d.getDate()).padStart(2,"0")

  const isToday =
    d.toDateString() === new Date().toDateString()

  const isOtherMonth =
    d.getMonth() !== currentMonth

  const events = videos.filter(v =>
    v.schedule_date && v.schedule_date.trim() === dateStr
  )

const dots = events.slice(0,3).map(v => {

  const name = v.member?.toLowerCase().trim()

  if(name?.includes("yudistira")) return `<span class="dot yudistira"></span>`
  if(name?.includes("bima")) return `<span class="dot bima"></span>`
  if(name?.includes("arjuna")) return `<span class="dot arjuna"></span>`
  if(name?.includes("nakula")) return `<span class="dot nakula"></span>`
  if(name?.includes("sadewa")) return `<span class="dot sadewa"></span>`

  return `<span class="dot"></span>`

}).join("")

  const more = events.length > 2
  ? `<span class="more">+${events.length - 2}</span>`
  : ""

const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1

return `
<div class="calendar-day ${isOtherMonth ? "other-month" : ""} ${isToday ? "active" : ""} ${selectedDate === dateStr ? "selected" : ""}"
     onclick="selectDate(event, '${dateStr}')">

  <span class="day-name">${dayNames[dayIndex]}</span>
  <span class="day-number">${d.getDate()}</span>

  <div class="calendar-dots">
    ${dots}
    ${more}
  </div>

</div>
`
  
})

container.innerHTML = days.join("")
  const prevBtn = document.querySelector(".calendar-wrapper button:first-child")
  const nextBtn = document.querySelector(".calendar-wrapper button:last-child")
  if(prevBtn){
  prevBtn.disabled = currentWeekOffset <= minWeekOffset
  }

if(nextBtn){
  nextBtn.disabled = currentWeekOffset >= maxWeekOffset
  }
}

function renderSelectedEvents(){
  const container = document.getElementById("selectedDateEvents")
  if(!container || !selectedDate) return

  const events = videos
    .filter(v => v.schedule_date?.trim() === selectedDate)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""))

  if(events.length === 0){
    container.innerHTML = `<p style="opacity:.6">No events</p>`
    return
  }
container.innerHTML = events.map(v => {

  const channelName = v.channel || v.Channel || v.member || ""

  const ch =
    Object.entries(channels)
    .find(([name]) => 
      v.member &&
      v.member.toLowerCase().includes(name.toLowerCase())
    )?.[1] || {
      avatar: "https://ui-avatars.com/api/?name=" + encodeURIComponent(channelName)
    }

  const color = getMemberColor(v.member)

  return `
  <div class="event-item" style="background:${color}">
    <img src="${ch.avatar}" class="event-avatar">

    <div class="event-info">
      <p class="event-title">${v.title || ""}</p>
      <span class="event-channel">${channelName}</span>
      <span class="event-time">${v.time || ""}</span>
    </div>
  </div>
  `
}).join("")
}

function selectDate(e, date){
  e.stopPropagation()

  selectedDate = date

  renderCalendarMini()
  renderSelectedEvents()

  const el = document.getElementById("selectedDateEvents")
  if(el){
    el.scrollIntoView({ behavior:"smooth", block:"nearest" })
  }
}

function getMemberColor(name){
  const n = name?.toLowerCase() || ""

  if(n.includes("yudistira")) return "#22c55e"
  if(n.includes("arjuna")) return "#ef4444"
  if(n.includes("nakula")) return "#3b82f6"
  if(n.includes("sadewa")) return "#eab308"
  if(n.includes("bima")) return "#a855f7"

  return "#666"
}

/*HIGHLIGHT*/
function renderHighlights(){
  const container = document.getElementById("highlightCarousel")
  if(!container) return

  const groups = getHighlights()

  container.innerHTML = Object.keys(groups).map(key => {

    const vids = groups[key]

    // ambil video terbaru
    const latest = vids.sort((a,b)=>
      new Date(b.date) - new Date(a.date)
    )[0]

    const id = getVideoId(latest.url)

    const thumb = id
      ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
      : ""

    return `
      <div class="highlight-card" onclick="goToHighlight('${key}')">

        <div class="highlight-bg" style="background-image:url('${thumb}')"></div>

        <div class="highlight-overlay"></div>

        <div class="highlight-content">
          <h3>${key}</h3>
          <p>${vids.length} videos</p>
          <span class="highlight-desc">Deskripsi kamu di sini</span>
        </div>

      </div>
    `
  }).join("")
}

function getHighlights(){
  const groups = {}

  videos.forEach(v => {
    const key = v.highlight?.toLowerCase().trim()
    if(!key) return

    if(!groups[key]){
      groups[key] = []
    }

    groups[key].push(v)
  })

  return groups
}

function goToHighlight(key){
  window.location.href = `highlight.html?highlight=${encodeURIComponent(key)}`
}

console.log("HIGHLIGHTS:", getHighlights())

function renderDots(total){
  const dots = document.querySelector(".highlight-dots")
  dots.innerHTML = Array(total).fill(0).map(()=>`<span></span>`).join("")
}

setInterval(() => {
  renderLiveGrid()
}, 60000)

loadVideos()
