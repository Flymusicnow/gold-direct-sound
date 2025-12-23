import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';

const getOpportunityTypes = (t: (key: string) => string) => [
  { value: 'festival_slot', label: t('opportunityTypes.festivalSlot') },
  { value: 'live_event', label: t('opportunityTypes.liveEvent') },
  { value: 'brand_campaign', label: t('opportunityTypes.brandCampaign') },
  { value: 'sponsored_content', label: t('opportunityTypes.sponsoredContent') },
  { value: 'ugc_content', label: t('opportunityTypes.ugcContent') },
  { value: 'residency', label: t('opportunityTypes.residency') },
  { value: 'partnership', label: t('opportunityTypes.partnership') },
];

interface OpportunityFormData {
  id?: string;
  title: string;
  type: string;
  description: string;
  location: string;
  budget_range: string;
  application_deadline: string;
  remote_ok: boolean;
  min_supporters: number;
  is_active: boolean;
}

interface OpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: OpportunityFormData | null;
  onSave: (data: OpportunityFormData) => Promise<void>;
  saving: boolean;
}

export function OpportunityDialog({ 
  open, 
  onOpenChange, 
  opportunity, 
  onSave,
  saving 
}: OpportunityDialogProps) {
  const { t } = useLanguage();
  const isEditing = !!opportunity?.id;

  const [formData, setFormData] = useState<OpportunityFormData>({
    title: '',
    type: 'festival_slot',
    description: '',
    location: '',
    budget_range: 'medium',
    application_deadline: '',
    remote_ok: false,
    min_supporters: 0,
    is_active: true,
  });

  useEffect(() => {
    if (opportunity) {
      setFormData({
        id: opportunity.id,
        title: opportunity.title || '',
        type: opportunity.type || 'festival_slot',
        description: opportunity.description || '',
        location: opportunity.location || '',
        budget_range: opportunity.budget_range || 'medium',
        application_deadline: opportunity.application_deadline 
          ? opportunity.application_deadline.split('T')[0] 
          : '',
        remote_ok: opportunity.remote_ok || false,
        min_supporters: opportunity.min_supporters || 0,
        is_active: opportunity.is_active ?? true,
      });
    } else {
      setFormData({
        title: '',
        type: 'festival_slot',
        description: '',
        location: '',
        budget_range: 'medium',
        application_deadline: '',
        remote_ok: false,
        min_supporters: 0,
        is_active: true,
      });
    }
  }, [opportunity, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('admin.editOpportunity') : t('admin.createOpportunity')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="opp-title">{t('common.title')} *</Label>
            <Input
              id="opp-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('admin.opportunityTitlePlaceholder')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opp-type">{t('common.type')} *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getOpportunityTypes(t).map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opp-budget">{t('admin.budgetRange')}</Label>
              <Select 
                value={formData.budget_range} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, budget_range: v }))}
              >
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
            <Label htmlFor="opp-description">{t('common.description')}</Label>
            <Textarea
              id="opp-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('admin.opportunityDescriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opp-location">{t('admin.location')}</Label>
              <Input
                id="opp-location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder={t('admin.locationPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="opp-deadline">{t('admin.applicationDeadline')}</Label>
              <Input
                id="opp-deadline"
                type="date"
                value={formData.application_deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, application_deadline: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opp-min-supporters">{t('admin.minSupporters')}</Label>
              <Input
                id="opp-min-supporters"
                type="number"
                min={0}
                value={formData.min_supporters}
                onChange={(e) => setFormData(prev => ({ ...prev, min_supporters: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="flex items-center justify-between pt-6">
              <Label htmlFor="opp-remote">{t('admin.remoteOk')}</Label>
              <Switch
                id="opp-remote"
                checked={formData.remote_ok}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, remote_ok: v }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="opp-active">{t('common.active')}</Label>
            <Switch
              id="opp-active"
              checked={formData.is_active}
              onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving || !formData.title}>
              {saving ? t('common.saving') : (isEditing ? t('common.save') : t('common.create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
