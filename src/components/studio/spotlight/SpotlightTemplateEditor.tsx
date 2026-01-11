import { useState, useMemo } from "react";
import { ArrowLeft, Upload, Image, Video, Eye, Send, Save, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SpotlightTemplate } from "@/hooks/useSpotlightTemplates";
import { SpotlightTemplatePreview } from "./SpotlightTemplatePreview";
import { SpotlightSchedulePicker, ScheduleOption } from "./SpotlightSchedulePicker";
import { cn } from "@/lib/utils";

interface TemplateEditorProps {
  template: SpotlightTemplate;
  onClose: () => void;
  onPublish: (data: TemplateContentData) => Promise<void>;
  onSaveAsTemplate?: (data: TemplateContentData, name: string) => Promise<void>;
}

export interface TemplateContentData {
  templateId: string;
  templateName: string;
  media: File | null;
  mediaPreviewUrl: string | null;
  fields: Record<string, string>;
  scheduleOption: ScheduleOption;
  scheduledFor: Date | null;
}

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'url';
  placeholder: string;
  required?: boolean;
}

const TEMPLATE_FIELDS: Record<string, FieldConfig[]> = {
  'New Release': [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'My New Single', required: true },
    { key: 'message', label: 'Short Message', type: 'text', placeholder: 'Out now everywhere!' },
    { key: 'cta', label: 'CTA Text', type: 'text', placeholder: 'Listen Now' },
  ],
  'Tour Announcement': [
    { key: 'eventName', label: 'Event Name', type: 'text', placeholder: 'Summer Tour 2026', required: true },
    { key: 'date', label: 'Date', type: 'text', placeholder: 'March 15, 2026' },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'Madison Square Garden, NYC' },
    { key: 'ticketUrl', label: 'Ticket URL', type: 'url', placeholder: 'https://tickets.example.com' },
    { key: 'cta', label: 'CTA Text', type: 'text', placeholder: 'See Dates' },
  ],
  'Merch Drop': [
    { key: 'productName', label: 'Product Name', type: 'text', placeholder: 'Limited Edition Hoodie', required: true },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Exclusive merch drop...' },
    { key: 'price', label: 'Price (optional)', type: 'text', placeholder: '$49.99' },
    { key: 'cta', label: 'CTA Text', type: 'text', placeholder: 'View Merch' },
  ],
  'Announcement': [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Big News!' },
    { key: 'message', label: 'Message', type: 'textarea', placeholder: 'We have something special to announce...', required: true },
    { key: 'cta', label: 'CTA Text (optional)', type: 'text', placeholder: 'Learn More' },
  ],
  'Behind the Scenes': [
    { key: 'caption', label: 'Caption', type: 'textarea', placeholder: 'In the studio working on something new...', required: true },
  ],
  'Moment': [
    { key: 'emotionalText', label: 'What\'s happening?', type: 'textarea', placeholder: 'Feeling grateful for this moment...', required: true },
    { key: 'cta', label: 'CTA Text (optional)', type: 'text', placeholder: '' },
  ],
  'Minimal': [],
};

