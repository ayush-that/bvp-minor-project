import { cn } from "@/lib/utils";
import { Button } from "./button";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("pb-8 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {Icon && (
            <div className="p-2 bg-background/10 rounded-none">
              <Icon className="h-6 w-6 text-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center space-x-2">{children}</div>
        )}
      </div>
    </div>
  );
}

interface PageHeaderActionProps {
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
}

export function PageHeaderAction({
  icon: Icon,
  children,
  onClick,
}: PageHeaderActionProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 space-x-2 text-muted-foreground hover:text-foreground">
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Button>
  );
}
