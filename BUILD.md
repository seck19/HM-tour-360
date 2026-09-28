# Hướng dẫn tự dựng một tour 360° có thuyết minh

Tài liệu này giải thích **cách build nên dự án này từ đầu**: kiến trúc tổng quan, rồi đi vào từng phần cụ thể kèm code thật. Mục tiêu là để bạn đọc xong có thể tự dựng một tour 360 tương tự cho một di tích / địa điểm khác.

> Muốn biết cách **chạy** dự án đang có thì xem [`README.md`](README.md). File này nói về cách **làm ra** nó.

---

## 1. Bài toán

Cần một web app cho phép:

1. Xem ảnh panorama 360°, kéo để quan sát, cuộn để thu phóng.
2. Di chuyển giữa nhiều địa điểm, có điểm nóng dẫn đường ngay trong không gian 360°.
3. Mỗi địa điểm có một bản thuyết minh; **xem tới địa điểm nào thì bản thuyết minh của địa điểm đó tự phát**.
4. Chạy được trên điện thoại.
5. Không cần server, không cần database — deploy chỉ là copy file tĩnh.

Điểm 3 là phần khó nhất và cũng là phần "linh hồn" của dự án. Phần lớn tài liệu về Photo Sphere Viewer dừng ở việc hiển thị panorama; việc gắn audio đồng bộ với điều hướng phải tự viết.

---

## 2. Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│  Ảnh gốc 6144×3072  +  file mp3 thuyết minh   (thư mục nguồn)   │
└────────────────────────────┬────────────────────────────────────┘
                             │  scripts/prepare-media.ps1
                             │  • resize 4096×2048, nén JPEG
                             │  • sinh thumbnail 480×240
                             │  • đổi tên sang slug ASCII
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  public/panoramas/<slug>.jpg   public/audio/<slug>.mp3          │
│  → Vite copy nguyên xi vào dist/, không qua bundler             │
└────────────────────────────┬────────────────────────────────────┘
                             │  import
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/tour-data.ts        LỚP DỮ LIỆU                            │
│  mảng scenes[] : id, tên, mô tả, ảnh, audio, góc điểm nóng      │
│  → nguồn sự thật duy nhất. Không chứa JSX, không chứa CSS.      │
└────────────────────────────┬────────────────────────────────────┘
                             │  props / cấu hình
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/App.tsx             LỚP ỨNG DỤNG                          │
│                                                                 │
│  ┌──────────────────────┐   ┌──────────────────────────────┐    │
│  │ Photo Sphere Viewer  │   │ Trình phát thuyết minh       │    │
│  │  + VirtualTourPlugin │   │  <audio> + state + effect    │    │
│  │  + AutorotatePlugin  │   │  ← node-changed kích hoạt    │    │
│  └──────────┬───────────┘   └──────────────┬───────────────┘    │
│             │  sự kiện node-changed        │  sự kiện ended     │
│             └────────────► currentId ◄─────┘  (Tự chuyển cảnh)  │
└────────────────────────────┬────────────────────────────────────┘
                             │  className
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/styles.css          LỚP TRÌNH BÀY                          │
│  lưới hud (tiêu đề + thanh thuyết minh + điều khiển)            │
│  ngăn kéo danh sách, bảng thông tin, loading, responsive        │
└─────────────────────────────────────────────────────────────────┘
```

**Ý tưởng chủ đạo: một chiều dữ liệu, một nguồn sự thật.**

- `tour-data.ts` là nguồn sự thật duy nhất. Muốn thêm địa điểm thì chỉ sửa một chỗ.
- `currentId` là state trung tâm. Cả bản đồ 360°, thanh thuyết minh, tiêu đề và URL đều dẫn xuất từ nó.
- Không có state management library. Ở quy mô này, `useState` + một chỗ lưu id là đủ; thêm Redux/Zustand chỉ làm phức tạp thêm.

### Công nghệ dùng và lý do

| Thành phần | Chọn gì | Vì sao |
|---|---|---|
| Engine 360° | `@photo-sphere-viewer/core` 5.15 | WebGL, xử lý sẵn phép chiếu equirectangular, cảm ứng, quán tính |
| Điều hướng nhiều cảnh | `virtual-tour-plugin` | Quản lý graph các node + điểm nóng + hiệu ứng chuyển cảnh |
| Tự xoay | `autorotate-plugin` | Có sẵn, không cần tự viết vòng lặp `requestAnimationFrame` |
| Framework | React 19 + TypeScript | Chỉ cần cho lớp UI; engine là thư viện imperative nên được bọc trong `useEffect` |
| Build | Vite 8 | Dev server nhanh, `public/` được copy thẳng, build ra file tĩnh |
| Icon | `lucide-react` | Icon dạng component, tree-shakeable |
| Test | Playwright | Cần trình duyệt thật vì có WebGL + audio |

**Điểm quan trọng về kiến trúc:** engine 360° là thư viện *imperative* (tự quản lý vòng đời DOM + WebGL), còn React là *declarative*. Hai mô hình này không hoà hợp. Cách xử lý trong dự án: **để engine sở hữu vùng DOM của nó, React chỉ sở hữu phần UI bao quanh**, và hai bên nói chuyện với nhau qua một state duy nhất (`currentId`) cùng vài sự kiện. Đừng cố render lại canvas bằng React.

---

## 3. Chuẩn bị dữ liệu — phần bị coi nhẹ nhất

Phần này quyết định 80% chất lượng sản phẩm, nhưng thường bị làm ẩu.

### 3.1 Ảnh phải là equirectangular tỉ lệ 2:1

Ảnh panorama 360° **bắt buộc** là phép chiếu equirectangular: chiều ngang = 360°, chiều dọc = 180°, nên tỉ lệ **luôn là 2:1**. Ảnh 6144×3072 hoặc 4096×2048 là hợp lệ; ảnh 4000×3000 (4:3) sẽ bị bóp méo.

Cách kiểm tra nhanh bằng PowerShell:

```powershell
Add-Type -AssemblyName System.Drawing
Get-ChildItem *.jpg | ForEach-Object {
  $i = [System.Drawing.Image]::FromFile($_.FullName)
  "{0}  {1}x{2}  ti le {3}" -f $_.Name, $i.Width, $i.Height, [math]::Round($i.Width/$i.Height, 3)
  $i.Dispose()
}
```

Tỉ lệ phải ra đúng `2`. Nếu không, ảnh không phải panorama 360 thật, hoặc đã bị crop — phải xử lý trước khi làm gì tiếp.

### 3.2 Nén ảnh: không thể bỏ qua

Ảnh gốc của dự án này là 11 file 6144×3072, tổng **~60 MB**. Nếu để nguyên:

- Trang đầu tải 5 MB cho một panorama → người dùng bỏ đi trước khi thấy gì.
- `dist/` phình to, deploy chậm.

Sau khi resize về **4096×2048** và nén JPEG quality 84: còn **~1,2–1,9 MB/ảnh, tổng 15,7 MB**. Đây là điểm cân bằng tốt: 4096 đủ nét khi phóng to trên màn hình 4K, mà vẫn tải được.

Ngoài ra sinh thêm **thumbnail 480×240** cho danh sách địa điểm. Danh sách 11 địa điểm nếu dùng ảnh full sẽ tải 15 MB chỉ để hiện các ô nhỏ — thumbnail chỉ 22–38 KB mỗi cái.

### 3.3 Đặt tên file: dùng slug ASCII, đừng dùng dấu tiếng Việt

Đây là cái bẫy thật đã gặp. Tên file gốc là `nghi môn chuẩn.jpg`, `gò đấu ấn chuẩn.jpg`, `đền thờ nguyen thi định chuẩn.jpg`…

Vấn đề:
- Dấu tiếng Việt trong URL phải được percent-encode (`%C4%91%E1%BB%81n...`) → log khó đọc, dễ sai khi copy tay.
- Unicode có hai dạng chuẩn hoá: **NFC** (`ề` = 1 ký tự U+1EC1) và **NFD** (`ề` = `e` + dấu U+0302 U+0300). macOS thường dùng NFD, Windows dùng NFC. Cùng một cái tên hiển thị giống hệt nhau nhưng so sánh chuỗi lại **khác nhau** → `Test-Path` trả về `false` dù mắt thấy file có đó.

Giải pháp: đặt slug ASCII có số thứ tự tự tăng — `01-tu-tru`, `02-nghi-mon`, … Số thứ tự còn giúp thấy ngay thứ tự tuyến tham quan khi nhìn vào thư mục.

### 3.4 Script chuẩn hoá

`scripts/prepare-media.ps1` làm toàn bộ việc trên. Cấu trúc:

```powershell
# 1. Khai báo bảng ánh xạ: slug ASCII -> tên file nguồn (giữ nguyên tiếng Việt ở đây)
$map = @(
  @{ Slug = '01-tu-tru';   Img = 'tứ trụ chuẩn.jpg';   Audio = 'tứ trụ.mp3' }
  @{ Slug = '02-nghi-mon'; Img = 'nghi môn chuẩn.jpg'; Audio = 'Nghi môn.mp3' }
  # ...
)

