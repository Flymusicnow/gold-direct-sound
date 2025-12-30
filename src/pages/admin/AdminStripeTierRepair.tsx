import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Wrench, CheckCircle2, AlertTriangle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TierResult {
  tier_id: string;
  tier_name: string;
  artist_name: string;
  status: 'ok' | 'repaired' | 'created' | 'error';
  message: string;
  stripe_product_id?: string;
  stripe_price_id?: string;
}

interface ScanSummary {
  total: number;
  ok: number;
  repaired: number;
  created: number;
  errors: number;
}

export default function AdminStripeTierRepair() {
  const navigate = useNavigate();
  const [results, setResults] = useState<TierResult[]>([]);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [repairingId, setRepairingId] = useState<string | null>(null);

  const scanTiers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('repair-supporter-tiers', {
        body: { mode: 'scan' },
      });

      if (error) throw error;

      setResults(data.results || []);
      setSummary(data.summary || null);
      toast.success(`Scanned ${data.summary?.total || 0} tiers`);
    } catch (err) {
      console.error('Scan error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to scan tiers');
    } finally {
      setLoading(false);
    }
  };

  const repairAll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('repair-supporter-tiers', {
        body: { mode: 'repair' },
      });

      if (error) throw error;

      setResults(data.results || []);
      setSummary(data.summary || null);
      
      const repaired = data.summary?.repaired || 0;
      const created = data.summary?.created || 0;
      toast.success(`Repaired ${repaired + created} tiers`);
    } catch (err) {
      console.error('Repair error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to repair tiers');
    } finally {
      setLoading(false);
    }
  };

  const repairSingle = async (tierId: string) => {
    setRepairingId(tierId);
    try {
      const { data, error } = await supabase.functions.invoke('repair-supporter-tiers', {
        body: { mode: 'repair', tier_id: tierId },
      });

      if (error) throw error;

      // Update the result in the list
      if (data.results?.[0]) {
        setResults((prev) =>
          prev.map((r) => (r.tier_id === tierId ? data.results[0] : r))
        );
        toast.success('Tier repaired successfully');
      }
    } catch (err) {
      console.error('Repair single error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to repair tier');
    } finally {
      setRepairingId(null);
    }
  };

  const getStatusBadge = (status: TierResult['status']) => {
    switch (status) {
      case 'ok':
        return (
          <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Configured
          </Badge>
        );
      case 'repaired':
        return (
          <Badge variant="default" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <RefreshCw className="h-3 w-3 mr-1" />
            Repaired
          </Badge>
        );
      case 'created':
        return (
          <Badge variant="default" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Created
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Missing
          </Badge>
        );
      default:
        return null;
    }
  };

  const missingCount = results.filter((r) => r.status === 'error').length;

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Stripe Tier Repair</h1>
          <p className="text-muted-foreground">
            Scan and repair supporter tiers with missing Stripe configuration
          </p>
        </div>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions</CardTitle>
          <CardDescription>
            Scan all tiers to check Stripe configuration, or repair all missing ones
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={scanTiers} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Scan All Tiers
          </Button>
          <Button
            onClick={repairAll}
            disabled={loading || missingCount === 0}
            variant="secondary"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wrench className="h-4 w-4 mr-2" />
            )}
            Repair All Missing ({missingCount})
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{summary.total}</div>
              <p className="text-sm text-muted-foreground">Total Tiers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">{summary.ok}</div>
              <p className="text-sm text-muted-foreground">Configured</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-500">{summary.repaired}</div>
              <p className="text-sm text-muted-foreground">Repaired</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-500">{summary.created}</div>
              <p className="text-sm text-muted-foreground">Created</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-500">{summary.errors}</div>
              <p className="text-sm text-muted-foreground">Missing/Errors</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tier Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artist</TableHead>
                  <TableHead>Tier Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.tier_id}>
                    <TableCell className="font-medium">{result.artist_name}</TableCell>
                    <TableCell>{result.tier_name}</TableCell>
                    <TableCell>{getStatusBadge(result.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {result.message}
                    </TableCell>
                    <TableCell className="text-right">
                      {result.status === 'error' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => repairSingle(result.tier_id)}
                          disabled={repairingId === result.tier_id}
                        >
                          {repairingId === result.tier_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wrench className="h-3 w-3" />
                          )}
                          <span className="ml-1">Fix</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {results.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
            <p className="text-muted-foreground mb-4">
              Click "Scan All Tiers" to check Stripe configuration for all supporter tiers
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
