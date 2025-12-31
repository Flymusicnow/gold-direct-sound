import { Link, useNavigate } from "react-router-dom";
import { ShieldX, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { FlyMusicLogo } from "@/components/FlyMusicLogo";

export default function AdminAccessDenied() {
  const { hasRole, signOut } = useAuth();
  const navigate = useNavigate();

  // Determine user's primary dashboard
  const getDashboardPath = () => {
    if (hasRole('brand')) return '/brand';
    if (hasRole('artist')) return '/studio';
    if (hasRole('fan')) return '/fan';
    return '/';
  };

  const handleSwitchAccount = async () => {
    await signOut();
    navigate('/signin/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <FlyMusicLogo size="md" />
        </div>

        <Card className="border-destructive/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription className="space-y-2">
              <p>You don't have admin access on this account.</p>
              <p className="text-muted-foreground text-sm">
                Admin access is restricted to authorized personnel only.
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Option 1: Go back to user's dashboard */}
            <Button asChild variant="default" className="w-full">
              <Link to={getDashboardPath()}>
                <Home className="mr-2 h-4 w-4" />
                Back to App
              </Link>
            </Button>

            {/* Option 2: Switch account (explicit user action) */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleSwitchAccount}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Switch Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
