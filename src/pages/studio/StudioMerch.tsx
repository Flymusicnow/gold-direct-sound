import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MerchProductCard } from "@/components/artist/MerchProductCard";
import { AddMerchDialog } from "@/components/artist/AddMerchDialog";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag } from "lucide-react";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { useIsMobile } from "@/hooks/use-mobile";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface MerchProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  image_url?: string;
  external_url?: string;
  is_featured: boolean;
  position: number;
}

export default function StudioMerch() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<MerchProduct[]>([]);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      fetchArtistProfile();
    }
  }, [user]);

  const fetchArtistProfile = async () => {
    try {
      const { data: profile } = await supabase
        .from("artist_profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (profile) {
        setArtistId(profile.id);
        fetchProducts(profile.id);
      }
    } catch (error) {
      console.error("Error fetching artist profile:", error);
    }
  };

  const fetchProducts = async (id: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("artist_merch_products")
        .select("*")
        .eq("artist_id", id)
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("artist_merch_products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      if (artistId) fetchProducts(artistId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading merch products...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen w-full">
        <StudioSidebar />
        <MobileStudioNav />
        <div className="flex-1 pt-16 md:pt-0">
          <div className="p-6 md:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">My Merch</h1>
              <InfoTooltip
                title="Merchandise & Products"
                description="Add your merch products here. Link to external stores like Shopify. Fans will see them on your artist profile!"
                forRole="artist"
                learnLink="/learn?tab=artist#videos-tracks-collections"
              />
            </div>
            <p className="text-muted-foreground mt-2">
              Manage your merchandise and products
            </p>
          </div>
          
          {artistId && (
            <AddMerchDialog
              artistId={artistId}
              onSuccess={() => artistId && fetchProducts(artistId)}
            />
          )}
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto opacity-30" />
            <div>
              <h3 className="text-lg font-semibold text-muted-foreground">No Merch Products Yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first product to start selling merchandise to your fans
              </p>
            </div>
            {artistId && (
              <AddMerchDialog
                artistId={artistId}
                onSuccess={() => artistId && fetchProducts(artistId)}
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <MerchProductCard
                key={product.id}
                product={product}
                isOwner
                onDelete={() => handleDelete(product.id)}
              />
            ))}
          </div>
        )}
          </div>
        </div>
      </div>
      </div>
      {isMobile && <BottomNavBarStudio />}
    </>
  );
}
