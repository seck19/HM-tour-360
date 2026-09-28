# Chuẩn hóa ảnh panorama + audio thuyết minh cho tour 360.
# Nguồn: "audio và ảnh hai bà trưng" (ảnh 6144x3072 + mp3 thuyết minh)
# Đích : public/panoramas/hat-mon/*.jpg  +  public/audio/*.mp3
#
# Chạy: powershell -ExecutionPolicy Bypass -File scripts\prepare-media.ps1

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root       = Split-Path -Parent $PSScriptRoot
$srcDir     = Join-Path $root 'audio và ảnh hai bà trưng'
$srcImgDir  = Join-Path $srcDir 'ảnh thực tế hai ba trung'
$srcAudioDir= Join-Path $srcDir 'quán tiên'

$outPanoDir = Join-Path $root 'public\panoramas\hat-mon'
$outAudioDir= Join-Path $root 'public\audio'
New-Item -ItemType Directory -Force -Path $outPanoDir, $outAudioDir | Out-Null

# Slug ASCII (an toàn cho URL) -> tên file nguồn.
# Thứ tự dưới đây = thứ tự tuyến tham quan: từ nghi môn ngoại đi dần vào nội tự.
$map = @(
  @{ Slug = '01-tu-tru';                          Img = 'tứ trụ chuẩn.jpg';                  Audio = 'tứ trụ.mp3' }
  @{ Slug = '02-nghi-mon';                        Img = 'nghi môn chuẩn.jpg';                Audio = 'Nghi môn.mp3' }
  @{ Slug = '03-dan-the';                         Img = 'đàn thề chuẩn.jpg';                 Audio = 'đàn thề.mp3' }
  @{ Slug = '04-quan-tien';                       Img = 'quán tiên chuẩn.jpg';               Audio = 'quán tiên.mp3' }
  @{ Slug = '05-phuong-dinh';                     Img = 'phuong dinh chuẩn.jpg';             Audio = 'phương đình.mp3' }
  @{ Slug = '06-nha-khach';                       Img = 'nhà khách chuẩn .jpg';              Audio = 'nhà khách.mp3' }
  @{ Slug = '07-ta-huu-mac';                      Img = '2 tòa tả hữu mạc chuẩn.jpg';        Audio = 'hai tòa tả hữu mạc.mp3' }
  @{ Slug = '08-den-chinh';                       Img = 'đền chính chuẩn.jpg';               Audio = 'khu đền chính.mp3' }
  @{ Slug = '09-nha-tam-ngu';                     Img = 'nhà tạm ngự chuẩn.jpg';             Audio = 'nhà tạm ngự.mp3' }
  @{ Slug = '10-go-giau-an';                      Img = 'gò đấu ấn chuẩn.jpg';               Audio = 'gò dấu ấn.mp3' }
  @{ Slug = '11-nha-tuong-niem-nguyen-thi-dinh';  Img = 'đền thờ nguyen thi định chuẩn.jpg'; Audio = 'đền thờ nguyễn thị định.mp3' }
)

# Dọn đầu ra cũ để không còn file mồ côi khi đổi slug.
Get-ChildItem -Path $outPanoDir -Filter *.jpg -File -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path $outAudioDir -Filter *.mp3 -File -ErrorAction SilentlyContinue | Remove-Item -Force

# --- Bộ mã hóa JPEG ---------------------------------------------------------
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' }

function Save-Jpeg {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path,
    [int]$Quality
  )
  $enc = New-Object System.Drawing.Imaging.EncoderParameters 1
  $enc.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [int64]$Quality)
  $Bitmap.Save($Path, $jpegCodec, $enc)
  $enc.Dispose()
}

function Resize-Panorama {
  param([string]$Source, [string]$Target, [int]$Width, [int]$Height, [int]$Quality)
  $img = [System.Drawing.Image]::FromFile($Source)
  try {
    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.CompositingQuality= [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $g.DrawImage($img, 0, 0, $Width, $Height)
    } finally { $g.Dispose() }
    Save-Jpeg -Bitmap $bmp -Path $Target -Quality $Quality
    $bmp.Dispose()
  } finally { $img.Dispose() }
}

$report = @()
foreach ($item in $map) {
  $slug = $item.Slug

  # --- panorama (hiển thị trong viewer) ---
  $srcImg  = Join-Path $srcImgDir $item.Img
  $outPano = Join-Path $outPanoDir "$slug.jpg"
  if (-not (Test-Path -LiteralPath $srcImg)) { throw "Thiếu ảnh nguồn: $srcImg" }
  Resize-Panorama -Source $srcImg -Target $outPano -Width 4096 -Height 2048 -Quality 84

  # --- thumbnail (danh sách địa điểm) ---
  $outThumb = Join-Path $outPanoDir "$slug-thumb.jpg"
  Resize-Panorama -Source $srcImg -Target $outThumb -Width 480 -Height 240 -Quality 80

  # --- audio thuyết minh ---
  $outAudio = $null
  if ($item.Audio) {
    $srcAudio = Join-Path $srcAudioDir $item.Audio
    if (-not (Test-Path -LiteralPath $srcAudio)) { throw "Thiếu audio nguồn: $srcAudio" }
    $outAudio = Join-Path $outAudioDir "$slug.mp3"
    Copy-Item -LiteralPath $srcAudio -Destination $outAudio -Force
  }

  $report += [PSCustomObject]@{
    Scene     = $slug
    PanoMB    = [math]::Round((Get-Item $outPano).Length / 1MB, 2)
    ThumbKB   = [math]::Round((Get-Item $outThumb).Length / 1KB, 0)
    AudioKB   = if ($outAudio) { [math]::Round((Get-Item $outAudio).Length / 1KB, 0) } else { $null }
  }
}

$report | Format-Table -AutoSize
$totalMb = [math]::Round((Get-ChildItem $outPanoDir -File | Measure-Object Length -Sum).Sum / 1MB, 1)
Write-Host "Tổng dung lượng panorama+thumb: $totalMb MB"
