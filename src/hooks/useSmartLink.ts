import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { validateExternalLink } from '@/lib/smartLinkValidation';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SmartLinkPage = Database['public']['Tables']['smart_link_pages']['Row'];
type ExternalLink = Database['public']['Tables']['smart_link_external_links']['Row'];

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
        .single();

      if (pageData) {
        setSmartLinkPage(pageData);

        // Fetch external links
        const { data: linksData } = await supabase
          .from('smart_link_external_links')
          .select('*')
          .eq('smart_link_page_id', pageData.id)
          .order('display_order', { ascending: true });

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
      .single();
    
    return !data;
  };

  // Create or update smart link page
  const saveSmartLinkPage = async (data: { slug: string; title?: string; bio?: string }) => {
    if (!user) return null;
    
    setSaving(true);
    try {
      const artistId = await getArtistId();
      if (!artistId) {
        toast({ title: 'Error', description: 'Artist profile not found', variant: 'destructive' });
        return null;
      }

      const slug = data.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '');

      if (smartLinkPage) {
        // Update existing
        const { data: updated, error } = await supabase
          .from('smart_link_pages')
          .update({
            slug,
            title: data.title || null,
            bio: data.bio || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', smartLinkPage.id)
          .select()
          .single();

        if (error) throw error;
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
            title: data.title || null,
            bio: data.bio || null,
          })
          .select()
          .single();

        if (error) throw error;
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

    setSaving(true);
    try {
      // Validate the link
      const validation = validateExternalLink(platform, url);

      if (!validation.isValid && !validation.shouldFlag) {
        toast({ title: 'Invalid URL', description: validation.flagReason || 'Please enter a valid URL', variant: 'destructive' });
        return null;
      }

      // Get next display order
      const maxOrder = externalLinks.reduce((max, link) => Math.max(max, link.display_order), 0);

      const { data: created, error } = await supabase
        .from('smart_link_external_links')
        .insert({
          smart_link_page_id: smartLinkPage.id,
          platform,
          url: url.startsWith('http') ? url : `https://${url}`,
          display_order: maxOrder + 1,
          is_flagged: validation.shouldFlag,
          flag_reason: validation.flagReason,
        })
        .select()
        .single();

      if (error) throw error;

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
  const updateExternalLink = async (linkId: string, updates: { platform?: string; url?: string; is_active?: boolean }) => {
    setSaving(true);
    try {
      // Validate if URL changed
      if (updates.url && updates.platform) {
        const validation = validateExternalLink(updates.platform, updates.url);
        if (!validation.isValid && !validation.shouldFlag) {
          toast({ title: 'Invalid URL', description: validation.flagReason || 'Please enter a valid URL', variant: 'destructive' });
          return null;
        }
        updates = {
          ...updates,
          is_flagged: validation.shouldFlag,
          flag_reason: validation.flagReason,
        } as any;
      }

      const { data: updated, error } = await supabase
        .from('smart_link_external_links')
        .update(updates)
        .eq('id', linkId)
        .select()
        .single();

      if (error) throw error;

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
    setSaving(true);
    try {
      const { error } = await supabase
        .from('smart_link_external_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

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
    setSaving(true);
    try {
      const updates = linkIds.map((id, index) => ({
        id,
        display_order: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from('smart_link_external_links')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

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
