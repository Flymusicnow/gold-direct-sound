import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import React from "https://esm.sh/react@18.3.1";

import { WelcomeEmail } from "./_templates/welcome.tsx";
import { MagicLinkEmail } from "./_templates/magic-link.tsx";
import { PasswordRecoveryEmail } from "./_templates/password-recovery.tsx";
import { EmailChangeEmail } from "./_templates/email-change.tsx";
import { PasswordChangedEmail } from "./_templates/password-changed.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("AUTH_EMAIL_HOOK_SECRET") as string;

interface AuthEmailPayload {
  user: {
    email: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

const getEmailContent = async (
  eventType: string,
  payload: AuthEmailPayload
): Promise<{ subject: string; html: string } | null> => {
  const { user, email_data } = payload;
  const userName = user.user_metadata?.full_name || user.user_metadata?.name || "there";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  
  // Build the confirmation URL
  const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${email_data.redirect_to}`;

  switch (eventType) {
    case "signup": {
      const html = await renderAsync(
        React.createElement(WelcomeEmail, {
          userName,
          confirmUrl,
          token: email_data.token,
        })
      );
      return { subject: "Welcome to FlyMusic - Confirm Your Email", html };
    }
    
    case "magiclink": {
      const html = await renderAsync(
        React.createElement(MagicLinkEmail, {
          userName,
          loginUrl: confirmUrl,
          token: email_data.token,
        })
      );
      return { subject: "Your FlyMusic Login Link", html };
    }
    
    case "recovery": {
      const html = await renderAsync(
        React.createElement(PasswordRecoveryEmail, {
          userName,
          resetUrl: confirmUrl,
          token: email_data.token,
        })
      );
      return { subject: "Reset Your FlyMusic Password", html };
    }
    
    case "email_change": {
      const html = await renderAsync(
        React.createElement(EmailChangeEmail, {
          userName,
          confirmUrl,
          token: email_data.token,
        })
      );
      return { subject: "Confirm Your New Email Address", html };
    }
    
    case "password_changed": {
      const html = await renderAsync(
        React.createElement(PasswordChangedEmail, {
          userName,
        })
      );
      return { subject: "Your FlyMusic Password Was Changed", html };
    }
    
    default:
      console.log(`Unknown email action type: ${eventType}`);
      return null;
  }
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  
  // Validate webhook signature
  const wh = new Webhook(hookSecret);
  let parsedPayload: AuthEmailPayload;
  
  try {
    parsedPayload = wh.verify(payload, headers) as AuthEmailPayload;
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return new Response(
      JSON.stringify({ error: { http_code: 401, message: "Invalid signature" } }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const eventType = parsedPayload.email_data.email_action_type;
  console.log(`Processing auth email: ${eventType} for ${parsedPayload.user.email}`);

  try {
    const emailContent = await getEmailContent(eventType, parsedPayload);
    
    if (!emailContent) {
      console.log(`No email template for event type: ${eventType}`);
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error } = await resend.emails.send({
      from: "FlyMusic <noreply@flymusic.se>",
      to: [parsedPayload.user.email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log(`Email sent successfully: ${eventType} to ${parsedPayload.user.email}`);
    
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: error.message } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
