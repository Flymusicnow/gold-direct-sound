import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { storeInviteToken } from '@/hooks/useFanInviteAccess';
import { toast } from 'sonner';

interface InviteCodeUnlockProps {
  disabled?: boolean;
  initialCode?: string;
  autoShowInput?: boolean;
}

export function InviteCodeUnlock({ disabled = false, initialCode = '', autoShowInput = false }: InviteCodeUnlockProps) {
  const navigate = useNavigate();
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(autoShowInput || !!initialCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled) return;
    
    const trimmedCode = code.trim().toUpperCase();
    
    if (!trimmedCode) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call edge function to validate code
      const { data, error: invokeError } = await supabase.functions.invoke('validate-invite-code', {
        body: { code: trimmedCode }
      });

      if (invokeError) {
        console.error('Invoke error:', invokeError);
        setError('Failed to validate code. Please try again.');
        setLoading(false);
        return;
      }

      if (!data.valid) {
        setError(data.error || 'Invalid invite code');
        setLoading(false);
        return;
      }

      // Store token in localStorage (fallback for blocked cookies)
      // IMPORTANT: Do this BEFORE redirecting
      storeInviteToken(data.token, data.expires_at);

      toast.success('Invite code accepted!');
      
      // Redirect based on invite role (default to fan)
      const role = data.role || 'fan';
      const redirectPath = role === 'artist' ? '/join/artist' : '/join/fan';
      navigate(redirectPath);
    } catch (err) {
      console.error('Error validating code:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        disabled={disabled}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Have an invite code?
      </button>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-lg bg-card/50 border border-border">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Key className="h-4 w-4" />
        <span>Enter your invite code</span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="FLYMUSIC..."
            className="font-mono uppercase"
            disabled={loading || disabled}
            autoFocus
          />
          <Button type="submit" disabled={loading || disabled || !code.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : disabled ? (
              'Disabled'
            ) : (
              'Unlock'
            )}
          </Button>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>
      
      <button
        onClick={() => {
          setShowInput(false);
          setCode('');
          setError(null);
        }}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
