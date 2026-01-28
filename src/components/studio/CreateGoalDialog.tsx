import { useState, useEffect } from 'react';
import { Target, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useArtistGoals, type ArtistGoal } from '@/hooks/useArtistGoals';
import { useLanguage } from '@/contexts/LanguageContext';

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editGoal?: ArtistGoal | null;
}

export function CreateGoalDialog({ open, onOpenChange, editGoal }: CreateGoalDialogProps) {
  const { t } = useLanguage();
  const { createGoal, updateGoal } = useArtistGoals();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!editGoal;

  // Populate form when editing
  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setDescription(editGoal.description || '');
      setTargetAmount(String(editGoal.target_amount));
    } else {
      setTitle('');
      setDescription('');
      setTargetAmount('');
    }
  }, [editGoal, open]);

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast.error(t('goals.titleRequired') || 'Please enter a goal title');
      return;
    }

    if (title.length > 100) {
      toast.error(t('goals.titleTooLong') || 'Title must be under 100 characters');
      return;
    }

    if (description.length > 500) {
      toast.error(t('goals.descriptionTooLong') || 'Description must be under 500 characters');
      return;
    }

    const amount = parseInt(targetAmount, 10);
    if (!amount || amount <= 0) {
      toast.error(t('goals.invalidTargetAmount') || 'Please enter a valid target amount');
      return;
    }

    setIsSubmitting(true);

    let result;
    if (isEditing && editGoal) {
      result = await updateGoal(editGoal.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        target_amount: amount,
      });
    } else {
      result = await createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        target_amount: amount,
      });
    }

    if (result.success) {
      toast.success(isEditing 
        ? (t('goals.goalUpdated') || 'Goal updated successfully')
        : (t('goals.goalCreated') || 'Goal created successfully')
      );
      onOpenChange(false);
    } else {
      toast.error(result.error || (t('goals.saveFailed') || 'Failed to save goal'));
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {isEditing 
              ? (t('goals.editGoal') || 'Edit Goal')
              : (t('goals.createGoal') || 'Create Goal')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? (t('goals.editGoalDescription') || 'Update your goal details. Target amount is fully in your control.')
              : (t('goals.createGoalDescription') || 'Set a funding goal for your fans to help you achieve. You define the exact target—no presets.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {t('goals.goalTitle') || 'Goal Title'} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder={t('goals.titlePlaceholder') || 'e.g., New Album Production'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/100
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t('common.description') || 'Description'} ({t('common.optional') || 'Optional'})
            </Label>
            <Textarea
              id="description"
              placeholder={t('goals.descriptionPlaceholder') || 'Tell your fans what this goal is for...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="target">
              {t('goals.targetAmount') || 'Target Amount (FlyCoins)'} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="target"
              type="number"
              min="1"
              placeholder="10000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t('goals.targetAmountNote') || 'You choose the exact amount—this is your goal, your way.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common.saving') || 'Saving...'}
              </>
            ) : (
              isEditing 
                ? (t('goals.saveChanges') || 'Save Changes')
                : (t('goals.createGoal') || 'Create Goal')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
