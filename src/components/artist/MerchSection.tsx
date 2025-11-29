import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MerchProductCard } from "./MerchProductCard";
import { ShoppingBag } from "lucide-react";

interface MerchProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  image_url?: string;
  external_url?: string;
  is_featured: boolean;
}

interface MerchSectionProps {
  artistId: string;
}

export function MerchSection({ artistId }: MerchSectionProps) {
  const [products, setProducts] = useState<MerchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [artistId]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("artist_merch_products")
        .select("*")
        .eq("artist_id", artistId)
        .eq("status", "active")
        .order("position", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching merch products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="text-muted-foreground text-center">Loading merch...</div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingBag className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Official Merch</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <MerchProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
