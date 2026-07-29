import Link from "next/link";

function TerminalBlock() {
  return (
    <div className="w-full font-mono text-xs border border-[#e9e9e7] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-[#080808] overflow-hidden shadow-2xl transition-colors duration-200">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e9e9e7] dark:border-[#1A1A1A] bg-[#f7f7f5] dark:bg-[#0d0d0d] transition-colors duration-200">
        <div className="w-2.5 h-2.5 rounded-full bg-[#d4d4d4] dark:bg-[#2a2a2a]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#d4d4d4] dark:bg-[#2a2a2a]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#d4d4d4] dark:bg-[#2a2a2a]" />
        <span className="ml-3 text-[#37352f]/60 dark:text-neutral-600 text-[10px] tracking-widest uppercase">
          POST /api/v1/conversations
        </span>
      </div>

      {/* Request body */}
      <div className="px-5 py-4 border-b border-[#e9e9e7] dark:border-[#1A1A1A] transition-colors duration-200">
        <div className="text-[#37352f]/60 dark:text-neutral-600 mb-2 text-[10px] uppercase tracking-widest">Request</div>
        <pre className="leading-6 text-[11px]">
          <span className="text-neutral-500">{"{"}</span>{"\n"}
          <span className="text-neutral-500">{"  "}</span>
          <span className="text-sky-400">&quot;tenant_id&quot;</span>
          <span className="text-neutral-500">: </span>
          <span className="text-amber-300">&quot;acme-corp&quot;</span>
          <span className="text-neutral-500">,</span>{"\n"}
          <span className="text-neutral-500">{"  "}</span>
          <span className="text-sky-400">&quot;visitor_id&quot;</span>
          <span className="text-neutral-500">: </span>
          <span className="text-amber-300">&quot;vis_8f3k2&quot;</span>
          <span className="text-neutral-500">,</span>{"\n"}
          <span className="text-neutral-500">{"  "}</span>
          <span className="text-sky-400">&quot;message&quot;</span>
          <span className="text-neutral-500">: </span>
          <span className="text-amber-300">&quot;Need help with billing&quot;</span>
          <span className="text-neutral-500">,</span>{"\n"}
          <span className="text-neutral-500">{"  "}</span>
          <span className="text-sky-400">&quot;channel&quot;</span>
          <span className="text-neutral-500">: </span>
          <span className="text-amber-300">&quot;widget&quot;</span>{"\n"}
          <span className="text-neutral-500">{"}"}</span>
        </pre>
      </div>

      {/* Response */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-[#37352f]/60 dark:text-neutral-600">Response</span>
          <span className="text-emerald-500 text-[10px] font-medium">201 Created</span>
        </div>
        <pre className="leading-6 text-[11px]">
          <span className="text-neutral-500">{"{"}</span>{"\n"}
          <span className="text-neutral-500">{"  "}</span>
          <span className="text-sky-400">&quot;id&quot;</span>
          <span className="text-neutral-500">: </span>
          <span className="text-amber-300">&quot;conv_7xp1n&quot;</span>
          <span className="text-neutral-500">,</span>{"\n"}
          <span className="text-neutral-500">{"  "}</span>
          <span className="text-sky-400">&quot;status&quot;</span>
          <span className="text-neutral-500">: </span>
          <span className="text-amber-300">&quot;open&quot;</span>
          <span className="text-neutral-500">,</span>{"\n"}
          <span className="text-neutral-500">{"  "}</span>
          <span className="text-sky-400">&quot;assigned_to&quot;</span>
          <span className="text-neutral-500">: </span>
          <span className="text-neutral-500">null</span>
          <span className="text-neutral-500">,</span>{"\n"}
          <span className="text-neutral-500">{"  "}</span>
          <span className="text-sky-400">&quot;created_at&quot;</span>
          <span className="text-neutral-500">: </span>
          <span className="text-amber-300">&quot;2026-07-27T20:06:00Z&quot;</span>{"\n"}
          <span className="text-neutral-500">{"}"}</span>
        </pre>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen max-w-6xl px-8 mx-auto flex items-center">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center w-full pt-28 pb-16 lg:py-32">
        {/* Left — text content */}
        <div className="flex flex-col">
          {/* Status Pill */}
          <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-500 border border-emerald-500/20 rounded-full px-3 py-1 w-fit mb-8 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            PARROT · V1
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#37352f] dark:text-[#ffffff] font-bold tracking-tighter leading-[1.05] mb-6">
            Multi-tenant customer support. Minus the bloat.
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-[#37352f]/60 dark:text-[#9b9b9b] max-w-md mb-12">
            A completely isolated live chat and ticketing engine for your tenant.
            Built for scale.
          </p>

          {/* Primary CTA */}
          <Link
            href="/auth/signup"
            className="bg-[#37352f] dark:bg-white text-white dark:text-black px-8 py-4 rounded-md text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center w-fit"
          >
            Deploy workspace →
          </Link>
        </div>

        {/* Right — terminal block */}
        <div className="hidden lg:block">
          <TerminalBlock />
        </div>
      </div>
    </section>
  );
}
