import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PlatformUpdate {
  id: string;
  title: string;
  content: string;
  category: string | null;
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

export interface ActivationLogEntry {
  id: string;
  update_id: string;
  action: 'activated' | 'deactivated';
  performed_by: string | null;
  performed_at: string;
}

const CATEGORIES = [
  { value: 'feature', label: 'New Feature' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'bugfix', label: 'Bug Fix' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'maintenance', label: 'Maintenance' },
] as const;

export const UPDATE_CATEGORIES = CATEGORIES;

export function usePlatformUpdates() {
  const [updates, setUpdates] = useState<PlatformUpdate[]>([]);
  const [activationLogs, setActivationLogs] = useState<Record<string, ActivationLogEntry[]>>({});
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

  const createUpdate = async (update: { 
    title: string; 
    content: string; 
    category?: string;
    target_roles: string[]; 
    visibility: string; 
    priority: string; 
    link_url?: string; 
    link_text?: string; 
    is_active: boolean 
  }) => {
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

  const logActivation = async (updateId: string, action: 'activated' | 'deactivated') => {
    // Store activation logs locally (could be moved to a dedicated table in the future)
    const logEntry: ActivationLogEntry = {
      id: crypto.randomUUID(),
      update_id: updateId,
      action,
      performed_by: user?.id || null,
      performed_at: new Date().toISOString(),
    };
    
    setActivationLogs(prev => ({
      ...prev,
      [updateId]: [...(prev[updateId] || []), logEntry],
    }));

    return logEntry;
  };

  const toggleUpdateActive = async (id: string, currentlyActive: boolean) => {
    const newActiveState = !currentlyActive;
    await updateUpdate(id, { is_active: newActiveState });
    await logActivation(id, newActiveState ? 'activated' : 'deactivated');
    return newActiveState;
  };

  const batchActivate = async (ids: string[]) => {
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          await updateUpdate(id, { is_active: true });
          await logActivation(id, 'activated');
          return { id, success: true };
        } catch (error) {
          return { id, success: false, error };
        }
      })
    );
    await fetchUpdates();
    return results;
  };

  const dismissUpdate = async (id: string) => {
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

  const getFilteredUpdates = (filters: {
    search?: string;
    status?: 'all' | 'active' | 'inactive';
    category?: string;
  }) => {
    let filtered = [...updates];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(u => 
        u.title.toLowerCase().includes(searchLower) || 
        u.content.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.status === 'active') {
      filtered = filtered.filter(u => u.is_active);
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(u => !u.is_active);
    }
    
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(u => u.category === filters.category);
    }
    
    return filtered;
  };

  useEffect(() => {
    fetchUpdates();
  }, [user]);

  return {
    updates,
    visibleUpdates: getVisibleUpdates(),
    activationLogs,
    loading,
    categories: CATEGORIES,
    createUpdate,
    updateUpdate,
    deleteUpdate,
    dismissUpdate,
    toggleUpdateActive,
    batchActivate,
    getFilteredUpdates,
    refetch: fetchUpdates
  };
}
