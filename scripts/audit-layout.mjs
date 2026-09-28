// Kiểm tra bố cục và hành vi thuyết minh bằng số đo thực tế từ trình duyệt.
import { chromium } from '@playwright/test'

const BASE = process.env.SHOT_BASE ?? 'http://127.0.0.1:4180'
const browser = await chromium.launch({ channel: 'chrome' })
const problems = []
const notes = []

const overlap = (a, b) => {
  if (!a || !b) return 0
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return w > 2 && h > 2 ? Math.round(w * h) : 0
}

async function audit(label, viewport, url, extra) {
  const page = await browser.newPage({ viewport })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`http ${r.status()} ${r.url()}`)
  })

  await page.goto(BASE + url, { waitUntil: 'load' })
  await page.locator('.loading-screen.is-hidden').waitFor({ timeout: 30_000 })
  await page.waitForTimeout(1800)
  if (extra) await extra(page)

  const box = async (sel) => {
    const el = page.locator(sel).first()
    if ((await el.count()) === 0) return null
    return el.boundingBox()
  }

  const hud = await box('.hud')
  const dock = await box('.narration-dock')
  const controls = await box('.bottom-controls')
  const copy = await box('.scene-copy')
  const hudRow = await box('.hud-row')
  const topbar = await box('.topbar')
  const sidebar = await box('.sidebar.is-open')
  const panel = await box('.info-panel.is-open')

  const vw = viewport.width
  const vh = viewport.height

  if (!dock) problems.push(`${label}: thiếu thanh thuyết minh`)
  if (!controls) problems.push(`${label}: thiếu cụm điều khiển`)
  if (!hud) problems.push(`${label}: thiếu khu hud`)

  for (const [name, b] of Object.entries({ hud, dock, controls, copy, topbar, panel })) {
    if (!b) continue
    if (b.x < -2 || b.y < -2 || b.x + b.width > vw + 2 || b.y + b.height > vh + 2) {
      problems.push(`${label}: ${name} tràn khỏi khung (${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}) trong ${vw}x${vh}`)
    }
  }

  if (copy && hudRow && copy.y + copy.height > hudRow.y + 2) {
    problems.push(`${label}: tiêu đề hạng mục đè lên thanh điều khiển (đáy ${Math.round(copy.y + copy.height)} > ${Math.round(hudRow.y)})`)
  }
  if (copy && topbar && copy.y < topbar.y + topbar.height) {
    problems.push(`${label}: tiêu đề hạng mục chạm thanh trên cùng`)
  }
  const dOk = overlap(dock, controls)
  if (dOk) problems.push(`${label}: thanh thuyết minh chồng cụm điều khiển (${dOk}px²)`)
  if (sidebar && dock && sidebar.x + sidebar.width > dock.x + 4) {
    const order = await page.evaluate(() => {
      const z = (sel) => {
        const el = document.querySelector(sel)
        if (!el) return null
        let node = el
        let value = 0
        while (node) {
          const zi = getComputedStyle(node).zIndex
          if (zi !== 'auto') value = Math.max(value, Number(zi))
          node = node.parentElement
        }
        return value
      }
      return { sidebar: z('.sidebar'), dock: z('.narration-dock') }
    })
    if (!(order.sidebar > order.dock)) {
      problems.push(`${label}: thanh thuyết minh nằm trên ngăn kéo hạng mục (z ${order.dock} >= ${order.sidebar})`)
    }
  }
  if (panel && dock && overlap(panel, dock)) notes.push(`${label}: bảng thông tin phủ lên hud (bình thường)`)

  // --- Hành vi thuyết minh ---
  const state = await page.evaluate(async () => {
    const el = document.querySelector('audio')
    const hidden = el ? getComputedStyle(el).display : null
    return {
      src: el?.getAttribute('src') ?? null,
      readyState: el?.readyState ?? -1,
      duration: Number.isFinite(el?.duration) ? Math.round(el.duration) : null,
      paused: el?.paused ?? null,
      hidden,
    }
  })
  notes.push(`${label}: audio ${JSON.stringify(state)}`)

  if (state.src && state.duration !== null && state.duration < 10) {
    problems.push(`${label}: bản thu quá ngắn (${state.duration}s)`)
  }

  // Bấm sang hạng mục khác rồi kiểm tra tự phát.
  if (!extra) {
    // Trên di động danh sách nằm trong ngăn kéo đang đóng -> mở ra trước.
    if ((await page.locator('.sidebar.is-open').count()) === 0) {
      await page.locator('.menu-toggle').click()
      await page.waitForTimeout(700)
      const drawer = await box('.sidebar')
      const dock2 = await box('.narration-dock')
      if (drawer && dock2 && overlap(drawer, dock2)) {
        const order = await page.evaluate(() => {
          const z = (sel) => {
            const el = document.querySelector(sel)
            if (!el) return null
            let node = el
            let value = 0
            while (node) {
              const zi = getComputedStyle(node).zIndex
              if (zi !== 'auto') value = Math.max(value, Number(zi))
              node = node.parentElement
            }
            return value
          }
          return { drawer: z('.sidebar'), dock: z('.narration-dock') }
        })
        if (!(order.drawer > order.dock)) {
          problems.push(`${label}: thanh thuyết minh đè lên ngăn kéo hạng mục (z ${order.dock} >= ${order.drawer})`)
        }
      }
    }
    await page.locator('.scene-card[data-scene="dan-the"]').click()
    await page.waitForTimeout(2500)
    const after = await page.evaluate(() => {
      const el = document.querySelector('audio')
      return { src: el?.getAttribute('src'), paused: el?.paused, t: Number(el?.currentTime.toFixed(1)) }
    })
    notes.push(`${label}: sau khi chuyển hạng mục ${JSON.stringify(after)}`)
    if (after.src !== '/audio/03-dan-the.mp3') problems.push(`${label}: chưa nạp đúng audio của Đàn Thề (${after.src})`)
    if (after.paused !== false) problems.push(`${label}: thuyết minh không tự phát sau khi bấm hạng mục`)
    if (!(after.t > 0)) problems.push(`${label}: thời gian phát không tiến (${after.t})`)
  }

  // Phóng to/thu nhỏ và kéo vẫn hoạt động.
  const hint = await box('.interaction-hint')
  if (hint) notes.push(`${label}: interaction-hint ${hint.width > 0 ? 'hiện' : 'ẩn'}`)

  if (errors.length) problems.push(`${label}: lỗi runtime -> ${errors.join(' | ')}`)
  await page.close()
}

await audit('desktop-1440', { width: 1440, height: 900 }, '/?scene=tu-tru')
await audit('laptop-1280', { width: 1280, height: 800 }, '/?scene=nghi-mon')
await audit('tablet-1024', { width: 1024, height: 768 }, '/?scene=den-chinh')
await audit('mobile-390', { width: 390, height: 844 }, '/?scene=quan-tien')
await audit('mobile-360', { width: 360, height: 640 }, '/?scene=go-giau-an')
await audit('desktop-info', { width: 1440, height: 900 }, '/?scene=den-chinh', async (page) => {
  await page.getByRole('button', { name: /Thông tin hạng mục/ }).click()
  await page.waitForTimeout(700)
})

await browser.close()

console.log('\n--- GHI CHÚ ---')
notes.forEach((n) => console.log(' •', n))
console.log('\n--- VẤN ĐỀ ---')
if (problems.length === 0) console.log(' (không có)')
else problems.forEach((p) => console.log(' ✗', p))
process.exit(problems.length === 0 ? 0 : 1)
