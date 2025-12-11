import { LegalDocumentViewer } from "@/components/legal/LegalDocumentViewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BrandPortalTerms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky back button */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LegalDocumentViewer
          documentPath="/legal/brand-portal-terms.md"
          title="Brand Portal Terms"
          lastUpdated="December 5, 2024"
        />
      </div>
    </div>
  );
}