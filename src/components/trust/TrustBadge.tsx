import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TrustBadge: React.FC = () => {
  const trustLayerEnabled = useFeatureFlag('TRUST_LAYER_ENABLED');

  if (!trustLayerEnabled) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link 
            to="/trust" 
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary hidden sm:inline">Trust</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>FlyMusic Trust & Transparency</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TrustBadge;
