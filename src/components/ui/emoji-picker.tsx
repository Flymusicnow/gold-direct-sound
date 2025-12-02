import { useState } from "react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Smile } from "lucide-react";

const COMMON_EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "🤩", "😭", "🔥", "❤️", "👍",
  "👏", "🎵", "🎶", "🎸", "🎹", "🎤", "🎧", "💯", "✨", "⭐",
  "🌟", "💫", "🚀", "💎", "👑", "🏆", "🎉", "🎊", "💪", "🙌"
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0"
        >
          <Smile className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        <div className="grid grid-cols-8 gap-1">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="h-9 w-9 flex items-center justify-center rounded hover:bg-accent text-2xl transition-colors"
              onClick={() => {
                onEmojiSelect(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
