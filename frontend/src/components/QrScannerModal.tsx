import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, AlertCircle } from 'lucide-react'

interface QrScannerModalProps {
  open: boolean
  onClose: () => void
  onScan: (decodedText: string) => void
  title?: string
}

export default function QrScannerModal({ open, onClose, onScan, title }: QrScannerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<any>(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(true)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setError(''); setStarting(true)

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled || !containerRef.current) return
      const elId = 'qr-scanner-region'
      const scanner = new Html5Qrcode(elId)
      scannerRef.current = scanner

      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText: string) => {
          onScan(decodedText)
          scanner.stop().catch(() => {})
        },
        () => { /* per-frame decode failures — expected constantly, ignore */ }
      ).then(() => {
        if (!cancelled) setStarting(false)
      }).catch((err: any) => {
        if (!cancelled) {
          setStarting(false)
          setError(err?.message?.includes('Permission') || err?.name === 'NotAllowedError'
            ? 'Camera permission denied. Allow camera access in your browser settings and try again.'
            : 'Could not start camera. Make sure this page is loaded over HTTPS and no other app is using the camera.')
        }
      })
    })

    return () => {
      cancelled = true
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current.clear().catch(() => {})
      }
    }
  }, [open])

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
                <Camera size={16} className="text-primary" /> {title || 'Scan QR Code'}
              </p>
              <button onClick={onClose} className="text-secondary/40 hover:text-secondary">
                <X size={18} />
              </button>
            </div>

            {error ? (
              <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border-l-4 border-red-500 text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p className="font-body text-xs">{error}</p>
              </div>
            ) : (
              <>
                {starting && <p className="font-body text-xs text-secondary/50 mb-2 text-center">Starting camera…</p>}
                <div id="qr-scanner-region" ref={containerRef} className="w-full overflow-hidden bg-secondary/5" />
                <p className="font-body text-xs text-secondary/40 mt-3 text-center">
                  Point your camera at the QR code — it'll scan automatically.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}