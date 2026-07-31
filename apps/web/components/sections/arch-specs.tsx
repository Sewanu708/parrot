const specs = [
  {
    label: "WIDGET",
    value: "Vanilla JS · Zero dependencies",
  },
  {
    label: "DASHBOARD",
    value: "Next.js App Router",
  },
  {
    label: "BACKEND",
    value: "Express · TypeScript",
  },
  {
    label: "DATABASE",
    value: "PostgreSQL · Drizzle ORM",
  },
];

export default function ArchSpecs() {
  const leftCol = specs.slice(0, 2);
  const rightCol = specs.slice(2, 4);

  return (
    <section className="border-t border-[#e9e9e7] dark:border-[#333333] w-full max-w-6xl mx-auto mt-24 transition-colors duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Left Column */}
        <div>
          {leftCol.map((spec) => (
            <SpecRow key={spec.label} {...spec} />
          ))}
        </div>

        {/* Right Column */}
        <div className="md:border-l md:border-[#e9e9e7] dark:md:border-[#333333] transition-colors duration-200">
          {rightCol.map((spec) => (
            <SpecRow key={spec.label} {...spec} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="group border-b border-[#e9e9e7] dark:border-[#333333] py-6 px-8 flex flex-col sm:flex-row gap-4 sm:gap-12 hover:bg-[#f7f7f5] dark:hover:bg-[#252525] transition-colors duration-200 cursor-default">
      <span className="font-mono text-xs text-[#37352f]/60 dark:text-[#9b9b9b] uppercase tracking-widest w-28 shrink-0 pt-0.5 group-hover:text-[#37352f] dark:group-hover:text-[#ffffff] transition-colors duration-200">
        {label}
      </span>
      <span className="text-sm text-[#37352f] dark:text-[#ffffff] font-medium">{value}</span>
    </div>
  );
}
