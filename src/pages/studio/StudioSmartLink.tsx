import { useState, useEffect } from "react";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSmartLink } from "@/hooks/useSmartLink";
import { getAvailablePlatforms, validateExternalLink } from "@/lib/smartLinkValidation";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Globe, Link2, Plus, Trash2, GripVertical, ExternalLink, Copy, Eye, 
  CheckCircle, AlertTriangle, Loader2, Music, Instagram, Youtube
} from "lucide-react";
import { toast } from "sonner";

export default function StudioSmartLink() {
  const isMobile = useIsMobile();
  const { 
    smartLinkPage, 
    externalLinks, 
    loading, 
    saving,
    checkSlugAvailability,
    saveSmartLinkPage,
    addExternalLink,
    deleteExternalLink,
  } = useSmartLink();

  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [urlValidation, setUrlValidation] = useState<{ valid: boolean; message: string } | null>(null);

  const platforms = getAvailablePlatforms();

  useEffect(() => {
    if (smartLinkPage) {
      setSlug(smartLinkPage.slug);
    }
  }, [smartLinkPage]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!slug || slug === smartLinkPage?.slug) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      const available = await checkSlugAvailability(slug);
      setSlugAvailable(available);
      setCheckingSlug(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, smartLinkPage?.slug, checkSlugAvailability]);

  // Validate URL in real-time
  useEffect(() => {
    if (!newUrl || !newPlatform) {
      setUrlValidation(null);
      return;
    }

    const result = validateExternalLink(newPlatform, newUrl);
    setUrlValidation({
      valid: result.isValid,
      message: result.flagReason || (result.isValid ? 'Valid URL' : 'Invalid URL'),
    });
  }, [newUrl, newPlatform]);

  const handleSavePage = async () => {
    if (!slug) {
      toast.error("Please enter a slug for your smart link");
      return;
    }
    await saveSmartLinkPage({ slug });
  };

  const handleAddLink = async () => {
    if (!newPlatform || !newUrl) {
      toast.error("Please select a platform and enter a URL");
      return;
    }
    
    const result = await addExternalLink(newPlatform, newUrl);
    if (result) {
      setNewPlatform("");
      setNewUrl("");
      setUrlValidation(null);
    }
  };

  const handleCopyLink = () => {
    if (smartLinkPage) {
      navigator.clipboard.writeText(`${window.location.origin}/@${smartLinkPage.slug}`);
      toast.success("Link copied to clipboard!");
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'youtube':
      case 'youtube_music':
        return <Youtube className="h-4 w-4" />;
      default:
        return <Music className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <StudioSidebar />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        {isMobile && <MobileStudioNav />}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <StudioSidebar />
      
      <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Globe className="h-7 w-7 text-primary" />
                Smart Link
              </h1>
              <p className="text-muted-foreground mt-1">
                Create your personalized link-in-bio page
              </p>
            </div>
            {smartLinkPage && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/@${smartLinkPage.slug}`} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Page Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Page Settings</CardTitle>
              <CardDescription>
                Claim your unique URL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Slug Input */}
              <div className="space-y-2">
                <Label htmlFor="slug">Your URL</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-muted rounded-l-md px-3 h-10 text-sm text-muted-foreground border border-r-0">
                    flymusic.com/@
                  </div>
                  <div className="relative flex-1">
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                      placeholder="yourname"
                      className="rounded-l-none pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingSlug ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : slugAvailable === true ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : slugAvailable === false ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      ) : null}
                    </div>
                  </div>
                </div>
                {slugAvailable === false && (
                  <p className="text-sm text-amber-500">This slug is already taken</p>
                )}
              </div>

              <Button onClick={handleSavePage} disabled={saving || !slug || slugAvailable === false}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {smartLinkPage ? 'Save Changes' : 'Create Smart Link'}
              </Button>
            </CardContent>
          </Card>

          {/* External Links */}
          {smartLinkPage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  External Links
                </CardTitle>
                <CardDescription>
                  Add your music streaming and social media links
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Link */}
                <div className="p-4 rounded-lg border border-dashed space-y-4">
                  <div className="grid gap-4 md:grid-cols-[1fr,2fr,auto]">
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <Select value={newPlatform} onValueChange={setNewPlatform}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {platforms.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <div className="relative">
                        <Input
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          placeholder="https://..."
                          className={urlValidation ? (urlValidation.valid ? 'border-green-500' : 'border-amber-500') : ''}
                        />
                        {urlValidation && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {urlValidation.valid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                        )}
                      </div>
                      {urlValidation && !urlValidation.valid && (
                        <p className="text-xs text-amber-500">{urlValidation.message}</p>
                      )}
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddLink} disabled={saving || !newPlatform || !newUrl}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Existing Links */}
                {externalLinks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Link2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No external links yet</p>
                    <p className="text-sm">Add your first platform link above</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {externalLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div className="p-2 rounded-md bg-background">
                          {getPlatformIcon(link.platform)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{link.platform.replace('_', ' ')}</span>
                            {link.status === 'flagged' && (
                              <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">
                                Under Review
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{link.click_count} clicks</span>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteExternalLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analytics Preview */}
          {smartLinkPage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-2xl font-bold text-primary">
                      {externalLinks.reduce((sum, l) => sum + l.click_count, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Clicks</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-2xl font-bold text-primary">{externalLinks.length}</p>
                    <p className="text-sm text-muted-foreground">Active Links</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {isMobile && <MobileStudioNav />}
    </div>
  );
}
