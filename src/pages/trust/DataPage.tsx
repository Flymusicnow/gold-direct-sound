import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Database, Eye, Lock, Trash2, Download, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';

const DataPage: React.FC = () => {
  const dataPoints = [
    {
      icon: <Eye className="h-6 w-6" />,
      title: 'Vad vi samlar in',
      items: [
        'Din lyssningshistorik (för personliga rekommendationer)',
        'Interaktioner (likes, follows, kommentarer)',
        'Grundläggande kontoinformation',
        'Supporter-aktivitet',
      ],
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: 'Vad vi ALDRIG gör',
      items: [
        'Säljer din data till tredje part',
        'Delar din lyssningshistorik med annonsörer',
        'Använder din data för riktad reklam',
        'Säljer kontaktlistor eller fan-data',
      ],
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: 'Dina rättigheter',
      items: [
        'Ladda ner all din data',
        'Radera ditt konto permanent',
        'Ändra dina integritetsinställningar',
        'Se exakt vad vi lagrar om dig',
      ],
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Database className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Dataanvändning</h1>
          <p className="text-xl text-muted-foreground">
            Full transparens om hur vi hanterar din information.
          </p>
        </div>

        {/* Main Promise */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent mb-8">
          <CardContent className="py-8 text-center">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Din Data, Dina Regler</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              FlyMusic samlar bara in data som behövs för att ge dig en bättre musikupplevelse. 
              Vi säljer aldrig, och kommer aldrig sälja, din information.
            </p>
          </CardContent>
        </Card>

        {/* Data Points */}
        <div className="space-y-6 mb-12">
          {dataPoints.map((section, index) => (
            <Card key={index} className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {section.icon}
                  </div>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 pl-12">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Actions */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Hantera din data</CardTitle>
            <CardDescription>
              Du har full kontroll över din information på FlyMusic.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Ladda ner min data
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Se min data
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Radera mitt konto
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DataPage;
