import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { motion } from "framer-motion";

export function CTA() {
  return (
    <div className="relative isolate mt-32 px-6 py-32 sm:mt-56 sm:py-40 lg:px-8 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-background/50"></div>
      <div className="absolute -top-80 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-background/20 to-purple-500/20 blur-3xl"></div>
      <div className="absolute -bottom-80 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-400/20 to-background/20 blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative mx-auto max-w-2xl">
        {/* Glass card effect */}
        <div className="backdrop-blur-xl bg-background/30 rounded-3xl p-8 shadow-2xl border border-background/20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              Ready to transform your hiring process?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Join thousands of companies using Pathfinder to streamline their
              candidate assessment process.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/sign-up">
                <Button
                  size="lg"
                  className="text-base relative group overflow-hidden bg-gradient-to-r from-background to-primary hover:from-primary hover:to-background transition-all duration-300">
                  {/* Glow effect */}
                  <div className="absolute inset-0 w-full h-full bg-background/30 group-hover:scale-150 transition-transform duration-500 rounded-full blur-xl"></div>
                  <span className="relative z-10">Get started for free</span>
                </Button>
              </Link>
              <Link
                to="/sign-in?auto=1&redirectTo=%2Fapp"
                className="text-sm font-semibold leading-6 text-gray-700 hover:text-white transition-colors">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Decorative elements */}
      <div
        className="absolute inset-x-0 -z-10 transform-gpu overflow-hidden blur-3xl"
        aria-hidden="true">
        <div
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-background to-purple-500 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
    </div>
  );
}
