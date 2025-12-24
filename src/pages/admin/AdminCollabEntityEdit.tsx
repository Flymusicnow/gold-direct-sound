import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, X, Plus, Trash2, Pencil, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { OpportunityDialog } from '@/components/admin/OpportunityDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { IconImageUploader } from '@/components/admin/IconImageUploader';

const getCollabTypes = (t: (key: string) => string) => [
  { value: 'festival_slot', label: t('admin.collabTypeFestivalSlot') },
  { value: 'brand_deal', label: t('admin.collabTypeBrandDeal') },
  { value: 'ugc_content', label: t('admin.collabTypeUgcContent') },
  { value: 'sponsorship', label: t('admin.collabTypeSponsorship') },
  { value: 'live_event', label: t('admin.collabTypeLiveEvent') },
  { value: 'partnership', label: t('admin.collabTypePartnership') },
];

const STYLE_SUGGESTIONS = [
  'Electronic', 'Hip-Hop', 'Pop', 'Rock', 'R&B', 'Indie', 'Alternative', 
  'Dance', 'House', 'Techno', 'Acoustic', 'Jazz', 'Soul', 'Latin', 'Afrobeat'
];

interface FormData {
  type: string;
  name: string;
  slug: string;
  logo_url: string;
  description: string;
  website: string;
  location: string;
  mission: string;
  social_links: Record<string, string>;
  style_tags: string[];
  collab_types: string[];
  budget_range: string;
  brand_values: string;
  avoid_categories: string;
  is_active: boolean;
}

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
}

