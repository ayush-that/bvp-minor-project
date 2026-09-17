import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmailTemplate } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/utils/supabase";

interface CustomEmailTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate;
  onTemplateUsed?: () => void;
}

export function CustomEmailTemplateModal({
  open,
  onOpenChange,
  template,
  onTemplateUsed,
}: CustomEmailTemplateModalProps) {
  // increment template usage count
  const incrementUsageCount = async (templateId: string) => {
    try {
      // first get current usage count, then increment
      const { data: currentTemplate, error: fetchError } = await supabase
        .from("email_templates")
        .select("usage_count")
        .eq("id", templateId)
        .single();

      if (fetchError) {
        console.error("Error fetching current usage count:", fetchError);
        return;
      }

      const newUsageCount = (currentTemplate?.usage_count || 0) + 1;

      const { error } = await supabase
        .from("email_templates")
        .update({ usage_count: newUsageCount })
        .eq("id", templateId);

      if (error) {
        console.error("Error incrementing usage count:", error);
      } else {
        // refresh parent component data
        onTemplateUsed?.();
      }
    } catch (error) {
      console.error("Error incrementing usage count:", error);
    }
  };

  const handleCopyTemplate = async () => {
    navigator.clipboard.writeText(template.template_content);
    await incrementUsageCount(template.id);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            customize email template
          </DialogTitle>
          <DialogClose onClose={() => onOpenChange(false)} />
        </DialogHeader>

        <Card>
          <CardContent className="pt-2">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">
              {template.template_content}
            </pre>
          </CardContent>
        </Card>

        <DialogFooter>
          <div className="flex flex-col items-center sm:items-end gap-1">
            <div className="flex flex-row gap-5">
              <Button variant="outline" onClick={handleCopyTemplate}>
                copy email
              </Button>
              <Button
                onClick={() => {
                  window.location.assign("/app/startups");
                }}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                find startups
              </Button>
            </div>
            <div className="text-xs text-muted-foreground text-center sm:text-right mt-1">
              Please review and personalize the email before using.
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
