import { Clock, Construction } from "lucide-react";
import { Card } from "./card";

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export function ComingSoon({
  title = "Coming Soon",
  description = "We're working hard to bring you this feature. Stay tuned!",
}: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="p-12 text-center max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background/10">
            <Construction className="h-10 w-10 text-foreground animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-muted-foreground mb-6">{description}</p>
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-2" />
          This feature will be available soon
        </div>
      </Card>
    </div>
  );
}
