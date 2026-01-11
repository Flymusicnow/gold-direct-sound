import { useState } from "react";
import { LayoutTemplate, Music, Calendar, ShoppingBag, Megaphone, Palette, Crown, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSpotlightTemplates, SpotlightTemplate } from "@/hooks/useSpotlightTemplates";
import { useSavedTemplates, useSaveTemplate, SavedTemplate } from "@/hooks/useSavedTemplates";
import { TemplateThumbnail } from "./TemplateThumbnail";
import { SpotlightTemplateEditor, TemplateContentData } from "./SpotlightTemplateEditor";
import { MyTemplatesList } from "./MyTemplatesList";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORY_CONFIG = {
  release: { label: 'New Release', icon: Music },
  tour: { label: 'Tour & Shows', icon: Calendar },
  merch: { label: 'Merch Drop', icon: ShoppingBag },
  announcement: { label: 'Announcements', icon: Megaphone },
  custom: { label: 'Custom', icon: Palette },
};

interface SpotlightTemplateGalleryProps {
  artistId?: string;
  onPublish?: () => void;
}

export function SpotlightTemplateGallery({ artistId, onPublish }: SpotlightTemplateGalleryProps) {
  const { user } = useAuth();
  const { data: templates } = useSpotlightTemplates();
  const { data: savedTemplates } = useSavedTemplates(artistId);
  const saveTemplate = useSaveTemplate();
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SpotlightTemplate | null>(null);
  const [initialTemplateData, setInitialTemplateData] = useState<Record<string, string> | undefined>(undefined);
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'standard' | 'my'>('standard');

  const handleSelectTemplate = (template: SpotlightTemplate) => {
    setSelectedTemplate(template);
    setInitialTemplateData(undefined);
    setShowEditor(true);
    setOpen(false);
  };

  const handleSelectSavedTemplate = (saved: SavedTemplate) => {
    // Find the base template
    const baseTemplate = templates?.find(t => t.id === saved.base_template_id);
    if (baseTemplate) {
      setSelectedTemplate(baseTemplate);
      // Extract fields from saved template_data
      const data = saved.template_data as Record<string, unknown>;
      setInitialTemplateData(data.fields as Record<string, string> | undefined);
      setShowEditor(true);
      setOpen(false);
    }
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setSelectedTemplate(null);
    setInitialTemplateData(undefined);
  };

  const handleEditorPublish = async (data: TemplateContentData) => {
    if (!artistId || !user || !data.media) return;

    try {
      // Upload media
      const fileExt = data.media.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('artist-spotlight')
        .upload(fileName, data.media);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('artist-spotlight')
        .getPublicUrl(fileName);

      const mediaType = data.media.type.startsWith('video/') ? 'video' : 'image';

      // Insert spotlight media with template data
      const { error: insertError } = await supabase
        .from('artist_spotlight_media')
        .insert({
          artist_id: artistId,
          media_url: publicUrl,
          media_type: mediaType,
          display_order: 1,
          display_duration_seconds: 5,
          is_active: data.scheduleOption === 'now',
          template_id: data.templateId,
          template_data: {
            templateName: data.templateName,
            fields: data.fields,
          },
          scheduled_for: data.scheduleOption === 'schedule' && data.scheduledFor 
            ? data.scheduledFor.toISOString() 
            : null,
          publish_status: data.scheduleOption === 'now' 
            ? 'published' 
            : data.scheduleOption === 'schedule' 
              ? 'scheduled' 
              : 'draft',
        });

      if (insertError) throw insertError;

      toast.success(data.scheduleOption === 'schedule' ? 'Spotlight scheduled!' : 'Spotlight published!');
      handleEditorClose();
      onPublish?.();
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish spotlight');
    }
  };

  const handleSaveAsTemplate = async (data: TemplateContentData, name: string) => {
    if (!artistId) return;

    await saveTemplate.mutateAsync({
      artistId,
      baseTemplateId: data.templateId,
      name,
      templateData: {
        templateName: data.templateName,
        fields: data.fields,
      },
    });

    toast.success('Template saved!');
  };

  const categories = Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>;

  if (showEditor && selectedTemplate && artistId) {
    return (
      <SpotlightTemplateEditor
        template={selectedTemplate}
        onClose={handleEditorClose}
        onPublish={handleEditorPublish}
        onSaveAsTemplate={handleSaveAsTemplate}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Spotlight Templates</DialogTitle>
          <DialogDescription>
            Choose a pre-designed layout for your promotional content
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'standard' | 'my')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="standard" className="gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Standard Templates
            </TabsTrigger>
            <TabsTrigger value="my" className="gap-2">
              <Heart className="h-4 w-4" />
              My Templates
              {savedTemplates && savedTemplates.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {savedTemplates.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standard">
            <Tabs defaultValue="release">
              <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                {categories.map((cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  const Icon = config.icon;
                  return (
                    <TabsTrigger key={cat} value={cat} className="gap-1.5">
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{config.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {categories.map((cat) => {
                const categoryTemplates = templates?.filter(t => t.category === cat) || [];
                return (
                  <TabsContent key={cat} value={cat}>
                    {categoryTemplates.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No templates in this category yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                        {categoryTemplates.map((template) => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            onSelect={() => handleSelectTemplate(template)}
                            selected={selectedTemplate?.id === template.id}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </TabsContent>

          <TabsContent value="my">
            <MyTemplatesList
              templates={savedTemplates || []}
              onSelect={handleSelectSavedTemplate}
              artistId={artistId || ''}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({
  template,
  onSelect,
  selected,
}: {
  template: SpotlightTemplate;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "cursor-pointer rounded-lg border transition-all hover:ring-2 hover:ring-primary",
        selected && "ring-2 ring-primary"
      )}
    >
      <div className="aspect-[9/16] relative overflow-hidden rounded-t-lg bg-muted">
        <TemplateThumbnail template={template} />
        {template.is_premium && (
          <Badge className="absolute top-2 right-2 bg-amber-500 gap-1">
            <Crown className="h-3 w-3" />
            Premium
          </Badge>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-sm">{template.name}</p>
        {template.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        )}
      </div>
    </div>
  );
}
