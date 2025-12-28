import { Toaster } from "@/components/ui/toaster";
import BrandPortal from "./pages/BrandPortal";
import BrandApply from "./pages/brand/BrandApply";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FanTasteProvider } from "@/contexts/FanTasteContext";
import { FlightdeckProvider } from "@/contexts/FlightdeckContext";
import { VideoPlaybackProvider } from "@/contexts/VideoPlaybackContext";
import { FeatureFlagProvider } from "@/contexts/FeatureFlagContext";
import { RouteHistoryProvider } from "@/contexts/RouteHistoryContext";
import { ReproModeProvider } from "@/contexts/ReproModeContext";
import { VerificationModeProvider } from "@/contexts/VerificationModeContext";
import { NavigationWrapper } from "@/components/NavigationWrapper";
import { FlightdeckLayout } from "@/components/flightdeck/FlightdeckLayout";
import { ReproDebugPanel } from "@/components/debug/ReproDebugPanel";
import { VerificationBanner } from "@/components/verification/VerificationBanner";
import { initNetworkErrorTracker } from "@/lib/networkErrorTracker";
import Home from "./pages/Home";

// Initialize network error tracking
initNetworkErrorTracker();
import Auth from "./pages/Auth";
import ResetPassword from "./pages/auth/ResetPassword";
import JoinArtist from "./pages/auth/JoinArtist";
import JoinFan from "./pages/auth/JoinFan";
import JoinBrand from "./pages/auth/JoinBrand";
import SignInArtist from "./pages/auth/SignInArtist";
import SignInFan from "./pages/auth/SignInFan";
import SignInBrand from "./pages/auth/SignInBrand";
import Explore from "./pages/Explore";
import ArtistProfile from "./pages/ArtistProfile";
import StudioDashboard from "./pages/studio/StudioDashboard";
import StudioOnboarding from "./pages/studio/StudioOnboarding";
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
import StudioEarnings from "./pages/studio/StudioEarnings";
import StudioMerch from "./pages/studio/StudioMerch";
import StudioLiveStreams from "./pages/studio/StudioLiveStreams";
import StudioPromo from "./pages/studio/StudioPromo";
import StudioSettings from "./pages/studio/StudioSettings";
import StudioPresskit from "./pages/studio/StudioPresskit";
import StudioOpportunities from "./pages/studio/StudioOpportunities";
import PromoPreview from "./pages/PromoPreview";
import PublicPresskit from "./pages/PublicPresskit";
import LiveStream from "./pages/LiveStream";
import FanPortal from "./pages/FanPortal";
import FanOnboarding from "./pages/fan/FanOnboarding";
import FanFeed from "./pages/FanFeed";
import FanArtists from "./pages/FanArtists";
import FanActivity from "./pages/FanActivity";
import FanSettings from "./pages/fan/FanSettings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSpotlight from "./pages/admin/AdminSpotlight";
import AdminSpotlightEntries from "./pages/admin/AdminSpotlightEntries";
import AdminBetaCodes from "./pages/admin/AdminBetaCodes";
import AdminPayouts from "./pages/admin/AdminPayouts";
import AdminFeatures from "./pages/admin/AdminFeatures";
import AdminCollabEntities from "./pages/admin/AdminCollabEntities";
import AdminCollabEntityEdit from "./pages/admin/AdminCollabEntityEdit";
import AdminMatching from "./pages/admin/AdminMatching";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminActivityLog from "./pages/admin/AdminActivityLog";
import AdminBrandApplications from "./pages/admin/AdminBrandApplications";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminRoleManagement from "./pages/admin/AdminRoleManagement";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminUpdates from "./pages/admin/AdminUpdates";
import AdminArtists from "./pages/admin/AdminArtists";
import AdminTracks from "./pages/admin/AdminTracks";
import AdminQA from "./pages/admin/AdminQA";
import AdminInbox from "./pages/admin/AdminInbox";
import AdminInboxDetail from "./pages/admin/AdminInboxDetail";
import AdminSmartLinks from "./pages/admin/AdminSmartLinks";
import AdminOpportunities from "./pages/admin/AdminOpportunities";
import AdminWaitlist from "./pages/admin/AdminWaitlist";
import StudioSmartLink from "./pages/studio/StudioSmartLink";
import SmartLinkPage from "./pages/SmartLinkPage";
import TrustPage from "./pages/trust/TrustPage";
import PrinciplesPage from "./pages/trust/PrinciplesPage";
import CulturePage from "./pages/trust/CulturePage";
import SafetyPage from "./pages/trust/SafetyPage";
import DataPage from "./pages/trust/DataPage";
import StudioSpotlight from "./pages/studio/StudioSpotlight";
import SpotlightCampaign from "./pages/spotlight/SpotlightCampaign";
import SpotlightLeaderboard from "./pages/spotlight/SpotlightLeaderboard";
import SpotlightArchive from "./pages/spotlight/SpotlightArchive";
import SpotlightResults from "./pages/spotlight/SpotlightResults";
import FanLeaderboard from "./pages/spotlight/FanLeaderboard";
import FanPlaylists from "./pages/FanPlaylists";
import PlaylistDetail from "./pages/PlaylistDetail";
import FanSupporter from "./pages/FanSupporter";
import FanAchievements from "./pages/FanAchievements";
import FanMissions from "./pages/fan/FanMissions";
import FanWrapped from "./pages/fan/FanWrapped";
import Search from "./pages/Search";
import Discover from "./pages/Discover";
import Learn from "./pages/Learn";
import VideoCollectionDetail from "./pages/VideoCollectionDetail";
import Pricing from "./pages/Pricing";
import HowItWorks from "./pages/HowItWorks";
import TopArtists from "./pages/TopArtists";
import NotFound from "./pages/NotFound";
import RoleSelection from "./pages/RoleSelection";
import Changelog from "./pages/Changelog";
import FanGate from "./pages/FanGate";
import StudioVerification from "./pages/studio/StudioVerification";
import AdminVerifications from "./pages/admin/AdminVerifications";
import CheckoutSuccess from "./pages/checkout/CheckoutSuccess";
import CheckoutCancel from "./pages/checkout/CheckoutCancel";
import ArtistAchievements from "./pages/ArtistAchievements";
import UserAgreement from "./pages/legal/UserAgreement";
import ArtistAgreement from "./pages/legal/ArtistAgreement";
import FanTerms from "./pages/legal/FanTerms";
import BrandPortalTerms from "./pages/legal/BrandPortalTerms";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import RiskDisclaimer from "./pages/legal/RiskDisclaimer";
import BrandDashboard from "./pages/brand/BrandDashboard";
import BrandOnboarding from "./pages/brand/BrandOnboarding";
import BrandProfile from "./pages/brand/BrandProfile";
import BrandDiscovery from "./pages/brand/BrandDiscovery";
import BrandOpportunities from "./pages/brand/BrandOpportunities";
import BrandApplications from "./pages/brand/BrandApplications";
import BrandSettings from "./pages/brand/BrandSettings";
import BrandAnalytics from "./pages/brand/BrandAnalytics";
import BrandInbox from "./pages/brand/BrandInbox";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SwipeBackProvider } from "@/components/mobile/SwipeBackProvider";
import { EarlyAccessGate } from "@/components/EarlyAccessGate";
import { ScrollToTop } from "@/components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <FeatureFlagProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <RouteHistoryProvider>
        <ReproModeProvider>
        <AuthProvider>
        <VerificationModeProvider>
          <ReproDebugPanel />
          <VerificationBanner />
          {/* Public routes - outside EarlyAccessGate */}
          <Routes>
            <Route path="/link/:slug" element={<PromoPreview />} />
            <Route path="/epk/:slug" element={<PublicPresskit />} />
            <Route path="/@:slug" element={<SmartLinkPage />} />
            <Route path="/brands/apply" element={<BrandApply />} />
            <Route path="/brands" element={<BrandPortal />} />
            <Route path="/trust" element={<TrustPage />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/top-artists" element={<TopArtists />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/search" element={<Search />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/fan" element={<FanGate />} />
            <Route path="/principles" element={<PrinciplesPage />} />
            <Route path="/culture" element={<CulturePage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/data" element={<DataPage />} />
            <Route path="*" element={
          <EarlyAccessGate>
            <FanTasteProvider>
              <VideoPlaybackProvider>
                <FlightdeckProvider>
                  <SwipeBackProvider>
                  <FlightdeckLayout>
                  <NavigationWrapper />
                <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/join/artist" element={<JoinArtist />} />
            <Route path="/join/fan" element={<JoinFan />} />
            <Route path="/join/brand" element={<JoinBrand />} />
            <Route path="/signin/artist" element={<SignInArtist />} />
            <Route path="/signin/fan" element={<SignInFan />} />
            <Route path="/signin/brand" element={<SignInBrand />} />
            <Route path="/artist/:userId" element={<ArtistProfile />} />
            <Route path="/artist/:userId/achievements" element={<ArtistAchievements />} />
            <Route path="/studio/onboarding" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/fan/onboarding" element={
              <ProtectedRoute allowedRoles={['fan']}>
                <FanOnboarding />
              </ProtectedRoute>
            } />
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
            <Route path="/studio/earnings" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioEarnings />
              </ProtectedRoute>
            } />
            <Route path="/studio/promo" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioPromo />
              </ProtectedRoute>
            } />
            <Route path="/studio/settings" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioSettings />
              </ProtectedRoute>
            } />
            <Route path="/studio/presskit" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioPresskit />
              </ProtectedRoute>
            } />
            <Route path="/studio/opportunities" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioOpportunities />
              </ProtectedRoute>
            } />
            <Route path="/studio/smart-link" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioSmartLink />
              </ProtectedRoute>
            } />
            <Route path="/studio/verification" element={
              <ProtectedRoute allowedRoles={['artist']}>
                <StudioVerification />
              </ProtectedRoute>
            } />
            <Route path="/spotlight/leaderboard" element={<FanLeaderboard />} />
            <Route path="/spotlight/archive" element={<SpotlightArchive />} />
            <Route path="/spotlight/:campaignId/results" element={<SpotlightResults />} />
            <Route path="/spotlight/:campaignId" element={<SpotlightCampaign />} />
            <Route path="/spotlight/:campaignId/leaderboard" element={<SpotlightLeaderboard />} />
            <Route path="/live/:streamId" element={<LiveStream />} />
            <Route path="/collections/:collectionId" element={<VideoCollectionDetail />} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/qa" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminQA /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/users/:userId" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminUserDetail /></ProtectedRoute>} />
            <Route path="/admin/artists" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminArtists /></ProtectedRoute>} />
            <Route path="/admin/tracks" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminTracks /></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminApprovals /></ProtectedRoute>} />
            <Route path="/admin/activity" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminActivityLog /></ProtectedRoute>} />
            <Route path="/admin/spotlight" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminSpotlight /></ProtectedRoute>} />
            <Route path="/admin/spotlight/:campaignId" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminSpotlightEntries /></ProtectedRoute>} />
            <Route path="/admin/beta-codes" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminBetaCodes /></ProtectedRoute>} />
            <Route path="/admin/payouts" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminPayouts /></ProtectedRoute>} />
            <Route path="/admin/features" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminFeatures /></ProtectedRoute>} />
            <Route path="/admin/collab-entities" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminCollabEntities /></ProtectedRoute>} />
            <Route path="/admin/collab-entities/:id" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminCollabEntityEdit /></ProtectedRoute>} />
            <Route path="/admin/matching" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminMatching /></ProtectedRoute>} />
            <Route path="/admin/opportunities" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminOpportunities /></ProtectedRoute>} />
            <Route path="/admin/brand-applications" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminBrandApplications /></ProtectedRoute>} />
            <Route path="/admin/campaigns" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminCampaigns /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={['super_admin']}><AdminRoleManagement /></ProtectedRoute>} />
            <Route path="/admin/updates" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminUpdates /></ProtectedRoute>} />
            <Route path="/admin/smart-links" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminSmartLinks /></ProtectedRoute>} />
            <Route path="/admin/inbox" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminInbox /></ProtectedRoute>} />
            <Route path="/admin/inbox/:id" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminInboxDetail /></ProtectedRoute>} />
            <Route path="/admin/verifications" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminVerifications /></ProtectedRoute>} />
            <Route path="/admin/waitlist" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminWaitlist /></ProtectedRoute>} />
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
            <Route path="/fan/achievements" element={
              <ProtectedRoute allowedRoles={['fan']}>
                <FanAchievements />
              </ProtectedRoute>
            } />
            <Route path="/fan/missions" element={
              <ProtectedRoute allowedRoles={['fan']}>
                <FanMissions />
              </ProtectedRoute>
            } />
            <Route path="/fan/wrapped" element={
              <ProtectedRoute allowedRoles={['fan']}>
                <FanWrapped />
              </ProtectedRoute>
            } />
            <Route path="/discover" element={<Discover />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/legal/user-agreement" element={<UserAgreement />} />
            <Route path="/legal/artist-agreement" element={<ArtistAgreement />} />
            <Route path="/legal/fan-terms" element={<FanTerms />} />
            <Route path="/legal/brand-portal-terms" element={<BrandPortalTerms />} />
            <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/legal/risk-disclaimer" element={<RiskDisclaimer />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/cancel" element={<CheckoutCancel />} />
            <Route path="/brand/onboarding" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/brand" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandDashboard />
              </ProtectedRoute>
            } />
            <Route path="/brand/profile" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandProfile />
              </ProtectedRoute>
            } />
            <Route path="/brand/discovery" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandDiscovery />
              </ProtectedRoute>
            } />
            <Route path="/brand/opportunities" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandOpportunities />
              </ProtectedRoute>
            } />
            <Route path="/brand/applications" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandApplications />
              </ProtectedRoute>
            } />
            <Route path="/brand/analytics" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/brand/settings" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandSettings />
              </ProtectedRoute>
            } />
            <Route path="/brand/inbox" element={
              <ProtectedRoute allowedRoles={['brand']}>
                <BrandInbox />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
              </FlightdeckLayout>
              </SwipeBackProvider>
            </FlightdeckProvider>
            </VideoPlaybackProvider>
          </FanTasteProvider>
          </EarlyAccessGate>
            } />
          </Routes>
        </VerificationModeProvider>
        </AuthProvider>
        </ReproModeProvider>
        </RouteHistoryProvider>
      </BrowserRouter>
    </TooltipProvider>
    </FeatureFlagProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
