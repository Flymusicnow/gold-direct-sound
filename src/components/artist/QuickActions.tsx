import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, MessageCircle, Calendar, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant={action.variant}
              className="h-auto flex-col items-start p-4 gap-2"
              onClick={() => action.path ? navigate(action.path) : action.action?.()}
            >
              <Icon className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">{action.label}</p>
                <p className="text-xs text-muted-foreground font-normal">{action.description}</p>
              </div>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
