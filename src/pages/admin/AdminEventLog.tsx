import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

const EVENT_TYPES = [
  'all', 'session_start', 'session_end', 'play', 'skip', 'complete',
  'save', 'follow', 'vote', 'search',
];

interface EventRow {
  id: string;
  user_id: string;
  event_type: string;
  track_id: string | null;
  session_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export default function AdminEventLog() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterTrackId, setFilterTrackId] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase.from as any)('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterType !== 'all') {
        query = query.eq('event_type', filterType);
      }
      if (filterUserId.trim()) {
        query = query.eq('user_id', filterUserId.trim());
      }
      if (filterTrackId.trim()) {
        query = query.eq('track_id', filterTrackId.trim());
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching events:', error);
        return;
      }
      setEvents((data as EventRow[]) || []);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterUserId, filterTrackId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const eventColor = (type: string) => {
    const colors: Record<string, string> = {
      play: 'bg-green-500/20 text-green-400',
      skip: 'bg-yellow-500/20 text-yellow-400',
      complete: 'bg-blue-500/20 text-blue-400',
      save: 'bg-pink-500/20 text-pink-400',
      follow: 'bg-purple-500/20 text-purple-400',
      vote: 'bg-amber-500/20 text-amber-400',
      search: 'bg-cyan-500/20 text-cyan-400',
      session_start: 'bg-emerald-500/20 text-emerald-400',
      session_end: 'bg-red-500/20 text-red-400',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Event Log</h1>
        <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t === 'all' ? 'All types' : t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Filter by user_id"
          value={filterUserId}
          onChange={(e) => setFilterUserId(e.target.value)}
          className="w-[240px]"
        />
        <Input
          placeholder="Filter by track_id"
          value={filterTrackId}
          onChange={(e) => setFilterTrackId(e.target.value)}
          className="w-[240px]"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Metadata</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {loading ? 'Loading...' : 'No events found'}
                </TableCell>
              </TableRow>
            )}
            {events.map((ev) => (
              <TableRow key={ev.id}>
                <TableCell className="text-xs whitespace-nowrap font-mono">
                  {format(new Date(ev.created_at), 'MMM d HH:mm:ss')}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${eventColor(ev.event_type)}`}>
                    {ev.event_type}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-mono truncate max-w-[120px]">
                  {ev.user_id?.slice(0, 8)}…
                </TableCell>
                <TableCell className="text-xs font-mono truncate max-w-[120px]">
                  {ev.track_id ? `${ev.track_id.slice(0, 8)}…` : '—'}
                </TableCell>
                <TableCell className="text-xs font-mono truncate max-w-[100px]">
                  {ev.session_id || '—'}
                </TableCell>
                <TableCell>
                  {ev.metadata && Object.keys(ev.metadata).length > 0 ? (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <ChevronDown className="w-3 h-3" />
                        JSON
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <pre className="text-xs mt-1 p-2 rounded bg-muted/50 max-w-[300px] overflow-auto">
                          {JSON.stringify(ev.metadata, null, 2)}
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
