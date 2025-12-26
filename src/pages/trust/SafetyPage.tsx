import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, Ban, Flag, Lock, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlyMusicLogo } from '@/components/FlyMusicLogo';
import TrustBadge from '@/components/trust/TrustBadge';

const SafetyPage: React.FC = () => {
  const navigate = useNavigate();
  
  const safetyFeatures = [
    {
      icon: <Ban className="h-6 w-6" />,
      title: 'Zero Tolerance for Harassment',
      description: 'Hateful content, harassment, and bullying are not tolerated. We act quickly on reports.',
    },
    {
      icon: <Flag className="h-6 w-6" />,
      title: 'Easy Reporting',
      description: 'A clear reporting function is available on all content. Every report is reviewed by our team.',
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: 'Account Security',
      description: 'Secure authentication and the ability to protect your account with extra verification.',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Community Guidelines',
      description: 'Clear rules for what is acceptable. All users are expected to follow these guidelines.',
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Safety at FlyMusic</h1>
          <p className="text-xl text-muted-foreground">
            A safe place for music, creativity, and community.
          </p>
        </div>

        {/* Safety Alert */}
        <Card className="border-yellow-500/30 bg-yellow-500/5 mb-8">
          <CardContent className="flex items-start gap-4 py-6">
            <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                If you experience harassment, threats, or other inappropriate behavior, contact us 
                immediately. We take all reports seriously.
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                Report a Problem
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
            <CardTitle>Community Guidelines (Summary)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span className="text-sm">Be respectful to other users</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span className="text-sm">Only share content you have the right to share</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span className="text-sm">Give constructive feedback, not hateful comments</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span className="text-sm">Report inappropriate content when you see it</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-destructive">✗</span>
              <span className="text-sm">Spam, fake engagement, or manipulation</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-destructive">✗</span>
              <span className="text-sm">Hateful content, discrimination, or harassment</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SafetyPage;
