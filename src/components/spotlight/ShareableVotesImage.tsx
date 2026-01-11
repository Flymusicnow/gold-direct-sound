import { forwardRef } from "react";
import { Music, Heart } from "lucide-react";
import { VotedEntry } from "@/contexts/SpotlightVoteContext";
import { QRCodeSVG } from "qrcode.react";

interface ShareableVotesImageProps {
  votedEntries: VotedEntry[];
  fanName: string;
  fanAvatar: string | null;
  fanId: string;
}

export const ShareableVotesImage = forwardRef<HTMLDivElement, ShareableVotesImageProps>(
  ({ votedEntries, fanName, fanAvatar, fanId }, ref) => {
    const displayEntries = votedEntries.slice(0, 4);
    const shareUrl = `${window.location.origin}/fan/${fanId}/votes`;

    return (
      <div
        ref={ref}
        className="w-[400px] bg-gradient-to-b from-[#1a1a1a] to-black p-6"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {/* Header with branding */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {fanAvatar ? (
              <img
                src={fanAvatar}
                alt={fanName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#E8BF1A]"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#E8BF1A]/20 flex items-center justify-center ring-2 ring-[#E8BF1A]">
                <span className="text-[#E8BF1A] font-bold text-lg">
                  {fanName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-white font-bold text-lg">{fanName}</p>
              <p className="text-[#E8BF1A] text-sm">FlyMusic Supporter</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[#E8BF1A] font-bold text-sm">FlyMusic</p>
            <p className="text-white/60 text-xs">Spotlight</p>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Heart className="h-6 w-6 text-[#E8BF1A] fill-[#E8BF1A]" />
          My Spotlight Picks
        </h2>

        {/* Entries Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {displayEntries.map((entry) => (
            <div
              key={entry.entry_id}
              className="bg-white/5 rounded-lg p-2 backdrop-blur"
            >
              {entry.cover_url ? (
                <img
                  src={entry.cover_url}
                  alt={entry.track_title}
                  className="w-full aspect-square rounded-lg object-cover mb-2"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full aspect-square rounded-lg bg-white/10 flex items-center justify-center mb-2">
                  <Music className="h-8 w-8 text-white/40" />
                </div>
              )}
              <p className="text-white text-sm font-medium truncate">
                {entry.track_title}
              </p>
              <p className="text-white/60 text-xs truncate">
                {entry.artist_name}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div>
            <p className="text-white/80 text-sm">
              Supporting {votedEntries.length} {votedEntries.length === 1 ? "entry" : "entries"}
            </p>
            <p className="text-white/40 text-xs">flymusic.co</p>
          </div>
          <QRCodeSVG
            value={shareUrl}
            size={60}
            bgColor="transparent"
            fgColor="#E8BF1A"
            level="L"
          />
        </div>
      </div>
    );
  }
);

ShareableVotesImage.displayName = "ShareableVotesImage";
