import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-background/10 text-foreground hover:bg-background/20",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success: "bg-green-100 text-green-700 hover:bg-green-200",
        warning: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
        danger: "bg-red-100 text-red-700 hover:bg-red-200",
        outline:
          "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
