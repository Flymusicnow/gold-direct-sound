import { useState } from 'react';
import { Coins, Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import confetti from 'canvas-confetti';
import type { ArtistGoal } from '@/hooks/useArtistGoals';

interface GoalDonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: ArtistGoal;
  /** Passed in from ArtistGoalCard so a single useActiveGoal instance stays authoritative */
  donate: (amount: number) => Promise<{ success: boolean; error?: string }>;
}

export function GoalDonationModal({ open, onOpenChange, goal, donate }: GoalDonationModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDonate = async () => {
    const numAmount = parseInt(amount, 10);

    if (!numAmount || numAmount <= 0) {
      toast.error(t('goals.invalidAmount') || 'Please enter a valid amount');
      return;
    }

    if (!user) {
      toast.error(t('goals.signInRequired') || 'Please sign in to donate');
      return;
    }

    setIsSubmitting(true);

    const result = await donate(numAmount);

    if (result.success) {
      setShowSuccess(true);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#FFD700', '#FFC125'],
      });

      setTimeout(() => {
        setShowSuccess(false);
        setAmount('');
        onOpenChange(false);
        toast.success(t('goals.donationSuccess') || 'Thank you for your support! 🎉');
      }, 2000);
    } else {
      toast.error(result.error || t('goals.donationFailed') || 'Donation failed');
    }

    setIsSubmitting(false);
  };

  const remaining = goal.target_amount - goal.current_amount;

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 rounded-full bg-gradient-gold flex items-center justify-center mb-4 animate-pulse">
              <Sparkles className="h-10 w-10 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">
              {t('goals.thankYou') || 'Thank You!'}
            </h3>
            <p className="text-muted-foreground text-center">
              {t('goals.supportMessage') || 'Your support means the world to this artist!'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            {t('goals.supportGoal') || 'Support This Goal'}
          </DialogTitle>
          <DialogDescription>{goal.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Goal Progress */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{t('goals.progress') || 'Progress'}</span>
              <span className="font-medium">
                {goal.current_amount.toLocaleString()} / {goal.target_amount.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-gold rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {remaining > 0
                ? `${remaining.toLocaleString()} ${t('goals.remaining') || 'remaining to goal'}`
                : t('goals.goalComplete') || 'Goal complete!'}
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t('goals.amountToContribute') || 'Amount to Contribute'}</Label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('goals.betaNote') || 'Support is tracked and shown on the goal progress'}
            </p>
            <p className="text-xs text-amber-500/80 mt-1">
              ⚠️ {t('goals.simulatedBeta') || 'Simulated in beta mode'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handleDonate}
            disabled={isSubmitting || !amount || parseInt(amount, 10) <= 0}
            className="bg-gradient-gold text-primary-foreground shadow-gold hover:opacity-90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('goals.donating') || 'Donating...'}
              </>
            ) : (
              <>
                <Coins className="h-4 w-4 mr-2" />
                {t('goals.donate') || 'Donate'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