export function SpotlightTemplateEditor({ 
  template, 
  onClose, 
  onPublish,
  onSaveAsTemplate 
}: TemplateEditorProps) {
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [isPreview, setIsPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleOption, setScheduleOption] = useState<ScheduleOption>('now');
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [savedTemplateName, setSavedTemplateName] = useState('');

  const templateFields = useMemo(() => {
    return TEMPLATE_FIELDS[template.name] || TEMPLATE_FIELDS['Minimal'] || [];
  }, [template.name]);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedia(file);
      const url = URL.createObjectURL(file);
      setMediaPreviewUrl(url);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const isValid = useMemo(() => {
    if (!media) return false;
    const requiredFields = templateFields.filter(f => f.required);
    return requiredFields.every(f => fields[f.key]?.trim());
  }, [media, fields, templateFields]);

  const handlePublish = async () => {
    if (!isValid) return;
    
    setIsPublishing(true);
    try {
      await onPublish({
        templateId: template.id,
        templateName: template.name,
        media,
        mediaPreviewUrl,
        fields,
        scheduleOption,
        scheduledFor,
      });
      onClose();
    } catch (error) {
      console.error('Publish error:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!onSaveAsTemplate || !savedTemplateName.trim()) return;
    
    try {
      await onSaveAsTemplate({
        templateId: template.id,
        templateName: template.name,
        media,
        mediaPreviewUrl,
        fields,
        scheduleOption,
        scheduledFor,
      }, savedTemplateName);
      setShowSaveAsTemplate(false);
      setSavedTemplateName('');
    } catch (error) {
      console.error('Save template error:', error);
    }
  };

  if (isPreview) {
    return (
      <Dialog open onOpenChange={() => setIsPreview(false)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsPreview(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <SpotlightTemplatePreview
              template={template}
              mediaUrl={mediaPreviewUrl}
              mediaType={media?.type.startsWith('video') ? 'video' : 'image'}
              fields={fields}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold">{template.name} Template</h2>
            <p className="text-xs text-muted-foreground">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onSaveAsTemplate && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSaveAsTemplate(true)}
              disabled={!isValid}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as My Template
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Media Upload */}
            <div className="space-y-4">
              <Label>Media *</Label>
              <div 
                className={cn(
                  "aspect-[9/16] rounded-xl border-2 border-dashed flex items-center justify-center relative overflow-hidden transition-colors",
                  media ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
                )}
              >
                {mediaPreviewUrl ? (
                  <>
                    {media?.type.startsWith('video') ? (
                      <video 
                        src={mediaPreviewUrl} 
                        className="w-full h-full object-cover"
                        muted
                        loop
                        autoPlay
                      />
                    ) : (
                      <img 
                        src={mediaPreviewUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-4 right-4"
                      onClick={() => {
                        setMedia(null);
                        setMediaPreviewUrl(null);
                      }}
                    >
                      Change
                    </Button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3 p-8 text-center">
                    <div className="p-4 rounded-full bg-muted">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Upload Media</p>
                      <p className="text-sm text-muted-foreground">
                        9:16 aspect ratio recommended
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Image className="h-3 w-3" /> Image
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="h-3 w-3" /> Video
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleMediaSelect}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Right: Fields */}
            <div className="space-y-6">
              {templateFields.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>This template uses media only.</p>
                  <p className="text-sm">No additional fields required.</p>
                </div>
              ) : (
                templateFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.key}
                        value={fields[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={field.key}
                        type={field.type === 'url' ? 'url' : 'text'}
                        value={fields[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))
              )}

              {/* Schedule Toggle */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Schedule Publishing</Label>
                    <p className="text-xs text-muted-foreground">
                      Set when this spotlight should go live
                    </p>
                  </div>
                  <Switch
                    checked={showSchedule}
                    onCheckedChange={setShowSchedule}
                  />
                </div>
                
                {showSchedule && (
                  <div className="mt-4">
                    <SpotlightSchedulePicker
                      value={scheduleOption}
                      onChange={setScheduleOption}
                      scheduledDate={scheduledFor}
                      onScheduledDateChange={setScheduledFor}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t bg-background">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsPreview(true)}
            disabled={!media}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!isValid || isPublishing}
          >
            {isPublishing ? (
              <>Publishing...</>
            ) : scheduleOption === 'schedule' ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Save as Template Dialog */}
      {showSaveAsTemplate && (
        <Dialog open onOpenChange={() => setShowSaveAsTemplate(false)}>
          <DialogContent>
            <div className="space-y-4">
              <h3 className="font-semibold">Save as My Template</h3>
              <p className="text-sm text-muted-foreground">
                Save this filled template for quick reuse with different media.
              </p>
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={savedTemplateName}
                  onChange={(e) => setSavedTemplateName(e.target.value)}
                  placeholder="e.g., My Single Promo Style"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSaveAsTemplate(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAsTemplate} disabled={!savedTemplateName.trim()}>
                  Save Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
