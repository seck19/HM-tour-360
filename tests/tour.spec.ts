import { expect, test } from '@playwright/test'

/** Chờ màn hình chờ biến mất, tức panorama đầu tiên đã dựng xong. */
const waitForTour = (page: import('@playwright/test').Page) =>
  expect(page.locator('.loading-screen')).toHaveClass(/is-hidden/, { timeout: 20_000 })

test('mở panorama và chuyển giữa các hạng mục', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))

  await page.goto('/?scene=tu-tru')
  await expect(page.locator('.psv-canvas-container')).toBeVisible()
  await waitForTour(page)
  await expect(page.locator('h1')).toHaveText('Nghi môn ngoại')

  await page.locator('.scene-card[data-scene="dan-the"]').click()
  await expect(page).toHaveURL(/scene=dan-the/)
  await expect(page.locator('h1')).toHaveText('Đàn Thề')

  await page.locator('.scene-card[data-scene="go-giau-an"]').click()
  await expect(page).toHaveURL(/scene=go-giau-an/)
  await expect(page.locator('h1')).toHaveText('Gò Giấu Ấn')

  expect(runtimeErrors).toEqual([])
})

test('thanh thuyết minh nạp đúng bản thu của hạng mục', async ({ page }) => {
  await page.goto('/?scene=nghi-mon')
  await waitForTour(page)

  const audio = page.locator('audio')
  await expect(audio).toHaveAttribute('src', '/audio/02-nghi-mon.mp3')
  await expect(page.locator('.dock-meta strong')).toHaveText('Nghi môn')

  await page.locator('.scene-card[data-scene="quan-tien"]').click()
  await expect(audio).toHaveAttribute('src', '/audio/04-quan-tien.mp3', { timeout: 10_000 })
  await expect(page.locator('.dock-meta strong')).toHaveText('Quán Tiên')

  await page.locator('.scene-card[data-scene="ta-huu-mac"]').click()
  await expect(audio).toHaveAttribute('src', '/audio/07-ta-huu-mac.mp3', { timeout: 10_000 })
  await expect(page.locator('.dock-play')).toBeEnabled()
  await expect(page.locator('.dock-empty')).toHaveCount(0)
})

test('cả 11 hạng mục đều có ảnh nền và bản thuyết minh riêng', async ({ page }) => {
  await page.goto('/?scene=tu-tru')
  await waitForTour(page)

  const ids = await page.$$eval('.scene-card', (cards) =>
    cards.map((card) => card.getAttribute('data-scene') ?? ''),
  )
  expect(ids).toHaveLength(11)

  for (const id of ids) {
    await page.locator(`.scene-card[data-scene="${id}"]`).click()
    await expect(page.locator('.dock-meta strong')).not.toHaveText('', { timeout: 15_000 })
    await expect(page.locator('audio')).toHaveAttribute('src', new RegExp(`${id}\\.mp3$`), {
      timeout: 15_000,
    })
    await expect(page.locator('.dock-play')).toBeEnabled()
  }
})

test('điều khiển vẫn dùng được trên di động', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?scene=nghi-mon')
  await waitForTour(page)

  await expect(page.locator('.sidebar')).not.toHaveClass(/is-open/)
  await expect(page.locator('h1')).toHaveText('Nghi môn')

  await page.getByTitle('Hạng mục tiếp').click()
  await expect(page).toHaveURL(/scene=dan-the/)

  await page.getByTitle('Tự động xoay').click()
  await expect(page.getByTitle('Tự động xoay')).toHaveClass(/is-active/)
})

test('điểm nóng trong panorama mở hạng mục được liên kết', async ({ page }) => {
  await page.goto('/?scene=tu-tru')
  await waitForTour(page)

  const hotspot = page.locator('.psv-virtual-tour-link').first()
  await expect(hotspot).toBeVisible()
  await hotspot.click()

  await expect(page).toHaveURL(/scene=nghi-mon/, { timeout: 10_000 })
  await expect(page.locator('h1')).toHaveText('Nghi môn')
})
