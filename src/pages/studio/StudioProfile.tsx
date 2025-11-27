import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, Save, Music, User } from "lucide-react";

export default function StudioProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [editBio, setEditBio] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editTiktok, setEditTiktok] = useState("");
  const [editYoutube, setEditYoutube] = useState("");
  const [editTwitter, setEditTwitter] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [artistName, setArtistName] = useState("");

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
      const avatarPath = `${user.id}/${Date.now()}_${file.name}`;
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

  const handleSaveProfile = async () => {
    if (!artistProfile) return;

    setSavingProfile(true);

    try {
      const { error } = await supabase
        .from('artist_profiles')
        .update({
          artist_name: artistName || null,
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
    <div className="flex min-h-screen pt-16">
      <StudioSidebar />
      <MobileStudioNav />
      
      <main className="flex-1 p-4 md:p-8">
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

          {/* Profile Image */}
          <Card className="p-6">
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
  );
}
