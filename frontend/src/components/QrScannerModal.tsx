import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, AlertCircle, Keyboard } from 'lucide-react'

interface QrScannerModalProps {
  open: boolean
  onClose: () => void
  onScan: (decodedText: string) => void
  title?: string
}

const REGION_ID = 'qr-scanner-region'

export default function QrScannerModal({ open, onClose, onScan, title }: QrScannerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<any>(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(true)
  const [manualMode, setManualMode] = useState(false)
  const [manualText, setManualText] = useState('')

  useEffect(() => {
    if (!open || manualMode) return
    let cancelled = false
    setError(''); setStarting(true)

    // Small delay lets the modal's entrance animation finish so the
    // scanner region has settled to its real, measurable size before
    // html5-qrcode reads its dimensions — starting too early against a
    // still-animating container is a common cause of a blank/broken scanner.
    const timer = setTimeout(async () => {
      if (cancelled) return
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled || !containerRef.current) return

        const scanner = new Html5Qrcode(REGION_ID)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText: string) => {
            onScan(decodedText)
            scanner.stop().catch(() => {})
          },
          () => { /* per-frame decode misses — expected constantly, ignore */ }
        )
        if (!cancelled) setStarting(false)
      } catch (err: any) {
        if (cancelled) return
        setStarting(false)
        const msg = String(err?.message || err || '')
        setError(
          msg.includes('Permission') || err?.name === 'NotAllowedError'
            ? 'Camera permission denied. Allow camera access in your browser settings and try again — or paste the QR content manually below.'
            : 'Could not start the camera on this device/browser. You can paste the scanned content manually below instead.'
        )
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [open, manualMode])

  useEffect(() => {
    if (!open) { setManualMode(false); setManualText('') }
  }, [open])

  const submitManual = () => {
    if (manualText.trim()) onScan(manualText.trim())
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white w-full max-w-sm p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-heading text-sm uppercase flex items-center gap-2">
                {manualMode ? <Keyboard size={16} className="text-primary" /> : <Camera size={16} className="text-primary" />}
                {manualMode ? 'Paste QR Content' : (title || 'Scan QR Code')}
              </p>
              <button onClick={onClose} className="text-secondary/40 hover:text-secondary">
                <X size={18} />
              </button>
            </div>

            {manualMode ? (
              <div className="space-y-3">
                <textarea
                  className="form-input w-full h-24 font-mono text-xs"
                  placeholder="Paste the URL from the QR code here…"
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                />
                <button onClick={submitManual} disabled={!manualText.trim()} className="btn-primary w-full py-3 disabled:opacity-40">
                  Use This
                </button>
                <button onClick={() => setManualMode(false)} className="w-full text-center font-body text-xs text-secondary/50 underline">
                  Try camera instead
                </button>
              </div>
            ) : error ? (
              <>
                <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border-l-4 border-red-500 text-red-700 mb-3">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p className="font-body text-xs">{error}</p>
                </div>
                <button onClick={() => setManualMode(true)} className="btn-outline w-full py-3 flex items-center justify-center gap-2 text-xs">
                  <Keyboard size={14} /> Enter manually instead
                </button>
              </>
            ) : (
              <>
                {starting && <p className="font-body text-xs text-secondary/50 mb-2 text-center">Starting camera…</p>}
                <div
                  id={REGION_ID}
                  ref={containerRef}
                  style={{ width: '100%', minHeight: 280 }}
                  className="overflow-hidden bg-secondary/5"
                />
                <p className="font-body text-xs text-secondary/40 mt-3 text-center">
                  Point your camera at the QR code — it'll scan automatically.
                </p>
                <button onClick={() => setManualMode(true)} className="w-full text-center font-body text-xs text-secondary/40 underline mt-2">
                  Camera not working? Enter manually
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}