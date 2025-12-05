import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { PresskitMediaManager } from "./PresskitMediaManager";

interface PresskitEditorProps {
  artistId: string;
  presskit?: any;
  onClose: () => void;
  onSave: () => void;
}

export function PresskitEditor({ artistId, presskit, onClose, onSave }: PresskitEditorProps) {
  const isEditing = !!presskit;
  
  const [formData, setFormData] = useState({
    title: presskit?.title || '',
    slug: presskit?.slug || '',
    tagline: presskit?.tagline || '',
    bio_short: presskit?.bio_short || '',
    bio_long: presskit?.bio_long || '',
    location: presskit?.location || '',
    contact_email: presskit?.contact_email || '',
    tech_info: presskit?.tech_info || '',
    brand_tags: presskit?.brand_tags || [],
    is_default: presskit?.is_default || false,
  });

  const [newTag, setNewTag] = useState('');

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: isEditing ? prev.slug : generateSlug(title),
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.brand_tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        brand_tags: [...prev.brand_tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      brand_tags: prev.brand_tags.filter((t: string) => t !== tag),
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formData.title || !formData.slug) {
        throw new Error('Title and slug are required');
      }

      const payload = {
        artist_id: artistId,
        title: formData.title,
        slug: formData.slug,
        tagline: formData.tagline || null,
        bio_short: formData.bio_short || null,
        bio_long: formData.bio_long || null,
        location: formData.location || null,
        contact_email: formData.contact_email || null,
        tech_info: formData.tech_info || null,
        brand_tags: formData.brand_tags,
        is_default: formData.is_default,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('artist_presskits')
          .update(payload)
          .eq('id', presskit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('artist_presskits')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Presskit updated' : 'Presskit created');
      onSave();
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('This slug is already taken. Please choose a different one.');
      } else {
        toast.error(error.message || 'Failed to save presskit');
      }
    },
  });

  const popularTags = ['Electronic', 'Hip-Hop', 'Pop', 'R&B', 'Rock', 'Indie', 'DJ', 'Producer', 'Singer', 'Rapper'];

  return (
    <div className="min-h-screen bg-background flex">
      <StudioSidebar />
      
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {isEditing ? 'Edit Presskit' : 'Create Presskit'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isEditing ? 'Update your electronic press kit' : 'Build your professional press kit'}
              </p>
            </div>
            <Button 
              onClick={() => saveMutation.mutate()} 
              disabled={saveMutation.isPending || !formData.title}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>The essentials for your press kit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g., Main Press Kit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">/epk/</span>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                        placeholder="my-presskit"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="A short catchy description"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">{formData.tagline.length}/100</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Set as Default</Label>
                    <p className="text-xs text-muted-foreground">Use this as your primary press kit</p>
                  </div>
                  <Switch
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bio */}
            <Card>
              <CardHeader>
                <CardTitle>Biography</CardTitle>
                <CardDescription>Tell your story</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio_short">Short Bio (Elevator Pitch)</Label>
                  <Textarea
                    id="bio_short"
                    value={formData.bio_short}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio_short: e.target.value }))}
                    placeholder="A brief 2-3 sentence introduction..."
                    rows={3}
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground">{formData.bio_short.length}/300</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio_long">Full Bio</Label>
                  <Textarea
                    id="bio_long"
                    value={formData.bio_long}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio_long: e.target.value }))}
                    placeholder="Your complete story, achievements, and journey..."
                    rows={8}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact & Details */}
            <Card>
              <CardHeader>
                <CardTitle>Contact & Details</CardTitle>
                <CardDescription>How venues and brands can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Booking Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="booking@artist.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Based In</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Stockholm, Sweden"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tech_info">Technical Requirements / Rider</Label>
                  <Textarea
                    id="tech_info"
                    value={formData.tech_info}
                    onChange={(e) => setFormData(prev => ({ ...prev, tech_info: e.target.value }))}
                    placeholder="Equipment, stage requirements, hospitality needs..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Style Tags</CardTitle>
                <CardDescription>Help brands and venues find you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {formData.brand_tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Popular tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {popularTags
                      .filter(tag => !formData.brand_tags.includes(tag))
                      .map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() => setFormData(prev => ({ ...prev, brand_tags: [...prev.brand_tags, tag] }))}
                        >
                          + {tag}
                        </Badge>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media Manager - only show when editing */}
            {isEditing && (
              <PresskitMediaManager presskitId={presskit.id} />
            )}
          </div>
        </div>
      </main>

      <BottomNavBarStudio />
    </div>
  );
}