# 2. Dọn đầu ra cũ để không còn file mồ côi khi đổi slug
Get-ChildItem $outPanoDir -Filter *.jpg | Remove-Item -Force

# 3. Với mỗi mục: resize panorama, sinh thumbnail, copy audio
```

Phần resize dùng `System.Drawing` của .NET, không cần cài gì thêm:

```powershell
$bmp = New-Object System.Drawing.Bitmap $Width, $Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($img, 0, 0, $Width, $Height)

# Chất lượng JPEG phải truyền qua EncoderParameters, không có tham số trực tiếp
$enc = New-Object System.Drawing.Imaging.EncoderParameters 1
$enc.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, [int64]84)
$bmp.Save($Target, $jpegCodec, $enc)
```

> **Bẫy BOM:** script chứa tiếng Việt. Windows PowerShell 5.1 đọc file `.ps1` theo bảng mã ANSI của hệ thống nếu file không có BOM, nên mọi ký tự tiếng Việt sẽ hỏng và script không tìm thấy file nguồn. **File `.ps1` có tiếng Việt bắt buộc phải lưu UTF-8 kèm BOM.** Nếu dùng `pwsh` 7 thì không cần, nhưng đừng giả định người chạy có `pwsh` 7.

### 3.5 Audio

Yêu cầu thực tế:

- **Định dạng:** mp3 — tương thích rộng nhất, kể cả Safari trên iOS.
- **Bitrate:** 128 kbps là đủ cho giọng nói. Dự án này 11 file tổng 6,3 MB, mỗi file 27–57 giây.
- **Độ dài:** 30–60 giây/địa điểm là hợp lý. Dài hơn thì nên cho phép người dùng chủ động dừng lại.
- **Đặt tên:** cùng slug với ảnh để ghép cặp bằng mắt được — `07-ta-huu-mac.jpg` ↔ `07-ta-huu-mac.mp3`.

---

## 4. Khởi tạo dự án

```bash
npm create vite@latest my-tour -- --template react-ts
cd my-tour
npm install
npm install @photo-sphere-viewer/core @photo-sphere-viewer/virtual-tour-plugin \
            @photo-sphere-viewer/autorotate-plugin lucide-react
npm install -D @playwright/test
```

### `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',                       // (1)
  server: {
    allowedHosts: ['.trycloudflare.com'],   // (2)
  },
})
```

1. `base: './'` — dùng đường dẫn tương đối. Nhờ vậy `dist/` chạy được ở **bất kỳ** thư mục con nào: `user.github.io/`, `user.github.io/tour/`, hay mở trực tiếp bằng `file://`. Mặc định của Vite là `/` (gốc tên miền) và sẽ vỡ ảnh nếu deploy vào thư mục con.
2. `allowedHosts` — Vite chặn request có `Host` header lạ để phòng DNS rebinding. Cloudflare Quick Tunnel sinh hostname **ngẫu nhiên mỗi lần chạy**, nên khai báo cả miền con bằng dấu chấm đầu (`.trycloudflare.com`) thay vì dán từng URL. Nếu không có dòng này, truy cập qua tunnel sẽ bị trả về `Blocked request`.

