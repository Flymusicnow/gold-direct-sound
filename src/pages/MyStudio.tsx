import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useArtistProfile } from "@/hooks/useArtistProfile";
import { useFanProfile } from "@/hooks/useFanProfile";
import { sanitizeFileName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { AvatarUploadProgress } from "@/components/ui/avatar-upload-progress";
import { toast } from "sonner";
import { Upload, Trash2, Save, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Track {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_url: string | null;
}

export default function MyStudio() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  
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
    isApproved,
  } = useArtistProfile();

  // Track upload form
  const [trackTitle, setTrackTitle] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Create profile form state
  const [artistName, setArtistName] = useState("");
  const [bio, setBio] = useState("");
  const [genre, setGenre] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  // Edit profile form
  const [editBio, setEditBio] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editTiktok, setEditTiktok] = useState("");
  const [editYoutube, setEditYoutube] = useState("");
  const [editTwitter, setEditTwitter] = useState("");
  const [editWebsite, setEditWebsite] = useState("");

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile?.role !== 'artist') {
      navigate('/');
      return;
    }
  }, [user, profile, navigate]);

  // Populate edit form when profile loads
  useEffect(() => {
    if (artistProfile) {
      setEditBio(artistProfile.bio || "");
      setEditGenre(artistProfile.genre || "");
      setEditCity(artistProfile.city || "");
      setEditCountry(artistProfile.country || "");
      setEditInstagram(artistProfile.instagram_url || "");
      setEditTiktok(artistProfile.tiktok_url || "");
      setEditYoutube(artistProfile.youtube_url || "");
      setEditTwitter(artistProfile.twitter_url || "");
      setEditWebsite(artistProfile.website_url || "");
      fetchTracks();
    }
  }, [artistProfile]);

  const fetchTracks = async () => {
    if (!artistProfile) return;

    const { data } = await supabase
      .from('tracks')
      .select('*')
      .eq('artist_id', artistProfile.id)
      .order('created_at', { ascending: false });

    if (data) setTracks(data);
  };

  const handleArtistNameChange = (value: string) => {
    setArtistName(value);
    nameAvailability.checkAvailability(value);
  };

  const handleCreateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (nameAvailability.isAvailable === false) {
      toast.error("This artist name is already taken");
      return;
    }

    const result = await createProfile({
      artistName,
      bio,
      genre,
      city,
      country,
    });

    if (result.success) {
      toast.success("Profile created – welcome to your studio!");
      navigate('/studio', { replace: true });
    } else {
      toast.error(result.error || "Error creating profile");
    }
  };

  const handleTrackUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !artistProfile) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      toast.error("Please select an audio file");
      return;
    }

    setUploading(true);

    try {
      // Upload cover image if provided
      let coverUrl = null;
      if (coverFile) {
        const coverPath = `${user.id}/${Date.now()}_${sanitizeFileName(coverFile.name)}`;
        const { error: coverError } = await supabase.storage
          .from('covers')
          .upload(coverPath, coverFile);

        if (coverError) throw coverError;

        const { data: { publicUrl } } = supabase.storage
          .from('covers')
          .getPublicUrl(coverPath);

        coverUrl = publicUrl;
      }

      // Upload audio file
      const audioPath = `${user.id}/${Date.now()}_${sanitizeFileName(audioFile.name)}`;
      const { error: uploadError } = await supabase.storage
        .from('tracks')
        .upload(audioPath, audioFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tracks')
        .getPublicUrl(audioPath);

      // Create track record
      const { error: insertError } = await supabase.from('tracks').insert({
        artist_id: artistProfile.id,
        title: trackTitle,
        description: trackDescription || null,
        audio_url: publicUrl,
        cover_url: coverUrl,
      });

      if (insertError) throw insertError;

      toast.success("Track uploaded successfully!");
      setTrackTitle("");
      setTrackDescription("");
      setCoverFile(null);
      form.reset();
      fetchTracks();
    } catch (error: any) {
      toast.error(error.message || "Error uploading track");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    const { error } = await supabase.from('tracks').delete().eq('id', trackId);

    if (error) {
      toast.error("Error deleting track");
    } else {
      toast.success("Track deleted");
      fetchTracks();
    }
  };

  const handleSaveProfile = async () => {
    const result = await updateProfile({
      bio: editBio,
      genre: editGenre,
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
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Create profile form (no pending screen anymore)
  if (!hasProfile) {
    return (
      <div className="min-h-screen py-24 px-4">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-8">Create Your Artist Profile</h1>
          <Card className="p-6">
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <Label htmlFor="artist_name">Artist Name *</Label>
                <div className="relative">
                  <Input 
                    id="artist_name" 
                    value={artistName}
                    onChange={(e) => handleArtistNameChange(e.target.value)}
                    required 
                    className="pr-10"
                  />
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
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4} 
                />
              </div>
              <div>
                <Label htmlFor="genre">Genre</Label>
                <Input 
                  id="genre" 
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input 
                    id="country" 
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-gold"
                disabled={saving || nameAvailability.isAvailable === false}
              >
                {saving ? "Creating..." : "Create Profile"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // Removed pending/rejected screens - artists are always approved on creation

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Studio</h1>

        {/* Profile Image with Progress Upload */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Profile Image</h2>
          <div className="flex items-center gap-6">
            <AvatarUploadProgress
              currentUrl={artistProfile?.avatar_url}
              fallback={artistProfile?.artist_name?.charAt(0).toUpperCase() || "A"}
              size="xl"
              uploading={avatarUploader.uploading}
              progress={avatarUploader.progress}
              onFileSelect={avatarUploader.handleFileSelect}
            />
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Your profile image appears on your public artist page
              </p>
              {avatarUploader.uploading && (
                <p className="text-sm text-primary">Uploading... {avatarUploader.progress}%</p>
              )}
            </div>
          </div>
        </Card>

        {/* Edit Profile */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
          <div className="space-y-4">
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
              <Label htmlFor="edit_genre">Genre</Label>
              <Input
                id="edit_genre"
                value={editGenre}
                onChange={(e) => setEditGenre(e.target.value)}
                placeholder="e.g., Hip-Hop, R&B, Pop"
              />
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
              disabled={saving}
              className="bg-gradient-gold"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </Card>

        {/* Upload Track */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New Track</h2>
          <form onSubmit={handleTrackUpload} className="space-y-4">
            <div>
              <Label htmlFor="track_title">Track Title *</Label>
              <Input
                id="track_title"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="track_description">Description</Label>
              <Textarea
                id="track_description"
                value={trackDescription}
                onChange={(e) => setTrackDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="audio">Audio File *</Label>
              <Input
                id="audio"
                name="audio"
                type="file"
                accept="audio/*"
                required
              />
            </div>
            <div>
              <Label htmlFor="cover">Cover Image</Label>
              <Input
                id="cover"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button type="submit" disabled={uploading} className="bg-gradient-gold">
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Track"}
            </Button>
          </form>
        </Card>

        {/* Track List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Tracks</h2>
          {tracks.length === 0 ? (
            <p className="text-muted-foreground">No tracks uploaded yet</p>
          ) : (
            <div className="space-y-4">
              {tracks.map((track) => (
                <div key={track.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <h3 className="font-medium">{track.title}</h3>
                    {track.description && (
                      <p className="text-sm text-muted-foreground">{track.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTrack(track.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
