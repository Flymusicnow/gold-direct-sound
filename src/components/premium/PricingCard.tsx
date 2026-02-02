import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PricingCardProps {
  name: string;
  description: string;
  price: number | null;
  period?: "month" | "year";
  features: string[];
  ctaText: string;
  onCtaClick: () => void;
  popular?: boolean;
  currentPlan?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** MVP: When true, shows "Coming after MVP" badge and disables checkout */
  mvpLocked?: boolean;
}

export const PricingCard = ({
  name,
  description,
  price,
  period = "month",
  features,
  ctaText,
  onCtaClick,
  popular = false,
  currentPlan = false,
  icon,
  disabled = false,
  mvpLocked = false
}: PricingCardProps) => {
  const formatPrice = () => {
    if (price === null) return "Custom";
    if (price === 0) return "Free";
    return `${price} SEK`;
  };

  return (
    <Card 
      className={`relative flex flex-col transition-all duration-200 ${
        popular ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-border hover:border-primary/50'
      } ${currentPlan ? 'bg-primary/5' : ''}`}
    >
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
          <Sparkles className="h-3 w-3 mr-1" />
          Most Popular
        </Badge>
      )}
      {currentPlan && !mvpLocked && (
        <Badge variant="outline" className="absolute -top-3 right-4 border-primary text-primary">
          Current Plan
        </Badge>
      )}
      {mvpLocked && !currentPlan && (
        <Badge variant="secondary" className="absolute -top-3 right-4">
          Coming after MVP
        </Badge>
      )}
      <CardHeader className="text-center pb-2">
        {icon && (
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {icon}
          </div>
        )}
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-primary">
            {formatPrice()}
          </div>
          {price !== null && price > 0 && (
            <div className="text-sm text-muted-foreground">
              /{period}
            </div>
          )}
        </div>
        <ul className="space-y-3 flex-1">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button 
          className="w-full mt-6"
          variant={popular && !mvpLocked ? "default" : "outline"}
          onClick={onCtaClick}
          disabled={disabled || currentPlan || mvpLocked}
        >
          {currentPlan ? "Current Plan" : mvpLocked ? "Available during trial" : ctaText}
        </Button>
      </CardContent>
    </Card>
  );
};
