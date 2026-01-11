import { useState } from "react";
import { Search, Star, Clock, UserPlus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InviteConfirmationDialog } from "./InviteConfirmationDialog";

interface Supporter {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  amount: number;
}

interface InviteFanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topSupporters: Supporter[];
  recentSupporters: Supporter[];
  onInvite: (userId: string) => Promise<boolean>;
  isLoading?: boolean;
}

export const InviteFanSheet = ({
  open,
  onOpenChange,
  topSupporters,
  recentSupporters,
  onInvite,
  isLoading = false,
}: InviteFanSheetProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFan, setSelectedFan] = useState<Supporter | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSelectFan = (fan: Supporter) => {
    setSelectedFan(fan);
    setShowConfirmation(true);
  };

  const handleConfirmInvite = async () => {
    if (!selectedFan) return;
    
    const success = await onInvite(selectedFan.userId);
    if (success) {
      setShowConfirmation(false);
      setSelectedFan(null);
      onOpenChange(false);
    }
  };

  const filteredTopSupporters = searchQuery
    ? topSupporters.filter((s) =>
        s.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : topSupporters;

  const filteredRecentSupporters = searchQuery
    ? recentSupporters.filter((s) =>
        s.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentSupporters;

  const SupporterRow = ({ supporter, isTop = false }: { supporter: Supporter; isTop?: boolean }) => (
    <div
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      {supporter.avatarUrl ? (
        <img
          src={supporter.avatarUrl}
          alt={supporter.displayName}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-medium">
          {supporter.displayName.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isTop && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
          <span className="font-medium truncate">{supporter.displayName}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {supporter.amount > 0 ? `$${supporter.amount} this session` : "Supporter"}
        </span>
      </div>
      <Button
        size="sm"
        onClick={() => handleSelectFan(supporter)}
        disabled={isLoading}
        className="min-h-[36px]"
      >
        <UserPlus className="h-4 w-4 mr-1" />
        Invite
      </Button>
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Invite Fan to Stage</SheetTitle>
            <SheetDescription>
              Select a supporter to invite onto your stage
            </SheetDescription>
          </SheetHeader>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[calc(100%-120px)]">
            <div className="space-y-6">
              {/* Top Supporters Section */}
              {filteredTopSupporters.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Star className="h-4 w-4 text-yellow-500" />
                    TOP SUPPORTERS (THIS SESSION)
                  </div>
                  <div className="space-y-1">
                    {filteredTopSupporters.slice(0, 5).map((supporter) => (
                      <SupporterRow key={supporter.userId} supporter={supporter} isTop />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Supporters Section */}
              {filteredRecentSupporters.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    RECENT SUPPORTERS
                  </div>
                  <div className="space-y-1">
                    {filteredRecentSupporters.slice(0, 10).map((supporter) => (
                      <SupporterRow key={supporter.userId} supporter={supporter} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {filteredTopSupporters.length === 0 && filteredRecentSupporters.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No supporters found" : "No supporters yet this session"}
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <InviteConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        fanName={selectedFan?.displayName || ""}
        fanAvatarUrl={selectedFan?.avatarUrl}
        onConfirm={handleConfirmInvite}
        isLoading={isLoading}
      />
    </>
  );
};
