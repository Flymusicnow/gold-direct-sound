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
      title: 'Music First',
      description: 'Everything starts and ends with the music. We build tools that help good music get discovered, not tools that manipulate what people listen to.',
    },
    {
      icon: <Mic2 className="h-8 w-8" />,
      title: 'Artist\'s Home',
      description: 'FlyMusic is built for artists who want to own their careers. Here you don\'t need to adapt to an algorithm – you build your own audience.',
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: 'Superfans Celebration',
      description: 'We celebrate fans who truly support their artists. The Supporter system highlights and rewards genuine engagement.',
    },
    {
      icon: <Handshake className="h-8 w-8" />,
      title: 'Direct Connection',
      description: 'No middlemen. Artists and fans communicate directly. Support goes directly. Relationships are built directly.',
    },
    {
      icon: <Rocket className="h-8 w-8" />,
      title: 'Independent Spirit',
      description: 'FlyMusic is for those who choose their own path. Independent artists, niche genres, local scenes – everyone has a place here.',
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Community-Driven',
      description: 'The platform is shaped by the community. Spotlight winners are chosen by fans, Trending is determined by real activity, not by us.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container max-w-4xl mx-auto px-4 pt-20 md:pt-12 pb-12">
        <Link to="/trust">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trust
          </Button>
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">FlyMusic Culture</h1>
          <p className="text-xl text-muted-foreground">
            The values that define our community and how we build the platform.
          </p>
        </div>

        {/* Manifesto Quote */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent mb-12">
          <CardContent className="py-8">
            <blockquote className="text-xl md:text-2xl font-medium text-center italic">
              "A platform where artists own their relationships and fans 
              truly matter."
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
            FlyMusic is more than a platform – it's a movement for a fairer music industry.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/principles">
              <Button variant="outline">Our Principles</Button>
            </Link>
            <Link to="/safety">
              <Button variant="outline">Safety</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CulturePage;
