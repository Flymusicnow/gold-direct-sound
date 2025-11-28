import logoImage from "@/assets/flymusic-logo.png";

interface FlyMusicLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FlyMusicLogo({ size = 'md', className = '' }: FlyMusicLogoProps) {
  const heights = {
    sm: 32,
    md: 40,
    lg: 64,
  };

  return (
    <img
      src={logoImage}
      alt="FlyMusic"
      height={heights[size]}
      className={`h-auto ${className}`}
      style={{ height: heights[size], width: 'auto' }}
    />
  );
}
