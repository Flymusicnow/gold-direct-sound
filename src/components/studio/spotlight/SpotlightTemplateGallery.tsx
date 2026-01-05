import { useState } from "react";
import { LayoutTemplate, Music, Calendar, ShoppingBag, Megaphone, Palette, Crown } from "lucide-react";
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
import { cn } from "@/lib/utils";

const CATEGORY_CONFIG = {
  release: { label: 'New Release', icon: Music },
  tour: { label: 'Tour & Shows', icon: Calendar },
  merch: { label: 'Merch Drop', icon: ShoppingBag },
  announcement: { label: 'Announcements', icon: Megaphone },
  custom: { label: 'Custom', icon: Palette },
};

export function SpotlightTemplateGallery() {
  const { data: templates } = useSpotlightTemplates();
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SpotlightTemplate | null>(null);

  const handleSelectTemplate = (template: SpotlightTemplate) => {
    setSelectedTemplate(template);
    // TODO: Open template editor with selected template
    setOpen(false);
  };

  const categories = Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Spotlight Templates</DialogTitle>
          <DialogDescription>
            Choose a pre-designed layout for your promotional content
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="release">
          <TabsList className="w-full justify-start">
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
                  <div className="grid grid-cols-3 gap-4 mt-4">
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
        {template.thumbnail_url ? (
          <img
            src={template.thumbnail_url}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <LayoutTemplate className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
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