### `tsconfig`

Vite tạo sẵn 3 file: `tsconfig.json` (gốc, chỉ tham chiếu), `tsconfig.app.json` (code app), `tsconfig.node.json` (config của Vite). Giữ nguyên, chỉ cần biết `npm run build` chạy typecheck trên `tsconfig.app.json`:

```json
"scripts": {
  "build": "tsc --noEmit -p tsconfig.app.json && vite build"
}
```

Typecheck **trước** khi build là cố ý: nếu để `vite build` chạy trước, nó vẫn build thành công dù có lỗi type (Vite dùng esbuild, chỉ xoá type chứ không kiểm tra).

---

## 5. Lớp dữ liệu — `src/tour-data.ts`

Tách toàn bộ nội dung ra khỏi UI. File này **không import React, không chứa JSX**.

```ts
export type TourScene = {
  id: string                 // dùng cho ?scene=<id> trên URL
  name: string               // tiêu đề lớn
  eyebrow: string            // nhãn nhỏ phía trên
  tagline: string            // một dòng mô tả ngắn
  group: string              // nhóm trong danh sách bên trái
  description: string        // đoạn dài cho bảng thông tin
  highlights: string[]       // gạch đầu dòng chi tiết
  panorama: string           // đường dẫn ảnh 2:1
  thumbnail: string
  audio?: string             // BỎ TRỐNG nếu chưa có bản thu
  linkYaw: number            // hướng đặt điểm nóng dẫn cảnh kế tiếp (độ)
  linkPitch?: number
}
```

Hai chi tiết thiết kế đáng chú ý:

**`audio` là optional (`audio?`).** Thực tế khi làm dự án này, có 11 ảnh nhưng ban đầu chỉ có 10 file audio. Nếu bắt buộc phải có audio thì hoặc phải bịa ra file rỗng, hoặc phải bỏ một địa điểm khỏi tour — cả hai đều tệ. Để optional và cho UI hiển thị trạng thái "chưa có bản thu" thì thêm được địa điểm trước, thu âm sau.

**`group` là chuỗi tự do, không phải enum.** Nhóm được suy ra từ thứ tự trong mảng, không cần khai báo riêng:

```ts
export const sceneGroups = scenes.reduce<Array<{ name: string; scenes: TourScene[] }>>(
  (groups, scene) => {
    const last = groups[groups.length - 1]
    if (last && last.name === scene.group) last.scenes.push(scene)
    else groups.push({ name: scene.group, scenes: [scene] })
    return groups
  }, [])
```

Vì thế chỉ cần các địa điểm cùng nhóm **đứng cạnh nhau** trong mảng. Muốn đổi nhóm chỉ cần sửa chuỗi, không phải sửa cấu trúc.

Và đọc id từ URL để deep-link:

```ts
export const sceneIndexById = (id: string) => scenes.findIndex((scene) => scene.id === id)

export const getSceneFromUrl = () => {
  const id = new URLSearchParams(window.location.search).get('scene')
  return sceneIndexById(id ?? '') >= 0 ? id! : scenes[0].id   // id lạ -> về cảnh đầu
}
```

Chú ý `sceneIndexById(id) >= 0 ? id! : scenes[0].id`: URL sai phải **âm thầm về cảnh đầu**, không được throw. Người dùng có thể gõ tay URL hoặc mở link cũ sau khi bạn đổi id.

---

## 6. Engine 360° — bọc thư viện imperative trong React

### 6.1 Khởi tạo

```tsx
useEffect(() => {
  if (!viewerElement.current) return

  const viewer = new Viewer({
    container: viewerElement.current,
    navbar: false,
    defaultZoomLvl: 15,
    minFov: 30,          // thu phóng tối đa (FOV nhỏ = ảnh to)
    maxFov: 100,
    mousewheelCtrlKey: false,
    touchmoveTwoFingers: false,   // một ngón kéo đã xoay được, không bắt dùng hai ngón
    plugins: [ /* ... */ ],
  })

  // ...
  return () => { viewer.destroy() }
}, [])   // ← mảng rỗng: chỉ chạy MỘT lần
```

### 6.2 Vì sao effect này phải có mảng phụ thuộc rỗng

`Viewer` tự tạo canvas WebGL, tự gắn listener, tự chạy vòng lặp render. Nếu effect chạy lại, phải `destroy()` cái cũ **trước** khi tạo cái mới, và giữa hai thời điểm đó có một khung hình WebGL bị mất context → nháy đen, thậm chí lỗi.

Đây cũng là lý do trong `src/main.tsx` **cố tình không dùng `<StrictMode>`**:

```tsx
// The panorama viewer owns an imperative WebGL lifecycle; mounting it once avoids
// React development StrictMode's intentional destroy/recreate race.
createRoot(document.getElementById('root')!).render(<App />)
```

StrictMode ở chế độ dev cố tình mount → unmount → mount lại để phát hiện effect không sạch. Với thư viện WebGL, việc đó gây race và làm canvas đen. **Đây là ngoại lệ chính đáng**, không phải code ẩu.

### 6.3 `positionMode` và `renderMode`

```tsx
VirtualTourPlugin.withConfig({
  positionMode: 'manual',   // toạ độ do ta đặt tay, không dùng GPS
  renderMode: '2d',         // điểm nóng là phần tử DOM
  startNodeId: getSceneFromUrl(),
  preload: true,            // tải trước ảnh cảnh kế tiếp
  transitionOptions: { effect: 'fade', rotation: true, speed: '18rpm' },
  nodes: scenes.map((scene, index) => ({ /* ... */ })),
})
```

