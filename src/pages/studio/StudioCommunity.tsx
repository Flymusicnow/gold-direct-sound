import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ScrollableTabsList } from "@/components/ui/ScrollableTabs";
import { AnimatedTabTrigger } from "@/components/ui/AnimatedTabTrigger";
import { toast } from "sonner";
import { Users, Image, Eye, Save, Upload, Crown, ExternalLink, Trash2, ArrowLeft, Shield, BarChart3, Settings, Link2, Plus, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { StudioLayout } from "@/components/layouts/StudioLayout";
import { ModeratorManagement } from "@/components/studio/ModeratorManagement";
import { CommunityAnalyticsDashboard } from "@/components/studio/CommunityAnalyticsDashboard";
import { type BannerSource } from "@/lib/utils/bannerResolver";

interface Community {
  id: string;
  name: string;
  description: string | null;
  community_rules: string | null;
  banner_media_url: string | null;
  banner_media_type: string | null;
  banner_source: BannerSource | null;
  about_content: string | null;
  about_mission: string | null;
  about_links: { label: string; url: string }[] | null;
  artist_id: string;
}

interface ArtistProfile {
  id: string;
  artist_name: string;
  banner_url: string | null;
}

interface AboutLink {
  label: string;
  url: string;
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
  const [bannerSource, setBannerSource] = useState<BannerSource>("custom");
  const [aboutContent, setAboutContent] = useState("");
  const [aboutMission, setAboutMission] = useState("");
  const [aboutLinks, setAboutLinks] = useState<AboutLink[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const fetchCommunityData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // First get artist profile
      const { data: artist, error: artistError } = await supabase
        .from("artist_profiles")
        .select("id, artist_name, banner_url")
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
        const communityWithTypes = {
          ...communityData,
          banner_source: (communityData.banner_source as BannerSource) || "custom",
          about_links: Array.isArray(communityData.about_links) 
            ? (communityData.about_links as unknown as AboutLink[]) 
            : [],
        };
        setCommunity(communityWithTypes as Community);
        setDescription(communityData.description || "");
        setCommunityRules(communityData.community_rules || "");
        setBannerUrl(communityData.banner_media_url);
        setBannerType(communityData.banner_media_type);
        setBannerSource((communityData.banner_source as BannerSource) || "custom");
        setAboutContent(communityData.about_content || "");
        setAboutMission(communityData.about_mission || "");
        setAboutLinks(communityWithTypes.about_links);
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
          banner_source: bannerSource,
          about_content: aboutContent || null,
          about_mission: aboutMission || null,
          about_links: aboutLinks.length > 0 ? JSON.parse(JSON.stringify(aboutLinks)) : null,
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
      setBannerSource("custom");
      
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file || !community?.id || !artistProfile?.id) return;
    
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    if (!isImage && !isVideo) {
      toast.error("Please upload an image or video file");
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }
    
    // Reuse upload logic
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${artistProfile.id}/banner-${Date.now()}.${fileExt}`;
      
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
      
      const { data: publicUrlData } = supabase.storage
        .from("community-banners")
        .getPublicUrl(data.path);
      
      setBannerUrl(publicUrlData.publicUrl);
      setBannerType(isImage ? "image" : "video");
      setBannerSource("custom");
      
      toast.success(t("common.success"));
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error(t("errors.uploadFailed"));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePreview = () => {
    if (artistProfile?.id) {
      window.open(`/artist/${artistProfile.id}/community`, "_blank");
    }
  };

  const addAboutLink = () => {
    setAboutLinks([...aboutLinks, { label: "", url: "" }]);
  };

  const updateAboutLink = (index: number, field: "label" | "url", value: string) => {
    const updated = [...aboutLinks];
    updated[index][field] = value;
    setAboutLinks(updated);
  };

  const removeAboutLink = (index: number) => {
    setAboutLinks(aboutLinks.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <StudioLayout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </StudioLayout>
    );
  }

  if (!community) {
    return (
      <StudioLayout>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t("studio.communityNotFound")}</h2>
              <p className="text-muted-foreground">{t("studio.communitySetupPending")}</p>
            </CardContent>
          </Card>
        </div>
      </StudioLayout>
    );
  }

  return (
    <StudioLayout>
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-28 md:pb-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>

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

        {/* Tabs for Settings, Moderators, Analytics */}
        <Tabs defaultValue="settings" className="space-y-4">
          <ScrollableTabsList sticky={false}>
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0 h-auto gap-0 min-w-max md:min-w-0">
              <AnimatedTabTrigger value="settings" icon={<Settings className="w-4 h-4" />} layoutId="studioCommunityTabs">
                Settings
              </AnimatedTabTrigger>
              <AnimatedTabTrigger value="moderators" icon={<Shield className="w-4 h-4" />} layoutId="studioCommunityTabs">
                {t("community.moderators")}
              </AnimatedTabTrigger>
              <AnimatedTabTrigger value="analytics" icon={<BarChart3 className="w-4 h-4" />} layoutId="studioCommunityTabs">
                {t("community.analytics")}
              </AnimatedTabTrigger>
            </TabsList>
          </ScrollableTabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            {/* Banner Source Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  {t("community.bannerSource")}
                </CardTitle>
                <CardDescription>
                  Choose how your community banner is displayed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={bannerSource}
                  onValueChange={(value) => setBannerSource(value as BannerSource)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="profile" id="banner-profile" />
                    <Label htmlFor="banner-profile" className="flex-1 cursor-pointer">
                      <span className="font-medium">{t("community.bannerUseProfile")}</span>
                      <p className="text-sm text-muted-foreground">
                        Use the same banner as your artist profile
                      </p>
                      {artistProfile?.banner_url && bannerSource === "profile" && (
                        <img
                          src={artistProfile.banner_url}
                          alt="Profile banner preview"
                          className="mt-2 w-full max-w-md h-24 object-cover rounded-lg"
                        />
                      )}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="custom" id="banner-custom" />
                    <Label htmlFor="banner-custom" className="flex-1 cursor-pointer">
                      <span className="font-medium">{t("community.bannerCustom")}</span>
                      <p className="text-sm text-muted-foreground">
                        Upload a unique banner for your community
                      </p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="none" id="banner-none" />
                    <Label htmlFor="banner-none" className="flex-1 cursor-pointer">
                      <span className="font-medium">{t("community.bannerNone")}</span>
                      <p className="text-sm text-muted-foreground">
                        Display a gradient background instead
                      </p>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Custom banner upload (only when custom is selected) */}
                {bannerSource === "custom" && (
                  <div className="mt-4 pt-4 border-t">
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
                      <div 
                        className={cn(
                          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                          dragActive 
                            ? "border-primary bg-primary/10" 
                            : "border-border"
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
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
                      <div className="space-y-2 mt-4">
                        <Progress value={uploadProgress} />
                        <p className="text-sm text-muted-foreground text-center">
                          {t("common.uploading")} {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>{t("community.about")}</CardTitle>
                <CardDescription>
                  Tell fans about your community. If empty, your artist bio will be shown.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="about-mission">{t("community.aboutMission")} (optional)</Label>
                  <Input
                    id="about-mission"
                    value={aboutMission}
                    onChange={(e) => setAboutMission(e.target.value)}
                    placeholder="What's your community's mission?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about-content">About Content</Label>
                  <Textarea
                    id="about-content"
                    value={aboutContent}
                    onChange={(e) => setAboutContent(e.target.value)}
                    placeholder="Tell fans what your community is about..."
                    rows={4}
                  />
                </div>

                {/* About Links */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    {t("community.aboutLinks")}
                  </Label>
                  {aboutLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={link.label}
                        onChange={(e) => updateAboutLink(index, "label", e.target.value)}
                        placeholder="Label"
                        className="flex-1"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => updateAboutLink(index, "url", e.target.value)}
                        placeholder="URL"
                        className="flex-[2]"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAboutLink(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addAboutLink}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                </div>
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
          </TabsContent>

          {/* Moderators Tab */}
          <TabsContent value="moderators">
            <ModeratorManagement
              communityId={community?.id || null}
              currentUserId={user?.id || ""}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <CommunityAnalyticsDashboard communityId={community?.id || null} />
          </TabsContent>
        </Tabs>
      </div>
    </StudioLayout>
  );
}
