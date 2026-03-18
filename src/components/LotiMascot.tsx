/**
 * Loti — axolotl mascot for the Loti diabetes food scanner app.
 * 7 expression variants, all inline SVG, flat fills only.
 */

type LotiExpression =
  | 'neutral'
  | 'happy'
  | 'thoughtful'
  | 'concerned'
  | 'scanning'
  | 'error'
  | 'welcome'

type LotiSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'

interface LotiMascotProps {
  expression: LotiExpression
  size: LotiSize
  animated?: boolean
  className?: string
  ariaLabel?: string
}

const SIZES: Record<LotiSize, number> = {
  xs: 24,
  sm: 40,
  md: 64,
  lg: 120,
  xl: 200,
  hero: 300,
}

const C = {
  body: '#E8617A',
  dark: '#C4475C',
  eyes: '#1A1A1A',
  highlight: '#FFFFFF',
  mouth: '#C4475C',
} as const

// ─── Shared body parts ───────────────────────────────────────

/** Base body — rounded bean shape, head merged */
function Body() {
  return (
    <ellipse cx="100" cy="110" rx="48" ry="55" fill={C.body} />
  )
}

/** Head — slightly larger, overlaps body top */
function Head() {
  return (
    <ellipse cx="100" cy="72" rx="44" ry="38" fill={C.body} />
  )
}

/** Gills — 3 branches each side. angle param rotates the group */
function Gills({ angle = 0 }: { angle?: number }) {
  return (
    <g>
      {/* Left gills */}
      <g transform={`rotate(${angle}, 56, 60)`}>
        <line x1="56" y1="55" x2="30" y2="35" stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
        <line x1="56" y1="62" x2="25" y2="52" stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
        <line x1="56" y1="70" x2="28" y2="68" stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
        {/* Gill tips */}
        <circle cx="30" cy="35" r="3" fill={C.dark} />
        <circle cx="25" cy="52" r="3" fill={C.dark} />
        <circle cx="28" cy="68" r="3" fill={C.dark} />
      </g>
      {/* Right gills */}
      <g transform={`rotate(${-angle}, 144, 60)`}>
        <line x1="144" y1="55" x2="170" y2="35" stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
        <line x1="144" y1="62" x2="175" y2="52" stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
        <line x1="144" y1="70" x2="172" y2="68" stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
        <circle cx="170" cy="35" r="3" fill={C.dark} />
        <circle cx="175" cy="52" r="3" fill={C.dark} />
        <circle cx="172" cy="68" r="3" fill={C.dark} />
      </g>
    </g>
  )
}

/** Standard dot eyes with highlight */
function Eyes({ x1 = 84, x2 = 116, y = 68 }: { x1?: number; x2?: number; y?: number }) {
  return (
    <g>
      <circle cx={x1} cy={y} r="5" fill={C.eyes} />
      <circle cx={x1 + 2} cy={y - 2} r="1.5" fill={C.highlight} />
      <circle cx={x2} cy={y} r="5" fill={C.eyes} />
      <circle cx={x2 + 2} cy={y - 2} r="1.5" fill={C.highlight} />
    </g>
  )
}

/** Arms at sides (neutral) */
function ArmsNeutral() {
  return (
    <g>
      <ellipse cx="58" cy="120" rx="10" ry="7" fill={C.body} transform="rotate(-15, 58, 120)" />
      <ellipse cx="142" cy="120" rx="10" ry="7" fill={C.body} transform="rotate(15, 142, 120)" />
    </g>
  )
}

/** Legs — two stubby nubs */
function Legs() {
  return (
    <g>
      <ellipse cx="82" cy="160" rx="12" ry="8" fill={C.body} />
      <ellipse cx="118" cy="160" rx="12" ry="8" fill={C.body} />
    </g>
  )
}

/** Paddle tail */
function Tail() {
  return (
    <path
      d="M140 140 Q160 135 165 150 Q168 160 155 162 Q145 158 140 148Z"
      fill={C.body}
    />
  )
}

// ─── Expression Variants ─────────────────────────────────────