Hai lựa chọn trên đáng để giải thích:

**`positionMode: 'manual'` vs `'gps'`.** Ở chế độ `gps`, plugin tự tính hướng giữa các địa điểm từ toạ độ thật, nên điểm nóng tự trỏ đúng hướng di chuyển — rất hay cho tour ngoài trời. Nhưng nó đòi hỏi mỗi node có `gps: [lat, lng]` **và** dữ liệu GPS phải chính xác. Với 11 điểm trong cùng một khuôn viên chùa, sai số GPS vài mét cũng đủ làm hướng sai. Chế độ `manual` cho phép đặt `linkYaw` bằng tay và cho kết quả đoán được.

**`renderMode: '2d'` vs `'3d'`.** Ở `'3d'`, điểm nóng là một đối tượng nằm trong không gian 3D, phóng to/thu nhỏ theo độ sâu và bị ép xuống dưới đường chân trời (`arrowsPosition.minPitch`, mặc định 0.3 rad ≈ 17°). Ở `'2d'`, điểm nóng là `<button>` trong DOM đặt tại vị trí chiếu của một hướng cầu:

- Bấm được bằng chuột, cảm ứng, **và trình đọc màn hình** (vì là `<button>` thật).
- Tự động hoá test bằng Playwright bấm được — với `<canvas>` 3D thì gần như không thể.
- Không bị ép pitch, nên `linkPitch: -4deg` giữ đúng ý đồ.

Đánh đổi: điểm nóng 2D không phóng to theo độ sâu, trông "phẳng" hơn. Với tour di sản, khả năng truy cập và test được quan trọng hơn.

### 6.4 Sinh điểm nóng: nối vòng

```tsx
nodes: scenes.map((scene, index) => ({
  id: scene.id,
  name: scene.name,
  caption: scene.name,          // hiện trong tooltip khi hover
  description: scene.tagline,
  panorama: scene.panorama,
  thumbnail: scene.thumbnail,
  defaultYaw: '0deg',
  defaultPitch: '0deg',
  links: [{
    nodeId: scenes[(index + 1) % scenes.length].id,     // toán tử % -> cảnh cuối nối về cảnh đầu
    position: { yaw: `${scene.linkYaw}deg`, pitch: `${scene.linkPitch ?? -4}deg` },
  }],
})),
```

`(index + 1) % scenes.length` khiến cảnh cuối quay về cảnh đầu, tạo vòng tròn khép kín — phù hợp với tuyến tham quan khép kín. Nếu muốn kết thúc hẳn thì thêm điều kiện `index < scenes.length - 1`.

`linkPitch ?? -4` đặt điểm nóng hơi thấp dưới đường chân trời. Ở mức 0° nó nằm chính giữa tầm nhìn, che mất chi tiết; ở -4° trông tự nhiên như đặt trên mặt sân.

### 6.5 Đồng bộ URL hai chiều

```tsx
tour.addEventListener('node-changed', ({ node }) => {
  setCurrentId(node.id)
  const url = new URL(window.location.href)
  url.searchParams.set('scene', node.id)
  window.history.pushState({ scene: node.id }, '', url)   // đổi URL, KHÔNG tải lại trang
})

const onPopState = () => {
  void tour.setCurrentNode(getSceneFromUrl())   // nút Back/Forward -> đổi cảnh theo
}
window.addEventListener('popstate', onPopState)
```

Dùng `pushState` để mỗi địa điểm có URL riêng, chia sẻ được và bookmark được, mà không tải lại trang. `popstate` xử lý chiều ngược lại. Quên `popstate` là lỗi rất hay gặp: bấm Back thì URL đổi mà panorama đứng yên.

Cần `{ once: true }` ở listener `ready` chưa đủ — phải kiểm tra cả trường hợp viewer đã ready *trước khi* ta kịp gắn listener (xảy ra khi ảnh đã có trong cache):

```tsx
viewer.addEventListener('ready', markReady, { once: true })
if (viewer.state.ready) markReady()   // cache ấm: đã xong ngay lúc khởi tạo
```

Không có dòng thứ hai, màn hình loading sẽ treo vĩnh viễn với người dùng quay lại lần hai.

---

## 7. Trình phát thuyết minh — phần khó nhất

### 7.1 Một thẻ `<audio>` duy nhất, không tạo mới

```tsx
const audioRef = useRef<HTMLAudioElement | null>(null)
// ...
<audio ref={audioRef} preload="auto" />
```

**Đừng tạo `new Audio()` cho mỗi địa điểm.** Trình duyệt cấp quyền autoplay theo *phần tử*: một khi người dùng đã tương tác và một thẻ audio đã phát được, các lần đổi `src` sau đó trên **cùng thẻ đó** vẫn phát được. Tạo thẻ mới mỗi cảnh thì mỗi lần đều bị chặn lại từ đầu.

### 7.2 Gắn listener một lần, đọc state qua ref

```tsx
const onEnded = () => {
  setNarration('ended')
  setTime(0)
  if (!autoAdvanceRef.current) return                    // ← đọc qua ref, không đọc state
  const next = scenes[(sceneIndexById(currentIdRef.current) + 1) % scenes.length]
  window.setTimeout(() => void tourRef.current?.setCurrentNode(next.id), 700)
}
```

Đây là **stale closure** — cái bẫy dễ mắc nhất khi viết React + thư viện ngoài. Listener được gắn **một lần** trong effect có mảng phụ thuộc rỗng, nên nó "nhớ" giá trị `autoAdvance` và `currentId` tại thời điểm gắn — mãi mãi. Nếu đọc trực tiếp state trong closure đó, sau khi người dùng bật "Tự chuyển cảnh" thì listener vẫn thấy giá trị cũ là `false` và không làm gì.

Cách xử lý: giữ một ref luôn được cập nhật ở mỗi lần render, và listener đọc ref.

