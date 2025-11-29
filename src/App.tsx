import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FlightdeckProvider } from "@/contexts/FlightdeckContext";
import { Navigation } from "@/components/Navigation";
import { FlightdeckPlayer } from "@/components/flightdeck/FlightdeckPlayer";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import ArtistProfile from "./pages/ArtistProfile";
import StudioDashboard from "./pages/studio/StudioDashboard";
import StudioProfile from "./pages/studio/StudioProfile";
import StudioTracks from "./pages/studio/StudioTracks";
import StudioVideos from "./pages/studio/StudioVideos";
import StudioVideoCollections from "./pages/studio/StudioVideoCollections";
import StudioEvents from "./pages/studio/StudioEvents";
import StudioAnalytics from "./pages/studio/StudioAnalytics";
import StudioComments from "./pages/studio/StudioComments";
import StudioTestimonials from "./pages/studio/StudioTestimonials";
import StudioCollaborations from "./pages/studio/StudioCollaborations";
import StudioSubscription from "./pages/studio/StudioSubscription";
import StudioMerch from "./pages/studio/StudioMerch";
import StudioLiveStreams from "./pages/studio/StudioLiveStreams";
import LiveStream from "./pages/LiveStream";
import FanPortal from "./pages/FanPortal";
import FanFeed from "./pages/FanFeed";
import FanArtists from "./pages/FanArtists";
import FanActivity from "./pages/FanActivity";
import FanSettings from "./pages/FanSettings";
import RoleSelection from "./pages/RoleSelection";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSpotlight from "./pages/admin/AdminSpotlight";
import AdminSpotlightEntries from "./pages/admin/AdminSpotlightEntries";
import AdminBetaCodes from "./pages/admin/AdminBetaCodes";
import StudioSpotlight from "./pages/studio/StudioSpotlight";
import SpotlightCampaign from "./pages/spotlight/SpotlightCampaign";
import SpotlightLeaderboard from "./pages/spotlight/SpotlightLeaderboard";
import SpotlightArchive from "./pages/spotlight/SpotlightArchive";
import SpotlightResults from "./pages/spotlight/SpotlightResults";
import FanLeaderboard from "./pages/spotlight/FanLeaderboard";
import FanPlaylists from "./pages/FanPlaylists";
import PlaylistDetail from "./pages/PlaylistDetail";
import FanSupporter from "./pages/FanSupporter";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import ArtistAchievements from "./pages/ArtistAchievements";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SwipeBackProvider } from "@/components/mobile/SwipeBackProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FlightdeckProvider>
            <SwipeBackProvider>
              <Navigation />
              <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/artist/:userId" element={<ArtistProfile />} />
            <Route path="/artist/:userId/achievements" element={<ArtistAchievements />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route path="/studio" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioDashboard />
              </ProtectedRoute>
            } />
            <Route path="/studio/profile" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioProfile />
              </ProtectedRoute>
            } />
            <Route path="/studio/tracks" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioTracks />
              </ProtectedRoute>
            } />
            <Route path="/studio/videos" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioVideos />
              </ProtectedRoute>
            } />
            <Route path="/studio/video-collections" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioVideoCollections />
              </ProtectedRoute>
            } />
            <Route path="/studio/events" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioEvents />
              </ProtectedRoute>
            } />
            <Route path="/studio/analytics" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/studio/comments" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioComments />
              </ProtectedRoute>
            } />
            <Route path="/studio/testimonials" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioTestimonials />
              </ProtectedRoute>
            } />
            <Route path="/studio/collaborations" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioCollaborations />
              </ProtectedRoute>
            } />
            <Route path="/studio/merch" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioMerch />
              </ProtectedRoute>
            } />
            <Route path="/studio/live" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioLiveStreams />
              </ProtectedRoute>
            } />
            <Route path="/studio/spotlight" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioSpotlight />
              </ProtectedRoute>
            } />
            <Route path="/studio/subscription" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioSubscription />
              </ProtectedRoute>
            } />
            <Route path="/spotlight/leaderboard" element={<FanLeaderboard />} />
            <Route path="/spotlight/archive" element={<SpotlightArchive />} />
            <Route path="/spotlight/:campaignId/results" element={<SpotlightResults />} />
            <Route path="/spotlight/:campaignId" element={<SpotlightCampaign />} />
            <Route path="/spotlight/:campaignId/leaderboard" element={<SpotlightLeaderboard />} />
            <Route path="/live/:streamId" element={<LiveStream />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/spotlight" element={<AdminSpotlight />} />
            <Route path="/admin/spotlight/:campaignId" element={<AdminSpotlightEntries />} />
            <Route path="/admin/beta-codes" element={<AdminBetaCodes />} />
            <Route path="/fan" element={
              <ProtectedRoute allowedRoles={['fan']}>
                <FanPortal />
              </ProtectedRoute>
            } />
            <Route path="/fan/feed" element={
              <ProtectedRoute allowedRoles={['fan']}>
                <FanFeed />
              </ProtectedRoute>
            } />
            <Route path="/fan/artists" element={
              <ProtectedRoute allowedRoles={['fan']}>
                <FanArtists />
              </ProtectedRoute>
            } />
            <Route path="/fan/activity" element={
              <ProtectedRoute allowedRoles={['fan']}>
                <FanActivity />
              </ProtectedRoute>
            } />
            <Route path="/fan/settings" element={
              <ProtectedRoute allowedRoles={['fan']}>
                <FanSettings />
              </ProtectedRoute>
            } />
            <Route path="/fan/playlists" element={
              <ProtectedRoute allowedRoles={['fan']}>
                <FanPlaylists />
              </ProtectedRoute>
            } />
            <Route path="/fan/playlists/:playlistId" element={
              <ProtectedRoute allowedRoles={['fan']}>
                <PlaylistDetail />
              </ProtectedRoute>
            } />
            <Route path="/fan/supporter" element={
              <ProtectedRoute allowedRoles={['fan']}>
                <FanSupporter />
              </ProtectedRoute>
            } />
            <Route path="/search" element={<Search />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FlightdeckPlayer />
          </SwipeBackProvider>
        </FlightdeckProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
