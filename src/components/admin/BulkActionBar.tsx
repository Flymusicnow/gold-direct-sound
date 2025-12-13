import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BulkActionBarProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onClear: () => void;
  loading?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onApprove,
  onReject,
  onClear,
  loading = false,
}: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background border shadow-lg">
            <span className="text-sm font-medium">
              {selectedCount} link{selectedCount > 1 ? 's' : ''} selected
            </span>
            
            <div className="h-4 w-px bg-border" />
            
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-600/30 hover:bg-green-600/10"
              onClick={onApprove}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Approve All
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-600/30 hover:bg-red-600/10"
              onClick={onReject}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Reject All
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onClear}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
