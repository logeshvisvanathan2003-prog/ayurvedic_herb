import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { RotateCcw } from 'lucide-react'

export interface JourneyPoint {
  lat: number
  lng: number
  label: string
  sublabel?: string
  kind: 'farm' | 'waypoint' | 'current' | 'delivered'
}

function dotIcon(kind: JourneyPoint['kind']) {
  const colors: Record<JourneyPoint['kind'], string> = {
    farm: '#4a7c59',
    waypoint: '#8a8060',
    current: '#c8a13a',
    delivered: '#4a7c59',
  }
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${colors[kind]};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function travelerIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:34px;height:34px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:#4a7c59;opacity:0.25;animation:travelerPulse 1.2s ease-out infinite;"></div>
        <div style="position:relative;width:34px;height:34px;border-radius:50%;background:#4a7c59;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:16px;">🌿</div>
      </div>
      <style>
        @keyframes travelerPulse {
          0% { transform: scale(1); opacity: 0.25; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      </style>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

// Linear interpolation between two points — fine for city/state-scale distances.
function lerp(a: L.LatLngExpression, b: L.LatLngExpression, t: number): [number, number] {
  const aa = L.latLng(a), bb = L.latLng(b)
  return [aa.lat + (bb.lat - aa.lat) * t, aa.lng + (bb.lng - aa.lng) * t]
}

const MS_PER_SEGMENT = 1400 // time to travel each leg of the journey

export default function JourneyMap({ points }: { points: JourneyPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const travelerRef = useRef<L.Marker | null>(null)
  const rafRef = useRef<number | null>(null)
  const [playKey, setPlayKey] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    })
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    const latlngs: L.LatLngExpression[] = points.map(p => [p.lat, p.lng])

    // Static waypoint markers (dim, always visible for reference/popups)
    points.forEach((p) => {
      L.marker([p.lat, p.lng], { icon: dotIcon(p.kind) })
        .addTo(map)
        .bindPopup(`<strong>${p.label}</strong>${p.sublabel ? `<br/><span style="color:#666">${p.sublabel}</span>` : ''}`)
    })

    // Full route line, faint
    if (latlngs.length > 1) {
      L.polyline(latlngs, { color: '#4a7c59', weight: 3, opacity: 0.35, dashArray: '6 6' }).addTo(map)
    }

    if (latlngs.length === 1) {
      map.setView(latlngs[0], 13)
    } else {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] })
    }

    // Traveling marker — animates from the first point to the last
    let traveler: L.Marker | null = null
    if (latlngs.length > 1) {
      traveler = L.marker(latlngs[0], { icon: travelerIcon(), zIndexOffset: 1000 }).addTo(map)
      travelerRef.current = traveler
    }

    let startTime: number | null = null
    const totalSegments = latlngs.length - 1

    function step(timestamp: number) {
      if (!traveler || totalSegments <= 0) return
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const totalDuration = totalSegments * MS_PER_SEGMENT
      const clamped = Math.min(elapsed, totalDuration)

      const segFloat = clamped / MS_PER_SEGMENT
      const segIndex = Math.min(Math.floor(segFloat), totalSegments - 1)
      const segT = segFloat - segIndex

      const pos = lerp(latlngs[segIndex], latlngs[segIndex + 1], segT)
      traveler.setLatLng(pos)

      if (elapsed < totalDuration) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        traveler.setLatLng(latlngs[latlngs.length - 1])
        setPlaying(false)
      }
    }

    if (latlngs.length > 1) {
      setPlaying(true)
      rafRef.current = requestAnimationFrame(step)
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      map.remove()
      mapRef.current = null
      travelerRef.current = null
    }
  }, [points, playKey])

  if (points.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-secondary/5 text-secondary/40 font-body text-sm">
        No GPS waypoints recorded yet for this journey.
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="h-72 w-full" />
      {points.length > 1 && (
        <button
          onClick={() => setPlayKey(k => k + 1)}
          disabled={playing}
          className="absolute top-3 right-3 z-[1100] flex items-center gap-1.5 bg-white border border-secondary/15 px-3 py-1.5 font-heading text-[0.6rem] uppercase tracking-widest shadow-md hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
        >
          <RotateCcw size={11} /> {playing ? 'Traveling…' : 'Replay Journey'}
        </button>
      )}
    </div>
  )
}