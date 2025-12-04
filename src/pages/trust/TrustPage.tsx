import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Heart, Scale, Lock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';

const TrustPage: React.FC = () => {
  const trustPillars = [
    {
      icon: <Eye className="h-8 w-8" />,
      title: 'Transparens',
      description: 'Vi visar alltid varför du ser visst innehåll. Inga dolda algoritmer.',
      link: '/principles',
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: 'Artist-First',
      description: 'Artister äger sin publik och sina relationer. Vi tar aldrig kontroll.',
      link: '/culture',
    },
    {
      icon: <Scale className="h-8 w-8" />,
      title: 'Rättvisa',
      description: 'Ingen kan köpa sig till synlighet. Organiskt stöd är allt som räknas.',
      link: '/principles',
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: 'Integritet',
      description: 'Din data är din. Vi säljer aldrig information till tredje part.',
      link: '/data',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container max-w-5xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            FlyMusic <span className="text-primary">Trust</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Vi bygger en musikplattform baserad på förtroende, transparens och respekt 
            för både artister och fans.
          </p>
        </div>

        {/* Trust Pillars */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {trustPillars.map((pillar, index) => (
            <Card key={index} className="border-border/50 hover:border-primary/30 transition-colors group">
              <CardHeader>
                <div className="text-primary mb-2">{pillar.icon}</div>
                <CardTitle className="text-xl">{pillar.title}</CardTitle>
                <CardDescription className="text-base">{pillar.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={pillar.link}>
                  <Button variant="ghost" className="group-hover:text-primary">
                    Läs mer <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Our Commitment */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Vårt Löfte</CardTitle>
          </CardHeader>
          <CardContent className="max-w-3xl mx-auto text-center">
            <p className="text-muted-foreground mb-6">
              FlyMusic är byggt av och för musikälskare. Vi tror att den bästa musikupplevelsen 
              skapas när artister och fans kan koppla samman direkt, utan mellanhänder eller 
              dolda agendor. Vi lovar att aldrig kompromissa med dessa värderingar.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/principles">
                <Button variant="outline">Våra Principer</Button>
              </Link>
              <Link to="/safety">
                <Button variant="outline">Säkerhet</Button>
              </Link>
              <Link to="/data">
                <Button variant="outline">Dataanvändning</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TrustPage;
