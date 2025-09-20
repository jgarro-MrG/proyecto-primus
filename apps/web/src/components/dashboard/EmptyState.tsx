// apps/web/src/components/dashboard/EmptyState.tsx
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export const EmptyState = ({ icon: Icon, title, description, className }: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-gray-50/50 text-gray-500", className)}>
      <Icon className="h-12 w-12 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
      <p className="mt-2 text-sm">{description}</p>
    </div>
  );
};