import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupportTierModal } from './SupportTierModal';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPromptOverlay } from '@/components/LoginPromptOverlay';

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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const handleClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
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
      
      <LoginPromptOverlay
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        action="support"
        redirectPath={location.pathname}
      />
    </>
  );
}
