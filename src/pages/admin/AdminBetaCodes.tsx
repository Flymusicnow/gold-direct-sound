import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, Copy, Sparkles, Download, Zap } from "lucide-react";
import { format } from "date-fns";

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

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Loading beta codes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Beta Code Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage beta access codes for artists and fans
            </p>
          </div>
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
                  {codes.map((code) => (
                    <TableRow key={code.id}>
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
                        {code.expires_at
                          ? format(new Date(code.expires_at), "MMM d, yyyy")
                          : "Never"}
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
                        {code.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(code.id)}
                          >
                            Deactivate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
