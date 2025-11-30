import { useNavigate } from "react-router-dom";
import { FlyMusicLogo } from "./FlyMusicLogo";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Mic2, TrendingUp, Users, BarChart3 } from "lucide-react";

export function BetaLandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Mic2,
      title: "Build Your Profile",
      description: "Upload tracks, videos, and connect with your audience directly",
    },
    {
      icon: TrendingUp,
      title: "FlyMusic Spotlight",
      description: "Compete in community-voted campaigns and get discovered",
    },
    {
      icon: Users,
      title: "Supporter System",
      description: "Let fans support you with exclusive content and perks",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track your growth with professional creator tools",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <FlyMusicLogo size="lg" />
          </div>

          {/* Beta Badge */}
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary border-primary/30 px-6 py-2 text-sm font-semibold"
          >
            PRIVATE BETA
          </Badge>

          {/* Hero Text */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              The New Era of Music
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              FlyMusic Gold connects artists directly with fans. No intermediaries. 
              Just real connection, community, and ownership.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button 
              size="lg"
              onClick={() => navigate("/auth?mode=signin")}
              className="w-full sm:w-auto min-w-[180px] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth?mode=signup")}
              className="w-full sm:w-auto min-w-[180px]"
            >
              Create Account
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-16 max-w-3xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-6 text-left space-y-3 hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Footer Message */}
          <div className="pt-12 text-sm text-muted-foreground">
            <p>Want early access? Sign up and request a beta code.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
