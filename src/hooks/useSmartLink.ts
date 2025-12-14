import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { validateExternalLink } from '@/lib/smartLinkValidation';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SmartLinkPage = Database['public']['Tables']['smart_link_pages']['Row'];
type ExternalLink = Database['public']['Tables']['smart_link_external_links']['Row'];

const MAX_ACTIONS_PER_DAY = 10;

export function useSmartLink() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [smartLinkPage, setSmartLinkPage] = useState<SmartLinkPage | null>(null);
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get artist profile ID for current user
  const getArtistId = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    
    const { data } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    return data?.id || null;
  }, [user]);

  // Check rate limit before action
  const checkRateLimit = async (artistId: string, actionType: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_smart_link_rate_limit', {
        _artist_id: artistId,
        _action_type: actionType,
        _max_actions: MAX_ACTIONS_PER_DAY
      });
      
      if (error) {
        console.error('Rate limit check error:', error);
        return true; // Allow action on error to not block users
      }
      
      return data === true;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true;
    }
  };

  // Record rate limit action
  const recordAction = async (artistId: string, actionType: string): Promise<void> => {
    try {
      await supabase.rpc('record_smart_link_action', {
        _artist_id: artistId,
        _action_type: actionType
      });
    } catch (error) {
      console.error('Failed to record action:', error);
    }
  };

  // Log audit event
  const logAuditEvent = async (
    entityType: 'page' | 'link',
    entityId: string,
    action: string,
    details: Record<string, unknown>
  ): Promise<void> => {
    if (!user) return;
    
    try {
      // Use any type to bypass strict typing for audit log
      await (supabase.from('smart_link_audit_log') as any).insert({
        entity_type: entityType,
        entity_id: entityId,
        action,
        performed_by: user.id,
        performed_by_role: 'artist',
        details,
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  };

  // Fetch smart link page and external links
  const fetchSmartLink = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const artistId = await getArtistId();
      if (!artistId) {
        setLoading(false);
        return;
      }

      // Fetch smart link page
      const { data: pageData } = await supabase
        .from('smart_link_pages')
        .select('*')
        .eq('artist_id', artistId)
        .maybeSingle();

      if (pageData) {
        setSmartLinkPage(pageData);

        // Fetch external links
        const { data: linksData } = await supabase
          .from('smart_link_external_links')
          .select('*')
          .eq('smart_link_page_id', pageData.id)
          .order('sort_order', { ascending: true });

        setExternalLinks(linksData || []);
      }
    } catch (error) {
      console.error('Error fetching smart link:', error);
    } finally {
      setLoading(false);
    }
  }, [user, getArtistId]);

  useEffect(() => {
    fetchSmartLink();
  }, [fetchSmartLink]);

  // Check if slug is available
  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    const { data } = await supabase
      .from('smart_link_pages')
      .select('id')
      .eq('slug', slug.toLowerCase())
      .maybeSingle();
    
    return !data;
  };

  // Create or update smart link page
  const saveSmartLinkPage = async (data: { slug: string }) => {
    if (!user) return null;
    
    const artistId = await getArtistId();
    if (!artistId) {
      toast({ title: 'Error', description: 'Artist profile not found', variant: 'destructive' });
      return null;
    }

    // Check rate limit
    const canProceed = await checkRateLimit(artistId, 'update_page');
    if (!canProceed) {
      toast({ 
        title: 'Rate Limit Reached', 
        description: `Maximum ${MAX_ACTIONS_PER_DAY} changes per day. Try again tomorrow.`, 
        variant: 'destructive' 
      });
      return null;
    }
    
    setSaving(true);
    try {
      const slug = data.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '');

      if (smartLinkPage) {
        // Update existing
        const { data: updated, error } = await supabase
          .from('smart_link_pages')
          .update({
            slug,
            updated_at: new Date().toISOString(),
          })
          .eq('id', smartLinkPage.id)
          .select()
          .single();

        if (error) throw error;
        
        // Record action and audit
        await recordAction(artistId, 'update_page');
        await logAuditEvent('page', smartLinkPage.id, 'update', { 
          old_slug: smartLinkPage.slug, 
          new_slug: slug 
        });
        
        setSmartLinkPage(updated);
        toast({ title: 'Saved', description: 'Smart link updated successfully' });
        return updated;
      } else {
        // Create new
        const { data: created, error } = await supabase
          .from('smart_link_pages')
          .insert({
            artist_id: artistId,
            slug,
          })
          .select()
          .single();

        if (error) throw error;
        
        // Record action and audit
        await recordAction(artistId, 'update_page');
        await logAuditEvent('page', created.id, 'create', { slug });
        
        setSmartLinkPage(created);
        toast({ title: 'Created', description: 'Smart link page created successfully' });
        return created;
      }
    } catch (error: any) {
      console.error('Error saving smart link page:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save smart link page', 
        variant: 'destructive' 
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Add external link with validation
  const addExternalLink = async (platform: string, url: string) => {
    if (!smartLinkPage) {
      toast({ title: 'Error', description: 'Create your smart link page first', variant: 'destructive' });
      return null;
    }

    const artistId = await getArtistId();
    if (!artistId) {
      toast({ title: 'Error', description: 'Artist profile not found', variant: 'destructive' });
      return null;
    }

    // Check rate limit
    const canProceed = await checkRateLimit(artistId, 'add_link');
    if (!canProceed) {
      toast({ 
        title: 'Rate Limit Reached', 
        description: `Maximum ${MAX_ACTIONS_PER_DAY} changes per day. Try again tomorrow.`, 
        variant: 'destructive' 
      });
      return null;
    }

    setSaving(true);
    try {
      // Validate the link
      const validation = validateExternalLink(platform, url);

      if (!validation.isValid && !validation.shouldFlag) {
        toast({ title: 'Invalid URL', description: validation.flagReason || 'Please enter a valid URL', variant: 'destructive' });
        return null;
      }

      // Get next sort order
      const maxOrder = externalLinks.reduce((max, link) => Math.max(max, link.sort_order), 0);
      const finalUrl = url.startsWith('http') ? url : `https://${url}`;

      const insertData: Database['public']['Tables']['smart_link_external_links']['Insert'] = {
        smart_link_page_id: smartLinkPage.id,
        artist_id: artistId,
        platform,
        url: finalUrl,
        sort_order: maxOrder + 1,
        status: validation.shouldFlag ? 'flagged' : 'active',
        flag_reason: validation.flagReason,
      };

      const { data: created, error } = await supabase
        .from('smart_link_external_links')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Record action and audit
      await recordAction(artistId, 'add_link');
      await logAuditEvent('link', created.id, 'create', { 
        platform, 
        url: finalUrl, 
        status: validation.shouldFlag ? 'flagged' : 'active' 
      });

      setExternalLinks(prev => [...prev, created]);

      if (validation.shouldFlag) {
        toast({ 
          title: 'Link Added (Under Review)', 
          description: 'This link has been flagged for review due to: ' + validation.flagReason,
          variant: 'default'
        });
      } else {
        toast({ title: 'Link Added', description: `${platform} link added successfully` });
      }

      return created;
    } catch (error: any) {
      console.error('Error adding external link:', error);
      toast({ title: 'Error', description: error.message || 'Failed to add link', variant: 'destructive' });
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Update external link
  const updateExternalLink = async (linkId: string, updates: { platform?: string; url?: string; status?: string }) => {
    const artistId = await getArtistId();
    if (!artistId) {
      toast({ title: 'Error', description: 'Artist profile not found', variant: 'destructive' });
      return null;
    }

    // Check rate limit
    const canProceed = await checkRateLimit(artistId, 'update_link');
    if (!canProceed) {
      toast({ 
        title: 'Rate Limit Reached', 
        description: `Maximum ${MAX_ACTIONS_PER_DAY} changes per day. Try again tomorrow.`, 
        variant: 'destructive' 
      });
      return null;
    }

    setSaving(true);
    try {
      // Validate if URL changed
      if (updates.url && updates.platform) {
        const validation = validateExternalLink(updates.platform, updates.url);
        if (!validation.isValid && !validation.shouldFlag) {
          toast({ title: 'Invalid URL', description: validation.flagReason || 'Please enter a valid URL', variant: 'destructive' });
          return null;
        }
        if (validation.shouldFlag) {
          updates.status = 'flagged';
        }
      }

      const { data: updated, error } = await supabase
        .from('smart_link_external_links')
        .update(updates)
        .eq('id', linkId)
        .select()
        .single();

      if (error) throw error;

      // Record action and audit
      await recordAction(artistId, 'update_link');
      await logAuditEvent('link', linkId, 'update', updates);

      setExternalLinks(prev => prev.map(link => link.id === linkId ? updated : link));
      toast({ title: 'Updated', description: 'Link updated successfully' });
      return updated;
    } catch (error: any) {
      console.error('Error updating external link:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update link', variant: 'destructive' });
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Delete external link
  const deleteExternalLink = async (linkId: string) => {
    const artistId = await getArtistId();
    if (!artistId) {
      toast({ title: 'Error', description: 'Artist profile not found', variant: 'destructive' });
      return false;
    }

    // Check rate limit
    const canProceed = await checkRateLimit(artistId, 'delete_link');
    if (!canProceed) {
      toast({ 
        title: 'Rate Limit Reached', 
        description: `Maximum ${MAX_ACTIONS_PER_DAY} changes per day. Try again tomorrow.`, 
        variant: 'destructive' 
      });
      return false;
    }

    setSaving(true);
    try {
      // Get link details before deletion for audit
      const linkToDelete = externalLinks.find(l => l.id === linkId);
      
      const { error } = await supabase
        .from('smart_link_external_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      // Record action and audit
      await recordAction(artistId, 'delete_link');
      await logAuditEvent('link', linkId, 'delete', { 
        platform: linkToDelete?.platform, 
        url: linkToDelete?.url 
      });

      setExternalLinks(prev => prev.filter(link => link.id !== linkId));
      toast({ title: 'Deleted', description: 'Link removed successfully' });
      return true;
    } catch (error: any) {
      console.error('Error deleting external link:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete link', variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Reorder links
  const reorderLinks = async (linkIds: string[]) => {
    const artistId = await getArtistId();
    if (!artistId) {
      return false;
    }

    // Check rate limit
    const canProceed = await checkRateLimit(artistId, 'reorder');
    if (!canProceed) {
      toast({ 
        title: 'Rate Limit Reached', 
        description: `Maximum ${MAX_ACTIONS_PER_DAY} changes per day. Try again tomorrow.`, 
        variant: 'destructive' 
      });
      return false;
    }

    setSaving(true);
    try {
      for (let i = 0; i < linkIds.length; i++) {
        await supabase
          .from('smart_link_external_links')
          .update({ sort_order: i + 1 })
          .eq('id', linkIds[i]);
      }

      // Record action and audit
      await recordAction(artistId, 'reorder');
      await logAuditEvent('page', smartLinkPage?.id || '', 'reorder', { new_order: linkIds });

      // Re-sort local state
      setExternalLinks(prev => {
        const sorted = [...prev].sort((a, b) => {
          const indexA = linkIds.indexOf(a.id);
          const indexB = linkIds.indexOf(b.id);
          return indexA - indexB;
        });
        return sorted;
      });

      return true;
    } catch (error) {
      console.error('Error reordering links:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    smartLinkPage,
    externalLinks,
    loading,
    saving,
    checkSlugAvailability,
    saveSmartLinkPage,
    addExternalLink,
    updateExternalLink,
    deleteExternalLink,
    reorderLinks,
    refetch: fetchSmartLink,
  };
}
