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

/* =========================
   🔥 MEMBER SYSTEM (BARU)
========================= */

const MEMBERS = {
  yudistira: {
    color: "#22c55e",
    channel: "Yudistira Yogendra"
  },
  bima: {
    color: "#a855f7",
    channel: "Bima Bayusena"
  },
  arjuna: {
    color: "#ef4444",
    channel: "Arjuna Arkana"
  },
  nakula: {
    color: "#3b82f6",
    channel: "Nakula Nalendra"
  },
  sadewa: {
    color: "#eab308",
    channel: "Sadewa Sagara"
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

function getMemberInfo(name=""){
  const key = Object.keys(MEMBERS).find(k =>
    name.toLowerCase().includes(k)
  )

  if(!key){
    return {
      color: "#666",
      channel: name,
      avatar: "https://ui-avatars.com/api/?name=" + encodeURIComponent(name)
    }
  }

  const data = MEMBERS[key]
  const ch = channels[data.channel] || {}

  return {
    color: data.color,
    channel: data.channel,
    avatar: ch.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(data.channel)
  }
}

/* =========================
   LOAD DATA
========================= */

async function loadVideos(){
  try{
    const res = await fetch(API)
    const data = await res.json()

    videos = data
    generateWeeks()
    renderSidebar()
    renderMiniSidebar()

    const today = new Date()
    selectedDate = today.toISOString().split("T")[0]

    if(document.getElementById("highlightCarousel")) renderHighlights()
    if(document.getElementById("calendarMini")) renderCalendarMini()

    renderSelectedEvents()
    
    if(document.getElementById("upcomingGrid")) renderUpcoming()
    if(document.getElementById("categoryRow")) renderCategories()
    if(document.getElementById("homeGrid")) renderHome()

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

  }catch(err){
    console.error("ERROR FETCH:", err)
  }
}

/* =========================
   SIDEBAR
========================= */
function renderSidebar(){
  const sidebar = document.getElementById("sidebar")
  if(!sidebar) return

  const members = [...new Set(videos.map(v => v.member))]

  sidebar.innerHTML = members.map(m => `
    <div class="sidebar-item" onclick="filterMember('${m}')">
      <img src="${avatars[m] || ''}" />
    </div>
  `).join("")
}

function renderMiniSidebar(){
  const mini = document.getElementById("miniSidebar")
  if(!mini) return

  const members = [...new Set(videos.map(v => v.member))]

  mini.innerHTML = members.map(m => `
    <div class="mini-item" onclick="filterMember('${m}')">
      <img src="${avatars[m] || ''}" />
    </div>
  `).join("")
}

function filterMember(member){
  const filtered = videos.filter(v => v.member === member)

  renderMedia(filtered, "memberGrid")
}

/* =========================
   VIDEO CARD (AMAN)
========================= */

function card(v){
  const id = getVideoId(v.url)
  const thumb = id
    ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    : ""

  const member = getMemberInfo(v.member || v.channel || "")
  const scheduleText = formatSchedule(v.schedule_date, v.time)

  if(v.url){
    return `
    <a class="video" href="${v.url}" target="_blank">
      <div class="thumb">
        ${thumb ? `<img loading="lazy" src="${thumb}">` : ""}
      </div>

      <h3>${v.title || ""}</h3>
      ${scheduleText ? `<p class="meta">${scheduleText}</p>` : ""}

      <p class="channel">
        <img class="avatar" src="${member.avatar}">
        <span>${member.channel}</span>
      </p>
    </a>
    `
  }

  return `
  <div class="video">
    <div class="thumb">UPCOMING</div>
    <h3>${v.title || ""}</h3>
    ${scheduleText ? `<p class="meta">${scheduleText}</p>` : ""}
    <p class="channel">
      <img class="avatar" src="${member.avatar}">
      <span>${member.channel}</span>
    </p>
  </div>
  `
}

/* =========================
   UPCOMING & NEW
========================= */
function renderUpcoming(){
  const container = document.getElementById("upcomingGrid")
  if(!container) return

  const now = new Date()

  const upcoming = videos
    .filter(v => new Date(v.schedule) > now)
    .sort((a,b) => new Date(a.schedule) - new Date(b.schedule))
    .slice(0,6)

  container.innerHTML = upcoming.map(v => card(v)).join("")
}

function renderNew(){
  const container = document.getElementById("newGrid")
  if(!container) return

  const sorted = [...videos]
    .sort((a,b) => new Date(b.upload_date) - new Date(a.upload_date))
    .slice(0,6)

  container.innerHTML = sorted.map(v => card(v)).join("")
}

/* =========================
   CALENDAR
========================= */

function renderCalendarMini(){
  const container = document.getElementById("calendarMini")
  if(!container) return

  const week = weeks[weekIndex]
  const dayNames = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"]

  container.innerHTML = week.map((d,i)=>{
    const dateStr = d.toISOString().split("T")[0]

    const events = videos.filter(v =>
      v.schedule_date?.trim() === dateStr
    )

    const dots = events.map(v=>{
      const m = getMemberInfo(v.member || "")
      return `<span class="dot" style="background:${m.color}"></span>`
    }).join("")

    return `
    <div class="calendar-day ${selectedDate===dateStr?"selected":""}"
         onclick="selectDate(event,'${dateStr}')">
      <span class="day-name">${dayNames[i]}</span>
      <span class="day-number">${d.getDate()}</span>
      <div class="calendar-dots">${dots}</div>
    </div>
    `
  }).join("")
}

/* =========================
   EVENT LIST (FIXED)
========================= */

function renderSelectedEvents(){
  const container = document.getElementById("selectedDateEvents")
  if(!container || !selectedDate) return

  const events = videos
    .filter(v => v.schedule_date?.trim() === selectedDate)
    .sort((a,b)=> (a.time||"").localeCompare(b.time||""))

  if(events.length===0){
    container.innerHTML = `<p style="opacity:.6">No events</p>`
    return
  }

  container.innerHTML = events.map(v=>{
    const m = getMemberInfo(v.member || v.channel || "")

    return `
    <div class="event-item" style="background:${m.color}">
      <img src="${m.avatar}" class="event-avatar">

      <div class="event-info">
        <p class="event-title">${v.title || ""}</p>
        <span class="event-channel">${m.channel}</span>
        <span class="event-time">${v.time || ""}</span>
      </div>
    </div>
    `
  }).join("")
}

function selectDate(e,date){
  e.stopPropagation()
  selectedDate=date
  renderCalendarMini()
  renderSelectedEvents()
}

/* =========================
   HELPERS
========================= */

function getVideoId(url){
  if(!url) return null
  const match = url.match(/(?:youtu\.be\/|v=|embed\/|live\/|shorts\/)([^?&]+)/)
  return match ? match[1] : null
}

function formatSchedule(date, time){
  if(!date) return ""
  const d = new Date(date)
  const formatted = d.toLocaleDateString("id-ID",{day:"numeric",month:"short"})
  return time ? `${formatted} • ${time}` : formatted
}

/* =========================
   WEEKS
========================= */

function generateWeeks(){
  const base = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

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

  const todayStr = new Date().toDateString()
  weekIndex = weeks.findIndex(w=>w.some(d=>d.toDateString()===todayStr))
}

/* =========================
   HIGHLIGHT (BALIKIN)
========================= */

function renderHighlights(){
  const container = document.getElementById("highlightCarousel")
  if(!container) return

  const groups = getHighlights()

  container.innerHTML = Object.keys(groups).map(key => {

    const vids = groups[key]

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

loadVideos()
