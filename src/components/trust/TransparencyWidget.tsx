import React, { useState } from 'react';
import { Info, X, Heart, TrendingUp, Music, Users } from 'lucide-react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TransparencyWidgetProps {
  reasons?: {
    followedArtist?: boolean;
    genreMatch?: boolean;
    trending?: boolean;
    supporterBonus?: boolean;
  };
  artistName?: string;
  genre?: string;
}

const TransparencyWidget: React.FC<TransparencyWidgetProps> = ({ 
  reasons = {}, 
  artistName,
  genre 
}) => {
  const trustLayerEnabled = useFeatureFlag('TRUST_LAYER_ENABLED');
  const [open, setOpen] = useState(false);

  if (!trustLayerEnabled) return null;

  const activeReasons = [];
  
  if (reasons.followedArtist) {
    activeReasons.push({
      icon: <Heart className="h-4 w-4 text-red-400" />,
      text: `Du följer ${artistName || 'denna artist'}`,
    });
  }
  
  if (reasons.genreMatch) {
    activeReasons.push({
      icon: <Music className="h-4 w-4 text-primary" />,
      text: `Matchar din smak för ${genre || 'denna genre'}`,
    });
  }
  
  if (reasons.trending) {
    activeReasons.push({
      icon: <TrendingUp className="h-4 w-4 text-green-400" />,
      text: 'Trendar just nu på FlyMusic',
    });
  }
  
  if (reasons.supporterBonus) {
    activeReasons.push({
      icon: <Users className="h-4 w-4 text-purple-400" />,
      text: 'Artisten har aktiva supporters',
    });
  }

  if (activeReasons.length === 0) {
    activeReasons.push({
      icon: <Music className="h-4 w-4 text-primary" />,
      text: 'Baserat på populärt innehåll',
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Info className="h-3 w-3 mr-1" />
          Varför ser jag detta?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Varför ser du detta innehåll
          </DialogTitle>
          <DialogDescription>
            FlyMusic rekommenderar innehåll baserat på transparenta faktorer
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {activeReasons.map((reason, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              {reason.icon}
              <span className="text-sm">{reason.text}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            FlyMusic använder aldrig dolda algoritmer. Vi prioriterar transparens och ger 
            artister och fans kontroll över sin upplevelse.
          </p>
          <Button 
            variant="link" 
            className="h-auto p-0 mt-2 text-xs text-primary"
            onClick={() => {
              setOpen(false);
              window.location.href = '/trust';
            }}
          >
            Läs mer om FlyMusic Trust →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransparencyWidget;
