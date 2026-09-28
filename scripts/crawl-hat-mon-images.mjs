import { createHash } from 'node:crypto'
import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const outputDir = path.join(root, 'public', 'reference', 'hat-mon-temple-gallery')
const manifestPath = path.join(root, 'public', 'reference', 'sources.json')
const userAgent = 'Hat-Mon-360-demo-dataset/2.0 (+local research prototype)'

const sourcePages = [
  {
    id: 'wikimedia-commons-hat-mon',
    page: 'https://commons.wikimedia.org/wiki/Category:H%C3%A1t_M%C3%B4n_Temple',
    owner: 'Wikimedia Commons contributors',
    kind: 'wikimedia-category',
    license: 'Per-file Creative Commons license recorded in the manifest',
  },
  {
    id: 'hat-mon-opening-festival-2026',
    page: 'https://hatmon.hanoi.gov.vn/van-hoa-xa-hoi-68156/le-khai-hoi-xuan-binh-ngo-2026-diem-du-lich-di-tich-quoc-gia-dac-biet-den-hat-mon-2705260225161009422.htm',
    owner: 'Trang TTĐT xã Hát Môn',
  },
  {
    id: 'hat-mon-festival-preparation-2026',
    page: 'https://hatmon.hanoi.gov.vn/van-hoa-xa-hoi-68156/hat-mon-hoan-tat-cong-tac-chuan-bi-le-khai-mac-le-hoi-den-hat-mon-xuan-binh-ngo-2026-2705260222104349348.htm',
    owner: 'Trang TTĐT xã Hát Môn',
  },
  {
    id: 'hat-mon-festival-echo-2026',
    page: 'https://hatmon.hanoi.gov.vn/van-hoa-xa-hoi-68156/le-khai-hoi-den-hat-mon-am-vang-hao-khi-hai-ba-trung-2705260214130031418.htm',
    owner: 'Trang TTĐT xã Hát Môn',
  },
  {
    id: 'hat-mon-water-ritual-2026',
    page: 'https://hatmon.hanoi.gov.vn/van-hoa-xa-hoi-68156/nghi-le-cap-thuy-den-hat-mon-2705260209181251212.htm',
    owner: 'Trang TTĐT xã Hát Môn',
  },
  {
    id: 'hat-mon-folk-music-2026',
    page: 'https://hatmon.hanoi.gov.vn/van-hoa-xa-hoi-68156/giao-luu-hat-dan-ca-va-nhac-co-truyen-xa-hat-mon-nam-2026-sac-mau-van-hoa-trong-le-hoi-den-hat-mon-2705260420161512407.htm',
    owner: 'Trang TTĐT xã Hát Môn',
  },
  {
    id: 'hat-mon-sacred-space-2026',
    page: 'https://hatmon.hanoi.gov.vn/van-hoa-xa-hoi-68156/den-hat-mon-khong-gian-linh-thieng-hoi-tu-noi-giao-thoa-giua-chieu-sau-lich-su-va-sac-mau-le-hoi-truyen-thong-2705260419141043907.htm',
    owner: 'Trang TTĐT xã Hát Môn',
  },
  {
    id: 'hat-mon-community-offering-2026',
    page: 'https://hatmon.hanoi.gov.vn/van-hoa-xa-hoi-68156/nhan-dan-hat-mon-dang-le-tuong-niem-1983-nam-ngay-gio-hai-ba-2705260419125413985.htm',
    owner: 'Trang TTĐT xã Hát Môn',
  },
  {
    id: 'hat-mon-womens-union-incense-2026',
    page: 'https://hatmon.hanoi.gov.vn/hoat-dong-mat-tran-to-quoc-va-cac-doan-the-chinh-tri-xa-hoi/ban-thuong-vu-hoi-lien-hiep-phu-nu-xa-hat-mon-to-chuc-le-dang-huong-tai-den-hat-mon-2705260306095125368.htm',
    owner: 'Trang TTĐT xã Hát Môn',
  },
  {
    id: 'hat-mon-student-visit-2026',
    page: 'https://hatmon.hanoi.gov.vn/van-hoa-xa-hoi-68156/doan-phu-huynh-va-hoc-sinh-lop-7a6-truong-thcs-tran-duy-hung-tham-quan-dang-huong-tai-den-hat-mon-2705260112112829568.htm',
    owner: 'Trang TTĐT xã Hát Môn',
  },
  {
    id: 'hat-mon-landscape-project-2026',
    page: 'https://hatmon.hanoi.gov.vn/van-hoa-xa-hoi-68156/trien-khai-thi-cong-xay-dung-du-an-chinh-trang-canh-quan-khu-vuc-den-hat-mon-2705260227164312218.htm',
    owner: 'Trang TTĐT xã Hát Môn',
  },
  {
    id: 'hat-mon-expansion-workshop-2026',
    page: 'https://hatmon.hanoi.gov.vn/van-hoa-xa-hoi-68156/mo-rong-den-hat-mon-ton-vinh-cac-tuong-linh-khoi-nghia-hai-ba-trung-2705260620145819085.htm',
    owner: 'Trang TTĐT xã Hát Môn',
  },
  {
    id: 'hat-mon-spring-decoration-2026',
    page: 'https://hatmon.hanoi.gov.vn/van-hoa-xa-hoi-68156/hat-mon-trang-hoang-co-hoa-chao-mung-dai-hoi-dang-toan-quoc-lan-thu-xiv-bau-cu-quoc-hoi-va-hdnd-cac-cap-nhiem-ky-2026-2031-chao-xuan-binh-ngo-2026-2705260112105232603.htm',
    owner: 'Trang TTĐT xã Hát Môn',
  },
  {
    id: 'hat-mon-youth-performance-2026',
    page: 'https://hatmon.hanoi.gov.vn/hoat-dong-mat-tran-to-quoc-va-cac-doan-the-chinh-tri-xa-hoi/tuoi-tre-hat-mon-soi-noi-chuong-trinh-van-nghe-chao-mung-cac-su-kien-trong-dai-2705260413134816878.htm',
    owner: 'Trang TTĐT xã Hát Môn',
  },
  {
    id: 'government-tourism-feature-2024',
    page: 'https://thanglong.chinhphu.vn/diem-den-du-lich-tam-linh-cua-phuc-tho-103241208163603132.htm',
    owner: 'Báo Điện tử Chính phủ',
    allowedHosts: ['tl.cdnchinhphu.vn'],
  },
  {
    id: 'hanoi-culture-memorial-2026',
    page: 'https://sovhtt.hanoi.gov.vn/xa-hat-mon-to-chuc-le-dang-huong-tuong-niem-1983-nam-ngay-gio-hai-ba-trung/',
    owner: 'Sở Văn hóa và Thể thao Hà Nội',
    allowedHosts: ['sovhtt.hanoi.gov.vn'],
    urlIncludes: ['/wp-content/uploads/2026/04/'],
  },
  {
    id: 'hanoi-party-committee-memorial-2026',
    page: 'https://thanhuyhanoi.vn/tin-tuc/xa-hat-mon/xa-hat-mon-trang-nghiem-tuong-niem-1983-nam-ngay-gio-hai-ba-trung-50042510.html',
    owner: 'Thành ủy Hà Nội',
    allowedHosts: ['thanhuyhanoi.vn'],
    urlIncludes: ['/2026/4/22/50042510/'],
  },
  {
    id: 'mia-hat-mon-guide',
    page: 'https://mia.vn/cam-nang-du-lich/le-hoi-den-hat-mon-tuong-nho-cong-lao-hai-ba-trung-nam-nao-2884',
    owner: 'MIA.vn',
    allowedHosts: ['media.mia.vn', 'mia.vn'],
    urlIncludes: ['le-hoi-den-hat-mon-tuong-nho-cong-lao-hai-ba-trung-nam-nao'],
  },
  {
    id: 'nguoi-ha-noi-hat-mon-festival',
    page: 'https://nguoihanoi.vn/phat-huy-gia-tri-van-hoa-ngay-hai-ba-trung-hoi-quan-te-co-khoi-nghia-78407.html',
    owner: 'Người Hà Nội',
    allowedHosts: ['nhn.1cdn.vn', 'nguoihanoi.vn'],
  },
  {
    id: 'hat-mon-tourism-recognition',
    page: 'https://thiennhienmoitruong.vn/phuc-tho-ha-noi-den-hat-mon-duoc-cong-nhan-la-diem-du-lich.html',
    owner: 'Tạp chí Thiên nhiên và Môi trường',
    allowedHosts: ['thiennhienmoitruong.vn'],
    urlIncludes: ['/upload/images/btv/bvt8/btv8.1.4/bvt1.4b/'],
  },
  {
    id: 'hat-mon-history-feature',
    page: 'https://tapchivietnamhuongsac.vn/den-hat-mon-dau-an-lich-su-cua-hai-ba-trung-1292.html',
    owner: 'Tạp chí Việt Nam Hương Sắc',
    allowedHosts: ['tapchivietnamhuongsac.vn'],
    urlIncludes: ['/2025/042025/01/18/', '/2025/042025/02/12/'],
  },
]

