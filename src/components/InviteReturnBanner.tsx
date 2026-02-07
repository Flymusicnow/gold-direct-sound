import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "flymusic_invite_return_url";

const HIDDEN_ROUTES = [
  "/early-access",
  "/join/fan",
  "/join/artist",
  "/fan/onboarding",
  "/fan/dashboard",
];

export function InviteReturnBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    setReturnUrl(stored);
  }, [location.pathname]);

  // Auto-clear when reaching join/* routes (invite completed)
  useEffect(() => {
    if (location.pathname.startsWith("/join/")) {
      sessionStorage.removeItem(STORAGE_KEY);
      setReturnUrl(null);
    }
  }, [location.pathname]);

  const isHidden = HIDDEN_ROUTES.some(
    (route) =>
      location.pathname === route || location.pathname.startsWith(route + "/")
  );

  const shouldShow = returnUrl && !dismissed && !isHidden;

  const handleReturn = () => {
    if (returnUrl) {
      navigate(returnUrl);
    }
  };

  const handleDismiss = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md"
        >
          <div className="flex items-center gap-3 bg-card/95 backdrop-blur-xl border border-border rounded-2xl px-4 py-3 shadow-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Du har en väntande inbjudan
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Gå tillbaka för att aktivera din kod
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleReturn}
              className="shrink-0 bg-violet-500 hover:bg-violet-600 text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Tillbaka
            </Button>
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Stäng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
