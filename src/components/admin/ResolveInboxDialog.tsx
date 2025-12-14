import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

interface ResolveInboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (details: {
    problem: string;
    fix: string;
    verification: string;
    testedOn: string[];
  }) => Promise<boolean>;
}

export function ResolveInboxDialog({
  open,
  onOpenChange,
  onResolve,
}: ResolveInboxDialogProps) {
  const [problem, setProblem] = useState("");
  const [fix, setFix] = useState("");
  const [verification, setVerification] = useState("");
  const [testedOn, setTestedOn] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isValid =
    problem.length >= 10 &&
    fix.length >= 10 &&
    verification.length >= 10 &&
    testedOn.length > 0;

  const handleTestedOnChange = (device: string, checked: boolean) => {
    if (checked) {
      setTestedOn([...testedOn, device]);
    } else {
      setTestedOn(testedOn.filter((d) => d !== device));
    }
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const success = await onResolve({
        problem,
        fix,
        verification,
        testedOn,
      });
      if (success) {
        // Reset form
        setProblem("");
        setFix("");
        setVerification("");
        setTestedOn([]);
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Lös problemet
          </DialogTitle>
          <DialogDescription>
            Fyll i alla fält för att markera problemet som löst.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="problem" className="text-sm font-medium">
              Problemet var att…
            </Label>
            <Textarea
              id="problem"
              placeholder="Beskriv vad som var fel (minst 10 tecken)"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="min-h-[80px]"
            />
            {problem.length > 0 && problem.length < 10 && (
              <p className="text-xs text-destructive">
                Minst 10 tecken ({problem.length}/10)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fix" className="text-sm font-medium">
              Vi fixade det genom att…
            </Label>
            <Textarea
              id="fix"
              placeholder="Beskriv hur du löste problemet (minst 10 tecken)"
              value={fix}
              onChange={(e) => setFix(e.target.value)}
              className="min-h-[80px]"
            />
            {fix.length > 0 && fix.length < 10 && (
              <p className="text-xs text-destructive">
                Minst 10 tecken ({fix.length}/10)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification" className="text-sm font-medium">
              Nu fungerar det eftersom…
            </Label>
            <Textarea
              id="verification"
              placeholder="Beskriv hur du verifierade att det fungerar (minst 10 tecken)"
              value={verification}
              onChange={(e) => setVerification(e.target.value)}
              className="min-h-[80px]"
            />
            {verification.length > 0 && verification.length < 10 && (
              <p className="text-xs text-destructive">
                Minst 10 tecken ({verification.length}/10)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Testat på:</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="desktop"
                  checked={testedOn.includes("Desktop")}
                  onCheckedChange={(checked) =>
                    handleTestedOnChange("Desktop", !!checked)
                  }
                />
                <Label htmlFor="desktop" className="text-sm font-normal">
                  Desktop
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="iphone"
                  checked={testedOn.includes("iPhone")}
                  onCheckedChange={(checked) =>
                    handleTestedOnChange("iPhone", !!checked)
                  }
                />
                <Label htmlFor="iphone" className="text-sm font-normal">
                  iPhone
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="android"
                  checked={testedOn.includes("Android")}
                  onCheckedChange={(checked) =>
                    handleTestedOnChange("Android", !!checked)
                  }
                />
                <Label htmlFor="android" className="text-sm font-normal">
                  Android
                </Label>
              </div>
            </div>
            {testedOn.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Välj minst en plattform
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting ? "Sparar..." : "Markera som löst"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
