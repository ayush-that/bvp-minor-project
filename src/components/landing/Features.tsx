import { Brain, FileText, Zap } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    name: "AI-Powered Analysis",
    description:
      "Leverage GPT to automatically analyze and validate skills from resumes with high accuracy.",
    icon: Brain,
  },
  {
    name: "Bulk Processing",
    description:
      "Upload multiple resumes at once and process them in parallel for maximum efficiency.",
    icon: FileText,
  },
  {
    name: "Custom Templates",
    description:
      "Create and customize assessment templates to match your specific requirements.",
    icon: Zap,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Features() {
  return (
    <div className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-background/50"></div>
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-purple-500/10 to-background/10 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-white">
            Faster hiring decisions
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 sm:text-4xl">
            Everything you need to validate skills
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Our AI-powered platform helps you make better hiring decisions by
            automatically analyzing and validating candidate skills.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <motion.div
                key={feature.name}
                variants={item}
                className="relative backdrop-blur-xl bg-background/30 rounded-3xl p-8 shadow-xl border border-background/20 hover:shadow-2xl hover:bg-background/40 transition-all duration-300">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/10 backdrop-blur-2xl">
                    <feature.icon
                      className="h-6 w-6 text-background"
                      aria-hidden="true"
                    />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
                {/* Hover glow effect */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
              </motion.div>
            ))}
          </dl>
        </motion.div>
      </div>
    </div>
  );
}
