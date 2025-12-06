import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useMentionSearch } from "@/hooks/useMentionSearch";
import { cn } from "@/lib/utils";

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  maxLength = 1000,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentions, setMentions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { users, searchUsers, clearUsers, loading } = useMentionSearch();

  useEffect(() => {
    if (mentionQuery.length >= 2) {
      searchUsers(mentionQuery);
    } else {
      clearUsers();
    }
  }, [mentionQuery, searchUsers, clearUsers]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart || 0;
    setCursorPosition(cursor);

    // Check for @ mention trigger
    const textBeforeCursor = newValue.slice(0, cursor);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's no space after @
      if (!textAfterAt.includes(' ') && textAfterAt.length <= 20) {
        setMentionQuery(textAfterAt);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
        setMentionQuery("");
      }
    } else {
      setShowSuggestions(false);
      setMentionQuery("");
    }

    onChange(newValue, mentions);
  };

  const selectUser = (userId: string, displayName: string) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = value.slice(cursorPosition);

    const newValue = 
      value.slice(0, lastAtIndex) + 
      `@${displayName} ` + 
      textAfterCursor;

    const newMentions = [...mentions, userId];
    setMentions(newMentions);
    onChange(newValue, newMentions);
    setShowSuggestions(false);
    setMentionQuery("");
    clearUsers();

    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn("min-h-[80px]", className)}
        disabled={disabled}
        maxLength={maxLength}
      />
      
      {showSuggestions && users.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {loading ? (
            <div className="p-2 text-sm text-muted-foreground">Searching...</div>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => selectUser(user.id, user.full_name || user.email)}
                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                  {(user.full_name?.[0] || user.email[0]).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.full_name || user.email}</p>
                  {user.full_name && (
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
