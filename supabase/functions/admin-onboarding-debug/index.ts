import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DebugInput {
  email?: string;
  invite_code?: string;
  artist_id?: string;
}

interface InviteResult {
  provided: boolean;
  exists: boolean;
  active: boolean;
  used: boolean;
  replaced: boolean;
  email_bound: boolean;
  email_match: boolean | null;
  role_type: string | null;
  reason: string | null;
  expires_at?: string | null;
  status?: string;
}

interface UserResult {
  email_provided: boolean;
  exists: boolean;
  user_id: string | null;
  roles: string[];
  artist_profile_exists: boolean | null;
  artist_profile_status?: string | null;
}

interface LegalResult {
  terms_ok: boolean | null;
  nda_ok: boolean | null;
  terms_version: string | null;
  nda_version: string | null;
  terms_accepted_at: string | null;
  nda_accepted_at: string | null;
}

interface DebugError {
  code: string;
  message: string;
}

interface DebugResponse {
  invite: InviteResult;
  user: UserResult;
  legal: LegalResult;
  next_step: string;
  recommended_route: string;
  errors: DebugError[];
}

Deno.serve(async (req) => {
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: { ...corsHeaders, "X-Correlation-ID": correlationId } 
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Create admin client for read-only queries
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Correlation-ID": correlationId } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.log(`[${correlationId}] Auth failed:`, authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Correlation-ID": correlationId } }
      );
    }

    // 2. Multi-role safe admin check (NEVER use .single())
    const { data: adminRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"]);

    if (rolesError || !adminRoles || adminRoles.length === 0) {
      console.log(`[${correlationId}] Access denied - not admin. User: ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Correlation-ID": correlationId } }
      );
    }

    console.log(`[${correlationId}] Admin verified: ${user.id}, roles: ${adminRoles.map(r => r.role).join(", ")}`);

    // 3. Parse input
    const input: DebugInput = await req.json();
    const { email, invite_code, artist_id } = input;

    // Validate at least one input provided
    if (!email && !invite_code && !artist_id) {
      return new Response(
        JSON.stringify({ 
          error: "At least one of email, invite_code, or artist_id must be provided",
          guidance: "Provide email to check user state, invite_code to validate invite, or artist_id to check artist profile"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Correlation-ID": correlationId } }
      );
    }

    const errors: DebugError[] = [];
    let resolvedEmail = email;
    let resolvedUserId: string | null = null;

    // Initialize results
    const inviteResult: InviteResult = {
      provided: !!invite_code,
      exists: false,
      active: false,
      used: false,
      replaced: false,
      email_bound: false,
      email_match: null,
      role_type: null,
      reason: null,
    };

    const userResult: UserResult = {
      email_provided: !!email,
      exists: false,
      user_id: null,
      roles: [],
      artist_profile_exists: null,
    };

    const legalResult: LegalResult = {
      terms_ok: null,
      nda_ok: null,
      terms_version: null,
      nda_version: null,
      terms_accepted_at: null,
      nda_accepted_at: null,
    };

    // 4. Check invite code (READ-ONLY)
    if (invite_code) {
      const normalizedCode = invite_code.trim().toUpperCase().replace(/-/g, "");
      
      // Query beta_invites
      const { data: invite, error: inviteError } = await supabaseAdmin
        .from("beta_invites")
        .select("*")
        .or(`code.eq.${invite_code},code.ilike.${invite_code}`)
        .limit(1);

      if (inviteError) {
        errors.push({ code: "INVITE_QUERY_ERROR", message: inviteError.message });
      } else if (invite && invite.length > 0) {
        const inv = invite[0];
        inviteResult.exists = true;
        inviteResult.status = inv.status;
        inviteResult.active = inv.status === "sent" || inv.status === "pending";
        inviteResult.used = inv.status === "redeemed" || !!inv.redeemed_at;
        inviteResult.replaced = !!inv.replaced_by || inv.status === "replaced";
        inviteResult.email_bound = !!inv.email;
        inviteResult.role_type = inv.role || null;

        if (inv.email) {
          // If email provided, check match
          if (email) {
            inviteResult.email_match = inv.email.toLowerCase() === email.toLowerCase();
          }
          // Use invite email as resolved email if not provided
          if (!resolvedEmail) {
            resolvedEmail = inv.email;
          }
        }

        // Set reason based on status
        if (inviteResult.replaced) {
          inviteResult.reason = `Code replaced on ${inv.replaced_at || "unknown date"}`;
        } else if (inviteResult.used) {
          inviteResult.reason = `Code redeemed on ${inv.redeemed_at || "unknown date"}`;
        } else if (!inviteResult.active) {
          inviteResult.reason = `Code status: ${inv.status}`;
        }
      } else {
        inviteResult.reason = "Code not found in beta_invites";
      }
    }

    // 5. Resolve user by email or artist_id (READ-ONLY)
    if (resolvedEmail) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name")
        .eq("email", resolvedEmail.toLowerCase())
        .limit(1);

      if (profileError) {
        errors.push({ code: "PROFILE_QUERY_ERROR", message: profileError.message });
      } else if (profile && profile.length > 0) {
        userResult.exists = true;
        userResult.user_id = profile[0].id;
        resolvedUserId = profile[0].id;
      }
    }

    // If artist_id provided, get user from artist_profiles
    if (artist_id && !resolvedUserId) {
      const { data: artistProfile, error: artistError } = await supabaseAdmin
        .from("artist_profiles")
        .select("id, user_id, artist_name, status")
        .eq("id", artist_id)
        .limit(1);

      if (artistError) {
        errors.push({ code: "ARTIST_PROFILE_QUERY_ERROR", message: artistError.message });
      } else if (artistProfile && artistProfile.length > 0) {
        resolvedUserId = artistProfile[0].user_id;
        userResult.user_id = resolvedUserId;
        userResult.exists = true;
        userResult.artist_profile_exists = true;
        userResult.artist_profile_status = artistProfile[0].status;
      }
    }

    // 6. Get user roles (READ-ONLY, multi-role safe)
    if (resolvedUserId) {
      const { data: roles, error: rolesQueryError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", resolvedUserId);

      if (rolesQueryError) {
        errors.push({ code: "ROLES_QUERY_ERROR", message: rolesQueryError.message });
      } else if (roles) {
        userResult.roles = roles.map(r => r.role);
      }

      // Check artist profile if not already checked
      if (userResult.artist_profile_exists === null) {
        const { data: artistCheck, error: artistCheckError } = await supabaseAdmin
          .from("artist_profiles")
          .select("id, status")
          .eq("user_id", resolvedUserId)
          .limit(1);

        if (artistCheckError) {
          errors.push({ code: "ARTIST_CHECK_ERROR", message: artistCheckError.message });
        } else {
          userResult.artist_profile_exists = artistCheck && artistCheck.length > 0;
          if (artistCheck && artistCheck.length > 0) {
            userResult.artist_profile_status = artistCheck[0].status;
          }
        }
      }
    }

    // 7. Check legal acceptance (READ-ONLY)
    if (resolvedUserId) {
      // Get current document versions
      const { data: docs, error: docsError } = await supabaseAdmin
        .from("legal_documents")
        .select("document_type, current_version")
        .in("document_type", ["terms_of_service", "nda", "artist_agreement"]);

      const currentVersions: Record<string, string> = {};
      if (!docsError && docs) {
        docs.forEach(d => {
          currentVersions[d.document_type] = d.current_version;
        });
      }

      // Get user acceptances
      const { data: acceptances, error: acceptError } = await supabaseAdmin
        .from("legal_acceptances")
        .select("document_type, document_version, accepted_at")
        .eq("user_id", resolvedUserId);

      if (acceptError) {
        errors.push({ code: "LEGAL_QUERY_ERROR", message: acceptError.message });
      } else if (acceptances) {
        const termsAcceptance = acceptances.find(a => 
          a.document_type === "terms_of_service" || a.document_type === "artist_agreement"
        );
        const ndaAcceptance = acceptances.find(a => a.document_type === "nda");

        if (termsAcceptance) {
          legalResult.terms_version = termsAcceptance.document_version;
          legalResult.terms_accepted_at = termsAcceptance.accepted_at;
          // Check if current version matches
          const currentTermsVersion = currentVersions["terms_of_service"] || currentVersions["artist_agreement"];
          legalResult.terms_ok = !currentTermsVersion || termsAcceptance.document_version === currentTermsVersion;
        } else {
          legalResult.terms_ok = false;
        }

        if (ndaAcceptance) {
          legalResult.nda_version = ndaAcceptance.document_version;
          legalResult.nda_accepted_at = ndaAcceptance.accepted_at;
          const currentNdaVersion = currentVersions["nda"];
          legalResult.nda_ok = !currentNdaVersion || ndaAcceptance.document_version === currentNdaVersion;
        } else {
          // NDA might not be required for all users
          legalResult.nda_ok = null; // Unknown/not required
        }
      }
    }

    // 8. Compute next_step and recommended_route
    let next_step = "unknown";
    let recommended_route = "/auth/login";

    if (!userResult.exists && inviteResult.exists && !inviteResult.used && !inviteResult.replaced) {
      // User doesn't exist but has valid invite
      next_step = "redeem_invite";
      recommended_route = "/auth/invite";
    } else if (!userResult.exists) {
      // No user, no valid invite
      next_step = "register";
      recommended_route = "/early-access";
    } else if (userResult.exists) {
      // User exists - check what's missing
      const isArtist = userResult.roles.includes("artist");
      
      if (isArtist && !userResult.artist_profile_exists) {
        next_step = "create_artist_profile";
        recommended_route = "/onboarding/artist-profile";
      } else if (legalResult.terms_ok === false) {
        next_step = "accept_legal";
        recommended_route = "/legal/artist-agreement";
      } else if (isArtist && userResult.artist_profile_status === "pending") {
        next_step = "await_approval";
        recommended_route = "/studio";
      } else if (isArtist) {
        next_step = "go_to_studio";
        recommended_route = "/studio";
      } else if (userResult.roles.includes("fan")) {
        next_step = "go_to_fan_portal";
        recommended_route = "/fan";
      } else if (userResult.roles.includes("admin") || userResult.roles.includes("super_admin")) {
        next_step = "go_to_admin";
        recommended_route = "/admin";
      } else {
        next_step = "assign_role";
        recommended_route = "/role-selection";
      }
    }

    const response: DebugResponse = {
      invite: inviteResult,
      user: userResult,
      legal: legalResult,
      next_step,
      recommended_route,
      errors,
    };

    const executionTime = Date.now() - startTime;
    console.log(`[${correlationId}] Debug complete in ${executionTime}ms. Next step: ${next_step}`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Correlation-ID": correlationId,
          "X-Execution-Time": `${executionTime}ms`
        } 
      }
    );

  } catch (error) {
    console.error(`[${correlationId}] Error:`, error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Correlation-ID": correlationId
        } 
      }
    );
  }
});
