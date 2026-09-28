# BUILD.md — Tự dựng một tour 360° có thuyết minh

Hướng dẫn **từng bước** để dựng một web app tour 360° có thuyết minh tự phát theo địa điểm.

Cách đọc: **Phần A** trả lời "cần build những gì" và chia nhỏ bài toán. **Phần B** là các bước làm tuần tự. **Phần C** là bảng tra lỗi. Code chỉ xuất hiện ở những chỗ mà diễn giải bằng lời khó hơn đọc code, và chỉ ở dạng tham chiếu ngắn.

> Muốn biết cách **chạy** dự án đang có, xem [`README.md`](README.md). File này nói về cách **làm ra** nó.

---

# Phần A — Cần build những gì?

## A1. Phân rã bài toán

Yêu cầu: người xem mở web, thấy ảnh 360° của một địa điểm, kéo để nhìn quanh, chuyển sang địa điểm khác, và **nghe thuyết minh tự phát theo từng địa điểm**. Chạy được trên điện thoại. Không cần server.

Từ đó tách ra thành **7 phần việc**:

| # | Phần việc | Sản phẩm đầu ra | Phụ thuộc |
|---|---|---|---|
| 1 | Dữ liệu hình ảnh | Ảnh panorama đã tối ưu + thumbnail cho danh sách | có ảnh gốc |
| 2 | Dữ liệu âm thanh | File thuyết minh đã chuẩn hoá | có bản thu |
| 3 | Mô hình dữ liệu | Danh sách địa điểm mô tả bằng code | 1, 2 |
| 4 | Khung hiển thị 360° | Trang xem được panorama, kéo và thu phóng | 3 |
| 5 | Điều hướng | Điểm nóng trong ảnh, danh sách địa điểm, URL riêng | 4 |
| 6 | Thuyết minh | Audio tự phát theo địa điểm, có điều khiển | 5 |
| 7 | Giao diện & đóng gói | Bố cục, responsive, build ra file tĩnh | 4, 5, 6 |

Hai phần xuyên suốt, làm song song chứ không để cuối: **kiểm thử** và **tài liệu**.

**Nhận xét quan trọng nhất:** phần 1 và 2 phải làm trước và làm cẩn thận. Chúng là dữ liệu đầu vào, quyết định phần lớn chất lượng sản phẩm. Ảnh sai tỉ lệ hoặc audio lệch địa điểm thì không có code nào cứu được. Đây cũng là hai phần dễ bị làm ẩu nhất vì "chỉ là copy file".

Trong 7 phần, **phần 6 là khó nhất** — không phải vì thuật toán phức tạp, mà vì phải đấu với cơ chế chặn autoplay của trình duyệt và với vòng đời của React. Dành nhiều thời gian cho nó.

## A2. Thứ tự thực hiện và lý do

```
   [1] Ảnh  ──┐
              ├──► [3] Mô hình dữ liệu ──► [4] Khung 360° ──► [5] Điều hướng ──► [6] Thuyết minh
   [2] Audio ─┘                                    │                 │                │
                                                   └─────────────────┴────────────────┘
                                                                     ▼
                                                            [7] Giao diện & đóng gói
```

Nguyên tắc: **làm cho chạy được trước, làm đẹp sau.** Thứ tự trên đảm bảo mỗi bước đều có thứ để kiểm tra bằng mắt:

- Xong bước 1–3: chưa thấy gì, nhưng mở thư mục `public/` là biết dữ liệu đã đủ.
- Xong bước 4: mở trình duyệt thấy ảnh 360° và kéo được. **Đây là mốc quan trọng đầu tiên.**
- Xong bước 5: bấm chuyển được giữa các địa điểm.
- Xong bước 6: nghe được thuyết minh. **Mốc quan trọng thứ hai — lúc này sản phẩm đã đủ dùng.**
- Bước 7 chỉ là làm cho nó đẹp và chạy được trên điện thoại.

Nếu làm ngược (giao diện trước), bạn sẽ trang trí một thứ chưa hoạt động.

## A3. Công nghệ cần chọn

| Việc | Chọn | Vì sao |
|---|---|---|
| Hiển thị ảnh 360° | Photo Sphere Viewer 5 | Xử lý sẵn phép chiếu equirectangular, WebGL, cảm ứng, quán tính |
| Điều hướng nhiều cảnh + điểm nóng | VirtualTourPlugin | Quản lý graph các cảnh, hiệu ứng chuyển, tải trước |
| Tự xoay | AutorotatePlugin | Không phải tự viết vòng lặp render |
| Lớp giao diện | React + TypeScript | Chỉ dùng cho UI bao quanh |
| Build | Vite | Dev server nhanh, build ra file tĩnh |
| Kiểm thử | Playwright | Bắt buộc phải là trình duyệt thật vì có WebGL và audio |

**Một lưu ý kiến trúc quan trọng, ảnh hưởng tới mọi bước sau:** thư viện 360° là loại *imperative* — nó tự tạo canvas, tự quản lý vòng lặp vẽ, tự gắn sự kiện. React thì *declarative*. Hai mô hình này không hoà hợp. Cách giải quyết xuyên suốt tài liệu: **để thư viện sở hữu vùng DOM của nó, React chỉ sở hữu phần UI bao quanh**, hai bên nói chuyện qua một state duy nhất. Đừng cố render lại canvas bằng React.

## A4. Nghiệm thu

Sản phẩm đạt yêu cầu khi:

- [ ] Mở trang, thấy panorama 360°, kéo được, cuộn thu phóng được.
- [ ] Chuyển giữa N địa điểm bằng cả 3 cách: điểm nóng trong ảnh, danh sách, nút điều hướng.
- [ ] Mỗi địa điểm **tự phát đúng** bản thuyết minh của nó.
- [ ] Có thanh tua, tạm dừng, và ít nhất một tuỳ chọn tự chuyển cảnh.
- [ ] Mỗi địa điểm có URL riêng, mở link vào đúng địa điểm đó.
- [ ] Dùng tốt trên màn hình 390×844.
- [ ] `npm run build` chạy sạch, `dist/` deploy được ở thư mục con.
- [ ] Clone repo về máy khác: `npm install && npm run dev` là chạy.

---

# Phần B — Các bước

