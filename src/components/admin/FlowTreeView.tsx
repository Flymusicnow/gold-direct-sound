import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  SkipForward, 
  Play, 
  Flag,
  Clock,
  User,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

interface TelemetryEvent {
  id: string;
  trace_id: string;
  flow: string;
  step: string;
  status: string;
  timestamp: string;
  duration_ms: number | null;
  user_id: string | null;
  session_id: string;
  location: string;
  meta: Json | null;
  decoded_error: string | null;
}

interface FlowTreeViewProps {
  events: TelemetryEvent[];
  className?: string;
}

const STATUS_CONFIG = {
  start: {
    icon: Play,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Started',
  },
  ok: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'OK',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Warning',
  },
  fail: {
    icon: XCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    label: 'Failed',
  },
  end: {
    icon: Flag,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    label: 'Ended',
  },
  skip: {
    icon: SkipForward,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-muted-foreground/30',
    label: 'Skipped',
  },
};

export function FlowTreeView({ events, className }: FlowTreeViewProps) {
  if (events.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No events to display
      </div>
    );
  }

  // Sort events by timestamp
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const firstEvent = sortedEvents[0];
  const lastEvent = sortedEvents[sortedEvents.length - 1];
  const totalDuration = lastEvent.duration_ms || 
    (new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime());

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {firstEvent.flow}
          </CardTitle>
          <Badge 
            variant={lastEvent.status === 'fail' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {lastEvent.status === 'fail' ? 'Failed' : lastEvent.status === 'ok' || lastEvent.status === 'end' ? 'Success' : lastEvent.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {totalDuration}ms total
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {firstEvent.location}
          </span>
          {firstEvent.user_id && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {firstEvent.user_id.slice(0, 8)}...
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          
          {/* Events */}
          <div className="space-y-3">
            {sortedEvents.map((event, index) => {
              const config = STATUS_CONFIG[event.status];
              const Icon = config.icon;
              
              return (
                <div
                  key={event.id}
                  className={cn(
                    "relative pl-10 py-2 rounded-lg transition-colors",
                    event.status === 'fail' && "bg-destructive/5"
                  )}
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "absolute left-2 w-5 h-5 rounded-full flex items-center justify-center border-2",
                      config.bgColor,
                      config.borderColor
                    )}
                  >
                    <Icon className={cn("h-3 w-3", config.color)} />
                  </div>
                  
                  {/* Event content */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{event.step}</span>
                      <Badge variant="outline" className="text-xs">
                        {config.label}
                      </Badge>
                      {event.duration_ms && (
                        <span className="text-xs text-muted-foreground">
                          {event.duration_ms}ms
                        </span>
                      )}
                    </div>
                    
                    {event.decoded_error && (
                      <div className="text-sm text-destructive bg-destructive/10 rounded px-2 py-1">
                        {event.decoded_error}
                      </div>
                    )}
                    
                    {event.meta && Object.keys(event.meta).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View metadata
                        </summary>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(event.meta, null, 2)}
                        </pre>
                      </details>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(event.timestamp), 'HH:mm:ss.SSS')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
