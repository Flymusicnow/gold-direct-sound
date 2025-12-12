import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Plus, Copy, Sparkles, Download, Zap, AlertTriangle, Clock, CheckSquare, Square, ChevronDown } from "lucide-react";
import { format, differenceInDays, addDays, parseISO } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BetaCode {
  id: string;
  code: string;
  type: string;
  badge_name: string;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

interface FormData {
  code: string;
  type: string;
  badge_name: string;
  max_uses: string;
  expires_at: string;
  notes: string;
}

interface BulkFormData {
  count: string;
  type: string;
  badge_name: string;
  max_uses: string;
  expires_at: string;
  notes: string;
}

function generateBetaCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars (0, O, 1, I)
  const code = Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `FLY-${code}`;
}

export default function AdminBetaCodes() {
  const [codes, setCodes] = useState<BetaCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    code: "",
    type: "artist",
    badge_name: "",
    max_uses: "",
    expires_at: "",
    notes: "",
  });
  const [bulkFormData, setBulkFormData] = useState<BulkFormData>({
    count: "10",
    type: "artist",
    badge_name: "",
    max_uses: "",
    expires_at: "",
    notes: "",
  });
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [extensionType, setExtensionType] = useState<'add_days' | 'set_date' | 'remove'>('add_days');
  const [extensionDays, setExtensionDays] = useState<string>("30");
  const [extensionDate, setExtensionDate] = useState<string>("");
  

  useEffect(() => {
    fetchBetaCodes();
  }, []);

  const fetchBetaCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("beta_access_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error: any) {
      console.error("Error fetching beta codes:", error);
      toast.error("Failed to load beta codes");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = () => {
    setFormData({ ...formData, code: generateBetaCode() });
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const insertData: any = {
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        badge_name: formData.badge_name.trim(),
        notes: formData.notes.trim() || null,
      };

      // Handle max_uses (null = unlimited)
      if (formData.max_uses.trim()) {
        insertData.max_uses = parseInt(formData.max_uses);
      }

      // Handle expires_at
      if (formData.expires_at.trim()) {
        insertData.expires_at = new Date(formData.expires_at).toISOString();
      }

      const { error } = await supabase
        .from("beta_access_codes")
        .insert([insertData]);

      if (error) throw error;

      toast.success("Beta code created successfully!");
      setIsDialogOpen(false);
      setFormData({
        code: "",
        type: "artist",
        badge_name: "",
        max_uses: "",
        expires_at: "",
        notes: "",
      });
      fetchBetaCodes();
    } catch (error: any) {
      console.error("Error creating beta code:", error);
      toast.error(error.message || "Failed to create beta code");
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("beta_access_codes")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      toast.success("Beta code deactivated");
      fetchBetaCodes();
    } catch (error: any) {
      console.error("Error deactivating code:", error);
      toast.error("Failed to deactivate code");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    const count = parseInt(bulkFormData.count);
    if (count < 10 || count > 50) {
      toast.error("Count must be between 10 and 50");
      return;
    }

    try {
      // Generate unique codes
      const newCodes: string[] = [];
      const existingCodes = new Set(codes.map(c => c.code));

      while (newCodes.length < count) {
        const code = generateBetaCode();
        if (!existingCodes.has(code) && !newCodes.includes(code)) {
          newCodes.push(code);
        }
      }

      // Prepare insert data
      const insertData = newCodes.map(code => {
        const data: any = {
          code: code,
          type: bulkFormData.type,
          badge_name: bulkFormData.badge_name.trim(),
          notes: bulkFormData.notes.trim() || null,
        };

        if (bulkFormData.max_uses.trim()) {
          data.max_uses = parseInt(bulkFormData.max_uses);
        }

        if (bulkFormData.expires_at.trim()) {
          data.expires_at = new Date(bulkFormData.expires_at).toISOString();
        }

        return data;
      });

      const { error } = await supabase
        .from("beta_access_codes")
        .insert(insertData);

      if (error) throw error;

      setGeneratedCodes(newCodes);
      toast.success(`${count} beta codes generated successfully!`);
      fetchBetaCodes();
    } catch (error: any) {
      console.error("Error generating bulk codes:", error);
      toast.error(error.message || "Failed to generate bulk codes");
    }
  };

  const handleExportCSV = () => {
    if (generatedCodes.length === 0) {
      toast.error("No codes to export");
      return;
    }

    // Create CSV content
    const headers = ["Code", "Type", "Badge Name", "Max Uses", "Expires At", "Notes"];
    const rows = generatedCodes.map(code => [
      code,
      bulkFormData.type,
      bulkFormData.badge_name,
      bulkFormData.max_uses || "Unlimited",
      bulkFormData.expires_at ? format(new Date(bulkFormData.expires_at), "yyyy-MM-dd HH:mm") : "Never",
      bulkFormData.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `flymusic-beta-codes-${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV exported successfully!");
  };

  const handleCloseBulkDialog = () => {
    setIsBulkDialogOpen(false);
    setGeneratedCodes([]);
    setBulkFormData({
      count: "10",
      type: "artist",
      badge_name: "",
      max_uses: "",
      expires_at: "",
      notes: "",
    });
  };

  const getUsagePercentage = (current: number, max: number | null) => {
    if (max === null) return 0;
    return (current / max) * 100;
  };

  const getExpirationStatus = (expiresAt: string | null): {
    status: 'safe' | 'warning' | 'critical' | 'expired' | 'never';
    daysRemaining: number | null;
  } => {
    if (!expiresAt) return { status: 'never', daysRemaining: null };
    
    const now = new Date();
    const expiryDate = parseISO(expiresAt);
    const days = differenceInDays(expiryDate, now);

    if (days < 0) return { status: 'expired', daysRemaining: days };
    if (days < 3) return { status: 'critical', daysRemaining: days };
    if (days < 7) return { status: 'warning', daysRemaining: days };
    return { status: 'safe', daysRemaining: days };
  };

  const handleSelectCode = (id: string) => {
    setSelectedCodes(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCodes.length === codes.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(codes.map(c => c.id));
    }
  };

  const handleBulkExtend = async () => {
    if (selectedCodes.length === 0) return;

    try {
      let newExpiresAt: string | null = null;

      if (extensionType === 'add_days') {
        const days = parseInt(extensionDays);
        // For each selected code, extend from its current expiry or now if null
        const updates = selectedCodes.map(id => {
          const code = codes.find(c => c.id === id);
          const baseDate = code?.expires_at ? parseISO(code.expires_at) : new Date();
          return {
            id,
            expires_at: addDays(baseDate, days).toISOString()
          };
        });

        // Update each code individually
        for (const update of updates) {
          const { error } = await supabase
            .from("beta_access_codes")
            .update({ expires_at: update.expires_at })
            .eq("id", update.id);
          if (error) throw error;
        }
      } else if (extensionType === 'set_date') {
        newExpiresAt = new Date(extensionDate).toISOString();
        const { error } = await supabase
          .from("beta_access_codes")
          .update({ expires_at: newExpiresAt })
          .in("id", selectedCodes);
        if (error) throw error;
      } else if (extensionType === 'remove') {
        const { error } = await supabase
          .from("beta_access_codes")
          .update({ expires_at: null })
          .in("id", selectedCodes);
        if (error) throw error;
      }

      toast.success(`Extended ${selectedCodes.length} code(s) successfully`);
      setIsExtendDialogOpen(false);
      setSelectedCodes([]);
      fetchBetaCodes();
    } catch (error: any) {
      console.error("Error extending codes:", error);
      toast.error("Failed to extend codes");
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedCodes.length === 0) return;

    try {
      const { error } = await supabase
        .from("beta_access_codes")
        .update({ is_active: false })
        .in("id", selectedCodes);

      if (error) throw error;

      toast.success(`Deactivated ${selectedCodes.length} code(s)`);
      setSelectedCodes([]);
      fetchBetaCodes();
    } catch (error: any) {
      console.error("Error deactivating codes:", error);
      toast.error("Failed to deactivate codes");
    }
  };

  const handleQuickExtend = async (id: string, days: number) => {
    try {
      const code = codes.find(c => c.id === id);
      const baseDate = code?.expires_at ? parseISO(code.expires_at) : new Date();
      const newExpiresAt = addDays(baseDate, days).toISOString();

      const { error } = await supabase
        .from("beta_access_codes")
        .update({ expires_at: newExpiresAt })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Extended by ${days} days`);
      fetchBetaCodes();
    } catch (error: any) {
      console.error("Error extending code:", error);
      toast.error("Failed to extend code");
    }
  };

  const expiringCodes = codes.filter(code => {
    const status = getExpirationStatus(code.expires_at);
    return status.status === 'warning' || status.status === 'critical' || status.status === 'expired';
  }).sort((a, b) => {
    const daysA = getExpirationStatus(a.expires_at).daysRemaining || 0;
    const daysB = getExpirationStatus(b.expires_at).daysRemaining || 0;
    return daysA - daysB;
  });

  if (loading) {
    return (
      <AdminLayout title="Beta Code Management" description="Create and manage beta access codes">
        <p className="text-muted-foreground">Loading beta codes...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Beta Code Management" description="Create and manage beta access codes">
      <div className="flex flex-col gap-6">
        {/* Header Actions */}
        <div className="flex items-center justify-end gap-2">
          <div className="flex gap-2">
            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/20">
                  <Zap className="mr-2 h-4 w-4" />
                  Bulk Generate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Bulk Generate Beta Codes</DialogTitle>
                  <DialogDescription>
                    Create multiple beta codes at once (10-50 codes)
                  </DialogDescription>
                </DialogHeader>
                {generatedCodes.length === 0 ? (
                  <form onSubmit={handleBulkGenerate} className="space-y-4">
                    {/* Count */}
                    <div className="space-y-2">
                      <Label>Number of Codes</Label>
                      <Input
                        type="number"
                        value={bulkFormData.count}
                        onChange={(e) =>
                          setBulkFormData({ ...bulkFormData, count: e.target.value })
                        }
                        placeholder="10-50"
                        min="10"
                        max="50"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Generate between 10 and 50 codes at once
                      </p>
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={bulkFormData.type}
                        onValueChange={(value) =>
                          setBulkFormData({ ...bulkFormData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="artist">Artist</SelectItem>
                          <SelectItem value="fan">Fan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Badge Name */}
                    <div className="space-y-2">
                      <Label>Badge Name</Label>
                      <Input
                        value={bulkFormData.badge_name}
                        onChange={(e) =>
                          setBulkFormData({ ...bulkFormData, badge_name: e.target.value })
                        }
                        placeholder="e.g., Pioneer Access"
                        required
                      />
                    </div>

                    {/* Max Uses */}
                    <div className="space-y-2">
                      <Label>Max Uses Per Code (optional)</Label>
                      <Input
                        type="number"
                        value={bulkFormData.max_uses}
                        onChange={(e) =>
                          setBulkFormData({ ...bulkFormData, max_uses: e.target.value })
                        }
                        placeholder="Leave empty for unlimited"
                        min="1"
                      />
                    </div>

                    {/* Expires At */}
                    <div className="space-y-2">
                      <Label>Expires At (optional)</Label>
                      <Input
                        type="datetime-local"
                        value={bulkFormData.expires_at}
                        onChange={(e) =>
                          setBulkFormData({ ...bulkFormData, expires_at: e.target.value })
                        }
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Textarea
                        value={bulkFormData.notes}
                        onChange={(e) =>
                          setBulkFormData({ ...bulkFormData, notes: e.target.value })
                        }
                        placeholder="Bulk generation campaign notes..."
                        rows={2}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-gold hover:opacity-90"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Generate {bulkFormData.count} Codes
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Zap className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {generatedCodes.length} Codes Generated!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Your beta codes have been created successfully
                      </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {generatedCodes.map((code, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleCopyCode(code)}
                            className="font-mono text-xs p-2 rounded bg-background hover:bg-primary/10 transition-colors text-left"
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleExportCSV}
                        className="flex-1 bg-gradient-gold hover:opacity-90"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export as CSV
                      </Button>
                      <Button
                        onClick={handleCloseBulkDialog}
                        variant="outline"
                        className="flex-1"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-gold hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Code
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Beta Code</DialogTitle>
                <DialogDescription>
                  Generate a new beta access code for artists or fans
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCode} className="space-y-4">
                {/* Code Input */}
                <div className="space-y-2">
                  <Label>Code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      placeholder="FLY-XXXXX"
                      className="font-mono uppercase tracking-wider"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateCode}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="artist">Artist</SelectItem>
                      <SelectItem value="fan">Fan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Badge Name */}
                <div className="space-y-2">
                  <Label>Badge Name</Label>
                  <Input
                    value={formData.badge_name}
                    onChange={(e) =>
                      setFormData({ ...formData, badge_name: e.target.value })
                    }
                    placeholder="e.g., Pioneer Access"
                    required
                  />
                </div>

                {/* Max Uses */}
                <div className="space-y-2">
                  <Label>Max Uses (optional)</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) =>
                      setFormData({ ...formData, max_uses: e.target.value })
                    }
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>

                {/* Expires At */}
                <div className="space-y-2">
                  <Label>Expires At (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData({ ...formData, expires_at: e.target.value })
                    }
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Internal notes about this code..."
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-gold hover:opacity-90"
                >
                  Create Beta Code
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Expiring Soon Warning */}
        {expiringCodes.length > 0 && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500">Codes Expiring Soon</AlertTitle>
            <AlertDescription>
              <p className="text-sm text-muted-foreground mb-3">
                {expiringCodes.length} code(s) are expiring soon or have expired
              </p>
              <div className="space-y-2">
                {expiringCodes.slice(0, 5).map(code => {
                  const { status, daysRemaining } = getExpirationStatus(code.expires_at);
                  return (
                    <div key={code.id} className="flex items-center justify-between text-sm bg-background/50 p-2 rounded">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-mono text-xs">{code.code}</span>
                        <Badge variant={
                          status === 'expired' ? 'destructive' : 
                          status === 'critical' ? 'destructive' : 'secondary'
                        }>
                          {status === 'expired' ? '💀 Expired' : 
                           status === 'critical' ? `🔴 ${daysRemaining}d left` : 
                           `⚠️ ${daysRemaining}d left`}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickExtend(code.id, 30)}
                        className="text-xs"
                      >
                        +30 days
                      </Button>
                    </div>
                  );
                })}
              </div>
              {expiringCodes.length > 5 && (
                <p className="text-xs text-muted-foreground mt-2">
                  And {expiringCodes.length - 5} more...
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Bulk Actions Bar */}
        {selectedCodes.length > 0 && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-primary" />
                <span className="font-medium">{selectedCodes.length} code(s) selected</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExtendDialogOpen(true)}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Extend Expiration
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeactivate}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  Deactivate Selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCodes([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Extend Expiration Dialog */}
        <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend Code Expiration</DialogTitle>
              <DialogDescription>
                Extending {selectedCodes.length} code(s)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Extension Type</Label>
                <Select value={extensionType} onValueChange={(value: any) => setExtensionType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add_days">Add days to current expiration</SelectItem>
                    <SelectItem value="set_date">Set new expiration date</SelectItem>
                    <SelectItem value="remove">Remove expiration (never expire)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {extensionType === 'add_days' && (
                <div className="space-y-2">
                  <Label>Days to Add</Label>
                  <Select value={extensionDays} onValueChange={setExtensionDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {extensionType === 'set_date' && (
                <div className="space-y-2">
                  <Label>New Expiration Date</Label>
                  <Input
                    type="datetime-local"
                    value={extensionDate}
                    onChange={(e) => setExtensionDate(e.target.value)}
                    required
                  />
                </div>
              )}

              {extensionType === 'remove' && (
                <Alert>
                  <AlertDescription>
                    Selected codes will never expire unless manually deactivated.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsExtendDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkExtend}
                  className="bg-gradient-gold hover:opacity-90"
                >
                  Apply Extension
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Table */}
        <Card className="p-6">
          {codes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No beta codes created yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsDialogOpen(true)}
              >
                Create Your First Code
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedCodes.length === codes.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="uppercase">Code</TableHead>
                    <TableHead className="uppercase">Type</TableHead>
                    <TableHead className="uppercase">Badge Name</TableHead>
                    <TableHead className="uppercase">Usage</TableHead>
                    <TableHead className="uppercase">Expires</TableHead>
                    <TableHead className="uppercase">Status</TableHead>
                    <TableHead className="uppercase">Notes</TableHead>
                    <TableHead className="uppercase">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => {
                    const { status, daysRemaining } = getExpirationStatus(code.expires_at);
                    return (
                    <TableRow key={code.id} className={
                      status === 'expired' ? 'bg-destructive/5' :
                      status === 'critical' ? 'bg-destructive/5' :
                      status === 'warning' ? 'bg-amber-500/5' : ''
                    }>
                      {/* Checkbox */}
                      <TableCell>
                        <Checkbox
                          checked={selectedCodes.includes(code.id)}
                          onCheckedChange={() => handleSelectCode(code.id)}
                        />
                      </TableCell>
                      
                      {/* Code */}
                      <TableCell className="font-mono tracking-wider">
                        <button
                          onClick={() => handleCopyCode(code.code)}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          {code.code}
                          <Copy className="h-3 w-3" />
                        </button>
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <Badge
                          variant={
                            code.type === "artist" ? "default" : "secondary"
                          }
                        >
                          {code.type === "artist" ? "Artist" : "Fan"}
                        </Badge>
                      </TableCell>

                      {/* Badge Name */}
                      <TableCell>{code.badge_name}</TableCell>

                      {/* Usage */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span>
                              {code.current_uses} /{" "}
                              {code.max_uses === null ? "∞" : code.max_uses}
                            </span>
                          </div>
                          {code.max_uses !== null && (
                            <Progress
                              value={getUsagePercentage(
                                code.current_uses,
                                code.max_uses
                              )}
                              className="h-1"
                            />
                          )}
                        </div>
                      </TableCell>

                      {/* Expires */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={
                            status === 'expired' ? 'text-destructive' :
                            status === 'critical' ? 'text-destructive' :
                            status === 'warning' ? 'text-amber-500' :
                            ''
                          }>
                            {code.expires_at
                              ? format(new Date(code.expires_at), "MMM d, yyyy")
                              : "Never"}
                          </span>
                          {status === 'warning' && (
                            <Badge variant="secondary" className="text-xs">
                              ⏰ {daysRemaining}d
                            </Badge>
                          )}
                          {status === 'critical' && (
                            <Badge variant="destructive" className="text-xs">
                              🔴 {daysRemaining}d
                            </Badge>
                          )}
                          {status === 'expired' && (
                            <Badge variant="destructive" className="text-xs">
                              💀 Expired
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant={code.is_active ? "default" : "destructive"}>
                          {code.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      {/* Notes */}
                      <TableCell className="max-w-xs truncate">
                        {code.notes || "-"}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex gap-1">
                          {code.is_active && (
                            <>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Extend
                                    <ChevronDown className="h-3 w-3 ml-1" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleQuickExtend(code.id, 7)}>
                                    +7 days
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleQuickExtend(code.id, 30)}>
                                    +30 days
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleQuickExtend(code.id, 60)}>
                                    +60 days
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleQuickExtend(code.id, 90)}>
                                    +90 days
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeactivate(code.id)}
                              >
                                Deactivate
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
        )}
      </Card>
      </div>
    </AdminLayout>
  );
}
