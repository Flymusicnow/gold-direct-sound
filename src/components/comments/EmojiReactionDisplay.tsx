import { cn } from "@/lib/utils";

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface EmojiReactionDisplayProps {
  reactions: Reaction[];
  onToggle: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiReactionDisplay({ reactions, onToggle, disabled }: EmojiReactionDisplayProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onToggle(reaction.emoji)}
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm transition-colors",
            reaction.hasReacted
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
          )}
        >
          <span>{reaction.emoji}</span>
          <span className="text-xs font-medium">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}
