import { useState } from 'react';
import { Target, Plus, Loader2 } from 'lucide-react';
import { StudioLayout } from '@/components/layouts/StudioLayout';
import { Button } from '@/components/ui/button';
import { useArtistGoals } from '@/hooks/useArtistGoals';
import { GoalManagementCard } from '@/components/studio/GoalManagementCard';
import { CreateGoalDialog } from '@/components/studio/CreateGoalDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function StudioGoals() {
  const { t } = useLanguage();
  const isGoalsEnabled = useFeatureFlag('ARTIST_GOALS');
  const { goals, loading, activeGoal } = useArtistGoals();

  // Feature flag gate
  if (!isGoalsEnabled) {
    return (
      <StudioLayout>
        <div className="p-6 text-center py-12">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-2">{t('goals.comingSoon') || 'Goals Coming Soon'}</h2>
          <p className="text-muted-foreground">{t('goals.featureNotAvailable') || 'This feature is not yet available.'}</p>
        </div>
      </StudioLayout>
    );
  }
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  const handleEditGoal = (goalId: string) => {
    setEditingGoal(goalId);
    setShowCreateDialog(true);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingGoal(null);
  };

  const editGoalData = editingGoal ? goals.find(g => g.id === editingGoal) : null;

  return (
    <StudioLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{t('goals.studioTitle') || 'Goals'}</h1>
              <p className="text-sm text-muted-foreground">
                {t('goals.studioSubtitle') || 'Create funding goals for your fans to support'}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('goals.createGoal') || 'Create Goal'}
          </Button>
        </div>

        {/* Active Goal Banner */}
        {activeGoal && (
          <div className="p-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-gold">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-primary">
                {t('goals.activeGoal') || 'Active Goal'}
              </span>
            </div>
            <p className="font-medium">{activeGoal.title}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{activeGoal.current_amount.toLocaleString()} / {activeGoal.target_amount.toLocaleString()} FlyCoins</span>
              <span>•</span>
              <span>{activeGoal.supporter_count} {activeGoal.supporter_count === 1 ? 'supporter' : 'supporters'}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && goals.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t('goals.noGoalsTitle') || 'No goals yet'}
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              {t('goals.noGoalsDescription') || 'Create a goal to let your fans help you achieve your dreams. Set your own target amount—no presets or limits.'}
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('goals.createFirstGoal') || 'Create Your First Goal'}
            </Button>
          </div>
        )}

        {/* Goals List */}
        {!loading && goals.length > 0 && (
          <div className="grid gap-4">
            {goals.map((goal) => (
              <GoalManagementCard
                key={goal.id}
                goal={goal}
                onEdit={() => handleEditGoal(goal.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <CreateGoalDialog
        open={showCreateDialog}
        onOpenChange={handleCloseDialog}
        editGoal={editGoalData}
      />
    </StudioLayout>
  );
}
