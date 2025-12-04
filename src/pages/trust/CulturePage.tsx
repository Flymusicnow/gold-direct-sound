import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Music, Mic2, Heart, Handshake, Rocket, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';

const CulturePage: React.FC = () => {
  const culturePoints = [
    {
      icon: <Music className="h-8 w-8" />,
      title: 'Musiken Först',
      description: 'Allt börjar och slutar med musiken. Vi bygger verktyg som hjälper bra musik att hittas, inte verktyg som manipulerar vad folk lyssnar på.',
    },
    {
      icon: <Mic2 className="h-8 w-8" />,
      title: 'Artisternas Hem',
      description: 'FlyMusic är byggt för artister som vill äga sina karriärer. Här behöver du inte anpassa dig till en algoritm – du bygger din egen publik.',
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: 'Superfans Celebration',
      description: 'Vi firar fans som verkligen stöttar sina artister. Supporter-systemet synliggör och belönar genuint engagemang.',
    },
    {
      icon: <Handshake className="h-8 w-8" />,
      title: 'Direkt Koppling',
      description: 'Ingen mellanhand. Artister och fans kommunicerar direkt. Stöd går direkt. Relationer byggs direkt.',
    },
    {
      icon: <Rocket className="h-8 w-8" />,
      title: 'Independent Spirit',
      description: 'FlyMusic är för de som väljer sin egen väg. Oberoende artister, nischgenrer, lokala scener – alla har en plats här.',
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Community-Driven',
      description: 'Plattformen formas av communityn. Spotlight-vinnare väljs av fans, Trending bestäms av riktig aktivitet, inte av oss.',
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
          <h1 className="text-4xl font-bold mb-4">FlyMusic Kultur</h1>
          <p className="text-xl text-muted-foreground">
            Värderingarna som definierar vår community och hur vi bygger plattformen.
          </p>
        </div>

        {/* Manifesto Quote */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent mb-12">
          <CardContent className="py-8">
            <blockquote className="text-xl md:text-2xl font-medium text-center italic">
              "En plattform där artister äger sina relationer och fans 
              verkligen betyder något."
            </blockquote>
            <p className="text-center text-muted-foreground mt-4">– FlyMusic Vision</p>
          </CardContent>
        </Card>

        {/* Culture Points Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {culturePoints.map((point, index) => (
            <Card key={index} className="border-border/50">
              <CardContent className="pt-6">
                <div className="text-primary mb-4">{point.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{point.title}</h3>
                <p className="text-muted-foreground text-sm">{point.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Community Note */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            FlyMusic är mer än en plattform – det är en rörelse för en rättvisare musikindustri.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/principles">
              <Button variant="outline">Våra Principer</Button>
            </Link>
            <Link to="/safety">
              <Button variant="outline">Säkerhet</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CulturePage;
