import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import { FloatingIcons } from "./FloatingIcons";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
// import Newsletter from "./newsletter";

export function Hero() {
  // Authentication removed
  const [userCount, setUserCount] = useState<number>(0);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_user_count");
        if (mounted) setUserCount(error ? 0 : Number(data ?? 0));
      } catch (e) {
        if (mounted) setUserCount(0);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <div className="flex flex-col bg-gradient-to-b from-background to-background noscrollbar py-2">
      <div className="relative flex items-center justify-center isolate min-h-[calc(100svh-4rem)] noscrollbar">
        {/* Background pattern */}
        <div className="absolute inset-0">
          {/* dotted pattern using two radial gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--foreground)/0.08)_1px,transparent_1.5px)] bg-[size:20px_20px]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 px-4 sm:px-6 text-center py-8">
          {/* Glassmorphism Pill */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex mb-6 sm:mb-8 backdrop-blur-xl bg-foreground/5 rounded-md px-3 sm:px-4 py-1.5 border border-foreground/10"
          >
            <span className="text-xs sm:text-sm font-medium text-foreground">
              AI • Internships • Growth
            </span>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-3xl mx-auto relative"
          >
            {/* Floating Icons */}
            <FloatingIcons />

            <h1 className="sm:text-6xl text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-foreground/90 mb-6 sm:mb-8">
              Your Ultimate One-Stop Platform to{" "}
              <span className="font-playfair italic">Crack Internships</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
              Discover top startups, send personalized cold emails, and land
              your dream internship with AI-powered tools.
            </p>
            <div className="flex flex-row items-center justify-center gap-4">
              {/* Emphasized user count */}{" "}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="inline-flex mb-6 sm:mb-8 backdrop-blur-xl bg-foreground/5 rounded-md px-3 sm:px-4 py-1.5 border border-foreground/10"
              >
                <span className="text-xs sm:text-sm font-medium text-foreground">
                  {userCount.toLocaleString()}+ students
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="inline-flex mb-6 sm:mb-8 backdrop-blur-xl bg-foreground/5 rounded-md px-3 sm:px-4 py-1.5 border border-foreground/10"
              >
                <span className="text-xs sm:text-sm font-medium text-foreground">
                  220+ startups
                </span>
              </motion.div>
            </div>
            <Link to="/app">
              <Button
                size="lg"
                className="text-base relative group overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-all duration-300 rounded-md px-6 sm:px-8"
              >
                {/* glow fx */}
                <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:scale-150 transition-transform duration-500 rounded-md blur-xl"></div>
                <span className="relative z-10 text-white">Get Started</span>
              </Button>
            </Link>
          </motion.div>

          {/* waitlist and newsletter signups */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 sm:mt-16  gap-6 w-full max-w-4xl mx-auto"
          >
            {/* <Newsletter /> */}
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div
          className="absolute inset-x-0 -z-10 transform-gpu overflow-hidden blur-3xl"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-primary/60 opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
