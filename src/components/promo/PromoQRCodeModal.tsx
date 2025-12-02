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

// Display size capped for modal fit
const displaySizeMap: Record<QRSize, number> = {
  sm: 128,
  md: 256,
  lg: 320,
};

// Full size for downloads
const downloadSizeMap: Record<QRSize, number> = {
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
    // Create a new QR code at full download size
    const downloadSize = downloadSizeMap[size];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = downloadSize;
    canvas.height = downloadSize;
    
    // Create a temporary SVG at download size
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${downloadSize}" height="${downloadSize}"></svg>`;
    
    // Use the existing ref but render at download size
    if (!qrRef.current) return;
    const svg = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, downloadSize, downloadSize);
      ctx.drawImage(img, 0, 0, downloadSize, downloadSize);
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
          <div className="p-4 bg-white rounded-xl shadow-lg mb-4 max-w-full overflow-hidden">
            <QRCodeSVG
              ref={qrRef}
              value={fullUrl}
              size={displaySizeMap[size]}
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