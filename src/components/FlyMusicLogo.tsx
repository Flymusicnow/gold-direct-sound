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
      viewBox="0 0 120 40"
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

      {/* Wavy "y" with flowing tail - integrated with text */}
      <g>
        {/* Main stem of y */}
        <path
          d="M 48 10 L 48 18"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Left diagonal branch */}
        <path
          d="M 48 14 L 42 18"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Right diagonal branch */}
        <path
          d="M 48 14 L 54 18"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Signature wavy tail - flowing curve */}
        <path
          d="M 48 18 
             Q 48 22, 50 24
             Q 52 26, 56 27
             Q 60 28, 64 27
             Q 68 26, 70 28
             Q 72 30, 72 34
             Q 72 38, 68 40
             Q 64 42, 58 40
             L 54 38"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