Mười giai đoạn, 39 bước. Mỗi bước gồm **việc cần làm** và **xong khi** (điều kiện để đi tiếp).
---

## Giai đoạn 1 — Chuẩn bị dữ liệu hình ảnh

### B1. Kiểm tra ảnh có phải panorama 360° thật

**Việc cần làm.** Với từng ảnh định dùng, đọc kích thước và tính tỉ lệ.

Ảnh panorama 360° **bắt buộc** là phép chiếu equirectangular: ngang 360°, dọc 180°. Nên **tỉ lệ luôn đúng bằng 2**. Ảnh 6144×3072 hay 4096×2048 đều hợp lệ; 4000×3000 thì không — đưa vào sẽ bị bóp méo và không có cách nào sửa bằng CSS.

**Xong khi.** Mọi ảnh đều có tỉ lệ 2. Ảnh nào không đạt thì loại ra, đừng cố dùng.

> **Tham chiếu.** Đọc kích thước ảnh bằng PowerShell, không cần cài gì:
> ```powershell
> Add-Type -AssemblyName System.Drawing
> $i = [System.Drawing.Image]::FromFile('anh.jpg')
> "$($i.Width)x$($i.Height)  ti le $([math]::Round($i.Width/$i.Height, 3))"
> ```

### B2. Quyết định kích thước và mức nén

**Việc cần làm.** Chọn kích thước xuất và chất lượng nén.

Ảnh gốc trong dự án này là 11 file 6144×3072, tổng ~60 MB. Để nguyên thì trang đầu tải 5 MB cho một tấm ảnh — người xem rời đi trước khi thấy gì.

Mức đã chọn: **4096×2048, JPEG quality 84** → còn 1,2–1,9 MB mỗi ảnh. Đây là điểm cân bằng: đủ nét khi phóng to trên màn hình 4K, mà vẫn tải được. Nếu địa điểm của bạn ít hơn 5 tấm ảnh, có thể giữ 6144; nếu nhiều hơn 20 tấm, nên giảm còn 3072.

**Xong khi.** Chốt được một con số cụ thể và ghi lại để dùng thống nhất cho mọi ảnh.

### B3. Sinh thumbnail cho danh sách

**Việc cần làm.** Với mỗi panorama, tạo thêm một ảnh nhỏ ~480×240.

Danh sách 11 địa điểm trên giao diện chỉ hiển thị các ô ảnh cỡ 82×58 điểm ảnh. Nếu dùng ảnh full, trang phải tải 15 MB chỉ để vẽ mấy ô nhỏ. Thumbnail 480×240 chỉ nặng 22–38 KB.

**Xong khi.** Mỗi panorama có đúng một thumbnail đi kèm, tên file phân biệt được (ví dụ thêm hậu tố `-thumb`).

### B4. Đặt tên file

**Việc cần làm.** Đổi tên toàn bộ sang **slug ASCII**, có số thứ tự.

Tên file gốc thường có dấu tiếng Việt — `nghi môn chuẩn.jpg`, `gò đấu ấn chuẩn.jpg`. Có hai vấn đề thật:

1. URL phải percent-encode thành `%C4%91%E1%BB%81n...`, log khó đọc, dễ sai khi gõ tay.
2. **Unicode có hai dạng chuẩn hoá.** `ề` có thể là một ký tự (NFC, Windows dùng) hoặc `e` + hai dấu tổ hợp (NFD, macOS dùng). Hai tên hiển thị **giống hệt nhau** nhưng so sánh chuỗi lại **khác nhau** → `Test-Path` trả về `false` dù mắt thấy file nằm đó.

Cách tránh cả hai: đặt slug ASCII. Dự án này dùng dạng `01-tu-tru`, `02-nghi-mon`, … Số thứ tự ở đầu còn cho thấy ngay thứ tự tuyến tham quan khi mở thư mục.

**Xong khi.** Không còn file nào trong `public/` có dấu tiếng Việt trong tên.

### B5. Viết script tự động hoá bước B2–B4

**Việc cần làm.** Viết một script làm cả ba việc trên, để chạy lại được khi thêm ảnh mới.

Làm thủ công 11 ảnh thì được; làm 50 ảnh thì không. Script này còn là **tài liệu sống** về cách dữ liệu được tạo ra.

Nội dung script, theo thứ tự:
1. Khai báo bảng ánh xạ: slug ASCII → tên file nguồn (giữ nguyên tiếng Việt ở đây, chỉ trong script).
2. Xoá sạch thư mục đầu ra, tránh còn file mồ côi khi đổi slug.
3. Với mỗi mục: resize panorama → sinh thumbnail → copy audio.
4. In bảng tổng kết dung lượng.

> **Tham chiếu.** Phần nén JPEG cần truyền chất lượng qua `EncoderParameters`, không có tham số trực tiếp:
> ```powershell
> $enc = New-Object System.Drawing.Imaging.EncoderParameters 1
> $enc.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
>   [System.Drawing.Imaging.Encoder]::Quality, [int64]84)
> $bmp.Save($Target, $jpegCodec, $enc)
> ```

> **Bẫy.** Nếu script chứa tiếng Việt, **bắt buộc lưu file `.ps1` ở dạng UTF-8 kèm BOM**. Windows PowerShell 5.1 đọc file không có BOM theo bảng mã ANSI của hệ thống, mọi ký tự tiếng Việt sẽ hỏng, và script sẽ báo "không tìm thấy file nguồn" dù file có đó.

**Xong khi.** Chạy script từ thư mục trống cho ra đầy đủ ảnh, thumbnail, audio trong `public/`.

---

## Giai đoạn 2 — Chuẩn bị dữ liệu âm thanh

### B6. Chuẩn hoá định dạng và độ dài

**Việc cần làm.** Chuyển toàn bộ bản thu về một định dạng thống nhất, kiểm tra độ dài.

- **Định dạng: mp3.** Tương thích rộng nhất, kể cả Safari trên iOS. `.m4a`/AAC nhẹ hơn nhưng phức tạp hơn về license và tương thích.
- **Bitrate: 128 kbps** là đủ cho giọng nói. Dự án này 11 file tổng 6,3 MB.
- **Độ dài: 30–60 giây mỗi địa điểm.** Ngắn hơn thì hụt thông tin; dài hơn thì người xem phải chờ lâu mới được chuyển cảnh, nên cho họ chủ động dừng.
- **Đặt tên khớp với ảnh**: `07-ta-huu-mac.jpg` ↔ `07-ta-huu-mac.mp3`. Ghép cặp bằng mắt được, và sau này viết code ghép tự động cũng dễ.

