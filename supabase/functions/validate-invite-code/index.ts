import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();
  
  const log = (step: string, details?: Record<string, unknown>) => {
    console.log(`[VALIDATE-INVITE][${correlationId}] ${step}`, details ? JSON.stringify(details) : '');
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    log('REQUEST_RECEIVED', { code: code?.substring?.(0, 4) + '...' });

    if (!code || typeof code !== 'string') {
      log('VALIDATION_ERROR', { reason: 'missing_code' });
      return new Response(
        JSON.stringify({ valid: false, error: 'Invite code is required', correlation_id: correlationId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for RPC call
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Normalize code: trim, uppercase, remove hyphens and spaces
    const normalizedCode = code.trim().toUpperCase().replace(/-/g, '').replace(/\s/g, '');
    
    log('CODE_NORMALIZED', { original: code, normalized: normalizedCode });

    // Call the universal RPC function that searches beta_invites table
    const { data, error } = await supabase.rpc('validate_invite_code_universal', {
      _code: code.trim()
    });

    if (error) {
      log('RPC_ERROR', { error: error.message, code: error.code });
      
      // Persist error log
      await supabase.from('edge_function_logs').insert({
        correlation_id: correlationId,
        function_name: 'validate-invite-code',
        step: 'RPC_ERROR',
        level: 'error',
        message: error.message,
        details: { error_code: error.code },
        execution_time_ms: Date.now() - startTime,
        status_code: 500
      });
      
      return new Response(
        JSON.stringify({ valid: false, error: 'Failed to validate code', correlation_id: correlationId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.valid) {
      const errorMessage = data.error || 'Invalid invite code';
      log('CODE_INVALID', { error: errorMessage });
      
      // Determine specific status code based on error
      let statusCode = 404;
      if (errorMessage.includes('already been used')) {
        statusCode = 409; // Conflict - already used
      } else if (errorMessage.includes('not yet active') || errorMessage.includes('pending')) {
        statusCode = 410; // Gone - not active
      } else if (errorMessage.includes('replaced')) {
        statusCode = 410; // Gone - replaced by new code
      }
      
      return new Response(
        JSON.stringify({ valid: false, error: errorMessage, correlation_id: correlationId }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the invite was replaced (additional check in case RPC doesn't handle it)
    if (data.status === 'replaced') {
      log('CODE_REPLACED', { code: code?.substring?.(0, 4) + '...' });
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'This code was replaced. Please check your email for a new invite code.',
          correlation_id: correlationId 
        }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build response with httpOnly cookie
    const expiresAt = new Date(data.expires_at);
    const cookieHeader = `fan_invite_token=${data.token}; HttpOnly; Secure; SameSite=Strict; Path=/; Expires=${expiresAt.toUTCString()}`;

    log('CODE_VALIDATED', { 
      token: data.token.substring(0, 8) + '...', 
      role: data.role,
      invite_id: data.invite_id,
      execution_time_ms: Date.now() - startTime
    });

    // Persist success log
    await supabase.from('edge_function_logs').insert({
      correlation_id: correlationId,
      function_name: 'validate-invite-code',
      step: 'SUCCESS',
      level: 'info',
      message: 'Invite code validated successfully',
      details: { role: data.role, invite_id: data.invite_id },
      execution_time_ms: Date.now() - startTime,
      status_code: 200
    });

    return new Response(
      JSON.stringify({
        valid: true,
        token: data.token,
        expires_at: data.expires_at,
        badge_name: data.badge_name,
        role: data.role,
        email: data.email,
        invite_id: data.invite_id,
        correlation_id: correlationId
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
    log('UNHANDLED_ERROR', { error: err instanceof Error ? err.message : String(err) });
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error', correlation_id: correlationId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
