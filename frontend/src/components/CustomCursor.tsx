import { useEffect, useRef, useState } from 'react'

const INPUT_SELECTORS = 'input, textarea, select'

export default function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [hovered,  setHovered]  = useState(false)
  const [onInput,  setOnInput]  = useState(false)
  const ringPos = useRef({ x: 0, y: 0 })
  const rafRef  = useRef<number>(0)

  useEffect(() => {
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const onMove = (e: MouseEvent) => {
      dot.style.left  = e.clientX + 'px'
      dot.style.top   = e.clientY + 'px'
      ringPos.current = { x: e.clientX, y: e.clientY }

      // Hide custom cursor when over form inputs
      const target = e.target as HTMLElement
      const isInput = target.matches(INPUT_SELECTORS)
      setOnInput(isInput)
    }

    const animateRing = () => {
      if (ring) {
        const rx = parseFloat(ring.style.left || '0')
        const ry = parseFloat(ring.style.top  || '0')
        ring.style.left = (rx + (ringPos.current.x - rx) * 0.14) + 'px'
        ring.style.top  = (ry + (ringPos.current.y - ry) * 0.14) + 'px'
      }
      rafRef.current = requestAnimationFrame(animateRing)
    }

    const onEnter = (e: Event) => {
      const el = e.currentTarget as HTMLElement
      if (!el.matches(INPUT_SELECTORS)) setHovered(true)
    }
    const onLeave = () => setHovered(false)

    const attachListeners = () => {
      const interactables = document.querySelectorAll('a, button, [data-cursor]')
      interactables.forEach((el) => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
      return interactables
    }

    // Attach on mount and re-attach on DOM changes
    let interactables = attachListeners()
    const observer = new MutationObserver(() => {
      interactables.forEach(el => {
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mouseleave', onLeave)
      })
      interactables = attachListeners()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    window.addEventListener('mousemove', onMove)
    rafRef.current = requestAnimationFrame(animateRing)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
      observer.disconnect()
      interactables.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mouseleave', onLeave)
      })
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        className="cursor-dot"
        style={{ visibility: onInput ? 'hidden' : 'visible' }}
      />
      <div
        ref={ringRef}
        className={`cursor-ring ${hovered ? 'hovered' : ''}`}
        style={{ visibility: onInput ? 'hidden' : 'visible' }}
      />
    </>
  )
}
