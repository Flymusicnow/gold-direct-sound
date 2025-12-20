import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChangelogEmailRequest {
  updateTitle: string;
  updateContent: string;
  updateVersion?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-changelog-email function invoked");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { updateTitle, updateContent, updateVersion }: ChangelogEmailRequest = await req.json();

    if (!updateTitle || !updateContent) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: updateTitle, updateContent" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get all active changelog subscribers
    const { data: subscribers, error: fetchError } = await supabase
      .from("changelog_subscriptions")
      .select("id, email, unsubscribe_token")
      .eq("is_active", true);

    if (fetchError) {
      console.error("Error fetching subscribers:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscribers" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("No active subscribers found");
      return new Response(
        JSON.stringify({ message: "No active subscribers", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending changelog email to ${subscribers.length} subscribers`);

    const baseUrl = supabaseUrl.replace(".supabase.co", "") || "";
    
    // Send emails to all subscribers using Resend REST API
    const emailPromises = subscribers.map(async (subscriber) => {
      const unsubscribeUrl = `${baseUrl}/changelog/unsubscribe?token=${subscriber.unsubscribe_token}`;
      
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "FlyMusic <updates@resend.dev>",
            to: [subscriber.email],
            subject: `🎵 FlyMusic Update: ${updateTitle}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
                  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                  .header { text-align: center; margin-bottom: 32px; }
                  .logo { font-size: 24px; font-weight: bold; color: #d4af37; }
                  .version { display: inline-block; background: rgba(212, 175, 55, 0.2); color: #d4af37; padding: 4px 12px; border-radius: 9999px; font-size: 12px; margin-top: 8px; }
                  .content { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
                  h1 { font-size: 24px; margin: 0 0 16px 0; }
                  p { line-height: 1.6; color: rgba(255, 255, 255, 0.8); margin: 0 0 16px 0; }
                  .cta { display: inline-block; background: linear-gradient(135deg, #d4af37, #b8860b); color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
                  .footer { text-align: center; font-size: 12px; color: rgba(255, 255, 255, 0.5); margin-top: 32px; }
                  .unsubscribe { color: rgba(255, 255, 255, 0.5); text-decoration: underline; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <div class="logo">🎵 FlyMusic</div>
                    ${updateVersion ? `<div class="version">v${updateVersion}</div>` : ''}
                  </div>
                  <div class="content">
                    <h1>${updateTitle}</h1>
                    <p>${updateContent}</p>
                    <a href="https://flymusic.se/changelog" class="cta">View Full Changelog</a>
                  </div>
                  <div class="footer">
                    <p>You're receiving this because you subscribed to FlyMusic changelog updates.</p>
                    <p><a href="${unsubscribeUrl}" class="unsubscribe">Unsubscribe from these emails</a></p>
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to send email");
        }

        return { success: true, email: subscriber.email };
      } catch (err: any) {
        console.error(`Failed to send to ${subscriber.email}:`, err);
        return { success: false, email: subscriber.email, error: err.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`Changelog emails sent: ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        message: "Changelog emails sent", 
        sent: successCount, 
        failed: failedCount,
        total: subscribers.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-changelog-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
