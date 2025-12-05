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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const month = now.getMonth() === 0 ? 12 : now.getMonth(); // Previous month
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    console.log(`Generating wraps for ${month}/${year}`);

    // Get all fans (users with fan role)
    const { data: fans, error: fansError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'fan');

    if (fansError) throw fansError;

    const wrapsGenerated: string[] = [];

    for (const fan of fans || []) {
      const userId = fan.user_id;

      // Get top artists (from follows and support scores)
      const { data: supportScores } = await supabase
        .from('fan_support_scores')
        .select('artist_id, score, artist_profiles!inner(artist_name, avatar_url)')
        .eq('fan_user_id', userId)
        .order('score', { ascending: false })
        .limit(5);

      const topArtists = supportScores?.map((s: any) => ({
        artist_id: s.artist_id,
        artist_name: s.artist_profiles?.artist_name,
        avatar_url: s.artist_profiles?.avatar_url,
        score: s.score,
      })) || [];

      // Get liked tracks as proxy for top tracks
      const { data: likedTracks } = await supabase
        .from('likes')
        .select('track_id, tracks!inner(title, artist_id, artist_profiles!inner(artist_name))')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .limit(5);

      const topTracks = likedTracks?.map((l: any) => ({
        track_id: l.track_id,
        title: l.tracks?.title,
        artist_name: l.tracks?.artist_profiles?.artist_name,
      })) || [];

      // Calculate total XP earned this month
      const { data: xpData } = await supabase
        .from('fan_support_scores')
        .select('score')
        .eq('fan_user_id', userId)
        .gte('updated_at', startDate.toISOString())
        .lte('updated_at', endDate.toISOString());

      const totalXp = xpData?.reduce((sum: number, x: any) => sum + (x.score || 0), 0) || 0;

      // Count new artists discovered (follows this month)
      const { count: artistsDiscovered } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('fan_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Count spotlight votes this month
      const { count: spotlightVotes } = await supabase
        .from('spotlight_votes')
        .select('*', { count: 'exact', head: true })
        .eq('fan_user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Count total plays (likes as proxy)
      const { count: totalPlays } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Upsert the monthly wrap
      const { error: upsertError } = await supabase
        .from('fan_monthly_wraps')
        .upsert({
          user_id: userId,
          month,
          year,
          top_artists: topArtists,
          top_tracks: topTracks,
          total_xp_earned: totalXp,
          artists_discovered: artistsDiscovered || 0,
          spotlight_votes_cast: spotlightVotes || 0,
          total_plays: totalPlays || 0,
          generated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,month,year',
        });

      if (upsertError) {
        console.error(`Error generating wrap for ${userId}:`, upsertError);
        continue;
      }

      // Create notification for the fan
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'fly_wrapped',
          title: '🎵 Your FlyWrapped is Ready!',
          message: `Check out your music journey for ${getMonthName(month)} ${year}`,
          link: '/fan/wrapped',
          metadata: { month, year },
        });

      wrapsGenerated.push(userId);
    }

    console.log(`Generated ${wrapsGenerated.length} wraps`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        wrapsGenerated: wrapsGenerated.length,
        month,
        year 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating monthly wraps:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getMonthName(month: number): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
}
