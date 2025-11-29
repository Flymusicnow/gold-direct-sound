import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface FanTestimonialCardProps {
  testimonial: {
    id: string;
    testimonial_text: string;
    rating: number;
    created_at: string;
    is_featured: boolean;
    profiles?: {
      full_name: string | null;
    };
  };
}

export function FanTestimonialCard({ testimonial }: FanTestimonialCardProps) {
  return (
    <Card className="bg-card/50 border-primary/20 hover:border-primary/40 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {testimonial.profiles?.full_name?.[0]?.toUpperCase() || "F"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">
                {testimonial.profiles?.full_name || "Fan"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(testimonial.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          {testimonial.is_featured && (
            <Badge className="bg-primary/20 text-primary border-primary/30">
              Top Supporter
            </Badge>
          )}
        </div>

        <div className="flex gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < testimonial.rating
                  ? "fill-primary text-primary"
                  : "text-muted-foreground"
              }`}
            />
          ))}
        </div>

        <p className="text-sm text-foreground leading-relaxed">
          {testimonial.testimonial_text}
        </p>
      </CardContent>
    </Card>
  );
}
