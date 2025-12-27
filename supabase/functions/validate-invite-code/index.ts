import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invite code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for RPC call
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the RPC function to validate code and create session
    const { data, error } = await supabase.rpc('validate_fan_invite_code', {
      _code: code.trim()
    });

    if (error) {
      console.error('RPC error:', error);
      return new Response(
        JSON.stringify({ valid: false, error: 'Failed to validate code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.valid) {
      return new Response(
        JSON.stringify({ valid: false, error: data.error || 'Invalid invite code' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build response with httpOnly cookie
    const expiresAt = new Date(data.expires_at);
    const cookieHeader = `fan_invite_token=${data.token}; HttpOnly; Secure; SameSite=Strict; Path=/; Expires=${expiresAt.toUTCString()}`;

    console.log('Invite code validated successfully:', { token: data.token.substring(0, 8) + '...' });

    return new Response(
      JSON.stringify({
        valid: true,
        token: data.token,
        expires_at: data.expires_at,
        badge_name: data.badge_name
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader
        }
      }
    );
  } catch (err) {
    console.error('Error in validate-invite-code:', err);
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
