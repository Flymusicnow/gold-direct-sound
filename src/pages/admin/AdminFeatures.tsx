import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Sparkles, Rocket, Radio, Loader2 } from 'lucide-react';
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
  const navigate = useNavigate();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

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
      toast.error('Kunde inte hämta feature flags');
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
      
      toast.success(`${flag.flag_name} är nu ${!flag.is_enabled ? 'aktiverad' : 'avaktiverad'}`);
    } catch (error) {
      console.error('Error toggling flag:', error);
      toast.error('Kunde inte uppdatera feature flag');
    } finally {
      setUpdating(null);
    }
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
          Tillbaka till Admin
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Feature Flags</h1>
          <p className="text-muted-foreground">
            Kontrollera vilka funktioner som är aktiverade på plattformen
          </p>
        </div>

        <div className="space-y-4">
          {flags.map((flag) => (
            <Card key={flag.id} className="border-border/50">
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
                <CardDescription>{flag.description}</CardDescription>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={flag.is_enabled ? 'default' : 'secondary'}>
                    {flag.is_enabled ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {flags.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Inga feature flags hittades</p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNavBarAdmin />
    </div>
  );
};

export default AdminFeatures;