```tsx
const currentIdRef = useRef(currentId)
const autoAdvanceRef = useRef(autoAdvance)
currentIdRef.current = currentId          // gán ngay trong thân component = chạy mỗi render
autoAdvanceRef.current = autoAdvance
```

Giải pháp thay thế là đưa `autoAdvance` vào mảng phụ thuộc của effect — nhưng như vậy phải tháo gắn lại toàn bộ listener mỗi lần đổi toggle, dễ sót và gây rò rỉ. Dùng ref sạch hơn.

`setTimeout(..., 700)` là chủ ý: để hiệu ứng chuyển cảnh fade kết thúc rồi mới sang cảnh mới, tránh việc audio mới phát đè lên hình cũ.

### 7.3 Nạp audio khi đổi địa điểm

```tsx
useEffect(() => {
  const el = audioRef.current
  if (!el) return

  el.pause()
  setTime(0)
  setDuration(0)

  if (!currentAudio) {                 // địa điểm chưa có bản thu
    el.removeAttribute('src')
    el.load()
    setNarration('idle')
    return
  }

  if (el.getAttribute('src') !== currentAudio) {   // tránh nạp lại khi không cần
    el.setAttribute('src', currentAudio)
    el.load()
  }
  setNarration('paused')

  if (!autoNarrate) return
  el.play().catch(() => setBlocked(true))          // autoplay có thể bị chặn
}, [currentAudio, autoNarrate])
```

Ba chi tiết:

- `el.pause()` trước khi đổi `src`: nếu không, audio cũ có thể tiếp tục phát chồng.
- `if (!currentAudio)` dùng `removeAttribute('src')` + `load()`. Gán `src = ''` sẽ khiến trình duyệt cố tải chính trang HTML làm audio và bắn lỗi.
- `el.play()` trả về Promise **có thể reject**. Bắt buộc phải `.catch()`, nếu không sẽ có lỗi "Uncaught (in promise) NotAllowedError" trong console.

### 7.4 Xử lý autoplay bị chặn

Trình duyệt chặn phát audio khi chưa có tương tác của người dùng. Lần tải trang đầu tiên **luôn** bị chặn. Cách xử lý:

```tsx
const [blocked, setBlocked] = useState(false)
// ...
el.play().catch(() => setBlocked(true))
```

Và gỡ chặn ở lần chạm đầu tiên:

```tsx
useEffect(() => {
  if (!blocked) return
  const retry = () => {
    const el = audioRef.current
    if (!el || !currentAudio) return
    el.play().then(() => setBlocked(false)).catch(() => undefined)
  }
  window.addEventListener('pointerdown', retry, { once: true })   // { once: true } -> tự gỡ
  return () => window.removeEventListener('pointerdown', retry)
}, [blocked, currentAudio])
```

Về mặt UI, khi `blocked` thì thanh thuyết minh nhấp nháy viền vàng và hiện dòng "Bấm để bật âm thanh". **Đừng im lặng** — người dùng sẽ tưởng tính năng hỏng.

### 7.5 Thanh tua

Thanh tua là một `<input type="range">` **trong suốt** đặt đè lên một thanh màu tự vẽ:

```tsx
<div className="dock-bar">
  <span className="dock-bar-fill" style={{ width: `${progress}%` }} />
  <input
    type="range" min={0} max={duration || 0} step={0.1}
    value={Math.min(time, duration || 0)}
    onChange={(event) => seek(Number(event.target.value))}
    disabled={duration === 0}
    aria-label="Tua bản thuyết minh"
  />
</div>
```

```css
.dock-bar::before { content: ""; position: absolute; left: 0; right: 0;
                    height: 4px; background: rgba(255,255,255,.14); }
.dock-bar-fill    { position: absolute; left: 0; height: 4px;
                    background: linear-gradient(90deg, var(--cinnabar), var(--gold-bright));
                    pointer-events: none; }
.dock-bar input[type="range"] { position: relative; width: 100%; appearance: none;
                                background: transparent; }
.dock-bar input[type="range"]::-webkit-slider-runnable-track { height: 4px; background: transparent; }
.dock-bar input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; width: 12px; height: 12px; margin-top: -4px;
  border-radius: 50%; background: var(--gold-bright); }
```

Phải dùng cách này thay vì `accent-color` vì cần gradient hai màu và tay nắm tuỳ biến. Vài lưu ý:

- `pointer-events: none` trên lớp fill, nếu không nó sẽ nuốt cú click và thanh tua không kéo được.
- `margin-top: -4px` trên thumb: track cao 4px, thumb 12px → `(4 − 12) / 2 = −4`.
- `max={duration || 0}` — trước khi có metadata, `duration` là `NaN`. Đưa `NaN` vào `max` làm React cảnh báo và thanh tua hỏng.
- `value={Math.min(time, duration || 0)}` — `time` có thể vượt `duration` một chút do làm tròn, gây cảnh báo "value out of range".
- Firefox cần `::-moz-range-track` và `::-moz-range-thumb` riêng; Safari/Chrome dùng `::-webkit-*`.

### 7.6 Đọc thời lượng và thời gian

```tsx
const syncTime = () => setTime(el.currentTime)                                          // timeupdate
const syncDuration = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0)  // loadedmetadata
```

Nghe **cả** `loadedmetadata` **và** `durationchange`: một số trình duyệt báo `duration` là `Infinity` ở `loadedmetadata` rồi cập nhật lại sau. `Number.isFinite` chặn giá trị `Infinity` đó, nếu không `formatTime` sẽ in ra `Infinity:NaN`.

### 7.7 Tự chuyển cảnh khi hết

```tsx
const onEnded = () => {
  setNarration('ended')
  setTime(0)
  if (!autoAdvanceRef.current) return
  const next = scenes[(sceneIndexById(currentIdRef.current) + 1) % scenes.length]
  window.setTimeout(() => void tourRef.current?.setCurrentNode(next.id), 700)
}
```

Sau khi đổi cảnh, effect ở mục 7.3 chạy lại và tự phát bản thu của cảnh mới. Ghép hai phần này lại là có tính năng "bật Tự chuyển cảnh rồi ngồi nghe hết một lượt".

