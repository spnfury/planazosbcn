/**
 * PlanazosBCN logo icon — inline SVG for consistent rendering.
 * Props: size (px, default 24), color (css color, default "currentColor"), className
 */
export default function LogoIcon({ size = 24, color = 'currentColor', className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 180"
      width={size}
      height={size}
      className={className}
      fill={color}
      aria-hidden="true"
    >
      {/* Sun rays */}
      <path d="M100 10 L100 0" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M130 18 L138 4" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M155 35 L168 24" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M70 18 L62 4" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M45 35 L32 24" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* Head */}
      <circle cx="100" cy="52" r="16" />
      <circle cx="100" cy="52" r="6" fill="white" />
      {/* Arms / V-shape checkmark */}
      <path
        d="M100 95 L40 45 Q35 40 42 38 L48 36 Q54 34 58 40 L100 82 L142 40 Q146 34 152 36 L158 38 Q165 40 160 45 Z"
        fillRule="evenodd"
      />
      {/* Body */}
      <path
        d="M88 95 Q88 130 70 165 Q68 170 75 170 L90 170 Q95 170 96 165 L100 140 L104 165 Q105 170 110 170 L125 170 Q132 170 130 165 Q112 130 112 95 Z"
      />
    </svg>
  );
}
