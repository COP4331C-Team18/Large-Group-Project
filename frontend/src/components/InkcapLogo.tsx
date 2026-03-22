interface InkcapLogoProps {
  width?: number;
  height?: number;
}

export default function InkcapLogo({ width = 28, height = 32 }: InkcapLogoProps) {
  return (
    <svg
      viewBox="0 0 30 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width, height, display: 'block' }}
    >
      {/* Stem */}
      <rect x="13" y="19" width="4" height="13" rx="2" fill="#c8bfae" />
      {/* Cap */}
      <ellipse cx="15" cy="15" rx="13" ry="10" fill="#2a2d2e" />
      {/* Cap highlight */}
      <ellipse cx="10" cy="11" rx="5" ry="3.5" fill="#3d4244" opacity="0.55" />
      {/* Ink drips */}
      <circle cx="5.5"  cy="25"    r="2"   fill="#111410" />
      <circle cx="11"   cy="27"    r="1.5" fill="#111410" />
      <circle cx="20"   cy="26"    r="1.8" fill="#111410" />
      <circle cx="25.5" cy="23.5"  r="1.4" fill="#111410" />
      <line x1="5.5"  y1="23"  x2="5.5"  y2="25"   stroke="#111410" strokeWidth="1.5" />
      <line x1="11"   y1="24"  x2="11"   y2="27"   stroke="#111410" strokeWidth="1.5" />
      <line x1="20"   y1="24"  x2="20"   y2="26"   stroke="#111410" strokeWidth="1.5" />
      <line x1="25.5" y1="22"  x2="25.5" y2="23.5" stroke="#111410" strokeWidth="1.5" />
    </svg>
  );
}
