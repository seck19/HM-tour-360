// Duyet het 11 hang muc: anh nen, ban thuyet minh, tieu de va diem nong.
import { chromium } from '@playwright/test'

const BASE = process.env.SHOT_BASE ?? 'http://127.0.0.1:4180'
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const failures = []
page.on('response', (r) => {
  if (r.status() >= 400) failures.push(`http ${r.status()} ${r.url()}`)
})
page.on('pageerror', (e) => failures.push(`pageerror: ${e.message}`))

const readState = () => page.evaluate(() => {
  const audio = document.querySelector('audio')
  const play = document.querySelector('.dock-play')
  const box = document.querySelector('.narration-dock')?.getBoundingClientRect()
  return {
    scene: new URL(location.href).searchParams.get('scene'),
    title: document.querySelector('.scene-copy h1')?.textContent ?? '',
    dock: document.querySelector('.dock-meta strong')?.textContent ?? '',
    audioSrc: audio?.getAttribute('src') ?? null,
    duration: Number.isFinite(audio?.duration) ? Math.round(audio.duration) : null,
    disabled: play ? play.disabled : null,
    emptyNote: document.querySelector('.dock-empty')?.textContent ?? null,
    markers: document.querySelectorAll('.psv-virtual-tour-link').length,
    inViewport: box ? box.top >= 0 && box.bottom <= innerHeight + 1 : null,
  }
})

const waitFor = async (predicate, timeout = 25000) => {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (predicate(await readState())) return true
    await page.waitForTimeout(250)
  }
  return false
}

await page.goto(`${BASE}/?scene=tu-tru`, { waitUntil: 'load' })
await page.locator('.loading-screen').waitFor({ state: 'hidden', timeout: 30000 })
await waitFor((s) => s.scene === 'tu-tru' && s.markers >= 1)

const ids = await page.$$eval('.scene-card', (cards) => cards.map((c) => c.getAttribute('data-scene')))
console.log('so hang muc trong danh sach:', ids.length)
if (ids.length !== 11) failures.push(`danh sach phai co 11 hang muc, dang co ${ids.length}`)

for (const id of ids) {
  if (id !== 'tu-tru') {
    await page.locator(`.scene-card[data-scene="${id}"]`).click()
    const arrived = await waitFor((s) => s.scene === id && s.markers >= 1)
    if (!arrived) failures.push(`hang muc ${id}: khong chuyen duoc canh`)
  }
  await page.waitForTimeout(400)
  const state = await readState()

  const problems = []
  if (state.scene !== id) problems.push(`url=${state.scene}`)
  if (state.title.length < 3) problems.push('thieu tieu de')
  if (state.dock !== state.title) problems.push(`dock="${state.dock}"`)
  if (state.audioSrc === null) problems.push('thieu ban thu thuyet minh')
  else if (!state.audioSrc.endsWith(`${id}.mp3`)) problems.push(`audio sai: ${state.audioSrc}`)
  if (state.disabled !== false) problems.push('nut phat bi tat')
  if (state.emptyNote) problems.push('hien thong bao thieu ban thu')
  if (state.duration !== null && state.duration < 10) problems.push(`ban thu qua ngan (${state.duration}s)`)
  if (state.markers < 1) problems.push('khong co diem nong dan canh')
  if (state.inViewport !== true) problems.push('thanh thuyet minh tran khung')
  if (problems.length) failures.push(`hang muc ${id}: ${problems.join(', ')}`)

  const mark = problems.length ? 'x' : '.'
  console.log(`${mark} ${id.padEnd(34)} "${state.title}"  audio=${state.audioSrc ?? '-'}  ${state.duration ?? '?'}s  markers=${state.markers}`)
}

const theme = await page.evaluate(() => {
  const h1 = document.querySelector('.scene-copy h1')
  const l = document.querySelector('.scene-list')
  const play = document.querySelector('.dock-play')
  return {
    displayFont: h1 ? getComputedStyle(h1).fontFamily : null,
    dockAccent: play ? getComputedStyle(play).backgroundImage.slice(0, 70) : null,
    beVietnamProLoaded: document.fonts ? document.fonts.check('16px "Be Vietnam Pro"') : null,
    playfairLoaded: document.fonts ? document.fonts.check('16px "Playfair Display"') : null,
    listScrollable: l ? l.scrollHeight > l.clientHeight : null,
  }
})
console.log('\ntheme:', JSON.stringify(theme, null, 2))

await browser.close()

console.log('\n--- KET LUAN ---')
const real = [...new Set(failures)]
if (real.length === 0) console.log(' tat ca hang muc dat')
else real.forEach((f) => console.log(' x', f))
process.exit(real.length === 0 ? 0 : 1)