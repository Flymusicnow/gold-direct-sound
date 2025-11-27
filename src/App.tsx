import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import ArtistProfile from "./pages/ArtistProfile";
import StudioDashboard from "./pages/studio/StudioDashboard";
import StudioProfile from "./pages/studio/StudioProfile";
import StudioTracks from "./pages/studio/StudioTracks";
import StudioEvents from "./pages/studio/StudioEvents";
import StudioAnalytics from "./pages/studio/StudioAnalytics";
import StudioComments from "./pages/studio/StudioComments";
import FanPortal from "./pages/FanPortal";
import FanFeed from "./pages/FanFeed";
import FanArtists from "./pages/FanArtists";
import FanActivity from "./pages/FanActivity";
import FanSettings from "./pages/FanSettings";
import RoleSelection from "./pages/RoleSelection";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/artist/:userId" element={<ArtistProfile />} />
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
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
