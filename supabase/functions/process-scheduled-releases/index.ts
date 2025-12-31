import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();
  
  const log = (step: string, details?: Record<string, unknown>) => {
    console.log(`[PROCESS-SCHEDULED-RELEASES][${correlationId}] ${step}`, details ? JSON.stringify(details) : '');
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    log('STARTING');

    // Call the database function to process scheduled releases
    const { data, error } = await supabase.rpc('process_scheduled_releases');

    if (error) {
      log('RPC_ERROR', { error: error.message });
      return new Response(
        JSON.stringify({ success: false, error: error.message, correlation_id: correlationId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    log('COMPLETE', { result: data, execution_time_ms: Date.now() - startTime });

    // Persist log
    await supabase.from('edge_function_logs').insert({
      correlation_id: correlationId,
      function_name: 'process-scheduled-releases',
      step: 'COMPLETE',
      level: 'info',
      message: 'Scheduled releases processed',
      details: data,
      execution_time_ms: Date.now() - startTime,
      status_code: 200
    });

    return new Response(
      JSON.stringify({ ...data, correlation_id: correlationId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log('UNHANDLED_ERROR', { error: message });
    return new Response(
      JSON.stringify({ success: false, error: message, correlation_id: correlationId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
