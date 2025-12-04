import { ExternalLink, CheckCircle2, AlertCircle, Loader2, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStripeConnect } from '@/hooks/useStripeConnect';

export function StripeConnectSetup() {
  const { status, loading, error, startOnboarding, refreshStatus } = useStripeConnect();

  const getStatusBadge = () => {
    switch (status.status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'restricted':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Restricted</Badge>;
      case 'onboarding':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-muted text-muted-foreground">Pending</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const getStatusIcon = () => {
    if (status.status === 'active' && status.payoutsEnabled) {
      return <CheckCircle2 className="h-12 w-12 text-green-500" />;
    }
    if (status.status === 'restricted') {
      return <AlertCircle className="h-12 w-12 text-yellow-500" />;
    }
    return <CreditCard className="h-12 w-12 text-muted-foreground" />;
  };

  const getStatusMessage = () => {
    if (status.status === 'active' && status.payoutsEnabled) {
      return "Your Stripe account is fully set up. You'll receive payouts from supporter subscriptions.";
    }
    if (status.status === 'restricted') {
      return "Your Stripe account needs additional information. Complete the setup to enable payouts.";
    }
    if (status.status === 'onboarding') {
      return "You've started the setup process. Continue to complete your Stripe account.";
    }
    return "Set up Stripe Connect to receive payouts from your supporters.";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Stripe Connect
            </CardTitle>
            <CardDescription>
              Receive payments from your supporters
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center text-center py-4">
          {getStatusIcon()}
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            {getStatusMessage()}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {status.status === 'active' && status.payoutsEnabled ? (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Charges</p>
                <p className={`font-medium ${status.chargesEnabled ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {status.chargesEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Payouts</p>
                <p className={`font-medium ${status.payoutsEnabled ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {status.payoutsEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          ) : (
            <Button 
              onClick={startOnboarding}
              className="w-full bg-gradient-gold hover:opacity-90"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              {status.hasAccount ? 'Continue Setup' : 'Set Up Stripe Connect'}
            </Button>
          )}

          {status.hasAccount && (
            <Button variant="outline" onClick={refreshStatus} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Refresh Status
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          FlyMusic takes 30% to cover platform costs. You receive 70% of all supporter payments.
        </p>
      </CardContent>
    </Card>
  );
}
