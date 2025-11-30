import { LucideIcon } from 'lucide-react';

interface DiscoverSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  className?: string;
}

export function DiscoverSectionHeader({ 
  icon: Icon, 
  title, 
  subtitle,
  className = ''
}: DiscoverSectionHeaderProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Icon className="w-6 h-6 text-primary" />
        {title}
      </h2>
      <p className="text-sm text-muted-foreground pl-8">
        {subtitle}
      </p>
    </div>
  );
}