**Xong khi.** Mọi file là mp3, tên khớp 1-1 với ảnh, biết rõ file nào còn thiếu.

### B7. Xử lý trường hợp thiếu bản thu

**Việc cần làm.** Quyết định trước: địa điểm chưa có audio thì làm gì?

Thực tế dự án này có 11 ảnh nhưng lúc đầu chỉ có 10 bản thu. Ba lựa chọn: bỏ địa điểm khỏi tour, tạo file audio rỗng, hay **cho phép thiếu và hiển thị trạng thái "chưa có bản thu"**.

Chọn cách thứ ba. Hệ quả kéo theo ở Giai đoạn 3 (audio phải là trường tuỳ chọn) và Giai đoạn 6 (UI phải có nhánh hiển thị trạng thái trống). Quyết định này ngay từ đầu sẽ tiết kiệm việc sửa về sau — và trong thực tế, việc thu âm luôn xong sau khi đã có ảnh.

**Xong khi.** Biết chắc địa điểm nào thiếu audio và đã thống nhất cách xử lý.

---

## Giai đoạn 3 — Khung dự án

### B8. Khởi tạo dự án

**Việc cần làm.** Tạo dự án Vite với template React + TypeScript, cài thư viện 360° và thư viện icon.

**Xong khi.** `npm run dev` mở ra trang mặc định của template.

### B9. Cấu hình build cho đúng cách deploy

**Việc cần làm.** Sửa `vite.config.ts`.

**`base: './'`** — dùng đường dẫn tương đối. Giá trị mặc định của Vite là `/` (gốc tên miền), chỉ đúng khi deploy lên tên miền riêng. Với `./`, thư mục `dist/` chạy được ở **bất kỳ** thư mục con nào: `user.github.io/`, `user.github.io/tour/`, hay thậm chí mở trực tiếp bằng `file://`. Đây là lỗi chỉ lộ ra lúc deploy — ảnh và JS sẽ 404 hàng loạt.

**Cho phép hostname khi chia sẻ tạm** — Vite chặn request có `Host` header lạ để phòng DNS rebinding. Nếu định demo qua Cloudflare Quick Tunnel, hostname sinh ngẫu nhiên mỗi lần chạy, nên khai báo cả miền con thay vì dán từng URL.

**Xong khi.** `npm run build` chạy sạch, và mở `dist/index.html` bằng đường dẫn tương đối vẫn thấy nội dung.

### B10. Tắt StrictMode

**Việc cần làm.** Bỏ `<StrictMode>` trong `main.tsx`, **kèm comment giải thích lý do**.

Ở chế độ dev, React StrictMode cố tình mount → unmount → mount lại để phát hiện effect không sạch. Với thư viện WebGL, việc đó tạo ra cuộc đua: canvas cũ bị `destroy()` trong khi canvas mới đang khởi tạo → mất context, màn hình đen.

Đây là **ngoại lệ chính đáng** của quy tắc "luôn dùng StrictMode". Nhưng phải ghi comment, nếu không người đọc code sau sẽ tưởng là code ẩu và bật lại.

**Xong khi.** Comment đã có, và hiểu rõ mình vừa đánh đổi cái gì.

---

## Giai đoạn 4 — Mô hình dữ liệu

### B11. Định nghĩa kiểu dữ liệu cho một địa điểm

**Việc cần làm.** Tạo một file riêng chứa kiểu dữ liệu và mảng dữ liệu. File này **không import React, không chứa JSX**.

Tách dữ liệu ra khỏi giao diện là quyết định quan trọng nhất của giai đoạn này. Nhờ nó, thêm địa điểm chỉ là thêm một mục vào mảng, không phải sửa component.

Các trường cần có, chia làm ba nhóm:

- **Nhận diện:** `id` (dùng cho URL), `name`, `eyebrow` (nhãn nhỏ), `tagline` (một dòng).
- **Nội dung:** `description` (đoạn dài cho bảng thông tin), `highlights` (mảng gạch đầu dòng).
- **Tài nguyên:** `panorama`, `thumbnail`, **`audio` — để tuỳ chọn**, và góc đặt điểm nóng.

`audio` là tuỳ chọn vì lý do ở bước B7.

**Xong khi.** Kiểu đã định nghĩa xong và bạn thấy rõ mình sẽ điền được hết các trường cho từng địa điểm.

### B12. Điền dữ liệu cho toàn bộ địa điểm

**Việc cần làm.** Viết mảng địa điểm, **xếp theo thứ tự tuyến tham quan thực tế**.

Thứ tự trong mảng chính là thứ tự người xem đi qua. Nên xếp theo lối đi thật (từ cổng ngoài vào trong, hoặc theo trình tự tham quan), không phải theo thứ tự file ảnh bạn chụp được.

Nội dung mô tả nên dựa trên **nguồn chính thống** — hồ sơ di tích, tài liệu của cơ quan quản lý — chứ không phải tự nghĩ ra. Với dự án này, tư liệu của Cục Di sản văn hóa giúp sửa được cả tên gọi sai (ảnh đặt tên "gò đấu ấn" nhưng tư liệu chính thức là "gò Giấu Ấn").

**Xong khi.** Mọi địa điểm đều có đủ trường, mô tả có nguồn, thứ tự hợp lý.

### B13. Viết hàm đọc địa điểm từ URL

**Việc cần làm.** Thêm hàm nhận `?scene=<id>` và trả về id hợp lệ.

Điểm quan trọng: id không hợp lệ phải **âm thầm quay về địa điểm đầu tiên**, không được báo lỗi. Người dùng có thể gõ tay URL, hoặc mở link cũ sau khi bạn đổi id. Crash ở đây là trải nghiệm rất xấu.

**Xong khi.** Mở `?scene=khong-ton-tai` vẫn thấy địa điểm đầu tiên, không có lỗi.

### B14. Thêm hàm nhóm địa điểm

