interface MarqueeProps {
  text: string
  reverse?: boolean
}

export default function Marquee({ text, reverse = false }: MarqueeProps) {
  const items = Array(10).fill(text)
  return (
    <div className="marquee-track">
      <div className={`marquee-inner ${reverse ? 'reverse' : ''}`}>
        {[...items, ...items].map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  )
}
