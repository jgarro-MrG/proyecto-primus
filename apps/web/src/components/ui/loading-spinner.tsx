// apps/web/src/components/ui/loading-spinner.tsx
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner = ({ className }: LoadingSpinnerProps) => {
  return (
    <Loader2 className={cn("animate-spin text-primary", className)} />
  );
};