**Việc cần làm.** Viết hàm gom các địa điểm cùng nhóm thành từng cụm, dựa trên một trường `group` dạng chuỗi tự do.

Dùng chuỗi tự do thay vì enum giúp thêm nhóm mới mà không phải sửa kiểu. Hàm gom nhóm chỉ cần quy tắc: các địa điểm cùng nhóm phải **đứng cạnh nhau** trong mảng.

**Xong khi.** Danh sách nhóm suy ra được từ dữ liệu, không hardcode ở đâu cả.

---

## Giai đoạn 5 — Khung hiển thị 360°

### B15. Nhúng thư viện vào React

**Việc cần làm.** Tạo một component, trong `useEffect`, khởi tạo đối tượng viewer trỏ vào một `<div>` do React render.

Đây là chỗ hai mô hình imperative/declarative gặp nhau. Quy tắc:

- React render một `<div>` rỗng, giao quyền sở hữu cho thư viện.
- Thư viện được khởi tạo **một lần duy nhất** — effect phải có mảng phụ thuộc rỗng.
- Trong hàm cleanup của effect, gọi `destroy()` để giải phóng canvas.

**Xong khi.** Mở trình duyệt thấy panorama, kéo được, cuộn thu phóng được. Đây là mốc kiểm tra quan trọng đầu tiên của cả dự án.

### B16. Xử lý sự kiện "đã sẵn sàng"

**Việc cần làm.** Nghe sự kiện viewer báo đã tải xong ảnh đầu tiên, để tắt màn hình chờ.

**Bẫy.** Chỉ nghe sự kiện là chưa đủ. Nếu ảnh đã có trong cache, sự kiện có thể bắn **xong trước khi** ta kịp gắn listener → màn hình chờ treo vĩnh viễn. Triệu chứng rất dễ nhận ra: **lần tải đầu bình thường, lần tải thứ hai mới treo**.

Cần kiểm tra thêm trạng thái hiện tại của viewer ngay sau khi gắn listener.

**Xong khi.** Tải lại trang (F5) nhiều lần liên tiếp, lần nào màn hình chờ cũng tắt.

### B17. Quyết định chế độ định vị và chế độ hiển thị điểm nóng

**Việc cần làm.** Chọn cấu hình cho plugin điều hướng. Hai lựa chọn ảnh hưởng lớn:

**Định vị điểm nóng giữa các cảnh — theo GPS hay đặt tay?** Chế độ GPS tự tính hướng di chuyển từ toạ độ thật, rất hay cho tour ngoài trời. Nhưng nó đòi hỏi toạ độ chính xác, và với nhiều điểm trong cùng một khuôn viên thì sai số vài mét cũng đủ làm hướng sai. Chế độ đặt tay cho kết quả đoán được. **Dự án này chọn đặt tay.**

**Điểm nóng hiển thị dạng 3D hay DOM?** Dạng 3D nằm trong không gian, phóng to thu nhỏ theo độ sâu, trông tự nhiên hơn. Dạng DOM là `<button>` thật:

- Bấm được bằng chuột, cảm ứng, **và trình đọc màn hình**.
- **Test tự động bấm được** — với canvas 3D thì gần như không thể.

Đánh đổi: trông "phẳng" hơn. **Dự án này chọn DOM**, vì khả năng truy cập và test được quan trọng hơn.

**Xong khi.** Đã chọn xong và ghi lại lý do, để sau không phải suy lại.

---

## Giai đoạn 6 — Điều hướng

### B18. Tạo điểm nóng nối các địa điểm

**Việc cần làm.** Sinh danh sách điểm nóng cho từng cảnh, nối tới cảnh kế tiếp.

Mỗi địa điểm cần một điểm nóng chỉ tới địa điểm sau. Địa điểm cuối cùng nên nối về đầu để tuyến khép kín (hoặc để trống nếu muốn kết thúc hẳn) — chọn bằng phép chia lấy dư theo độ dài mảng.

> **Tham chiếu.** Ý tưởng khép vòng:
> ```
> nodeId = scenes[(index + 1) % scenes.length].id
> ```

**Chi tiết ảnh hưởng tới cảm giác sử dụng:** đặt điểm nóng hơi thấp dưới đường chân trời (khoảng −4°). Ở mức 0° nó nằm chính giữa tầm nhìn và che mất chi tiết; ở −4° trông như đặt trên mặt sân.

**Xong khi.** Từ mỗi địa điểm đều bấm được sang địa điểm kế tiếp.

### B19. Đồng bộ URL hai chiều

**Việc cần làm.** Khi đổi địa điểm thì cập nhật URL; khi người dùng bấm Back/Forward thì đổi lại địa điểm.

Dùng `history.pushState` để đổi URL **mà không tải lại trang**. Nhờ vậy mỗi địa điểm có link riêng, chia sẻ được, bookmark được — đây là yêu cầu ở phần nghiệm thu A4.

**Bẫy rất hay gặp:** quên chiều ngược lại. Triệu chứng: bấm nút Back của trình duyệt thì **URL đổi mà panorama đứng yên**. Phải nghe thêm sự kiện `popstate` và đặt lại cảnh theo URL.

**Xong khi.** Bấm Back/Forward qua lại nhiều lần, ảnh và URL luôn khớp nhau.

### B20. Làm danh sách địa điểm bên trái

**Việc cần làm.** Hiển thị danh sách chia theo nhóm, mỗi mục có thumbnail, tên, và trạng thái đang xem.

Thêm thuộc tính `data-scene="<id>"` vào mỗi nút. Không có nó, test tự động phải chọn theo tên hiển thị — rất dễ khớp nhầm khi tên các địa điểm na ná nhau (`Nghi môn` và `Nghi môn ngoại`).

**Xong khi.** Bấm vào mục nào cũng chuyển đúng tới địa điểm đó, và mục đang xem được đánh dấu rõ.

---

## Giai đoạn 7 — Thuyết minh

Đây là giai đoạn khó nhất. Bảy bước, và mỗi bước đều có một cái bẫy cụ thể.

### B21. Chọn cách quản lý phần tử audio

**Việc cần làm.** Dùng **một thẻ `<audio>` duy nhất** đặt trong JSX, đổi `src` mỗi khi chuyển địa điểm.

