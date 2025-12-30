import { LegalDocumentViewer } from "@/components/legal/LegalDocumentViewer";
import { LegalNavigation } from "@/components/legal/LegalNavigation";

export default function ArtistAgreement() {
  return (
    <div className="bg-background">
      <LegalNavigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <LegalDocumentViewer
          documentPath="/legal/artist-agreement.md"
          title="Artist Agreement"
          lastUpdated="December 5, 2024"
        />
      </div>
    </div>
  );
}
