import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Music, MapPin, Briefcase, Star, Users, Calendar, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchScoreData {
  totalScore: number;
  genreScore: number;
  locationScore: number;
  experienceScore: number;
  collabHistoryScore: number;
  availabilityScore: number;
  engagementScore: number;
  maxScore: number;
  hasDefaultPresskit: boolean;
}

interface OpportunityMatchScoreProps {
  score: MatchScoreData;
  showBreakdown?: boolean;
  size?: "sm" | "md" | "lg";
}

export function OpportunityMatchScore({ score, showBreakdown = false, size = "md" }: OpportunityMatchScoreProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const percentage = Math.round((score.totalScore / score.maxScore) * 100);
  
  const getScoreColor = () => {
    if (percentage >= 70) return "text-green-500 border-green-500/50 bg-green-500/10";
    if (percentage >= 50) return "text-primary border-primary/50 bg-primary/10";
    if (percentage >= 30) return "text-yellow-500 border-yellow-500/50 bg-yellow-500/10";
    return "text-muted-foreground border-muted bg-muted/20";
  };

  const getScoreLabel = () => {
    if (percentage >= 70) return "Strong Match";
    if (percentage >= 50) return "Good Match";
    if (percentage >= 30) return "Fair Match";
    return "Low Match";
  };

  const scoreBreakdown = [
    { label: "Genre Match", score: score.genreScore, max: 30, icon: Music },
    { label: "Location", score: score.locationScore, max: 20, icon: MapPin },
    { label: "Experience", score: score.experienceScore, max: 15, icon: Star },
    { label: "Collab History", score: score.collabHistoryScore, max: 15, icon: Briefcase },
    { label: "Availability", score: score.availabilityScore, max: 10, icon: Calendar },
    { label: "Engagement", score: score.engagementScore, max: 10, icon: Users },
  ];

  const badgeContent = (
    <Badge 
      variant="outline" 
      className={cn(
        "cursor-pointer transition-all hover:scale-105",
        getScoreColor(),
        size === "sm" && "text-xs px-2 py-0.5",
        size === "lg" && "text-base px-4 py-1"
      )}
    >
      {percentage}%
    </Badge>
  );

  if (!showBreakdown) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {badgeContent}
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Match Score</h4>
              <span className={cn("text-lg font-bold", getScoreColor().split(" ")[0])}>
                {percentage}%
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground">{getScoreLabel()}</p>
            
            <div className="space-y-3">
              {scoreBreakdown.map((item) => {
                const Icon = item.icon;
                const itemPercentage = Math.round((item.score / item.max) * 100);
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Icon className="h-3 w-3" />
                        {item.label}
                      </span>
                      <span>{item.score}/{item.max}</span>
                    </div>
                    <Progress value={itemPercentage} className="h-1.5" />
                  </div>
                );
              })}
            </div>

            {!score.hasDefaultPresskit && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  Create a press kit to improve your match score
                </span>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Inline breakdown view
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Match Score</span>
        <Badge 
          variant="outline" 
          className={cn("font-semibold", getScoreColor())}
        >
          {percentage}% - {getScoreLabel()}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {scoreBreakdown.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="h-3 w-3" />
              <span>{item.label}:</span>
              <span className="font-medium text-foreground">{item.score}/{item.max}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}