**Đây là quyết định quan trọng nhất của cả giai đoạn.** Trực giác thường mách bảo tạo đối tượng audio mới cho mỗi địa điểm. Làm vậy sẽ hỏng: trình duyệt cấp quyền autoplay **theo từng phần tử**. Khi người dùng đã tương tác và một thẻ audio đã phát được, các lần đổi `src` sau đó trên **cùng thẻ đó** vẫn phát được. Tạo thẻ mới mỗi cảnh thì mỗi lần đều bị chặn lại từ đầu.

**Xong khi.** Chỉ có đúng một thẻ audio trong DOM, và bạn hiểu vì sao không được tạo thêm.

### B22. Nạp bản thu khi đổi địa điểm

**Việc cần làm.** Viết effect theo dõi địa điểm hiện tại, thực hiện theo thứ tự:

1. Dừng audio đang phát (nếu không, audio cũ phát chồng lên).
2. Đặt lại thời gian và thời lượng hiển thị về 0.
3. Nếu địa điểm **không có** audio: **xoá thuộc tính** `src` rồi gọi `load()`.
4. Nếu có: chỉ nạp khi `src` khác hiện tại, tránh nạp lại vô ích.
5. Nếu chế độ tự phát đang bật: gọi phát.

**Bẫy ở bước 3.** Đừng gán `src` bằng chuỗi rỗng. Trình duyệt sẽ hiểu là đường dẫn tương đối, cố tải chính trang HTML làm file audio, và bắn lỗi tải trong console.

**Xong khi.** Chuyển qua lại giữa địa điểm có audio và không có audio đều không sinh lỗi trong console.

### B23. Xử lý autoplay bị trình duyệt chặn

**Việc cần làm.** Bắt lỗi khi gọi phát, và có cách để người dùng gỡ chặn.

Lần tải trang đầu tiên **luôn** bị chặn, vì chưa có tương tác nào của người dùng. Hàm phát trả về một Promise bị từ chối — **bắt buộc phải bắt lỗi này**, nếu không sẽ có `Uncaught (in promise) NotAllowedError` trong console.

Cách xử lý: đặt một cờ trạng thái "đang bị chặn", và gỡ chặn ở lần chạm đầu tiên của người dùng (gắn listener một lần rồi tự gỡ).

**Về giao diện: đừng im lặng.** Khi bị chặn, phải hiện thông báo rõ ràng — ví dụ làm thanh thuyết minh nhấp nháy và hiện dòng "Bấm để bật âm thanh". Nếu không, người dùng sẽ tưởng tính năng hỏng.

**Xong khi.** Mở trang lần đầu thấy thông báo, bấm một cái là audio chạy, và từ đó chuyển địa điểm tự phát bình thường.

### B24. Gắn listener đọc trạng thái audio

**Việc cần làm.** Nghe các sự kiện của thẻ audio để cập nhật giao diện: thời gian chạy, tổng thời lượng, đang phát hay tạm dừng, đã hết.

**Bẫy 1 — stale closure.** Listener được gắn **một lần** trong effect có mảng phụ thuộc rỗng, nên nó "nhớ" giá trị state tại thời điểm gắn, mãi mãi. Triệu chứng điển hình: người dùng bật tuỳ chọn "Tự chuyển cảnh" mà **không có tác dụng gì**, vì listener vẫn thấy giá trị cũ là tắt.

Cách xử lý: giữ một biến tham chiếu luôn được cập nhật ở mỗi lần render, và listener đọc biến đó thay vì đọc state trực tiếp.

**Bẫy 2 — thời lượng.** Một số trình duyệt báo thời lượng là `Infinity` ở sự kiện metadata đầu tiên rồi mới cập nhật lại. Phải kiểm tra giá trị có hữu hạn không trước khi dùng, nếu không giao diện sẽ hiện `Infinity:NaN`. Nên nghe cả hai sự kiện metadata và thay đổi thời lượng.

**Xong khi.** Thanh thời gian chạy đúng, và tuỳ chọn tự chuyển cảnh bật lên là có tác dụng ngay.

### B25. Làm thanh tua và các nút điều khiển

**Việc cần làm.** Thanh tua, nút phát/dừng, nghe lại từ đầu, tới trước, tắt tiếng, và hai tuỳ chọn: tự phát khi chuyển cảnh, tự chuyển cảnh khi hết bài.

**Kỹ thuật cho thanh tua:** dùng một `<input type="range">` **trong suốt** đặt đè lên một thanh màu tự vẽ. Dùng cách này thay vì thuộc tính `accent-color` vì cần gradient nhiều màu và tay nắm tuỳ biến.

Ba chi tiết dễ sai:
- Lớp màu vẽ bên dưới phải tắt nhận chuột, nếu không nó nuốt cú click và thanh tua không kéo được.
- Giá trị tối đa phải là 0 khi chưa biết thời lượng, vì lúc đó thời lượng là `NaN` → thanh tua hỏng và React cảnh báo.
- Giá trị hiện tại có thể vượt quá thời lượng một chút do làm tròn → phải kẹp lại.

**Xong khi.** Kéo thanh tua nhảy đúng vị trí; tất cả nút bấm có tác dụng.

### B26. Nối hai chiều: hết bài thì chuyển cảnh

**Việc cần làm.** Trong listener "audio đã hết", nếu tuỳ chọn tự chuyển cảnh đang bật thì chuyển sang địa điểm kế tiếp.

Khi địa điểm đổi, effect ở B22 chạy lại và tự phát bản thu của cảnh mới. Ghép hai phần này lại là có tính năng "bật rồi ngồi nghe hết một lượt".

Nên **chờ khoảng 0,7 giây** trước khi chuyển, để hiệu ứng fade của ảnh kết thúc — tránh việc audio mới phát đè lên hình cũ.

**Xong khi.** Bật tuỳ chọn, ngồi yên, và tự động đi hết các địa điểm mà không cần chạm.

---

## Giai đoạn 8 — Giao diện

### B27. Dựng bố cục

**Việc cần làm.** Chia màn hình thành các vùng: thanh trên, danh sách bên trái, vùng ảnh 360° ở giữa, cụm điều khiển dưới cùng, bảng thông tin bên phải.

