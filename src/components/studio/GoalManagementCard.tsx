import { Loader2, MoreVertical, Pause, Play, CheckCircle, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useArtistGoals, type ArtistGoal } from '@/hooks/useArtistGoals';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface GoalManagementCardProps {
  goal: ArtistGoal;
  onEdit: () => void;
}

const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary' as const, color: 'bg-muted' },
  active: { label: 'Active', variant: 'default' as const, color: 'bg-green-500' },
  paused: { label: 'Paused', variant: 'outline' as const, color: 'bg-yellow-500' },
  completed: { label: 'Completed', variant: 'default' as const, color: 'bg-primary' },
};

export function GoalManagementCard({ goal, onEdit }: GoalManagementCardProps) {
  const { t } = useLanguage();
  const { activateGoal, pauseGoal, completeGoal, deleteGoal, activeGoal } = useArtistGoals();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const status = statusConfig[goal.status];
  const canActivate = goal.status === 'draft' || goal.status === 'paused';
  const hasAnotherActiveGoal = activeGoal && activeGoal.id !== goal.id;

  const handleAction = async (action: 'activate' | 'pause' | 'complete' | 'delete') => {
    setIsLoading(action);
    let result;

    switch (action) {
      case 'activate':
        result = await activateGoal(goal.id);
        if (result.success) toast.success(t('goals.activated') || 'Goal activated');
        break;
      case 'pause':
        result = await pauseGoal(goal.id);
        if (result.success) toast.success(t('goals.paused') || 'Goal paused');
        break;
      case 'complete':
        result = await completeGoal(goal.id);
        if (result.success) toast.success(t('goals.completed') || 'Goal marked as complete');
        break;
      case 'delete':
        result = await deleteGoal(goal.id);
        if (result.success) toast.success(t('goals.deleted') || 'Goal deleted');
        break;
    }

    if (result && !result.success) {
      toast.error(result.error || t('goals.actionFailed') || 'Action failed');
    }

    setIsLoading(null);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className={cn(
        "transition-all",
        goal.status === 'active' && "border-primary/30 shadow-gold"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={status.variant} className="shrink-0">
                  <span className={cn("w-2 h-2 rounded-full mr-1.5", status.color)} />
                  {status.label}
                </Badge>
                {goal.status === 'completed' && (
                  <CheckCircle className="h-4 w-4 text-primary" />
                )}
              </div>
              
              <h3 className="font-semibold truncate">{goal.title}</h3>
              {goal.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {goal.description}
                </p>
              )}

              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">
                    {goal.current_amount.toLocaleString()} / {goal.target_amount.toLocaleString()} FlyCoins
                  </span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-gold rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span>{goal.supporter_count} {goal.supporter_count === 1 ? 'supporter' : 'supporters'}</span>
                <span>•</span>
                <span>Created {new Date(goal.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Right: Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('common.edit') || 'Edit'}
                </DropdownMenuItem>
                
                {canActivate && (
                  <DropdownMenuItem 
                    onClick={() => handleAction('activate')}
                    disabled={!!hasAnotherActiveGoal}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t('goals.activate') || 'Activate'}
                    {hasAnotherActiveGoal && ' (pause other first)'}
                  </DropdownMenuItem>
                )}
                
                {goal.status === 'active' && (
                  <DropdownMenuItem onClick={() => handleAction('pause')}>
                    <Pause className="h-4 w-4 mr-2" />
                    {t('common.pause') || 'Pause'}
                  </DropdownMenuItem>
                )}
                
                {(goal.status === 'active' || goal.status === 'paused') && (
                  <DropdownMenuItem onClick={() => handleAction('complete')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('goals.markComplete') || 'Mark Complete'}
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.delete') || 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('goals.deleteConfirmTitle') || 'Delete Goal?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('goals.deleteConfirmDescription') || 'This action cannot be undone. All donation records for this goal will be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction('delete')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading === 'delete' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('common.delete') || 'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
