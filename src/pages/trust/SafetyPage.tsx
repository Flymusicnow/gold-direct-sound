import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, Ban, Flag, Lock, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';

const SafetyPage: React.FC = () => {
  const safetyFeatures = [
    {
      icon: <Ban className="h-6 w-6" />,
      title: 'Nolltolerans mot Trakasserier',
      description: 'Hatiskt innehåll, trakasserier och mobbning tolereras inte. Vi agerar snabbt på anmälningar.',
    },
    {
      icon: <Flag className="h-6 w-6" />,
      title: 'Enkel Rapportering',
      description: 'En tydlig rapportfunktion finns på allt innehåll. Varje anmälan granskas av vårt team.',
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: 'Kontosäkerhet',
      description: 'Säker autentisering och möjlighet att skydda ditt konto med extra verifiering.',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Community Guidelines',
      description: 'Tydliga regler för vad som är acceptabelt. Alla användare förväntas följa dessa.',
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
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Säkerhet på FlyMusic</h1>
          <p className="text-xl text-muted-foreground">
            En trygg plats för musik, kreativitet och community.
          </p>
        </div>

        {/* Safety Alert */}
        <Card className="border-yellow-500/30 bg-yellow-500/5 mb-8">
          <CardContent className="flex items-start gap-4 py-6">
            <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Behöver du hjälp?</h3>
              <p className="text-sm text-muted-foreground">
                Om du upplever trakasserier, hot eller annat olämpligt beteende, kontakta oss 
                omedelbart. Vi tar alla anmälningar på allvar.
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                Rapportera ett Problem
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Safety Features */}
        <div className="space-y-4 mb-12">
          {safetyFeatures.map((feature, index) => (
            <Card key={index} className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base pl-12">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Community Guidelines Summary */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Community Guidelines (Sammanfattning)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span className="text-sm">Var respektfull mot andra användare</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span className="text-sm">Dela bara innehåll du har rätt att dela</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span className="text-sm">Ge konstruktiv feedback, inte hatiska kommentarer</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span className="text-sm">Rapportera olämpligt innehåll när du ser det</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-destructive">✗</span>
              <span className="text-sm">Spam, fake engagement eller manipulation</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-destructive">✗</span>
              <span className="text-sm">Hatiskt innehåll, diskriminering eller trakasserier</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SafetyPage;