**Bài học lớn nhất của giai đoạn này.** Ban đầu tôi đặt khối tiêu đề và khối điều khiển là hai khối định vị tuyệt đối **độc lập**, mỗi khối có khoảng cách đáy cố định. Trông ổn trên màn hình rộng.

Nhưng chiều cao của thanh thuyết minh **không cố định** — nó phụ thuộc vào việc hàng nút có xuống dòng không, mà việc đó lại phụ thuộc bề rộng màn hình. Ở một kích thước cụ thể, thanh cao hơn dự kiến và **đè lên tiêu đề**, che mất nút bấm.

Cách sửa đúng **không phải** là tăng khoảng cách đáy lên cho đủ — làm vậy sẽ vỡ ở kích thước khác. Cách đúng là đưa hai khối vào **cùng một luồng xếp dọc**, để trình duyệt tự tính. Khi đó chúng không thể đè nhau ở bất kỳ kích thước nào.

> **Nguyên tắc rút ra:** khi hai khối có chiều cao động, đừng định vị chúng độc lập bằng toạ độ tuyệt đối. Hãy đặt chúng vào cùng một luồng.

Khối bao quanh phải tắt nhận chuột để không chặn thao tác kéo panorama ở vùng trống, nhưng các nút bên trong vẫn phải nhận chuột.

**Xong khi.** Thu nhỏ và phóng to cửa sổ từ từ, không có chỗ nào các khối đè lên nhau.

### B28. Thứ tự import CSS

**Việc cần làm.** Import CSS của thư viện 360° **trước**, CSS của mình **sau cùng**.

CSS không có cơ chế ghi đè như JavaScript. Khi hai quy tắc cùng độ đặc hiệu, **quy tắc đến sau thắng**. Nếu import CSS của mình trước, các quy tắc của thư viện sẽ đè lên, và việc tuỳ biến điểm nóng hay vòng xoay sẽ không có tác dụng — dù CSS của bạn trông hoàn toàn đúng.

**Xong khi.** Tuỳ biến màu điểm nóng có tác dụng thật trên trình duyệt.

### B29. Phân tầng z-index

**Việc cần làm.** Xếp thứ tự lớp cho tất cả các vùng, và ghi lại thứ tự đó ở một chỗ.

Thứ tự trong dự án này, từ dưới lên: vùng ảnh → khối tiêu đề → cụm điều khiển → **ngăn kéo danh sách** → bảng thông tin → màn hình chờ → thông báo.

**Bẫy.** Trên màn hình hẹp, danh sách biến thành ngăn kéo trượt. Nếu cụm điều khiển có `z-index` cao hơn ngăn kéo, mở ngăn kéo ra sẽ thấy **thanh thuyết minh nằm đè lên trên**, che mất danh sách. Ngăn kéo phải nằm trên cụm điều khiển.

**Xong khi.** Mở ngăn kéo trên màn hình hẹp, nó che hết mọi thứ bên dưới.

### B30. Responsive

**Việc cần làm.** Thêm các điểm ngắt cho màn hình hẹp và màn hình thấp.

Bốn điểm ngắt của dự án này:
- **~1180px:** thu nhỏ tiêu đề, thu hẹp thanh thuyết minh.
- **~940px:** ẩn gợi ý tương tác (không còn chỗ).
- **~860px:** danh sách thành ngăn kéo, cụm điều khiển xếp dọc, tiêu đề nhỏ lại, ẩn dòng mô tả phụ.
- **chiều cao ≤ 720px:** ẩn bớt chữ để không chiếm chỗ của ảnh.

Ba mức đầu theo bề rộng, mức cuối theo **chiều cao** — vì vấn đề ở màn hình thấp là thiếu chiều dọc, không phải thiếu chiều ngang.

**Xong khi.** Kiểm tra ở 1440×900, 1280×800, 1024×768, 390×844, 360×640 đều dùng được.

### B31. Chi tiết hoàn thiện

**Việc cần làm.** Màn hình chờ, hiệu ứng chuyển, trạng thái đang phát, và tôn trọng cài đặt giảm chuyển động của hệ điều hành.

Nên thêm một khối CSS tắt mọi animation khi người dùng bật "giảm chuyển động" trong cài đặt hệ thống. Chi phí gần bằng không, nhưng tránh gây khó chịu cho người nhạy cảm với chuyển động.

**Xong khi.** Bật "reduce motion" trong hệ điều hành, các hiệu ứng nhấp nháy và sóng dừng lại.

---

## Giai đoạn 9 — Kiểm thử

### B32. Vì sao phải kiểm thử tự động

**Việc cần làm.** Hiểu rõ ba loại lỗi không thể phát hiện bằng cách mở trang lên ngắm.

1. **Bố cục vỡ ở một kích thước màn hình bạn không thử.** Bạn sẽ chỉ thử ở kích thước màn hình của mình.
2. **Audio nạp sai file** — lệch một địa điểm. Giao diện trông hoàn toàn bình thường, không có lỗi nào.
3. **Autoplay không chạy mà không báo gì.** Không có lỗi trong console.

Cả ba đều phải **đo** mới thấy.

**Xong khi.** Bạn chấp nhận rằng "mở lên thấy đẹp" không phải là kiểm thử.

### B33. Script đo bố cục

**Việc cần làm.** Viết script mở trang ở nhiều kích thước màn hình và **đo** bằng toạ độ thật, thay vì chụp ảnh rồi nhìn.

Với mỗi kích thước, kiểm tra:
- Có khối nào tràn ra ngoài khung không.
- Hai khối có chồng lên nhau không (tính diện tích giao nhau).
- Khối nào đang nằm trên khối nào (so sánh `z-index` tính toán được).
- **Audio có thực sự phát không** — bấm sang địa điểm khác rồi kiểm tra trạng thái phát và thời gian có đang tiến.

Chính script này đã phát hiện ra lỗi tiêu đề đè thanh điều khiển (B27) và lỗi ngăn kéo bị đè (B29).

**Xong khi.** Chạy script ở ít nhất 5 kích thước, không báo vấn đề nào.

> **Tham chiếu.** Công thức kiểm tra chồng lấn:
> ```
> w = min(a.phải, b.phải) - max(a.trái, b.trái)
> h = min(a.đáy,  b.đáy)  - max(a.trên, b.trên)
> chồng nhau nếu cả w và h đều > 2px
> ```

