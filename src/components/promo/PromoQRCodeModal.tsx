import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PromoQRCodeModalProps {
  slug: string;
  campaignName?: string | null;
}

type QRSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<QRSize, number> = {
  sm: 128,
  md: 256,
  lg: 512,
};

export function PromoQRCodeModal({ slug, campaignName }: PromoQRCodeModalProps) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<QRSize>('md');
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);
  
  const fullUrl = `${window.location.origin}/link/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelSize = sizeMap[size];
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    
    // Create image from SVG
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, pixelSize, pixelSize);
      ctx.drawImage(img, 0, 0, pixelSize, pixelSize);
      URL.revokeObjectURL(url);
      
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `flymusic-promo-${slug}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast.success('QR code downloaded!');
    };
    
    img.src = url;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {/* QR Code */}
          <div className="p-4 bg-white rounded-xl shadow-lg mb-4">
            <QRCodeSVG
              ref={qrRef}
              value={fullUrl}
              size={sizeMap[size]}
              level="H"
              includeMargin
              fgColor="#1a1a1a"
              bgColor="#ffffff"
            />
          </div>

          {/* Link Preview */}
          <p className="text-xs text-muted-foreground font-mono mb-4 truncate max-w-full px-4">
            /link/{slug}
          </p>
          {campaignName && (
            <p className="text-sm text-muted-foreground mb-4">{campaignName}</p>
          )}

          {/* Size Options */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground mr-2">Size:</span>
            {(['sm', 'md', 'lg'] as QRSize[]).map((s) => (
              <Button
                key={s}
                variant={size === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSize(s)}
                className={cn(
                  'w-10',
                  size === s && 'bg-primary'
                )}
              >
                {s.toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex-1"
            >
              {copied ? (
                <Check className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground border-t pt-4">
          Perfect for merchandise, event screens, and physical materials
        </div>
      </DialogContent>
    </Dialog>
  );
}