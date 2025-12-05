import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, FileText, MapPin, Calendar, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { OpportunityMatchScore } from "./OpportunityMatchScore";

interface ApplyToOpportunityDialogProps {
  opportunity: any;
  artistId: string;
  onClose: () => void;
}

export function ApplyToOpportunityDialog({ opportunity, artistId, onClose }: ApplyToOpportunityDialogProps) {
  const queryClient = useQueryClient();
  const [selectedPresskitId, setSelectedPresskitId] = useState<string>("");
  const [message, setMessage] = useState("");

  // Fetch artist's presskits
  const { data: presskits = [], isLoading: loadingPresskits } = useQuery({
    queryKey: ['artist-presskits', artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_presskits')
        .select('id, title, slug, is_default')
        .eq('artist_id', artistId)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch match score
  const { data: matchScore } = useQuery({
    queryKey: ['opportunity-match-score', artistId, opportunity.id],
    queryFn: async () => {
      const { data } = await supabase.rpc('calculate_opportunity_match_score', {
        _artist_id: artistId,
        _opportunity_id: opportunity.id
      });
      return data as {
        totalScore: number;
        genreScore: number;
        locationScore: number;
        experienceScore: number;
        collabHistoryScore: number;
        availabilityScore: number;
        engagementScore: number;
        maxScore: number;
        hasDefaultPresskit: boolean;
      } | null;
    },
  });

  // Set default presskit
  useState(() => {
    const defaultPresskit = presskits.find(p => p.is_default);
    if (defaultPresskit && !selectedPresskitId) {
      setSelectedPresskitId(defaultPresskit.id);
    }
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('collab_applications')
        .insert({
          opportunity_id: opportunity.id,
          artist_id: artistId,
          presskit_id: selectedPresskitId || null,
          message: message || null,
          match_score: matchScore?.totalScore || null,
          status: 'submitted'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Application submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      onClose();
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('You have already applied to this opportunity');
      } else {
        toast.error(error.message || 'Failed to submit application');
      }
    }
  });

  const selectedPresskit = presskits.find(p => p.id === selectedPresskitId);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply to Opportunity</DialogTitle>
          <DialogDescription>
            Submit your application for {opportunity.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Opportunity Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{opportunity.title}</h3>
                  <p className="text-sm text-muted-foreground">{opportunity.entity?.name}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{opportunity.type.replace('_', ' ')}</Badge>
                    {opportunity.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {opportunity.location}
                      </span>
                    )}
                    {opportunity.application_deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Deadline: {format(new Date(opportunity.application_deadline), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
                {matchScore && (
                  <OpportunityMatchScore score={matchScore} showBreakdown />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Presskit Selection */}
          <div className="space-y-2">
            <Label>Select Press Kit</Label>
            {loadingPresskits ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading presskits...
              </div>
            ) : presskits.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  No press kits found. 
                  <a href="/studio/presskit" className="text-primary hover:underline ml-1">
                    Create one
                  </a>
                </span>
              </div>
            ) : (
              <>
                <Select value={selectedPresskitId} onValueChange={setSelectedPresskitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a press kit to attach" />
                  </SelectTrigger>
                  <SelectContent>
                    {presskits.map((pk) => (
                      <SelectItem key={pk.id} value={pk.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {pk.title}
                          {pk.is_default && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedPresskit && (
                  <a 
                    href={`/epk/${selectedPresskit.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Preview Press Kit
                  </a>
                )}
              </>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Why you're a great fit for this opportunity..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/1000
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}