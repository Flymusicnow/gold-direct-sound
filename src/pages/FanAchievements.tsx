import { useAuth } from "@/contexts/AuthContext";
import { useFanAchievements } from "@/hooks/useFanAchievements";
import { FanAchievementBadge } from "@/components/fan/FanAchievementBadge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { useIsMobile } from "@/hooks/use-mobile";

export default function FanAchievements() {
  const { user, profile } = useAuth();
  const { achievements, loading, totalXP, supporterLevel, nextLevelXP, progressToNextLevel } = useFanAchievements();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleShare = () => {
    const shareText = `I've unlocked ${achievements.filter(a => a.unlocked).length} achievements on FlyMusic Gold! 🏆`;
    if (navigator.share) {
      navigator.share({
        title: "My FlyMusic Achievements",
        text: shareText,
        url: window.location.origin + "/fan/achievements",
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Link copied to clipboard!");
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  const levelColors = {
    none: "text-muted-foreground",
    bronze: "text-[#CD7F32]",
    silver: "text-[#C0C0C0]",
    gold: "text-primary",
  };

  const levelBadges = {
    none: "SUPPORTER",
    bronze: "BRONZE SUPPORTER",
    silver: "SILVER SUPPORTER",
    gold: "GOLD SUPPORTER",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 flex items-center justify-center pb-32 md:pb-28">
        <p className="text-muted-foreground">Loading your achievements...</p>
        {isMobile && <BottomNavBarFan />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 pt-24 pb-32 md:pb-28">
      <div className="container max-w-5xl mx-auto px-4 space-y-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/fan")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Header Section */}
        <Card className="p-6 md:p-8 bg-card/50 backdrop-blur border-primary/20 shadow-gold">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 ring-4 ring-primary/30">
              <AvatarFallback className="text-2xl bg-gradient-gold text-primary-foreground">
                {profile?.full_name?.[0] || user?.email?.[0] || "F"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                {profile?.full_name || "Fan"}
              </h1>
              <p className="text-xl text-muted-foreground">Your Supporter Journey</p>
              <p className="text-sm text-muted-foreground/80">
                Earn XP, unlock achievements, and level up as a true FlyMusic supporter.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${levelColors[supporterLevel]} bg-primary/10 border-primary/20`}>
                  {levelBadges[supporterLevel]}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                  <Share2 className="h-3 w-3" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-card/30 backdrop-blur border-primary/10 text-center">
            <p className="text-3xl font-bold text-primary">{unlockedCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Achievements Unlocked</p>
          </Card>
          <Card className="p-6 bg-card/30 backdrop-blur border-primary/10 text-center">
            <p className={`text-3xl font-bold ${levelColors[supporterLevel]}`}>
              {supporterLevel.toUpperCase()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Current Level</p>
          </Card>
          <Card className="p-6 bg-card/30 backdrop-blur border-primary/10 text-center">
            <p className="text-3xl font-bold text-primary">{nextLevelXP}</p>
            <p className="text-sm text-muted-foreground mt-1">XP to Next Level</p>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="p-6 bg-card/30 backdrop-blur border-primary/10">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-primary font-semibold">{Math.round(progressToNextLevel)}%</span>
            </div>
            <Progress value={progressToNextLevel} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {totalXP} Total XP Earned
            </p>
          </div>
        </Card>

        {/* Achievement Gallery */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Achievement Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <FanAchievementBadge key={achievement.type} achievement={achievement} />
            ))}
          </div>
        </div>

        {/* Footer Message */}
        <Card className="p-6 bg-card/20 backdrop-blur border-primary/10 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your actions across FlyMusic — follows, votes, shares, stacks and comments — all help you grow as a supporter.
          </p>
        </Card>
      </div>

      {isMobile && <BottomNavBarFan />}
    </div>
  );
}
