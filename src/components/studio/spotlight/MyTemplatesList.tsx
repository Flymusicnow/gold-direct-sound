import { Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SavedTemplate, useDeleteSavedTemplate } from "@/hooks/useSavedTemplates";
import { cn } from "@/lib/utils";

interface MyTemplatesListProps {
  templates: SavedTemplate[];
  artistId: string;
  onSelect: (template: SavedTemplate) => void;
  selectedId?: string;
}

export function MyTemplatesList({ 
  templates, 
  artistId, 
  onSelect, 
  selectedId 
}: MyTemplatesListProps) {
  const deleteTemplate = useDeleteSavedTemplate();

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No saved templates yet</p>
        <p className="text-xs">Create a spotlight with a template, then save it for reuse</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className={cn(
            "cursor-pointer rounded-lg border transition-all hover:ring-2 hover:ring-primary relative group",
            selectedId === template.id && "ring-2 ring-primary"
          )}
          onClick={() => onSelect(template)}
        >
          {/* Thumbnail */}
          <div className="aspect-[9/16] rounded-t-lg overflow-hidden bg-muted">
            {template.thumbnail_url ? (
              <img
                src={template.thumbnail_url}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <Sparkles className="h-6 w-6 text-primary/40" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-2">
            <p className="font-medium text-sm truncate">{template.name}</p>
            <Badge variant="outline" className="text-xs mt-1">
              {template.base_template?.name || 'Custom'}
            </Badge>
          </div>

          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete saved template?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{template.name}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteTemplate.mutate({ templateId: template.id, artistId })}
                  className="bg-destructive text-destructive-foreground"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  );
}