---

## 8. Giao diện

### 8.1 Bố cục

```
┌──────────────────────────────────────────────────────────┐
│ topbar: ☰ │ logo │                    │ 03 / 11          │  84px
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  sidebar   │            .viewer  (canvas WebGL)          │
│ danh sách  │                                             │
│ địa điểm   │        ╭─ điểm nóng 360° ─╮                 │
│ (ngăn kéo) │                                             │
│            │   ┌ .hud (flex column) ─────────────────┐   │
│            │   │ .scene-copy  tiêu đề + nút          │   │
│            │   │ .hud-row                             │   │
│            │   │   .narration-dock   .bottom-controls │   │
│            │   └──────────────────────────────────────┘   │
└────────────┴─────────────────────────────────────────────┘
```

`.hud` là **flex column** chứa tiêu đề ở trên và hàng điều khiển ở dưới, ghim vào đáy bằng `position: absolute; bottom: 22px`.

### 8.2 Bài học lớn nhất về CSS trong dự án này

Ban đầu tôi đặt `.scene-copy` và `.hud` là hai khối `position: absolute` **độc lập**, với `bottom` cố định (132px và 22px). Trông ổn trên màn hình 1440×900.

Nhưng chiều cao thanh thuyết minh **không cố định**: nó phụ thuộc vào việc hàng nút bật/tắt có xuống dòng hay không, mà việc đó lại phụ thuộc bề rộng màn hình. Ở 1024px, thanh cao 147px thay vì 96px → **tiêu đề địa điểm bị thanh thuyết minh đè lên**, che mất nút bấm.

Cách sửa đúng không phải là "tăng `bottom` lên cho đủ" (làm vậy lại vỡ ở kích thước khác), mà là **đưa hai khối vào cùng một luồng flex**:

```css
.hud {
  position: absolute; left: 34px; right: 24px; bottom: 22px;
  display: flex; flex-direction: column; gap: 18px;
  pointer-events: none;        /* khối bao không chặn chuột */
}
.hud-row { display: flex; align-items: flex-end; gap: 16px; width: 100%; }
.hud-row > * { pointer-events: auto; }   /* chỉ con trực tiếp nhận chuột */
```

Bây giờ tiêu đề và thanh điều khiển **không thể** đè nhau ở bất kỳ kích thước nào — trình duyệt tự tính. Đây là nguyên tắc chung: *khi hai khối có chiều cao động, đừng định vị chúng độc lập bằng toạ độ tuyệt đối; hãy đặt chúng vào cùng một luồng.*

`pointer-events: none` ở khối bao là cần thiết để không chặn thao tác kéo panorama ở vùng trống giữa tiêu đề và mép màn hình.

### 8.3 Thứ tự import CSS quyết định phần ghi đè

```tsx
// src/main.tsx
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/virtual-tour-plugin/index.css'
import './styles.css'          // ← PHẢI sau cùng
```

CSS không có cơ chế "ghi đè" như JS — khi hai rule cùng độ đặc hiệu, **rule đến sau thắng**. Nếu import `styles.css` trước, các rule của thư viện sẽ đè lên và việc tuỳ biến điểm nóng (`.psv-virtual-tour-link`) hay loader sẽ không có tác dụng, dù CSS của bạn trông "đúng".

### 8.4 Ngăn kéo trên di động và `z-index`

Trên màn hình hẹp, sidebar biến thành ngăn kéo `transform: translateX(-102%)`. Vấn đề: `.hud` có `z-index: 21` (để nằm trên canvas), còn sidebar chỉ `15` → mở ngăn kéo thì **thanh thuyết minh nằm đè lên trên ngăn kéo**, che mất danh sách.

Sửa bằng cách nâng sidebar lên `z-index: 25`, cao hơn `.hud` nhưng thấp hơn `.info-panel` (30). Thứ tự phân lớp cuối cùng:

```
viewer (0)  <  scene-copy (10)  <  hud (21)  <  sidebar (25)  <  info-panel (30)  <  loading (50)  <  toast (60)
```

Ngoài ra `.sidebar` là `display: flex; flex-direction: column` với `.scene-list` bên trong có `overflow-y: auto`. Danh sách 11 địa điểm cao ~1089px trong khi vùng hiển thị chỉ ~606px. `flex: 1 1 auto` + `overflow-y: auto` khiến nó cuộn được. Nếu thấy danh sách tràn ra ngoài thay vì cuộn, thêm `min-height: 0` cho flex item — đây là bẫy kinh điển của flexbox (`min-height` mặc định là `auto`, ngăn flex item co lại nhỏ hơn nội dung).

### 8.5 Responsive: ba ngưỡng

```css
@media (max-width: 1180px) { /* thu nhỏ tiêu đề, hẹp thanh thuyết minh */ }
@media (max-width: 940px)  { /* ẩn gợi ý tương tác */ }
@media (max-width: 860px)  { /* ngăn kéo + hud xếp dọc */ }
@media (max-height: 720px) { /* màn hình thấp: ẩn tagline, ẩn ghi chú */ }
```

Ở `max-width: 860px`, `.hud-row` chuyển thành `flex-direction: column` để thanh thuyết minh nằm trên cụm điều khiển, và tiêu đề thu nhỏ còn 28px. Dưới 720px chiều cao thì ẩn `tagline` để không chiếm chỗ.

Cuối file có `@media (prefers-reduced-motion: reduce)` tắt mọi animation — người dùng bật cài đặt giảm chuyển động sẽ không bị hiệu ứng sóng và nhấp nháy làm khó chịu.

---

## 9. Kiểm thử

### 9.1 Vì sao không thể chỉ nhìn bằng mắt

Với dự án này, ba loại lỗi chiếm phần lớn thời gian sửa:

