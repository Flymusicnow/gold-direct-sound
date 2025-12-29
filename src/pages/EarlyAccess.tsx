import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Heart, Mic2, Key, Loader2, AlertCircle } from "lucide-react";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { storeInviteToken } from "@/hooks/useFanInviteAccess";
import { toast } from "sonner";
import fanHeroImage from "@/assets/fan-hero-concert.png";
import artistHeroImage from "@/assets/hero-artist-spotlight.png";

type Role = "fan" | "artist";

const roleConfig = {
  fan: {
    image: fanHeroImage,
    headline: "Discover & Support Artists",
    subtext:
      "Join a community of music lovers discovering amazing independent artists before anyone else.",
    badge: "FAN ACCESS",
    badgeColor: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    buttonColor: "bg-violet-500 hover:bg-violet-600",
    icon: Heart,
  },
  artist: {
    image: artistHeroImage,
    headline: "Upload Music, Build Your Fanbase",
    subtext:
      "Share your music, connect with supporters who believe in your art, and grow your career.",
    badge: "ARTIST ACCESS",
    badgeColor: "bg-primary/20 text-primary border-primary/30",
    buttonColor: "bg-primary hover:bg-primary/90",
    icon: Mic2,
  },
};

export default function EarlyAccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roleParam = searchParams.get("role") as Role | null;
  const codeParam = searchParams.get("code");

  const [selectedRole, setSelectedRole] = useState<Role>(
    roleParam === "artist" ? "artist" : "fan"
  );
  const [code, setCode] = useState(codeParam || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update role when URL param changes
  useEffect(() => {
    if (roleParam === "artist" || roleParam === "fan") {
      setSelectedRole(roleParam);
    }
  }, [roleParam]);

  // Pre-fill code from URL
  useEffect(() => {
    if (codeParam) {
      setCode(codeParam.toUpperCase());
    }
  }, [codeParam]);

  const config = roleConfig[selectedRole];
  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedCode) {
      setError("Please enter your invite code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "validate-invite-code",
        {
          body: { code: trimmedCode },
        }
      );

      if (invokeError) {
        console.error("Invoke error:", invokeError);
        setError("Failed to validate code. Please try again.");
        setLoading(false);
        return;
      }

      if (!data.valid) {
        setError(data.error || "Invalid invite code");
        setLoading(false);
        return;
      }

      // Store token for session
      storeInviteToken(data.token, data.expires_at);

      toast.success("Invite code accepted!");

      // Redirect based on role from code (or selected role as fallback)
      const redirectRole = data.role || selectedRole;
      const redirectPath =
        redirectRole === "artist" ? "/join/artist" : "/join/fan";
      navigate(redirectPath);
    } catch (err) {
      console.error("Error validating code:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Image - role-specific */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat transition-all duration-500"
        style={{
          backgroundImage: `url(${config.image})`,
          backgroundPosition: "center 30%",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-black/70 to-black/40" />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 relative z-10">
        <div className="max-w-lg w-full text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <FlyMusicLogo size="lg" />
          </div>

          {/* Role Badge */}
          <Badge variant="outline" className={`${config.badgeColor} px-4 py-1`}>
            {config.badge}
          </Badge>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight flex items-center justify-center gap-3">
              <Icon className="h-8 w-8 md:h-10 md:w-10" />
              {config.headline}
            </h1>
            <p className="text-base md:text-lg text-foreground/70 max-w-md mx-auto">
              {config.subtext}
            </p>
          </div>

          {/* Role Switcher (if no role param) */}
          {!roleParam && (
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant={selectedRole === "fan" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRole("fan")}
                className={
                  selectedRole === "fan"
                    ? "bg-violet-500 hover:bg-violet-600"
                    : "border-violet-500/50 text-violet-400"
                }
              >
                <Heart className="h-4 w-4 mr-1" />
                Fan
              </Button>
              <Button
                variant={selectedRole === "artist" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRole("artist")}
                className={
                  selectedRole === "artist"
                    ? "bg-primary hover:bg-primary/90"
                    : "border-primary/50 text-primary"
                }
              >
                <Mic2 className="h-4 w-4 mr-1" />
                Artist
              </Button>
            </div>
          )}

          {/* Code Input */}
          <div className="pt-4">
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-center gap-2 text-foreground font-medium">
                <Key className="h-5 w-5" />
                <span>Enter your invite code</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="FLY-XXXXXX"
                  className="font-mono text-lg uppercase text-center tracking-wider py-6"
                  disabled={loading}
                  autoFocus={!codeParam}
                />

                {error && (
                  <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || !code.trim()}
                  className={`w-full ${config.buttonColor} text-white`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Icon className="h-4 w-4 mr-2" />
                      Unlock Access
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Back link */}
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
