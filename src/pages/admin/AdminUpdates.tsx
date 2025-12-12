import { useState } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Eye, EyeOff, Users, Shield, Megaphone, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { usePlatformUpdates, PlatformUpdate } from "@/hooks/usePlatformUpdates";
import { useAdminActivityLog } from "@/hooks/useAdminActivityLog";
import { cn } from "@/lib/utils";

const priorityConfig = {
  critical: { icon: AlertTriangle, color: "text-destructive", label: "Critical" },
  high: { icon: AlertCircle, color: "text-orange-500", label: "High" },
  normal: { icon: Megaphone, color: "text-primary", label: "Normal" },
  low: { icon: Info, color: "text-muted-foreground", label: "Low" }
};

const roleOptions = [
  { value: 'admin', label: 'Admin', icon: Shield },
  { value: 'artist', label: 'Artist', icon: Users },
  { value: 'fan', label: 'Fan', icon: Users }
];

export default function AdminUpdates() {
  const { updates, loading, createUpdate, updateUpdate, deleteUpdate, refetch } = usePlatformUpdates();
  const { logActivity } = useAdminActivityLog();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<PlatformUpdate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_roles: ['admin', 'artist', 'fan'] as string[],
    visibility: 'public' as 'public' | 'admin_only',
    priority: 'normal' as string,
    link_url: '',
    link_text: '',
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      target_roles: ['admin', 'artist', 'fan'],
      visibility: 'public',
      priority: 'normal',
      link_url: '',
      link_text: '',
      is_active: true
    });
    setEditingUpdate(null);
  };

  const handleOpenDialog = (update?: PlatformUpdate) => {
    if (update) {
      setEditingUpdate(update);
      setFormData({
        title: update.title,
        content: update.content,
        target_roles: update.target_roles,
        visibility: update.visibility as 'public' | 'admin_only',
        priority: update.priority || 'normal',
        link_url: update.link_url || '',
        link_text: update.link_text || '',
        is_active: update.is_active
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      if (editingUpdate) {
        await updateUpdate(editingUpdate.id, formData);
        await logActivity('update_platform_update', 'platform_update', editingUpdate.id, { title: formData.title });
        toast.success('Update saved');
      } else {
        await createUpdate(formData);
        await logActivity('create_platform_update', 'platform_update', undefined, { title: formData.title });
        toast.success('Update created');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save update:', error);
      toast.error('Failed to save update');
    }
  };

  const handleDelete = async (update: PlatformUpdate) => {
    if (!confirm('Are you sure you want to delete this update?')) return;
    
    try {
      await deleteUpdate(update.id);
      await logActivity('delete_platform_update', 'platform_update', update.id, { title: update.title });
      toast.success('Update deleted');
    } catch (error) {
      console.error('Failed to delete update:', error);
      toast.error('Failed to delete update');
    }
  };

  const handleToggleActive = async (update: PlatformUpdate) => {
    try {
      await updateUpdate(update.id, { is_active: !update.is_active });
      await logActivity('toggle_platform_update', 'platform_update', update.id, { is_active: !update.is_active });
      toast.success(update.is_active ? 'Update hidden' : 'Update visible');
    } catch (error) {
      console.error('Failed to toggle update:', error);
      toast.error('Failed to update');
    }
  };

  const handleRoleToggle = (role: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      target_roles: checked 
        ? [...prev.target_roles, role]
        : prev.target_roles.filter(r => r !== role)
    }));
  };

  return (
    <AdminLayout title="Platform Updates" description="Manage announcements and updates for users">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">{updates.length} Updates</h2>
            <p className="text-sm text-muted-foreground">
              Role-filtered announcements for admin, artists, and fans
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                New Update
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingUpdate ? 'Edit Update' : 'Create Update'}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Update title"
                  />
                </div>
                
                <div>
                  <Label>Content *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Update content..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Target Roles</Label>
                  <div className="flex gap-4">
                    {roleOptions.map(role => (
                      <div key={role.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`role-${role.value}`}
                          checked={formData.target_roles.includes(role.value)}
                          onCheckedChange={(checked) => handleRoleToggle(role.value, !!checked)}
                        />
                        <Label htmlFor={`role-${role.value}`} className="text-sm cursor-pointer">
                          {role.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Visibility</Label>
                    <Select
                      value={formData.visibility}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, visibility: v as 'public' | 'admin_only' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="admin_only">Admin Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Link URL (optional)</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                
                <div>
                  <Label>Link Text (optional)</Label>
                  <Input
                    value={formData.link_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_text: e.target.value }))}
                    placeholder="Learn more"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active (visible to users)</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>{editingUpdate ? 'Save Changes' : 'Create Update'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : updates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No updates yet</p>
                <p className="text-sm">Create your first platform update</p>
              </CardContent>
            </Card>
          ) : (
            updates.map(update => {
              const priority = priorityConfig[update.priority as keyof typeof priorityConfig] || priorityConfig.normal;
              const PriorityIcon = priority.icon;
              
              return (
                <Card key={update.id} className={cn(!update.is_active && "opacity-60")}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <PriorityIcon className={cn("h-5 w-5 mt-0.5", priority.color)} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{update.title}</h3>
                          <Badge variant="outline" className="text-xs">{priority.label}</Badge>
                          {update.visibility === 'admin_only' && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin Only
                            </Badge>
                          )}
                          {!update.is_active && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Hidden</Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{update.content}</p>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            Targets: {update.target_roles.join(', ')}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(update.published_at), 'PPP')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleActive(update)}
                        >
                          {update.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDialog(update)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(update)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
