import { useState } from "react";
import { Send, Users, User, Megaphone, Rocket, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NOTIFICATION_TYPES = [
  { value: "admin_update", label: "Admin Update", icon: Megaphone, description: "General platform announcement" },
  { value: "release_note", label: "Release Note", icon: Rocket, description: "New feature or update release" },
];

const SEVERITY_OPTIONS = [
  { value: "info", label: "Info", description: "Standard notification" },
  { value: "important", label: "Important", description: "Highlighted notification" },
];

export function SendNotificationDialog({ open, onOpenChange }: SendNotificationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "admin_update",
    title: "",
    message: "",
    targetMode: "all_artists" as "all_artists" | "specific_users",
    targetUserIds: "",
    link: "",
    severity: "info",
  });

  const resetForm = () => {
    setFormData({
      type: "admin_update",
      title: "",
      message: "",
      targetMode: "all_artists",
      targetUserIds: "",
      link: "",
      severity: "info",
    });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    setLoading(true);
    try {
      let targetUserIds: string[] | null = null;
      let targetRole: string | null = null;

      if (formData.targetMode === "specific_users") {
        targetUserIds = formData.targetUserIds
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id.length > 0);
        if (targetUserIds.length === 0) {
          toast.error("Please enter at least one user ID");
          setLoading(false);
          return;
        }
      } else {
        targetRole = "artist";
      }

      const { data, error } = await supabase.rpc("send_admin_notification", {
        p_type: formData.type,
        p_title: formData.title,
        p_message: formData.message,
        p_target_user_ids: targetUserIds,
        p_target_role: targetRole,
        p_link: formData.link || null,
        p_severity: formData.severity,
      });

      if (error) throw error;

      toast.success(`Notification sent to ${data} user(s)`);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to send notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  const selectedType = NOTIFICATION_TYPES.find((t) => t.value === formData.type);
  const TypeIcon = selectedType?.icon || Megaphone;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Notification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type Selection */}
          <div>
            <Label>Notification Type</Label>
            <Select
              value={formData.type}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{selectedType?.description}</p>
          </div>

          {/* Title */}
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Notification title"
            />
          </div>

          {/* Message */}
          <div>
            <Label>Message *</Label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Notification message..."
              rows={3}
            />
          </div>

          {/* Target Selection */}
          <div>
            <Label className="mb-2 block">Target Audience</Label>
            <RadioGroup
              value={formData.targetMode}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, targetMode: v as typeof formData.targetMode }))
              }
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all_artists" id="all_artists" />
                <Label htmlFor="all_artists" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  All Artists
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific_users" id="specific_users" />
                <Label htmlFor="specific_users" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Specific Users
                </Label>
              </div>
            </RadioGroup>

            {formData.targetMode === "specific_users" && (
              <div className="mt-2">
                <Input
                  value={formData.targetUserIds}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetUserIds: e.target.value }))}
                  placeholder="User IDs (comma-separated)"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter user IDs separated by commas
                </p>
              </div>
            )}
          </div>

          {/* Severity */}
          <div>
            <Label>Severity</Label>
            <Select
              value={formData.severity}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, severity: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      {opt.value === "important" && <AlertCircle className="h-4 w-4 text-orange-500" />}
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Link (optional) */}
          <div>
            <Label>Link (optional)</Label>
            <Input
              value={formData.link}
              onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
              placeholder="/studio/dashboard or https://..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Sending..." : "Send Notification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
