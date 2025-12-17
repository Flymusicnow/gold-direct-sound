import { useState } from 'react';
import { useReproMode } from '@/contexts/ReproModeContext';
import { Bug, ChevronDown, ChevronUp, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function ReproDebugPanel() {
  const { isReproMode, issueId, apiCalls, errorCount, clearApiCalls } = useReproMode();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isReproMode) return null;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-[9999] bg-amber-500 text-black p-3 rounded-full shadow-lg hover:bg-amber-400 transition-colors"
        title="Show debug panel"
      >
        <Bug className="h-5 w-5" />
        {errorCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {errorCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-96 max-w-[calc(100vw-2rem)] bg-background border border-amber-500/50 rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-amber-500" />
          <span className="font-semibold text-sm">Repro Mode</span>
          {issueId && (
            <Badge variant="outline" className="text-xs">
              #{issueId.slice(0, 8)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {errorCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {errorCount} errors
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsMinimized(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {apiCalls.length} API calls tracked
            </span>
            {apiCalls.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={clearApiCalls}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <ScrollArea className="h-48">
            {apiCalls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No API calls tracked yet
              </div>
            ) : (
              <div className="space-y-1">
                {apiCalls.slice().reverse().map((call) => (
                  <div
                    key={call.id}
                    className={`p-2 rounded text-xs font-mono ${
                      call.status === 'error'
                        ? 'bg-red-500/10 border border-red-500/20'
                        : call.status === 'success'
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-muted/50 border border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={
                        call.status === 'error' ? 'text-red-500' :
                        call.status === 'success' ? 'text-green-500' :
                        'text-amber-500'
                      }>
                        {call.status === 'error' ? '❌' : call.status === 'success' ? '✅' : '⏳'}
                      </span>
                      <span className="font-semibold text-foreground">{call.category}</span>
                      <span className="text-muted-foreground ml-auto">
                        {formatDistanceToNow(call.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-muted-foreground truncate">{call.message}</div>
                    {call.data && (
                      <details className="mt-1">
                        <summary className="text-primary cursor-pointer hover:underline">
                          View data
                        </summary>
                        <pre className="mt-1 p-1 bg-background rounded text-[10px] overflow-auto max-h-24">
                          {JSON.stringify(call.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            💡 Check browser console for detailed logs
          </div>
        </div>
      )}
    </div>
  );
}
