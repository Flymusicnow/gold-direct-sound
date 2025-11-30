import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sanitizeFileName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Upload, Music, Trash2, Camera, Save } from "lucide-react";

interface ArtistProfile {
  id: string;
  artist_name: string;
  bio: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  status: string;
  avatar_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
}

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
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track upload form
  const [trackTitle, setTrackTitle] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile?.role !== 'artist') {
      navigate('/');
      return;
    }
    fetchArtistProfile();
    fetchTracks();
  }, [user, profile, navigate]);

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
      // Populate edit form with current data
      setEditBio(data.bio || "");
      setEditGenre(data.genre || "");
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

  const fetchTracks = async () => {
    if (!user) return;

    const { data: artistData } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (artistData) {
      const { data } = await supabase
        .from('tracks')
        .select('*')
        .eq('artist_id', artistData.id)
        .order('created_at', { ascending: false });

      if (data) setTracks(data);
    }
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user || !artistProfile) return;

    const file = e.target.files[0];

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
    if (!artistProfile) return;

    setSavingProfile(true);

    try {
      const { error } = await supabase
        .from('artist_profiles')
        .update({
          bio: editBio || null,
          genre: editGenre || null,
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
      <div className="min-h-screen py-24 px-4">
        <div className="container mx-auto max-w-2xl">
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
              <Button type="submit" className="w-full bg-gradient-gold">
                Create Profile
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  if (artistProfile.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Music className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profile Pending Approval</h2>
          <p className="text-muted-foreground">
            Your artist profile is being reviewed. You'll be able to upload tracks once approved.
          </p>
        </div>
      </div>
    );
  }

  if (artistProfile.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Profile Not Approved</h2>
          <p className="text-muted-foreground">
            Your artist profile was not approved. Please contact support for more information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Studio</h1>

        {/* Profile Image */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Profile Image</h2>
          <div className="flex items-center gap-6">
            <Avatar className="h-32 w-32 border-2 border-primary">
              <AvatarImage src={artistProfile.avatar_url || undefined} alt={artistProfile.artist_name} />
              <AvatarFallback className="text-2xl">
                {artistProfile.artist_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition-colors">
                  <Camera className="h-4 w-4" />
                  <span>{uploadingAvatar ? "Uploading..." : "Upload New Image"}</span>
                </div>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                Your profile image appears on your public artist page
              </p>
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
              disabled={savingProfile}
              className="bg-gradient-gold"
            >
              <Save className="mr-2 h-4 w-4" />
              {savingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </Card>

        {/* Upload Track */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New Track</h2>
          <form onSubmit={handleTrackUpload} className="space-y-4">
            <div>
              <Label htmlFor="title">Track Title *</Label>
              <Input
                id="title"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={trackDescription}
                onChange={(e) => setTrackDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="cover">Cover Image (Optional)</Label>
              <Input
                id="cover"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label htmlFor="audio">Audio File *</Label>
              <Input id="audio" name="audio" type="file" accept="audio/*" required />
            </div>
            <Button type="submit" disabled={uploading} className="bg-gradient-gold">
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Track"}
            </Button>
          </form>
        </Card>

        {/* Tracks List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Tracks</h2>
          {tracks.length === 0 ? (
            <p className="text-muted-foreground">No tracks uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {tracks.map((track) => (
                <Card key={track.id} className="p-4">
                  <div className="flex items-center gap-4">
                    {track.cover_url ? (
                      <img
                        src={track.cover_url}
                        alt={track.title}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-secondary flex items-center justify-center">
                        <Music className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{track.title}</h3>
                      {track.description && (
                        <p className="text-sm text-muted-foreground">{track.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTrack(track.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
