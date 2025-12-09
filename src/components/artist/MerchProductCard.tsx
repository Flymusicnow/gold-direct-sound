import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Edit, Trash2, ShoppingCart } from "lucide-react";

interface MerchProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    image_url?: string;
    external_url?: string;
    is_featured: boolean;
  };
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MerchProductCard({ product, isOwner, onEdit, onDelete }: MerchProductCardProps) {
  const handleBuyClick = () => {
    if (product.external_url) {
      window.open(product.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="overflow-hidden bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 group">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-4xl">📦</span>
          </div>
        )}
        
        {product.is_featured && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
            FEATURED
          </div>
        )}

        {isOwner && (
          <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-lg font-bold text-primary">
            {product.currency} ${product.price.toFixed(2)}
          </span>
          
          <Button
            onClick={handleBuyClick}
            disabled={!product.external_url}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {product.external_url ? (
              <>
                Buy Now
                <ExternalLink className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Coming Soon
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