### B34. Script kiểm tra toàn tuyến

**Việc cần làm.** Viết script duyệt hết các địa điểm và xác nhận với từng cái: đúng ảnh nền, đúng file audio, tiêu đề khớp, có điểm nóng, thanh thuyết minh không tràn khung.

Đồng thời bắt **mọi phản hồi HTTP lỗi** và **mọi lỗi JavaScript**. Đây là lưới an toàn rẻ nhất — bắt được cả ảnh/audio bị 404 lẫn lỗi runtime, ở mọi lần chạy.

**Xong khi.** Script chạy qua hết và báo "tất cả đạt".

### B35. Test end-to-end

**Việc cần làm.** Viết vài test Playwright cho các luồng chính: mở trang, chuyển địa điểm bằng danh sách, bằng nút điều hướng, bằng điểm nóng trong ảnh; kiểm tra audio nạp đúng.

Hai lưu ý khi cấu hình:
- Dùng **Chrome có sẵn của máy** thay vì để Playwright tải Chromium riêng (tiết kiệm ~150 MB và thời gian cài).
- Cho Playwright **tự bật dev server** trước khi chạy test, và tận dụng lại nếu đang chạy.

Vì có WebGL, test phải **chờ màn hình chờ tắt** rồi mới thao tác.

**Xong khi.** Toàn bộ test xanh.

---

## Giai đoạn 10 — Đóng gói

### B36. Build và kiểm tra bản build

**Việc cần làm.** Chạy build production, rồi **chạy thử chính bản build đó** — không chỉ tin vào việc build thành công.

Nên đặt lệnh build gồm **typecheck trước, build sau**. Nếu để build chạy trước, nó vẫn thành công dù có lỗi type, vì công cụ build chỉ xoá type chứ không kiểm tra.

**Xong khi.** Chạy script kiểm tra toàn tuyến (B34) trỏ vào bản build, kết quả vẫn đạt.

### B37. Kiểm tra repo đủ để người khác chạy

**Việc cần làm.** Clone repo về một thư mục sạch rồi chạy lại từ đầu: cài đặt → build → chạy.

Đây là **bước kiểm chứng cuối cùng và quan trọng nhất** cho mục tiêu "người khác clone về là dùng được". Những thứ thường thiếu: file khoá phụ thuộc, tài nguyên nằm trong thư mục bị gitignore, biến môi trường.

Cần quyết định **dữ liệu nào đưa lên git**. Với dự án này: đưa ảnh đã tối ưu và audio (để clone về là chạy ngay), **không** đưa ảnh gốc 6144×3072 (65 MB, chỉ cần khi chạy lại script chuẩn hoá) và không đưa các thư mục tư liệu không còn dùng. Kết quả: repo 26 MB thay vì 220 MB.

Nhưng phải **ghi rõ trong README** rằng script chuẩn hoá cần thư mục ảnh gốc, nếu không người sau sẽ bối rối khi script báo thiếu file.

**Xong khi.** Trên máy sạch: `clone → install → build → dev` chạy được, và test xanh.

### B38. Viết README

**Việc cần làm.** Viết hướng dẫn chạy, đặt ở đầu file.

README tối thiểu phải có:
- Yêu cầu phiên bản Node.
- **Ba lệnh** clone → install → dev.
- **Cảnh báo autoplay**: phải bấm vào trang một lần trước khi nghe được thuyết minh. Nếu không nói trước, người xem sẽ tưởng tính năng hỏng.
- Cách thêm/sửa địa điểm, kèm mẫu một mục dữ liệu.
- Bảng các lệnh còn lại.
- Ghi chú về dữ liệu nào không nằm trong repo và vì sao.

**Xong khi.** Một người chưa biết gì đọc README có thể chạy được dự án mà không cần hỏi.

### B39. Thêm file cấu hình git

**Việc cần làm.** Thêm `.gitignore` và `.gitattributes`.

`.gitignore` chặn `node_modules`, thư mục build, log, và các thư mục dữ liệu nặng không dùng.

`.gitattributes` chuẩn hoá ký tự xuống dòng để clone trên Windows/macOS/Linux cho kết quả giống nhau, đồng thời đánh dấu ảnh và audio là dữ liệu nhị phân để git không xử lý nhầm.

**Xong khi.** `git status` sạch sau khi build và chạy test (không có file rác nào bị theo dõi).

---

# Phần C — Bảng tra bẫy

Tổng hợp những lỗi đã thực sự gặp khi làm dự án này. Cột "Triệu chứng" là thứ bạn quan sát được, thường không giống với nguyên nhân.

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| Script báo "thiếu ảnh nguồn" dù file có đó | `.ps1` chứa tiếng Việt nhưng không có BOM; PowerShell 5.1 đọc theo ANSI | Lưu `.ps1` dạng UTF-8 **có BOM** |
| `Test-Path` trả `false` dù mắt thấy file | Tên file dạng NFD (macOS) vs NFC (Windows) | Dùng slug ASCII, tránh dấu trong tên file |
| Lần tải đầu bình thường, lần thứ hai màn hình chờ treo | Sự kiện "ready" bắn trước khi listener được gắn (ảnh đã cache) | Kiểm tra trạng thái viewer ngay sau khi gắn listener |
| Bấm Back: URL đổi mà ảnh đứng yên | Không nghe sự kiện `popstate` | Nghe và đặt lại cảnh theo URL |
| Tuỳ chọn "Tự chuyển cảnh" bật mà không có tác dụng | Listener gắn một lần nên nhớ giá trị state cũ | Giữ biến tham chiếu cập nhật mỗi render, listener đọc biến đó |
| `Uncaught (in promise) NotAllowedError` | Hàm phát trả Promise bị từ chối khi autoplay bị chặn | Luôn bắt lỗi và hiện thông báo cho người dùng |
| Console báo lỗi tải chính trang HTML như file audio | Gán `src` bằng chuỗi rỗng | Xoá hẳn thuộc tính `src` rồi gọi `load()` |
| Giao diện hiện `Infinity:NaN` | Có trình duyệt báo thời lượng là `Infinity` | Kiểm tra giá trị hữu hạn trước khi dùng |
| Tiêu đề bị thanh điều khiển đè | Hai khối định vị tuyệt đối độc lập, chiều cao động | Đưa vào cùng một luồng xếp dọc |
| Ngăn kéo bị thanh thuyết minh đè | `z-index` cụm điều khiển cao hơn ngăn kéo | Cho ngăn kéo nằm trên cụm điều khiển |
| Danh sách tràn ra ngoài thay vì cuộn | Phần tử flex mặc định không co nhỏ hơn nội dung | Thêm `min-height: 0` |
| Tuỳ biến CSS cho thư viện không có tác dụng | CSS của mình import trước CSS thư viện | Import CSS thư viện trước, của mình sau cùng |
| Deploy vào thư mục con thì ảnh và JS 404 | `base` mặc định là `/` | Đặt `base: './'` |
| Truy cập qua tunnel bị chặn | Vite chặn `Host` header lạ | Khai báo hostname tunnel trong `allowedHosts` |
| Dev server tự tắt, log báo `EBUSY ... watch` | Editor lưu file kiểu "ghi file tạm rồi đổi tên"; thư viện theo dõi file gặp lỗi và lỗi này không được bắt | Thêm mẫu bỏ qua file tạm vào cấu hình theo dõi file |
| Thanh tua kéo không được | Lớp màu vẽ bên dưới nuốt cú click | Tắt nhận chuột trên lớp màu đó |
| Ký tự lạ ở đầu tiêu đề commit | Lệnh ghi file của PowerShell 5.1 thêm BOM | Ghi file bằng API .NET với UTF-8 không BOM |

