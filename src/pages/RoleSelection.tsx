import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Music, Heart, Mic2, Users, Building2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export default function RoleSelection() {
  const { user, refreshProfile, hasRole } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'artist' | 'fan' | 'brand' | null>(null);
  const [bothRoles, setBothRoles] = useState(false);
  const [loading, setLoading] = useState(false);

  // P0 FIX: Redirect admins directly to /admin - they should NEVER see role selection
  useEffect(() => {
    if (hasRole('admin') || hasRole('super_admin')) {
      navigate('/admin', { replace: true });
    }
  }, [hasRole, navigate]);

  const handleContinue = async () => {
    if (!user || (!selectedRole && !bothRoles)) {
      toast.error("Please select a role");
      return;
    }

    setLoading(true);
    try {
      let rolesToInsert: { user_id: string; role: 'artist' | 'fan' | 'brand' }[] = [];
      
      if (bothRoles) {
        rolesToInsert = [
          { user_id: user.id, role: 'artist' as const },
          { user_id: user.id, role: 'fan' as const }
        ];
      } else if (selectedRole) {
        rolesToInsert = [{ user_id: user.id, role: selectedRole }];
      }

      // Use upsert to handle duplicate key errors
      const { error } = await supabase
        .from('user_roles')
        .upsert(rolesToInsert, { 
          onConflict: 'user_id,role',
          ignoreDuplicates: true 
        });

      if (error) throw error;

      await refreshProfile();
      
      toast.success("Role selected successfully!");
      
      // Redirect to onboarding based on selected role
      if (selectedRole === 'brand') {
        navigate('/brand/onboarding');
      } else if (bothRoles || selectedRole === 'fan') {
        navigate('/fan/onboarding');
      } else {
        navigate('/studio/onboarding');
      }
    } catch (error: any) {
      console.error('Error setting role:', error);
      toast.error(error.message || "Failed to set role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-background/50">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              FlyMusic Gold
            </h1>
          </div>
          <p className="text-xl text-foreground/80 mb-2">Welcome! Choose your experience</p>
          <p className="text-sm text-muted-foreground">You can always change this later</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card
            className={`p-6 cursor-pointer transition-all hover:border-primary/50 ${
              selectedRole === 'artist' && !bothRoles ? 'border-primary shadow-lg shadow-primary/20' : ''
            }`}
            onClick={() => {
              setSelectedRole('artist');
              setBothRoles(false);
            }}
          >
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Mic2 className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold">I'm an Artist</h2>
              <p className="text-sm text-muted-foreground">
                Upload music, manage your career, and connect with fans
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  Upload and manage tracks
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Build your fanbase
                </li>
              </ul>
            </div>
          </Card>

          <Card
            className={`p-6 cursor-pointer transition-all hover:border-primary/50 ${
              selectedRole === 'fan' && !bothRoles ? 'border-primary shadow-lg shadow-primary/20' : ''
            }`}
            onClick={() => {
              setSelectedRole('fan');
              setBothRoles(false);
            }}
          >
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold">I'm a Fan</h2>
              <p className="text-sm text-muted-foreground">
                Follow artists, discover music, and be part of something exclusive
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  Follow favorite artists
                </li>
                <li className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  Discover new music
                </li>
              </ul>
            </div>
          </Card>

          <Card
            className={`p-6 cursor-pointer transition-all hover:border-primary/50 ${
              selectedRole === 'brand' ? 'border-primary shadow-lg shadow-primary/20' : ''
            }`}
            onClick={() => {
              setSelectedRole('brand');
              setBothRoles(false);
            }}
          >
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold">I'm a Brand</h2>
              <p className="text-sm text-muted-foreground">
                Connect with artists for partnerships, events, and campaigns
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Discover matching artists
                </li>
                <li className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Create opportunities
                </li>
              </ul>
            </div>
          </Card>
        </div>

        {selectedRole !== 'brand' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <Checkbox
              id="bothRoles"
              checked={bothRoles}
              onCheckedChange={(checked) => {
                setBothRoles(checked as boolean);
                if (checked && !selectedRole) {
                  setSelectedRole('fan');
                }
              }}
            />
            <label
              htmlFor="bothRoles"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              I'm both an artist AND a fan
            </label>
          </div>
        )}

        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={loading || (!selectedRole && !bothRoles)}
            className="bg-gradient-gold px-12 py-6 text-lg"
          >
            {loading ? "Setting up..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
