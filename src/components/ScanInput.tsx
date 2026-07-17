import { useState, useRef, useEffect } from 'react'

interface Props {
  onScan: (barcode: string) => void
  placeholder?: string
}

export default function ScanInput({ onScan, placeholder = '扫描或输入条码...' }: Props) {
  const [manual, setManual] = useState('')
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  const startCamera = async () => {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setScanning(true)
    } catch (err: any) {
      setCameraError('无法打开摄像头：' + (err.message || '权限被拒绝'))
    }
  }

  useEffect(() => { return () => stopCamera() }, [])

  const handleManualSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && manual.trim()) {
      onScan(manual.trim())
      setManual('')
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
          <span className="search-icon">📷</span>
          <input className="search-input" placeholder={placeholder} value={manual}
            onChange={e => setManual(e.target.value)} onKeyDown={handleManualSubmit} />
        </div>
        <button className={`btn btn-sm ${scanning ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => scanning ? stopCamera() : startCamera()}>
          {scanning ? '关闭摄像头' : '📷 扫码'}
        </button>
      </div>
      {cameraError && (
        <div className="alert-item warning" style={{ marginTop: 8 }}><span>{cameraError}</span></div>
      )}
      {scanning && (
        <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', background: '#000', maxWidth: 400 }}>
          <video ref={videoRef} style={{ width: '100%', display: 'block' }} autoPlay playsInline muted />
          <p style={{ padding: '8px 12px', fontSize: 12, color: '#888', textAlign: 'center' }}>
            将条码对准摄像头，或在上方输入框手动输入后按回车
          </p>
        </div>
      )}
    </div>
  )
}
