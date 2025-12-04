import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Shield, Sparkles, Rocket, Radio, Loader2, ChevronDown, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';
import { MobileAdminNav } from '@/components/admin/MobileAdminNav';
import { BottomNavBarAdmin } from '@/components/mobile/BottomNavBarAdmin';

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  updated_at: string;
}

const flagIcons: Record<string, React.ReactNode> = {
  'TRUST_LAYER_ENABLED': <Shield className="h-5 w-5 text-primary" />,
  'SOCIAL_RITUALS_ENABLED': <Sparkles className="h-5 w-5 text-primary" />,
  'REACH_ECONOMY_ENABLED': <Rocket className="h-5 w-5 text-primary" />,
  'LIVE_OS_V2_ENABLED': <Radio className="h-5 w-5 text-primary" />,
};

const AdminFeatures: React.FC = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedFlags, setExpandedFlags] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchFlags();
  }, [user, profile, navigate]);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Error fetching flags:', error);
      toast.error(t('admin.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flag: FeatureFlag) => {
    setUpdating(flag.id);
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: !flag.is_enabled })
        .eq('id', flag.id);

      if (error) throw error;

      setFlags(prev => prev.map(f => 
        f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f
      ));
      
      const statusText = !flag.is_enabled ? t('admin.flagEnabled') : t('admin.flagDisabled');
      toast.success(`${flag.flag_name} ${statusText}`);
    } catch (error) {
      console.error('Error toggling flag:', error);
      toast.error(t('admin.updateError'));
    } finally {
      setUpdating(null);
    }
  };

  const toggleExpanded = (flagId: string) => {
    setExpandedFlags(prev => {
      const next = new Set(prev);
      if (next.has(flagId)) {
        next.delete(flagId);
      } else {
        next.add(flagId);
      }
      return next;
    });
  };

  const getFlagDocumentation = (flagKey: string) => {
    const docs = t(`featureFlags.${flagKey}`) as any;
    if (typeof docs === 'string') return null;
    return docs;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <MobileAdminNav />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('admin.backToAdmin')}
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('admin.featureFlags')}</h1>
          <p className="text-muted-foreground">
            {t('admin.featureFlagsDescription')}
          </p>
        </div>

        <div className="space-y-4">
          {flags.map((flag) => {
            const docs = getFlagDocumentation(flag.flag_key);
            const isExpanded = expandedFlags.has(flag.id);

            return (
              <Card key={flag.id} className="border-border/50">
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(flag.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {flagIcons[flag.flag_key] || <Shield className="h-5 w-5 text-primary" />}
                        <div>
                          <CardTitle className="text-lg">{flag.flag_name}</CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs font-mono">
                            {flag.flag_key}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {updating === flag.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        <Switch
                          checked={flag.is_enabled}
                          onCheckedChange={() => toggleFlag(flag)}
                          disabled={updating === flag.id}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-3">
                      {docs?.description || flag.description}
                    </CardDescription>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={flag.is_enabled ? 'default' : 'secondary'}>
                        {flag.is_enabled ? t('common.active') : t('common.inactive')}
                      </Badge>
                      {docs && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                            <Info className="h-3 w-3" />
                            {t('common.viewMore')}
                            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>

                    <CollapsibleContent>
                      {docs && (
                        <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                              <Info className="h-4 w-4 text-primary" />
                              {t('admin.whatItEnables')}
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                              {docs.enables?.map((item: string, i: number) => (
                                <li key={i} className="list-disc">{item}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">
                              {t('admin.routesAffected')}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {docs.routes?.map((route: string, i: number) => (
                                <Badge key={i} variant="outline" className="font-mono text-xs">
                                  {route}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {docs.primaryLink && (
                            <div className="pt-2">
                              <Link to={docs.primaryLink}>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <ExternalLink className="h-3 w-3" />
                                  {docs.primaryLinkLabel || t('admin.viewPage')}
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </CollapsibleContent>
                  </CardContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>

        {flags.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{t('admin.noFlags')}</p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNavBarAdmin />
    </div>
  );
};

export default AdminFeatures;
