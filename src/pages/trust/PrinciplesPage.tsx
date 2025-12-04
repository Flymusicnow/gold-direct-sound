import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scale, Users, Eye, Ban, Sparkles, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';

const PrinciplesPage: React.FC = () => {
  const principles = [
    {
      icon: <Scale className="h-6 w-6" />,
      title: 'Ingen Köpt Synlighet',
      description: 'Artister kan inte köpa sig till topplistor eller rekommendationer. Organiskt stöd från fans är det enda som räknas.',
      details: 'Spotlight-ranking, Trending och For You baseras på genuint engagemang – inte betalningar.',
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: 'Transparent Algoritm',
      description: 'Vi visar alltid varför du ser visst innehåll. "Varför ser jag detta?" finns på varje rekommendation.',
      details: 'Våra rankingfaktorer är publika: taste match, supporter activity, momentum och recency.',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Artist Äger Publiken',
      description: 'Artister äger sina fan-relationer. Vi säljer aldrig kontaktinformation eller skapar barriärer.',
      details: 'Fans som följer en artist tillhör den artisten – inte plattformen.',
    },
    {
      icon: <Ban className="h-6 w-6" />,
      title: 'Inga Annonser',
      description: 'FlyMusic har inga annonser och kommer aldrig ha det. Vi finansieras av direktstöd mellan fans och artister.',
      details: 'Din upplevelse avbryts aldrig av reklam. Punkt.',
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: 'Fan-First Design',
      description: 'Varje funktion designas för att förbättra musikupplevelsen, inte för att maximera "engagement metrics".',
      details: 'Vi mäter framgång i meningsfulla kopplingar, inte i tid spenderad på plattformen.',
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'Rättvis Tävlan',
      description: 'I Spotlight och rankings har alla artister samma förutsättningar oavsett storlek eller resurser.',
      details: 'En ny artist med engagerade fans kan nå toppen lika lätt som en etablerad artist.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container max-w-4xl mx-auto px-4 py-12">
        <Link to="/trust">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka till Trust
          </Button>
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Våra Principer</h1>
          <p className="text-xl text-muted-foreground">
            De grundläggande värderingar som styr allt vi bygger på FlyMusic.
          </p>
        </div>

        <div className="space-y-6">
          {principles.map((principle, index) => (
            <Card key={index} className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {principle.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{principle.title}</CardTitle>
                    <CardDescription className="text-base mt-1">
                      {principle.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground pl-12">
                  {principle.details}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default PrinciplesPage;
