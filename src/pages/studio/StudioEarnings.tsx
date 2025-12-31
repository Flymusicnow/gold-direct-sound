import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudioLayout } from "@/components/layouts/StudioLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Clock } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { StripeConnectSetup } from "@/components/supporter/StripeConnectSetup";
import { ArtistTierManager } from "@/components/supporter/ArtistTierManager";
import { useLanguage } from "@/contexts/LanguageContext";

interface Payout {
  id: string;
  amount: number;
  method: string;
  notes: string;
  paid_at: string;
}

export default function StudioEarnings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, lastPayout: null as string | null });
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchEarnings();
  }, [user, navigate]);

  const fetchEarnings = async () => {
    if (!user) return;

    try {
      const { data: payoutData } = await supabase
        .from("artist_payouts")
        .select("amount_due, amount_paid, last_payout_at")
        .eq("artist_user_id", user.id)
        .maybeSingle();

      if (payoutData) {
        setEarnings({
          total: payoutData.amount_paid || 0,
          pending: payoutData.amount_due || 0,
          lastPayout: payoutData.last_payout_at,
        });
      }

      const { data: profile } = await supabase
        .from("artist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        const { data: payoutHistory } = await supabase
          .from("payout_history")
          .select("*")
          .eq("artist_id", profile.id)
          .order("paid_at", { ascending: false })
          .limit(10);

        setPayouts(payoutHistory || []);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <StudioLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('studio.earnings')}</h1>
          <p className="text-muted-foreground">{t('studio.earningsDescription')}</p>
        </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    {t('studio.totalEarnings')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{earnings.total.toFixed(2)} kr</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('studio.lifetimeRevenue')}</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {t('studio.pendingPayout')}
                    <InfoTooltip
                      title={t('studio.pendingPayout')}
                      description={t('studio.pendingPayoutTooltip')}
                      forRole="artist"
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{earnings.pending.toFixed(2)} kr</div>
                  <p className="text-xs text-muted-foreground mt-1">{t('studio.availableForWithdrawal')}</p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {t('studio.lastPayout')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {earnings.lastPayout ? new Date(earnings.lastPayout).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }) : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {earnings.lastPayout ? t('studio.mostRecent') : t('studio.noPayoutsYet')}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('studio.payoutHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                {payouts.length === 0 ? (
                  <p className="text-muted-foreground">{t('empty.noPayouts')}</p>
                ) : (
                  <div className="space-y-3">
                    {payouts.map((payout) => (
                      <div key={payout.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-semibold">{payout.amount.toFixed(2)} kr</p>
                          <p className="text-sm text-muted-foreground">{new Date(payout.paid_at).toLocaleDateString()}</p>
                          {payout.notes && <p className="text-xs text-muted-foreground mt-1">{payout.notes}</p>}
                        </div>
                        <span className="text-xs uppercase text-muted-foreground">{payout.method}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stripe Connect Setup */}
            <StripeConnectSetup />

            {/* Supporter Tier Management */}
            <ArtistTierManager />

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{t('studio.howPayoutsWork')}</h3>
                  <InfoTooltip
                    title={t('studio.revenueSplit')}
                    description={t('studio.revenueSplitTooltip')}
                    forRole="artist"
                  />
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {t('studio.payoutBullet1')}</li>
                  <li>• {t('studio.payoutBullet2')}</li>
                  <li>• {t('studio.payoutBullet3')}</li>
                  <li>• {t('studio.payoutBullet4')}</li>
                </ul>
              </CardContent>
        </Card>
      </div>
    </StudioLayout>
  );
}
