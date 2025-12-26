import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Heart, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";

type Role = "artist" | "fan" | "brand";

interface RoleOption {
  role: Role;
  title: string;
  description: string;
  icon: React.ReactNode;
  onboardingPath: string;
}

const roleOptions: RoleOption[] = [
  {
    role: "artist",
    title: "Artist",
    description: "Share your music, connect with fans, and grow your career",
    icon: <Music className="h-8 w-8" />,
    onboardingPath: "/studio/onboarding",
  },
  {
    role: "fan",
    title: "Fan",
    description: "Discover new music, support artists, and join the community",
    icon: <Heart className="h-8 w-8" />,
    onboardingPath: "/fan/onboarding",
  },
  {
    role: "brand",
    title: "Brand",
    description: "Connect with artists for collaborations and campaigns",
    icon: <Building2 className="h-8 w-8" />,
    onboardingPath: "/brand/onboarding",
  },
];

export default function RoleSelection() {
  const { user, loading, hasRole, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [selecting, setSelecting] = useState<Role | null>(null);

  // Redirect if not logged in
  if (!loading && !user) {
    navigate("/", { replace: true });
    return null;
  }

  // Redirect if user already has a role
  if (!loading && user) {
    if (hasRole("artist")) {
      navigate("/studio", { replace: true });
      return null;
    }
    if (hasRole("fan")) {
      navigate("/fan", { replace: true });
      return null;
    }
    if (hasRole("brand")) {
      navigate("/brand", { replace: true });
      return null;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const handleSelectRole = async (option: RoleOption) => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }

    setSelecting(option.role);

    try {
      // Insert role into user_roles table
      const { error } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: option.role,
      });

      if (error) {
        // Handle duplicate role error gracefully
        if (error.code === "23505") {
          await refreshProfile();
          navigate(option.onboardingPath, { replace: true });
          return;
        }
        throw error;
      }

      // Refresh profile to get updated roles
      await refreshProfile();

      toast.success(`Welcome as a ${option.title}!`);
      navigate(option.onboardingPath, { replace: true });
    } catch (error: any) {
      console.error("Error selecting role:", error);
      toast.error(error.message || "Failed to select role");
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-4">
          <FlyMusicLogo className="h-12 mx-auto" />
          <h1 className="text-3xl font-bold">Welcome to FlyMusic</h1>
          <p className="text-muted-foreground text-lg">
            How would you like to use FlyMusic?
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {roleOptions.map((option) => (
            <Card
              key={option.role}
              className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
              onClick={() => handleSelectRole(option)}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10 text-primary w-fit">
                  {option.icon}
                </div>
                <CardTitle>{option.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {option.description}
                </CardDescription>
                <Button
                  className="w-full mt-4"
                  disabled={selecting !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectRole(option);
                  }}
                >
                  {selecting === option.role ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Continue as {option.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
