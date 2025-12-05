import { LegalDocumentViewer } from "@/components/legal/LegalDocumentViewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ArtistAgreement() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <LegalDocumentViewer
          documentPath="/legal/artist-agreement.md"
          title="Artist Agreement"
          lastUpdated="December 5, 2024"
        />
      </div>
    </div>
  );
}
