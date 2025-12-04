import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupportTierModal } from './SupportTierModal';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SupportButtonProps {
  artistId: string;
  artistName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function SupportButton({ 
  artistId, 
  artistName, 
  variant = 'default',
  size = 'default',
  className = ''
}: SupportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent(`/artist/${artistId}`));
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={`bg-gradient-gold hover:opacity-90 text-primary-foreground ${className}`}
      >
        <Heart className="h-4 w-4 mr-2" />
        Support
      </Button>

      <SupportTierModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        artistId={artistId}
        artistName={artistName}
      />
    </>
  );
}
