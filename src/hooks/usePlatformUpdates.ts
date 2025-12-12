import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PlatformUpdate {
  id: string;
  title: string;
  content: string;
  target_roles: string[];
  visibility: string;
  priority: string;
  link_url: string | null;
  link_text: string | null;
  image_url: string | null;
  is_active: boolean;
  published_at: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function usePlatformUpdates() {
  const [updates, setUpdates] = useState<PlatformUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, hasRole } = useAuth();

  const fetchUpdates = async () => {
    if (!user) {
      setUpdates([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('platform_updates')
        .select('*')
        .order('priority', { ascending: false })
        .order('published_at', { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error('Error fetching platform updates:', error);
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  const createUpdate = async (update: { title: string; content: string; target_roles: string[]; visibility: string; priority: string; link_url?: string; link_text?: string; is_active: boolean }) => {
    const { data, error } = await supabase
      .from('platform_updates')
      .insert([{ ...update, created_by: user?.id }])
      .select()
      .single();

    if (error) throw error;
    await fetchUpdates();
    return data;
  };

  const updateUpdate = async (id: string, update: Partial<PlatformUpdate>) => {
    const { data, error } = await supabase
      .from('platform_updates')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchUpdates();
    return data;
  };

  const deleteUpdate = async (id: string) => {
    const { error } = await supabase
      .from('platform_updates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchUpdates();
  };

  const dismissUpdate = async (id: string) => {
    // Store dismissed updates in localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedUpdates') || '[]');
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem('dismissedUpdates', JSON.stringify(dismissed));
    }
    setUpdates(prev => prev.filter(u => u.id !== id));
  };

  const getVisibleUpdates = () => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedUpdates') || '[]');
    return updates.filter(u => !dismissed.includes(u.id));
  };

  useEffect(() => {
    fetchUpdates();
  }, [user]);

  return {
    updates,
    visibleUpdates: getVisibleUpdates(),
    loading,
    createUpdate,
    updateUpdate,
    deleteUpdate,
    dismissUpdate,
    refetch: fetchUpdates
  };
}
