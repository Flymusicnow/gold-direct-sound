import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLegalAcceptance } from "@/hooks/useLegalAcceptance";
import { format } from "date-fns";

interface LegalDocument {
  type: string;
  title: string;
  path: string;
  requiredFor?: "all" | "artist" | "brand";
}

const legalDocuments: LegalDocument[] = [
  { type: "user_agreement", title: "User Agreement", path: "/legal/user-agreement", requiredFor: "all" },
  { type: "privacy_policy", title: "Privacy Policy", path: "/legal/privacy-policy", requiredFor: "all" },
  { type: "fan_terms", title: "Fan Terms", path: "/legal/fan-terms" },
  { type: "artist_agreement", title: "Artist Agreement", path: "/legal/artist-agreement", requiredFor: "artist" },
  { type: "brand_portal_terms", title: "Brand Portal Terms", path: "/legal/brand-portal-terms", requiredFor: "brand" },
  { type: "risk_disclaimer", title: "Risk Disclaimer", path: "/legal/risk-disclaimer" },
];

interface LegalSettingsSectionProps {
  isArtist?: boolean;
  isBrand?: boolean;
}

export const LegalSettingsSection = ({ isArtist = false, isBrand = false }: LegalSettingsSectionProps) => {
  const navigate = useNavigate();
  const { hasAccepted, getAcceptanceDate, loading } = useLegalAcceptance();

  const visibleDocuments = legalDocuments.filter(doc => {
    if (doc.requiredFor === "artist" && !isArtist) return false;
    if (doc.requiredFor === "brand" && !isBrand) return false;
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Legal Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleDocuments.map((doc) => {
          const accepted = hasAccepted(doc.type as any);
          const acceptedDate = getAcceptanceDate(doc.type as any);
          
          return (
            <div 
              key={doc.type}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{doc.title}</p>
                  {accepted && acceptedDate && (
                    <p className="text-xs text-muted-foreground">
                      Accepted {format(new Date(acceptedDate), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {accepted && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Accepted
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(doc.path)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default LegalSettingsSection;
