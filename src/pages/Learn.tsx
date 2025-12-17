import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileFanNav } from "@/components/fan/MobileFanNav";
import { BottomNavBarFan } from "@/components/mobile/BottomNavBarFan";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Heart,
  Users,
  Sparkles,
  ListMusic,
  TrendingUp,
  Music,
  Video,
  Trophy,
  Mic2,
  MessageSquare,
  Calendar,
  BarChart3,
  Newspaper,
} from "lucide-react";

export default function Learn() {
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get("tab") || "fan"
  );

  // Recent platform updates
  const recentUpdates = [
    {
      id: '1',
      date: 'Dec 2024',
      title: 'InfoTooltips',
      description: 'Helpful explanations throughout the platform to guide your journey'
    },
    {
      id: '2',
      date: 'Nov 2024',
      title: 'Fan Onboarding Tour',
      description: 'Step-by-step introduction for new fans to discover key features'
    },
    {
      id: '3',
      date: 'Nov 2024',
      title: 'Stack Settings',
      description: 'Manage your stacks directly from the detail view'
    },
    {
      id: '4',
      date: 'Oct 2024',
      title: 'Taste Engine V1.5',
      description: 'Improved personalized recommendations based on your listening'
    },
    {
      id: '5',
      date: 'Oct 2024',
      title: 'Video Analytics',
      description: 'Artists can now see detailed engagement data on their videos'
    },
    {
      id: '6',
      date: 'Sep 2024',
      title: 'Fan Achievements',
      description: 'Unlock badges as you support artists and engage with the platform'
    },
  ];

  // Scroll to hash section after tab change
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    }
  }, [activeTab]);

  return (
    <>
      <MobileFanNav />
      <div className="min-h-screen py-24 px-4 pb-32 md:pb-28">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Learn FlyMusic
            </h1>
            <p className="text-lg text-muted-foreground">
              Understand how FlyMusic works as a fan or an artist
            </p>
          </div>

          {/* What's New Section */}
          <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" />
                What's New on FlyMusic
              </CardTitle>
              <CardDescription>Recent platform updates and feature releases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUpdates.map((update) => (
                  <div key={update.id} className="flex gap-4 items-start">
                    <div className="text-xs text-muted-foreground whitespace-nowrap pt-0.5 min-w-[70px]">
                      {update.date}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-0.5">{update.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{update.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="fan" className="text-base">
                For Fans
              </TabsTrigger>
              <TabsTrigger value="artist" className="text-base">
                For Artists
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fan" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Supporting Artists
                  </CardTitle>
                  <CardDescription>
                    Learn how to support your favorite artists on FlyMusic.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="rounded-full bg-secondary h-12 w-12 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-0.5">
                        Boost artists in the charts
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Engage with their content to increase their visibility.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="rounded-full bg-secondary h-12 w-12 flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-0.5">
                        Grow their fanbase
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Share their music and videos with your friends.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="rounded-full bg-secondary h-12 w-12 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-0.5">
                        Unlock achievements
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Earn badges for your support and engagement.
                      </p>
                    </div>
                  </div>
                  <Link to="/fan/supporter">
                    <span className="text-sm text-primary hover:underline">
                      Learn more about supporting artists →
                    </span>
                  </Link>
                </CardContent>
              </Card>

              <Card id="listen-and-discover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-primary" />
                    Listening and Discovery
                  </CardTitle>
                  <CardDescription>
                    Explore new music and personalize your listening experience.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="rounded-full bg-secondary h-12 w-12 flex items-center justify-center">
                      <ListMusic className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-0.5">
                        Create playlists
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Curate your favorite tracks into custom playlists.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="rounded-full bg-secondary h-12 w-12 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-0.5">
                        Follow trending charts
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Discover what's popular on FlyMusic.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="rounded-full bg-secondary h-12 w-12 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-0.5">
                        Personalized recommendations
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Get suggestions based on your listening history.
                      </p>
                    </div>
                  </div>
                  <Link to="/discover">
                    <span className="text-sm text-primary hover:underline">
                      Learn more about listening and discovery →
                    </span>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="artist" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic2 className="h-5 w-5 text-primary" />
                    Uploading Music
                  </CardTitle>
                  <CardDescription>
                    Learn how to upload your music and videos to FlyMusic.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="rounded-full bg-secondary h-12 w-12 flex items-center justify-center">
                      <Music className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-0.5">
                        Audio formats
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Supported audio formats for music uploads.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="rounded-full bg-secondary h-12 w-12 flex items-center justify-center">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-0.5">
                        Video formats
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Supported video formats for music videos.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="rounded-full bg-secondary h-12 w-12 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-0.5">
                        Release scheduling
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Schedule your releases in advance.
                      </p>
                    </div>
                  </div>
                  <Link to="/studio/tracks">
                    <span className="text-sm text-primary hover:underline">
                      Learn more about uploading music →
                    </span>
                  </Link>
                </CardContent>
              </Card>

              <Card id="analytics-and-stats">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Analytics and Stats
                  </CardTitle>
                  <CardDescription>
                    Understand your audience and track your performance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="rounded-full bg-secondary h-12 w-12 flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-0.5">
                        Audience demographics
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Learn about your listeners' demographics.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="rounded-full bg-secondary h-12 w-12 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-0.5">
                        Engagement metrics
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Track comments, likes, and shares.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="rounded-full bg-secondary h-12 w-12 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-0.5">
                        Performance trends
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Analyze your performance over time.
                      </p>
                    </div>
                  </div>
                  <Link to="/studio/analytics">
                    <span className="text-sm text-primary hover:underline">
                      Learn more about analytics and stats →
                    </span>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Back to Dashboard Links */}
          <div className="mt-12 text-center space-y-4">
            {activeTab === 'fan' && (
              <Link to="/fan">
                <span className="text-sm text-primary hover:underline">← Back to Fan Portal</span>
              </Link>
            )}
            {activeTab === 'artist' && (
              <Link to="/studio">
                <span className="text-sm text-primary hover:underline">← Back to My Studio</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Conditionally render BottomNavBarFan only on mobile and only for fan tab */}
      {isMobile && activeTab === 'fan' && <BottomNavBarFan />}
    </>
  );
}
