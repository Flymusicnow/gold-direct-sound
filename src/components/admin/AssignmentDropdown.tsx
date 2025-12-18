import { useState } from "react";
import { ChevronDown, User, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// Team options with stable keys (stored in DB) and display labels (shown in UI)
export const TEAM_OPTIONS = [
  { key: null, label: "Unassigned", icon: User },
  { key: "team:johan", label: "Johan", icon: User },
  { key: "team:esuni", label: "Esuni", icon: User },
  { key: "team:lajo", label: "Lajo", icon: User },
  { key: "team:qa_team", label: "QA Team", icon: Users },
] as const;

// Helper to get label from key
export function getKeyLabel(key: string | null | undefined): string {
  if (!key) return "Unassigned";
  const option = TEAM_OPTIONS.find((o) => o.key === key);
  return option?.label || key.replace("team:", "");
}

interface AssignmentDropdownProps {
  onAssignToMe: () => Promise<boolean>;
  onAssignToKey: (key: string) => Promise<boolean>;
  onUnassign: () => Promise<boolean>;
  currentAssignedTo?: string | null;
  currentAssignedKey?: string | null;
  disabled?: boolean;
  className?: string;
}

export function AssignmentDropdown({
  onAssignToMe,
  onAssignToKey,
  onUnassign,
  currentAssignedTo,
  currentAssignedKey,
  disabled = false,
  className,
}: AssignmentDropdownProps) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isAssigned = Boolean(currentAssignedTo || currentAssignedKey);

  const handleAssignToMe = async () => {
    setLoading(true);
    try {
      await onAssignToMe();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (key: string | null) => {
    setLoading(true);
    setSheetOpen(false);
    try {
      if (key === null) {
        await onUnassign();
      } else {
        await onAssignToKey(key);
      }
    } finally {
      setLoading(false);
    }
  };

  // Render team options list (shared between dropdown and sheet)
  const renderOptions = () => (
    <>
      {TEAM_OPTIONS.map((option, index) => {
        const Icon = option.icon;
        const isSelected =
          (option.key === null && !currentAssignedTo && !currentAssignedKey) ||
          option.key === currentAssignedKey;

        if (isMobile) {
          return (
            <button
              key={option.key || "unassigned"}
              onClick={() => handleSelectOption(option.key)}
              disabled={loading}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 text-left rounded-lg transition-colors",
                isSelected
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{option.label}</span>
              {isSelected && (
                <span className="ml-auto text-xs text-primary">Current</span>
              )}
            </button>
          );
        }

        return (
          <DropdownMenuItem
            key={option.key || "unassigned"}
            onClick={() => handleSelectOption(option.key)}
            disabled={loading}
            className={cn(
              "flex items-center gap-2",
              isSelected && "bg-primary/10 text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{option.label}</span>
          </DropdownMenuItem>
        );
      })}
    </>
  );

  // Mobile: Bottom sheet for team selector
  if (isMobile) {
    return (
      <div className={cn("flex gap-0", className)}>
        {/* Primary button: Assign to me */}
        {!isAssigned && (
          <Button
            onClick={handleAssignToMe}
            disabled={disabled || loading}
            className="rounded-r-none flex-1"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign to me
          </Button>
        )}

        {/* Chevron button: Opens team selector sheet */}
        <Button
          variant={isAssigned ? "outline" : "default"}
          onClick={() => setSheetOpen(true)}
          disabled={disabled || loading}
          className={cn(
            isAssigned ? "w-full" : "rounded-l-none border-l-0 px-2"
          )}
        >
          {isAssigned ? (
            <>
              <Users className="h-4 w-4 mr-2" />
              <span className="truncate">
                {currentAssignedTo ? "User assigned" : getKeyLabel(currentAssignedKey)}
              </span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </>
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="pb-safe">
            <SheetHeader className="mb-4">
              <SheetTitle>Assign to team member</SheetTitle>
            </SheetHeader>
            <div className="space-y-1">{renderOptions()}</div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Desktop: Dropdown menu for team selector
  return (
    <div className={cn("flex gap-0", className)}>
      {/* Primary button: Assign to me */}
      {!isAssigned && (
        <Button
          onClick={handleAssignToMe}
          disabled={disabled || loading}
          className="rounded-r-none"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Assign to me
        </Button>
      )}

      {/* Dropdown for team selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isAssigned ? "outline" : "default"}
            disabled={disabled || loading}
            className={cn(
              isAssigned ? "w-full" : "rounded-l-none border-l-0 px-2"
            )}
          >
            {isAssigned ? (
              <>
                <Users className="h-4 w-4 mr-2" />
                <span className="truncate">
                  {currentAssignedTo ? "User assigned" : getKeyLabel(currentAssignedKey)}
                </span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </>
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={handleAssignToMe}
            disabled={loading || Boolean(currentAssignedTo)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign to me
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {renderOptions()}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