1. Bố cục vỡ ở một kích thước màn hình cụ thể mà bạn không thử.
2. Audio nạp **sai file** (lệch một địa điểm) — nhìn giao diện hoàn toàn không thấy.
3. Autoplay không chạy mà không có thông báo lỗi nào.

Cả ba đều không phát hiện được bằng cách mở trang lên ngắm. Phải đo.

### 9.2 `scripts/audit-layout.mjs` — đo bố cục

Mở 6 kích thước màn hình, và ở mỗi cái thì đo bằng `getBoundingClientRect()`:

```js
const overlap = (a, b) => {
  const w = Math.min(a.x + a.width,  b.x + b.width)  - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return w > 2 && h > 2 ? Math.round(w * h) : 0    // >2px để bỏ qua chồng lấn do làm tròn
}
```

Kiểm tra: phần tử có tràn khỏi khung không, tiêu đề có đè thanh điều khiển không, thanh thuyết minh và cụm điều khiển có chồng nhau không, phần tử nào đang nằm trên phần tử nào (so sánh `z-index` tính toán), và **audio có thực sự phát không**:

```js
await page.locator('.scene-card[data-scene="dan-the"]').click()
await page.waitForTimeout(2500)
const after = await page.evaluate(() => {
  const el = document.querySelector('audio')
  return { src: el.getAttribute('src'), paused: el.paused, t: el.currentTime }
})
if (after.paused !== false) problems.push('thuyết minh không tự phát sau khi bấm địa điểm')
if (!(after.t > 0)) problems.push('thời gian phát không tiến')
```

Chính script này phát hiện ra lỗi tiêu đề đè thanh điều khiển và lỗi `z-index` ngăn kéo ở mục 8.2 và 8.4.

**Để script bấm được vào các thẻ địa điểm, thêm `data-scene` vào nút:**

```tsx
<button data-scene={scene.id} className="scene-card" /* ... */>
```

Không có thuộc tính này thì phải chọn theo tên hiển thị (`getByRole('button', { name: /Nghi môn/ })`), rất dễ khớp nhầm khi tên các địa điểm na ná nhau (`Nghi môn` vs `Nghi môn ngoại`).

### 9.3 `scripts/verify-tour.mjs` — kiểm tra toàn tuyến

Duyệt hết 11 địa điểm và xác nhận với từng cái: đúng ảnh nền, đúng file thuyết minh, tiêu đề khớp, có điểm nóng, thanh thuyết minh không tràn khung, không lỗi HTTP/runtime.

```js
page.on('response', (r) => { if (r.status() >= 400) failures.push(`http ${r.status()} ${r.url()}`) })
page.on('pageerror', (e) => failures.push(`pageerror: ${e.message}`))
```

Đây là lưới an toàn rẻ nhất: bắt được cả 404 của ảnh/audio lẫn lỗi JS, ở mọi lần chạy.

> **Bẫy nhỏ nhưng tốn thời gian thật:** id địa điểm là `tu-tru`, còn file là `01-tu-tru.mp3` — có tiền tố số. Nên kiểm tra phải là `src.endsWith(`${id}.mp3`)`, **không** phải `endsWith(`/${id}.mp3`)`. Tôi đã viết sai đúng cái `/` này hai lần.

### 9.4 Playwright e2e

`playwright.config.ts` dùng `channel: 'chrome'` — chạy trên Chrome có sẵn của máy, **không phải tải browser về** (khác với mặc định của Playwright là tải Chromium riêng ~150 MB). Và `webServer` tự bật dev server trước khi test:

```ts
webServer: {
  command: 'npm run dev -- --port 4173',
  url: 'http://127.0.0.1:4173',
  reuseExistingServer: true,
}
```

Vì có WebGL, test phải chờ màn hình loading ẩn đi rồi mới thao tác:

```ts
const waitForTour = (page) =>
  expect(page.locator('.loading-screen')).toHaveClass(/is-hidden/, { timeout: 20_000 })
```

---

## 10. Tổng hợp các bẫy đã gặp

Bảng tra nhanh — đây là những thứ đã thực sự làm mất thời gian trong dự án này.

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| Script PowerShell báo "thiếu ảnh nguồn" dù file có đó | `.ps1` chứa tiếng Việt nhưng không có BOM; PS 5.1 đọc theo ANSI | Lưu `.ps1` dạng UTF-8 **có BOM** |
| `Test-Path` trả `false` dù mắt thấy file | Tên file ở dạng NFD (macOS) vs NFC (Windows) | Đặt slug ASCII, tránh dấu trong tên file |
| Màn hình loading treo mãi ở lần tải thứ hai | `ready` bắn xong trước khi listener được gắn (ảnh đã cache) | Thêm `if (viewer.state.ready) markReady()` |
| Bấm Back đổi URL mà panorama đứng yên | Không nghe sự kiện `popstate` | Thêm listener gọi `setCurrentNode(getSceneFromUrl())` |
| Nút "Tự chuyển cảnh" bật rồi mà không có tác dụng | Stale closure: listener gắn một lần nhớ giá trị cũ | Giữ ref cập nhật mỗi render, listener đọc ref |
| `Uncaught (in promise) NotAllowedError` | `el.play()` trả Promise bị reject khi autoplay bị chặn | Luôn `.catch()` và hiện thông báo cho người dùng |
| Console báo lỗi tải chính trang HTML như audio | Gán `src = ''` thay vì xoá thuộc tính | `removeAttribute('src')` rồi `load()` |
| Thanh tua hiện `Infinity:NaN` | Một số trình duyệt báo `duration = Infinity` | `Number.isFinite(el.duration) ? el.duration : 0` |
| Tiêu đề địa điểm bị thanh điều khiển đè | Hai khối `absolute` định vị độc lập, chiều cao động | Đưa vào cùng một flex column |
| Ngăn kéo di động bị thanh thuyết minh đè | `z-index` của hud (21) > sidebar (15) | Nâng sidebar lên 25 |
| Danh sách tràn ra ngoài thay vì cuộn | Flex item mặc định `min-height: auto` | Thêm `min-height: 0` |
| Tuỳ biến CSS cho thư viện không có tác dụng | `styles.css` import trước CSS thư viện | Import CSS thư viện trước, `styles.css` sau cùng |
| Deploy vào thư mục con thì vỡ ảnh | `base` mặc định là `/` | `base: './'` trong `vite.config.ts` |
| Truy cập qua tunnel bị "Blocked request" | Vite chặn Host header lạ | `allowedHosts: ['.trycloudflare.com']` |
| Ký tự lạ ở đầu tiêu đề commit | `Set-Content -Encoding UTF8` của PS 5.1 ghi kèm BOM | Dùng `[System.IO.File]::WriteAllText` với `UTF8Encoding($false)` |
| Dev server tự tắt giữa chừng, log báo `EBUSY ... syscall: 'watch'` | Editor lưu file kiểu ghi-ra-file-tạm-rồi-đổi-tên; chokidar gặp `EBUSY` và lỗi này không được bắt nên giết cả tiến trình Node | Thêm `server.watch.ignored: ['**/*.tmp', '**/.*.tmpdir', '**/.*.tmpdir/**']`. **Phải có dấu chấm đầu pattern** vì tên thư mục tạm bắt đầu bằng `.`, mà `*` của picomatch không khớp dotfile |
| Thanh tua kéo không được | Lớp fill phủ lên input | `pointer-events: none` trên lớp fill |

