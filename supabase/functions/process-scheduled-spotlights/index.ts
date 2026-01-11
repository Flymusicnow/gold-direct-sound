import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all scheduled spotlights that should be published
    const now = new Date().toISOString();
    
    const { data: scheduledItems, error: fetchError } = await supabase
      .from("artist_spotlight_media")
      .select("id, artist_id, scheduled_for")
      .eq("publish_status", "scheduled")
      .lte("scheduled_for", now);

    if (fetchError) {
      console.error("Error fetching scheduled spotlights:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!scheduledItems || scheduledItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No scheduled spotlights to publish", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update each to published status
    const ids = scheduledItems.map(item => item.id);
    
    const { error: updateError } = await supabase
      .from("artist_spotlight_media")
      .update({
        publish_status: "published",
        is_active: true,
      })
      .in("id", ids);

    if (updateError) {
      console.error("Error publishing spotlights:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Published ${ids.length} scheduled spotlights:`, ids);

    return new Response(
      JSON.stringify({ 
        message: `Successfully published ${ids.length} scheduled spotlights`,
        processed: ids.length,
        ids 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