const imageExtension = /\.(?:jpe?g|png|webp)(?:$|[?#])/i
const excludedAsset = /(?:logo|favicon|avatar|icon|sprite|placeholder|loading|quoc[-_]?huy|banner|default-image)/i

function decodeHtml(value) {
  return value
    .replaceAll('\\/', '/')
    .replaceAll('&amp;', '&')
    .replaceAll('&#038;', '&')
    .replaceAll('&quot;', '"')
}

function normalizeImageUrl(value, page) {
  try {
    const clean = decodeHtml(value.trim()).replace(/^['"]|['"]$/g, '')
    const url = new URL(clean, page)
    url.hash = ''
    return url.href
  } catch {
    return null
  }
}

function keepImage(url, source) {
  if (!imageExtension.test(url)) return false
  const parsed = new URL(url)
  if (source.allowedHosts?.length && !source.allowedHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))) return false
  if (source.urlIncludes?.length && !source.urlIncludes.some((part) => url.includes(part))) return false
  if (excludedAsset.test(parsed.pathname)) return false
  if (/\/(?:thumb_w|zoom|\.v-thumb)\//i.test(parsed.pathname)) return false
  if (/-\d+x\d+\.(?:jpe?g|png|webp)$/i.test(parsed.pathname)) return false
  return true
}

function extractHtmlImages(html, source) {
  const normalizedHtml = decodeHtml(html)
  const originalPattern = /data-original=["']([^"']+)["']/gi
  const attributePattern = /(?:data-src|data-lazy-src|data-image|src)=["']([^"']+)["']/gi
  const absolutePattern = /https?:\/\/[^"'\s<>]+?\.(?:jpe?g|png|webp)(?:\?[^"'\s<>]*)?/gi
  const original = [...normalizedHtml.matchAll(originalPattern)].map((match) => match[1])
  const candidates = original.length
    ? original
    : [
        ...[...normalizedHtml.matchAll(attributePattern)].map((match) => match[1]),
        ...[...normalizedHtml.matchAll(absolutePattern)].map((match) => match[0]),
      ]

  const urls = candidates
    .flatMap((candidate) => candidate.includes(',') ? candidate.split(',').map((part) => part.trim().split(/\s+/)[0]) : [candidate])
    .map((candidate) => normalizeImageUrl(candidate, source.page))
    .filter(Boolean)
    .filter((url) => keepImage(url, source))
  return [...new Set(urls)]
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': userAgent,
      accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
      'accept-language': 'vi-VN,vi;q=0.9,en;q=0.7',
    },
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`)
  return response.text()
}

async function fetchWikimediaCategory(source) {
  const api = new URL('https://commons.wikimedia.org/w/api.php')
  api.search = new URLSearchParams({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: 'Category:Hát Môn Temple',
    gcmtype: 'file',
    gcmlimit: 'max',
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '4096',
    format: 'json',
    origin: '*',
  })
  const payload = JSON.parse(await fetchText(api))
  return Object.values(payload.query?.pages ?? {}).flatMap((page) => {
    const info = page.imageinfo?.[0]
    if (!info?.url || !/^image\/(?:jpeg|png|webp)$/i.test(info.mime ?? '')) return []
    return [{
      ...source,
      url: info.thumburl ?? info.url,
      originalUrl: info.url,
      assetPage: info.descriptionurl,
      title: page.title?.replace(/^File:/, ''),
      width: info.width,
      height: info.height,
      license: info.extmetadata?.LicenseShortName?.value ?? source.license,
      creator: info.extmetadata?.Artist?.value?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    }]
  })
}

async function fetchBuffer(item) {
  const response = await fetch(item.url, {
    headers: {
      'user-agent': userAgent,
      accept: 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5',
      referer: item.page,
    },
  })
  if (response.status === 429 && (item.retries ?? 0) < 3) {
    await new Promise((resolve) => setTimeout(resolve, 1_500 * ((item.retries ?? 0) + 1)))
    return fetchBuffer({ ...item, retries: (item.retries ?? 0) + 1 })
  }
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${item.url}`)
  const contentType = response.headers.get('content-type')?.split(';')[0] ?? ''
  if (!contentType.startsWith('image/')) throw new Error(`Unexpected content-type ${contentType || 'unknown'}: ${item.url}`)
  const data = Buffer.from(await response.arrayBuffer())
  if (data.length < 20_000) throw new Error(`Image below 20 kB quality floor: ${item.url}`)
  return { data, contentType }
}

function safeFilename(item, index, contentType) {
  const parsed = new URL(item.url)
  const mimeExtension = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[contentType]
  const ext = (mimeExtension ?? path.extname(parsed.pathname).toLowerCase()) || '.jpg'
  const rawName = item.title ?? path.basename(parsed.pathname, path.extname(parsed.pathname))
  const slug = rawName.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 68)
  return `${String(index + 1).padStart(3, '0')}-${slug || 'hat-mon'}${ext}`
}

await rm(outputDir, { recursive: true, force: true })
await mkdir(outputDir, { recursive: true })

const discovered = []
const pageErrors = []
for (const source of sourcePages) {
  try {
    const items = source.kind === 'wikimedia-category'
      ? await fetchWikimediaCategory(source)
      : extractHtmlImages(await fetchText(source.page), source).map((url) => ({ ...source, url }))
    discovered.push(...items)
    process.stdout.write(`discovered ${items.length} images from ${source.id}\n`)
  } catch (error) {
    pageErrors.push({ source: source.id, page: source.page, error: String(error) })
    process.stderr.write(`source failed ${source.page}: ${error}\n`)
  }
}

const byUrl = [...new Map(discovered.map((item) => [item.url, item])).values()]
const saved = []
const hashes = new Map()
let cursor = 0

async function worker() {
  while (cursor < byUrl.length) {
    const index = cursor++
    const item = byUrl[index]
    let temporary
    try {
      const { data, contentType } = await fetchBuffer(item)
      const hash = createHash('sha256').update(data).digest('hex')
      if (hashes.has(hash)) {
        saved.push({ ...item, duplicateOf: hashes.get(hash), status: 'duplicate', bytes: data.length })
        continue
      }
      const filename = safeFilename(item, index, contentType)
      const target = path.join(outputDir, filename)
      temporary = `${target}.part`
      hashes.set(hash, filename)
      await writeFile(temporary, data)
      await rename(temporary, target)
      saved.push({ ...item, file: `/reference/hat-mon-temple-gallery/${filename}`, status: 'saved', bytes: data.length, sha256: hash })
      process.stdout.write(`saved ${saved.filter((entry) => entry.status === 'saved').length}/${byUrl.length} ${filename}\n`)
    } catch (error) {
      if (temporary) await rm(temporary, { force: true })
      saved.push({ ...item, status: 'error', error: String(error) })
      process.stderr.write(`failed ${item.url}: ${error}\n`)
    }
  }
}

await Promise.all(Array.from({ length: 4 }, worker))

const files = saved.filter((item) => item.status === 'saved')
let totalBytes = 0
for (const file of files) totalBytes += (await stat(path.join(root, 'public', file.file))).size

const manifest = {
  generatedAt: new Date().toISOString(),
  subject: 'Đền Hai Bà Trưng (Đền Hát Môn), xã Hát Môn, Hà Nội',
  purpose: 'Local non-production visual reference dataset for a Hát Môn Temple 360 tour prototype.',
  notice: 'Copyright and reuse terms remain with each original publisher. Wikimedia Commons items include per-file license metadata. Other images are local research references and must not be redistributed without permission.',
  sources: sourcePages.map(({ allowedHosts, urlIncludes, kind, ...source }) => source),
  discovered: byUrl.length,
  saved: files.length,
  duplicates: saved.filter((item) => item.status === 'duplicate').length,
  errors: saved.filter((item) => item.status === 'error').length,
  sourceErrors: pageErrors.length,
  totalBytes,
  pageErrors,
  images: saved,
}

await mkdir(path.dirname(manifestPath), { recursive: true })
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`dataset complete: ${files.length} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB, ${pageErrors.length} source errors`)
