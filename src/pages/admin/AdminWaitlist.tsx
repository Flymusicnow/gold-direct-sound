import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Loader2, Mail, Users, Send, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  user_type: string;
  status: string;
  message: string | null;
  created_at: string;
  invited_at: string | null;
}

interface InviteResult {
  sent: Array<{ email: string; role: string; code: string }>;
  failed: Array<{ email: string; error: string }>;
  skipped: Array<{ email: string; reason: string }>;
}

export default function AdminWaitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Invite dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [inviteMode, setInviteMode] = useState<'single' | 'bulk'>('single');
  const [pendingInvites, setPendingInvites] = useState<WaitlistEntry[]>([]);
  const [bulkRole, setBulkRole] = useState<'auto' | 'fan' | 'artist'>('auto');
  
  // Sending state
  const [isSending, setIsSending] = useState(false);
  const [inviteResults, setInviteResults] = useState<InviteResult | null>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

  useEffect(() => {
    fetchWaitlist();
  }, [statusFilter]);

  const fetchWaitlist = async () => {
    setLoading(true);
    let query = supabase
      .from('beta_waitlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching waitlist:', error);
      toast.error('Failed to fetch waitlist');
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  const updateEntryStatus = async (id: string, newStatus: 'contacted' | 'approved') => {
    setActionLoading(id);
    
    const { error } = await supabase
      .from('beta_waitlist')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
      console.error('Update error:', error);
    } else {
      toast.success(`Status updated to ${newStatus}`);
      setEntries(prev => 
        prev.map(e => e.id === id ? { ...e, status: newStatus } : e)
      );
    }
    
    setActionLoading(null);
  };

  // Selection handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map(e => e.id)));
    }
  }, [entries, selectedIds.size]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Get invitable entries (not already invited)
  const getInvitableEntries = useCallback((ids: string[]) => {
    return entries.filter(e => ids.includes(e.id) && e.status !== 'invited');
  }, [entries]);

  // Single invite
  const handleSingleInvite = useCallback((entry: WaitlistEntry) => {
    setInviteMode('single');
    setPendingInvites([entry]);
    setBulkRole('auto');
    setShowConfirmDialog(true);
  }, []);

  // Bulk invite
  const handleBulkInvite = useCallback(() => {
    const invitableEntries = getInvitableEntries(Array.from(selectedIds));
    if (invitableEntries.length === 0) {
      toast.error('No invitable entries selected');
      return;
    }
    setInviteMode('bulk');
    setPendingInvites(invitableEntries);
    setBulkRole('auto');
    setShowConfirmDialog(true);
  }, [selectedIds, getInvitableEntries]);

  // Send invites
  const sendInvites = async () => {
    setIsSending(true);
    setShowConfirmDialog(false);

    try {
      const invites = pendingInvites.map(entry => ({
        email: entry.email,
        role: bulkRole === 'auto' 
          ? (entry.user_type === 'artist' ? 'artist' : 'fan') as 'fan' | 'artist'
          : bulkRole as 'fan' | 'artist',
        waitlistId: entry.id,
      }));

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('Not authenticated');
        setIsSending(false);
        return;
      }

      const response = await supabase.functions.invoke('send-beta-invites', {
        body: { invites },
      });

      if (response.error) {
        console.error('Invite error:', response.error);
        toast.error(response.error.message || 'Failed to send invites');
        setIsSending(false);
        return;
      }

      const results: InviteResult = response.data;
      setInviteResults(results);
      setShowResultsDialog(true);

      // Update local state for sent invites
      if (results.sent.length > 0) {
        const sentEmails = new Set(results.sent.map(s => s.email));
        setEntries(prev => prev.map(e => 
          sentEmails.has(e.email) 
            ? { ...e, status: 'invited', invited_at: new Date().toISOString() } 
            : e
        ));
        clearSelection();
      }

      // Show summary toast
      if (results.sent.length > 0) {
        toast.success(`${results.sent.length} invite(s) sent successfully`);
      }
      if (results.failed.length > 0) {
        toast.error(`${results.failed.length} invite(s) failed`);
      }

    } catch (error) {
      console.error('Error sending invites:', error);
      toast.error('Failed to send invites');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'contacted':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Contacted</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'invited':
        return <Badge variant="default" className="bg-purple-600">Invited</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'fan':
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Fan</Badge>;
      case 'artist':
        return <Badge variant="outline" className="border-pink-500 text-pink-500">Artist</Badge>;
      default:
        return <Badge variant="outline">{userType}</Badge>;
    }
  };

  const selectedCount = selectedIds.size;
  const invitableSelectedCount = getInvitableEntries(Array.from(selectedIds)).length;

  return (
    <AdminLayout title="Waitlist" description="View and manage beta waitlist signups">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entries.filter(e => e.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invited</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entries.filter(e => e.status === 'invited').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entries.filter(e => e.status === 'approved').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedCount > 0 && (
          <Card className="bg-muted/50 border-primary/20">
            <CardContent className="py-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedCount} selected</Badge>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <Select value={bulkRole} onValueChange={(v) => setBulkRole(v as 'auto' | 'fan' | 'artist')}>
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (requested)</SelectItem>
                      <SelectItem value="fan">Fan</SelectItem>
                      <SelectItem value="artist">Artist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleBulkInvite} 
                  disabled={invitableSelectedCount === 0 || isSending}
                  size="sm"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  Send {invitableSelectedCount} Invite{invitableSelectedCount !== 1 ? 's' : ''}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={entries.length > 0 && selectedIds.size === entries.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signed Up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No waitlist entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id} className={selectedIds.has(entry.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(entry.id)}
                          onCheckedChange={() => toggleSelect(entry.id)}
                          aria-label={`Select ${entry.email}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{entry.email}</TableCell>
                      <TableCell>{entry.name || '—'}</TableCell>
                      <TableCell>{getUserTypeBadge(entry.user_type)}</TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {entry.status !== 'invited' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSingleInvite(entry)}
                              disabled={isSending || actionLoading === entry.id}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Invite
                            </Button>
                          )}
                          {entry.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateEntryStatus(entry.id, 'contacted')}
                              disabled={actionLoading === entry.id}
                            >
                              {actionLoading === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Contacted'}
                            </Button>
                          )}
                          {entry.status === 'invited' && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              Sent
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send {inviteMode === 'single' ? 'Invite' : `${pendingInvites.length} Invites`}</DialogTitle>
            <DialogDescription>
              {inviteMode === 'single' 
                ? `Send a beta invite to ${pendingInvites[0]?.email}?`
                : `Send beta invites to ${pendingInvites.length} people?`
              }
            </DialogDescription>
          </DialogHeader>

          {inviteMode === 'bulk' && pendingInvites.length > 3 && (
            <ScrollArea className="max-h-[200px] border rounded-md p-2">
              <ul className="space-y-1 text-sm">
                {pendingInvites.slice(0, 10).map(entry => (
                  <li key={entry.id} className="text-muted-foreground">
                    {entry.email} ({entry.user_type})
                  </li>
                ))}
                {pendingInvites.length > 10 && (
                  <li className="text-muted-foreground italic">
                    ... and {pendingInvites.length - 10} more
                  </li>
                )}
              </ul>
            </ScrollArea>
          )}

          {inviteMode === 'single' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Role:</span>
                <Select value={bulkRole} onValueChange={(v) => setBulkRole(v as 'auto' | 'fan' | 'artist')}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      Auto ({pendingInvites[0]?.user_type === 'artist' ? 'Artist' : 'Fan'})
                    </SelectItem>
                    <SelectItem value="fan">Fan</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={sendInvites} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Send Invite{pendingInvites.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite Results</DialogTitle>
          </DialogHeader>

          {inviteResults && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-4">
                {inviteResults.sent.length > 0 && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {inviteResults.sent.length} Sent
                  </Badge>
                )}
                {inviteResults.skipped.length > 0 && (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {inviteResults.skipped.length} Skipped
                  </Badge>
                )}
                {inviteResults.failed.length > 0 && (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    {inviteResults.failed.length} Failed
                  </Badge>
                )}
              </div>

              {/* Sent */}
              {inviteResults.sent.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Sent Successfully
                  </h4>
                  <ScrollArea className="max-h-[100px] border rounded-md p-2">
                    <ul className="space-y-1 text-sm">
                      {inviteResults.sent.map(item => (
                        <li key={item.email} className="text-muted-foreground">
                          {item.email} ({item.role}) - Code: {item.code}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}

              {/* Skipped */}
              {inviteResults.skipped.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    Skipped
                  </h4>
                  <ScrollArea className="max-h-[100px] border rounded-md p-2">
                    <ul className="space-y-1 text-sm">
                      {inviteResults.skipped.map(item => (
                        <li key={item.email} className="text-muted-foreground">
                          {item.email}: {item.reason}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}

              {/* Failed */}
              {inviteResults.failed.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Failed
                  </h4>
                  <ScrollArea className="max-h-[100px] border rounded-md p-2">
                    <ul className="space-y-1 text-sm">
                      {inviteResults.failed.map(item => (
                        <li key={item.email} className="text-red-400">
                          {item.email}: {item.error}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResultsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
