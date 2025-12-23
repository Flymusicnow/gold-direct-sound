import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Briefcase, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Trash2, 
  Power,
  PowerOff,
  Download,
  Calendar,
  MapPin,
  Users,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Opportunity {
  id: string;
  title: string;
  type: string;
  description: string | null;
  location: string | null;
  budget_range: string | null;
  application_deadline: string | null;
  remote_ok: boolean;
  min_supporters: number;
  is_active: boolean;
  created_at: string;
  collab_entities: { name: string; type: string; id: string } | null;
  applicationCount: number;
}

export default function AdminOpportunities() {
  const { user, profile, hasRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedEntityType, setSelectedEntityType] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState<Opportunity | null>(null);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | null>(null);

  const OPPORTUNITY_TYPES = [
    { value: 'festival_slot', label: t('opportunityTypes.festivalSlot') },
    { value: 'live_event', label: t('opportunityTypes.liveEvent') },
    { value: 'brand_campaign', label: t('opportunityTypes.brandCampaign') },
    { value: 'sponsorship', label: t('opportunityTypes.sponsorship') },
    { value: 'collaboration', label: t('opportunityTypes.collaboration') },
  ];

  const ENTITY_TYPES = [
    { value: 'festival', label: t('entityTypes.festival') },
    { value: 'brand', label: t('entityTypes.brand') },
    { value: 'label', label: t('entityTypes.label') },
    { value: 'venue', label: t('entityTypes.venue') },
  ];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!hasRole('admin') && !hasRole('super_admin')) {
      navigate('/');
      return;
    }
    fetchOpportunities();
  }, [user, hasRole, navigate]);

  const fetchOpportunities = async () => {
    const isRefresh = !loading;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: opportunitiesData, error: oppError } = await supabase
        .from('collab_opportunities')
        .select(`
          *,
          collab_entities(id, name, type)
        `)
        .order('created_at', { ascending: false });

      if (oppError) throw oppError;

      const opportunityIds = opportunitiesData?.map(o => o.id) || [];
      const fkColumn = 'opportunity_id';

      let applicationCounts: { opportunity_id: string; count: number }[] = [];

      if (opportunityIds.length > 0) {
        const { data: appData, error: appError } = await supabase
          .from('collab_applications')
          .select('opportunity_id')
          .in('opportunity_id', opportunityIds);

        if (appError) throw appError;

        const countMap = (appData || []).reduce((acc, app: any) => {
          const key = app[fkColumn];
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        applicationCounts = Object.entries(countMap).map(([id, count]) => ({
          opportunity_id: id,
          count,
        }));
      }

      const enrichedOpportunities: Opportunity[] = (opportunitiesData || []).map((opp: any) => ({
        ...opp,
        applicationCount: applicationCounts.find(ac => ac.opportunity_id === opp.id)?.count || 0,
      }));

      setOpportunities(enrichedOpportunities);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredOpportunities = opportunities.filter(opp => {
    const entityName = (opp.collab_entities?.name || '').toLowerCase();
    const entityType = opp.collab_entities?.type || '';
    const desc = (opp.description || '').toLowerCase();
    const loc = (opp.location || '').toLowerCase();

    const matchesSearch =
      opp.title.toLowerCase().includes(q) ||
      entityName.includes(q) ||
      desc.includes(q) ||
      loc.includes(q);

    if (!matchesSearch) return false;
    if (selectedType !== 'all' && opp.type !== selectedType) return false;
    if (selectedEntityType !== 'all' && entityType !== selectedEntityType) return false;

    return true;
  });

  const getTabOpportunities = (tab: string) => {
    if (tab === 'active') return filteredOpportunities.filter(o => o.is_active);
    if (tab === 'inactive') return filteredOpportunities.filter(o => !o.is_active);
    if (tab === 'expiring') {
      return filteredOpportunities.filter(o => {
        if (!o.application_deadline) return false;
        const deadline = new Date(o.application_deadline);
        const now = new Date();
        const diffInDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffInDays >= 0 && diffInDays <= 7;
      });
    }
    return filteredOpportunities;
  };

  const stats = {
    total: opportunities.length,
    active: opportunities.filter(o => o.is_active).length,
    inactive: opportunities.filter(o => !o.is_active).length,
    expiring: opportunities.filter(o => {
      if (!o.application_deadline) return false;
      const deadline = new Date(o.application_deadline);
      const now = new Date();
      const diffInDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffInDays >= 0 && diffInDays <= 7;
    }).length,
    totalApplications: opportunities.reduce((sum, o) => sum + o.applicationCount, 0),
  };

  const handleSelectAll = (checked: boolean) => {
    const currentTabOpps = getTabOpportunities(activeTab);
    if (checked) setSelectedIds(currentTabOpps.map(o => o.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter(sid => sid !== id)
    );
  };

  const handleToggleActive = async (opp: Opportunity) => {
    try {
      const { error } = await supabase
        .from('collab_opportunities')
        .update({ is_active: !opp.is_active })
        .eq('id', opp.id);

      if (error) throw error;

      toast.success(opp.is_active ? t('admin.opportunityDeactivated') : t('admin.opportunityActivated'));
      fetchOpportunities();
    } catch (error) {
      console.error('Error toggling opportunity:', error);
      toast.error(t('errors.saveFailed'));
    }
  };

  const handleDeleteClick = (opp: Opportunity) => {
    setOpportunityToDelete(opp);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!opportunityToDelete) return;

    if (opportunityToDelete.applicationCount > 0) {
      toast.error(t('admin.deleteBlockedHasApplications'));
      setDeleteDialogOpen(false);
      setOpportunityToDelete(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('collab_opportunities')
        .delete()
        .eq('id', opportunityToDelete.id);

      if (error) throw error;

      toast.success(t('admin.opportunityDeleted'));
      setDeleteDialogOpen(false);
      setOpportunityToDelete(null);
      fetchOpportunities();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      toast.error(t('errors.deleteFailed'));
    }
  };

  const handleBulkActionClick = (action: 'activate' | 'deactivate') => {
    if (selectedIds.length === 0) {
      toast.error(t('admin.noOpportunitiesSelected'));
      return;
    }
    setBulkAction(action);
    setBulkActionDialogOpen(true);
  };

  const handleBulkActionConfirm = async () => {
    if (!bulkAction || selectedIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('collab_opportunities')
        .update({ is_active: bulkAction === 'activate' })
        .in('id', selectedIds);

      if (error) throw error;

      toast.success(t('admin.bulkActionSuccess').replace('{{count}}', String(selectedIds.length)));
      setBulkActionDialogOpen(false);
      setBulkAction(null);
      setSelectedIds([]);
      fetchOpportunities();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error(t('errors.bulkActionFailed'));
    }
  };

  const handleExportCSV = () => {
    const esc = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const currentTabOpps = getTabOpportunities(activeTab);

    const csv = [
      ['Title', 'Entity', 'Type', 'Location', 'Budget', 'Deadline', 'Applications', 'Status'].join(','),
      ...currentTabOpps.map(opp => [
        esc(opp.title),
        esc(opp.collab_entities?.name || ''),
        esc(opp.type),
        esc(opp.location || ''),
        esc(opp.budget_range || ''),
        esc(opp.application_deadline || ''),
        String(opp.applicationCount),
        esc(opp.is_active ? 'Active' : 'Inactive'),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flymusic-opportunities-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const OpportunityList = ({ opportunities }: { opportunities: Opportunity[] }) => {
    const currentTabOpps = getTabOpportunities(activeTab);
    const allSelected = selectedIds.length === currentTabOpps.length && currentTabOpps.length > 0;

    if (opportunities.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">{t('admin.noOpportunitiesFound')}</p>
            <p className="text-sm text-muted-foreground">{t('admin.tryAdjustingFilters')}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {selectedIds.length > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) => handleSelectAll(!!v)}
                  />
                  <span className="text-sm font-medium">
                    {selectedIds.length} {t('admin.selected')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkActionClick('activate')}>
                    <Power className="h-4 w-4 mr-1" />
                    {t('admin.bulkActivate')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkActionClick('deactivate')}>
                    <PowerOff className="h-4 w-4 mr-1" />
                    {t('admin.bulkDeactivate')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(v) => handleSelectAll(!!v)}
                    />
                  </TableHead>
                  <TableHead>{t('common.title')}</TableHead>
                  <TableHead>{t('admin.entity')}</TableHead>
                  <TableHead>{t('common.type')}</TableHead>
                  <TableHead>{t('admin.location')}</TableHead>
                  <TableHead>{t('admin.deadline')}</TableHead>
                  <TableHead>{t('admin.applications')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((opp) => {
                  const isExpiringSoon = opp.application_deadline && (() => {
                    const deadline = new Date(opp.application_deadline);
                    const now = new Date();
                    const diffInDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                    return diffInDays >= 0 && diffInDays <= 1;
                  })();
                  const entityId = opp.collab_entities?.id;

                  return (
                    <TableRow key={opp.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(opp.id)}
                          onCheckedChange={(v) => handleSelectOne(opp.id, !!v)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{opp.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{opp.collab_entities?.name || '—'}</span>
                          <Badge variant="secondary" className="w-fit text-xs">
                            {opp.collab_entities?.type || 'Unknown'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{opp.type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        {opp.location ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {opp.location}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {opp.application_deadline ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(opp.application_deadline).toLocaleDateString()}
                            {isExpiringSoon && (
                              <Badge variant="destructive" className="text-xs ml-1">
                                {t('admin.urgent')}
                              </Badge>
                            )}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {opp.applicationCount === 0 
                            ? t('admin.noApplications')
                            : `${opp.applicationCount} ${opp.applicationCount === 1 ? t('admin.application') : t('admin.applications')}`
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={opp.is_active ? 'default' : 'secondary'}>
                          {opp.is_active ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => entityId && navigate(`/admin/collab-entities/${entityId}`)}
                            disabled={!entityId}
                            title={t('admin.viewEntity')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggleActive(opp)}
                            title={opp.is_active ? t('admin.deactivate') : t('admin.activate')}
                          >
                            {opp.is_active ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteClick(opp)}
                            title={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {opportunities.map((opp) => {
            const isExpiringSoon = opp.application_deadline && (() => {
              const deadline = new Date(opp.application_deadline);
              const now = new Date();
              const diffInDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
              return diffInDays >= 0 && diffInDays <= 1;
            })();
            const entityId = opp.collab_entities?.id;

            return (
              <Card key={opp.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIds.includes(opp.id)}
                        onCheckedChange={(v) => handleSelectOne(opp.id, !!v)}
                      />
                      <div>
                        <CardTitle className="text-base">{opp.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {opp.collab_entities?.name || 'Unknown Entity'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={opp.is_active ? 'default' : 'secondary'}>
                      {opp.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {opp.collab_entities?.type || 'Unknown'}
                    </Badge>
                    <Badge variant="outline">
                      {opp.type.replace('_', ' ')}
                    </Badge>
                  </div>

                  {opp.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {opp.location}
                    </div>
                  )}

                  {opp.application_deadline && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(opp.application_deadline).toLocaleDateString()}
                      {isExpiringSoon && (
                        <Badge variant="destructive" className="text-xs">
                          {t('admin.urgent')}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {opp.applicationCount === 0 
                      ? t('admin.noApplications')
                      : `${opp.applicationCount} ${opp.applicationCount === 1 ? t('admin.application') : t('admin.applications')}`
                    }
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => entityId && navigate(`/admin/collab-entities/${entityId}`)}
                      disabled={!entityId}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {t('admin.viewEntity')}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleToggleActive(opp)}
                    >
                      {opp.is_active ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleDeleteClick(opp)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{t('admin.opportunitiesPage')}</h1>
          </div>
          <p className="text-muted-foreground">
            {t('admin.opportunitiesPageDescription')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.totalOpportunities')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.activeOpportunities')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.inactiveOpportunities')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.expiringSoon')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{stats.expiring}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.totalApplications')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{stats.totalApplications}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('admin.searchOpportunities')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={t('admin.filterByType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {OPPORTUNITY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={t('admin.filterByEntity')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {ENTITY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={fetchOpportunities} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>

              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                {t('admin.exportCSV')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              {t('common.all')} ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="active">
              {t('admin.activeOpportunities')} ({stats.active})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              {t('admin.inactiveOpportunities')} ({stats.inactive})
            </TabsTrigger>
            <TabsTrigger value="expiring">
              {t('admin.expiringSoon')} ({stats.expiring})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <OpportunityList opportunities={getTabOpportunities('all')} />
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <OpportunityList opportunities={getTabOpportunities('active')} />
          </TabsContent>

          <TabsContent value="inactive" className="mt-4">
            <OpportunityList opportunities={getTabOpportunities('inactive')} />
          </TabsContent>

          <TabsContent value="expiring" className="mt-4">
            <OpportunityList opportunities={getTabOpportunities('expiring')} />
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('admin.deleteOpportunityConfirm')}</AlertDialogTitle>
              <AlertDialogDescription>
                {opportunityToDelete && opportunityToDelete.applicationCount > 0 ? (
                  t('admin.deleteOpportunityWithApplicationsWarning')
                    .replace('{{count}}', String(opportunityToDelete.applicationCount))
                    .replace('{{title}}', opportunityToDelete.title)
                ) : (
                  t('admin.deleteOpportunityNoApplications')
                    .replace('{{title}}', opportunityToDelete?.title || '')
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Action Confirmation Dialog */}
        <AlertDialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('admin.bulkActionConfirm')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('admin.bulkActionWarning')
                  .replace('{{count}}', String(selectedIds.length))
                  .replace('{{action}}', bulkAction === 'activate' ? t('admin.activate') : t('admin.deactivate'))}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkActionConfirm}>
                {t('common.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
