import { useState } from 'react';
import { Lock, Globe, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useAppMode, AppMode } from '@/hooks/useAppMode';
import { toast } from 'sonner';

export function AppModeToggle() {
  const { mode, loading, setMode } = useAppMode();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<AppMode | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleToggle = (checked: boolean) => {
    const newMode: AppMode = checked ? 'PUBLIC_AUTH' : 'PRIVATE_BETA';
    setPendingMode(newMode);
    setConfirmDialogOpen(true);
  };

  const confirmModeChange = async () => {
    if (!pendingMode) return;

    setUpdating(true);
    const success = await setMode(pendingMode);
    setUpdating(false);

    if (success) {
      toast.success(`App mode changed to ${pendingMode === 'PUBLIC_AUTH' ? 'Public' : 'Private Beta'}`);
    } else {
      toast.error('Failed to change app mode');
    }

    setConfirmDialogOpen(false);
    setPendingMode(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isPublic = mode === 'PUBLIC_AUTH';

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <div className="p-2 rounded-full bg-green-500/10">
                  <Globe className="h-5 w-5 text-green-500" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-orange-500/10">
                  <Lock className="h-5 w-5 text-orange-500" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg">App Mode</CardTitle>
                <CardDescription>Control public access to the platform</CardDescription>
              </div>
            </div>
            <Badge variant={isPublic ? 'default' : 'secondary'}>
              {isPublic ? 'Public' : 'Private Beta'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="app-mode" className="text-sm font-medium">
                {isPublic ? 'Anyone can sign up' : 'Invite-only access'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {isPublic 
                  ? 'Users can register without an invite code'
                  : 'Users need an invite code to access join/signin pages'
                }
              </p>
            </div>
            <Switch
              id="app-mode"
              checked={isPublic}
              onCheckedChange={handleToggle}
              disabled={updating}
            />
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Mode Change
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMode === 'PUBLIC_AUTH' ? (
                <>
                  You are about to <strong>open public registration</strong>. 
                  Anyone will be able to sign up without an invite code.
                </>
              ) : (
                <>
                  You are about to <strong>enable private beta mode</strong>. 
                  Only users with a valid invite code will be able to join.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmModeChange} disabled={updating}>
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
