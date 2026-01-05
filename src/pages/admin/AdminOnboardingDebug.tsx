import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Copy, 
  ChevronDown, 
  Search, 
  User, 
  FileCheck,
  Loader2,
  Shield,
  ExternalLink
} from "lucide-react";

interface DebugResult {
  invite: {
    provided: boolean;
    exists: boolean;
    active: boolean;
    used: boolean;
    replaced: boolean;
    email_bound: boolean;
    email_match: boolean | null;
    role_type: string | null;
    reason: string | null;
    status?: string;
  };
  user: {
    email_provided: boolean;
    exists: boolean;
    user_id: string | null;
    roles: string[];
    artist_profile_exists: boolean | null;
    artist_profile_status?: string | null;
  };
  legal: {
    terms_ok: boolean | null;
    nda_ok: boolean | null;
    terms_version: string | null;
    nda_version: string | null;
    terms_accepted_at: string | null;
    nda_accepted_at: string | null;
  };
  next_step: string;
  recommended_route: string;
  errors: Array<{ code: string; message: string }>;
}

const StatusIcon = ({ status }: { status: boolean | null }) => {
  if (status === true) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === false) return <XCircle className="h-4 w-4 text-destructive" />;
  return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
};

const CheckItem = ({ label, status, detail }: { label: string; status: boolean | null; detail?: string }) => (
  <div className="flex items-start gap-2 py-1">
    <StatusIcon status={status} />
    <div className="flex-1">
      <span className="text-sm">{label}</span>
      {detail && <span className="text-xs text-muted-foreground ml-2">({detail})</span>}
    </div>
  </div>
);

