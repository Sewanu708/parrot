import Link from "next/link";

export default function AuthLeftPanel() {
  return (
    <div
      className="hidden lg:flex relative w-[480px] shrink-0 overflow-hidden flex-col justify-between p-10"
      style={{
        backgroundImage:
          "url('/Speech_bubbles_and_envelope_icons_202607272104%20(1).jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Logo */}
      <Link
        href="/"
        className="relative z-10 flex items-center gap-2 font-bold text-xl tracking-tighter text-white w-fit"
      >
        parrot.
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </Link>

      {/* Bottom label */}
      <p className="relative z-10 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
        PARROT · V1 
      </p>
    </div>
  );
}
