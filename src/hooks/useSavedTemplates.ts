import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SavedTemplate {
  id: string;
  artist_id: string;
  base_template_id: string;
  name: string;
  template_data: Record<string, unknown>;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  base_template?: {
    id: string;
    name: string;
    category: string;
    layout_config: Record<string, unknown>;
  };
}

export function useSavedTemplates(artistId: string | undefined) {
  return useQuery({
    queryKey: ['saved-templates', artistId],
    queryFn: async (): Promise<SavedTemplate[]> => {
      if (!artistId) return [];

      const { data, error } = await supabase
        .from('artist_saved_templates')
        .select(`
          *,
          base_template:spotlight_templates (
            id,
            name,
            category,
            layout_config
          )
        `)
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved templates:', error);
        return [];
      }

      return (data || []) as SavedTemplate[];
    },
    enabled: !!artistId,
  });
}

export function useSaveTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      artistId,
      baseTemplateId,
      name,
      templateData,
      thumbnailUrl,
    }: {
      artistId: string;
      baseTemplateId: string;
      name: string;
      templateData: Record<string, unknown>;
      thumbnailUrl?: string;
    }) => {
      const { data, error } = await supabase
        .from('artist_saved_templates')
        .insert({
          artist_id: artistId,
          base_template_id: baseTemplateId,
          name,
          template_data: templateData as any,
          thumbnail_url: thumbnailUrl || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-templates', variables.artistId] });
      toast.success('Template saved!');
    },
    onError: (error) => {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    },
  });
}

export function useDeleteSavedTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, artistId }: { templateId: string; artistId: string }) => {
      const { error } = await supabase
        .from('artist_saved_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      return { templateId, artistId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-templates', variables.artistId] });
      toast.success('Template deleted');
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    },
  });
}
