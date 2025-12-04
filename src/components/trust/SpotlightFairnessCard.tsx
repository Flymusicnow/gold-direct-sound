import React from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Vote, Shield, TrendingUp } from 'lucide-react';

const SpotlightFairnessCard: React.FC = () => {
  const trustLayerEnabled = useFeatureFlag('TRUST_LAYER_ENABLED');

  if (!trustLayerEnabled) return null;

  const fairnessPoints = [
    {
      icon: <Vote className="h-5 w-5 text-primary" />,
      title: 'En röst per fan',
      description: 'Varje fan kan rösta en gång per entry för att säkerställa rättvisa',
    },
    {
      icon: <Shield className="h-5 w-5 text-primary" />,
      title: 'Ingen köpta röster',
      description: 'Röster kan inte köpas – endast organiskt stöd räknas',
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      title: 'Transparent ranking',
      description: 'Alla kan se exakt hur många röster varje entry har',
    },
    {
      icon: <Scale className="h-5 w-5 text-primary" />,
      title: 'Lika villkor',
      description: 'Stora och små artister tävlar på samma villkor',
    },
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="h-5 w-5 text-primary" />
          Spotlight Fairness
        </CardTitle>
        <CardDescription>
          Så säkerställer vi rättvis tävlan i FlyMusic Spotlight
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {fairnessPoints.map((point, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-background/50"
            >
              <div className="mt-0.5">{point.icon}</div>
              <div>
                <h4 className="font-medium text-sm">{point.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{point.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpotlightFairnessCard;
