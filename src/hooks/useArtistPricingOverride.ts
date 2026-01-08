import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type PricingStatus = 'beta_free' | 'discounted' | 'standard';
export type DiscountScope = 'platform_fees' | 'subscriptions' | 'features' | 'all';

export interface PricingOverride {
  id: string;
  artist_id: string;
  status: PricingStatus;
  discount_percent: number | null;
  scope: DiscountScope;
  starts_at: string | null;
  expires_at: string | null;
  reason: string;
  granted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingOverrideInput {
  status: PricingStatus;
  discount_percent?: number | null;
  scope?: DiscountScope;
  starts_at?: string | null;
  expires_at?: string | null;
  reason: string;
}

export interface AuditLogEntry {
  id: string;
  override_id: string | null;
  artist_id: string;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
}

export function useArtistPricingOverride(artistId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current override for a specific artist
  const { data: override, isLoading } = useQuery({
    queryKey: ['pricing-override', artistId],
    queryFn: async () => {
      if (!artistId) return null;
      const { data, error } = await supabase
        .from('artist_pricing_overrides')
        .select('*')
        .eq('artist_id', artistId)
        .maybeSingle();
      
      if (error) throw error;
      return data as PricingOverride | null;
    },
    enabled: !!artistId,
  });

  // Fetch audit log for an artist
  const { data: auditLog, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['pricing-audit-log', artistId],
    queryFn: async () => {
      if (!artistId) return [];
      const { data, error } = await supabase
        .from('pricing_override_audit_log')
        .select('*')
        .eq('artist_id', artistId)
        .order('changed_at', { ascending: false });
      
      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: !!artistId,
  });

  // Grant or update pricing override
  const grantMutation = useMutation({
    mutationFn: async (input: PricingOverrideInput) => {
      if (!artistId || !user) throw new Error('Artist ID and user required');

      const oldValues = override ? { ...override } : null;
      
      // Set discount_percent based on status
      const discountPercent = input.status === 'beta_free' 
        ? 100 
        : input.status === 'discounted' 
          ? (input.discount_percent ?? 50)
          : 0;

      const newData = {
        artist_id: artistId,
        status: input.status,
        discount_percent: discountPercent,
        scope: input.scope ?? 'all',
        starts_at: input.starts_at ?? new Date().toISOString(),
        expires_at: input.expires_at ?? null,
        reason: input.reason,
        granted_by: user.id,
      };

      // Upsert the override
      const { data, error } = await supabase
        .from('artist_pricing_overrides')
        .upsert(newData, { onConflict: 'artist_id' })
        .select()
        .single();

      if (error) throw error;

      // Log the change
      await supabase.from('pricing_override_audit_log').insert({
        override_id: data.id,
        artist_id: artistId,
        action: oldValues ? 'updated' : 'created',
        old_values: oldValues,
        new_values: newData,
        changed_by: user.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-override', artistId] });
      queryClient.invalidateQueries({ queryKey: ['pricing-audit-log', artistId] });
      queryClient.invalidateQueries({ queryKey: ['pricing-overrides-list'] });
      toast.success('Pricing override saved');
    },
    onError: (error) => {
      toast.error('Failed to save pricing override: ' + error.message);
    },
  });

  // Revoke pricing override (set to standard)
  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!artistId || !user || !override) throw new Error('No override to revoke');

      const oldValues = { ...override };

      // Delete the override
      const { error } = await supabase
        .from('artist_pricing_overrides')
        .delete()
        .eq('artist_id', artistId);

      if (error) throw error;

      // Log the revocation
      await supabase.from('pricing_override_audit_log').insert({
        override_id: null,
        artist_id: artistId,
        action: 'revoked',
        old_values: oldValues,
        new_values: null,
        changed_by: user.id,
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-override', artistId] });
      queryClient.invalidateQueries({ queryKey: ['pricing-audit-log', artistId] });
      queryClient.invalidateQueries({ queryKey: ['pricing-overrides-list'] });
      toast.success('Pricing override revoked');
    },
    onError: (error) => {
      toast.error('Failed to revoke override: ' + error.message);
    },
  });

  return {
    override,
    auditLog,
    isLoading,
    isLoadingAudit,
    grant: grantMutation.mutate,
    revoke: revokeMutation.mutate,
    isGranting: grantMutation.isPending,
    isRevoking: revokeMutation.isPending,
  };
}

// Hook to fetch all overrides for admin list
export function useAllPricingOverrides() {
  return useQuery({
    queryKey: ['pricing-overrides-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_pricing_overrides')
        .select(`
          *,
          artist_profiles (
            id,
            artist_name,
            avatar_url,
            user_id
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Hook to get stats
export function usePricingOverrideStats() {
  return useQuery({
    queryKey: ['pricing-override-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_pricing_overrides')
        .select('status');
      
      if (error) throw error;

      const stats = {
        beta_free: 0,
        discounted: 0,
        standard: 0,
      };

      data?.forEach((item) => {
        if (item.status in stats) {
          stats[item.status as keyof typeof stats]++;
        }
      });

      // Get total artists count
      const { count: totalArtists } = await supabase
        .from('artist_profiles')
        .select('*', { count: 'exact', head: true });

      return {
        ...stats,
        total: totalArtists || 0,
        standard: (totalArtists || 0) - stats.beta_free - stats.discounted,
      };
    },
  });
}
