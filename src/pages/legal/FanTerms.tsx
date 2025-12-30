import { LegalDocumentViewer } from "@/components/legal/LegalDocumentViewer";
import { LegalNavigation } from "@/components/legal/LegalNavigation";

export default function FanTerms() {
  return (
    <div className="min-h-screen bg-background">
      <LegalNavigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <LegalDocumentViewer
          documentPath="/legal/fan-terms.md"
          title="Fan Terms"
          lastUpdated="December 5, 2024"
        />
      </div>
    </div>
  );
}
