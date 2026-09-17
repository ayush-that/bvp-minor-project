import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Bell } from "lucide-react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { MOCK_USER } from "@/utils/mockUser";

export function Newsletter() {
  // Using mock user for development
  const user = MOCK_USER;
  const [email, setEmail] = useState(user?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    // bev - basic email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setMessage("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("newsletter")
        .insert([{ email: email.trim().toLowerCase() }]);

      if (error) {
        if (error.code === "23505") {
          // ucv - unique constraint violation, already subscribed
          setMessage("You're already subscribed!");
        } else {
          setMessage("Something went wrong. Please try again.");
          console.error("Error subscribing to newsletter:", error);
        }
        return;
      }

      // success
      setMessage("🎉 You've been subscribed to the newsletter!");
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Newsletter | Pathfinder</title>
        <meta
          name="description"
          content="Subscribe to the Pathfinder newsletter for startup updates"
        />
      </Helmet>

      <div className="w-full">
        <div className="max-w-6xl mx-auto px-4">
          <PageHeader
            icon={Bell}
            title="Newsletter"
            description="Stay updated with the latest opportunities"
          />

          {/* split layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* left: subscription form */}
            <Card className="rounded-none w-full transition-shadow border border-foreground/10">
              <CardContent className="pt-6 flex flex-col items-center text-center space-y-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Mail className="h-7 w-7 text-primary mr-2" />
                    <h2 className="text-xl font-semibold text-foreground">
                      Subscribe to the Pathfinder Newsletter
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Stay up to date on startups which are hiring and fun to work at
                  </p>
                </div>

                <form onSubmit={handleSubscribe} className="space-y-4 w-full">
                  <div className="flex flex-col gap-3">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full">
                      <Mail className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Subscribing..." : "Subscribe"}
                    </Button>
                  </div>

                  {message && (
                    <div
                      className={`text-center text-sm p-3 rounded-md ${
                        message.includes("🎉")
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      }`}>
                      {message}
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* right: benefits */}
            <div className="w-full">
              <Card className="rounded-none border border-foreground/10">
                <CardContent className="pt-6 space-y-4">
                  <h2 className="text-xl font-semibold">
                    What you'll get
                  </h2>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                    <li>Weekly updates on startups that are actively hiring</li>
                    <li>Insights into company culture and work environment</li>
                    <li>Early access to new opportunities before they're widely posted</li>
                    <li>Tips and resources for landing your dream startup job</li>
                  </ul>

                  <h3 className="text-base font-medium mt-4">
                    Why subscribe?
                  </h3>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                    <li>Curated content, no spam</li>
                    <li>Delivered straight to your inbox</li>
                    <li>Unsubscribe anytime</li>
                  </ul>

                  <div className="text-sm text-muted-foreground">
                    Join thousands of students finding their dream startup roles. 🦦
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

