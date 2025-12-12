import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrandStatusEmailRequest {
  email: string;
  contactPerson: string;
  companyName: string;
  status: "approved" | "rejected" | "changes_requested";
  adminNotes?: string;
}

const getEmailContent = (status: string, companyName: string, contactPerson: string, adminNotes?: string) => {
  switch (status) {
    case "approved":
      return {
        subject: `🎉 Your FlyMusic Partnership Application is Approved!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #E8BF1A;">Welcome to FlyMusic Gold, ${contactPerson}!</h1>
            <p>Great news! Your partnership application for <strong>${companyName}</strong> has been approved.</p>
            <h2>Next Steps:</h2>
            <ol>
              <li>Log in to your FlyMusic Brand Portal</li>
              <li>Complete your brand profile setup</li>
              <li>Start discovering and connecting with artists</li>
            </ol>
            <p>Our team is excited to have you on board!</p>
            <a href="https://flymusic.se/brand" style="display: inline-block; background: linear-gradient(135deg, #E8BF1A, #D4A816); color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Brand Portal</a>
            <p style="color: #666; margin-top: 24px;">Best regards,<br>The FlyMusic Team</p>
          </div>
        `,
      };
    case "rejected":
      return {
        subject: `Update on Your FlyMusic Partnership Application`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Hello ${contactPerson},</h1>
            <p>Thank you for your interest in partnering with FlyMusic Gold.</p>
            <p>After careful review, we've decided not to move forward with your application for <strong>${companyName}</strong> at this time.</p>
            ${adminNotes ? `<p><strong>Feedback:</strong> ${adminNotes}</p>` : ""}
            <p>This doesn't mean the door is closed forever. As FlyMusic grows, we encourage you to apply again in the future.</p>
            <p style="color: #666; margin-top: 24px;">Best regards,<br>The FlyMusic Team</p>
          </div>
        `,
      };
    case "changes_requested":
      return {
        subject: `Action Required: Your FlyMusic Partnership Application`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Hello ${contactPerson},</h1>
            <p>Thank you for applying to partner with FlyMusic Gold.</p>
            <p>We've reviewed your application for <strong>${companyName}</strong> and need some additional information before we can proceed.</p>
            ${adminNotes ? `<p><strong>What we need:</strong> ${adminNotes}</p>` : "<p>Please reply to this email with any additional details about your company and partnership goals.</p>"}
            <p>Once we receive the requested information, we'll continue reviewing your application.</p>
            <p style="color: #666; margin-top: 24px;">Best regards,<br>The FlyMusic Team</p>
          </div>
        `,
      };
    default:
      return {
        subject: `Update on Your FlyMusic Partnership Application`,
        html: `<p>Your application status has been updated.</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, contactPerson, companyName, status, adminNotes }: BrandStatusEmailRequest = await req.json();

    console.log(`Sending ${status} email to ${email} for ${companyName}`);

    const { subject, html } = getEmailContent(status, companyName, contactPerson, adminNotes);

    const emailResponse = await resend.emails.send({
      from: "FlyMusic <noreply@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending brand status email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
