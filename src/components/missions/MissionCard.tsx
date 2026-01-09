import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Headphones, Heart, Play, Star, Award, Compass, Share2, Video, CheckCircle2, Loader2 
} from 'lucide-react';

interface MissionCardProps {
  mission: {
    id: string;
    mission_key: string;
    mission_type: 'daily' | 'weekly' | 'special';
    title: string;
    description: string | null;
    xp_reward: number;
    icon: string;
    target_count: number;
  };
  progress: number;
  completed: boolean;
  isPending?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  headphones: <Headphones className="h-5 w-5" />,
  heart: <Heart className="h-5 w-5" />,
  play: <Play className="h-5 w-5" />,
  star: <Star className="h-5 w-5" />,
  award: <Award className="h-5 w-5" />,
  compass: <Compass className="h-5 w-5" />,
  share: <Share2 className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
};

export function MissionCard({ mission, progress, completed, isPending }: MissionCardProps) {
  const progressPercent = Math.min((progress / mission.target_count) * 100, 100);
  const icon = iconMap[mission.icon] || <Star className="h-5 w-5" />;
  const remaining = mission.target_count - progress;

  return (
    <Card className={`transition-all ${completed ? 'bg-primary/10 border-primary/30' : 'bg-card/50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${completed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {completed ? <CheckCircle2 className="h-5 w-5" /> : icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className={`font-medium truncate ${completed ? 'text-primary' : 'text-foreground'}`}>
                {mission.title}
              </h4>
              <Badge variant={mission.mission_type === 'daily' ? 'secondary' : 'outline'} className="shrink-0">
                {mission.mission_type === 'daily' ? 'Daily' : 'Weekly'}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
              {mission.description}
            </p>
            
            <div className="flex items-center gap-3">
              <Progress value={progressPercent} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {progress}/{mission.target_count}
              </span>
              {isPending ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </div>
              ) : completed ? (
                <span className="text-sm font-medium text-green-500 shrink-0">
                  Completed!
                </span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground shrink-0">
                  {remaining} left
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
