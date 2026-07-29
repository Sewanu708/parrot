const brutalistProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
};

export function InboxIcon({ className }: { className?: string }) {
  return (
    <svg {...brutalistProps} className={className}>
      {/* A harsh, wireframe inbox tray */}
      <rect x="3" y="5" width="18" height="14" />
      <polyline points="3 10 10 10 10 13 14 13 14 10 21 10" />
    </svg>
  );
}

export function ContactsIcon({ className }: { className?: string }) {
  return (
    <svg {...brutalistProps} className={className}>
      {/* Block-based figure instead of rounded shoulders/head */}
      <rect x="9" y="5" width="6" height="6" />
      <path d="M4 20v-4h16v4" />
    </svg>
  );
}

export function AutomationsIcon({ className }: { className?: string }) {
  return (
    <svg {...brutalistProps} className={className}>
      {/* Geometric, stepped lightning bolt */}
      <polygon points="14 2 14 11 21 11 10 22 10 13 3 13" />
    </svg>
  );
}

export function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg {...brutalistProps} className={className}>
      {/* Technical sliders replace the traditional gear */}
      <path d="M2 7h20M2 17h20" />
      <rect x="6" y="4" width="4" height="6" />
      <rect x="14" y="14" width="4" height="6" />
    </svg>
  );
}

export function SelectorIcon({ className }: { className?: string }) {
  return (
    <svg {...brutalistProps} className={className}>
      {/* Sharp, wide chevrons for the tenant switcher */}
      <polyline points="7 9 12 4 17 9" />
      <polyline points="7 15 12 20 17 15" />
    </svg>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

export function ChevronsLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </svg>
  );
}
export function ParrotEmptyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      {/* Back bubble, muted */}
      <rect
        x="10"
        y="14"
        width="34"
        height="24"
        rx="8"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.35"
      />
      <path
        d="M18 38 L18 46 L26 38 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.35"
      />

      {/* Front bubble, bold */}
      <rect
        x="20"
        y="24"
        width="34"
        height="24"
        rx="8"
        stroke="currentColor"
        strokeWidth="2.25"
      />
      <path
        d="M46 48 L46 56 L38 48 Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />

      {/* Typing dots */}
      <circle cx="30" cy="36" r="1.8" fill="currentColor" />
      <circle cx="37" cy="36" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function TransitionIcon({ className, isDark }: { className?: string, isDark?: boolean }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <g
        className="transition-transform duration-500 origin-center"
        style={{ transform: isDark ? "rotate(-90deg)" : "rotate(0)" }}
      >
        <mask id="moon-mask">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <circle 
            cx={isDark ? "12" : "24"} 
            cy={isDark ? "4" : "10"} 
            r="5" 
            fill="black" 
            className="transition-all duration-500" 
          />
        </mask>
        <circle 
          cx="12" 
          cy="12" 
          r={isDark ? "9" : "5"} 
          mask="url(#moon-mask)" 
          fill={isDark ? "currentColor" : "none"} 
          className="transition-all duration-500" 
        />
        <g 
          className="transition-opacity duration-500"
          style={{ opacity: isDark ? 0 : 1 }}
        >
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </g>
      </g>
    </svg>
  );
}

