import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Viewer } from '@photo-sphere-viewer/core'
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin'
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Expand,
  Headphones,
  Info,
  Menu,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Share2,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { getSceneFromUrl, sceneGroups, sceneIndexById, scenes } from './tour-data'

type NarrationState = 'idle' | 'playing' | 'paused' | 'ended'

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function App() {
  const viewerElement = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const tourRef = useRef<VirtualTourPlugin | null>(null)
  const autorotateRef = useRef<AutorotatePlugin | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [currentId, setCurrentId] = useState(getSceneFromUrl)
  const [menuOpen, setMenuOpen] = useState(() => window.innerWidth > 980)
  const [infoOpen, setInfoOpen] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [ready, setReady] = useState(false)

  // --- Thuyết minh ---------------------------------------------------------
  const [narration, setNarration] = useState<NarrationState>('idle')
  const [blocked, setBlocked] = useState(false)
  const [muted, setMuted] = useState(false)
  const [autoNarrate, setAutoNarrate] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const currentIndex = Math.max(sceneIndexById(currentId), 0)
  const currentScene = scenes[currentIndex]
  const currentAudio = currentScene.audio

  // Giá trị mới nhất cho các listener gắn một lần.
  const currentIdRef = useRef(currentId)
  const autoAdvanceRef = useRef(autoAdvance)
  currentIdRef.current = currentId
  autoAdvanceRef.current = autoAdvance

  // --- Khởi tạo viewer -----------------------------------------------------
  useEffect(() => {
    if (!viewerElement.current) return

    const viewer = new Viewer({
      container: viewerElement.current,
      navbar: false,
      defaultZoomLvl: 15,
      minFov: 30,
      maxFov: 100,
      mousewheelCtrlKey: false,
      touchmoveTwoFingers: false,
      plugins: [
        AutorotatePlugin.withConfig({
          autostartDelay: 60_000,
          autostartOnIdle: false,
          autorotateSpeed: '0.65rpm',
          autorotatePitch: '0deg',
        }),
        VirtualTourPlugin.withConfig({
          positionMode: 'manual',
          // Điểm nóng dạng DOM: bấm được bằng chuột, cảm ứng và trình đọc màn hình.
          renderMode: '2d',
          startNodeId: getSceneFromUrl(),
          preload: true,
          transitionOptions: {
            effect: 'fade',
            rotation: true,
            speed: '18rpm',
          },
          nodes: scenes.map((scene, index) => ({
            id: scene.id,
            name: scene.name,
            caption: scene.name,
            description: scene.tagline,
            panorama: scene.panorama,
            thumbnail: scene.thumbnail,
            defaultYaw: '0deg',
            defaultPitch: '0deg',
            links: [
              {
                nodeId: scenes[(index + 1) % scenes.length].id,
                position: { yaw: `${scene.linkYaw}deg`, pitch: `${scene.linkPitch ?? -4}deg` },
              },
            ],
          })),
        }),
      ],
    })

    const tour = viewer.getPlugin(VirtualTourPlugin) as VirtualTourPlugin
    const autorotate = viewer.getPlugin(AutorotatePlugin) as AutorotatePlugin
    viewerRef.current = viewer
    tourRef.current = tour
    autorotateRef.current = autorotate

    const markReady = () => setReady(true)
    viewer.addEventListener('ready', markReady, { once: true })
    // Với cache ấm, panorama đầu tiên có thể xong ngay trong lúc khởi tạo.
    if (viewer.state.ready) markReady()

    tour.addEventListener('node-changed', ({ node }) => {
      setCurrentId(node.id)
      const url = new URL(window.location.href)
      url.searchParams.set('scene', node.id)
      window.history.pushState({ scene: node.id }, '', url)
    })

    const onPopState = () => {
      void tour.setCurrentNode(getSceneFromUrl())
    }
    window.addEventListener('popstate', onPopState)

    return () => {
      window.removeEventListener('popstate', onPopState)
      viewer.destroy()
      viewerRef.current = null
      tourRef.current = null
      autorotateRef.current = null
    }
  }, [])

  // --- Đồng bộ trạng thái audio -------------------------------------------
  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const syncTime = () => setTime(el.currentTime)
    const syncDuration = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0)
    const onPlay = () => {
      setNarration('playing')
      setBlocked(false)
    }
    const onPause = () => setNarration((state) => (state === 'playing' ? 'paused' : state))
    const onEnded = () => {
      setNarration('ended')
      setTime(0)
      if (!autoAdvanceRef.current) return
      const next = scenes[(sceneIndexById(currentIdRef.current) + 1) % scenes.length]
      window.setTimeout(() => void tourRef.current?.setCurrentNode(next.id), 700)
    }
    const onError = () => setNarration('idle')

    el.addEventListener('timeupdate', syncTime)
    el.addEventListener('loadedmetadata', syncDuration)
    el.addEventListener('durationchange', syncDuration)
    el.addEventListener('play', onPlay)
    el.addEventListener('playing', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)
    el.addEventListener('error', onError)

    return () => {
      el.removeEventListener('timeupdate', syncTime)
      el.removeEventListener('loadedmetadata', syncDuration)
      el.removeEventListener('durationchange', syncDuration)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('playing', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('error', onError)
    }
  }, [])

  // Đổi hạng mục -> nạp bản thu tương ứng và tự phát nếu đang bật.
  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    el.pause()
    setTime(0)
    setDuration(0)

    if (!currentAudio) {
      el.removeAttribute('src')
      el.load()
      setNarration('idle')
      return
    }

    if (el.getAttribute('src') !== currentAudio) {
      el.setAttribute('src', currentAudio)
      el.load()
    }
    setNarration('paused')

    if (!autoNarrate) return
    el.play().catch(() => setBlocked(true))
  }, [currentAudio, autoNarrate])

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
  }, [muted])

  useEffect(() => {
    const autorotate = autorotateRef.current
    if (!autorotate) return
    if (autoRotate) autorotate.start()
    else autorotate.stop()
  }, [autoRotate])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  // --- Điều khiển thuyết minh ---------------------------------------------
  const togglePlay = useCallback(() => {
    const el = audioRef.current
    if (!el || !currentScene.audio) return
    if (el.paused) el.play().catch(() => setBlocked(true))
    else el.pause()
  }, [currentScene.audio])

  const restart = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    el.currentTime = 0
    el.play().catch(() => setBlocked(true))
  }, [])

  const skipForward = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    el.currentTime = Math.min(el.currentTime + 15, el.duration || el.currentTime + 15)
  }, [])

  const seek = useCallback((value: number) => {
    const el = audioRef.current
    if (!el) return
    el.currentTime = value
    setTime(value)
  }, [])

  const goToScene = useCallback((id: string) => {
    if (id === currentIdRef.current) return
    void tourRef.current?.setCurrentNode(id)
  }, [])

  const stepScene = useCallback((direction: -1 | 1) => {
    const index = Math.max(sceneIndexById(currentIdRef.current), 0)
    goToScene(scenes[(index + direction + scenes.length) % scenes.length].id)
  }, [goToScene])

  // Phím tắt: ← → đổi hạng mục, Space phát/dừng, Esc đóng bảng.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        stepScene(1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        stepScene(-1)
      } else if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault()
        togglePlay()
      } else if (event.key === 'Escape') {
        setInfoOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stepScene, togglePlay])

  // Lần chạm đầu tiên gỡ chặn autoplay của trình duyệt.
  useEffect(() => {
    if (!blocked) return
    const retry = () => {
      const el = audioRef.current
      if (!el || !currentAudio) return
      el.play().then(() => setBlocked(false)).catch(() => undefined)
    }
    window.addEventListener('pointerdown', retry, { once: true })
    return () => window.removeEventListener('pointerdown', retry)
  }, [blocked, currentAudio])

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: 'Đền Hát Môn 360', text: currentScene.name, url })
      else {
        await navigator.clipboard.writeText(url)
        setToast('Đã sao chép liên kết')
      }
    } catch {
      setToast('Không chia sẻ được liên kết')
    }
  }

  const sceneNumber = useMemo(() => String(currentIndex + 1).padStart(2, '0'), [currentIndex])
  const narratedCount = useMemo(() => scenes.filter((scene) => scene.audio).length, [])
  const progress = duration > 0 ? (time / duration) * 100 : 0

  return (
    <main className="tour-shell">
      <div ref={viewerElement} className="viewer" aria-label="Không gian 360" />
      <audio ref={audioRef} preload="auto" />

      <div className={`loading-screen ${ready ? 'is-hidden' : ''}`}>
        <div className="loading-mark">HÁT MÔN</div>
        <div className="loading-line"><span /></div>
        <p>Đang dựng không gian 360</p>
      </div>

      <header className="topbar">
        <button
          className="icon-button menu-toggle"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={19} /> : <Menu size={21} />}
          <span className="sr-only">Đóng/mở danh sách hạng mục</span>
        </button>
        <a className="brand" href="/?scene=tu-tru" aria-label="Đền Hát Môn 360">
          <span className="brand-glyph">H</span>
          <span className="brand-copy">
            <strong>HÁT MÔN</strong>
            <small>DI SẢN 360 · THUYẾT MINH TỰ ĐỘNG</small>
          </span>
        </a>
        <div className="scene-count">
          <strong>{sceneNumber}</strong>
          <span>/ {String(scenes.length).padStart(2, '0')}</span>
        </div>
        <div className="topbar-progress" aria-hidden="true">
          <span style={{ width: `${((currentIndex + 1) / scenes.length) * 100}%` }} />
        </div>
      </header>

      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="sidebar-heading">
          <span>KHÔNG GIAN DI SẢN</span>
          <strong>Khám phá Đền Hát Môn</strong>
          <p>{scenes.length} hạng mục · {narratedCount} bản thuyết minh</p>
        </div>
        <nav className="scene-list" aria-label="Danh sách hạng mục">
          {sceneGroups.map((group) => (
            <div className="scene-group" key={group.name}>
              <p className="scene-group-title">{group.name}</p>
              {group.scenes.map((scene) => {
                const index = sceneIndexById(scene.id)
                const isActive = scene.id === currentId
                return (
                  <button
                    key={scene.id}
                    data-scene={scene.id}
                    className={`scene-card ${isActive ? 'is-active' : ''}`}
                    onClick={() => goToScene(scene.id)}
                    aria-current={isActive}
                  >
                    <span className="scene-card-media">
                      <img src={scene.thumbnail} alt="" loading="lazy" />
                      {isActive && (
                        <span className="scene-card-wave" aria-hidden="true">
                          <i /><i /><i />
                        </span>
                      )}
                    </span>
                    <span className="scene-card-copy">
                      <small>
                        {String(index + 1).padStart(2, '0')} · {scene.eyebrow}
                      </small>
                      <strong>{scene.name}</strong>
                      <em>{scene.tagline}</em>
                    </span>
                    <span className={`scene-card-audio ${scene.audio ? 'has-audio' : ''}`}>
                      {scene.audio ? <Headphones size={15} /> : <span className="sr-only">Chưa có thuyết minh</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="demo-note">
          <Info size={16} />
          <p>
            Ảnh panorama 360° chụp tại di tích. Nội dung thuyết minh và mô tả kiến trúc theo hồ sơ
            xếp hạng di tích quốc gia đặc biệt Đền Hát Môn.
          </p>
        </div>
      </aside>

      <div className="interaction-hint">
        <MousePointer2 size={16} />
        <span>Kéo để quan sát · Cuộn để thu phóng · ← → chuyển hạng mục</span>
      </div>

      <div className="hud">
        <section className="scene-copy">
          <p className="scene-eyebrow">{currentScene.eyebrow}</p>
          <h1>{currentScene.name}</h1>
          <p className="scene-tagline">{currentScene.tagline}</p>
          <div className="scene-actions">
            <button onClick={() => setInfoOpen(true)}>
              <Info size={15} /> Thông tin hạng mục
            </button>
            {currentScene.audio ? (
              <button className="is-accent" onClick={togglePlay}>
                <Headphones size={15} /> {narration === 'playing' ? 'Tạm dừng thuyết minh' : 'Nghe thuyết minh'}
              </button>
            ) : (
              <span className="scene-actions-note">Hạng mục này chưa có bản thu thuyết minh</span>
            )}
          </div>
        </section>

        <div className="hud-row">
          <div className={`narration-dock ${blocked ? 'is-blocked' : ''}`}>
            <button
              className="dock-play"
              onClick={togglePlay}
              disabled={!currentScene.audio}
              title={narration === 'playing' ? 'Tạm dừng' : 'Phát thuyết minh'}
            >
              {narration === 'playing' ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <div className="dock-body">
              <div className="dock-meta">
                <span className="dock-label">
                  <Headphones size={13} />
                  Thuyết minh · {sceneNumber}
                </span>
                <strong>{currentScene.name}</strong>
              </div>

              {currentScene.audio ? (
                <div className="dock-track">
                  <span className="dock-time">{formatTime(time)}</span>
                  <div className="dock-bar">
                    <span className="dock-bar-fill" style={{ width: `${progress}%` }} />
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      step={0.1}
                      value={Math.min(time, duration || 0)}
                      onChange={(event) => seek(Number(event.target.value))}
                      disabled={duration === 0}
                      aria-label="Tua bản thuyết minh"
                    />
                  </div>
                  <span className="dock-time">{formatTime(duration)}</span>
                </div>
              ) : (
                <p className="dock-empty">Chưa có bản thu thuyết minh cho hạng mục này.</p>
              )}

              <div className="dock-toggles">
                <button
                  className={autoNarrate ? 'is-active' : ''}
                  onClick={() => setAutoNarrate((value) => !value)}
                  title="Tự động phát thuyết minh khi chuyển hạng mục"
                >
                  <Check size={13} /> Tự phát
                </button>
                <button
                  className={autoAdvance ? 'is-active' : ''}
                  onClick={() => setAutoAdvance((value) => !value)}
                  title="Tự chuyển sang hạng mục kế tiếp khi hết thuyết minh"
                >
                  <Check size={13} /> Tự chuyển cảnh
                </button>
                {blocked && <span className="dock-warning">Bấm để bật âm thanh</span>}
              </div>
            </div>

            <div className="dock-tools">
              <button onClick={restart} disabled={!currentScene.audio} title="Nghe lại từ đầu">
                <RotateCcw size={17} />
              </button>
              <button onClick={skipForward} disabled={!currentScene.audio} title="Tới 15 giây">
                <SkipForward size={17} />
              </button>
              <button onClick={() => setMuted((value) => !value)} title={muted ? 'Bật tiếng' : 'Tắt tiếng'}>
                {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
            </div>
          </div>

        <div className="bottom-controls">
          <button onClick={() => stepScene(-1)} title="Hạng mục trước"><ArrowLeft size={20} /></button>
          <button onClick={() => stepScene(1)} title="Hạng mục tiếp"><ArrowRight size={20} /></button>
          <i />
          <button
            className={autoRotate ? 'is-active' : ''}
            onClick={() => setAutoRotate((value) => !value)}
            title="Tự động xoay"
          >
            {autoRotate ? <Pause size={19} /> : <Play size={19} />}
          </button>
          <button
            onClick={() => viewerRef.current?.animate({ yaw: 0, pitch: 0, zoom: 15, speed: '24rpm' })}
            title="Đặt lại góc nhìn"
          >
            <RotateCcw size={19} />
          </button>
          <button onClick={() => viewerRef.current?.enterFullscreen()} title="Toàn màn hình"><Expand size={19} /></button>
          <button onClick={() => void share()} title="Chia sẻ"><Share2 size={19} /></button>
        </div>
        </div>
      </div>

      <div className={`info-panel ${infoOpen ? 'is-open' : ''}`} aria-hidden={!infoOpen}>
        <button className="info-close" onClick={() => setInfoOpen(false)} title="Đóng">
          <X size={20} />
        </button>
        <small>{currentScene.eyebrow}</small>
        <h2>{currentScene.name}</h2>
        <p className="info-lead">{currentScene.tagline}</p>
        <p>{currentScene.description}</p>
        <h3>Chi tiết kiến trúc</h3>
        <ul className="info-list">
          {currentScene.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="info-stat"><span>Nhóm hạng mục</span><strong>{currentScene.group}</strong></div>
        <div className="info-stat">
          <span>Thuyết minh</span>
          <strong>{currentScene.audio ? (duration > 0 ? formatTime(duration) : 'Có bản thu') : 'Chưa có bản thu'}</strong>
        </div>
        <div className="info-stat"><span>Vị trí</span><strong>{sceneNumber} / {String(scenes.length).padStart(2, '0')}</strong></div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}

export default App