export default function AdminCollabEntityEdit() {
  const { id } = useParams();
  const isNew = id === 'new';
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // Opportunity states
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);
  const [opportunityDialogOpen, setOpportunityDialogOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [savingOpportunity, setSavingOpportunity] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    type: 'brand',
    name: '',
    slug: '',
    logo_url: '',
    description: '',
    website: '',
    location: '',
    mission: '',
    social_links: {},
    style_tags: [],
    collab_types: [],
    budget_range: 'medium',
    brand_values: '',
    avoid_categories: '',
    is_active: true,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    if (!isNew) {
      fetchEntity();
      fetchOpportunities();
    }
  }, [user, profile, navigate, id, isNew]);

  const fetchEntity = async () => {
    try {
      const { data, error } = await supabase
        .from('collab_entities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          type: data.type,
          name: data.name,
          slug: data.slug,
          logo_url: data.logo_url || '',
          description: data.description || '',
          website: data.website || '',
          location: data.location || '',
          mission: data.mission || '',
          social_links: (data.social_links as Record<string, string>) || {},
          style_tags: data.style_tags || [],
          collab_types: data.collab_types || [],
          budget_range: data.budget_range || 'medium',
          brand_values: data.brand_values || '',
          avoid_categories: data.avoid_categories || '',
          is_active: data.is_active ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching entity:', error);
      toast.error(t('errors.loadFailed'));
      navigate('/admin/collab-entities');
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = async () => {
    if (!id || isNew) return;
    setLoadingOpportunities(true);
    try {
      const { data, error } = await supabase
        .from('collab_opportunities')
        .select('*')
        .eq('collab_entity_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoadingOpportunities(false);
    }
  };

  const handleSaveOpportunity = async (oppData: any) => {
    setSavingOpportunity(true);
    try {
      const payload = {
        collab_entity_id: id,
        title: oppData.title,
        type: oppData.type,
        description: oppData.description || null,
        location: oppData.location || null,
        budget_range: oppData.budget_range || null,
        application_deadline: oppData.application_deadline 
          ? new Date(oppData.application_deadline).toISOString() 
          : null,
        remote_ok: oppData.remote_ok,
        min_supporters: oppData.min_supporters || 0,
        is_active: oppData.is_active,
      };

      if (oppData.id) {
        // Update existing
        const { error } = await supabase
          .from('collab_opportunities')
          .update(payload)
          .eq('id', oppData.id);
        if (error) throw error;
        toast.success(t('admin.opportunityUpdated'));
      } else {
        // Create new
        const { error } = await supabase
          .from('collab_opportunities')
          .insert(payload);
        if (error) throw error;
        toast.success(t('admin.opportunityCreated'));
      }

      setOpportunityDialogOpen(false);
      setEditingOpportunity(null);
      fetchOpportunities();
    } catch (error) {
      console.error('Error saving opportunity:', error);
      toast.error(t('errors.saveFailed'));
    } finally {
      setSavingOpportunity(false);
    }
  };

  const handleDeleteOpportunity = async (oppId: string) => {
    try {
      const { error } = await supabase
        .from('collab_opportunities')
        .delete()
        .eq('id', oppId);
      if (error) throw error;
      toast.success(t('admin.opportunityDeleted'));
      fetchOpportunities();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      toast.error(t('errors.deleteFailed'));
    }
  };

  const handleToggleOpportunityActive = async (opp: Opportunity) => {
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

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: isNew ? generateSlug(name) : prev.slug,
    }));
  };

  const addStyleTag = (tag: string) => {
    if (tag && !formData.style_tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        style_tags: [...prev.style_tags, tag],
      }));
    }
    setNewTag('');
  };

  const removeStyleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      style_tags: prev.style_tags.filter(t => t !== tag),
    }));
  };

  const toggleCollabType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      collab_types: prev.collab_types.includes(type)
        ? prev.collab_types.filter(t => t !== type)
        : [...prev.collab_types, type],
    }));
  };

  const handleSocialLinkChange = (platform: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: url },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug || !formData.type) {
      toast.error(t('admin.fillRequiredFields'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: formData.type,
        name: formData.name,
        slug: formData.slug,
        logo_url: formData.logo_url || null,
        description: formData.description || null,
        website: formData.website || null,
        location: formData.location || null,
        mission: formData.mission || null,
        social_links: formData.social_links,
        style_tags: formData.style_tags,
        collab_types: formData.collab_types,
        budget_range: formData.budget_range || null,
        brand_values: formData.brand_values || null,
        avoid_categories: formData.avoid_categories || null,
        is_active: formData.is_active,
      };

      if (isNew) {
        const { error } = await supabase
          .from('collab_entities')
          .insert(payload);
        if (error) throw error;
        toast.success(t('admin.entityCreated'));
      } else {
        const { error } = await supabase
          .from('collab_entities')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
        toast.success(t('admin.entityUpdated'));
      }

      navigate('/admin/collab-entities');
    } catch (error: any) {
      console.error('Error saving entity:', error);
      if (error.code === '23505') {
        toast.error(t('admin.slugExists'));
      } else {
        toast.error(t('admin.entitySaveFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/collab-entities')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {isNew ? t('admin.createEntityTitle') : t('admin.editEntityTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNew ? t('admin.createEntityDescription') : formData.name}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.basicInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">{t('admin.entityType')} *</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brand">{t('entityTypes.brand')}</SelectItem>
                      <SelectItem value="festival">{t('entityTypes.festival')}</SelectItem>
                      <SelectItem value="sponsor">{t('entityTypes.sponsor')}</SelectItem>
                      <SelectItem value="event_agency">{t('entityTypes.eventAgency')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_range">{t('admin.budgetRange')}</Label>
                  <Select value={formData.budget_range} onValueChange={(v) => setFormData(prev => ({ ...prev, budget_range: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('admin.budgetLow')}</SelectItem>
                      <SelectItem value="medium">{t('admin.budgetMedium')}</SelectItem>
                      <SelectItem value="high">{t('admin.budgetHigh')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('admin.entityName')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t('admin.enterEntityName')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">{t('admin.entitySlug')} *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder={t('admin.urlFriendlySlug')}
                />
                <p className="text-xs text-muted-foreground">URL: /partners/{formData.slug || 'slug'}</p>
              </div>

              <div className="space-y-2">
                <Label>{t('admin.logoUrl')}</Label>
                <div className="flex items-start gap-4">
                  <IconImageUploader
                    currentUrl={formData.logo_url}
                    onUpload={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
                    storagePath={`entities/${formData.slug || 'new'}`}
                  />
                  <div className="flex-1 space-y-2">
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                      placeholder="https://... or upload →"
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Upload an image or paste a URL</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">{t('common.active')}</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.entityDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">{t('admin.website')}</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">{t('admin.location')}</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={t('admin.locationPlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mission">{t('admin.mission')}</Label>
                <Textarea
                  id="mission"
                  value={formData.mission}
                  onChange={(e) => setFormData(prev => ({ ...prev, mission: e.target.value }))}
                  placeholder={t('admin.missionPlaceholder')}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('common.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('admin.detailedDescription')}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand_values">{t('admin.brandValues')}</Label>
                <Textarea
                  id="brand_values"
                  value={formData.brand_values}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand_values: e.target.value }))}
                  placeholder={t('admin.coreValues')}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avoid_categories">{t('admin.avoidCategories')}</Label>
                <Input
                  id="avoid_categories"
                  value={formData.avoid_categories}
                  onChange={(e) => setFormData(prev => ({ ...prev, avoid_categories: e.target.value }))}
                  placeholder={t('admin.avoidCategoriesPlaceholder')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Style Tags */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.styleTags')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.style_tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => removeStyleTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder={t('admin.addCustomTag')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addStyleTag(newTag);
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={() => addStyleTag(newTag)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {STYLE_SUGGESTIONS.filter(s => !formData.style_tags.includes(s)).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => addStyleTag(tag)}
                  >
                    + {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Collab Types */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.collaborationTypes')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {getCollabTypes(t).map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => toggleCollabType(type.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      formData.collab_types.includes(type.value)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.socialLinks')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {['instagram', 'tiktok', 'twitter', 'youtube', 'linkedin'].map((platform) => (
                <div key={platform} className="space-y-2">
                  <Label htmlFor={platform} className="capitalize">{platform}</Label>
                  <Input
                    id={platform}
                    value={formData.social_links[platform] || ''}
                    onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                    placeholder={`https://${platform}.com/...`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/collab-entities')}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              {saving ? t('common.saving') : (isNew ? t('admin.createEntity') : t('common.save'))}
            </Button>
          </div>
        </form>

        {/* Opportunities Section - only for existing entities */}
        {!isNew && (
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('admin.opportunities')}</CardTitle>
                <CardDescription>{t('admin.opportunitiesDescription')}</CardDescription>
              </div>
              <Button 
                onClick={() => {
                  setEditingOpportunity(null);
                  setOpportunityDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('admin.createOpportunity')}
              </Button>
            </CardHeader>
            <CardContent>
              {loadingOpportunities ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : opportunities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('admin.noOpportunities')}</p>
                  <p className="text-sm mt-1">{t('admin.createFirstOpportunity')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {opportunities.map((opp) => (
                    <div 
                      key={opp.id} 
                      className="flex items-center justify-between p-4 border rounded-lg bg-card"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{opp.title}</h4>
                          <Badge variant={opp.is_active ? 'default' : 'secondary'}>
                            {opp.is_active ? t('common.active') : t('common.inactive')}
                          </Badge>
                          <Badge variant="outline">{opp.type.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {opp.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {opp.location}
                            </span>
                          )}
                          {opp.application_deadline && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(opp.application_deadline).toLocaleDateString()}
                            </span>
                          )}
                          {opp.budget_range && (
                            <span className="capitalize">{opp.budget_range} {t('admin.budget')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleOpportunityActive(opp)}
                        >
                          {opp.is_active ? t('admin.pause') : t('admin.activate')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingOpportunity(opp);
                            setOpportunityDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('admin.deleteOpportunity')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('admin.deleteOpportunityConfirm')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteOpportunity(opp.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t('common.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <OpportunityDialog
          open={opportunityDialogOpen}
          onOpenChange={setOpportunityDialogOpen}
          opportunity={editingOpportunity}
          onSave={handleSaveOpportunity}
          saving={savingOpportunity}
        />
      </div>
    </div>
  );
}
