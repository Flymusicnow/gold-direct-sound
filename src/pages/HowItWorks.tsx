import { Link, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Music, 
  Heart, 
  Users, 
  Shield, 
  Mic2, 
  Headphones, 
  Sparkles,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function HowItWorks() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const steps = [
    {
      icon: Music,
      title: t('howItWorks.discoverTitle'),
      description: t('howItWorks.discoverDescription'),
      color: "text-primary"
    },
    {
      icon: Heart,
      title: t('howItWorks.supportTitle'),
      description: t('howItWorks.supportDescription'),
      color: "text-pink-500"
    },
    {
      icon: Users,
      title: t('howItWorks.connectTitle'),
      description: t('howItWorks.connectDescription'),
      color: "text-blue-500"
    }
  ];

  const forArtists = [
    t('howItWorks.artistBenefit1'),
    t('howItWorks.artistBenefit2'),
    t('howItWorks.artistBenefit3'),
    t('howItWorks.artistBenefit4'),
  ];

  const forFans = [
    t('howItWorks.fanBenefit1'),
    t('howItWorks.fanBenefit2'),
    t('howItWorks.fanBenefit3'),
    t('howItWorks.fanBenefit4'),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t('howItWorks.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t('howItWorks.subtitle')}
          </p>
        </section>

        {/* 3-Step Process */}
        <section className="container mx-auto px-4 mb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="bg-card/50 border-border hover:border-primary/30 transition-colors">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 ${step.color}`}>
                    <step.icon className="h-8 w-8" />
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">{t('howItWorks.step')} {index + 1}</div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* For Artists / For Fans */}
        <section className="container mx-auto px-4 mb-20">
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Artists */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-8 pb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary/20 rounded-full">
                    <Mic2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">{t('howItWorks.forArtists')}</h3>
                </div>
                <ul className="space-y-4">
                  {forArtists.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground/80">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="mt-6 bg-gradient-gold" 
                  onClick={() => navigate('/auth?mode=artist')}
                >
                  {t('howItWorks.joinAsArtist')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* For Fans */}
            <Card className="bg-gradient-to-br from-pink-500/5 to-pink-500/10 border-pink-500/20">
              <CardContent className="pt-8 pb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-pink-500/20 rounded-full">
                    <Headphones className="h-6 w-6 text-pink-500" />
                  </div>
                  <h3 className="text-2xl font-bold">{t('howItWorks.forFans')}</h3>
                </div>
                <ul className="space-y-4">
                  {forFans.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-pink-500 shrink-0 mt-0.5" />
                      <span className="text-foreground/80">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="outline"
                  className="mt-6 border-pink-500/30 text-pink-500 hover:bg-pink-500/10" 
                  onClick={() => navigate('/auth?mode=fan')}
                >
                  {t('howItWorks.joinAsFan')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Trust Section */}
        <section className="container mx-auto px-4 mb-20">
          <Card className="bg-card/30 border-border">
            <CardContent className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t('howItWorks.trustTitle')}</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                {t('howItWorks.trustDescription')}
              </p>
              <Link to="/trust">
                <Button variant="outline">
                  {t('howItWorks.learnAboutTrust')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">{t('howItWorks.readyTitle')}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {t('howItWorks.readyDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/explore')}>
              {t('howItWorks.exploreArtists')}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              {t('howItWorks.createAccount')}
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
