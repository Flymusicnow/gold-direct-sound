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
      title: 'Transparency',
      description: 'We always show why you see certain content. No hidden algorithms.',
      link: '/principles',
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: 'Artist-First',
      description: 'Artists own their audience and relationships. We never take control.',
      link: '/culture',
    },
    {
      icon: <Scale className="h-8 w-8" />,
      title: 'Fairness',
      description: 'No one can buy visibility. Only organic support matters.',
      link: '/principles',
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: 'Privacy',
      description: 'Your data is yours. We never sell information to third parties.',
      link: '/data',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container max-w-5xl mx-auto px-4 pt-20 md:pt-12 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            FlyMusic <span className="text-primary">Trust</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're building a music platform based on trust, transparency, and respect 
            for both artists and fans.
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
                    Read more <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Our Commitment */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Our Promise</CardTitle>
          </CardHeader>
          <CardContent className="max-w-3xl mx-auto text-center">
            <p className="text-muted-foreground mb-6">
              FlyMusic is built by and for music lovers. We believe the best music experience 
              is created when artists and fans can connect directly, without intermediaries or 
              hidden agendas. We promise to never compromise these values.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/principles">
                <Button variant="outline">Our Principles</Button>
              </Link>
              <Link to="/safety">
                <Button variant="outline">Safety</Button>
              </Link>
              <Link to="/data">
                <Button variant="outline">Data Usage</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TrustPage;
