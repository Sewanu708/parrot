"use client";

import Link from "next/link";
import { useState } from "react";

const GitHubIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const XIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const socials = [
  { label: "GitHub", href: "https://github.com", Icon: GitHubIcon },
  { label: "Twitter / X", href: "https://x.com", Icon: XIcon },
];

export default function Footer() {
  const [hovered, setHovered] = useState(false);

  return (
    <footer
      className="relative w-full overflow-hidden border-t border-[#1A1A1A] mt-24 bg-black"
      style={{ minHeight: "clamp(280px, 40vw, 420px)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Giant Background Text */}
      <span
        className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none select-none
          text-[18vw] font-black tracking-tighter text-transparent whitespace-nowrap leading-none"
        style={{
          WebkitTextStroke: `1px ${hovered ? "#ffffff" : "#2e2e2e"}`,
          transition: "all 0.6s ease",
        }}
        aria-hidden="true"
      >
        PARROT
      </span>

      {/* Foreground Links — pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col md:flex-row justify-between items-center gap-4 px-6 sm:px-8 pb-8 md:pb-10">
        {/* Copyright */}
        <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
          © PARROT · 2026 · Privacy
        </p>

        {/* Social Buttons */}
        <div className="flex items-center gap-3">
          {socials.map(({ label, href, Icon }) => (
            <Link
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="border border-[#333333] rounded-md p-2.5 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors flex items-center justify-center"
            >
              <Icon />
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
