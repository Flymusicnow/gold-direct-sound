import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Shield, Sparkles, Rocket, Radio, Loader2, ChevronDown, ExternalLink, Info, Users, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  updated_at: string;
  enabled_for_artists: string[];
  config: Record<string, unknown>;
  requires_legal_approval: boolean;
  requires_payment_setup: boolean;
}

interface ArtistOption {
  id: string;
  artist_name: string;
}

const flagIcons: Record<string, React.ReactNode> = {
  'TRUST_LAYER_ENABLED': <Shield className="h-5 w-5 text-primary" />,
  'SOCIAL_RITUALS_ENABLED': <Sparkles className="h-5 w-5 text-primary" />,
  'REACH_ECONOMY_ENABLED': <Rocket className="h-5 w-5 text-primary" />,
  'LIVE_OS_V2_ENABLED': <Radio className="h-5 w-5 text-primary" />,
  'COMMUNITY_FEED': <Users className="h-5 w-5 text-primary" />,
  'SUBSCRIPTION_TIERS': <Settings2 className="h-5 w-5 text-primary" />,
  'SPOTLIGHT_CAROUSEL': <Sparkles className="h-5 w-5 text-primary" />,
};

const AdminFeatures: React.FC = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedFlags, setExpandedFlags] = useState<Set<string>>(new Set());
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [configText, setConfigText] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, profile, navigate]);

  const fetchData = async () => {
    try {
      const [flagsRes, artistsRes] = await Promise.all([
        supabase.from('feature_flags').select('*').order('created_at', { ascending: true }),
        supabase.from('artist_profiles').select('id, artist_name').eq('status', 'approved').order('artist_name')
      ]);

      if (flagsRes.error) throw flagsRes.error;
      
      const transformedFlags: FeatureFlag[] = (flagsRes.data || []).map(f => ({
        ...f,
        enabled_for_artists: f.enabled_for_artists || [],
        config: (f.config as Record<string, unknown>) || {},
        requires_legal_approval: f.requires_legal_approval || false,
        requires_payment_setup: f.requires_payment_setup || false
      }));
      
      setFlags(transformedFlags);
      setArtists(artistsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const toggleArtistAccess = async (flag: FeatureFlag, artistId: string) => {
    const currentList = flag.enabled_for_artists || [];
    const newList = currentList.includes(artistId)
      ? currentList.filter(id => id !== artistId)
      : [...currentList, artistId];

    setUpdating(flag.id);
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled_for_artists: newList })
        .eq('id', flag.id);

      if (error) throw error;

      setFlags(prev => prev.map(f => 
        f.id === flag.id ? { ...f, enabled_for_artists: newList } : f
      ));
      
      toast.success('Artist access updated');
    } catch (error) {
      console.error('Error updating artist access:', error);
      toast.error(t('admin.updateError'));
    } finally {
      setUpdating(null);
    }
  };

  const saveConfig = async (flag: FeatureFlag) => {
    try {
      const parsedConfig = JSON.parse(configText);
      
      const { error } = await supabase
        .from('feature_flags')
        .update({ config: parsedConfig })
        .eq('id', flag.id);

      if (error) throw error;

      setFlags(prev => prev.map(f => 
        f.id === flag.id ? { ...f, config: parsedConfig } : f
      ));
      
      setEditingConfig(null);
      toast.success('Config saved');
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error(error.message?.includes('JSON') ? 'Invalid JSON format' : 'Failed to save config');
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
      <AdminLayout title="Feature Flags" description="Control which features are enabled">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Feature Flags" description="Control which features are enabled">
      <div className="space-y-4">
        {flags.map((flag) => {
          const docs = getFlagDocumentation(flag.flag_key);
          const isExpanded = expandedFlags.has(flag.id);
          const enabledArtistCount = flag.enabled_for_artists?.length || 0;

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
                  
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant={flag.is_enabled ? 'default' : 'secondary'}>
                      {flag.is_enabled ? t('common.active') : t('common.inactive')}
                    </Badge>
                    {enabledArtistCount > 0 && !flag.is_enabled && (
                      <Badge variant="outline" className="text-xs">
                        {enabledArtistCount} artists enabled
                      </Badge>
                    )}
                    {flag.requires_legal_approval && (
                      <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">
                        Legal Required
                      </Badge>
                    )}
                    {flag.requires_payment_setup && (
                      <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                        Payment Required
                      </Badge>
                    )}
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                        <Info className="h-3 w-3" />
                        {t('common.viewMore')}
                        <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-6">
                      {/* Artist Allowlist */}
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          Artist Allowlist (Beta Access)
                        </h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          When global toggle is OFF, only these artists have access:
                        </p>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-muted/20 rounded-lg">
                          {artists.map(artist => {
                            const isEnabled = flag.enabled_for_artists?.includes(artist.id);
                            return (
                              <Badge
                                key={artist.id}
                                variant={isEnabled ? 'default' : 'outline'}
                                className="cursor-pointer transition-colors hover:bg-primary/80"
                                onClick={() => toggleArtistAccess(flag, artist.id)}
                              >
                                {artist.artist_name}
                              </Badge>
                            );
                          })}
                          {artists.length === 0 && (
                            <p className="text-xs text-muted-foreground">No approved artists found</p>
                          )}
                        </div>
                      </div>

                      {/* Config JSON */}
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <Settings2 className="h-4 w-4 text-primary" />
                          Configuration (JSON)
                        </h4>
                        {editingConfig === flag.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={configText}
                              onChange={(e) => setConfigText(e.target.value)}
                              className="font-mono text-xs h-32"
                              placeholder="{}"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => saveConfig(flag)}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingConfig(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="bg-muted/30 rounded p-3 font-mono text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setConfigText(JSON.stringify(flag.config, null, 2));
                              setEditingConfig(flag.id);
                            }}
                          >
                            <pre className="whitespace-pre-wrap break-all">
                              {JSON.stringify(flag.config, null, 2) || '{}'}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* Documentation */}
                      {docs && (
                        <>
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
                        </>
                      )}
                    </div>
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
    </AdminLayout>
  );
};

export default AdminFeatures;