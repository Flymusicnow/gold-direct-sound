import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Eye, Lock, Trash2, Download, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlyMusicLogo } from '@/components/FlyMusicLogo';
import TrustBadge from '@/components/trust/TrustBadge';

const DataPage: React.FC = () => {
  const navigate = useNavigate();
  
  const dataPoints = [
    {
      icon: <Eye className="h-6 w-6" />,
      title: 'What We Collect',
      items: [
        'Your listening history (for personalized recommendations)',
        'Interactions (likes, follows, comments)',
        'Basic account information',
        'Supporter activity',
      ],
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: 'What We NEVER Do',
      items: [
        'Sell your data to third parties',
        'Share your listening history with advertisers',
        'Use your data for targeted advertising',
        'Sell contact lists or fan data',
      ],
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: 'Your Rights',
      items: [
        'Download all your data',
        'Delete your account permanently',
        'Change your privacy settings',
        'See exactly what we store about you',
      ],
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
            <Database className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Data Usage</h1>
          <p className="text-xl text-muted-foreground">
            Full transparency about how we handle your information.
          </p>
        </div>

        {/* Main Promise */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent mb-8">
          <CardContent className="py-8 text-center">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your Data, Your Rules</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              FlyMusic only collects data needed to give you a better music experience. 
              We never sell, and will never sell, your information.
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
            <CardTitle>Manage Your Data</CardTitle>
            <CardDescription>
              You have full control over your information on FlyMusic.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download My Data
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View My Data
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My Account
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DataPage;
