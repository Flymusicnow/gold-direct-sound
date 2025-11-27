interface FlyMusicLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FlyMusicLogo({ size = 'md', className = '' }: FlyMusicLogoProps) {
  const dimensions = {
    sm: { width: 80, height: 32, fontSize: 28 },
    md: { width: 100, height: 40, fontSize: 36 },
    lg: { width: 160, height: 64, fontSize: 56 },
  };

  const { width, height, fontSize } = dimensions[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* "fl" letters - standard text */}
      <text
        x="5"
        y="28"
        fill="white"
        fontSize="32"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.5"
      >
        fl
      </text>

      {/* Wavy "y" - custom SVG path with flowing curve */}
      <path
        d="M 50 10 
           L 50 18 
           Q 50 22, 52 24
           Q 54 26, 58 26
           L 65 26
           Q 68 26, 70 28
           Q 72 30, 72 34
           L 72 38
           Q 72 42, 68 44
           Q 64 46, 58 44
           L 54 42"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Top part of y stem */}
      <circle cx="50" cy="14" r="3" fill="white" />
    </svg>
  );
}
