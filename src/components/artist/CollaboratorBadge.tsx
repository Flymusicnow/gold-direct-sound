import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface CollaboratorBadgeProps {
  collaborators: {
    id: string;
    role: string;
    artist_profiles?: {
      artist_name: string;
    };
  }[];
}

export function CollaboratorBadge({ collaborators }: CollaboratorBadgeProps) {
  if (collaborators.length === 0) return null;

  const featuredArtists = collaborators
    .filter((c) => c.role === "featured")
    .map((c) => c.artist_profiles?.artist_name)
    .filter(Boolean);

  const otherRoles = collaborators.filter((c) => c.role !== "featured");

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {featuredArtists.length > 0 && (
        <Badge
          variant="outline"
          className="bg-primary/10 border-primary/30 text-primary text-xs"
        >
          <Users className="w-3 h-3 mr-1" />
          feat. {featuredArtists.join(", ")}
        </Badge>
      )}
      {otherRoles.map((collab) => (
        <Badge
          key={collab.id}
          variant="outline"
          className="bg-muted/50 border-border text-xs"
        >
          {collab.role}: {collab.artist_profiles?.artist_name}
        </Badge>
      ))}
    </div>
  );
}
