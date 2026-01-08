import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Trash2, History, AlertTriangle, X } from 'lucide-react';
import { useArtistPricingOverride, PricingStatus, DiscountScope } from '@/hooks/useArtistPricingOverride';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ArtistPricingOverrideFormProps {
  artistId: string;
  artistName: string;
  onClose?: () => void;
}

export function ArtistPricingOverrideForm({ artistId, artistName, onClose }: ArtistPricingOverrideFormProps) {
  const { override, auditLog, isLoading, grant, revoke, isGranting, isRevoking } = useArtistPricingOverride(artistId);

  const [status, setStatus] = useState<PricingStatus>('standard');
  const [discountPercent, setDiscountPercent] = useState(50);
  const [scope, setScope] = useState<DiscountScope>('all');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [reason, setReason] = useState('');

  // Sync form with current override
  useEffect(() => {
    if (override) {
      setStatus(override.status);
      setDiscountPercent(override.discount_percent ?? 50);
      setScope(override.scope);
      setHasExpiry(!!override.expires_at);
      setExpiresAt(override.expires_at ? override.expires_at.split('T')[0] : '');
      setReason(override.reason);
    } else {
      setStatus('standard');
      setDiscountPercent(50);
      setScope('all');
      setHasExpiry(false);
      setExpiresAt('');
      setReason('');
    }
  }, [override]);

  const handleSave = () => {
    if (!reason.trim()) {
      return;
    }
    
    grant({
      status,
      discount_percent: status === 'discounted' ? discountPercent : null,
      scope,
      expires_at: hasExpiry && expiresAt ? new Date(expiresAt).toISOString() : null,
      reason,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{artistName}</CardTitle>
            <CardDescription>Manage pricing override</CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="settings">
          <TabsList className="w-full">
            <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              <History className="h-4 w-4 mr-1" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 pt-4">
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PricingStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beta_free">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/10 text-green-500">Beta Free</Badge>
                      <span className="text-muted-foreground">100% off</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="discounted">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500/10 text-yellow-600">Discounted</Badge>
                      <span className="text-muted-foreground">Custom %</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="standard">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Standard</Badge>
                      <span className="text-muted-foreground">Full price</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount Percentage (only for discounted) */}
            {status === 'discounted' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Discount Percentage</Label>
                  <span className="text-lg font-bold text-primary">{discountPercent}%</span>
                </div>
                <Slider
                  value={[discountPercent]}
                  onValueChange={([v]) => setDiscountPercent(v)}
                  min={10}
                  max={90}
                  step={5}
                  className="py-2"
                />
                <p className="text-xs text-muted-foreground">
                  Artist pays {100 - discountPercent}% of standard fees
                </p>
              </div>
            )}

            {/* Scope */}
            {status !== 'standard' && (
              <div className="space-y-2">
                <Label>Scope</Label>
                <Select value={scope} onValueChange={(v) => setScope(v as DiscountScope)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All fees & subscriptions</SelectItem>
                    <SelectItem value="platform_fees">Platform fees only</SelectItem>
                    <SelectItem value="subscriptions">Subscriptions only</SelectItem>
                    <SelectItem value="features">Feature access only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Expiry */}
            {status !== 'standard' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="has-expiry">Set expiration date</Label>
                  <Switch id="has-expiry" checked={hasExpiry} onCheckedChange={setHasExpiry} />
                </div>
                {hasExpiry && (
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                )}
                {!hasExpiry && (
                  <p className="text-xs text-muted-foreground">Open-ended (until revoked)</p>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Why is this discount being applied? (internal only)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
              {!reason.trim() && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Reason is required
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={!reason.trim() || isGranting}
                className="flex-1"
              >
                {isGranting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>

              {override && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isRevoking}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke pricing override?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the pricing override for {artistName}. They will be switched to standard pricing immediately.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => revoke()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Revoke
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="pt-4">
            {auditLog && auditLog.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="capitalize">
                        {entry.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.changed_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    {entry.new_values && (
                      <p className="text-muted-foreground text-xs">
                        Status: {(entry.new_values as any).status}
                        {(entry.new_values as any).discount_percent && ` (${(entry.new_values as any).discount_percent}%)`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No history yet</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
