import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, MessageCircle, Calendar, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Upload,
      label: "Upload Track",
      description: "Share new music",
      path: "/studio/tracks",
      variant: "default" as const,
    },
    {
      icon: MessageCircle,
      label: "Post Update",
      description: "Share with fans",
      action: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }),
      variant: "outline" as const,
    },
    {
      icon: Calendar,
      label: "Create Event",
      description: "Schedule a show",
      path: "/studio/events",
      variant: "outline" as const,
    },
    {
      icon: BarChart3,
      label: "View Analytics",
      description: "Check your stats",
      path: "/studio/analytics",
      variant: "outline" as const,
    },
  ];

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isUpload = action.label === "Upload Track";
          
          return (
            <div
              key={action.label}
              onClick={() => action.path ? navigate(action.path) : action.action?.()}
              className={cn(
                "p-6 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-1",
                isUpload
                  ? "bg-gradient-gold text-primary-foreground shadow-gold hover:shadow-lg"
                  : "bg-card border border-border/50 hover:bg-muted/30 hover:shadow-md"
              )}
            >
              <Icon className="h-8 w-8 mb-3" />
              <p className="font-bold text-lg mb-1">{action.label}</p>
              <p className={cn(
                "text-sm",
                isUpload ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {action.description}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
