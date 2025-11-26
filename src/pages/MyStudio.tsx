import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Music, Trash2 } from "lucide-react";

interface ArtistProfile {
  id: string;
  artist_name: string;
  bio: string | null;
  genre: string | null;
  city: string | null;
  country: string | null;
  status: string;
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
  const [uploading, setUploading] = useState(false);

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
      // Upload audio file
      const audioPath = `${user.id}/${Date.now()}_${audioFile.name}`;
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
      });

      if (insertError) throw insertError;

      toast.success("Track uploaded successfully!");
      setTrackTitle("");
      setTrackDescription("");
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
                  <div className="flex items-center justify-between">
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
