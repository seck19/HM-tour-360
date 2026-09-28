import { createRoot } from 'react-dom/client'
import App from './App'
// Thư viện trước, giao diện của tour sau để phần ghi đè luôn thắng.
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/virtual-tour-plugin/index.css'
import './styles.css'

// The panorama viewer owns an imperative WebGL lifecycle; mounting it once avoids
// React development StrictMode's intentional destroy/recreate race.
createRoot(document.getElementById('root')!).render(<App />)
