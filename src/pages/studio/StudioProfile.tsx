import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sanitizeFileName, cn } from "@/lib/utils";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Camera, Save, Music, User, X, Plus, Upload } from "lucide-react";

export default function StudioProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
  const [artistName, setArtistName] = useState("");
  const isMobile = useIsMobile();

  const popularGenres = [
    "Pop", "Hip-Hop", "R&B", "Rock", "Electronic", 
    "Jazz", "Country", "Reggae", "Latin", "Afrobeats"
  ];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchArtistProfile();
  }, [user, navigate]);

  const fetchArtistProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('artist_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching artist profile:', error);
    } else if (data) {
      setArtistProfile(data);
      setArtistName(data.artist_name || "");
      setEditBio(data.bio || "");
      // Parse genre string into array
      const genres = data.genre ? data.genre.split(',').map((g: string) => g.trim()).filter(Boolean) : [];
      setSelectedGenres(genres);
      setEditCity(data.city || "");
      setEditCountry(data.country || "");
      setEditInstagram(data.instagram_url || "");
      setEditTiktok(data.tiktok_url || "");
      setEditYoutube(data.youtube_url || "");
      setEditTwitter(data.twitter_url || "");
      setEditWebsite(data.website_url || "");
    }
    setLoading(false);
  };

  const handleCreateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    const { error } = await supabase.from('artist_profiles').insert({
      user_id: user.id,
      artist_name: formData.get('artist_name') as string,
      bio: formData.get('bio') as string,
      genre: formData.get('genre') as string,
      city: formData.get('city') as string,
      country: formData.get('country') as string,
    });

    if (error) {
      toast.error("Error creating profile");
      console.error(error);
    } else {
      toast.success("Profile created! Awaiting approval.");
      fetchArtistProfile();
    }
  };

  const uploadAvatarFile = async (file: File) => {
    if (!user || !artistProfile) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    setUploadingAvatar(true);

    try {
      const avatarPath = `${user.id}/${Date.now()}_${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(avatarPath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarPath);

      const { error: updateError } = await supabase
        .from('artist_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', artistProfile.id);

      if (updateError) throw updateError;

      toast.success("Profile image updated!");
      fetchArtistProfile();
    } catch (error: any) {
      toast.error(error.message || "Error uploading avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    uploadAvatarFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      uploadAvatarFile(files[0]);
    } else {
      toast.error("Please drop an image file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
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
    if (!artistProfile) return;

    setSavingProfile(true);

    try {
      // Convert genres array to comma-separated string
      const genreString = selectedGenres.length > 0 ? selectedGenres.join(', ') : null;
      
      const { error } = await supabase
        .from('artist_profiles')
        .update({
          artist_name: artistName || null,
          bio: editBio || null,
          genre: genreString,
          city: editCity || null,
          country: editCountry || null,
          instagram_url: editInstagram || null,
          tiktok_url: editTiktok || null,
          youtube_url: editYoutube || null,
          twitter_url: editTwitter || null,
          website_url: editWebsite || null,
        })
        .eq('id', artistProfile.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      fetchArtistProfile();
    } catch (error: any) {
      toast.error(error.message || "Error updating profile");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!artistProfile) {
    return (
      <div className="flex min-h-screen pt-16">
        <StudioSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Create Your Artist Profile</h1>
            <Card className="p-6">
              <form onSubmit={handleCreateProfile} className="space-y-4">
                <div>
                  <Label htmlFor="artist_name">Artist Name *</Label>
                  <Input id="artist_name" name="artist_name" required />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" name="bio" rows={4} />
                </div>
                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Input id="genre" name="genre" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Create Profile
                </Button>
              </form>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (artistProfile.status === 'pending') {
    return (
      <div className="flex min-h-screen pt-16">
        <StudioSidebar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Music className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Profile Pending Approval</h2>
            <p className="text-muted-foreground">
              Your artist profile is being reviewed. You'll be able to upload tracks once approved.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen pt-16">
        <StudioSidebar />
        <MobileStudioNav />
        
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* Premium Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Profile Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your artist profile and information</p>
            </div>
          </div>

          {/* Profile Image with Drag & Drop */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Image</h2>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-32 w-32 border-2 border-primary flex-shrink-0">
                <AvatarImage src={artistProfile.avatar_url || undefined} alt={artistProfile.artist_name} />
                <AvatarFallback className="text-2xl">
                  {artistProfile.artist_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 w-full">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
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
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </Label>
                  {uploadingAvatar && (
                    <p className="text-sm text-primary mt-2">Uploading...</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Edit Profile */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="artist_name">Artist Name</Label>
                <Input
                  id="artist_name"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Your artist name"
                />
              </div>
              <div>
                <Label htmlFor="edit_bio">Bio</Label>
                <Textarea
                  id="edit_bio"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={6}
                  placeholder="Tell fans about yourself..."
                />
              </div>
              <div>
                <Label htmlFor="edit_genre">Genres</Label>
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
                disabled={savingProfile}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {savingProfile ? "Saving..." : "Save Profile"}
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
