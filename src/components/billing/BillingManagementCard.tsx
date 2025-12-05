import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, ExternalLink, Sparkles, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { toast } from "sonner";

interface BillingManagementCardProps {
  userType: 'artist' | 'fan';
}

export const BillingManagementCard = ({ userType }: BillingManagementCardProps) => {
  const navigate = useNavigate();
  const { subscription, isLoading, isPro, isElite, isSupporter, isFree } = useUserSubscription();
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const getPlanDisplayName = () => {
    if (isElite) return "Elite";
    if (isPro) return "Pro";
    if (isSupporter) return "Supporter Pass";
    return "Free";
  };

  const getPlanBadgeVariant = (): "default" | "secondary" | "outline" => {
    if (isElite) return "default";
    if (isPro || isSupporter) return "secondary";
    return "outline";
  };

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (err) {
      console.error("Error opening customer portal:", err);
      toast.error("Failed to open billing portal. Please try again.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasActiveSubscription = !isFree && subscription?.status === 'active';

  return (
    <div className="space-y-4">
      {/* Current Plan */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Current Plan</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-lg">{getPlanDisplayName()}</span>
            <Badge variant={getPlanBadgeVariant()}>
              {isFree ? "Free" : "Active"}
            </Badge>
          </div>
        </div>
        {!isFree && (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>

      {/* Next Billing */}
      {hasActiveSubscription && subscription?.expiresAt && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Next billing: {new Date(subscription.expiresAt).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        {hasActiveSubscription ? (
          <Button 
            variant="outline" 
            onClick={handleManageSubscription}
            disabled={isPortalLoading}
            className="flex-1"
          >
            {isPortalLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            Manage Subscription
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        ) : (
          <Button 
            onClick={() => navigate('/pricing')}
            className="flex-1"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to {userType === 'artist' ? 'Pro' : 'Supporter Pass'}
          </Button>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        {hasActiveSubscription 
          ? "You can update payment methods, change plans, or cancel anytime from the billing portal."
          : `Upgrade to unlock premium features and support ${userType === 'artist' ? 'your growth' : 'your favorite artists'}.`
        }
      </p>
    </div>
  );
};
