import { LegalDocumentViewer } from "@/components/legal/LegalDocumentViewer";
import { LegalNavigation } from "@/components/legal/LegalNavigation";

export default function PrivacyPolicy() {
  return (
    <div className="bg-background">
      <LegalNavigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <LegalDocumentViewer
          documentPath="/legal/privacy-policy.md"
          title="Privacy Policy"
          lastUpdated="December 5, 2024"
        />
      </div>
    </div>
  );
}
