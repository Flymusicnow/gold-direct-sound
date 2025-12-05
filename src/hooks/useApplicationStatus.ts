import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useApplicationStatus(artistId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!artistId) return;

    const channel = supabase
      .channel('application-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'collab_applications',
          filter: `artist_id=eq.${artistId}`
        },
        (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old?.status;
          
          if (newStatus !== oldStatus) {
            // Show toast notification based on status change
            switch (newStatus) {
              case 'viewed':
                toast.info('Your application was viewed!', {
                  description: 'A brand is reviewing your submission'
                });
                break;
              case 'shortlisted':
                toast.success('🌟 You\'ve been shortlisted!', {
                  description: 'Your application made it to the shortlist'
                });
                break;
              case 'accepted':
                toast.success('🎉 Application Accepted!', {
                  description: 'Congratulations! Your application was accepted'
                });
                break;
              case 'rejected':
                toast.info('Application Update', {
                  description: 'Your application was not selected this time'
                });
                break;
            }

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['my-applications'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [artistId, queryClient]);
}