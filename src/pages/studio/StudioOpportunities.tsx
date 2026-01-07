import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { StudioSidebar } from "@/components/artist/StudioSidebar";
import { BottomNavBarStudio } from "@/components/mobile/BottomNavBarStudio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ScrollableTabsList } from "@/components/ui/ScrollableTabs";
import { AnimatedTabTrigger } from "@/components/ui/AnimatedTabTrigger";
import { ClipboardList } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Search,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Star,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ApplyToOpportunityDialog } from "@/components/artist/ApplyToOpportunityDialog";
import { OpportunityMatchScore } from "@/components/artist/OpportunityMatchScore";
import { useApplicationStatus } from "@/hooks/useApplicationStatus";

export default function StudioOpportunities() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);

  // Fetch artist profile
  const { data: artistProfile } = useQuery({
    queryKey: ['artist-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch opportunities with entity info
  const { data: opportunities = [], isLoading: loadingOpportunities } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collab_opportunities')
        .select(`
          *,
          entity:collab_entities(id, name, logo_url, type, location)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch artist's applications
  const { data: myApplications = [], isLoading: loadingApplications } = useQuery({
    queryKey: ['my-applications', artistProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collab_applications')
        .select(`
          *,
          opportunity:collab_opportunities(
            id, title, type,
            entity:collab_entities(name, logo_url)
          )
        `)
        .eq('artist_id', artistProfile?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!artistProfile?.id,
  });

  // Fetch match scores for each opportunity
  const { data: matchScores = {} } = useQuery({
    queryKey: ['opportunity-match-scores', artistProfile?.id],
    queryFn: async () => {
      const scores: Record<string, any> = {};
      for (const opp of opportunities) {
        const { data } = await supabase.rpc('calculate_opportunity_match_score', {
          _artist_id: artistProfile?.id,
          _opportunity_id: opp.id
        });
        if (data) {
          scores[opp.id] = data;
        }
      }
      return scores;
    },
    enabled: !!artistProfile?.id && opportunities.length > 0,
  });

  // Real-time application status updates
  useApplicationStatus(artistProfile?.id);

  // Filter opportunities
  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.entity?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || opp.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Sort by match score
  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    const scoreA = matchScores[a.id]?.totalScore || 0;
    const scoreB = matchScores[b.id]?.totalScore || 0;
    return scoreB - scoreA;
  });

  // Check if already applied
  const hasApplied = (opportunityId: string) => {
    return myApplications.some(app => app.opportunity_id === opportunityId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{t('studio.applicationSubmitted')}</Badge>;
      case 'viewed':
        return <Badge variant="outline" className="border-blue-500 text-blue-500"><Eye className="h-3 w-3 mr-1" />{t('studio.applicationViewed')}</Badge>;
      case 'shortlisted':
        return <Badge variant="outline" className="border-primary text-primary"><Star className="h-3 w-3 mr-1" />{t('studio.applicationShortlisted')}</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />{t('studio.applicationAccepted')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />{t('studio.applicationNotSelected')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const opportunityTypes = [
    { value: 'all', label: t('common.all') + ' ' + t('common.type') },
    { value: 'live_event', label: t('opportunityTypes.liveEvent') },
    { value: 'festival_slot', label: t('opportunityTypes.festivalSlot') },
    { value: 'brand_deal', label: t('opportunityTypes.brandDeal') },
    { value: 'sponsorship', label: t('opportunityTypes.sponsorship') },
    { value: 'ugc_content', label: t('opportunityTypes.ugcContent') },
    { value: 'partnership', label: t('opportunityTypes.partnership') },
  ];

  return (
    <div className="h-screen overflow-hidden bg-background flex">
      <StudioSidebar />
      
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-auto-hide pb-24 md:pb-8">
        {/* Sticky Back Button */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border py-3 px-4 md:px-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
        </div>
        
        <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" />
              {t('studio.opportunities')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('studio.opportunitiesDescription')}
            </p>
          </div>

          <Tabs defaultValue="browse" className="space-y-6">
            <ScrollableTabsList sticky={false}>
              <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0 h-auto gap-0 min-w-max md:min-w-0">
                <AnimatedTabTrigger value="browse" icon={<Briefcase className="w-4 h-4" />} layoutId="studioOpportunitiesTabs">
                  {t('studio.browseOpportunities')}
                </AnimatedTabTrigger>
                <AnimatedTabTrigger value="applications" icon={<ClipboardList className="w-4 h-4" />} layoutId="studioOpportunitiesTabs">
                  {t('studio.myApplications')}
                  {myApplications.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{myApplications.length}</Badge>
                  )}
                </AnimatedTabTrigger>
              </TabsList>
            </ScrollableTabsList>

            {/* Browse Tab */}
            <TabsContent value="browse" className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('studio.searchOpportunities')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-48" aria-label={t('common.filter') + ' ' + t('common.type')}>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    {opportunityTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Opportunities Grid */}
              {loadingOpportunities ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sortedOpportunities.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">{t('studio.noOpportunitiesFound')}</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || typeFilter !== "all" 
                        ? t('studio.tryAdjustingFilters')
                        : t('studio.checkBackSoon')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {sortedOpportunities.map((opp) => (
                    <Card key={opp.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {opp.entity?.logo_url ? (
                              <img 
                                src={opp.entity.logo_url} 
                                alt={opp.entity.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                <Briefcase className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-lg">{opp.title}</CardTitle>
                              <CardDescription>{opp.entity?.name}</CardDescription>
                            </div>
                          </div>
                          {matchScores[opp.id] && (
                            <OpportunityMatchScore score={matchScores[opp.id]} />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {opp.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {opp.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{opp.type.replace('_', ' ')}</Badge>
                          {opp.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {opp.location}
                            </span>
                          )}
                          {opp.remote_ok && (
                            <Badge variant="secondary">{t('studio.remoteOk')}</Badge>
                          )}
                          {opp.budget_range && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {opp.budget_range}
                            </span>
                          )}
                          {opp.min_supporters ? (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {opp.min_supporters}+ {t('studio.supporters').toLowerCase()}
                            </span>
                          ) : null}
                        </div>

                        {opp.application_deadline ? (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t('studio.deadline')}: {format(new Date(opp.application_deadline), 'MMM d, yyyy')}
                          </p>
                        ) : null}

                        <div className="flex gap-2 pt-2">
                          {hasApplied(opp.id) ? (
                            <Button variant="outline" disabled className="flex-1">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {t('studio.applied')}
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => setSelectedOpportunity(opp)}
                              className="flex-1"
                            >
                              {t('studio.applyNow')}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications" className="space-y-4">
              {loadingApplications ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : myApplications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">{t('studio.noApplicationsYet')}</h3>
                    <p className="text-muted-foreground mb-4">
                      {t('studio.startApplyingToSee')}
                    </p>
                    <Button variant="outline" onClick={() => document.querySelector('[value="browse"]')?.dispatchEvent(new Event('click'))}>
                      {t('studio.browseOpportunities')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {myApplications.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {app.opportunity?.entity?.logo_url ? (
                              <img 
                                src={app.opportunity.entity.logo_url} 
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{app.opportunity?.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {app.opportunity?.entity?.name} • {t('studio.appliedOn')} {format(new Date(app.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(app.status)}
                        </div>
                        {app.message && (
                          <p className="mt-3 text-sm text-muted-foreground line-clamp-2 pl-13">
                            "{app.message}"
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        </div>
      </main>

      {selectedOpportunity && artistProfile && (
        <ApplyToOpportunityDialog
          opportunity={selectedOpportunity}
          artistId={artistProfile.id}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}

      <BottomNavBarStudio />
    </div>
  );
}