function LotiNeutral() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <Tail />
      <Gills />
      <Body />
      <Head />
      <Legs />
      <ArmsNeutral />
      <Eyes />
      {/* Slight smile */}
      <path d="M90 80 Q100 88 110 80" fill="none" stroke={C.mouth} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function LotiHappy() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <Tail />
      <Gills angle={-8} />
      <Body />
      <Head />
      <Legs />
      {/* Arms raised at 45° */}
      <g>
        <ellipse cx="52" cy="110" rx="10" ry="7" fill={C.body} transform="rotate(-45, 52, 110)" />
        <ellipse cx="148" cy="110" rx="10" ry="7" fill={C.body} transform="rotate(45, 148, 110)" />
      </g>
      {/* Happy squint eyes */}
      <g>
        <path d="M79 66 Q84 62 89 66" fill="none" stroke={C.eyes} strokeWidth="3" strokeLinecap="round" />
        <path d="M111 66 Q116 62 121 66" fill="none" stroke={C.eyes} strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* Wide open smile */}
      <path d="M86 79 Q100 94 114 79" fill={C.dark} stroke={C.mouth} strokeWidth="2" strokeLinecap="round" />
      {/* Excitement sparkles */}
      <line x1="100" y1="28" x2="100" y2="22" stroke={C.dark} strokeWidth="2" strokeLinecap="round" />
      <line x1="90" y1="30" x2="87" y2="24" stroke={C.dark} strokeWidth="2" strokeLinecap="round" />
      <line x1="110" y1="30" x2="113" y2="24" stroke={C.dark} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function LotiThoughtful() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <Tail />
      <Gills />
      <Body />
      <Head />
      <Legs />
      {/* One arm at chin, one at side */}
      <ellipse cx="142" cy="120" rx="10" ry="7" fill={C.body} transform="rotate(15, 142, 120)" />
      <ellipse cx="62" cy="84" rx="10" ry="7" fill={C.body} transform="rotate(-30, 62, 84)" />
      {/* Eyes looking up-right */}
      <g>
        <circle cx="86" cy="66" r="5" fill={C.eyes} />
        <circle cx="89" cy="64" r="1.5" fill={C.highlight} />
        <circle cx="118" cy="66" r="5" fill={C.eyes} />
        <circle cx="121" cy="64" r="1.5" fill={C.highlight} />
      </g>
      {/* Neutral-ish mouth — very subtle curve */}
      <path d="M91 81 Q100 84 109 81" fill="none" stroke={C.mouth} strokeWidth="2.5" strokeLinecap="round" />
      {/* Thought dots */}
      <circle cx="130" cy="42" r="2" fill={C.dark} />
      <circle cx="138" cy="35" r="2.5" fill={C.dark} />
      <circle cx="148" cy="28" r="3" fill={C.dark} />
    </svg>
  )
}

function LotiConcerned() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <Tail />
      <Gills angle={10} />
      <Body />
      <Head />
      <Legs />
      {/* Arms forward, palms up */}
      <g>
        <ellipse cx="55" cy="115" rx="10" ry="7" fill={C.body} transform="rotate(-30, 55, 115)" />
        <ellipse cx="145" cy="115" rx="10" ry="7" fill={C.body} transform="rotate(30, 145, 115)" />
      </g>
      {/* Concerned eyes — subtle brow lines */}
      <Eyes />
      <line x1="78" y1="59" x2="86" y2="61" stroke={C.dark} strokeWidth="2" strokeLinecap="round" />
      <line x1="122" y1="59" x2="114" y2="61" stroke={C.dark} strokeWidth="2" strokeLinecap="round" />
      {/* Very slight downward mouth */}
      <path d="M91 82 Q100 79 109 82" fill="none" stroke={C.mouth} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function LotiScanning({ animated }: { animated: boolean }) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? 'loti-scanning' : ''}
    >
      <Tail />
      <Gills angle={-5} />
      <Body />
      <Head />
      <Legs />
      {/* One arm raised holding something */}
      <ellipse cx="55" cy="105" rx="10" ry="7" fill={C.body} transform="rotate(-50, 55, 105)" />
      <ellipse cx="142" cy="120" rx="10" ry="7" fill={C.body} transform="rotate(15, 142, 120)" />
      {/* Wide interested eyes */}
      <g>
        <circle cx="84" cy="68" r="6" fill={C.eyes} />
        <circle cx="87" cy="65" r="2" fill={C.highlight} />
        <circle cx="116" cy="68" r="6" fill={C.eyes} />
        <circle cx="119" cy="65" r="2" fill={C.highlight} />
      </g>
      {/* Small o mouth */}
      <ellipse cx="100" cy="82" rx="5" ry="4" fill="none" stroke={C.mouth} strokeWidth="2.5" />
    </svg>
  )
}

