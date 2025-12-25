import logoImage from "@/assets/flymusic-logo.png";

interface FlyMusicLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function FlyMusicLogo({ size = 'md', className = '' }: FlyMusicLogoProps) {
  const heights = {
    sm: 32,
    md: 40,
    lg: 64,
    xl: 96,
  };

  return (
    <img
      src={logoImage}
      alt="FlyMusic"
      height={heights[size]}
      className={`h-auto transition-all duration-300 ease-out hover:scale-105 hover:drop-shadow-[0_0_8px_rgba(232,191,26,0.4)] cursor-pointer ${className}`}
      style={{ height: heights[size], width: 'auto' }}
    />
  );
}
