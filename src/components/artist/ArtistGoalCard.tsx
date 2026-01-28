import { useState } from 'react';
import { Target, Coins, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useActiveGoal } from '@/hooks/useActiveGoal';
import { GoalDonationModal } from './GoalDonationModal';
import { useLanguage } from '@/contexts/LanguageContext';

interface ArtistGoalCardProps {
  artistId: string;
  className?: string;
}

export function ArtistGoalCard({ artistId, className }: ArtistGoalCardProps) {
  const { goal, loading } = useActiveGoal(artistId);
  const { t } = useLanguage();
  const [showDonationModal, setShowDonationModal] = useState(false);

  // Don't render anything if no active goal or still loading
  if (loading || !goal) {
    return null;
  }

  const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const isComplete = goal.current_amount >= goal.target_amount;

  return (
    <>
      <div className="container mx-auto px-4 max-w-6xl py-4">
        <div
          className={cn(
            "rounded-xl p-6",
            "border border-primary/30",
            "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
            "shadow-gold",
            "backdrop-blur-sm",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">
                {t('goals.helpMeReach') || 'Help Me Reach Goal'}
              </span>
            </div>
            <Button
              onClick={() => setShowDonationModal(true)}
              disabled={isComplete}
              className="bg-gradient-gold text-primary-foreground font-semibold rounded-full px-6 shadow-gold hover:opacity-90 transition-opacity"
            >
              <Coins className="h-4 w-4 mr-2" />
              {t('goals.donate') || 'Donate'}
            </Button>
          </div>

          {/* Goal Title */}
          <h3 className="text-lg font-medium mb-2">{goal.title}</h3>
          
          {/* Goal Description */}
          {goal.description && (
            <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
          )}

          {/* Progress Bar */}
          <div className="h-3 bg-muted/50 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-gold rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {goal.current_amount.toLocaleString()} / {goal.target_amount.toLocaleString()} {t('goals.flyCoins') || 'FlyCoins'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Heart className="h-4 w-4 text-primary/70" />
              <span>
                {goal.supporter_count} {goal.supporter_count === 1 
                  ? (t('goals.fanSupported') || 'fan supported') 
                  : (t('goals.fansSupported') || 'fans supported')}
              </span>
            </div>
          </div>

          {/* Completion Message */}
          {isComplete && (
            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
              <span className="text-primary font-medium">
                🎉 {t('goals.goalReached') || 'Goal Reached! Thank you for your support!'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Donation Modal */}
      <GoalDonationModal
        open={showDonationModal}
        onOpenChange={setShowDonationModal}
        goal={goal}
        artistId={artistId}
      />
    </>
  );
}
