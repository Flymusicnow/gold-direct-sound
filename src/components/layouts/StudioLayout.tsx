import { ReactNode } from "react";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { MobileStudioNav } from "@/components/artist/MobileStudioNav";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { useIsMobile } from "@/hooks/use-mobile";

interface StudioLayoutProps {
  children: ReactNode;
}

export function StudioLayout({ children }: StudioLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <>
      <div className="h-screen overflow-hidden flex w-full pt-16">
        <StudioSidebar />
        <MobileStudioNav />
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-auto-hide p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
      {isMobile && <BottomNavBarStudio />}
    </>
  );
}