function LotiError() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <Tail />
      {/* Uneven gills */}
      <g>
        {/* Left gills — drooped */}
        <g transform="rotate(12, 56, 60)">
          <line x1="56" y1="55" x2="30" y2="35" stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
          <line x1="56" y1="62" x2="25" y2="52" stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
          <line x1="56" y1="70" x2="28" y2="68" stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
          <circle cx="30" cy="35" r="3" fill={C.dark} />
          <circle cx="25" cy="52" r="3" fill={C.dark} />
          <circle cx="28" cy="68" r="3" fill={C.dark} />
        </g>
        {/* Right gills — perky */}
        <g transform="rotate(5, 144, 60)">
          <line x1="144" y1="55" x2="170" y2="35" stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
          <line x1="144" y1="62" x2="175" y2="52" stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
          <line x1="144" y1="70" x2="172" y2="68" stroke={C.dark} strokeWidth="4" strokeLinecap="round" />
          <circle cx="170" cy="35" r="3" fill={C.dark} />
          <circle cx="175" cy="52" r="3" fill={C.dark} />
          <circle cx="172" cy="68" r="3" fill={C.dark} />
        </g>
      </g>
      <Body />
      <Head />
      <Legs />
      {/* One arm behind head (sheepish), other at side */}
      <ellipse cx="142" cy="120" rx="10" ry="7" fill={C.body} transform="rotate(15, 142, 120)" />
      <ellipse cx="72" cy="52" rx="10" ry="7" fill={C.body} transform="rotate(-20, 72, 52)" />
      {/* Confused eyes with x marks */}
      <g>
        <circle cx="84" cy="68" r="5" fill={C.eyes} />
        <circle cx="86" cy="66" r="1.5" fill={C.highlight} />
        <circle cx="116" cy="68" r="5" fill={C.eyes} />
        <circle cx="118" cy="66" r="1.5" fill={C.highlight} />
      </g>
      {/* Squiggly mouth */}
      <path d="M87 82 Q92 79 97 82 Q102 85 107 82 Q112 79 113 82" fill="none" stroke={C.mouth} strokeWidth="2.5" strokeLinecap="round" />
      {/* Question mark */}
      <text x="135" y="45" fontSize="18" fontWeight="bold" fill={C.dark} fontFamily="system-ui">?</text>
    </svg>
  )
}

function LotiWelcome() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <Tail />
      <Gills angle={-8} />
      <Body />
      <Head />
      <Legs />
      {/* One arm waving high, other at side */}
      <ellipse cx="142" cy="120" rx="10" ry="7" fill={C.body} transform="rotate(15, 142, 120)" />
      <ellipse cx="48" cy="80" rx="10" ry="7" fill={C.body} transform="rotate(-60, 48, 80)" />
      {/* Happy squint eyes */}
      <g>
        <path d="M79 66 Q84 62 89 66" fill="none" stroke={C.eyes} strokeWidth="3" strokeLinecap="round" />
        <path d="M111 66 Q116 62 121 66" fill="none" stroke={C.eyes} strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* Open smile */}
      <path d="M86 79 Q100 94 114 79" fill={C.dark} stroke={C.mouth} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Main Component ──────────────────────────────────────────

function renderExpression(expression: LotiExpression, animated: boolean) {
  switch (expression) {
    case 'neutral': return <LotiNeutral />
    case 'happy': return <LotiHappy />
    case 'thoughtful': return <LotiThoughtful />
    case 'concerned': return <LotiConcerned />
    case 'scanning': return <LotiScanning animated={animated} />
    case 'error': return <LotiError />
    case 'welcome': return <LotiWelcome />
  }
}

export default function LotiMascot({
  expression,
  size,
  animated = false,
  className = '',
  ariaLabel = 'Loti the axolotl mascot',
}: LotiMascotProps) {
  const px = SIZES[size]

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: px, height: px }}
      role="img"
      aria-label={ariaLabel}
    >
      {renderExpression(expression, animated)}
    </div>
  )
}

export type { LotiExpression, LotiSize, LotiMascotProps }
