import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";

export default function Learn() {
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get("tab") || "fan"
  );

  useEffect(() => {
    // Scroll to hash section if present
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

            {/* Fan Content */}
            <TabsContent value="fan" className="space-y-6">
              <Card id="supporter-level">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    What is a Supporter Level?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>
                    Your Supporter Level shows how actively you support artists on
                    FlyMusic. As you interact with music and artists, you earn XP
                    (experience points).
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Supporter Tiers:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <span className="font-medium">Bronze</span> – 10 XP
                      </li>
                      <li>
                        <span className="font-medium">Silver</span> – 50 XP
                      </li>
                      <li>
                        <span className="font-medium">Gold</span> – 150 XP
                      </li>
                    </ul>
                  </div>
                  <p>
                    Higher levels unlock badges and show artists how committed you
                    are to their work.
                  </p>
                  <Link
                    to="/fan/supporter"
                    className="text-primary hover:underline inline-block mt-2"
                  >
                    View your supporter progress →
                  </Link>
                </CardContent>
              </Card>

              <Card id="support-artists">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    How can I support artists?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>
                    Supporting artists on FlyMusic is simple and rewarding. Every
                    interaction helps artists grow and earns you XP!
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Ways to support:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <span className="font-medium">Like tracks</span> – Show love
                        for their music (+1 XP)
                      </li>
                      <li>
                        <span className="font-medium">Follow artists</span> – Stay
                        updated with new releases (+8 XP)
                      </li>
                      <li>
                        <span className="font-medium">Share tracks</span> – Spread
                        the word (+10 XP)
                      </li>
                      <li>
                        <span className="font-medium">Vote in Spotlight</span> –
                        Boost artists in campaigns (+12 XP)
                      </li>
                      <li>
                        <span className="font-medium">Comment</span> – Give
                        feedback (+4 XP)
                      </li>
                      <li>
                        <span className="font-medium">Watch videos</span> – Engage
                        with visual content (+3 XP)
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card id="spotlight">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    What is Spotlight?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>
                    FlyMusic Spotlight is a fan-driven voting system where artists
                    compete in campaigns to gain visibility and momentum.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Artists submit tracks to active campaigns</li>
                      <li>
                        You vote for your favorites (one vote per entry, per fan)
                      </li>
                      <li>Top-voted artists get featured on leaderboards</li>
                      <li>Voting earns you Spotlight supporter badges</li>
                    </ul>
                  </div>
                  <p>
                    Your votes directly impact which artists rise to the top and get
                    discovered by more fans!
                  </p>
                  <Link
                    to="/spotlight/leaderboard"
                    className="text-primary hover:underline inline-block mt-2"
                  >
                    Check active campaigns →
                  </Link>
                </CardContent>
              </Card>

              <Card id="stacks">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListMusic className="h-5 w-5 text-primary" />
                    What are Stacks?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>
                    Stacks are your personal collections of tracks. Think of them as
                    playlists tailored to your taste and mood.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Stack features:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        Organize tracks by mood, genre, or any theme you like
                      </li>
                      <li>Make stacks public or keep them private</li>
                      <li>Share your favorite stacks with friends</li>
                      <li>Add tracks from Discover, Search, or artist profiles</li>
                    </ul>
                  </div>
                  <Link
                    to="/fan/playlists"
                    className="text-primary hover:underline inline-block mt-2"
                  >
                    Create your first stack →
                  </Link>
                </CardContent>
              </Card>

              <Card id="discover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    How does Discover work?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>
                    The Discover page helps you find new music tailored to your
                    taste. It uses smart algorithms to recommend tracks and artists
                    you'll love.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Discover sections:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <span className="font-medium">For You</span> – Personalized
                        based on what you like and follow
                      </li>
                      <li>
                        <span className="font-medium">Trending</span> – Most popular
                        tracks right now
                      </li>
                      <li>
                        <span className="font-medium">Rising Artists</span> – New
                        talent gaining momentum
                      </li>
                      <li>
                        <span className="font-medium">Genres</span> – Explore by
                        your favorite music styles
                      </li>
                    </ul>
                  </div>
                  <Link
                    to="/discover"
                    className="text-primary hover:underline inline-block mt-2"
                  >
                    Start discovering →
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Artist Content */}
            <TabsContent value="artist" className="space-y-6">
              <Card id="studio-overview">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic2 className="h-5 w-5 text-primary" />
                    My Studio Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>
                    My Studio is your Creator Control Room – a professional
                    dashboard where you manage everything related to your music
                    career on FlyMusic.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Studio sections:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <span className="font-medium">Dashboard</span> – View stats,
                        fan activity, and quick actions
                      </li>
                      <li>
                        <span className="font-medium">Profile</span> – Edit your
                        artist info, bio, and social links
                      </li>
                      <li>
                        <span className="font-medium">Tracks</span> – Upload and
                        manage your music
                      </li>
                      <li>
                        <span className="font-medium">Videos</span> – Share video
                        updates and behind-the-scenes
                      </li>
                      <li>
                        <span className="font-medium">Analytics</span> – Track
                        plays, likes, followers, and engagement
                      </li>
                      <li>
                        <span className="font-medium">Spotlight</span> – Submit to
                        campaigns and track votes
                      </li>
                    </ul>
                  </div>
                  <Link
                    to="/studio"
                    className="text-primary hover:underline inline-block mt-2"
                  >
                    Go to My Studio →
                  </Link>
                </CardContent>
              </Card>

              <Card id="spotlight-boost">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    How Spotlight can boost you
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>
                    Spotlight campaigns give you massive visibility by putting your
                    music in front of engaged fans who are actively voting and
                    discovering new artists.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Benefits:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Featured on leaderboards and Fan Feeds</li>
                      <li>Badge on your artist profile during active campaigns</li>
                      <li>Reach fans outside your current followers</li>
                      <li>Build momentum with social sharing and votes</li>
                      <li>Archive entries show past achievements</li>
                    </ul>
                  </div>
                  <p>
                    Think of it as a launch pad: submit your best track, rally your
                    fans to vote, and watch new listeners discover you!
                  </p>
                  <Link
                    to="/studio/spotlight"
                    className="text-primary hover:underline inline-block mt-2"
                  >
                    Submit to Spotlight →
                  </Link>
                </CardContent>
              </Card>

              <Card id="supporters-help">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    How Supporters help your career
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>
                    Supporters are fans who actively engage with your music. Every
                    like, follow, vote, and share earns them XP tied to your artist
                    profile.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Why it matters:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Higher supporter levels = stronger fan loyalty</li>
                      <li>
                        Fans with Gold/Silver badges spread your music more
                      </li>
                      <li>
                        Supporter activity shows up in your dashboard activity feed
                      </li>
                      <li>
                        You can see your Top Supporters and thank them directly
                      </li>
                    </ul>
                  </div>
                  <p>
                    Focus on building relationships with your supporters – they're
                    your core fanbase and best advocates!
                  </p>
                </CardContent>
              </Card>

              <Card id="videos-tracks-collections">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    <Music className="h-4 w-4 text-muted-foreground" />
                    Videos, Tracks and Collections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Tracks:</p>
                    <p>
                      Your music library. Upload audio files (MP3, WAV), add cover
                      art, and manage track metadata. Tracks appear in search,
                      artist profiles, and fan feeds.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Videos:</p>
                    <p>
                      Short updates, behind-the-scenes, live sessions, or teasers.
                      Videos help fans connect with your creative process and
                      personality beyond just audio.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">
                      Video Collections:
                    </p>
                    <p>
                      Organize videos into themed collections (e.g., "Behind The
                      Scenes", "Live Sessions"). Collections appear on your artist
                      profile and help fans navigate your content.
                    </p>
                  </div>
                  <div className="mt-4 space-y-1">
                    <Link
                      to="/studio/tracks"
                      className="text-primary hover:underline block"
                    >
                      Upload tracks →
                    </Link>
                    <Link
                      to="/studio/videos"
                      className="text-primary hover:underline block"
                    >
                      Upload videos →
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card id="grow-audience">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    How to grow your audience on FlyMusic
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-muted-foreground">
                  <p>
                    Growing on FlyMusic requires consistent engagement, quality
                    content, and leveraging platform features strategically.
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">Growth tips:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <span className="font-medium">Upload regularly</span> – New
                        tracks and videos keep fans engaged
                      </li>
                      <li>
                        <span className="font-medium">Submit to Spotlight</span> –
                        Gain visibility in campaigns
                      </li>
                      <li>
                        <span className="font-medium">Reply to comments</span> –
                        Build relationships with fans
                      </li>
                      <li>
                        <span className="font-medium">Share on socials</span> – Drive
                        traffic from Instagram, TikTok, Twitter
                      </li>
                      <li>
                        <span className="font-medium">Post updates</span> – Keep fans
                        in the loop about new releases
                      </li>
                      <li>
                        <span className="font-medium">Track analytics</span> – See
                        what content resonates most
                      </li>
                    </ul>
                  </div>
                  <p>
                    Remember: FlyMusic rewards artist-fan relationships, not just
                    play counts. Focus on building your supporter community!
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Back to Dashboard Links */}
          <div className="mt-12 pt-8 border-t border-border text-center space-y-4">
            <p className="text-muted-foreground">Ready to dive in?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/fan">
                <button className="btn-gold-outline px-6 py-2 rounded-lg min-w-[200px]">
                  Go to Fan Portal
                </button>
              </Link>
              <Link to="/studio">
                <button className="btn-gold-premium px-6 py-2 rounded-lg min-w-[200px]">
                  Go to My Studio
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {isMobile && <BottomNavBarFan />}
    </>
  );
}
