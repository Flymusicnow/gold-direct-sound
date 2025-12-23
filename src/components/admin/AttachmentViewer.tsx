import { useState } from 'react';
import { ImageOff, X, ZoomIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { InboxLanguage, getInboxTranslation } from '@/i18n/inbox';

interface Attachment {
  url: string;
  path: string;
  name: string;
  type: string;
  size: number;
}

interface AttachmentViewerProps {
  attachments: Attachment[];
  language: InboxLanguage;
}

export function AttachmentViewer({ attachments, language }: AttachmentViewerProps) {
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null);
  const t = (key: Parameters<typeof getInboxTranslation>[1]) => getInboxTranslation(language, key);

  if (!attachments || attachments.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageOff className="h-4 w-4 text-muted-foreground" />
            {t('attachments')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('noAttachments')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ZoomIn className="h-4 w-4 text-primary" />
            {t('attachments')} ({attachments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {attachments.map((attachment, index) => (
              <button
                key={attachment.path || index}
                onClick={() => setSelectedImage(attachment)}
                className="relative aspect-square rounded-md overflow-hidden border border-border hover:border-primary transition-colors group"
              >
                <img
                  src={attachment.url}
                  alt={attachment.name || `Screenshot ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="h-6 w-6 text-foreground" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-background/95 backdrop-blur">
          <DialogTitle className="sr-only">
            {selectedImage?.name || 'Screenshot'}
          </DialogTitle>
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background shadow-md"
          >
            <X className="h-5 w-5" />
          </button>
          {selectedImage && (
            <div className="relative w-full max-h-[80vh] overflow-auto">
              <img
                src={selectedImage.url}
                alt={selectedImage.name || 'Screenshot'}
                className="w-full h-auto"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent">
                <p className="text-sm font-medium">{selectedImage.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedImage.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}