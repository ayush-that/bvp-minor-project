import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [newsletterCount, setNewsletterCount] = useState(9); // default fallback
  const [isLoading, setIsLoading] = useState(true);

  // fetch current newsletter count on component mount
  useEffect(() => {
    fetchNewsletterCount();
  }, []);

  const fetchNewsletterCount = async () => {
    try {
      // use db func to bypass rls for count only
      const { data, error } = await supabase.rpc("get_newsletter_count");

      if (error) {
        console.error("Error fetching newsletter count:", error);
        return;
      }

      setNewsletterCount(data || 0);
    } catch (error) {
      console.error("Error fetching newsletter count:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // basic email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setMessage("Please enter a valid email address");
      return;
    }

    // chk for rate limiting (simple client-side check)
    const lastSubmission = localStorage.getItem("newsletter_last_submission");
    const now = Date.now();
    if (lastSubmission && now - parseInt(lastSubmission) < 60000) {
      // 1 minute cooldown
      setMessage("Please wait before submitting again");
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
          // unique constraint violation
          setMessage("You're already subscribed!");
        } else {
          setMessage("Something went wrong. Please try again.");
          console.error("Error adding to newsletter:", error);
        }
        return;
      }

      // success - update local count and show success msg
      localStorage.setItem("newsletter_last_submission", now.toString());
      setNewsletterCount((prev) => prev + 1);
      setEmail("");
      setMessage("🎉 You've been subscribed to the newsletter!");
    } catch (error) {
      console.error("Error adding to newsletter:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 bg-white/85 dark:bg-gray-900/85 border border-gray-400 dark:border-gray-600 backdrop-blur-sm max-h-[40vh] overflow-y-auto">
      <div className="space-y-3">
        <div className="text-center">
          <h3 className="text-lg font-bold text-black dark:text-white mb-2">
            Subscribe to Our Newsletter
          </h3>
          <div className="flex items-center justify-center space-x-1 mb-2">
            <div className="flex -space-x-1">
              <div className="w-6 h-6 rounded-full border overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src="/aahan.png"
                  alt="User avatar"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <div className="w-6 h-6 rounded-full border overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src="/pustak.png"
                  alt="User avatar"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <div className="w-6 h-6 rounded-full border border-black dark:border-white bg-background flex items-center justify-center">
                <span className="text-[6px] font-bold text-black dark:text-white">
                  {isLoading ? "..." : `+${newsletterCount}`}
                </span>
              </div>
            </div>
            <span className="text-xs text-black dark:text-white ml-2">
              {isLoading ? "loading..." : "already subscribed"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 h-9 border-gray-400 dark:border-gray-600 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white text-sm bg-white dark:bg-gray-800"
          />
          <Button
            className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 border text-sm"
            type="submit"
            disabled={isSubmitting}>
            {isSubmitting ? "..." : "Subscribe"}
          </Button>
        </form>

        {message && (
          <div
            className={`text-center text-sm ${
              message.includes("🎉")
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
