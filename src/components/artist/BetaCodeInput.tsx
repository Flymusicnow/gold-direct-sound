import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

interface BetaCodeInputProps {
  onSuccess?: () => void;
}

export function BetaCodeInput({ onSuccess }: BetaCodeInputProps) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    if (!user || !code.trim()) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("redeem_beta_code", {
        _code: code.trim().toUpperCase(),
        _user_id: user.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; badge?: string; error?: string };

      if (result.success) {
        // Trigger confetti
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#E8BF1A", "#F4D67A", "#C89F0A"],
        });

        toast.success(`🎉 ${result.badge} unlocked!`);
        setCode("");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to redeem code");
      }
    } catch (error: any) {
      console.error("Error redeeming code:", error);
      toast.error(error.message || "Failed to redeem code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-medium">Have a Beta Access Code?</span>
      </div>

      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter your code..."
          disabled={loading}
          className="flex-1 uppercase font-mono tracking-wider"
          maxLength={20}
        />
        <Button
          onClick={handleRedeem}
          disabled={!code.trim() || loading}
          className="bg-gradient-gold hover:opacity-90"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Redeem"
          )}
        </Button>
      </div>
    </div>
  );
}