---

# Phần D — Checklist tổng

**Dữ liệu**
- [ ] Mọi ảnh đúng tỉ lệ 2:1
- [ ] Đã chọn kích thước xuất và mức nén, áp dụng thống nhất
- [ ] Có thumbnail cho từng panorama
- [ ] Tên file là slug ASCII, có số thứ tự
- [ ] Audio mp3, 30–60 giây, tên khớp với ảnh
- [ ] Biết rõ địa điểm nào thiếu audio
- [ ] Script chuẩn hoá chạy lại được, lưu UTF-8 có BOM

**Khung**
- [ ] `base: './'`
- [ ] `allowedHosts` nếu cần chia sẻ qua tunnel
- [ ] StrictMode đã tắt **kèm comment giải thích**

**Dữ liệu tour**
- [ ] Kiểu dữ liệu tách khỏi UI, `audio` là tuỳ chọn
- [ ] Mảng địa điểm xếp theo tuyến tham quan thật
- [ ] Mô tả có nguồn chính thống
- [ ] Đọc id từ URL, id sai thì về địa điểm đầu
- [ ] Nhóm địa điểm suy ra từ dữ liệu

**Hiển thị & điều hướng**
- [ ] Viewer khởi tạo một lần, có `destroy()` khi cleanup
- [ ] Xử lý được trường hợp viewer ready trước khi gắn listener
- [ ] Đã chọn chế độ định vị và chế độ hiển thị điểm nóng, ghi lại lý do
- [ ] Điểm nóng nối vòng, đặt hơi thấp dưới đường chân trời
- [ ] Đồng bộ URL hai chiều, có xử lý `popstate`
- [ ] Nút trong danh sách có `data-scene`

**Thuyết minh**
- [ ] Chỉ một thẻ audio duy nhất
- [ ] Effect nạp audio có dừng audio cũ trước
- [ ] Địa điểm không có audio thì xoá thuộc tính `src`, không gán chuỗi rỗng
- [ ] Bắt lỗi khi phát, có trạng thái "bị chặn" và cách gỡ
- [ ] Listener đọc state qua biến tham chiếu
- [ ] Kiểm tra thời lượng hữu hạn
- [ ] Thanh tua hoạt động, lớp màu không nuốt click
- [ ] Có tuỳ chọn tự phát và tự chuyển cảnh

**Giao diện**
- [ ] Tiêu đề và cụm điều khiển nằm cùng một luồng
- [ ] Import CSS thư viện trước, CSS của mình sau
- [ ] Ngăn kéo nằm trên cụm điều khiển
- [ ] Đã kiểm tra 5 kích thước màn hình
- [ ] Tôn trọng cài đặt giảm chuyển động

**Kiểm thử & đóng gói**
- [ ] Script đo bố cục chạy sạch
- [ ] Script kiểm tra toàn tuyến chạy sạch
- [ ] Test e2e xanh
- [ ] Đã thử trên bản build, không chỉ bản dev
- [ ] Đã clone về thư mục sạch và chạy lại thành công
- [ ] README có cảnh báo autoplay
- [ ] Có `.gitignore` và `.gitattributes`

---

# Phần E — Hướng mở rộng

- **Ảnh phân giải cao (8K–16K):** chia nhỏ ảnh thành nhiều mức phân giải để chỉ tải phần đang nhìn. Hiện tại mỗi panorama là một file duy nhất.
- **Bản đồ nhỏ:** thư viện điều hướng có sẵn tuỳ chọn bản đồ — cần một ảnh mặt bằng và toạ độ từng địa điểm.
- **Nhiều ngôn ngữ:** cho trường audio nhận một bộ giá trị theo ngôn ngữ, thêm bộ chọn ngôn ngữ. Phần còn lại giữ nguyên.
- **Phụ đề:** dùng định dạng WebVTT, đồng bộ sẵn với thời gian phát.
- **Điểm nóng phụ trong cảnh:** để chú thích một chi tiết kiến trúc cụ thể bên trong một panorama.
- **Tách bundle:** build hiện tại khá nặng vì bao gồm cả thư viện 3D. Có thể tách phần engine ra khỏi phần UI bằng import động.

---

# Phần F — Nguồn tham khảo

- [Photo Sphere Viewer 5 — tài liệu](https://photo-sphere-viewer.js.org/)
- [VirtualTourPlugin](https://photo-sphere-viewer.js.org/plugins/virtual-tour.html)
- [Vite — Static Asset Handling](https://vite.dev/guide/assets.html#the-public-directory)
- [MDN — Autoplay guide for media and Web Audio APIs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- [Hồ sơ xếp hạng di tích Đền Hát Môn — Cục Di sản văn hóa](http://dsvh.gov.vn/di-tich-lich-su-den-hat-mon-2971)
- [Playwright — Best Practices](https://playwright.dev/docs/best-practices)
