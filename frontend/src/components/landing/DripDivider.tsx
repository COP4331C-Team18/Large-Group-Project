interface DripDividerProps {
  /** Flip vertically so drips hang from the bottom of a dark section */
  flip?: boolean;
}

/**
 * A full-width SVG strip that looks like ink dripping downward.
 * Use `flip` when you want to transition from dark back to light
 * (the strip is rotated 180° so the drips point upward).
 */
export default function DripDivider({
  flip = false,
}: DripDividerProps) {
  return (
    <div
      className="relative h-[60px] overflow-hidden bg-base-100"
      style={{
        transform: flip ? 'scaleY(-1)' : undefined,
      }}
    >
      <svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="absolute top-0 left-0 w-full h-full text-neutral fill-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="1440" height="22" />
        <ellipse cx="60"   cy="22" rx="8" ry="32"/>
        <ellipse cx="170"  cy="22" rx="5" ry="22"/>
        <ellipse cx="310"  cy="22" rx="9" ry="38"/>
        <ellipse cx="460"  cy="22" rx="6" ry="26"/>
        <ellipse cx="600"  cy="22" rx="8" ry="34"/>
        <ellipse cx="720"  cy="22" rx="4" ry="16"/>
        <ellipse cx="860"  cy="22" rx="7" ry="30"/>
        <ellipse cx="1000" cy="22" rx="5" ry="20"/>
        <ellipse cx="1140" cy="22" rx="9" ry="36"/>
        <ellipse cx="1290" cy="22" rx="6" ry="24"/>
        <ellipse cx="1400" cy="22" rx="5" ry="18"/>
      </svg>
    </div>
  );
}
