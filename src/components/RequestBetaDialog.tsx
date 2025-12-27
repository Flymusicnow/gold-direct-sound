import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2 } from "lucide-react";

interface RequestBetaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestBetaDialog({ open, onOpenChange }: RequestBetaDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("beta_waitlist")
        .insert({
          email: email.trim(),
          name: name.trim() || null,
          user_type: "general",
          message: message.trim() || null,
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already registered",
            description: "This email is already on the waitlist",
          });
        } else {
          throw error;
        }
      } else {
        setSuccess(true);
        toast({
          title: "Request submitted!",
          description: "We'll be in touch soon with your beta code",
        });
      }
    } catch (error) {
      console.error("Error submitting beta request:", error);
      toast({
        title: "Submission failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setEmail("");
      setName("");
      setMessage("");
      setSuccess(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Request Beta Code</DialogTitle>
          <DialogDescription>
            Join the waitlist to get early access to FlyMusic
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">You're on the list!</h3>
              <p className="text-sm text-muted-foreground">
                We'll send your beta code to <span className="text-primary font-medium">{email}</span> soon.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Why do you want early access? (optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell us a bit about yourself..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