---

## 11. Checklist dựng lại từ đầu

**Chuẩn bị dữ liệu**

- [ ] Kiểm tra mọi ảnh đúng tỉ lệ **2:1** (equirectangular)
- [ ] Resize về 4096×2048, nén JPEG quality ~84
- [ ] Sinh thumbnail ~480×240 cho danh sách
- [ ] Đặt tên theo slug ASCII, có số thứ tự
- [ ] Audio mp3 128 kbps, 30–60 giây, tên khớp với ảnh
- [ ] Chạy `prepare-media.ps1` (nhớ lưu file có BOM)

**Khởi tạo**

- [ ] `npm create vite` template `react-ts`
- [ ] Cài 3 gói photo-sphere-viewer + lucide-react
- [ ] `base: './'` trong `vite.config.ts`
- [ ] Tắt `StrictMode` trong `main.tsx` (có ghi chú lý do)
- [ ] Tạo `tour-data.ts` với type `TourScene` và mảng `scenes`

**Engine**

- [ ] Effect khởi tạo `Viewer`, mảng phụ thuộc rỗng, có `destroy()` khi cleanup
- [ ] `VirtualTourPlugin` với `renderMode: '2d'`, `positionMode: 'manual'`
- [ ] Sinh `links` nối vòng bằng `(index + 1) % scenes.length`
- [ ] Nghe `node-changed` → `pushState` cập nhật URL
- [ ] Nghe `popstate` → `setCurrentNode`
- [ ] Xử lý viewer đã ready trước khi gắn listener

**Thuyết minh**

- [ ] Một thẻ `<audio>` duy nhất trong JSX
- [ ] Effect nạp `src` khi `currentAudio` đổi, có `pause()` trước
- [ ] Gắn listener một lần, đọc state qua ref
- [ ] `.catch()` cho `play()`, có state `blocked` và nút gỡ chặn
- [ ] Thanh tua bằng `input[type=range]` + lớp fill
- [ ] `Number.isFinite` cho `duration`
- [ ] Tính năng Tự phát và Tự chuyển cảnh

**Giao diện**

- [ ] `.hud` là flex column chứa tiêu đề + hàng điều khiển
- [ ] Import CSS thư viện **trước** `styles.css`
- [ ] `z-index`: hud < sidebar < info-panel < loading
- [ ] Breakpoint 1180 / 940 / 860px và `max-height: 720px`
- [ ] `prefers-reduced-motion`

**Kiểm chứng**

- [ ] `data-scene` trên các nút để test chọn được
- [ ] Script đo bố cục ở ≥5 kích thước màn hình
- [ ] Script duyệt hết địa điểm, kiểm tra ảnh + audio + điểm nóng
- [ ] Bắt `response >= 400` và `pageerror`
- [ ] Thử `git clone` về thư mục sạch rồi `npm install && npm run build && npm run dev`

---

## 12. Hướng mở rộng

- **Ảnh phân giải cao (8K–16K):** dùng `panoData` hoặc multi-resolution để chỉ tải phần đang nhìn. Hiện tại 4096×2048 là một file duy nhất.
- **Bản đồ nhỏ:** `VirtualTourPlugin` có tuỳ chọn `map` sẵn — cần một ảnh mặt bằng và toạ độ từng node.
- **Nhiều thuyết minh/địa điểm (Việt–Anh):** thêm `audio: { vi: '...', en: '...' }` và một bộ chọn ngôn ngữ; phần còn lại giữ nguyên.
- **Phụ đề:** dùng định dạng WebVTT và thẻ `<track>`, đồng bộ sẵn với `currentTime`.
- **Điểm nóng phụ trong cảnh:** `markers` của node, ví dụ để chú thích một chi tiết kiến trúc cụ thể.
- **Tách bundle:** build hiện tại 918 kB (251 kB gzip) do bao gồm cả three.js. Nếu cần, `import()` động `App` để tách phần engine ra khỏi phần UI.

---

## 13. Nguồn tham khảo

- [Photo Sphere Viewer 5 — tài liệu](https://photo-sphere-viewer.js.org/)
- [VirtualTourPlugin](https://photo-sphere-viewer.js.org/plugins/virtual-tour.html)
- [Vite — Static Asset Handling](https://vite.dev/guide/assets.html#the-public-directory)
- [MDN — Autoplay guide for media and Web Audio APIs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- [Hồ sơ xếp hạng di tích Đền Hát Môn — Cục Di sản văn hóa](http://dsvh.gov.vn/di-tich-lich-su-den-hat-mon-2971)
- [Playwright — Best Practices](https://playwright.dev/docs/best-practices)
