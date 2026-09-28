// Chụp ảnh giao diện để kiểm tra bằng mắt. Không phải test tự động.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.env.SHOT_BASE ?? 'http://127.0.0.1:4180'
const OUT = 'preview'

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome' })
const shots = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, url: '/?scene=tu-tru' },
  { name: 'desktop-dan-the', viewport: { width: 1440, height: 900 }, url: '/?scene=dan-the' },
  { name: 'desktop-info', viewport: { width: 1440, height: 900 }, url: '/?scene=den-chinh', info: true },
  { name: 'mobile', viewport: { width: 390, height: 844 }, url: '/?scene=quan-tien' },
]

for (const shot of shots) {
  const page = await browser.newPage({ viewport: shot.viewport })
  await page.goto(BASE + shot.url, { waitUntil: 'load' })
  await page.locator('.loading-screen.is-hidden').waitFor({ timeout: 30_000 })
  await page.waitForTimeout(2500)
  if (shot.info) {
    await page.getByRole('button', { name: /Thông tin hạng mục/ }).click()
    await page.waitForTimeout(800)
  }
  await page.screenshot({ path: `${OUT}/${shot.name}.png` })
  console.log('saved', shot.name)
  await page.close()
}

await browser.close()
