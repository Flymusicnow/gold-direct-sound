import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useArtistProfile } from "@/hooks/useArtistProfile";
import { useUserAccessState } from "@/hooks/useUserAccessState";
import { cn } from "@/lib/utils";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { useIsMobile } from "@/hooks/use-mobile";
import { AvatarUploadProgress } from "@/components/ui/avatar-upload-progress";
import { BannerUploadSection } from "@/components/studio/BannerUploadSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, User, X, Plus, Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function StudioProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  // Use unified artist profile hook
  const {
    profile: artistProfile,
    loading,
    saving,
    createProfile,
    updateProfile,
    avatarUploader,
    nameAvailability,
    hasProfile,
    refetch,
  } = useArtistProfile();

  // Check if user is still in onboarding
  const { artistOnboarded } = useUserAccessState();

  // Local form state
  const [artistName, setArtistName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editTiktok, setEditTiktok] = useState("");
  const [editYoutube, setEditYoutube] = useState("");
  const [editTwitter, setEditTwitter] = useState("");
  const [editWebsite, setEditWebsite] = useState("");

  const popularGenres = [
    "Pop", "Hip-Hop", "R&B", "Rock", "Electronic", 
    "Jazz", "Country", "Reggae", "Latin", "Afrobeats"
  ];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  // Populate form when profile loads
  useEffect(() => {
    if (artistProfile) {
      setArtistName(artistProfile.artist_name || "");
      setEditBio(artistProfile.bio || "");
      const genres = artistProfile.genre ? artistProfile.genre.split(',').map((g: string) => g.trim()).filter(Boolean) : [];
      setSelectedGenres(genres);
      setEditCity(artistProfile.city || "");
      setEditCountry(artistProfile.country || "");
      setEditInstagram(artistProfile.instagram_url || "");
      setEditTiktok(artistProfile.tiktok_url || "");
      setEditYoutube(artistProfile.youtube_url || "");
      setEditTwitter(artistProfile.twitter_url || "");
      setEditWebsite(artistProfile.website_url || "");
    }
  }, [artistProfile]);

  // Handle artist name change with real-time availability check
  const handleArtistNameChange = (value: string) => {
    setArtistName(value);
    // Only check availability for new profiles or if name changed
    if (!artistProfile || value !== artistProfile.artist_name) {
      nameAvailability.checkAvailability(value);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (nameAvailability.isAvailable === false) {
      toast.error("This artist name is already taken");
      return;
    }

    const result = await createProfile({
      artistName,
      bio: editBio,
      genre: selectedGenres.join(', '),
      city: editCity,
      country: editCountry,
    });

    if (result.success) {
      toast.success("Profile created – welcome to your studio!");
      navigate('/studio', { replace: true });
    } else {
      toast.error(result.error || "Error creating profile");
    }
  };

  const addGenre = (genre: string) => {
    const trimmed = genre.trim();
    if (trimmed && !selectedGenres.includes(trimmed)) {
      setSelectedGenres([...selectedGenres, trimmed]);
      setGenreInput("");
    }
  };

  const removeGenre = (genre: string) => {
    setSelectedGenres(selectedGenres.filter(g => g !== genre));
  };

  const handleGenreInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addGenre(genreInput);
    }
  };

  const handleSaveProfile = async () => {
    if (nameAvailability.isAvailable === false) {
      toast.error("This artist name is already taken");
      return;
    }

    const genreString = selectedGenres.length > 0 ? selectedGenres.join(', ') : undefined;
    
    const result = await updateProfile({
      artistName,
      bio: editBio,
      genre: genreString,
      city: editCity,
      country: editCountry,
      instagramUrl: editInstagram,
      tiktokUrl: editTiktok,
      youtubeUrl: editYoutube,
      twitterUrl: editTwitter,
      websiteUrl: editWebsite,
    });

    if (result.success) {
      toast.success("Profile updated successfully!");
    } else {
      toast.error(result.error || "Error updating profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  // Create profile form (no pending screen - direct to studio after creation)
  if (!hasProfile) {
    return (
      <div className="h-screen overflow-hidden flex pt-16">
        <StudioSidebar />
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-auto-hide p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">{t('studio.createProfile')}</h1>
            <Card className="p-6">
              <form onSubmit={handleCreateProfile} className="space-y-4">
                <div>
                  <Label htmlFor="artist_name">{t('studio.artistName')} *</Label>
                  <div className="relative">
                    <Input 
                      id="artist_name" 
                      value={artistName}
                      onChange={(e) => handleArtistNameChange(e.target.value)}
                      required 
                      className="pr-10"
                    />
                    {/* Real-time availability indicator */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {nameAvailability.isChecking && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {!nameAvailability.isChecking && nameAvailability.isAvailable === true && artistName.length >= 2 && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {!nameAvailability.isChecking && nameAvailability.isAvailable === false && (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  {nameAvailability.isAvailable === false && (
                    <p className="text-sm text-destructive mt-1">This artist name is already taken</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="bio">{t('studio.bio')}</Label>
                  <Textarea 
                    id="bio" 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={4} 
                  />
                </div>
                <div>
                  <Label htmlFor="genre">{t('studio.genre')}</Label>
                  <Input 
                    id="genre" 
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                    onKeyDown={handleGenreInputKeyDown}
                    placeholder="Type a genre and press Enter"
                  />
                  {selectedGenres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedGenres.map((genre) => (
                        <Badge key={genre} variant="secondary" className="pl-3 pr-2 py-1">
                          {genre}
                          <button onClick={() => removeGenre(genre)} className="ml-2">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">{t('studio.city')}</Label>
                    <Input 
                      id="city" 
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">{t('studio.country')}</Label>
                    <Input 
                      id="country" 
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={saving || nameAvailability.isAvailable === false}
                >
                  {saving ? "Creating..." : t('studio.createProfile')}
                </Button>
              </form>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Main profile edit view (removed pending approval screen)
  return (
    <>
      <div className="h-screen overflow-hidden flex pt-16">
        <StudioSidebar />
        <MobileStudioNav />
        
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-auto-hide p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* Premium Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{t('studio.profileSettings')}</h1>
              <p className="text-sm text-muted-foreground">{t('studio.profileSettingsDescription')}</p>
            </div>
          </div>

          {/* Profile Image with Progress Upload */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t('studio.profileImage')}</h2>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <AvatarUploadProgress
                currentUrl={artistProfile?.avatar_url}
                fallback={artistProfile?.artist_name?.charAt(0).toUpperCase() || "A"}
                size="xl"
                uploading={avatarUploader.uploading}
                progress={avatarUploader.progress}
                onFileSelect={avatarUploader.handleFileSelect}
                onDrop={avatarUploader.handleDrop}
                onDragOver={avatarUploader.handleDragOver}
                onDragLeave={avatarUploader.handleDragLeave}
                dragActive={avatarUploader.dragActive}
              />
              <div className="flex-1 w-full">
                <div
                  onDrop={avatarUploader.handleDrop}
                  onDragOver={avatarUploader.handleDragOver}
                  onDragLeave={avatarUploader.handleDragLeave}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    avatarUploader.dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="text-sm">
                      <span className="text-primary font-medium">Click to upload</span>
                      {" or drag and drop"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WEBP up to 10MB
                    </p>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={avatarUploader.handleFileSelect}
                      disabled={avatarUploader.uploading}
                    />
                  </Label>
                  {avatarUploader.uploading && (
                    <p className="text-sm text-primary mt-2">Uploading... {avatarUploader.progress}%</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Profile Banner Upload */}
          {artistProfile && (
            <BannerUploadSection
              profileId={artistProfile.id}
              userId={artistProfile.user_id}
              artistName={artistProfile.artist_name}
              avatarUrl={artistProfile.avatar_url}
              genre={artistProfile.genre}
              city={artistProfile.city}
              country={artistProfile.country}
              desktopBanner={{
                url: artistProfile.banner_url,
                mediaType: artistProfile.banner_media_type as 'image' | 'video' | null,
                cropData: artistProfile.banner_crop_data as any,
              }}
              mobileBanner={{
                url: artistProfile.banner_url_mobile,
                mediaType: artistProfile.banner_media_type_mobile as 'image' | 'video' | null,
                cropData: artistProfile.banner_crop_data_mobile as any,
              }}
              onSuccess={refetch}
            />
          )}

          {/* Edit Profile */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t('studio.profileInformation')}</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="artist_name">{t('studio.artistName')}</Label>
                <div className="relative">
                  <Input
                    id="artist_name"
                    value={artistName}
                    onChange={(e) => handleArtistNameChange(e.target.value)}
                    placeholder="Your artist name"
                    className="pr-10"
                  />
                  {/* Real-time availability indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {nameAvailability.isChecking && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!nameAvailability.isChecking && nameAvailability.isAvailable === true && artistName !== artistProfile?.artist_name && artistName.length >= 2 && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {!nameAvailability.isChecking && nameAvailability.isAvailable === false && (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                {nameAvailability.isAvailable === false && (
                  <p className="text-sm text-destructive mt-1">This artist name is already taken</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit_bio">{t('studio.bio')}</Label>
                <Textarea
                  id="edit_bio"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={6}
                  placeholder={t('studio.bioPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="edit_genre">{t('studio.genres')}</Label>
                <div className="space-y-3">
                  {/* Selected Genres */}
                  {selectedGenres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedGenres.map((genre) => (
                        <Badge
                          key={genre}
                          variant="secondary"
                          className="pl-3 pr-2 py-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                        >
                          {genre}
                          <button
                            onClick={() => removeGenre(genre)}
                            className="ml-2 hover:text-primary"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Add Genre Input */}
                  <div className="flex gap-2">
                    <Input
                      id="edit_genre"
                      value={genreInput}
                      onChange={(e) => setGenreInput(e.target.value)}
                      onKeyDown={handleGenreInputKeyDown}
                      placeholder="Type a genre and press Enter"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => addGenre(genreInput)}
                      disabled={!genreInput.trim()}
                      size="sm"
                      variant="outline"
                      className="border-primary/50 hover:bg-primary/10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Popular Genres */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Popular genres:</p>
                    <div className="flex flex-wrap gap-2">
                      {popularGenres.map((genre) => (
                        <Badge
                          key={genre}
                          variant="outline"
                          className={cn(
                            "cursor-pointer transition-colors",
                            selectedGenres.includes(genre)
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "hover:border-primary/50 hover:bg-muted/50"
                          )}
                          onClick={() => {
                            if (selectedGenres.includes(genre)) {
                              removeGenre(genre);
                            } else {
                              addGenre(genre);
                            }
                          }}
                        >
                          {selectedGenres.includes(genre) && <X className="h-3 w-3 mr-1" />}
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_city">City</Label>
                  <Input
                    id="edit_city"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Stockholm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_country">Country</Label>
                  <Input
                    id="edit_country"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    placeholder="Sweden"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label>Social Links</Label>
                <div className="space-y-2">
                  <Input
                    value={editInstagram}
                    onChange={(e) => setEditInstagram(e.target.value)}
                    placeholder="Instagram URL"
                  />
                  <Input
                    value={editTiktok}
                    onChange={(e) => setEditTiktok(e.target.value)}
                    placeholder="TikTok URL"
                  />
                  <Input
                    value={editYoutube}
                    onChange={(e) => setEditYoutube(e.target.value)}
                    placeholder="YouTube URL"
                  />
                  <Input
                    value={editTwitter}
                    onChange={(e) => setEditTwitter(e.target.value)}
                    placeholder="Twitter/X URL"
                  />
                  <Input
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="Website URL"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={saving || nameAvailability.isAvailable === false}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </Card>
        </div>
      </main>
      </div>
      {isMobile && <BottomNavBarStudio />}
    </>
  );
}
