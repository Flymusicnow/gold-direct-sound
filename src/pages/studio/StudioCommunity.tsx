import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Image, Eye, Save, Upload, Crown, ExternalLink, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Community {
  id: string;
  name: string;
  description: string | null;
  community_rules: string | null;
  banner_media_url: string | null;
  banner_media_type: string | null;
  artist_id: string;
}

interface ArtistProfile {
  id: string;
  artist_name: string;
}

export default function StudioCommunity() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form state
  const [description, setDescription] = useState("");
  const [communityRules, setCommunityRules] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<string | null>(null);

  const fetchCommunityData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // First get artist profile
      const { data: artist, error: artistError } = await supabase
        .from("artist_profiles")
        .select("id, artist_name")
        .eq("user_id", user.id)
        .single();
      
      if (artistError) throw artistError;
      setArtistProfile(artist);
      
      // Then get community
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("*")
        .eq("artist_id", artist.id)
        .single();
      
      if (communityError && communityError.code !== "PGRST116") {
        throw communityError;
      }
      
      if (communityData) {
        setCommunity(communityData);
        setDescription(communityData.description || "");
        setCommunityRules(communityData.community_rules || "");
        setBannerUrl(communityData.banner_media_url);
        setBannerType(communityData.banner_media_type);
      }
    } catch (error) {
      console.error("Error fetching community:", error);
      toast.error(t("errors.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  const handleSave = async () => {
    if (!community?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("communities")
        .update({
          description,
          community_rules: communityRules,
          banner_media_url: bannerUrl,
          banner_media_type: bannerType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", community.id);
      
      if (error) throw error;
      
      toast.success(t("common.success"));
    } catch (error) {
      console.error("Error saving community:", error);
      toast.error(t("errors.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !community?.id || !artistProfile?.id) return;
    
    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    if (!isImage && !isVideo) {
      toast.error("Please upload an image or video file");
      return;
    }
    
    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${artistProfile.id}/banner-${Date.now()}.${fileExt}`;
      
      // Simulate progress (Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);
      
      const { data, error } = await supabase.storage
        .from("community-banners")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (error) throw error;
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("community-banners")
        .getPublicUrl(data.path);
      
      setBannerUrl(publicUrlData.publicUrl);
      setBannerType(isImage ? "image" : "video");
      
      toast.success(t("common.success"));
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error(t("errors.uploadFailed"));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveBanner = () => {
    setBannerUrl(null);
    setBannerType(null);
  };

  const handlePreview = () => {
    if (artistProfile?.id) {
      window.open(`/artist/${artistProfile.id}/community`, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("studio.communityNotFound")}</h2>
            <p className="text-muted-foreground">{t("studio.communitySetupPending")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-4 md:py-8 px-4 md:px-6 space-y-4 md:space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 md:h-6 md:w-6" />
            {t("studio.communitySettings")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {t("studio.communitySettingsDescription")}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={handlePreview} className="flex-1 md:flex-none">
            <Eye className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{t("studio.previewCommunity")}</span>
            <span className="sm:hidden">{t("common.preview")}</span>
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1 md:flex-none">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </div>

      {/* Banner Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            {t("studio.bannerImage")}
          </CardTitle>
          <CardDescription>
            {t("studio.bannerImageDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bannerUrl ? (
            <div className="relative">
              {bannerType === "video" ? (
                <video
                  src={bannerUrl}
                  className="w-full h-48 object-cover rounded-lg"
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <img
                  src={bannerUrl}
                  alt="Community banner"
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveBanner}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {t("studio.dragDropBanner")}
              </p>
              <Label htmlFor="banner-upload">
                <Button variant="outline" asChild disabled={isUploading}>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {t("common.upload")}
                  </span>
                </Button>
              </Label>
              <Input
                id="banner-upload"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleBannerUpload}
                disabled={isUploading}
              />
            </div>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-muted-foreground text-center">
                {t("common.uploading")} {uploadProgress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>{t("studio.communityDescription")}</CardTitle>
          <CardDescription>
            {t("studio.communityDescriptionHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("studio.communityDescriptionPlaceholder")}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Community Rules */}
      <Card>
        <CardHeader>
          <CardTitle>{t("studio.communityRules")}</CardTitle>
          <CardDescription>
            {t("studio.communityRulesHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={communityRules}
            onChange={(e) => setCommunityRules(e.target.value)}
            placeholder={t("studio.communityRulesPlaceholder")}
            rows={6}
          />
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>{t("studio.quickLinks")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate("/studio/earnings")}
          >
            <Crown className="h-4 w-4 mr-2" />
            {t("studio.manageTiers")}
            <ExternalLink className="h-4 w-4 ml-auto" />
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate("/studio/subscription")}
          >
            <Users className="h-4 w-4 mr-2" />
            {t("studio.viewSupporters")}
            <ExternalLink className="h-4 w-4 ml-auto" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
