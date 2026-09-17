import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [waitlistCount, setWaitlistCount] = useState(9); // Default fallback
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current waitlist count on component mount
  useEffect(() => {
    fetchWaitlistCount();
  }, []);

  const fetchWaitlistCount = async () => {
    try {
      // use db func to bypass rls for count only
      const { data, error } = await supabase.rpc("get_waitlist_count");

      if (error) {
        console.error("Error fetching waitlist count:", error);
        return;
      }

      setWaitlistCount(data || 0);
    } catch (error) {
      console.error("Error fetching waitlist count:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setMessage("Please enter a valid email address");
      return;
    }

    // Check for rate limiting (simple client-side check)
    const lastSubmission = localStorage.getItem("waitlist_last_submission");
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
        .from("waitlist")
        .insert([{ email: email.trim().toLowerCase() }]);

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          setMessage("You're already on the waitlist!");
        } else {
          setMessage("Something went wrong. Please try again.");
          console.error("Error adding to waitlist:", error);
        }
        return;
      }

      // Success - update local count and show success message
      localStorage.setItem("waitlist_last_submission", now.toString());
      setWaitlistCount((prev) => prev + 1);
      setEmail("");
      setMessage("🎉 You've been added to the waitlist!");
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 bg-[rgba(255,255,255,0.85)] border border-gray-400">
      <div className="space-y-3">
        <div className="text-center">
          <h3 className="text-lg font-bold text-black mb-2">
            Join the Waitlist
          </h3>
          <div className="flex items-center justify-center space-x-1 mb-2">
            <div className="flex -space-x-1">
              <div className="w-6 h-6 rounded-full border overflow-hidden bg-gray-100">
                <img
                  src="https://pbs.twimg.com/profile_images/1945482646617751552/UPNli3BV_400x400.jpg"
                  alt="User avatar"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <div className="w-6 h-6 rounded-full border overflow-hidden bg-gray-100">
                <img
                  src="https://pbs.twimg.com/profile_images/1921031631676071936/EnBiY25v_400x400.jpg"
                  alt="User avatar"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <div className="w-6 h-6 rounded-full border border-black bg-background flex items-center justify-center">
                <span className="text-xs font-bold text-black">
                  {isLoading ? "..." : `+${waitlistCount + 7}`}
                </span>
              </div>
            </div>
            <span className="text-xs text-black ml-2">
              {isLoading ? "loading..." : "already joined"}
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
            className="flex-1 h-9 border-gray-400 text-black placeholder:text-gray-500 focus:ring-black focus:border-black text-sm"
          />
          <Button
            className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 border text-sm"
            type="submit"
            disabled={isSubmitting}>
            {isSubmitting ? "..." : "Join"}
          </Button>
        </form>

        {message && (
          <div
            className={`text-center text-sm ${
              message.includes("🎉") ? "text-green-600" : "text-red-600"
            }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
