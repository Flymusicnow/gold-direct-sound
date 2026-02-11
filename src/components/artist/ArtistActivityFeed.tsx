import React from 'react';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { useLanguage } from '@/contexts/LanguageContext';
import { safeT } from '@/lib/i18nSafe';

interface ArtistActivityFeedProps {
  artistId: string;
  communityId?: string;
}

export const ArtistActivityFeed: React.FC<ArtistActivityFeedProps> = ({ artistId, communityId }) => {
  const { t } = useLanguage();

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">
        {safeT(t, 'artist.communityActivity', 'Community Activity')}
      </h3>
      <CommunityFeed artistId={artistId} communityId={communityId} />
    </div>
  );
};
