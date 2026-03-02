import { useState, useRef, useEffect } from "react";
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

  // Parallax scroll setup — RAF-gated, no re-renders
  const mainRef = useRef<HTMLElement>(null);
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const update = () => {
      ticking.current = false;
      const y = scrollYRef.current;
      section1Ref.current?.style.setProperty('transform', `translateY(${y * -0.005}px)`);
      section2Ref.current?.style.setProperty('transform', `translateY(${y * -0.010}px)`);
      section3Ref.current?.style.setProperty('transform', `translateY(${y * -0.016}px)`);
    };
    const onScroll = () => {
      scrollYRef.current = el.scrollTop;
      if (!ticking.current) {
        requestAnimationFrame(update);
        ticking.current = true;
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

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

  // Fetch match scores
  const { data: matchScores = {} } = useQuery({
    queryKey: ['opportunity-match-scores', artistProfile?.id],
    queryFn: async () => {
      const scores: Record<string, any> = {};
      for (const opp of opportunities) {
        const { data } = await supabase.rpc('calculate_opportunity_match_score', {
          _artist_id: artistProfile?.id,
          _opportunity_id: opp.id
        });
        if (data) scores[opp.id] = data;
      }
      return scores;
    },
    enabled: !!artistProfile?.id && opportunities.length > 0,
  });

  useApplicationStatus(artistProfile?.id);

  // Filter + sort
  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.entity?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || opp.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    const scoreA = matchScores[a.id]?.totalScore || 0;
    const scoreB = matchScores[b.id]?.totalScore || 0;
    return scoreB - scoreA;
  });

  // Netflix-style grouped rows
  const grouped = {
    recommended: sortedOpportunities.slice(0, 8),
    liveEvents: sortedOpportunities.filter(o => ['live_event', 'festival_slot'].includes(o.type)),
    brandDeals: sortedOpportunities.filter(o => ['brand_deal', 'sponsorship', 'ugc_content'].includes(o.type)),
    partnerships: sortedOpportunities.filter(o => o.type === 'partnership'),
  };

  const hasApplied = (opportunityId: string) =>
    myApplications.some(app => app.opportunity_id === opportunityId);

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

  // Reusable opportunity card
  const OpportunityCard = ({ opp }: { opp: any }) => (
    <div className="netflix-row-card opp-card h-full flex flex-col">
      <div className="p-4 flex flex-col flex-1 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {opp.entity?.logo_url ? (
              <img
                src={opp.entity.logo_url}
                alt={opp.entity.name}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Briefcase className="h-5 w-5 text-white/40" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight truncate" style={{ color: '#F5F3ED' }}>
                {opp.title}
              </p>
              <p className="text-xs text-white/50 truncate">{opp.entity?.name}</p>
            </div>
          </div>
          {matchScores[opp.id] && (
            <div className="flex-shrink-0">
              <OpportunityMatchScore score={matchScores[opp.id]} />
            </div>
          )}
        </div>

        {/* Description */}
        {opp.description && (
          <p className="text-xs text-white/50 line-clamp-2">{opp.description}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-1.5 text-xs text-white/40">
          <Badge variant="outline" className="border-white/15 text-white/50 text-[10px]">
            {opp.type.replace(/_/g, ' ')}
          </Badge>
          {opp.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />{opp.location}
            </span>
          )}
          {opp.remote_ok && (
            <Badge variant="secondary" className="text-[10px] bg-white/10 text-white/60">
              {t('studio.remoteOk')}
            </Badge>
          )}
          {opp.budget_range && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-2.5 w-2.5" />{opp.budget_range}
            </span>
          )}
          {opp.min_supporters ? (
            <span className="flex items-center gap-1">
              <Users className="h-2.5 w-2.5" />{opp.min_supporters}+
            </span>
          ) : null}
        </div>

        {opp.application_deadline && (
          <p className="text-[10px] text-white/35 flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" />
            {t('studio.deadline')}: {format(new Date(opp.application_deadline), 'MMM d, yyyy')}
          </p>
        )}

        {/* CTA */}
        <div className="pt-1 mt-auto">
          {hasApplied(opp.id) ? (
            <button disabled className="w-full text-xs py-2 px-3 rounded-lg bg-white/5 text-white/40 flex items-center justify-center gap-1.5 cursor-not-allowed">
              <CheckCircle className="h-3 w-3" />
              {t('studio.applied')}
            </button>
          ) : (
            <button
              onClick={() => setSelectedOpportunity(opp)}
              className="w-full text-xs py-2 px-3 rounded-lg font-semibold transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(232,191,26,0.15), rgba(232,191,26,0.08))',
                border: '1px solid rgba(232,191,26,0.3)',
                color: '#E8BF1A',
              }}
            >
              <span className="card-cta">{t('studio.applyNow')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Netflix row renderer
  const NetflixRow = ({
    title,
    items,
    sectionRef,
  }: {
    title: string;
    items: any[];
    sectionRef?: React.RefObject<HTMLDivElement>;
  }) => {
    if (items.length === 0) return null;
    return (
      <section ref={sectionRef} className="space-y-3 group relative will-change-transform">
        <div className="absolute inset-0 rounded-2xl transition-colors duration-500 group-hover:bg-black/5 pointer-events-none" />
        <h2 className="section-title-3d label-premium text-lg font-bold px-1">{title}</h2>
        <div className="netflix-row pb-4">
          {items.map(opp => (
            <OpportunityCard key={opp.id} opp={opp} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-background flex pt-16">
      <StudioSidebar />

      <main
        ref={mainRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-auto-hide pb-28 md:pb-8 opportunities-bg"
      >
        {/* Sticky Back Button */}
        <div className="sticky top-0 z-40 backdrop-blur-md border-b py-3 px-4 md:px-8"
          style={{ background: 'rgba(13,13,15,0.85)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
        </div>

        <div className="relative z-10 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold flex items-center gap-3 section-title-3d label-premium">
                <Briefcase className="h-8 w-8" style={{ color: '#E8BF1A' }} />
                {t('studio.opportunities')}
              </h1>
              <p className="mt-1" style={{ color: 'rgba(245,243,237,0.5)' }}>
                {t('studio.opportunitiesDescription')}
              </p>
            </div>

            <Tabs defaultValue="browse" className="space-y-6">
              <ScrollableTabsList sticky={false}>
                <TabsList className="w-full justify-start bg-transparent border-b rounded-none p-0 h-auto gap-0 min-w-max md:min-w-0"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
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
              <TabsContent value="browse" className="space-y-8">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(245,243,237,0.35)' }} />
                    <Input
                      placeholder={t('studio.searchOpportunities')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#F5F3ED' }}
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger
                      className="w-full sm:w-48"
                      aria-label={t('common.filter') + ' ' + t('common.type')}
                      style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#F5F3ED' }}
                    >
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      {opportunityTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Content */}
                {loadingOpportunities ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#E8BF1A' }} />
                  </div>
                ) : sortedOpportunities.length === 0 ? (
                  <div className="opp-card p-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4" style={{ color: 'rgba(245,243,237,0.2)' }} />
                    <h3 className="font-semibold mb-2" style={{ color: '#F5F3ED' }}>{t('studio.noOpportunitiesFound')}</h3>
                    <p style={{ color: 'rgba(245,243,237,0.4)' }}>
                      {searchQuery || typeFilter !== "all"
                        ? t('studio.tryAdjustingFilters')
                        : t('studio.checkBackSoon')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <NetflixRow
                      title={t('studio.recommended') || 'Recommended for You'}
                      items={grouped.recommended}
                    />
                    <NetflixRow
                      title={t('opportunityTypes.liveEvent') || 'Live Events & Festivals'}
                      items={grouped.liveEvents}
                      sectionRef={section1Ref}
                    />
                    <NetflixRow
                      title={t('opportunityTypes.brandDeal') || 'Brand Deals & Sponsorships'}
                      items={grouped.brandDeals}
                      sectionRef={section2Ref}
                    />
                    <NetflixRow
                      title={t('opportunityTypes.partnership') || 'Partnerships'}
                      items={grouped.partnerships}
                      sectionRef={section3Ref}
                    />
                  </div>
                )}
              </TabsContent>

              {/* Applications Tab */}
              <TabsContent value="applications" className="space-y-4">
                {loadingApplications ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#E8BF1A' }} />
                  </div>
                ) : myApplications.length === 0 ? (
                  <div className="opp-card p-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4" style={{ color: 'rgba(245,243,237,0.2)' }} />
                    <h3 className="font-semibold mb-2" style={{ color: '#F5F3ED' }}>{t('studio.noApplicationsYet')}</h3>
                    <p className="mb-4" style={{ color: 'rgba(245,243,237,0.4)' }}>
                      {t('studio.startApplyingToSee')}
                    </p>
                    <Button variant="outline" onClick={() => document.querySelector('[value="browse"]')?.dispatchEvent(new Event('click'))}>
                      {t('studio.browseOpportunities')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myApplications.map((app) => (
                      <div key={app.id} className="opp-card p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {app.opportunity?.entity?.logo_url ? (
                              <img
                                src={app.opportunity.entity.logo_url}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-white/40" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm" style={{ color: '#F5F3ED' }}>{app.opportunity?.title}</p>
                              <p className="text-xs" style={{ color: 'rgba(245,243,237,0.4)' }}>
                                {app.opportunity?.entity?.name} • {t('studio.appliedOn')} {format(new Date(app.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(app.status)}
                        </div>
                        {app.message && (
                          <p className="mt-3 text-xs line-clamp-2" style={{ color: 'rgba(245,243,237,0.35)' }}>
                            "{app.message}"
                          </p>
                        )}
                      </div>
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
