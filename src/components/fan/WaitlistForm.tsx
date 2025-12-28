import { useState } from 'react';
import { Mail, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WaitlistFormProps {
  disabled?: boolean;
}

export function WaitlistForm({ disabled = false }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled) return;
    
    const trimmedEmail = email.trim().toLowerCase();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Check if already on waitlist
      const { data: existing } = await supabase
        .from('beta_waitlist')
        .select('id, status')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (existing) {
        setSuccess(true);
        toast.success("You're already on the list!");
        return;
      }

      // Add to waitlist
      const { error } = await supabase
        .from('beta_waitlist')
        .insert({
          email: trimmedEmail,
          user_type: 'fan',
          status: 'pending'
        });

      if (error) {
        console.error('Waitlist error:', error);
        toast.error('Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
      toast.success("You're on the list!");
    } catch (err) {
      console.error('Waitlist error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Check className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">You're on the list.</p>
          <p className="text-sm text-muted-foreground">We'll email you when it's your turn.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="pl-10"
            disabled={loading || disabled}
            required
          />
        </div>
        <Button type="submit" disabled={loading || disabled || !email.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : disabled ? (
            'Disabled'
          ) : (
            'Join Waitlist'
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        We'll notify you when we're ready to welcome you.
      </p>
    </form>
  );
}
