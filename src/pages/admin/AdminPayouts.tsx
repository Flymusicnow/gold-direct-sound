import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { BottomNavBarAdmin } from "@/components/mobile/BottomNavBarAdmin";
import { MobileAdminNav } from "@/components/admin/MobileAdminNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface PendingPayout {
  artist_id: string;
  artist_user_id: string;
  artist_name: string;
  amount_due: number;
}

export default function AdminPayouts() {
  const isMobile = useIsMobile();
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [payoutMethod, setPayoutMethod] = useState<string>("manual");
  const [payoutNotes, setPayoutNotes] = useState<string>("");

  useEffect(() => {
    fetchPendingPayouts();
  }, []);

  const fetchPendingPayouts = async () => {
    try {
      const { data: payouts } = await supabase
        .from("artist_payouts")
        .select(`
          artist_user_id,
          amount_due
        `)
        .gt("amount_due", 0);

      if (payouts) {
        const artistIds = payouts.map(p => p.artist_user_id);
        const { data: profiles } = await supabase
          .from("artist_profiles")
          .select("id, user_id, artist_name")
          .in("user_id", artistIds);

        const enriched = payouts.map(payout => {
          const profile = profiles?.find(p => p.user_id === payout.artist_user_id);
          return {
            artist_id: profile?.id || "",
            artist_user_id: payout.artist_user_id,
            artist_name: profile?.artist_name || "Unknown",
            amount_due: payout.amount_due,
          };
        });

        setPendingPayouts(enriched);
      }
    } catch (error) {
      console.error("Error fetching payouts:", error);
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  const processPayout = async (payout: PendingPayout) => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setProcessingId(payout.artist_id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const amount = parseFloat(payoutAmount);

      await supabase.from("payout_history").insert({
        artist_id: payout.artist_id,
        amount,
        method: payoutMethod,
        notes: payoutNotes || null,
        paid_at: new Date().toISOString(),
        processed_by: user.id,
      });

      const { data: currentPayout } = await supabase
        .from("artist_payouts")
        .select("amount_due, amount_paid")
        .eq("artist_user_id", payout.artist_user_id)
        .single();

      if (currentPayout) {
        await supabase
          .from("artist_payouts")
          .update({
            amount_due: currentPayout.amount_due - amount,
            amount_paid: currentPayout.amount_paid + amount,
            last_payout_at: new Date().toISOString(),
          })
          .eq("artist_user_id", payout.artist_user_id);
      }

      toast.success("Payout processed successfully");
      setPayoutAmount("");
      setPayoutNotes("");
      fetchPendingPayouts();
    } catch (error) {
      console.error("Error processing payout:", error);
      toast.error("Failed to process payout");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading payouts...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen p-4 md:p-8 pt-20 pb-32 md:pb-28">
        <MobileAdminNav />
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Artist Payouts</h1>
            <p className="text-muted-foreground">Process pending artist earnings</p>
          </div>

          {pendingPayouts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">No pending payouts</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingPayouts.map((payout) => (
                <Card key={payout.artist_id} className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{payout.artist_name}</span>
                      <span className="text-primary">{payout.amount_due.toFixed(2)} kr</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Payout Amount</label>
                        <Input
                          type="number"
                          placeholder="Amount in SEK"
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          max={payout.amount_due}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Method</label>
                        <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual Transfer</SelectItem>
                            <SelectItem value="swish">Swish</SelectItem>
                            <SelectItem value="stripe_transfer">Stripe Connect</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
                      <Textarea
                        placeholder="Add notes about this payout..."
                        value={payoutNotes}
                        onChange={(e) => setPayoutNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <Button
                      onClick={() => processPayout(payout)}
                      disabled={processingId === payout.artist_id || !payoutAmount}
                      className="w-full"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {processingId === payout.artist_id ? "Processing..." : "Mark as Paid"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      {isMobile && <BottomNavBarAdmin />}
    </>
  );
}
