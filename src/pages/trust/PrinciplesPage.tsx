import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, Users, Eye, Ban, Sparkles, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlyMusicLogo } from '@/components/FlyMusicLogo';
import TrustBadge from '@/components/trust/TrustBadge';

const PrinciplesPage: React.FC = () => {
  const navigate = useNavigate();
  
  const principles = [
    {
      icon: <Scale className="h-6 w-6" />,
      title: 'No Paid Visibility',
      description: 'Artists cannot buy their way to the top of charts or recommendations. Only organic support from fans counts.',
      details: 'Spotlight ranking, Trending, and For You are all based on genuine engagement – not payments.',
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: 'Transparent Algorithm',
      description: 'We always show why you see certain content. "Why am I seeing this?" is available on every recommendation.',
      details: 'Our ranking factors are public: taste match, supporter activity, momentum, and recency.',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Artists Own Their Audience',
      description: 'Artists own their fan relationships. We never sell contact information or create barriers.',
      details: 'Fans who follow an artist belong to that artist – not the platform.',
    },
    {
      icon: <Ban className="h-6 w-6" />,
      title: 'No Ads',
      description: 'FlyMusic has no ads and never will. We are funded by direct support between fans and artists.',
      details: 'Your experience is never interrupted by advertisements. Period.',
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: 'Fan-First Design',
      description: 'Every feature is designed to improve the music experience, not to maximize "engagement metrics."',
      details: 'We measure success in meaningful connections, not time spent on the platform.',
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'Fair Competition',
      description: 'In Spotlight and rankings, all artists have the same opportunities regardless of size or resources.',
      details: 'A new artist with engaged fans can reach the top just as easily as an established artist.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link to="/">
          <FlyMusicLogo size="sm" />
        </Link>
        <TrustBadge />
      </div>
      
      <main className="container max-w-4xl mx-auto px-4 pt-24 pb-12">

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Our Principles</h1>
          <p className="text-xl text-muted-foreground">
            The fundamental values that guide everything we build at FlyMusic.
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
