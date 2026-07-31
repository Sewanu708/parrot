const steps = [
  {
    num: "01",
    title: "Create your workspace",
    desc: "Sign up and spin up a fully isolated tenant in seconds. Each workspace gets its own members, roles, and conversation history — completely separated from every other tenant.",
  },
  {
    num: "02",
    title: "Embed the widget",
    desc: "Drop a single <script> tag on your customer site. The widget loads inside a Shadow DOM — zero CSS conflicts, zero configuration. Just a tenant ID.",
  },
  {
    num: "03",
    title: "Route every conversation",
    desc: "Your agents handle live chat and tickets from a unified dashboard. Assign, resolve, and track — all scoped to your tenant, in one place.",
  },
];

export default function HowItWorks() {
  return (
    <section className="w-full max-w-6xl mx-auto px-8 mt-24">
      {/* Section label */}
      <div className="font-mono text-[10px] text-[#37352f]/60 dark:text-[#9b9b9b] uppercase tracking-widest mb-12">
        How it works
      </div>

      {/* Steps grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[#e9e9e7] dark:border-[#333333] transition-colors duration-200">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className={`group py-10 transition-colors duration-200 ${
              i < steps.length - 1
                ? "border-b border-[#e9e9e7] dark:border-[#333333] md:border-b-0"
                : ""
            } ${i > 0 ? "md:border-l md:border-[#e9e9e7] dark:md:border-[#333333] md:pl-8" : ""}`}
          >
            <span className="font-mono text-[10px] text-[#37352f]/40 dark:text-[#777777] uppercase tracking-widest group-hover:text-[#37352f] dark:group-hover:text-[#ffffff] transition-colors duration-200">
              {step.num}
            </span>
            <h3 className="text-[#37352f] dark:text-[#ffffff] font-semibold text-base mt-6 mb-3 transition-colors duration-200">
              {step.title}
            </h3>
            <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b] leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
