import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFanAchievements } from "@/hooks/useFanAchievements";
import { FanAchievementBadge } from "@/components/fan/FanAchievementBadge";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { FanSidebar } from "@/components/fan/FanSidebar";
import { PageBreadcrumb } from "@/components/navigation/PageBreadcrumb";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { useIsMobile } from "@/hooks/use-mobile";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export default function FanAchievements() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { achievements, loading, totalXP, supporterLevel, nextLevelXP, progressToNextLevel } = useFanAchievements();
  const isMobile = useIsMobile();

  const handleShare = () => {
    const shareText = `I've unlocked ${achievements.filter(a => a.unlocked).length} achievements on FlyMusic! 🏆`;
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
      <>
        <MobileFanNav />
        <div className="flex min-h-screen w-full pt-16">
          <FanSidebar />
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-8 flex items-center justify-center">
            <p className="text-muted-foreground">{t('fan.loadingAchievements')}</p>
          </main>
        </div>
        {isMobile && <BottomNavBarFan />}
      </>
    );
  }

  return (
    <>
      <MobileFanNav />
      <div className="flex min-h-screen w-full pt-16">
        <FanSidebar />
        <main className="flex-1 p-4 md:p-6 pb-28 md:pb-8">
          <PageBreadcrumb role="fan" />
          
          <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
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
                  <p className="text-xl text-muted-foreground">{t('fan.yourSupporterJourney')}</p>
                  <p className="text-sm text-muted-foreground/80">
                    {t('fan.earnXPUnlockAchievements')}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${levelColors[supporterLevel]} bg-primary/10 border-primary/20`}>
                      {levelBadges[supporterLevel]}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                      <Share2 className="h-3 w-3" />
                      {t('common.share')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 bg-card/30 backdrop-blur border-primary/10 text-center">
                <p className="text-3xl font-bold text-primary">{unlockedCount}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('fan.achievementsUnlocked')}</p>
              </Card>
              <Card className="p-6 bg-card/30 backdrop-blur border-primary/10 text-center">
                <p className={`text-3xl font-bold ${levelColors[supporterLevel]}`}>
                  {supporterLevel.toUpperCase()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{t('fan.currentLevel')}</p>
              </Card>
              <Card className="p-6 bg-card/30 backdrop-blur border-primary/10 text-center">
                <p className="text-3xl font-bold text-primary">{nextLevelXP}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('fan.xpToNextLevel')}</p>
              </Card>
            </div>

            {/* Progress Bar */}
            <Card className="p-6 bg-card/30 backdrop-blur border-primary/10">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('fan.overallProgress')}</span>
                  <span className="text-primary font-semibold">{Math.round(progressToNextLevel)}%</span>
                </div>
                <Progress value={progressToNextLevel} className="h-3" />
                <p className="text-xs text-muted-foreground text-center">
                  {totalXP} {t('fan.totalXPEarned')}
                </p>
              </div>
            </Card>

            {/* Achievement Gallery */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{t('fan.achievementGallery')}</h2>
                <InfoTooltip
                  title={t('fan.fanAchievements')}
                  description={t('fan.fanAchievementsDescription')}
                  forRole="fan"
                  learnLink="/learn?tab=fan#supporter-level"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {achievements.map((achievement) => (
                  <FanAchievementBadge key={achievement.type} achievement={achievement} />
                ))}
              </div>
            </div>

            {/* Footer Message */}
            <Card className="p-6 bg-card/20 backdrop-blur border-primary/10 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('fan.actionsHelpYouGrow')}
              </p>
            </Card>
          </div>
        </main>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
