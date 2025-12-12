import { useState } from "react";
import { format, addHours, isAfter, addYears } from "date-fns";
import { Calendar, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface ScheduleReleasePickerProps {
  value: { mode: 'now' | 'scheduled' | 'draft'; date?: Date };
  onChange: (value: { mode: 'now' | 'scheduled' | 'draft'; date?: Date }) => void;
}

export function ScheduleReleasePicker({ value, onChange }: ScheduleReleasePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value.date);
  const [selectedTime, setSelectedTime] = useState(
    value.date ? format(value.date, 'HH:mm') : '12:00'
  );
  const [error, setError] = useState<string | null>(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const minDate = addHours(new Date(), 1);
  const maxDate = addYears(new Date(), 1);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setError(null);
    
    if (date) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const releaseDate = new Date(date);
      releaseDate.setHours(hours, minutes, 0, 0);
      
      if (!isAfter(releaseDate, minDate)) {
        setError('Release date must be at least 1 hour in the future');
        return;
      }
      
      if (isAfter(releaseDate, maxDate)) {
        setError('Release date cannot be more than 1 year in advance');
        return;
      }
      
      onChange({ mode: 'scheduled', date: releaseDate });
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    setError(null);
    
    if (selectedDate) {
      const [hours, minutes] = time.split(':').map(Number);
      const releaseDate = new Date(selectedDate);
      releaseDate.setHours(hours, minutes, 0, 0);
      
      if (!isAfter(releaseDate, minDate)) {
        setError('Release date must be at least 1 hour in the future');
        return;
      }
      
      onChange({ mode: 'scheduled', date: releaseDate });
    }
  };

  const handleModeChange = (mode: 'now' | 'scheduled' | 'draft') => {
    if (mode === 'scheduled' && selectedDate) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const releaseDate = new Date(selectedDate);
      releaseDate.setHours(hours, minutes, 0, 0);
      onChange({ mode, date: releaseDate });
    } else {
      onChange({ mode, date: undefined });
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Release Options</Label>
      
      <RadioGroup
        value={value.mode}
        onValueChange={(v) => handleModeChange(v as 'now' | 'scheduled' | 'draft')}
        className="space-y-3"
      >
        <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
          <RadioGroupItem value="now" id="release-now" />
          <Label htmlFor="release-now" className="flex-1 cursor-pointer">
            <div className="font-medium">Release Now</div>
            <div className="text-xs text-muted-foreground">
              Publish immediately after upload
            </div>
          </Label>
        </div>
        
        <div className={cn(
          "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer",
          value.mode === 'scheduled' ? "border-primary bg-primary/5" : "hover:bg-accent/50"
        )}>
          <RadioGroupItem value="scheduled" id="schedule-release" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="schedule-release" className="cursor-pointer">
              <div className="font-medium">Schedule Release</div>
              <div className="text-xs text-muted-foreground mb-3">
                Set a future date and time
              </div>
            </Label>
            
            {value.mode === 'scheduled' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => 
                          date < new Date() || date > maxDate
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="pl-9 w-32"
                    />
                  </div>
                </div>
                
                {selectedDate && !error && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    Releases at {format(value.date || new Date(), 'PPP p')} ({timezone})
                  </div>
                )}
                
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
          <RadioGroupItem value="draft" id="save-draft" />
          <Label htmlFor="save-draft" className="flex-1 cursor-pointer">
            <div className="font-medium">Save as Draft</div>
            <div className="text-xs text-muted-foreground">
              Upload now, publish later
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
