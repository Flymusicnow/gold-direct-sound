import { ReactNode } from "react";
import { BrandNavigation } from "@/components/brand/BrandNavigation";
import { BrandFooter } from "@/components/brand/BrandFooter";
import { BottomNavBarBrand } from "@/components/mobile/BottomNavBarBrand";

interface BrandLayoutProps {
  children: ReactNode;
}

export function BrandLayout({ children }: BrandLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BrandNavigation />
      <main className="flex-1 pt-16 pb-20 md:pb-0">
        {children}
      </main>
      <div className="hidden md:block">
        <BrandFooter />
      </div>
      <BottomNavBarBrand />
    </div>
  );
}
