import React from 'react';
import { ExternalLink, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAboutContent, sortAboutLinks, type AboutLink } from '@/lib/utils/aboutResolver';

interface Community {
  about_content?: string | null;
  about_mission?: string | null;
  about_links?: AboutLink[] | null;
}

interface ArtistProfile {
  bio?: string | null;
  artist_name?: string;
}

interface CommunityAboutProps {
  community: Community | null;
  artistProfile: ArtistProfile | null;
  isOwner?: boolean;
  onEdit?: () => void;
}

export const CommunityAbout: React.FC<CommunityAboutProps> = ({
  community,
  artistProfile,
  isOwner = false,
  onEdit,
}) => {
  const { t } = useLanguage();
  const aboutContent = getAboutContent(community, artistProfile);

  // Empty state - explicit, never silent
  if (aboutContent.isEmpty) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">{t('community.about')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic">
            {aboutContent.emptyMessage}
          </p>
          {isOwner && onEdit && (
            <Button variant="outline" size="sm" className="mt-4" onClick={onEdit}>
              Add About Section
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const sortedLinks = sortAboutLinks(aboutContent.links);

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">{t('community.about')}</CardTitle>
          {aboutContent.isInherited && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {t('community.aboutFromBio')}
            </Badge>
          )}
        </div>
        {isOwner && onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mission statement */}
        {aboutContent.mission && (
          <div className="border-l-2 border-primary/50 pl-4 italic text-muted-foreground">
            {aboutContent.mission}
          </div>
        )}

        {/* Main content */}
        <p className="text-foreground whitespace-pre-wrap">
          {aboutContent.content}
        </p>

        {/* Links */}
        {sortedLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {sortedLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target={link.isInternal ? '_self' : '_blank'}
                rel={link.isInternal ? undefined : 'noopener noreferrer'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-muted hover:bg-muted/80 transition-colors"
              >
                {link.isInternal ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : (
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                )}
                {link.label}
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