export default function AdminOnboardingDebug() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [artistId, setArtistId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [jsonOpen, setJsonOpen] = useState(false);

  const runDiagnostic = async (type: "invite" | "user" | "full") => {
    if (!session?.access_token) {
      toast.error("Not authenticated");
      return;
    }

    const payload: Record<string, string> = {};
    
    if (type === "invite" && inviteCode) {
      payload.invite_code = inviteCode;
    } else if (type === "user" && email) {
      payload.email = email;
    } else if (type === "full") {
      if (email) payload.email = email;
      if (inviteCode) payload.invite_code = inviteCode;
      if (artistId) payload.artist_id = artistId;
    }

    if (Object.keys(payload).length === 0) {
      toast.error("Please provide at least one input");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await supabase.functions.invoke("admin-onboarding-debug", {
        body: payload,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setResult(response.data);
      // Extract correlation ID from headers if available
      setCorrelationId(crypto.randomUUID()); // Fallback since we can't access headers
      
    } catch (error) {
      console.error("Debug error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to run diagnostic");
    } finally {
      setLoading(false);
    }
  };

  const generateDebugReport = () => {
    if (!result) return "";

    const timestamp = new Date().toISOString();
    const lines = [
      "=== FlyMusic Onboarding Debug Report ===",
      `Timestamp: ${timestamp}`,
      "",
      "INPUTS:",
      `- Email: ${email || "(not provided)"}`,
      `- Invite Code: ${inviteCode || "(not provided)"}`,
      `- Artist ID: ${artistId || "(not provided)"}`,
      "",
      "INVITE STATUS:",
      `- Exists: ${result.invite.exists ? "YES" : "NO"}`,
      `- Active: ${result.invite.active ? "YES" : "NO"}`,
      `- Used: ${result.invite.used ? "YES" : "NO"}`,
      `- Replaced: ${result.invite.replaced ? "YES" : "NO"}`,
      result.invite.reason ? `- Reason: ${result.invite.reason}` : null,
      result.invite.role_type ? `- Role Type: ${result.invite.role_type}` : null,
      "",
      "USER STATUS:",
      `- User exists: ${result.user.exists ? `YES (${result.user.user_id})` : "NO"}`,
      `- Roles: ${result.user.roles.length > 0 ? result.user.roles.join(", ") : "(none)"}`,
      `- Artist profile: ${result.user.artist_profile_exists === true ? `YES (${result.user.artist_profile_status})` : result.user.artist_profile_exists === false ? "NO" : "N/A"}`,
      "",
      "LEGAL STATUS:",
      `- Terms: ${result.legal.terms_ok === true ? `OK (v${result.legal.terms_version})` : result.legal.terms_ok === false ? "MISSING" : "N/A"}`,
      result.legal.terms_accepted_at ? `  Accepted: ${result.legal.terms_accepted_at}` : null,
      `- NDA: ${result.legal.nda_ok === true ? `OK (v${result.legal.nda_version})` : result.legal.nda_ok === false ? "MISSING" : "N/A"}`,
      result.legal.nda_accepted_at ? `  Accepted: ${result.legal.nda_accepted_at}` : null,
      "",
      `NEXT STEP: ${result.next_step}`,
      `RECOMMENDED ROUTE: ${result.recommended_route}`,
      "",
      result.errors.length > 0 ? `ERRORS:\n${result.errors.map(e => `- [${e.code}] ${e.message}`).join("\n")}` : null,
      "",
      correlationId ? `Correlation ID: ${correlationId}` : null,
    ].filter(Boolean);

    return lines.join("\n");
  };

  const copyDebugReport = () => {
    const report = generateDebugReport();
    navigator.clipboard.writeText(report);
    toast.success("Debug report copied to clipboard");
  };

  const getOverallStatus = (): "ready" | "blocked" | "error" => {
    if (!result) return "blocked";
    if (result.errors.length > 0) return "error";
    if (result.next_step === "go_to_studio" || result.next_step === "go_to_fan_portal" || result.next_step === "go_to_admin") {
      return "ready";
    }
    return "blocked";
  };

  const getBlockingReason = (): string => {
    if (!result) return "No diagnostic run yet";
    if (result.errors.length > 0) return result.errors[0].message;
    
    switch (result.next_step) {
      case "redeem_invite": return "User needs to redeem their invite code";
      case "register": return "User needs to register (no valid invite)";
      case "create_artist_profile": return "Artist profile needs to be created";
      case "accept_legal": return "Legal documents need to be accepted";
      case "await_approval": return "Artist profile pending approval";
      case "assign_role": return "User has no role assigned";
      default: return "Unknown blocking reason";
    }
  };

  return (
    <div className="container max-w-4xl py-4 md:py-8 px-4 space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Onboarding Debug</h1>
          <p className="text-muted-foreground text-sm">
            Read-only diagnostic tool for invite and onboarding issues
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <Card className="border-amber-500/50 bg-amber-500/10">
        <CardContent className="py-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-sm">This tool is READ-ONLY. No data will be modified.</span>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Diagnostic Inputs</CardTitle>
          <CardDescription>Enter any combination to diagnose onboarding state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code (optional)</Label>
              <Input
                id="inviteCode"
                placeholder="ABC123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artistId">Artist ID (optional)</Label>
              <Input
                id="artistId"
                placeholder="uuid..."
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => runDiagnostic("invite")}
              disabled={loading || !inviteCode}
            >
              <Search className="h-4 w-4 mr-2" />
              Check Invite
            </Button>
            <Button
              variant="outline"
              onClick={() => runDiagnostic("user")}
              disabled={loading || !email}
            >
              <User className="h-4 w-4 mr-2" />
              Check User State
            </Button>
            <Button
              onClick={() => runDiagnostic("full")}
              disabled={loading || (!email && !inviteCode && !artistId)}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileCheck className="h-4 w-4 mr-2" />
              )}
              Run Full Diagnostic
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Overall Status */}
          <Card className={
            getOverallStatus() === "ready" 
              ? "border-green-500/50 bg-green-500/10" 
              : getOverallStatus() === "error" 
                ? "border-destructive/50 bg-destructive/10"
                : "border-amber-500/50 bg-amber-500/10"
          }>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getOverallStatus() === "ready" && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                  {getOverallStatus() === "blocked" && <AlertCircle className="h-6 w-6 text-amber-500" />}
                  {getOverallStatus() === "error" && <XCircle className="h-6 w-6 text-destructive" />}
                  <div>
                    <div className="font-semibold">
                      {getOverallStatus() === "ready" && "READY"}
                      {getOverallStatus() === "blocked" && "BLOCKED"}
                      {getOverallStatus() === "error" && "ERROR"}
                    </div>
                    <div className="text-sm text-muted-foreground">{getBlockingReason()}</div>
                  </div>
                </div>
                <Badge variant="outline">{result.next_step}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Step Checklist */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Invite Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Invite
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <CheckItem label="Code provided" status={result.invite.provided} />
                {result.invite.provided && (
                  <>
                    <CheckItem label="Code exists" status={result.invite.exists} />
                    <CheckItem label="Code active" status={result.invite.active} detail={result.invite.status} />
                    <CheckItem label="Not replaced" status={!result.invite.replaced} detail={result.invite.replaced ? "REPLACED" : undefined} />
                    <CheckItem label="Not used" status={!result.invite.used} />
                    {result.invite.email_bound && (
                      <CheckItem label="Email match" status={result.invite.email_match} />
                    )}
                    {result.invite.role_type && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Role type: <Badge variant="secondary" className="text-xs">{result.invite.role_type}</Badge>
                      </div>
                    )}
                    {result.invite.reason && (
                      <div className="text-xs text-destructive mt-2">{result.invite.reason}</div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* User Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <CheckItem label="User exists" status={result.user.exists} />
                {result.user.exists && (
                  <>
                    <div className="text-xs text-muted-foreground truncate">
                      ID: {result.user.user_id}
                    </div>
                    <CheckItem 
                      label="Has roles" 
                      status={result.user.roles.length > 0} 
                      detail={result.user.roles.join(", ")}
                    />
                    {result.user.roles.includes("artist") && (
                      <CheckItem 
                        label="Artist profile" 
                        status={result.user.artist_profile_exists} 
                        detail={result.user.artist_profile_status || undefined}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Legal Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Legal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <CheckItem 
                  label="Terms accepted" 
                  status={result.legal.terms_ok} 
                  detail={result.legal.terms_version || undefined}
                />
                {result.legal.terms_accepted_at && (
                  <div className="text-xs text-muted-foreground ml-6">
                    {new Date(result.legal.terms_accepted_at).toLocaleDateString()}
                  </div>
                )}
                <CheckItem 
                  label="NDA accepted" 
                  status={result.legal.nda_ok} 
                  detail={result.legal.nda_version || undefined}
                />
                {result.legal.nda_accepted_at && (
                  <div className="text-xs text-muted-foreground ml-6">
                    {new Date(result.legal.nda_accepted_at).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recommended Route */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-sm text-muted-foreground">Recommended Next Step</div>
                  <div className="font-mono text-sm flex items-center gap-2">
                    {result.recommended_route}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(result.recommended_route);
                        toast.success("Route copied");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={result.recommended_route} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Route
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={copyDebugReport} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy Debug Report
            </Button>
          </div>

          {/* Raw JSON */}
          <Collapsible open={jsonOpen} onOpenChange={setJsonOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                Raw JSON
                <ChevronDown className={`h-4 w-4 transition-transform ${jsonOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card>
                <CardContent className="py-4">
                  <pre className="text-xs overflow-auto max-h-96 bg-muted p-4 rounded">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Errors */}
          {result.errors.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-destructive">Errors</CardTitle>
              </CardHeader>
              <CardContent>
                {result.errors.map((err, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-mono text-destructive">[{err.code}]</span> {err.message}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
