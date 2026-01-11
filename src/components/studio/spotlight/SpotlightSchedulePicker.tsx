import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Send, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export type ScheduleOption = 'now' | 'schedule' | 'draft';

interface SpotlightSchedulePickerProps {
  value: ScheduleOption;
  onChange: (value: ScheduleOption) => void;
  scheduledDate: Date | null;
  onScheduledDateChange: (date: Date | null) => void;
}

export function SpotlightSchedulePicker({
  value,
  onChange,
  scheduledDate,
  onScheduledDateChange,
}: SpotlightSchedulePickerProps) {
  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      onScheduledDateChange(new Date(dateValue));
    } else {
      onScheduledDateChange(null);
    }
  };

  return (
    <div className="space-y-4">
      <RadioGroup value={value} onValueChange={(v) => onChange(v as ScheduleOption)}>
        {/* Publish Now */}
        <div
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
            value === 'now' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          )}
          onClick={() => onChange('now')}
        >
          <RadioGroupItem value="now" id="now" className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="now" className="cursor-pointer flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Publish Now
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Go live immediately
            </p>
          </div>
        </div>

        {/* Schedule */}
        <div
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
            value === 'schedule' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          )}
          onClick={() => onChange('schedule')}
        >
          <RadioGroupItem value="schedule" id="schedule" className="mt-0.5" />
          <div className="flex-1 space-y-3">
            <div>
              <Label htmlFor="schedule" className="cursor-pointer flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-blue-500" />
                Schedule
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Publish at a specific date and time
              </p>
            </div>
            
            {value === 'schedule' && (
              <div className="space-y-2">
                <Input
                  type="datetime-local"
                  value={scheduledDate ? format(scheduledDate, "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={handleDateTimeChange}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save as Draft */}
        <div
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
            value === 'draft' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          )}
          onClick={() => onChange('draft')}
        >
          <RadioGroupItem value="draft" id="draft" className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="draft" className="cursor-pointer flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Save as Draft
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Upload now, publish later
            </p>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}
