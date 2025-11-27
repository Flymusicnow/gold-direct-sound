import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active campaigns
    const { data: campaigns } = await supabaseClient
      .from('spotlight_campaigns')
      .select('id')
      .eq('status', 'active');

    if (!campaigns || campaigns.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active campaigns' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalNotifications = 0;

    // Process each campaign
    for (const campaign of campaigns) {
      // Get all approved entries ordered by votes
      const { data: entries } = await supabaseClient
        .from('spotlight_entries')
        .select(`
          id,
          cached_rank,
          total_votes,
          artist_id,
          title,
          tracks!inner (title),
          artist_profiles!inner (user_id, artist_name)
        `)
        .eq('campaign_id', campaign.id)
        .eq('status', 'approved')
        .order('total_votes', { ascending: false });

      if (!entries) continue;

      // Calculate current ranks and check for changes
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const currentRank = i + 1;
        const previousRank = entry.cached_rank;

        // Update cached rank
        await supabaseClient
          .from('spotlight_entries')
          .update({ cached_rank: currentRank })
          .eq('id', entry.id);

        // Check for significant rank changes (top 20)
        if (previousRank && previousRank !== currentRank && currentRank <= 20) {
          const direction = currentRank < previousRank ? 'up' : 'down';
          const tracks = entry.tracks as any;
          const artistProfiles = entry.artist_profiles as any;
          const trackTitle = entry.title || tracks?.title || 'Your track';

          // Create artist notification
          await supabaseClient.from('notifications').insert({
            user_id: artistProfiles.user_id,
            type: 'spotlight_rank_change',
            title: 'Your Spotlight Rank Changed!',
            message: `${trackTitle} moved ${direction} to #${currentRank} in Spotlight`,
            link: `/spotlight/${campaign.id}`,
            metadata: {
              entry_id: entry.id,
              campaign_id: campaign.id,
              current_rank: currentRank,
              previous_rank: previousRank,
            },
          });

          totalNotifications++;
        }

        // Check if artist entered top 10 (notify fans)
        if (currentRank <= 10 && (!previousRank || previousRank > 10)) {
          // Get all fans following this artist
          const { data: followers } = await supabaseClient
            .from('follows')
            .select('fan_id')
            .eq('artist_id', entry.artist_id);

          if (followers) {
            const tracks = entry.tracks as any;
            const artistProfiles = entry.artist_profiles as any;
            const artistName = artistProfiles.artist_name;
            const trackTitle = entry.title || tracks?.title || 'their track';

            for (const follower of followers) {
              await supabaseClient.from('notifications').insert({
                user_id: follower.fan_id,
                type: 'spotlight_rank_milestone',
                title: 'Your Artist Hit Top 10!',
                message: `${artistName} is now #${currentRank} in FlyMusic Spotlight with "${trackTitle}"`,
                link: `/spotlight/${campaign.id}`,
                metadata: {
                  entry_id: entry.id,
                  campaign_id: campaign.id,
                  artist_id: entry.artist_id,
                  current_rank: currentRank,
                },
              });

              totalNotifications++;
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed rank changes`,
        notifications_created: totalNotifications,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking spotlight ranks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
